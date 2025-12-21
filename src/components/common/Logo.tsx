// Looops Brand Logo Components
// Based on official brand specifications

import React from "react";

// Brand colors
const BRAND = {
  navy: "#1a1a2e",
  coral: "#F27059",
  amber: "#F4B942",
  sage: "#73A58C",
  white: "#FFFFFF",
};

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  variant?: "dark" | "light";
};

// Primary Wordmark with Tagline (Horizontal)
export function LogoWordmark({ size = "md", showTagline = true, variant = "dark" }: LogoProps) {
  const scales = { sm: 0.5, md: 0.75, lg: 1 };
  const scale = scales[size];
  const textColor = variant === "dark" ? BRAND.navy : BRAND.white;

  return (
    <svg
      width={300 * scale}
      height={showTagline ? 100 * scale : 60 * scale}
      viewBox={`0 0 300 ${showTagline ? 100 : 60}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="10"
        y="42"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        fontSize="48"
        fill={textColor}
      >
        L
      </text>
      <circle cx="70" cy="28" r="20" fill={BRAND.coral} />
      <circle cx="120" cy="28" r="20" fill={BRAND.amber} />
      <circle cx="170" cy="28" r="20" fill={BRAND.sage} />
      <text
        x="200"
        y="42"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        fontSize="48"
        fill={textColor}
      >
        PS
      </text>
      {showTagline && (
        <text
          x="150"
          y="80"
          fontFamily="Inter, sans-serif"
          fontWeight="400"
          fontSize="18"
          fill={textColor}
          textAnchor="middle"
        >
          Loops: Closed.
        </text>
      )}
    </svg>
  );
}

// App Icon Mark (Vertical Stack) - for sidebar/favicon
export function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 32, md: 48, lg: 64 };
  const s = sizes[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="128" height="128" rx="24" fill={BRAND.navy} />
      <circle cx="64" cy="34" r="16" fill={BRAND.coral} />
      <circle cx="64" cy="64" r="16" fill={BRAND.amber} />
      <circle cx="64" cy="94" r="16" fill={BRAND.sage} />
    </svg>
  );
}

// Horizontal Three Dots (for inline use)
export function LogoDots({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 48, md: 72, lg: 96 };
  const s = sizes[size];
  const dotR = s / 6;

  return (
    <svg
      width={s}
      height={s / 3}
      viewBox="0 0 72 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill={BRAND.coral} />
      <circle cx="36" cy="12" r="10" fill={BRAND.amber} />
      <circle cx="60" cy="12" r="10" fill={BRAND.sage} />
    </svg>
  );
}

// Simple text logo with dots
export function LogoSimple({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const textColor = variant === "dark" ? BRAND.navy : BRAND.white;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: "24px",
          color: textColor,
        }}
      >
        L
      </span>
      <div style={{ display: "flex", gap: "3px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: BRAND.coral,
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: BRAND.amber,
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: BRAND.sage,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: "24px",
          color: textColor,
        }}
      >
        PS
      </span>
    </div>
  );
}

export default LogoWordmark;
