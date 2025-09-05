"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Import core user type
import type { User as CoreUser } from '../../../shared/types/core';

// User authentication context - extends core type for frontend compatibility
type User = CoreUser & {
  uid: string; // For backward compatibility
  displayName: string; // Camel case alias for display_name
  firstName?: string; // Camel case alias for first_name
  lastName?: string; // Camel case alias for last_name
  userType: string; // Camel case alias for user_type
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with null user - check localStorage on mount
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with loading false since we have initial user

  useEffect(() => {
    // Check localStorage for existing user session on mount
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined' && isMounted) {
          // Check if user was previously logged in
          const storedUser = localStorage.getItem('trustdiner_user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              console.log('🔄 Auth: Found stored user, validating session...');
              
              // Validate the session by checking if user still exists in backend
              const base = process.env.NODE_ENV === 'development'
                ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
                : (process.env.NEXT_PUBLIC_API_URL || '');
              
              const response = await fetch(`${base.replace(/\/$/, '')}/api/users/${userData.id}`);
              if (response.ok && isMounted) {
                const freshUserData = await response.json();
                console.log('✅ Auth: Session valid, restoring user:', freshUserData);
                
                const validUser = {
                  id: freshUserData.id,
                  uid: freshUserData.id.toString(),
                  email: freshUserData.email,
                  displayName: freshUserData.displayName,
                  firstName: freshUserData.firstName,
                  lastName: freshUserData.lastName,
                  userType: freshUserData.userType,
                  allergies: freshUserData.allergies || []
                };
                
                setUser(validUser);
                localStorage.setItem('trustdiner_user', JSON.stringify(validUser));
              } else {
                console.log('⚠️ Auth: Session invalid, clearing stored user');
                localStorage.removeItem('trustdiner_user');
                setUser(null);
              }
            } catch (parseError) {
              console.log('⚠️ Auth: Invalid stored user data, clearing');
              localStorage.removeItem('trustdiner_user');
              setUser(null);
            }
          } else {
            console.log('🔍 Auth: No stored user found, starting with null');
            setUser(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.log('⚠️ Auth: Error initializing auth, starting fresh:', error);
          setUser(null);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Auth: Attempting login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Convert backend user format to frontend format
      const userData: User = {
        id: data.user.id,
        uid: data.user.id.toString(), // For backward compatibility
        email: data.user.email,
        displayName: data.user.displayName,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        userType: data.user.userType || 'standard',
        allergies: data.user.allergies || []
      };

      // Store user in state and localStorage
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('trustdiner_user', JSON.stringify(userData));
      }
      
      console.log('✅ Auth: Login successful for:', userData.displayName);
      
    } catch (error) {
      console.error('❌ Auth: Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔐 Auth: Logging out...');
      
      // Call logout endpoint
      const base = process.env.NODE_ENV === 'development'
        ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
        : (process.env.NEXT_PUBLIC_API_URL || '');
      await fetch(`${base.replace(/\/$/, '')}/api/auth/logout`, {
        method: 'POST',
      });
      
      // Clear user state and localStorage
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trustdiner_user');
      }
      
      console.log('✅ Auth: Logout successful');
      
    } catch (error) {
      console.error('❌ Auth: Logout error:', error);
      // Clear local state even if backend call fails
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trustdiner_user');
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isLoggedIn: !!user,
  };

  // Debug the context value being provided
  console.log('🔧 AuthContext:', { 
    hasUser: !!user, 
    loading, 
    isLoggedIn: !!user, 
    userId: user?.id,
    userName: user?.displayName
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}