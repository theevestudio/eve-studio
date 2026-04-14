'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ── Internal coordinate space ─────────────────────────────────────────────────
const B  = 500   // internal canvas size (px)
const CX = 250   // orbit center x
const CY = 258   // orbit center y
const RX = 182   // orbit x-radius
const RY = 66    // orbit y-radius (flatter = more depth illusion)
const CW = 90    // clip width
const CH = 26    // clip height

const CLIPS = [
  { label: 'HOOK_01.mp4',    color: '#7c3aed' },
  { label: 'BROLL_03.mov',   color: '#0d9488' },
  { label: 'CTA.mp4',        color: '#d97706' },
  { label: 'SHEN_B.mp4',     color: '#7c3aed' },
  { label: 'OPENING.mov',    color: '#0891b2' },
  { label: 'FINAL_CUT.mp4',  color: '#dc2626' },
]

const START_ANGLES = CLIPS.map((_, i) => (i / CLIPS.length) * 2 * Math.PI)
const PERIODS      = [21000, 27000, 19500, 25000, 18000, 23000] // ms / revolution

type Action = 'normal' | 'glow' | 'cut' | 'fade'
type Pos    = { x: number; y: number; depth: number }

export default function EVEOrbit() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const anglesRef      = useRef(START_ANGLES.slice())
  const lastTimeRef    = useRef<number | null>(null)
  const rafRef         = useRef<number | null>(null)
  const actionTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scale, setScale]             = useState<number | null>(null)
  const [activated, setActivated]     = useState(false)
  const [bursting, setBursting]       = useState(false)
  const [orbitVisible, setOrbitVisible] = useState(false)
  const [clipActions, setClipActions] = useState<Action[]>(CLIPS.map(() => 'normal'))
  const [positions, setPositions]     = useState<Pos[]>(() =>
    START_ANGLES.map(a => ({
      x: CX + RX * Math.cos(a),
      y: CY + RY * Math.sin(a),
      depth: 0.5,
    }))
  )

  // ── Responsive scale via ResizeObserver ────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / B))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── RAF orbit loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activated) return
    lastTimeRef.current = null

    function tick(t: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = t
      const dt = Math.min(t - lastTimeRef.current, 50)
      lastTimeRef.current = t

      anglesRef.current = anglesRef.current.map((a, i) =>
        a + (2 * Math.PI / PERIODS[i]) * dt
      )

      setPositions(anglesRef.current.map(a => {
        const x     = CX + RX * Math.cos(a)
        const y     = CY + RY * Math.sin(a)
        const depth = (y - (CY - RY)) / (2 * RY) // 0 = top / far, 1 = bottom / close
        return { x, y, depth }
      }))

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [activated])

  // ── Micro-actions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activated) return

    function next() {
      const idx     = Math.floor(Math.random() * CLIPS.length)
      const pool: Action[] = ['glow', 'cut', 'fade', 'glow', 'glow']
      const action  = pool[Math.floor(Math.random() * pool.length)]

      setClipActions(prev => { const n = [...prev]; n[idx] = action; return n })
      setTimeout(() => {
        setClipActions(prev => { const n = [...prev]; n[idx] = 'normal'; return n })
      }, action === 'cut' ? 650 : action === 'fade' ? 950 : 750)

      actionTimer.current = setTimeout(next, 1300 + Math.random() * 1900)
    }

    actionTimer.current = setTimeout(next, 2200)
    return () => { if (actionTimer.current) clearTimeout(actionTimer.current) }
  }, [activated])

  // ── Activation ────────────────────────────────────────────────────────────
  function handleClick() {
    if (activated || bursting) return
    setBursting(true)
    setTimeout(() => {
      setActivated(true)
      setBursting(false)
      setTimeout(() => setOrbitVisible(true), 180)
    }, 520)
  }

  const ds = (depth: number) => 0.78 + 0.38 * depth  // depth → scale multiplier
  const back  = positions.map((p, i) => ({ p, i })).filter(({ p }) => p.y <  CY)
  const front = positions.map((p, i) => ({ p, i })).filter(({ p }) => p.y >= CY)

  // Don't render until we know container width (prevents SSR layout shift)
  if (scale === null) {
    return <div ref={containerRef} style={{ width: '100%', minHeight: 320 }} />
  }

  return (
    <>
      <style>{`
        @keyframes eve-orbit-idle {
          0%,100% { filter: drop-shadow(0 0 18px rgba(139,92,246,.65)) drop-shadow(0 0 40px rgba(124,58,237,.35)); }
          50%      { filter: drop-shadow(0 0 38px rgba(167,139,250,.95)) drop-shadow(0 0 76px rgba(139,92,246,.55)); }
        }
        @keyframes eve-orbit-burst {
          0%   { transform:scale(1);    filter:drop-shadow(0 0 20px rgba(139,92,246,.7)); }
          38%  { transform:scale(1.22); filter:drop-shadow(0 0 100px rgba(167,139,250,1)) drop-shadow(0 0 150px rgba(139,92,246,.9)); }
          68%  { transform:scale(0.96); filter:drop-shadow(0 0 32px rgba(139,92,246,.6)); }
          100% { transform:scale(1);    filter:drop-shadow(0 0 22px rgba(139,92,246,.7)); }
        }
        @keyframes hint-blink { 0%,100%{opacity:.4} 50%{opacity:.95} }
        @keyframes clip-glow-a { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.65) saturate(1.4)} }
        @keyframes clip-cut-a  { 0%{transform:scaleX(1)} 22%{transform:scaleX(0.06)} 48%{transform:scaleX(1)} 100%{transform:scaleX(1)} }
        @keyframes clip-fade-a { 0%,100%{opacity:1} 50%{opacity:.08} }
        .eve-orbit-idle   { animation: eve-orbit-idle  2.5s ease-in-out infinite; will-change: filter; }
        .eve-orbit-burst  { animation: eve-orbit-burst 0.52s ease-out forwards; }
        .clip-glow { animation: clip-glow-a 0.75s ease-in-out; }
        .clip-cut  { animation: clip-cut-a  0.65s ease-in-out; }
        .clip-fade { animation: clip-fade-a 0.95s ease-in-out; }
        .hint-blink{ animation: hint-blink  1.8s  ease-in-out infinite; }
      `}</style>

      {/* Outer responsive wrapper */}
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: B * scale }}
      >
        {/* Fixed 500×500 internal canvas, scaled to container width */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: B, height: B,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}>

          {/* Ambient glow blob */}
          <div style={{
            position: 'absolute',
            left: CX - 240, top: CY - 240,
            width: 480, height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,.2) 0%, transparent 68%)',
            pointerEvents: 'none',
            opacity: activated ? 1 : 0.55,
            transition: 'opacity 1.2s',
          }} />

          {/* Orbit ring */}
          <svg style={{
            position: 'absolute', top: 0, left: 0,
            width: B, height: B, pointerEvents: 'none',
            opacity: orbitVisible ? 1 : 0,
            transition: 'opacity 1s ease',
          }}>
            {/* Soft outer glow */}
            <ellipse cx={CX} cy={CY} rx={RX + 1} ry={RY + 1}
              fill="none" stroke="rgba(139,92,246,.07)" strokeWidth={8} />
            {/* Main dashed track */}
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
              fill="none"
              stroke="rgba(139,92,246,.24)"
              strokeWidth={1.5}
              strokeDasharray="6 9"
            />
          </svg>

          {/* Back clips (top arc — rendered behind robot) */}
          {activated && back.map(({ p, i }) => (
            <div key={`b${i}`} style={{
              position: 'absolute',
              left: p.x - CW / 2, top: p.y - CH / 2,
              width: CW, height: CH,
              transform: `scale(${ds(p.depth)})`,
              transformOrigin: 'center',
              zIndex: Math.round(p.y * 0.4),
              opacity: orbitVisible ? 0.78 : 0,
              transition: 'opacity .8s ease',
            }}>
              <Clip label={CLIPS[i].label} color={CLIPS[i].color} action={clipActions[i]} />
            </div>
          ))}

          {/* Robot — center, z=8 so it sits between back/front clips */}
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              left: CX - 110, top: CY - 112,
              width: 220, height: 220,
              zIndex: 8,
              cursor: activated ? 'default' : 'pointer',
            }}
            className={bursting ? 'eve-orbit-burst' : 'eve-orbit-idle'}
          >
            <Image src="/logo-icon.png" alt="E.V.E." width={220} height={220} priority />
          </div>

          {/* Front clips (bottom arc — rendered in front of robot) */}
          {activated && front.map(({ p, i }) => (
            <div key={`f${i}`} style={{
              position: 'absolute',
              left: p.x - CW / 2, top: p.y - CH / 2,
              width: CW, height: CH,
              transform: `scale(${ds(p.depth)})`,
              transformOrigin: 'center',
              zIndex: Math.round(p.y * 0.4),
              opacity: orbitVisible ? 1 : 0,
              transition: 'opacity .8s ease',
            }}>
              <Clip label={CLIPS[i].label} color={CLIPS[i].color} action={clipActions[i]} />
            </div>
          ))}

          {/* Click hint */}
          {!activated && !bursting && (
            <div className="hint-blink" style={{
              position: 'absolute',
              left: '50%', top: CY + 134,
              transform: 'translateX(-50%)',
              color: 'rgba(139,92,246,.85)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              zIndex: 20,
              pointerEvents: 'none',
            }}>
              tap to activate
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Clip block ─────────────────────────────────────────────────────────────────
function Clip({ label, color, action }: { label: string; color: string; action: Action }) {
  return (
    <div
      className={
        action === 'glow' ? 'clip-glow' :
        action === 'cut'  ? 'clip-cut'  :
        action === 'fade' ? 'clip-fade' : ''
      }
      style={{
        width: '100%', height: '100%',
        background: 'rgba(10,10,18,.94)',
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 4,
        display: 'flex', alignItems: 'center',
        paddingLeft: 7, paddingRight: 5,
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: color, marginRight: 5, flexShrink: 0, opacity: .9,
      }} />
      <span style={{
        color: 'rgba(255,255,255,.58)',
        fontSize: 9,
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        letterSpacing: '.02em',
      }}>
        {label}
      </span>
    </div>
  )
}
