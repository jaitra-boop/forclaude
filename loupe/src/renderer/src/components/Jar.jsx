import React from 'react'
import { PURPLE, BLUE, CYAN, AMBER } from '../theme'

const FILL_A     = '#7B2FF7'
const FILL_B     = '#2196F3'
const FILL_GLOW  = '#A78BFA'
const CRACK_CLR  = 'rgba(255,255,255,0.3)'
const GLASS_BODY = 'rgba(255,255,255,0.06)'
const GLASS_BORD = 'rgba(255,255,255,0.15)'

function CrackMark({ index }) {
  const positions = [
    { x: 52, y: 88 },
    { x: 68, y: 112 },
    { x: 44, y: 132 },
    { x: 72, y: 68 }
  ]
  const pos = positions[index % positions.length]
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <polyline
        points="0,0 4,6 2,10 6,14"
        fill="none"
        stroke={CRACK_CLR}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  )
}

export default function Jar({ pct = 0, glowing = false, cracks = 0 }) {
  const clamped = Math.max(0, Math.min(100, pct))
  const fillH = 118 * (clamped / 100)
  const fillY = 148 - fillH
  const gradId = `jarFill_${Math.round(clamped)}`
  const glowId = 'jarGlow'

  return (
    <svg
      width="44"
      height="60"
      viewBox="0 0 96 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', filter: glowing ? `drop-shadow(0 0 8px ${FILL_A})` : 'none' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={glowing ? FILL_GLOW : FILL_A} />
          <stop offset="100%" stopColor={FILL_B} />
        </linearGradient>
        <clipPath id="jar-body-clip">
          <path d="M29 28 Q24 28 22 35 L15 148 Q13 158 48 160 Q83 158 81 148 L74 35 Q72 28 67 28 Z" />
        </clipPath>
        {glowing && (
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* Jar glass body */}
      <path
        d="M29 28 Q24 28 22 35 L15 148 Q13 158 48 160 Q83 158 81 148 L74 35 Q72 28 67 28 Z"
        fill={GLASS_BODY}
        stroke={GLASS_BORD}
        strokeWidth="1.5"
      />

      {/* Liquid fill */}
      <rect
        x="14"
        y={fillY}
        width="68"
        height={fillH + 12}
        fill={`url(#${gradId})`}
        clipPath="url(#jar-body-clip)"
        opacity="0.85"
      />

      {/* Fill surface shimmer */}
      {clamped > 2 && (
        <ellipse
          cx="48"
          cy={fillY + 2}
          rx="30"
          ry="5"
          fill="rgba(255,255,255,0.15)"
          clipPath="url(#jar-body-clip)"
        />
      )}

      {/* Jar outline over fill */}
      <path
        d="M29 28 Q24 28 22 35 L15 148 Q13 158 48 160 Q83 158 81 148 L74 35 Q72 28 67 28 Z"
        fill="none"
        stroke={GLASS_BORD}
        strokeWidth="2"
      />

      {/* Lid */}
      <rect x="26" y="17" width="44" height="13" rx="4" fill="rgba(255,255,255,0.10)" stroke={GLASS_BORD} strokeWidth="1.5" />
      <rect x="33" y="10" width="30" height="9" rx="3" fill="rgba(255,255,255,0.07)" stroke={GLASS_BORD} strokeWidth="1.5" />

      {/* Shine */}
      <line x1="35" y1="38" x2="33" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />

      {/* Cracks */}
      {Array.from({ length: Math.min(cracks, 4) }).map((_, i) => (
        <CrackMark key={i} index={i} />
      ))}

      {/* Glow milestone ring */}
      {glowing && (
        <path
          d="M29 28 Q24 28 22 35 L15 148 Q13 158 48 160 Q83 158 81 148 L74 35 Q72 28 67 28 Z"
          fill="none"
          stroke={FILL_A}
          strokeWidth="2"
          opacity="0.5"
          filter={`url(#${glowId})`}
        />
      )}
    </svg>
  )
}
