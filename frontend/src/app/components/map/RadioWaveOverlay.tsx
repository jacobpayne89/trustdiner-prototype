import React, { useEffect, useRef } from "react";

interface RadioWaveOverlayProps {
  position: { lat: number; lng: number };
  map: google.maps.Map | null;
  size?: number;
  color?: string;
}

/**
 * Radio wave animation overlay for map with descriptive classes
 */
export default function RadioWaveOverlay({ 
  position, 
  map, 
  size = 60,
  color = "#3B82F6"
}: RadioWaveOverlayProps) {
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  
  useEffect(() => {
    // More defensive checks
    if (!map || typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.OverlayView || !position) {
      console.log('RadioWaveOverlay early return:', { 
        map: !!map, 
        window: typeof window !== 'undefined', 
        google: !!(typeof window !== 'undefined' && window.google), 
        position: !!position 
      });
      return;
    }
    
    try {
      class CustomOverlay extends window.google.maps.OverlayView {
        private div: HTMLElement | null = null;
        private position: google.maps.LatLng;
        
        constructor(position: { lat: number; lng: number }) {
          super();
          this.position = new window.google.maps.LatLng(position.lat, position.lng);
        }
        
        onAdd() {
          try {
            this.div = document.createElement('div');
            this.div.className = 'radio-wave-overlay-container';
            this.div.style.position = 'absolute';
            this.div.style.pointerEvents = 'none';
            this.div.style.zIndex = '-999999';
            
            // Create three radio wave circles with descriptive classes
            for (let i = 0; i < 3; i++) {
              const wave = document.createElement('div');
              wave.className = `radio-wave radio-wave-${i + 1}`;
              wave.style.width = `${size * 2.5}px`;
              wave.style.height = `${size * 2.5}px`;
              wave.style.left = `${-size * 1.25}px`;
              wave.style.top = `${-size * 1.25}px`;
              wave.style.animationDelay = `${i * 0.6}s`;
              wave.style.borderColor = color;
              this.div.appendChild(wave);
            }
            
            const panes = this.getPanes();
            if (panes && panes.overlayLayer) {
              panes.overlayLayer.appendChild(this.div);
            }
          } catch (error) {
            console.error('Error in CustomOverlay onAdd:', error);
          }
        }
        
        draw() {
          try {
            if (!this.div) return;
            
            const overlayProjection = this.getProjection();
            if (!overlayProjection) return;
            
            const point = overlayProjection.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = point.x + 'px';
              this.div.style.top = point.y + 'px';
            }
          } catch (error) {
            console.error('Error in CustomOverlay draw:', error);
          }
        }
        
        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }
      
      const overlay = new CustomOverlay(position);
      overlay.setMap(map);
      overlayRef.current = overlay;
      
      return () => {
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating RadioWaveOverlay:', error);
    }
  }, [map, position, size, color]);

  return null; // This component renders via Google Maps overlay, not React DOM
} 