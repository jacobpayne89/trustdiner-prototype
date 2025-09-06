import { NextRequest, NextResponse } from 'next/server';

// Mock reviews database for prototype
const mockReviews: any[] = [
  // No reviews initially - empty array
];

export async function GET(
  request: NextRequest,
  { params }: { params: { establishmentId: string; userId: string } }
) {
  try {
    const { establishmentId, userId } = params;
    
    console.log(`🔍 Fetching reviews for establishment ${establishmentId}, user ${userId}`);

    // Filter reviews for this establishment and user
    const userReviews = mockReviews.filter(
      review => review.establishment_id === establishmentId && review.user_id === parseInt(userId)
    );

    return NextResponse.json({
      success: true,
      data: userReviews
    });

  } catch (error) {
    console.error('❌ Reviews fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
