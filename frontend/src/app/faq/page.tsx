"use client";

import Header from "@/app/components/Header";
import { useState } from "react";
import Link from "next/link";
import React from "react";

interface FAQItem {
  question: string;
  answer: string | React.JSX.Element;
}

const faqs: FAQItem[] = [
  {
    question: "How accurate are the allergy safety ratings?",
    answer: (
      <div>
        <p className="mb-3">
          Our ratings are crowd-sourced from real users with allergies who have visited these venues. 
          Each rating reflects their personal experience with allergen safety at that location.
        </p>
        <p className="mb-3">
          <strong>Important:</strong> Ratings are subjective and based on individual experiences. 
          Always inform restaurant staff about your allergies and ask about ingredients and preparation methods.
        </p>
        <p>
          We recommend using TrustDiner as a starting point for research, not as a substitute for 
          direct communication with restaurant staff about your specific needs.
        </p>
      </div>
    )
  },
  {
    question: "What does each rating score mean?",
    answer: (
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">1</span>
          <div>
            <strong className="text-red-600">Avoid:</strong> Poor allergen handling, cross-contamination risks
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">2</span>
          <div>
            <strong className="text-orange-600">Caution:</strong> Limited allergen awareness, proceed carefully
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">3</span>
          <div>
            <strong className="text-yellow-600">Moderate:</strong> Some allergen awareness, ask detailed questions
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-lime-500 text-white flex items-center justify-center font-bold">4</span>
          <div>
            <strong className="text-lime-600">Good:</strong> Good allergen handling and staff knowledge
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">5</span>
          <div>
            <strong className="text-green-600">Excellent:</strong> Outstanding allergen safety and preparation
          </div>
        </div>
      </div>
    )
  },
  {
    question: "Can I trust these ratings with my life-threatening allergies?",
    answer: (
      <div>
        <p className="mb-3 font-semibold text-red-600">
          No rating system should be your only safety measure for life-threatening allergies.
        </p>
        <p className="mb-3">
          TrustDiner provides community insights, but you should always:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Inform restaurant staff about your specific allergies</li>
          <li>Ask about ingredients, preparation methods, and cross-contamination risks</li>
          <li>Carry your emergency medications (EpiPen, etc.)</li>
          <li>Trust your instincts - if you're unsure, don't risk it</li>
          <li>Consider calling ahead to discuss your needs</li>
        </ul>
        <p className="mt-3">
          Use our ratings as a starting point for research, not as a guarantee of safety.
        </p>
      </div>
    )
  },
  {
    question: "How can I contribute ratings and reviews?",
    answer: (
      <div>
        <p className="mb-3">
          To contribute ratings, you need to create a free account and set your allergies in your profile. 
          Then you can:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Rate restaurants for your specific allergies (1-5 scale)</li>
          <li>Write detailed reviews about your experience</li>
          <li>Share specific information about staff knowledge and safety measures</li>
          <li>Update ratings if your experience changes on return visits</li>
        </ul>
        <p className="mt-3">
          Your contributions help build a safer dining community for everyone with food allergies.
        </p>
      </div>
    )
  },
  {
    question: "Which allergens does TrustDiner cover?",
    answer: (
      <div>
        <p className="mb-3">
          We cover all 14 major allergens recognized by UK food law:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <ul className="list-disc ml-6 space-y-1">
            <li>Milk</li>
            <li>Eggs</li>
            <li>Peanuts</li>
            <li>Tree Nuts</li>
            <li>Gluten</li>
            <li>Fish</li>
            <li>Crustaceans</li>
          </ul>
          <ul className="list-disc ml-6 space-y-1">
            <li>Molluscs</li>
            <li>Soybeans</li>
            <li>Sesame</li>
            <li>Mustard</li>
            <li>Celery</li>
            <li>Sulphites</li>
            <li>Lupin</li>
          </ul>
        </div>
        <p className="mt-3">
          You can rate restaurants for any combination of these allergens based on your personal needs.
        </p>
      </div>
    )
  },
  {
    question: "How many restaurants are currently listed?",
    answer: (
      <div>
        <p className="mb-3">
          We currently have approximately <strong>2,000 restaurants</strong> listed across central London, 
          with plans to expand to more areas based on user demand.
        </p>
        <p className="mb-3">
          Our database includes a diverse range of venues:
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Chain restaurants and independent eateries</li>
          <li>Casual dining and fine dining establishments</li>
          <li>Cafés, pubs, and bars</li>
          <li>Fast food and takeaway options</li>
          <li>Various cuisines from around the world</li>
        </ul>
      </div>
    )
  },
  {
    question: "Is TrustDiner free to use?",
    answer: (
      <div>
        <p className="mb-3">
          <strong>Yes, TrustDiner is completely free!</strong> We believe that access to allergy safety 
          information should never be behind a paywall.
        </p>
        <p className="mb-3">
          You can:
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Search and browse all restaurant listings for free</li>
          <li>View all ratings and reviews without charge</li>
          <li>Create an account and contribute your own ratings at no cost</li>
          <li>Use all features without any subscription fees</li>
        </ul>
        <p>
          Our mission is to make dining safer for everyone with food allergies, and keeping the service 
          free ensures it's accessible to all who need it.
        </p>
      </div>
    )
  },
  {
    question: "How do you verify restaurant information?",
    answer: (
      <div>
        <p className="mb-3">
          Our restaurant data comes from reliable public sources including Google Places and 
          official business directories. We regularly update:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Restaurant names, addresses, and contact information</li>
          <li>Opening hours and basic venue details</li>
          <li>Photos and general restaurant information</li>
        </ul>
        <p className="mb-3">
          However, <strong>allergy ratings come entirely from our user community</strong> - 
          real people with allergies sharing their authentic experiences.
        </p>
        <p>
          If you notice outdated information, please let us know so we can investigate and update it.
        </p>
      </div>
    )
  },
  {
    question: "What should I do if I disagree with a rating?",
    answer: (
      <div>
        <p className="mb-3">
          Different people may have different experiences at the same restaurant. If you disagree 
          with existing ratings:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Add your own rating:</strong> Share your experience to provide another perspective</li>
          <li><strong>Write a detailed review:</strong> Explain what made your experience different</li>
          <li><strong>Consider timing:</strong> Staff training and procedures can change over time</li>
          <li><strong>Be specific:</strong> Include details about which allergens and what happened</li>
        </ul>
        <p className="mt-3">
          Multiple ratings help create a more complete picture of each restaurant's allergen safety record.
        </p>
      </div>
    )
  },
  {
    question: "Can restaurants respond to or dispute ratings?",
    answer: (
      <div>
        <p className="mb-3">
          Currently, our platform focuses on direct user experiences. We don't have a system 
          for restaurant owners to respond to or dispute ratings.
        </p>
        <p className="mb-3">
          However, we encourage restaurant owners to:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Improve their allergen safety practices</li>
          <li>Train staff on allergen awareness</li>
          <li>Implement clear allergen procedures</li>
          <li>Encourage satisfied customers to share their positive experiences</li>
        </ul>
        <p>
          Better allergen safety practices naturally lead to better ratings from our community.
        </p>
      </div>
    )
  },
  {
    question: "How often is the data updated?",
    answer: (
      <div>
        <p className="mb-3">
          Our platform updates in real-time as users add new ratings and reviews. Restaurant 
          information is refreshed regularly from our data sources.
        </p>
        <p className="mb-3">
          <strong>User ratings:</strong> Added immediately when submitted
        </p>
        <p className="mb-3">
          <strong>Restaurant details:</strong> Updated weekly from public sources
        </p>
        <p>
          <strong>Database expansion:</strong> We continuously add new venues and expand to new areas 
          based on user requests and community needs.
        </p>
      </div>
    )
  },
  {
    question: "What if I can't find a restaurant I'm looking for?",
    answer: (
      <div>
        <p className="mb-3">
          We're continuously expanding our database. If you can't find a specific restaurant:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Try searching by area or cuisine type</li>
          <li>Check if it might be listed under a different name</li>
          <li>Look for nearby alternatives with good ratings</li>
          <li>Contact us to request addition of specific venues</li>
        </ul>
        <p className="mt-3">
          We prioritize adding restaurants based on user requests and allergy community needs.
        </p>
      </div>
    )
  },
  {
    question: "Is my personal information safe?",
    answer: (
      <div>
        <p className="mb-3">
          We take your privacy seriously. Your allergy information and reviews are stored securely, 
          and we only collect data necessary to provide our service.
        </p>
        <p className="mb-3">
          <strong>What we collect:</strong>
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Email address and chosen username</li>
          <li>Your selected allergies (to show relevant ratings)</li>
          <li>Ratings and reviews you submit</li>
        </ul>
        <p className="mt-3">
          <strong>What we don't do:</strong> We don't sell your data, send spam, or share your 
          personal information with third parties.
        </p>
      </div>
    )
  },
  {
    question: "Can I use TrustDiner outside of London?",
    answer: (
      <div>
        <p className="mb-3">
          Currently, TrustDiner focuses on central London venues. However, we have plans to expand 
          to other UK cities and regions based on community demand.
        </p>
        <p className="mb-3">
          <strong>Future expansion areas we're considering:</strong>
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Greater London areas</li>
          <li>Major UK cities (Manchester, Birmingham, Bristol, etc.)</li>
          <li>Popular tourist destinations</li>
          <li>University towns</li>
        </ul>
        <p>
          If you'd like to see TrustDiner in your area, let us know! Community interest helps us 
          prioritize expansion plans.
        </p>
      </div>
    )
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about using TrustDiner safely and effectively 
              for your allergy needs.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <span className="flex-shrink-0 text-gray-400">
                    {openItems.includes(index) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <div className="pt-4 text-gray-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              If you couldn't find the answer you're looking for, we'd be happy to help.
            </p>
            <div className="space-y-4">
              <Link 
                href="/about"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mr-4"
              >
                Learn More About TrustDiner
              </Link>
              <Link 
                href="/"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Start Exploring Restaurants
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 