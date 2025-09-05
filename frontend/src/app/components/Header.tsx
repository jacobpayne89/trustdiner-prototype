"use client";

import React from "react";
import Link from "next/link";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import LazyImage from "@/app/components/ui/LazyImage";

interface NewHeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: NewHeaderProps) {
  const { user, loading, logout, isLoggedIn } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const router = useRouter();

  // Debug logging for auth state (commented out to reduce console clutter)
  // console.log('🔍 Header:', { 
  //   hasUser: !!user, 
  //   loading, 
  //   isLoggedIn, 
  //   userName: user?.displayName
  // });

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || loading) {
        setIsUserAdmin(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(user.id.toString());
        setIsUserAdmin(adminStatus);
      } catch (error) {
        console.error('❌ Admin check failed:', error);
        setIsUserAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsUserAdmin(false);
      router.push('/');
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  return (
    <header 
      className="bg-[#01745F] flex items-center justify-between w-full px-6 py-3"
      role="banner"
    >
      {/* Left side - Logo and tagline */}
      <div className="flex items-center gap-6">
        <Link 
          href="/" 
          className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F] rounded"
          onClick={onLogoClick}
        >
          <LazyImage src="/logo.webp" alt="TrustDiner logo" width={29} height={29} className="block" priority placeholder={undefined} />
          <div className="flex flex-col max-[480px]:hidden">
            <span className="text-2xl font-extrabold text-white tracking-tight">TrustDiner</span>
          </div>
        </Link>
        
        {/* Tagline for larger screens */}
        <span className="text-white text-lg hidden lg:block opacity-90 font-light">
          Shared allergy experiences for safer choices
        </span>
      </div>

      {/* Right side - Auth buttons and menu */}
      <div className="flex items-center gap-4">
        {!loading && (
          <>
            {!isLoggedIn ? (
              <>
                <Link 
                  href="/login" 
                  className="text-white hover:opacity-80 transition-opacity px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F]"
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-white text-[#01745F] hover:bg-gray-100 transition-colors px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F]"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/profile" 
                  className="text-white hover:opacity-80 transition-opacity px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F]"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-white hover:opacity-80 transition-opacity px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F]"
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Hamburger menu */}
        <button
          className="text-white text-2xl hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#01745F] transition-opacity p-1"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          ☰
        </button>
      </div>

      {/* Side navigation drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop overlay - very light white overlay */}
          <div 
            className="fixed inset-0 bg-white/5 z-40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          
          <nav
            className="fixed top-0 right-0 h-full w-full md:w-1/3 bg-white shadow-2xl z-50 flex flex-col p-6 overflow-y-auto transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl focus:outline-none"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                onClick={() => setDrawerOpen(false)}
              >
                Home
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link 
                    href="/profile" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/chains" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Chains
                  </Link>
                </>
              )}

              <Link 
                href="/about" 
                className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                onClick={() => setDrawerOpen(false)}
              >
                About
              </Link>
              
              <Link 
                href="/faq" 
                className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                onClick={() => setDrawerOpen(false)}
              >
                FAQ
              </Link>

              {isUserAdmin && (
                <>
                  <div className="pt-4 pb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Admin</h3>
                  </div>
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <Link 
                    href="/admin/api-usage" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    API Usage
                  </Link>
                  <Link 
                    href="/admin/places" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Places
                  </Link>
                  <Link 
                    href="/admin/chains" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Manage Chains
                  </Link>
                  <Link 
                    href="/admin/reviews" 
                    className="text-gray-700 hover:text-[#01745F] py-2 border-b border-gray-200"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Reviews
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
