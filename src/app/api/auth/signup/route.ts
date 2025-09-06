import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, displayName, userType } = await request.json();

    console.log('📝 Signup attempt for:', email);

    // Validate input
    if (!email || !password || !firstName || !lastName || !displayName) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email already exists (in real app, check database)
    const existingEmails = [
      'jacobpayne89@gmail.com',
      'demo@trustdiner.com', 
      'test@example.com'
    ];
    
    if (existingEmails.includes(email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create new user (in real app, save to database with hashed password)
    const newUser = {
      id: Date.now(), // Simple ID generation for prototype
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      user_type: userType || 'user',
      allergies: [], // Empty allergies array for new users
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Generate mock JWT token
    const token = `mock-jwt-${newUser.id}-${Date.now()}`;

    console.log('✅ Signup successful for:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
