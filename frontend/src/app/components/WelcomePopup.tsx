"use client";

import { useState, useEffect } from 'react';
import type { WelcomePopupProps } from "@/types";

export default function WelcomePopup({ show, onClose }: WelcomePopupProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to the first version of TrustDiner London</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Close welcome message"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 text-gray-700">
            <p>
              TrustDiner is a platform built by people with food allergies for people with food allergies, with the aim of sharing and discovering safe places to eat.
            </p>

            <p>
              All reviews are by real people. Rating places based on how well they handle the 14 major allergens. Scored like this:
            </p>

            {/* Allergen Scale */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-900">Allergen Safety Scale (1-5)</h3>
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm mb-2">1</div>
                  <div className="text-xs font-semibold">Avoid</div>
                  <div className="text-xs text-gray-600">Poor allergen handling</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm mb-2">2</div>
                  <div className="text-xs font-semibold">Caution</div>
                  <div className="text-xs text-gray-600">Limited awareness</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm mb-2">3</div>
                  <div className="text-xs font-semibold">Moderate</div>
                  <div className="text-xs text-gray-600">Some awareness</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white font-bold text-sm mb-2">4</div>
                  <div className="text-xs font-semibold">Good</div>
                  <div className="text-xs text-gray-600">Good handling</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm mb-2">5</div>
                  <div className="text-xs font-semibold">Excellent</div>
                  <div className="text-xs text-gray-600">Outstanding handling</div>
                </div>
              </div>
            </div>

            <p>
              In this early stage we are still building up our review content, so if you're someone who has allergies or cares for someone with allergies we'd love you to share your knowledge with the community!
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#2716a6] text-white px-6 py-2 rounded-lg hover:bg-[#1e0f7a] transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 