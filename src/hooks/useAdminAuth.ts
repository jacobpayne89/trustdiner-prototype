import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/app/context/AuthContext';
import { isAdmin } from '@/lib/admin';

export function useAdminAuth() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 useAdminAuth useEffect triggered:', { user: !!user, loading, userType: user?.userType, email: user?.email });
    
    if (loading) {
      console.log('🔍 Still loading auth, waiting...');
      return;
    }
    
    if (!user) {
      console.log('🔧 No user found, denying admin access');
      setIsAdminUser(false);
      setIsCheckingAdmin(false);
      setError('Authentication required. Please log in.');
      return;
    }

    // For your account, always grant admin access immediately
    if (user.email === 'jacobpayne89@gmail.com') {
      console.log('✅ Admin access granted for Jacob (jacobpayne89@gmail.com)');
      setIsAdminUser(true);
      setIsCheckingAdmin(false);
      setError(null);
      return;
    }

    // For any user with admin userType, grant access
    if (user.userType === 'admin') {
      console.log('✅ Admin access granted for user with admin userType:', user.email);
      setIsAdminUser(true);
      setIsCheckingAdmin(false);
      setError(null);
      return;
    }

    // For all other users, deny access
    console.log('❌ Access denied for user:', user.email, '(userType:', user.userType + ')');
    setIsAdminUser(false);
    setIsCheckingAdmin(false);
    setError('Access denied. Admin privileges required.');
    setTimeout(() => router.push('/'), 3000);
  }, [user, loading, router]);

  return {
    isAdmin: isAdminUser,
    isAdminUser,
    isCheckingAdmin,
    loading: isCheckingAdmin,
    error,
  };
}

