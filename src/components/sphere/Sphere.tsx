// Sphere - Smart wrapper that chooses the appropriate renderer
// Automatically selects between WebGL (SphereCanvas) and SVG (SphereSVG)
// based on device capabilities and props

import { Suspense, lazy } from 'react';
import { SphereSVG } from './SphereSVG';
import { useDeviceCapability } from '../../hooks/useDeviceCapability';
import type { SphereProps } from './types';

// Lazy load the Canvas version to reduce initial bundle size
const SphereCanvas = lazy(() => import('./SphereCanvas'));

export function Sphere(props: SphereProps) {
  const { supportsWebGL, isSmallScreen, prefersReducedMotion } = useDeviceCapability();

  // Determine which renderer to use
  const useCanvasRenderer = (() => {
    // If explicitly forced, respect that
    if (props.forceRenderer === 'svg') return false;
    if (props.forceRenderer === 'canvas') return true;

    // Use SVG for small screens (watch-sized) - it's lighter
    if (isSmallScreen) return false;

    // Use SVG if WebGL isn't supported
    if (!supportsWebGL) return false;

    // Use SVG for very small sphere sizes (under 60px)
    // Canvas overhead isn't worth it at that scale
    if (props.size && props.size < 60) return false;

    // Default to Canvas for capable devices
    return true;
  })();

  // Pass reduced motion preference to child components
  const enrichedProps = {
    ...props,
    animate: prefersReducedMotion ? false : props.animate,
  };

  // Use SVG renderer
  if (!useCanvasRenderer) {
    return <SphereSVG {...enrichedProps} />;
  }

  // Use Canvas renderer with SVG fallback during load
  return (
    <Suspense fallback={<SphereSVG {...enrichedProps} />}>
      <SphereCanvas {...enrichedProps} />
    </Suspense>
  );
}

export default Sphere;
