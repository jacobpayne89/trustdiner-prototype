'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { getScoreColor, getAverageAllergenRating, getScoreLabel } from '@/utils/allergenHelpers';
import { ALLERGENS } from '@/types';

interface Chain {
	id: number;
	name: string;
	slug: string;
	description?: string;
	logo_url?: string | null;
	local_logo_path?: string | null;
	featured_image_path?: string | null;
	sample_image?: string | null;
	website_url?: string | null;
	category?: string | null;
	created_at: string;
	updated_at: string;
	location_count?: number;
	avg_rating?: number | null;
	tags?: string[];
	allergen_scores?: Record<string, unknown> | null;
}

export default function ChainsPage() {
	const [chains, setChains] = useState<Chain[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const calculateChainRating = (chain: Chain) => {
		if (!chain.allergen_scores || typeof chain.allergen_scores !== 'object') {
			return null;
		}
		
		return getAverageAllergenRating(chain.allergen_scores as Record<string, number>, chain.allergen_scores as Record<string, number>);
	};

	useEffect(() => {
		const fetchChains = async () => {
			try {
				const response = await fetch('/api/chains');
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const data: Chain[] = await response.json();
				
				// Sort chains by rating (good to bad)
				const sortedChains = Array.isArray(data) ? data.sort((a, b) => {
					const aRating = calculateChainRating(a) || 0;
					const bRating = calculateChainRating(b) || 0;
					
					// Sort by rating descending (highest first)
					if (bRating !== aRating) {
						return bRating - aRating;
					}
					
					// If ratings are equal, sort alphabetically
					return a.name.localeCompare(b.name);
				}) : [];
				
				setChains(sortedChains);
			} catch (err) {
				setError('Failed to load restaurant chains');
			} finally {
				setLoading(false);
			}
		};
		fetchChains();
	}, []);

	const getChainImageUrl = (chain: Chain) => {
		if (chain.featured_image_path) {
			return chain.featured_image_path;
		}
		if (chain.local_logo_path) {
			if (chain.local_logo_path.startsWith('/images/')) return chain.local_logo_path;
			return `/images/chains/${chain.local_logo_path.split('/').pop()}`;
		}
		if (chain.logo_url) return chain.logo_url;
		// Fallback: use a representative local establishment image if available
		if (chain.sample_image) return chain.sample_image;
		return null;
	};

	const getTagClasses = (tag: string) => {
		// Use the same tag styling system as EstablishmentCard
		if (tag === 'Chain') {
			return 'bg-orange-100 text-orange-800';
		}
		if (tag.includes('Restaurant') || tag.includes('Food')) {
			return 'bg-blue-100 text-blue-800';
		}
		if (tag.includes('Coffee') || tag.includes('Cafe')) {
			return 'bg-amber-100 text-amber-800';
		}
		if (tag.includes('Fast')) {
			return 'bg-red-100 text-red-800';
		}
		// Default purple for other tags
		return 'bg-purple-100 text-purple-800';
	};

	const handleChainClick = (chain: Chain) => {
		router.push(`/?chain=${chain.slug}`);
	};

	if (loading) {
		return (
			<div className="flex flex-col h-screen bg-gray-50">
				<Header />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01745F] mx-auto"></div>
						<p className="mt-2 text-gray-600">Loading restaurant chains...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col h-screen bg-gray-50">
				<Header />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center text-red-600">
						<p>{error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-gray-50">
			<Header />

			<main className="flex-1 container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Chains</h1>
						<p className="text-gray-600">Explore different restaurant chains and see how they compare on allergen safety.</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{chains.map((chain) => {
							const imageUrl = getChainImageUrl(chain);
							const chainRating = calculateChainRating(chain);
							const allergenScores = chain.allergen_scores as Record<string, number> || {};
							
							return (
								<div
									key={chain.id}
									onClick={() => handleChainClick(chain)}
									className="bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg w-full focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 border border-gray-200 hover:border-gray-300 hover:scale-105"
								>
									{/* Two-column layout: Left side (image & info) + Right side (allergen scores) */}
									<div className="flex gap-4">
										{/* Left Half - Image and Basic Info */}
										<div className="flex-1">
											{/* Main Image with Rating Overlay */}
											<div className="relative w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
												{imageUrl ? (
													<img
														src={imageUrl}
														alt={`${chain.name} image`}
														className={chain.featured_image_path ? "w-full h-full object-cover" : "w-full h-full object-contain p-2"}
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.style.display = 'none';
															if (target.parentElement) target.parentElement.innerHTML = '<span class="text-gray-400 text-3xl">📷</span>';
														}}
													/>
												) : (
													<span className="text-gray-400 text-3xl">📷</span>
												)}
												
												{/* TrustDiner Rating Overlay */}
												{chainRating && chainRating > 0 && (
													<div className="absolute top-3 left-3">
														<div
															className="px-3 py-1 rounded-full text-white text-xs flex items-center justify-center shadow-md"
															style={{ backgroundColor: getScoreColor(chainRating) }}
														>
															<span className="font-bold">{chainRating.toFixed(1)}</span>
															<span className="ml-1 font-normal">{getScoreLabel(chainRating)}</span>
														</div>
													</div>
												)}
											</div>

											{/* Chain Name with Logo */}
											<h3 className="font-bold text-gray-900 text-lg mb-2 truncate flex items-center gap-2">
												{(chain.local_logo_path || chain.logo_url) && (
													<img
														src={chain.local_logo_path || chain.logo_url || ''}
														alt={`${chain.name} logo`}
														className="h-5 w-5 object-contain rounded"
														onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
													/>
												)}
												<span className="truncate">{chain.name}</span>
											</h3>
											
											{/* Location Count */}
											<p className="text-sm text-gray-600 mb-3">
												{chain.location_count} location{chain.location_count !== 1 ? 's' : ''}
											</p>
											
											{/* Category Tags - matching list view style */}
											{chain.tags && chain.tags.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{chain.tags.slice(0, 3).map((tag, index) => (
														<span 
															key={index} 
															className={`inline-block text-xs px-2 py-1 rounded font-medium ${getTagClasses(tag)}`}
														>
															{tag}
														</span>
													))}
													{chain.tags.length > 3 && (
														<span className="text-xs text-gray-500 self-center">
															+{chain.tags.length - 3} more
														</span>
													)}
												</div>
											)}
										</div>

										{/* Right Half - Allergen Scores */}
										<div className="flex-1">
											<h4 className="text-sm font-medium text-gray-700 mb-3">Allergen Safety Scores</h4>
											<div className="grid grid-cols-2 gap-2">
												{ALLERGENS.map((allergen) => {
													const score = allergenScores[allergen];
													const hasScore = score && score > 0;
													
													return (
														<div
															key={allergen}
															className={`px-2 py-1 rounded text-xs text-center font-medium border ${
																hasScore 
																	? 'text-white border-transparent' 
																	: 'text-gray-400 bg-gray-100 border-gray-200'
															}`}
															style={hasScore ? { backgroundColor: getScoreColor(score) } : {}}
														>
															<div className="capitalize">{allergen}</div>
															{hasScore && (
																<div className="text-xs font-bold mt-0.5">
																	{score.toFixed(1)}
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{chains.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-500">No restaurant chains found.</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}