// SphereCanvas - Full WebGL/Three.js sphere renderer
// Premium 3D rendering with smooth gradients and subtle animations

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere as DreiSphere } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import type { SphereProps } from './types';
import {
  scoreToColors,
  clampScore,
  getScoreFontSize,
  getShadowParams,
  getGlowParams,
} from './sphereUtils';

// Custom shader material for smooth gradient
const GradientMaterial = ({
  topColor,
  bottomColor,
}: {
  topColor: string;
  bottomColor: string;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Convert hex to THREE.Color
  const topColorObj = useMemo(() => new THREE.Color(topColor), [topColor]);
  const bottomColorObj = useMemo(() => new THREE.Color(bottomColor), [bottomColor]);

  // Animate color transitions
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.topColor.value.lerp(topColorObj, 0.1);
      materialRef.current.uniforms.bottomColor.value.lerp(bottomColorObj, 0.1);
    }
  }, [topColorObj, bottomColorObj]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColorObj.clone() },
        bottomColor: { value: bottomColorObj.clone() },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // Gradient based on Y position (normalized to 0-1)
          float gradientFactor = (vPosition.y + 1.0) / 2.0;
          vec3 baseColor = mix(bottomColor, topColor, gradientFactor);

          // Subtle rim lighting for 3D depth
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 3.0) * 0.15;

          // Subtle highlight at top
          float highlight = smoothstep(0.3, 0.8, gradientFactor) * 0.08;

          vec3 finalColor = baseColor + vec3(rim + highlight);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [topColorObj, bottomColorObj]);

  return <primitive ref={materialRef} object={shaderMaterial} attach="material" />;
};

// Animated sphere mesh
const AnimatedSphere = ({
  topColor,
  bottomColor,
  animate,
  prefersReducedMotion,
  onClick,
  interactive,
}: {
  topColor: string;
  bottomColor: string;
  animate: boolean;
  prefersReducedMotion: boolean;
  onClick?: () => void;
  interactive: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shouldAnimate = animate && !prefersReducedMotion;

  // Subtle breathing animation
  useFrame((state) => {
    if (meshRef.current && shouldAnimate) {
      // Very slow rotation (360° in 20 seconds)
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;

      // Subtle breathing scale
      const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.01 + 1;
      meshRef.current.scale.setScalar(breathe);
    }
  });

  return (
    <DreiSphere
      ref={meshRef}
      args={[1, 64, 64]}
      onClick={interactive ? onClick : undefined}
    >
      <GradientMaterial topColor={topColor} bottomColor={bottomColor} />
    </DreiSphere>
  );
};

// Shadow plane beneath sphere
const ShadowPlane = ({ shadowColor }: { shadowColor: string }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
      <circleGeometry args={[0.8, 32]} />
      <meshBasicMaterial
        color={shadowColor}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
};

export function SphereCanvas({
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

  // Container style
  const containerStyle = useMemo(() => ({
    width: size,
    height: size + (label ? fontSize * 1.5 : 0),
    cursor: interactive && onClick ? 'pointer' : 'default',
  }), [size, label, fontSize, interactive, onClick]);

  // Canvas wrapper with glow effect
  const canvasWrapperStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: '50%',
    boxShadow: `
      0 ${shadow.offset}px ${shadow.blur}px ${shadow.spread}px ${colors.shadow},
      0 0 ${glow.blur}px ${glow.spread}px ${colors.glow}
    `,
    transition: 'box-shadow 600ms ease-in-out',
    overflow: 'hidden',
  }), [size, shadow, glow, colors]);

  return (
    <motion.div
      className={`inline-flex flex-col items-center ${className}`}
      style={containerStyle}
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
      {/* Canvas wrapper with glow/shadow */}
      <div style={canvasWrapperStyle} className="relative">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 45 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.4} />

          <AnimatedSphere
            topColor={colors.top}
            bottomColor={colors.bottom}
            animate={animate}
            prefersReducedMotion={prefersReducedMotion}
            onClick={onClick}
            interactive={interactive}
          />

          <ShadowPlane shadowColor="#000000" />
        </Canvas>

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
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {clampedScore}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

export default SphereCanvas;
