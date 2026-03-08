import { useMemo } from 'react'
import { motion, type MotionValue, useTransform } from 'framer-motion'
import './BrushStroke.css'

interface BrushStrokeProps {
  step: number
  progress: MotionValue<number>
}

const W = 1200
const H = 400

/** Mulberry32 seeded PRNG — deterministic per step */
function seededRng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Left edge — "brush touch-down": 12 Q-curve segments bottom→top
 * Blunt, irregular edge with paint blobs that push outward and STAY out.
 * Endpoints move at full wobble so the path holds its displaced shape.
 */
function generateLeftEdge(
  rng: () => number,
  topY: number,
  bottomY: number,
  inset: number,
  wobbleScale: number,
): string {
  const segments = 12
  const spanY = bottomY - topY
  let d = ''
  let prevEndX = inset // track where the previous segment ended
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    // Irregular envelope — NOT smooth sin, each segment gets its own amplitude
    const envelope = (0.3 + rng() * 0.7) * Math.sin(t * Math.PI)
    const y = bottomY - t * spanY
    const cpY = bottomY - (t - 0.5 / segments) * spanY
    // Base wobble — outward is negative X (left of inset)
    let endX = inset - rng() * wobbleScale * envelope
    // ~35% chance: paint blob pushes significantly outward
    if (rng() < 0.35) endX -= wobbleScale * (0.3 + rng() * 0.4)
    // Control point bridges between previous endpoint and current endpoint
    // with its own random offset for irregularity
    const cpX = (prevEndX + endX) / 2 - rng() * wobbleScale * 0.3
    d += ` Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${endX.toFixed(1)} ${y.toFixed(1)}`
    prevEndX = endX
  }
  return d
}

/**
 * Right edge — "brush lift-off": 12 Q-curve segments top→bottom
 * Feathered/ragged edge — bristles separate as paint thins.
 * Progressive raggedness: top is fairly clean, bottom is jagged with gaps.
 * Endpoints move at full wobble so indentations persist.
 */
function generateRightEdge(
  rng: () => number,
  topY: number,
  bottomY: number,
  baseX: number,
  wobbleScale: number,
): string {
  const segments = 12
  const spanY = bottomY - topY
  let d = ''
  let prevEndX = baseX
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const y = topY + t * spanY
    const cpY = topY + (t - 0.5 / segments) * spanY
    // Progressive raggedness: amplitude grows toward bottom
    const raggedness = t * t // quadratic ramp: 0→1
    // Base displacement — outward is positive X (right of baseX)
    let endX = baseX + (rng() - 0.4) * wobbleScale * raggedness
    // Bottom 40%: bristle separation — sharp inward cuts
    if (t > 0.6 && rng() < 0.5) {
      endX -= wobbleScale * (0.4 + rng() * 0.5) * raggedness
    }
    // Occasional outward wisp in bottom 30%
    if (t > 0.7 && rng() < 0.25) {
      endX += wobbleScale * (0.2 + rng() * 0.3)
    }
    const cpX = (prevEndX + endX) / 2 + (rng() - 0.5) * wobbleScale * 0.3
    d += ` Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${endX.toFixed(1)} ${y.toFixed(1)}`
    prevEndX = endX
  }
  return d
}

function generateStrokePath(rng: () => number): string {
  const seg = 60
  const startY = 15 + rng() * 20
  let d = `M 0 ${startY}`
  // Top edge — organic wobble with control-point variation
  for (let x = seg; x <= W; x += seg) {
    const y = 12 + rng() * 24
    const cpx = x - seg / 2 + (rng() - 0.5) * 24
    const cpy = 12 + rng() * 24
    d += ` Q ${cpx} ${cpy} ${x} ${y}`
  }
  const topEndY = 12 + rng() * 24
  // Right edge — organic bristle lift-off
  d += generateRightEdge(rng, topEndY, H - 15 + rng() * 10, W, 80)
  // Bottom edge — deeper wobble
  for (let x = W - seg; x >= 0; x -= seg) {
    const y = H - 10 + (rng() - 0.5) * 24
    const cpx = x + seg / 2 + (rng() - 0.5) * 24
    const cpy = H - 10 + (rng() - 0.5) * 24
    d += ` Q ${cpx} ${cpy} ${x} ${y}`
  }
  const bottomEndY = H - 10 + (rng() - 0.5) * 24
  // Left edge — organic bristle touch-down
  d += generateLeftEdge(rng, startY, bottomEndY, 0, 80)
  d += ' Z'
  return d
}

function generateInnerPath(rng: () => number): string {
  const ins = 24
  const startY = 20 + ins + rng() * 2
  let d = `M ${ins} ${startY}`
  for (let x = 80; x <= W - ins; x += 80) {
    const y = 20 + ins + rng() * 4
    d += ` Q ${x - 40} ${20 + ins + rng() * 4} ${x} ${y}`
  }
  const topEndY = 20 + ins + rng() * 4
  // Right edge — subtle organic wobble
  d += generateRightEdge(rng, topEndY, H - 20 - ins, W - ins, 15)
  // Bottom edge
  for (let x = W - 80; x >= ins; x -= 80) {
    const y = H - 20 - ins + (rng() - 0.5) * 8
    d += ` Q ${x + 40} ${H - 20 - ins + (rng() - 0.5) * 6} ${x} ${y}`
  }
  const bottomEndY = H - 20 - ins + (rng() - 0.5) * 8
  // Left edge — subtle organic wobble
  d += generateLeftEdge(rng, startY, bottomEndY, ins, 15)
  d += ' Z'
  return d
}

export default function BrushStroke({ step, progress }: BrushStrokeProps) {
  const { edgePath, innerPath } = useMemo(() => {
    const rng1 = seededRng(step * 1000 + 42)
    const rng2 = seededRng(step * 1000 + 99)
    return {
      edgePath: generateStrokePath(rng1),
      innerPath: generateInnerPath(rng2),
    }
  }, [step])

  const clipWidth = useTransform(progress, [0, 1], [0, W])

  const filterId = `brush-tex-${step}`
  const clipId = `brush-clip-${step}`

  return (
    <svg
      className={`ob-stroke ob-stroke--${step}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.06"
            numOctaves={5}
            seed={step * 17 + 3}
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale={26}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id={clipId}>
          <motion.rect x={0} y={0} height={H} style={{ width: clipWidth }} />
        </clipPath>
      </defs>

      {/* Edge layer — turbulence displacement for organic painted edges */}
      <path d={edgePath} fill="#000" filter={`url(#${filterId})`} clipPath={`url(#${clipId})`} />

      {/* Inner fill — clean black covering text area */}
      <path d={innerPath} fill="#000" clipPath={`url(#${clipId})`} />
    </svg>
  )
}
