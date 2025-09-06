import { NextRequest, NextResponse } from 'next/server';

// Mock user database for prototype
const mockUsers = [
  {
    id: 1,
    email: 'jacobpayne89@gmail.com',
    password: 'admin123', // In real app, this would be hashed
    first_name: 'Jacob',
    last_name: 'Payne',
    display_name: 'Jacob Payne',
    user_type: 'admin',
    allergies: ['gluten', 'dairy'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'demo@trustdiner.com',
    password: 'demo123',
    first_name: 'Demo',
    last_name: 'User',
    display_name: 'Demo User',
    user_type: 'user',
    allergies: ['nuts', 'shellfish'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    email: 'test@example.com',
    password: 'test123',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User',
    user_type: 'user',
    allergies: ['eggs', 'soy'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user in mock database
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password (in real app, use bcrypt.compare)
    if (user.password !== password) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate mock JWT token (in real app, use proper JWT signing)
    const token = `mock-jwt-${user.id}-${Date.now()}`;

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Login successful for:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
