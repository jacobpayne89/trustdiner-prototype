"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Header from "@/app/components/Header";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password: password ? "***" : "empty" });
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setFormLoading(true);
    setError("");

    try {
      // Use the AuthContext login function
      await login(email, password);
      
      console.log("✅ Login successful via AuthContext");
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error("❌ Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // Don't disable button based on AuthContext loading
  const isButtonDisabled = formLoading;





  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      

      
      <div className="flex items-center justify-center mt-20">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{successMessage}</div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="text-center">
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500">
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto pt-20 px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-center">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
