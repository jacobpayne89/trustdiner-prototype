import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";

export interface UserProfileData {
  // Core profile state
  allergens: string[] | null;
  email: string | null;
  userType: string | null;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  
  // Edit mode state
  editMode: boolean;
  editAllergens: string[];
  editUserType: string;
  editDisplayName: string;
  editFirstName: string;
  editLastName: string;
  editAvatarUrl: string;
  
  // Loading and status state
  loadingProfile: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  uploadingAvatar: boolean;
  
  // Actions
  setEditMode: (editMode: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setUploadingAvatar: (uploading: boolean) => void;
  setEditAvatarUrl: (url: string) => void;
  setEditFirstName: (name: string) => void;
  setEditLastName: (name: string) => void;
  setEditDisplayName: (name: string) => void;
  setEditUserType: (type: string) => void;
  handleCheckboxChange: (allergen: string) => void;
  handleSave: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const USER_TYPES = [
  {
    value: "allergy_sufferer",
    label: "I suffer with food allergies",
    shortLabel: "Allergy Sufferer"
  },
  {
    value: "parent",
    label: "I am the parent of a child with food allergies",
    shortLabel: "Parent/Guardian"
  },
];

export { USER_TYPES };

export function useUserProfile(): UserProfileData {
  const { user, loading } = useContext(AuthContext);
  
  // Core profile state
  const [allergens, setAllergens] = useState<string[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editAllergens, setEditAllergens] = useState<string[]>([]);
  const [editUserType, setEditUserType] = useState<string>("");
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editFirstName, setEditFirstName] = useState<string>("");
  const [editLastName, setEditLastName] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  
  // Loading and status state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Helper function to get surname initial
  const getSurnameInitial = (lastName: string): string => {
    if (!lastName) return '';
    // Handle multi-word surnames (e.g., "Van Der Berg" -> "V")
    const trimmedLastName = lastName.trim();
    return trimmedLastName.charAt(0).toUpperCase();
  };

  // Helper function to generate display name
  const generateDisplayName = (first: string, last: string): string => {
    if (!first) return '';
    if (!last) return first.trim();
    
    const firstNameTrimmed = first.trim();
    const surnameInitial = getSurnameInitial(last);
    return `${firstNameTrimmed} ${surnameInitial}.`;
  };

  // Auto-populate display name when first name or last name changes in edit mode
  useEffect(() => {
    if (editMode) {
      const autoDisplayName = generateDisplayName(editFirstName, editLastName);
      
      // Only auto-populate if user hasn't customized the display name
      // Check if current display name matches the auto-generated pattern
      const currentAutoDisplayName = generateDisplayName(editFirstName, editLastName);
      
      if (!editDisplayName || editDisplayName === currentAutoDisplayName || editDisplayName === editFirstName.trim()) {
        setEditDisplayName(autoDisplayName);
      }
    }
  }, [editFirstName, editLastName, editMode, editDisplayName]);

  // Fetch user profile data
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    setLoadingProfile(true);
    
    const fetchProfile = async () => {
      try {
        if (!isMounted) return;
        
        console.log('📋 Fetching profile for user ID:', user.id);
        
        const response = await fetch(`/api/users/${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const userData = await response.json();
        
        if (!isMounted) return; // Check again after async operation
        
        console.log('✅ Profile data loaded:', userData);
        
        // Set profile data from API response
        setAllergens(userData.allergies ? convertBackendAllergensToKeys(userData.allergies) : []);
        setEmail(userData.email || user.email || "");
        setUserType(userData.userType || "");
        setDisplayName(userData.displayName || "");
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setAvatarUrl(userData.avatarUrl || "");
        
      } catch (err) {
        if (!isMounted) return;
        
        console.error('❌ Error fetching profile:', err);
        
        // Fallback to user context data
        setAllergens([]);
        setEmail(user.email || "");
        setUserType("");
        setDisplayName(user.displayName || "");
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setAvatarUrl("");
      }
      
      if (isMounted) {
        setLoadingProfile(false);
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Expose refresh function
  const refreshProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    
    try {
      console.log('🔄 Refreshing profile for user ID:', user.id);
      
      const response = await fetch(`/api/users/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const userData = await response.json();
      console.log('✅ Profile data refreshed:', userData);
      
      // Set profile data from API response
      setAllergens(userData.allergies ? convertBackendAllergensToKeys(userData.allergies) : []);
      setEmail(userData.email || user.email || "");
      setUserType(userData.userType || "");
      setDisplayName(userData.displayName || "");
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setAvatarUrl(userData.avatarUrl || "");
      
      // Also update edit state if in edit mode
      if (editMode) {
        setEditAvatarUrl(userData.avatarUrl || "");
      }
      
    } catch (err) {
      console.error('❌ Error refreshing profile:', err);
      setError('Failed to refresh profile data');
    }
    setLoadingProfile(false);
  };

  // When entering edit mode, copy profile data to edit state
  useEffect(() => {
    if (editMode && allergens) {
      setEditAllergens(allergens);
      setEditUserType(userType || "");
      setEditDisplayName(displayName || "");
      setEditFirstName(firstName || "");
      setEditLastName(lastName || "");
      setEditAvatarUrl(avatarUrl || "");
    }
  }, [editMode, allergens, userType, displayName, firstName, lastName, avatarUrl]);

  // Handle allergen checkbox changes
  const handleCheckboxChange = (allergen: string) => {
    setEditAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  // Allergen key to ID mapping (frontend keys to database IDs)
  const allergenKeyToId: { [key: string]: number } = {
    'gluten': 1,
    'crustaceans': 2,
    'eggs': 3,
    'fish': 4,
    'peanuts': 5,
    'soybeans': 6,
    'milk': 7,
    'tree_nuts': 8,
    'celery': 9,
    'mustard': 10,
    'sesame': 11,
    'sulfites': 12,
    'lupin': 13,
    'molluscs': 14
  };

  // Database name to frontend key mapping (for converting API responses)
  const dbNameToKey: { [key: string]: string } = {
    'Gluten': 'gluten',
    'Crustaceans': 'crustaceans',
    'Eggs': 'eggs',
    'Fish': 'fish',
    'Peanuts': 'peanuts',
    'Soybeans': 'soybeans',
    'Milk': 'milk',
    'Tree Nuts': 'tree_nuts',
    'Celery': 'celery',
    'Mustard': 'mustard',
    'Sesame Seeds': 'sesame',
    'Sulphites': 'sulfites',
    'Lupin': 'lupin',
    'Molluscs': 'molluscs'
  };

  // Convert backend allergen objects to frontend keys
  const convertBackendAllergensToKeys = (backendAllergens: any[]): string[] => {
    return backendAllergens
      .map(allergen => dbNameToKey[allergen.name] || allergen.name.toLowerCase())
      .filter(key => key); // Filter out any unmapped allergens
  };

  // Handle profile save
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert allergen keys to the format backend expects
      const allergenObjects = editAllergens.map(allergenKey => ({
        id: allergenKeyToId[allergenKey],
        name: allergenKey
        // Note: No severity - user didn't request severity levels
      })).filter(allergen => allergen.id); // Filter out any unmapped allergens

      console.log('💾 Updating user profile...', {
        displayName: editDisplayName,
        firstName: editFirstName,
        lastName: editLastName,
        allergies: allergenObjects,
        userType: editUserType
      });

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: editDisplayName,
          firstName: editFirstName,
          lastName: editLastName,
          allergies: allergenObjects,
          userType: editUserType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      console.log('✅ Profile updated successfully:', data.user);

      // Update local state with the response data
      setDisplayName(data.user.displayName || editDisplayName);
      setFirstName(data.user.firstName || editFirstName);
      setLastName(data.user.lastName || editLastName);
      setUserType(data.user.userType || editUserType);
      setAllergens(data.user.allergies ? convertBackendAllergensToKeys(data.user.allergies) : allergens || []);
      
      setEditMode(false);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
      
      console.log('✅ Local state updated with saved profile data');
      
    } catch (e) {
      console.error("❌ Profile update error:", e);
      setError(e instanceof Error ? e.message : "Failed to update profile. Please try again.");
    }
    setSaving(false);
  };

  return {
    // Core profile state
    allergens,
    email,
    userType,
    displayName,
    firstName,
    lastName,
    avatarUrl,
    
    // Edit mode state
    editMode,
    editAllergens,
    editUserType,
    editDisplayName,
    editFirstName,
    editLastName,
    editAvatarUrl,
    
    // Loading and status state
    loadingProfile,
    saving,
    error,
    success,
    uploadingAvatar,
    
    // Actions
    setEditMode,
    setError,
    setSuccess,
    setUploadingAvatar,
    setEditAvatarUrl,
    setEditFirstName,
    setEditLastName,
    setEditDisplayName,
    setEditUserType,
    handleCheckboxChange,
    handleSave,
    refreshProfile,
  };
}
