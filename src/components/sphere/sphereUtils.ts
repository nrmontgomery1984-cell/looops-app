// Sphere utility functions for color mapping and score calculations

import type { SphereColorScheme, SphereState } from './types';

/**
 * Maps a numeric score (0-100) to a semantic state
 */
export function scoreToState(score: number): SphereState {
  if (score >= 85) return 'thriving';
  if (score >= 70) return 'good';
  if (score >= 50) return 'neutral';
  if (score >= 30) return 'attention';
  return 'critical';
}

/**
 * Color schemes for each sphere state
 * Designed for a premium, matte aesthetic with teal-to-coral palette
 */
const colorSchemes: Record<SphereState, SphereColorScheme> = {
  thriving: {
    top: '#4ECDC4',      // Vibrant teal
    bottom: '#A8E6CF',   // Soft mint
    glow: 'rgba(78, 205, 196, 0.3)',
    shadow: 'rgba(78, 205, 196, 0.2)',
  },
  good: {
    top: '#5FB3A1',      // Soft teal (reference image)
    bottom: '#E8A87C',   // Soft coral/peach (reference image)
    glow: 'rgba(95, 179, 161, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  neutral: {
    top: '#7FB3B5',      // Muted teal
    bottom: '#C9A588',   // Muted warm
    glow: 'rgba(127, 179, 181, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  attention: {
    top: '#C9A588',      // Warm tan
    bottom: '#E07A5F',   // Soft coral-red
    glow: 'rgba(224, 122, 95, 0.25)',
    shadow: 'rgba(224, 122, 95, 0.15)',
  },
  critical: {
    top: '#E07A5F',      // Coral
    bottom: '#C1666B',   // Muted red
    glow: 'rgba(193, 102, 107, 0.3)',
    shadow: 'rgba(193, 102, 107, 0.2)',
  },
};

/**
 * Gets the color scheme for a given state
 */
export function stateToColors(state: SphereState): SphereColorScheme {
  return colorSchemes[state];
}

/**
 * Converts a score directly to a color scheme
 */
export function scoreToColors(score: number): SphereColorScheme {
  return stateToColors(scoreToState(score));
}

/**
 * Clamps a score to valid range (0-100)
 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculates appropriate font size based on sphere size
 * Ensures number is readable at all scales
 */
export function getScoreFontSize(sphereSize: number): number {
  // Base ratio: score takes up about 35% of sphere diameter
  const baseSize = sphereSize * 0.35;
  // Minimum 10px, maximum 120px
  return Math.max(10, Math.min(120, baseSize));
}

/**
 * Gets shadow blur and offset based on sphere size
 */
export function getShadowParams(sphereSize: number): { blur: number; offset: number; spread: number } {
  const scale = sphereSize / 150; // Normalize to reference size
  return {
    blur: Math.max(8, 20 * scale),
    offset: Math.max(4, 10 * scale),
    spread: Math.max(2, 5 * scale),
  };
}

/**
 * Gets glow intensity based on sphere size
 */
export function getGlowParams(sphereSize: number): { blur: number; spread: number } {
  const scale = sphereSize / 150;
  return {
    blur: Math.max(10, 30 * scale),
    spread: Math.max(5, 15 * scale),
  };
}
