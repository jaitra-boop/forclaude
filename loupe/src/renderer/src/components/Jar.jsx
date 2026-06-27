import React from 'react'

const FILL_COLOR = '#7BB8A0'
const FILL_COLOR_GLOW = '#A8D5C2'
const CRACK_COLOR = '#C4A882'
const JAR_STROKE = '#3D3530'
const GLOW_COLOR = '#F5C842'

function CrackMark({ index }) {
  const positions = [
    { x: 52, y: 90 },
    { x: 68, y: 110 },
    { x: 44, y: 130 },
    { x: 76, y: 70 }
  ]
  const pos = positions[index % positions.length]
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <polyline
        points="0,0 4,6 2,10 6,14"
        fill="none"
        stroke={CRACK_COLOR}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  )
}

export default function Jar({ pct = 0, glowing = false, cracks = 0 }) {
  const clampedPct = Math.max(0, Math.min(100, pct))
  // Jar interior fill area: y from 30 (top of liquid area) to 150 (bottom)
  const fillHeight = 120 * (clampedPct / 100)
  const fillY = 150 - fillHeight

  return (
    <svg
      width="48"
      height="64"
      viewBox="0 0 96 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {glowing && (
        <ellipse
          cx="48"
          cy="80"
          rx="38"
          ry="55"
          fill={GLOW_COLOR}
          opacity="0.18"
          filter="url(#glow)"
        />
      )}
      <defs>
        <clipPath id="jar-clip">
          <path d="M28 30 Q24 30 22 36 L16 150 Q14 158 48 160 Q82 158 80 150 L74 36 Q72 30 68 30 Z" />
        </clipPath>
        {glowing && (
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Jar fill */}
      <rect
        x="16"
        y={fillY}
        width="64"
        height={fillHeight + 10}
        fill={glowing ? FILL_COLOR_GLOW : FILL_COLOR}
        clipPath="url(#jar-clip)"
        opacity="0.85"
      />

      {/* Jar body outline */}
      <path
        d="M28 30 Q24 30 22 36 L16 150 Q14 158 48 160 Q82 158 80 150 L74 36 Q72 30 68 30 Z"
        stroke={JAR_STROKE}
        strokeWidth="3"
        fill="none"
      />

      {/* Lid */}
      <rect x="26" y="18" width="44" height="14" rx="4" fill="#E8DDD0" stroke={JAR_STROKE} strokeWidth="2.5" />
      <rect x="32" y="12" width="32" height="8" rx="3" fill="#D4C8BC" stroke={JAR_STROKE} strokeWidth="2" />

      {/* Cracks */}
      {Array.from({ length: Math.min(cracks, 4) }).map((_, i) => (
        <CrackMark key={i} index={i} />
      ))}

      {/* Shine */}
      <line x1="36" y1="40" x2="34" y2="100" stroke="white" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
    </svg>
  )
}
