import React from "react";
import Header from "@/app/components/Header";

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  className?: string;
}

/**
 * Main page layout wrapper with descriptive classes for debugging
 */
export default function PageLayout({ 
  children, 
  showHeader = true,
  className = ""
}: PageLayoutProps) {
  return (
    <div className={`page-layout-container h-screen flex flex-col overflow-hidden ${className}`}>
      {/* Header Section */}
      {showHeader && (
        <div className="page-layout-header flex-shrink-0">
          <Header />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="page-layout-main-content flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 