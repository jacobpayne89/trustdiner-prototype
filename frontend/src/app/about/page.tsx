"use client";

import Header from "@/app/components/Header";
import Link from "next/link";
import { AllergenIcon, type AllergenKey } from "@/app/components/icons";
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, type AllergenKey } from "@/types";

// Helper function to get allergen key for icon mapping
function getAllergenIconKey(allergen: AllergenKey): string {
  const mapping: Record<AllergenKey, string> = {
    eggs: "eggs",
    milk: "milk",
    fish: "fish",
    crustaceans: "crustaceans",
    tree_nuts: "treenuts",
    peanuts: "peanuts",
    gluten: "gluten",
    soybeans: "soybeans",
    sesame: "sesame",
    celery: "celery",
    mustard: "mustard",
    lupin: "lupin",
    molluscs: "molluscs",
    sulfites: "sulphites",
  };
  return mapping[allergen] || allergen;
}

export default function AboutPage() {
  return (
    <>
      <Header showSearch={false} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About TrustDiner</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              By people with food allergies, for people with food allergies
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="space-y-6 text-gray-700 leading-relaxed">
              
              {/* Mission Section */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-lg mb-4">
                  TrustDiner is built by people with food allergies for people with food allergies 
                  with the aim of sharing and discovering safe places to eat.
                </p>
                <p>
                  Living with food allergies means constantly questioning whether it's safe to eat somewhere. 
                  We believe everyone deserves to dine out with confidence, which is why we've created 
                  a platform built on real experiences from real people.
                </p>
              </section>

              {/* How It Works Section */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How TrustDiner Works</h2>
                <p className="mb-4">
                  TrustDiner is built on reviews by real people. Users rate places based on how well they handle 
                  the 14 major allergens recognized by UK food law:
                </p>
                
                {/* Allergen List */}
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <h3 className="font-semibold mb-4 text-gray-900">The 14 Major Allergens</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ALLERGENS.map((allergen) => (
                      <div key={allergen} className="flex items-center gap-2 text-sm">
                        <AllergenIcon 
                          allergen={getAllergenIconKey(allergen) as AllergenKey} 
                          size={16} 
                          className="text-gray-700" 
                        />
                        <span>{ALLERGEN_DISPLAY_NAMES[allergen]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Rating Scale Section */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Rating Scale</h2>
                <p className="mb-4">
                  Each allergen is scored on a 1-5 scale based on how well restaurants handle allergen safety:
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-lg mb-2">1</div>
                      <div className="text-sm font-semibold text-red-700">Avoid</div>
                      <div className="text-xs text-gray-600">Poor allergen handling</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mb-2">2</div>
                      <div className="text-sm font-semibold text-orange-700">Caution</div>
                      <div className="text-xs text-gray-600">Limited awareness</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-lg mb-2">3</div>
                      <div className="text-sm font-semibold text-yellow-700">Moderate</div>
                      <div className="text-xs text-gray-600">Some awareness</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-lime-500 flex items-center justify-center text-white font-bold text-lg mb-2">4</div>
                      <div className="text-sm font-semibold text-lime-700">Good</div>
                      <div className="text-xs text-gray-600">Good handling</div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg mb-2">5</div>
                      <div className="text-sm font-semibold text-green-700">Excellent</div>
                      <div className="text-xs text-gray-600">Outstanding handling</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Current Status Section */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Current Status</h2>
                <p className="mb-4">
                  This is the <strong>prototype version</strong> of TrustDiner. In this test version, 
                  we currently list <strong>2000 popular places to eat in central London</strong>.
                </p>
                <p>
                  The aim is to expand this across the UK to as many places as possible, creating 
                  a comprehensive database of allergy-safe dining options.
                </p>
              </section>

              {/* Community Section */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join Our Community</h2>
                <p className="mb-4">
                  TrustDiner is powered by people like you. Every review helps build a safer 
                  dining community for everyone with food allergies.
                </p>
                <p>
                  Thank you for helping us in this early stage. Your feedback and reviews 
                  are invaluable in making dining out safer for all of us.
                </p>
              </section>

              {/* Free Promise Section */}
              <section className="bg-[#2716a6] -m-8 mt-8 p-8 rounded-lg">
                <h2 className="text-2xl font-semibold text-white mb-4">Our Promise</h2>
                <p className="text-white text-lg font-semibold">
                  TrustDiner will always be free to anyone with a food allergy.
                </p>
                <p className="text-blue-100 mt-2">
                  We believe that access to allergy safety information should never be a barrier. 
                  Our platform will always remain free for those who need it most.
                </p>
              </section>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Link 
              href="/"
              className="inline-block bg-[#2716a6] text-white px-8 py-3 rounded-lg hover:bg-[#1e0f7a] transition-colors font-semibold"
            >
              Start Exploring Safe Places to Eat
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 