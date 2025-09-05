"use client";

import { useState, useEffect } from 'react';
import { Review } from '../../../shared/types/core';
import { AllergenIcon, type AllergenKey } from '../icons';
import { getAllergenIconKey } from '@/utils/allergenHelpers';
import { ALLERGEN_DISPLAY_NAMES, type AllergenKey } from '@/types';

interface ChainData {
  chainId: number;
  chainName: string;
  locations: any[];
}

interface AllergenHandlingStatsProps {
  reviews?: Review[];
  placeId?: string;
  chainData?: ChainData;
}

interface YesNoStat {
  question: string;
  yesCount: number;
  noCount: number;
  total: number;
  yesPercentage: number;
  noPercentage: number;
  hasData: boolean;
}

interface AllergenFreeStat {
  allergen: string;
  count: number;
  icon: string;
}

export default function AllergenHandlingStats({ reviews: propReviews, placeId, chainData }: AllergenHandlingStatsProps) {
  const [reviews, setReviews] = useState<Review[]>(propReviews || []);
  const [loading, setLoading] = useState(false);
  


  // Fetch reviews if placeId is provided but reviews are not
  useEffect(() => {
    if ((placeId || chainData) && !propReviews) {
      const fetchReviews = async () => {
        setLoading(true);
        try {
          let allReviews: Review[] = [];
          
          if (chainData) {
            // For chains, fetch all reviews using the chain endpoint
            console.log(`🔗 Fetching chain reviews for ${chainData.chainName} (chain ID: ${chainData.chainId})`);
            
            try {
              const response = await fetch(`/api/reviews/chains/${chainData.chainId}/reviews`);
              if (response.ok) {
                const data = await response.json();
                allReviews = data.reviews || [];
                console.log(`🔗 Found ${allReviews.length} total reviews for ${chainData.chainName} chain`);
              } else {
                console.warn(`Failed to fetch chain reviews: ${response.status} ${response.statusText}`);
              }
            } catch (error) {
              console.warn(`Failed to fetch reviews for chain ${chainData.chainId}:`, error);
            }
          } else if (placeId) {
            // For individual locations
            const response = await fetch(`/api/reviews/establishments/${placeId}/reviews`);
            if (response.ok) {
              const data = await response.json();
              allReviews = data.reviews || [];
            }
          }
          
          setReviews(allReviews);
        } catch (error) {
          console.error('Failed to fetch reviews for AllergenHandlingStats:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchReviews();
    } else if (propReviews) {
      setReviews(propReviews);
    }
  }, [placeId, chainData?.chainId, propReviews]); // Use chainData.chainId instead of entire chainData object
  // Define all possible questions - these will always be shown
  const getAllQuestions = () => ({
    allergenMenu: {
      question: "Was there an allergen menu?",
      yes: 0,
      no: 0
    },
    staffConfident: {
      question: "Did staff seem confident handling allergies?",
      yes: 0,
      no: 0
    },
    staffNotifyKitchen: {
      question: "Did staff notify the kitchen about allergies?",
      yes: 0,
      no: 0
    },
    kitchenAdjust: {
      question: "Did the kitchen adjust food for allergies?",
      yes: 0,
      no: 0
    }
  });

  // Calculate yes/no statistics
  const calculateYesNoStats = (): YesNoStat[] => {
    const stats = getAllQuestions();

    // Dynamically add kitchen-free questions based on what's found in reviews
    const kitchenFreeQuestions: { [key: string]: string } = {};

    // Count responses from all reviews
    reviews.forEach((review) => {
      // Check if review has the new yesNoAnswers field (camelCase or snake_case)
      const yesNoAnswers = (review as any).yes_no_answers || review.yesNoAnswers;
      if (yesNoAnswers && typeof yesNoAnswers === 'object') {

        // Use new structured data
        const answers = yesNoAnswers;
        
        // Process all answers in the yesNoAnswers object
        Object.keys(answers).forEach(key => {
          const value = answers[key];
          
          // Handle the 4 main questions
          if (key === 'allergen_menu') {
            if (value === true) stats.allergenMenu.yes++;
            else if (value === false) stats.allergenMenu.no++;
          } else if (key === 'staff_confident') {
            if (value === true) stats.staffConfident.yes++;
            else if (value === false) stats.staffConfident.no++;
          } else if (key === 'staff_notify_kitchen') {
            if (value === true) stats.staffNotifyKitchen.yes++;
            else if (value === false) stats.staffNotifyKitchen.no++;
          } else if (key === 'kitchen_adjust') {
            if (value === true) stats.kitchenAdjust.yes++;
            else if (value === false) stats.kitchenAdjust.no++;
          }
          // Skip kitchen-free questions - they are handled separately as tags
          else if (key.startsWith('kitchen_free_')) {
            // Kitchen-free questions are displayed as tags, not percentage bars
            // This data is processed by calculateAllergenFreeStats() instead
          }
        });
      } else {
        // Process actual database fields

        
        // Staff confident (from staff_allergy_trained)
        const staffTrained = (review as any).staff_allergy_trained || review.staffAllergyTrained;
        if (staffTrained === true) {
          stats.staffConfident.yes++;
        } else if (staffTrained === false) {
          stats.staffConfident.no++;
        }

        // Staff notify kitchen (from separate_preparation_area) 
        const separatePrep = (review as any).separate_preparation_area || review.separatePreparationArea;
        if (separatePrep === true) {
          stats.staffNotifyKitchen.yes++;
        } else if (separatePrep === false) {
          stats.staffNotifyKitchen.no++;
        }

        // For now, we only have data for these two questions
        // allergenMenu and kitchenAdjust would need additional database fields
      }
    });

    // Convert to YesNoStat format - always return all questions, even with 0 data
    return Object.entries(stats)
      .map(([key, data]) => {
        const total = data.yes + data.no;
        
        return {
          question: data.question,
          yesCount: data.yes,
          noCount: data.no,
          total,
          yesPercentage: total > 0 ? Math.round((data.yes / total) * 100) : 0,
          noPercentage: total > 0 ? Math.round((data.no / total) * 100) : 0,
          hasData: total > 0
        };
      });
  };

  // Calculate allergen-free kitchen statistics
  const calculateAllergenFreeStats = (): AllergenFreeStat[] => {
    const allergenCounts: { [key: string]: number } = {};
    const allergenIcons: { [key: string]: string } = {
      milk: '🥛',
      dairy: '🥛',
      eggs: '🥚',
      'tree_nuts': '🌰',
      nuts: '🥜',
      peanuts: '🥜',
      gluten: '🌾',
      soy: '🫘',
      soybeans: '🫘',
      fish: '🐟',
      shellfish: '🦐',
      sesame: '🫰',
      crustaceans: '🦐',
      molluscs: '🐚',
      celery: '🥬',
      lupin: '🌱',
      mustard: '🌭',
      sulfites: '🍷'
    };

    // Count "Yes" answers for kitchen-free questions from yesNoAnswers
    reviews.forEach(review => {
      const yesNoAnswers = (review as any).yes_no_answers || review.yesNoAnswers;
      if (yesNoAnswers && typeof yesNoAnswers === 'object') {
        Object.keys(yesNoAnswers).forEach(key => {
          if (key.startsWith('kitchen_free_') && yesNoAnswers[key] === true) {
            const allergen = key.replace('kitchen_free_', '');
            allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;

          }
        });
      }
    });

    return Object.entries(allergenCounts)
      .map(([allergen, count]) => ({
        allergen: ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen.charAt(0).toUpperCase() + allergen.slice(1),
        count,
        icon: allergenIcons[allergen] || '🚫'
      }))
      .sort((a, b) => b.count - a.count);
  };

  const yesNoStats = calculateYesNoStats();
  const allergenFreeStats = calculateAllergenFreeStats();

  // Component will render with data or placeholder message

  // Always render the section, even if no data (show placeholder message)
  // if (yesNoStats.length === 0 && allergenFreeStats.length === 0 && reviews.length === 0) {
  //   return null;
  // }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Allergy Handling</h4>
      
      {loading && (
        <div className="text-sm text-gray-500 italic mb-4">
          Loading allergy handling data...
        </div>
      )}
      
      {/* Yes/No Questions with Percentage Bars - Always show all questions */}
      {!loading && (
        <div className="space-y-3 mb-4">
          {yesNoStats.map((stat, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700">{stat.question}</span>
              </div>
              
              {/* Percentage Bar */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex h-6 bg-gray-200 rounded-full overflow-hidden">
                  {stat.hasData ? (
                    <>
                      {/* Yes portion */}
                      {stat.yesPercentage > 0 && (
                        <div 
                          className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${stat.yesPercentage}%` }}
                        >
                          {stat.yesPercentage > 15 && (
                            <span className="flex items-center space-x-1">
                              <span>👍</span>
                              <span>Yes {stat.yesCount}</span>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* No portion */}
                      {stat.noPercentage > 0 && (
                        <div 
                          className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${stat.noPercentage}%` }}
                        >
                          {stat.noPercentage > 15 && (
                            <span className="flex items-center space-x-1">
                              <span>{stat.noCount} No</span>
                              <span>👎</span>
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Grey bar when no data */
                    <div className="w-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                      No data yet - be the first to answer!
                    </div>
                  )}
                </div>
                
                {/* Small labels for narrow bars when there's data */}
                {stat.hasData && stat.yesPercentage <= 15 && stat.yesPercentage > 0 && (
                  <span className="text-xs text-green-600 font-medium">👍 Yes {stat.yesCount}</span>
                )}
                {stat.hasData && stat.noPercentage <= 15 && stat.noPercentage > 0 && (
                  <span className="text-xs text-red-600 font-medium">{stat.noCount} No 👎</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Allergen-Free Kitchen Tags */}
      {allergenFreeStats.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Was the kitchen free of any allergens?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergenFreeStats.map((stat, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                title={`Kitchen was ${stat.allergen.toLowerCase()} free`}
              >
                <AllergenIcon 
                  allergen={getAllergenIconKey(stat.allergen.toLowerCase()) as AllergenKey} 
                  size={16} 
                  className="mr-1" 
                />
                <span>{stat.allergen}</span>
                <span className="ml-1 bg-green-200 text-green-900 px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] h-5 flex items-center justify-center">
                  {stat.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
