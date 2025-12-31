// Sphere component types

export interface SphereProps {
  /** Score from 0-100 */
  score: number;

  /** Size in pixels (will scale responsively) */
  size?: number;

  /** Optional label below the sphere */
  label?: string;

  /** Override the auto-calculated color */
  colorOverride?: SphereColorScheme;

  /** Show/hide the score number */
  showScore?: boolean;

  /** Animation state */
  animate?: boolean;

  /** Click handler */
  onClick?: () => void;

  /** Interaction state */
  interactive?: boolean;

  /** Force a specific renderer */
  forceRenderer?: 'svg' | 'canvas';

  /** Additional CSS class */
  className?: string;
}

export interface SphereColorScheme {
  /** Top color of gradient (teal end) */
  top: string;

  /** Bottom color of gradient (coral end) */
  bottom: string;

  /** Glow color */
  glow: string;

  /** Shadow color */
  shadow: string;
}

export type SphereState = 'thriving' | 'good' | 'neutral' | 'attention' | 'critical';

export interface DeviceCapability {
  supportsWebGL: boolean;
  isSmallScreen: boolean;
  prefersReducedMotion: boolean;
  hasTouch: boolean;
}
