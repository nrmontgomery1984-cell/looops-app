// Sphere Demo Page - Test page for sphere component development
// Access via the "Sphere Demo" tab or navigate here directly

import { useState } from 'react';
import { Sphere, SphereSVG, SphereCanvas, scoreToState, stateToColors } from '../../components/sphere';
import type { SphereState } from '../../components/sphere';

const DEMO_SCORES: { state: SphereState; score: number }[] = [
  { state: 'thriving', score: 92 },
  { state: 'good', score: 75 },
  { state: 'neutral', score: 58 },
  { state: 'attention', score: 38 },
  { state: 'critical', score: 15 },
];

const DEMO_SIZES = [40, 80, 150, 300];

export function SphereDemoPage() {
  const [score, setScore] = useState(75);
  const [forceRenderer, setForceRenderer] = useState<'svg' | 'canvas' | 'auto'>('auto');
  const [showScore, setShowScore] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [darkBg, setDarkBg] = useState(false);

  const currentState = scoreToState(score);
  const currentColors = stateToColors(currentState);

  return (
    <div
      className="sphere-demo-page"
      style={{
        padding: '2rem',
        minHeight: '100vh',
        backgroundColor: darkBg ? '#1a1a2e' : '#f5f5f7',
        color: darkBg ? '#fff' : '#1a1a2e',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Sphere Component Demo</h1>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
          Test page for the Looops sphere UI component
        </p>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            padding: '1.5rem',
            backgroundColor: darkBg ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '12px',
            marginBottom: '2rem',
          }}
        >
          {/* Score Slider */}
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Score: {score}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.6 }}>
              <span>Critical (0)</span>
              <span>Thriving (100)</span>
            </div>
          </div>

          {/* Renderer Toggle */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Renderer
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['auto', 'svg', 'canvas'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setForceRenderer(r)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: forceRenderer === r
                      ? (darkBg ? '#5FB3A1' : '#4a90a4')
                      : (darkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    color: forceRenderer === r ? '#fff' : 'inherit',
                    fontWeight: forceRenderer === r ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showScore}
                onChange={(e) => setShowScore(e.target.checked)}
              />
              Show Score
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={animate}
                onChange={(e) => setAnimate(e.target.checked)}
              />
              Animate
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={darkBg}
                onChange={(e) => setDarkBg(e.target.checked)}
              />
              Dark Background
            </label>
          </div>
        </div>

        {/* Current State Info */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: darkBg ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}
        >
          <strong>Current State:</strong> {currentState} |{' '}
          <strong>Top:</strong> {currentColors.top} |{' '}
          <strong>Bottom:</strong> {currentColors.bottom}
        </div>

        {/* Main Interactive Sphere */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Interactive Sphere</h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3rem',
              backgroundColor: darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
              borderRadius: '16px',
            }}
          >
            <Sphere
              score={score}
              size={250}
              showScore={showScore}
              animate={animate}
              interactive
              forceRenderer={forceRenderer === 'auto' ? undefined : forceRenderer}
              onClick={() => alert(`Clicked! Score: ${score}, State: ${currentState}`)}
              label="Overall Status"
            />
          </div>
        </section>

        {/* All States */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>All States</h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              justifyContent: 'center',
              padding: '2rem',
              backgroundColor: darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
              borderRadius: '16px',
            }}
          >
            {DEMO_SCORES.map(({ state, score: demoScore }) => (
              <div key={state} style={{ textAlign: 'center' }}>
                <Sphere
                  score={demoScore}
                  size={120}
                  showScore={showScore}
                  animate={animate}
                  forceRenderer={forceRenderer === 'auto' ? undefined : forceRenderer}
                  label={state.charAt(0).toUpperCase() + state.slice(1)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Size Variants */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Size Variants</h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '2rem',
              backgroundColor: darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
              borderRadius: '16px',
            }}
          >
            {DEMO_SIZES.map((size) => (
              <div key={size} style={{ textAlign: 'center' }}>
                <Sphere
                  score={score}
                  size={size}
                  showScore={showScore}
                  animate={animate}
                  forceRenderer={forceRenderer === 'auto' ? undefined : forceRenderer}
                  label={`${size}px`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Renderer Comparison */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Renderer Comparison</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              padding: '2rem',
              backgroundColor: darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
              borderRadius: '16px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>SVG Renderer</h3>
              <SphereSVG
                score={score}
                size={180}
                showScore={showScore}
                animate={animate}
                label="Lightweight"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Canvas (WebGL) Renderer</h3>
              <SphereCanvas
                score={score}
                size={180}
                showScore={showScore}
                animate={animate}
                label="Full 3D"
              />
            </div>
          </div>
        </section>

        {/* Watch Size Test */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Smartwatch Size (40px)</h2>
          <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.875rem' }}>
            Simulating how the sphere looks on a smartwatch display
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center',
              padding: '2rem',
              backgroundColor: darkBg ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
              borderRadius: '16px',
            }}
          >
            {DEMO_SCORES.map(({ state, score: demoScore }) => (
              <Sphere
                key={state}
                score={demoScore}
                size={40}
                showScore={showScore}
                animate={animate}
                forceRenderer="svg" // Always SVG for watch size
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default SphereDemoPage;
