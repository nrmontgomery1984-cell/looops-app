// SphereSVG - Lightweight SVG/CSS sphere renderer
// Works at any size from smartwatch (40px) to desktop (400px+)

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useId } from 'react';
import type { SphereProps } from './types';
import {
  scoreToColors,
  clampScore,
  getScoreFontSize,
  getShadowParams,
  getGlowParams,
} from './sphereUtils';

export function SphereSVG({
  score,
  size = 150,
  label,
  colorOverride,
  showScore = true,
  animate = true,
  onClick,
  interactive = true,
  className = '',
}: SphereProps) {
  const id = useId();
  const clampedScore = clampScore(score);
  const colors = colorOverride ?? scoreToColors(clampedScore);
  const fontSize = getScoreFontSize(size);
  const shadow = getShadowParams(size);
  const glow = getGlowParams(size);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const shouldAnimate = animate && !prefersReducedMotion;

  // Unique IDs for SVG gradients (avoid conflicts when multiple spheres)
  const gradientId = `sphere-gradient-${id}`;
  const highlightId = `sphere-highlight-${id}`;

  // Container style with glow and shadow
  const containerStyle = useMemo(() => ({
    width: size,
    height: size + (label ? fontSize * 1.5 : 0),
    cursor: interactive && onClick ? 'pointer' : 'default',
  }), [size, label, fontSize, interactive, onClick]);

  // Sphere wrapper with shadow
  const sphereWrapperStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: '50%',
    boxShadow: `
      0 ${shadow.offset}px ${shadow.blur}px ${shadow.spread}px ${colors.shadow},
      0 0 ${glow.blur}px ${glow.spread}px ${colors.glow}
    `,
    transition: 'box-shadow 600ms ease-in-out',
  }), [size, shadow, glow, colors]);

  return (
    <motion.div
      className={`inline-flex flex-col items-center ${className}`}
      style={containerStyle}
      onClick={interactive ? onClick : undefined}
      role={interactive && onClick ? 'button' : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
      onKeyDown={interactive && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      aria-label={`Score: ${clampedScore}${label ? `, ${label}` : ''}`}
      whileHover={interactive && shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={interactive && shouldAnimate ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {/* Sphere with glow/shadow wrapper */}
      <motion.div
        style={sphereWrapperStyle}
        animate={shouldAnimate ? {
          scale: [1, 1.02, 1],
        } : undefined}
        transition={shouldAnimate ? {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        } : undefined}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ display: 'block' }}
        >
          <defs>
            {/* Main gradient - top to bottom */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <motion.stop
                offset="0%"
                animate={{ stopColor: colors.top }}
                transition={{ duration: 0.6 }}
              />
              <motion.stop
                offset="100%"
                animate={{ stopColor: colors.bottom }}
                transition={{ duration: 0.6 }}
              />
            </linearGradient>

            {/* Subtle highlight for 3D depth */}
            <radialGradient id={highlightId} cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Main sphere */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill={`url(#${gradientId})`}
          />

          {/* Subtle highlight overlay for matte 3D look */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill={`url(#${highlightId})`}
          />
        </svg>

        {/* Score number overlay */}
        <AnimatePresence mode="wait">
          {showScore && (
            <motion.div
              key={clampedScore}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${fontSize}px`,
                fontWeight: 300,
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {clampedScore}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label below sphere */}
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 8,
            fontSize: `${Math.max(10, fontSize * 0.4)}px`,
            fontWeight: 500,
            color: '#666',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

export default SphereSVG;
