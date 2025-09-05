"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header";
import { AuthContext } from "@/app/context/AuthContext";
import AllergenSelector from "@/app/components/profile/AllergenSelector";
import { ALLERGENS } from "@/types";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    isValid: boolean;
  }>({ score: 0, feedback: [], isValid: false });


  const handleAllergenChange = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push("One special character (@$!%*?&)");
    }

    const isValid = score === 5;
    return { score, feedback, isValid };
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    setPasswordStrength(validatePasswordStrength(newPassword));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempt:", { 
      email, 
      password: password ? "***" : "empty",
      firstName,
      lastName,
      displayName,
      userType,
      selectedAllergens
    });
    
    if (!email || !password || !confirmPassword || !firstName || !lastName || !displayName || !userType) {
      setError("Please fill in all required fields");
      return;
    }

    if (!passwordStrength.isValid) {
      setError("Please ensure your password meets all requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create new user account
      console.log("🔐 Creating account for:", email);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          displayName,
          firstName,
          lastName,
          userType,
          allergies: selectedAllergens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      console.log("✅ Account created successfully:", data.user.displayName);
      
      // Show success message and redirect to login with verification notice
      router.push('/login?message=Account created! Please check your email to verify your account before logging in.');
      
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError(error instanceof Error ? error.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't disable button based on AuthContext loading
  const isButtonDisabled = loading;





  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
{/* Firebase warning removed - using AWS backend */}
      
      <div className="flex items-center justify-center mt-8">
        <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow-lg border border-gray-200">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join TrustDiner to find safe dining options
            </p>
          </div>

          {/* User Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">I am a...</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType("allergy_sufferer")}
                className={`p-4 rounded-lg border-2 text-center font-medium transition-all ${
                  userType === "allergy_sufferer"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                <div className="text-sm font-semibold">Allergy Sufferer</div>
                <div className="text-xs text-gray-500 mt-1">I have food allergies</div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("parent")}
                className={`p-4 rounded-lg border-2 text-center font-medium transition-all ${
                  userType === "parent"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                <div className="text-sm font-semibold">Parent/Guardian</div>
                <div className="text-xs text-gray-500 mt-1">I care for someone with allergies</div>
              </button>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSignUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name *
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="How you want to appear to other users"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  placeholder="Password (8+ characters with uppercase, lowercase, number, special char)"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.isValid ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.isValid ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-600">Required:</p>
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords don't match</p>
              )}
            </div>

            {/* Allergen Selector */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <AllergenSelector
                allergens={selectedAllergens}
                isEditMode={true}
                editAllergens={selectedAllergens}
                onAllergenChange={handleAllergenChange}
              />
              <p className="mt-2 text-xs text-gray-500">
                You can update these preferences later in your profile.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isButtonDisabled || !userType || !passwordStrength.isValid || password !== confirmPassword}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
              {!userType && (
                <p className="mt-2 text-xs text-red-500 text-center">
                  Please select a user type above to continue
                </p>
              )}
            </div>

            <div className="text-center">
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
