// Hook to detect device capabilities for sphere rendering decisions

import { useState, useEffect } from 'react';
import type { DeviceCapability } from '../components/sphere/types';

/**
 * Detects WebGL support in the browser
 */
function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * Detects if the screen is considered "small" (watch-sized)
 * Uses viewport size, not just screen size
 */
function detectSmallScreen(): boolean {
  if (typeof window === 'undefined') return false;

  // Consider small if viewport is under 150px in either dimension
  // This catches smartwatches and very small viewports
  return window.innerWidth < 150 || window.innerHeight < 150;
}

/**
 * Detects if user prefers reduced motion
 */
function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if device has touch capability
 */
function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Hook to detect device capabilities for adaptive rendering
 *
 * @returns DeviceCapability object with detection results
 */
export function useDeviceCapability(): DeviceCapability {
  const [capabilities, setCapabilities] = useState<DeviceCapability>({
    supportsWebGL: false,
    isSmallScreen: false,
    prefersReducedMotion: false,
    hasTouch: false,
  });

  useEffect(() => {
    // Initial detection
    setCapabilities({
      supportsWebGL: detectWebGLSupport(),
      isSmallScreen: detectSmallScreen(),
      prefersReducedMotion: detectReducedMotion(),
      hasTouch: detectTouch(),
    });

    // Listen for reduced motion preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setCapabilities(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };

    // Listen for viewport size changes (for small screen detection)
    const handleResize = () => {
      setCapabilities(prev => ({ ...prev, isSmallScreen: detectSmallScreen() }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    window.addEventListener('resize', handleResize);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return capabilities;
}

export default useDeviceCapability;
