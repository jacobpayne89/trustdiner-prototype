"use client";

import { useState, useEffect } from 'react';
import { AllergenIcon, type AllergenKey } from '@/app/components/icons';
import { ALLERGEN_DISPLAY_NAMES, sortAllergens, type AllergenKey } from '@/types';
import Link from 'next/link';

// Extend window object for debounce tracking
declare global {
  interface Window {
    lastButtonClick?: { [key: string]: number };
  }
}

// Review questions from original
const REVIEW_QUESTIONS = [
  { id: 'allergen_menu', question: 'Was there an allergen menu?' },
  { id: 'staff_confident', question: 'Did staff seem confident handling allergies?' },
  { id: 'staff_notify_kitchen', question: 'Did staff notify the kitchen about allergies?' },
  { id: 'kitchen_adjust', question: 'Did the kitchen adjust food for allergies?' }
];

// Helper function for score colors (from original)
function getScoreColor(score: number): string {
  if (score >= 5) return "#22C55E"; // green (5 - Excellent)
  if (score >= 4) return "#84CC16"; // lime (4 - Good)
  if (score >= 3) return "#EAB308"; // yellow (3 - Okay)
  if (score >= 2) return "#F97316"; // orange (2 - Avoid)
  return "#EF4444"; // red (1 - Unsafe)
}

// Helper function for allergen icon keys
function getAllergenIconKey(allergen: string): string {
  return allergen.toLowerCase();
}

interface PlaceCardReviewFormProps {
  cardPlace: {
    id: string;
    name: string;
    chainName?: string | null;
    chainLogoUrl?: string | null;
  };
  user: any;
  userAllergies: string[];
  tempAllergenScores: Record<string, Record<string, number>>;
  setTempAllergenScores: (value: any) => void;
  tempAllergenComments: Record<string, string>;
  setTempAllergenComments: (value: any) => void;
  tempYesNoAnswers: Record<string, Record<string, boolean>>;
  setTempYesNoAnswers: (value: any) => void;

