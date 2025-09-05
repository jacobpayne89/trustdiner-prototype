// Local Admin Utilities - Development Only
// For AWS production, this should be replaced with proper AWS Cognito/IAM

export async function isAdmin(userId?: string | number): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // Check if user is admin via the users API
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      console.log(`❌ Admin check: User ${userId} not found (${response.status})`);
      return false;
    }
    
    const user = await response.json();
    const isAdminUser = user.userType === 'admin';
    
    console.log(`🔐 Admin check for user ${userId}:`, isAdminUser ? 'ADMIN' : 'NOT ADMIN');
    console.log(`🔐 User data:`, { email: user.email, userType: user.userType });
    return isAdminUser;
    
  } catch (error) {
    console.error('❌ Admin check failed:', error);
    return false;
  }
}

export async function checkAdminPermissions(): Promise<{ isAdmin: boolean; error?: string }> {
  try {
    const adminStatus = await isAdmin();
    return { isAdmin: adminStatus };
  } catch (error) {
    console.error('Admin permission check failed:', error);
    return { isAdmin: false, error: 'Failed to verify admin permissions' };
  }
}

// For development - simple placeholder functions
export const adminUtils = {
  isAdmin,
  checkAdminPermissions
};