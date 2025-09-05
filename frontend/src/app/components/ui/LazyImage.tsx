"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';
import { ImageError } from './ErrorStates';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized lazy loading image component
 * Uses Intersection Observer for efficient lazy loading
 * Falls back to placeholder on error
 * Optimized for establishment cards and general image display
 */
const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/images/placeholder-restaurant-old.webp',
  fallbackSrc,
  priority = false,
  onLoad,
  onError
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Stop observing after loading
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const shouldShowPlaceholder = !isInView || (!isLoaded && isInView && !hasError);
  const shouldShowError = hasError && (!fallbackSrc || (fallbackSrc && hasError));

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Error state */}
      {shouldShowError && (
        <ImageError alt={alt} className="w-full h-full" />
      )}
      
      {/* Placeholder/Loading state */}
      {shouldShowPlaceholder && !shouldShowError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
      
      {/* Actual image - only render when in view and no error */}
      {isInView && !shouldShowError && (
        <Image
          src={hasError ? (fallbackSrc || placeholder) : src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          placeholder={width && height && width >= 40 && height >= 40 ? "blur" : "empty"}
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  );
});

export default LazyImage;
