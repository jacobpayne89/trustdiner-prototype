import { NextRequest, NextResponse } from 'next/server';

// Sample data for prototype
const sampleEstablishments = [
  {
    id: "1",
    name: "The Allergen-Free Kitchen",
    address: "123 Safe Street, London SW1A 1AA",
    latitude: 51.5074,
    longitude: -0.1278,
    phone: "+44 20 7123 4567",
    website: "https://allergen-free-kitchen.com",
    cuisine_type: "Modern British",
    price_range: "££",
    image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    averageAllergenScores: {
      gluten: 5,
      dairy: 4,
      nuts: 5,
      shellfish: 3,
      eggs: 4,
      soy: 4,
      fish: 3,
      sesame: 4,
      sulfites: 3,
      celery: 4,
      mustard: 4,
      lupin: 5,
      molluscs: 3,
      peanuts: 5
    },
    averageRating: 4.8,
    reviewCount: 127
  },
  {
    id: "2",
    name: "Safe Haven Bistro",
    address: "456 Allergy Ave, Manchester M1 2AB",
    latitude: 53.4808,
    longitude: -2.2426,
    phone: "+44 161 234 5678",
    website: "https://safehavenbistro.co.uk",
    cuisine_type: "Italian",
    price_range: "£££",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    averageAllergenScores: {
      gluten: 4,
      dairy: 3,
      nuts: 4,
      shellfish: 4,
      eggs: 3,
      soy: 4,
      fish: 4,
      sesame: 3,
      sulfites: 4,
      celery: 3,
      mustard: 4,
      lupin: 4,
      molluscs: 4,
      peanuts: 4
    },
    averageRating: 4.5,
    reviewCount: 89
  },
  {
    id: "3",
    name: "Clean Plate Café",
    address: "789 Health St, Birmingham B1 3CD",
    latitude: 52.4862,
    longitude: -1.8904,
    phone: "+44 121 345 6789",
    website: "https://cleanplatecafe.com",
    cuisine_type: "Healthy",
    price_range: "££",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
    averageAllergenScores: {
      gluten: 5,
      dairy: 5,
      nuts: 3,
      shellfish: 5,
      eggs: 4,
      soy: 3,
      fish: 5,
      sesame: 4,
      sulfites: 4,
      celery: 4,
      mustard: 4,
      lupin: 5,
      molluscs: 5,
      peanuts: 3
    },
    averageRating: 4.7,
    reviewCount: 156
  },
  {
    id: "4",
    name: "Pure Food Co",
    address: "321 Organic Rd, Leeds LS1 4EF",
    latitude: 53.8008,
    longitude: -1.5491,
    phone: "+44 113 456 7890",
    website: "https://purefoodco.uk",
    cuisine_type: "Organic",
    price_range: "£££",
    image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
    averageAllergenScores: {
      gluten: 4,
      dairy: 4,
      nuts: 2,
      shellfish: 5,
      eggs: 3,
      soy: 2,
      fish: 4,
      sesame: 3,
      sulfites: 4,
      celery: 4,
      mustard: 4,
      lupin: 4,
      molluscs: 5,
      peanuts: 2
    },
    averageRating: 4.3,
    reviewCount: 73
  },
  {
    id: "5",
    name: "Mindful Meals",
    address: "654 Conscious Crescent, Bristol BS1 5GH",
    latitude: 51.4545,
    longitude: -2.5879,
    phone: "+44 117 567 8901",
    website: "https://mindfulmeals.co.uk",
    cuisine_type: "Vegetarian",
    price_range: "££",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    averageAllergenScores: {
      gluten: 3,
      dairy: 2,
      nuts: 1,
      shellfish: 5,
      eggs: 2,
      soy: 1,
      fish: 5,
      sesame: 2,
      sulfites: 3,
      celery: 3,
      mustard: 3,
      lupin: 4,
      molluscs: 5,
      peanuts: 1
    },
    averageRating: 4.6,
    reviewCount: 94
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Prototype API: Serving sample establishments data');
    
    // Return the sample data
    return NextResponse.json({
      success: true,
      data: sampleEstablishments
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