  editingReview?: any;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function PlaceCardReviewForm({
  cardPlace,
  user,
  userAllergies,
  tempAllergenScores,
  setTempAllergenScores,
  tempAllergenComments,
  setTempAllergenComments,
  tempYesNoAnswers,
  setTempYesNoAnswers,
  editingReview,
  onCancel,
  onSubmit
}: PlaceCardReviewFormProps) {
  // Form state is managed via props from usePlaceCardState

  // Debug user allergies
  useEffect(() => {
    console.log('🔧 PlaceCardReviewForm userAllergies:', userAllergies);
    console.log('🔧 PlaceCardReviewForm userAllergies length:', userAllergies?.length);
    console.log('🔧 PlaceCardReviewForm userAllergies contents:', userAllergies?.map(a => `"${a}"`).join(', '));
    console.log('🔧 PlaceCardReviewForm user:', user);
  }, [userAllergies, user]);

  // Pre-populate form when editingReview is provided
  useEffect(() => {
    console.log('🔧 PlaceCardReviewForm useEffect triggered, editingReview:', !!editingReview);
    if (editingReview) {
      console.log('🔧 PRE-POPULATING form with editingReview:', editingReview);
      console.log('🔧 EDIT REVIEW FIELDS:', Object.keys(editingReview));
      console.log('🔧 FULL REVIEW DATA:', JSON.stringify(editingReview, null, 2));
      console.log('🔧 allergenScores in editingReview:', editingReview.allergenScores);
      console.log('🔧 Current tempAllergenScores before setting:', tempAllergenScores);
      console.log('🔧 Current tempAllergenComments before setting:', tempAllergenComments);
      console.log('🔧 Current tempYesNoAnswers before setting:', tempYesNoAnswers);
      
      // Pre-populate allergen scores - check both camelCase and snake_case
      const allergenScores = editingReview.allergenScores || editingReview.allergen_scores;
      console.log('🔧 allergenScores in editingReview:', editingReview.allergenScores);
      console.log('🔧 allergen_scores in editingReview:', editingReview.allergen_scores);
      
      if (allergenScores && typeof allergenScores === 'object' && Object.keys(allergenScores).length > 0) {
        console.log('🔧 Setting allergen scores from editingReview:', allergenScores);
        const newScores = { [cardPlace.id]: allergenScores };
        console.log('🔧 New scores to set:', newScores);
        setTempAllergenScores(newScores);
      } else {
        console.log('🔧 No allergen scores found in editingReview');
      }
      
      // Pre-populate comment - check all possible field names
      const commentFields = ['generalComment', 'general_comment', 'notes', 'comment', 'review_text'];
      let comment = null;
      for (const field of commentFields) {
        if (editingReview[field] !== undefined) {
          comment = editingReview[field] || ''; // Handle null values as empty string
          console.log('🔧 Found comment in field:', field, 'value:', comment);
          break;
        }
      }
      if (comment !== null) {
        console.log('🔧 Setting comment from editingReview:', comment);
        const newComments = { [cardPlace.id]: comment };
        console.log('🔧 New comments to set:', newComments);
        setTempAllergenComments(newComments);
      } else {
        console.log('🔧 No comment found in editingReview, checked fields:', commentFields);
      }
      
      // Pre-populate yes/no answers - prioritize new yesNoAnswers field
      const yesNoAnswers: Record<string, boolean | null> = {};
      
      // First, check if we have the new yes_no_answers field (API returns snake_case)
      const yesNoAnswersData = editingReview.yes_no_answers || editingReview.yesNoAnswers;
      console.log('🔧 Checking yes_no_answers field. Type:', typeof yesNoAnswersData, 'Value:', yesNoAnswersData);
      console.log('🔧 Object.keys(yesNoAnswersData):', yesNoAnswersData ? Object.keys(yesNoAnswersData) : 'N/A');
      
      if (yesNoAnswersData && typeof yesNoAnswersData === 'object' && Object.keys(yesNoAnswersData).length > 0) {
        console.log('🔧 Found yes_no_answers field with data:', yesNoAnswersData);
        // Map the backend field names to frontend field names
        yesNoAnswers.allergen_menu = yesNoAnswersData.allergen_menu !== undefined ? yesNoAnswersData.allergen_menu : null;
        yesNoAnswers.staff_confident = yesNoAnswersData.staff_confident !== undefined ? yesNoAnswersData.staff_confident : null;
        yesNoAnswers.staff_notify_kitchen = yesNoAnswersData.staff_notify_kitchen !== undefined ? yesNoAnswersData.staff_notify_kitchen : null;
        yesNoAnswers.kitchen_adjust = yesNoAnswersData.kitchen_adjust !== undefined ? yesNoAnswersData.kitchen_adjust : null;
        
        // Also load kitchen-free questions (kitchen_free_gluten, kitchen_free_nuts, etc.)
        Object.keys(yesNoAnswersData).forEach(key => {
          if (key.startsWith('kitchen_free_')) {
            yesNoAnswers[key] = yesNoAnswersData[key] !== undefined ? yesNoAnswersData[key] : null;
            console.log('🔧 Found kitchen-free question:', key, 'value:', yesNoAnswersData[key]);
          }
        });
      } else {
        console.log('🔧 No yesNoAnswers field found, checking legacy fields');
        
        // Fallback to legacy fields for backward compatibility
        // Check for separate preparation area -> staff_notify_kitchen
        const sepPrepFields = ['separatePreparationArea', 'separate_preparation_area'];
        for (const field of sepPrepFields) {
          if (editingReview[field] !== undefined) {
            yesNoAnswers.staff_notify_kitchen = editingReview[field];
            console.log('🔧 Found separate prep in field:', field, 'value:', editingReview[field]);
            break;
          }
        }
        
        // Check for staff allergy trained -> staff_confident
        const staffAwareFields = ['staffAllergyTrained', 'staff_allergy_trained'];
        for (const field of staffAwareFields) {
          if (editingReview[field] !== undefined) {
            yesNoAnswers.staff_confident = editingReview[field];
            console.log('🔧 Found staff aware in field:', field, 'value:', editingReview[field]);
            break;
          }
        }
      }
      
      if (Object.keys(yesNoAnswers).length > 0) {
        console.log('🔧 Setting yes/no answers from editingReview:', yesNoAnswers);
        const newYesNoAnswers = { [cardPlace.id]: yesNoAnswers };
        console.log('🔧 New yes/no answers to set:', newYesNoAnswers);
        setTempYesNoAnswers(newYesNoAnswers);
      } else {
        console.log('🔧 No yes/no answers found in editingReview');
      }

    }
  }, [editingReview, cardPlace.id]);

  return (
    <div className="space-y-6">
      {/* Cancel button */}
      <button
        type="button"
        className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        onClick={onCancel}
      >
        Cancel
      </button>

      {/* Chain/Place Review Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {cardPlace.chainLogoUrl && (
            <img 
              src={cardPlace.chainLogoUrl} 
              alt={`${cardPlace.chainName} logo`}
              className="w-6 h-6 rounded object-contain flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <p className="text-sm font-medium text-blue-900">
              {cardPlace.chainName ? `Reviewing: ${cardPlace.chainName} (Chain)` : `Reviewing: ${cardPlace.name}`}
            </p>
            {cardPlace.chainName && (
              <p className="text-xs text-blue-700 mt-1">
                Your review will apply to all {cardPlace.chainName} locations
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Allergy Score Section */}
      <div className="bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergy Score</h3>
        <p className="text-sm text-gray-600 mb-6">How safe would you score this place for people with your allergy?</p>
        {/* User's allergens scoring */}
        {userAllergies && userAllergies.length > 0 ? (
          <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 lg:block lg:space-y-6 lg:gap-0">
            {sortAllergens(userAllergies).map((allergen) => {
              const userScore = tempAllergenScores?.[cardPlace.id]?.[allergen];
              return (
                <div key={allergen} className="bg-white rounded-lg border border-gray-200">
                  {/* Header bar */}
                  <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex items-center gap-2">
                    <AllergenIcon 
                      allergen={getAllergenIconKey(allergen) as AllergenKey} 
                      size={20} 
                      className="text-gray-700" 
                    />
                    <span className="font-bold text-gray-900">{ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen}</span>
                  </div>
                  
                  {/* Rating scale */}
                  <div className="p-4">
                    <div className="flex justify-between px-4">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <div key={score} className="flex flex-col items-center">
                          <button
                            type="button"
                            className={`w-10 h-10 rounded-full text-black font-bold text-sm transition-all hover:scale-110 flex items-center justify-center ${
                              userScore === score ? 'ring-2 ring-black' : ''
                            }`}
                            style={{
                              backgroundColor: getScoreColor(score),
                              border: userScore === score ? '2px solid #000' : '1px solid #ccc',
                              minWidth: "40px",
                              minHeight: "40px",
                              maxWidth: "40px",
                              maxHeight: "40px",
                              overflow: "hidden",
                              fontSize: "12px",
                              lineHeight: "1",
                            }}
                            onClick={() => {
                              console.log('Setting allergen score:', allergen, score, 'for venue:', cardPlace.id);
                              setTempAllergenScores((prev: any) => {
                                const currentScores = prev[cardPlace.id] || {};
                                const newScores = { ...currentScores };
                                
                                if (userScore === score) {
                                  // Deselect if clicking the same score
                                  delete newScores[allergen];
                                } else {
                                  // Select the new score
                                  newScores[allergen] = score;
                                }
                                
                                const newState = {
                                  ...prev,
                                  [cardPlace.id]: newScores,
                                };
                                console.log('New temp allergen scores state:', newState);
                                return newState;
                              });
                            }}
                          >
                            {score}
                          </button>
                          <span className="text-xs text-gray-600 mt-1">
                            {score === 1 ? 'Avoid' : 
                             score === 2 ? 'Caution' : 
                             score === 3 ? 'Moderate' : 
                             score === 4 ? 'Good' : 
                             'Excellent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">You haven't set any allergies in your profile yet.</p>
            <p className="text-sm">
              <Link href="/profile" className="text-blue-600 hover:underline">
                Go to your profile
              </Link> to add your allergies and then you can score restaurants.
            </p>
          </div>
        )}
      </div>

      {/* Comment Section */}
      <div className="bg-white">
        <textarea
          className="w-full border border-gray-300 rounded p-3 text-sm resize-none"
          rows={3}
          placeholder="Add a comment (optional)"
          value={tempAllergenComments[cardPlace.id] || ''}
          onChange={(e) => {
            console.log('Setting comment:', e.target.value, 'for venue:', cardPlace.id);
            setTempAllergenComments((prev: any) => {
              const newState = {
                ...prev,
                [cardPlace.id]: e.target.value,
              };
              console.log('New temp comments state:', newState);
              return newState;
            });
          }}
        />
      </div>

      {/* Allergen Handling Section */}
      <div className="bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergy Handling (optional)</h3>
        
        <div className="space-y-4">
          {REVIEW_QUESTIONS.map((question) => {
            const userAnswer = tempYesNoAnswers[cardPlace.id]?.[question.id];
            console.log(`🔧 FORM RENDER - Question: ${question.id}, Answer: ${userAnswer}, tempYesNoAnswers:`, tempYesNoAnswers[cardPlace.id]);
            return (
              <div key={question.id} className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{question.question}</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      userAnswer === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      console.log(`🔧 YES button clicked for ${question.id}, current answer: ${userAnswer}`);
                      
                      // Prevent rapid duplicate clicks
                      const now = Date.now();
                      const lastClickKey = `${question.id}_yes_${cardPlace.id}`;
                      if (window.lastButtonClick && window.lastButtonClick[lastClickKey] && now - window.lastButtonClick[lastClickKey] < 100) {
                        console.log(`🔧 Ignoring duplicate click for ${question.id} (too fast)`);
                        return;
                      }
                      if (!window.lastButtonClick) window.lastButtonClick = {};
                      window.lastButtonClick[lastClickKey] = now;
                      
                      setTempYesNoAnswers((prev: any) => {
                        const currentAnswers = prev[cardPlace.id] || {};
                        const newAnswers = { ...currentAnswers };
                        
                        if (userAnswer === true) {
                          // Deselect if already true
                          delete newAnswers[question.id];
                          console.log(`🔧 Deselecting ${question.id}`);
                        } else {
                          // Select true
                          newAnswers[question.id] = true;
                          console.log(`🔧 Selecting ${question.id} as true`);
                        }
                        
                        const result = {
                          ...prev,
                          [cardPlace.id]: newAnswers,
                        };
                        
                        console.log(`🔧 Updated state for ${cardPlace.id}:`, result[cardPlace.id]);
                        return result;
                      });
                    }}
                  >
                    <span className="text-lg">👍</span>
                    <span>Yes</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      userAnswer === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      console.log(`🔧 NO button clicked for ${question.id}, current answer: ${userAnswer}`);
                      
                      // Prevent rapid duplicate clicks
                      const now = Date.now();
                      const lastClickKey = `${question.id}_no_${cardPlace.id}`;
                      if (window.lastButtonClick && window.lastButtonClick[lastClickKey] && now - window.lastButtonClick[lastClickKey] < 100) {
                        console.log(`🔧 Ignoring duplicate click for ${question.id} (too fast)`);
                        return;
                      }
                      if (!window.lastButtonClick) window.lastButtonClick = {};
                      window.lastButtonClick[lastClickKey] = now;
                      
                      setTempYesNoAnswers((prev: any) => {
                        const currentAnswers = prev[cardPlace.id] || {};
                        const newAnswers = { ...currentAnswers };
                        
                        if (userAnswer === false) {
                          // Deselect if already false
                          delete newAnswers[question.id];
                          console.log(`🔧 Deselecting ${question.id}`);
                        } else {
                          // Select false
                          newAnswers[question.id] = false;
                          console.log(`🔧 Selecting ${question.id} as false`);
                        }
                        
                        const result = {
                          ...prev,
                          [cardPlace.id]: newAnswers,
                        };
                        
                        console.log(`🔧 Updated state for ${cardPlace.id}:`, result[cardPlace.id]);
                        return result;
                      });
                    }}
                  >
                    <span className="text-lg">👎</span>
                    <span>No</span>
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Individual kitchen free questions for each user allergen */}
          {userAllergies && userAllergies.length > 0 && userAllergies.map((allergen) => {
            const questionId = 'kitchen_free_' + allergen;
            const userAnswer = tempYesNoAnswers[cardPlace.id]?.[questionId];
            console.log(`🔧 KITCHEN_FREE - Rendering question for allergen: ${allergen}, questionId: ${questionId}, userAnswer: ${userAnswer}`);
            return (
              <div key={questionId} className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Was the kitchen <span className="font-semibold text-blue-600">{ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen}</span> free?
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      userAnswer === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setTempYesNoAnswers((prev: any) => {
                        const currentAnswers = prev[cardPlace.id] || {};
                        const newAnswers = { ...currentAnswers };
                        
                        if (userAnswer === true) {
                          // Deselect if already true
                          delete newAnswers[questionId];
                        } else {
                          // Select true
                          newAnswers[questionId] = true;
                        }
                        
                        return {
                          ...prev,
                          [cardPlace.id]: newAnswers,
                        };
                      });
                    }}
                  >
                    <span className="text-lg">👍</span>
                    <span>Yes</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      userAnswer === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setTempYesNoAnswers((prev: any) => {
                        const currentAnswers = prev[cardPlace.id] || {};
                        const newAnswers = { ...currentAnswers };
                        
                        if (userAnswer === false) {
                          // Deselect if already false
                          delete newAnswers[questionId];
                        } else {
                          // Select false
                          newAnswers[questionId] = false;
                        }
                        
                        return {
                          ...prev,
                          [cardPlace.id]: newAnswers,
                        };
                      });
                    }}
                  >
                    <span className="text-lg">👎</span>
                    <span>No</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="button"
        className="w-full py-3 bg-blue-500 text-black rounded-lg font-medium hover:bg-blue-600 transition-colors"
        onClick={onSubmit}
      >
        Submit your review
      </button>
    </div>
  );
} 