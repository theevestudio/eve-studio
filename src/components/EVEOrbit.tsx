'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const B   = 560   // internal canvas
const CX  = 280   // center
const CY  = 292
const ROB = 210   // robot display size

// ── Three orbital tracks (V3 outer → V1 inner) ───────────────────────────────
const TRACKS = [
  {
    rx: 210, ry: 78, period: 28000, h: 27,
    color: '#c026d3',
    clips: [
      { label: 'BROLL_01',  w: 94  },
      { label: 'CUTAWAY',   w: 118 },
      { label: 'BROLL_02',  w: 80  },
      { label: 'OVERLAY',   w: 92  },
    ],
    startAngles: [0.15, 2.0, 3.7, 5.2],
  },
  {
    rx: 168, ry: 62, period: 22000, h: 27,
    color: '#0284c7',
    clips: [
      { label: 'HOOK',         w: 106 },
      { label: 'TALKING_HEAD', w: 130 },
      { label: 'CTA',          w: 84  },
      { label: 'CUTAWAY_2',    w: 72  },
    ],
    startAngles: [0.55, 2.25, 3.9, 5.4],
  },
  {
    rx: 128, ry: 47, period: 18000, h: 27,
    color: '#d97706',
    clips: [
      { label: 'MAIN_01',    w: 116 },
      { label: 'MAIN_02',    w: 90  },
      { label: 'TITLE_CARD', w: 84  },
      { label: 'MAIN_03',    w: 108 },
    ],
    startAngles: [0.3, 2.1, 3.65, 5.15],
  },
]

type Action = 'normal' | 'glow' | 'cut' | 'fade'
type ClipPos = { x: number; y: number; depth: number }

export default function EVEOrbit() {
  const containerRef = useRef<HTMLDivElement>(null)
  const anglesRef    = useRef(TRACKS.map(t => t.startAngles.slice()))
  const lastTimeRef  = useRef<number | null>(null)
  const rafRef       = useRef<number | null>(null)
  const actionTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [scale, setScale]               = useState<number>(0.6)
  const [activated, setActivated]       = useState(false)
  const [bursting, setBursting]         = useState(false)
  const [orbitVisible, setOrbitVisible] = useState(false)

  const [actions, setActions] = useState<Action[][]>(
    TRACKS.map(t => t.clips.map(() => 'normal'))
  )
  const [positions, setPositions] = useState<ClipPos[][]>(
    TRACKS.map(t =>
      t.startAngles.map(a => ({
        x: CX + t.rx * Math.cos(a),
        y: CY + t.ry * Math.sin(a),
        depth: (CY + t.ry * Math.sin(a) - (CY - t.ry)) / (2 * t.ry),
      }))
    )
  )

  // Responsive scale
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      if (w > 0) setScale(w / B)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // RAF orbit loop
  useEffect(() => {
    if (!activated) return
    lastTimeRef.current = null

    function tick(t: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = t
      const dt = Math.min(t - lastTimeRef.current, 50)
      lastTimeRef.current = t

      const next = anglesRef.current.map((tAngles, ti) =>
        tAngles.map(a => a + (2 * Math.PI / TRACKS[ti].period) * dt)
      )
      anglesRef.current = next

      setPositions(next.map((tAngles, ti) =>
        tAngles.map(a => {
          const { rx, ry } = TRACKS[ti]
          const y = CY + ry * Math.sin(a)
          return {
            x: CX + rx * Math.cos(a),
            y,
            depth: (y - (CY - ry)) / (2 * ry),
          }
        })
      ))

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [activated])

  // Micro-actions
  useEffect(() => {
    if (!activated) return

    function next() {
      const ti     = Math.floor(Math.random() * TRACKS.length)
      const ci     = Math.floor(Math.random() * TRACKS[ti].clips.length)
      const pool: Action[] = ['cut', 'cut', 'glow', 'glow', 'fade', 'cut']
      const action = pool[Math.floor(Math.random() * pool.length)]
      const dur    = action === 'cut' ? 950 : action === 'fade' ? 1050 : 820

      setActions(prev => { const n = prev.map(r => [...r]); n[ti][ci] = action; return n })
      setTimeout(() => {
        setActions(prev => { const n = prev.map(r => [...r]); n[ti][ci] = 'normal'; return n })
      }, dur)

      actionTimer.current = setTimeout(next, 1100 + Math.random() * 1700)
    }

    actionTimer.current = setTimeout(next, 2400)
    return () => { if (actionTimer.current) clearTimeout(actionTimer.current) }
  }, [activated])

  function handleClick() {
    if (activated || bursting) return
    setBursting(true)
    setTimeout(() => {
      setActivated(true)
      setBursting(false)
      setTimeout(() => setOrbitVisible(true), 200)
    }, 520)
  }

  // Collect + depth-sort all clips
  const allClips = TRACKS.flatMap((_, ti) =>
    positions[ti].map((pos, ci) => ({ ti, ci, pos, action: actions[ti][ci] }))
  ).sort((a, b) => a.pos.y - b.pos.y)

  const backClips  = allClips.filter(c => c.pos.y <  CY)
  const frontClips = allClips.filter(c => c.pos.y >= CY)

  return (
    <>
      <style>{`
        @keyframes eve-orbit-idle {
          0%,100% { filter:drop-shadow(0 0 18px rgba(139,92,246,.65)) drop-shadow(0 0 40px rgba(124,58,237,.35)); }
          50%     { filter:drop-shadow(0 0 38px rgba(167,139,250,.95)) drop-shadow(0 0 76px rgba(139,92,246,.55)); }
        }
        @keyframes eve-orbit-burst {
          0%   { transform:scale(1);    filter:drop-shadow(0 0 20px rgba(139,92,246,.7)); }
          38%  { transform:scale(1.22); filter:drop-shadow(0 0 100px rgba(167,139,250,1)) drop-shadow(0 0 160px rgba(139,92,246,.9)); }
          68%  { transform:scale(0.96); filter:drop-shadow(0 0 32px rgba(139,92,246,.6)); }
          100% { transform:scale(1);    filter:drop-shadow(0 0 22px rgba(139,92,246,.7)); }
        }
        @keyframes hint-blink { 0%,100%{opacity:.38} 50%{opacity:.9} }
        @keyframes clip-glow-kf { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.75) saturate(1.4)} }
        @keyframes clip-fade-kf { 0%,100%{opacity:1} 48%{opacity:.05} }
        @keyframes cut-body-kf  {
          0%,100%{filter:none}
          18%{filter:brightness(1.6) saturate(1.3)}
          50%{filter:brightness(1)}
        }
        @keyframes cut-blade-kf {
          0%   {opacity:0; transform:scaleY(0.15);}
          18%  {opacity:1; transform:scaleY(1.18); box-shadow:0 0 14px 5px rgba(139,92,246,1),0 0 32px 10px rgba(139,92,246,.5);}
          65%  {opacity:1; transform:scaleY(1);    box-shadow:0 0 8px 3px rgba(139,92,246,.7);}
          100% {opacity:0; transform:scaleY(0.15);}
        }
        @keyframes cut-left-kf  {0%,100%{transform:translateX(0)} 20%,80%{transform:translateX(-3px)}}
        @keyframes cut-right-kf {0%,100%{transform:translateX(0)} 20%,80%{transform:translateX( 3px)}}
        .eve-orbit-idle  {animation:eve-orbit-idle  2.5s ease-in-out infinite; will-change:filter;}
        .eve-orbit-burst {animation:eve-orbit-burst 0.52s ease-out forwards;}
        .clip-glow       {animation:clip-glow-kf 0.82s ease-in-out;}
        .clip-fade       {animation:clip-fade-kf 1.05s ease-in-out;}
        .clip-cut-body   {animation:cut-body-kf  0.95s ease-in-out;}
        .cut-half-left   {animation:cut-left-kf  0.95s ease-in-out;}
        .cut-half-right  {animation:cut-right-kf 0.95s ease-in-out;}
        .cut-blade       {animation:cut-blade-kf 0.95s ease-in-out forwards;}
        .hint-blink      {animation:hint-blink   1.8s ease-in-out infinite;}
      `}</style>

      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: B * scale }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: B, height: B,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}>

          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            left: CX - 250, top: CY - 250,
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,.16) 0%, transparent 68%)',
            pointerEvents: 'none',
            opacity: activated ? 1 : 0.5,
            transition: 'opacity 1.2s',
          }} />

          {/* Orbit track rings */}
          <svg style={{
            position: 'absolute', top: 0, left: 0,
            width: B, height: B, pointerEvents: 'none',
            opacity: orbitVisible ? 1 : 0,
            transition: 'opacity 1s ease',
          }}>
            {TRACKS.map((t, ti) => {
              const c = ti === 0 ? '192,38,211' : ti === 1 ? '2,132,199' : '217,119,6'
              return (
                <g key={ti}>
                  <ellipse cx={CX} cy={CY} rx={t.rx + 1} ry={t.ry + 1}
                    fill="none" stroke={`rgba(${c},.06)`} strokeWidth={7} />
                  <ellipse cx={CX} cy={CY} rx={t.rx} ry={t.ry}
                    fill="none" stroke={`rgba(${c},.18)`}
                    strokeWidth={1.2} strokeDasharray="5 8" />
                </g>
              )
            })}
          </svg>

          {/* Back clips (behind robot) */}
          {activated && backClips.map(({ ti, ci, pos, action }) => (
            <ClipBlock
              key={`b-${ti}-${ci}`}
              clip={TRACKS[ti].clips[ci]}
              color={TRACKS[ti].color}
              h={TRACKS[ti].h}
              pos={pos}
              action={action}
              visible={orbitVisible}
              zIndex={Math.round(pos.y * 0.28)}
            />
          ))}

          {/* Robot */}
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              left: CX - ROB / 2, top: CY - ROB / 2,
              width: ROB, height: ROB,
              zIndex: 8,
              cursor: activated ? 'default' : 'pointer',
            }}
            className={bursting ? 'eve-orbit-burst' : 'eve-orbit-idle'}
          >
            <Image src="/logo-icon.png" alt="E.V.E." width={ROB} height={ROB} priority />
          </div>

          {/* Front clips (in front of robot) */}
          {activated && frontClips.map(({ ti, ci, pos, action }) => (
            <ClipBlock
              key={`f-${ti}-${ci}`}
              clip={TRACKS[ti].clips[ci]}
              color={TRACKS[ti].color}
              h={TRACKS[ti].h}
              pos={pos}
              action={action}
              visible={orbitVisible}
              zIndex={Math.round(pos.y * 0.28)}
            />
          ))}

          {/* Hint */}
          {!activated && !bursting && (
            <div className="hint-blink" style={{
              position: 'absolute',
              left: '50%', top: CY + 138,
              transform: 'translateX(-50%)',
              color: 'rgba(139,92,246,.85)',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              zIndex: 20, pointerEvents: 'none',
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
function ClipBlock({
  clip, color, h, pos, action, visible, zIndex,
}: {
  clip: { label: string; w: number }
  color: string
  h: number
  pos: ClipPos
  action: Action
  visible: boolean
  zIndex: number
}) {
  const ds  = 0.70 + 0.44 * pos.depth   // depth scale
  const op  = visible ? (0.52 + 0.48 * pos.depth) : 0

  const base: React.CSSProperties = {
    position: 'absolute',
    left: pos.x - clip.w / 2,
    top:  pos.y - h / 2,
    width: clip.w,
    height: h,
    transform: `scale(${ds})`,
    transformOrigin: 'center',
    zIndex,
    opacity: op,
    transition: 'opacity .8s ease',
    borderRadius: 3,
    overflow: 'visible',
  }

  if (action === 'cut') {
    const hw = (clip.w - 3) / 2
    return (
      <div style={base}>
        {/* Left half */}
        <div className="cut-half-left" style={{
          position: 'absolute', left: 0, top: 0,
          width: hw, height: h,
          background: 'rgba(9,9,16,.95)',
          borderLeft: `3px solid ${color}`,
          borderTop: `1px solid ${color}28`,
          borderBottom: `1px solid ${color}18`,
          borderRadius: '3px 0 0 3px',
          overflow: 'hidden',
        }}>
          <div style={{ height: 6, background: color, opacity: .85 }} />
          <Waveform color={color} count={6} />
        </div>

        {/* Purple cut blade */}
        <div className="cut-blade" style={{
          position: 'absolute',
          left: hw - 0.5, top: -6,
          width: 3, height: h + 12,
          background: 'linear-gradient(180deg, rgba(139,92,246,0) 0%, #7c3aed 20%, #a78bfa 50%, #7c3aed 80%, rgba(139,92,246,0) 100%)',
          borderRadius: 2,
          zIndex: 2,
        }} />

        {/* Right half */}
        <div className="cut-half-right" style={{
          position: 'absolute', left: hw + 3, top: 0,
          width: hw, height: h,
          background: 'rgba(9,9,16,.95)',
          borderRight: `1px solid ${color}18`,
          borderTop: `1px solid ${color}28`,
          borderBottom: `1px solid ${color}18`,
          borderRadius: '0 3px 3px 0',
          overflow: 'hidden',
        }}>
          <div style={{ height: 6, background: color, opacity: .55 }} />
          <Waveform color={color} count={6} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={action === 'glow' ? 'clip-glow' : action === 'fade' ? 'clip-fade' : ''}
      style={{
        ...base,
        background: 'rgba(9,9,16,.95)',
        border: `1px solid ${color}28`,
        borderLeft: `3px solid ${color}`,
        overflow: 'hidden',
      }}
    >
      {/* Color header bar */}
      <div style={{ height: 6, background: color, opacity: .82 }} />
      {/* Label + waveform row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        paddingLeft: 5, height: h - 6, gap: 5,
        overflow: 'hidden',
      }}>
        <span style={{
          color: 'rgba(255,255,255,.48)',
          fontSize: 8, fontFamily: 'monospace',
          whiteSpace: 'nowrap', letterSpacing: '.02em', flexShrink: 0,
        }}>
          {clip.label}
        </span>
        <Waveform color={color} count={9} inline />
      </div>
    </div>
  )
}

// Mini waveform bars
function Waveform({ color, count, inline }: { color: string; count: number; inline?: boolean }) {
  const hs = [5, 9, 6, 11, 8, 7, 10, 5, 9, 7, 6, 8].slice(0, count)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      opacity: .3, flexShrink: 0,
      ...(inline ? {} : { padding: '2px 4px' }),
    }}>
      {hs.map((h, i) => (
        <div key={i} style={{
          width: 1.5, height: h,
          background: color,
          borderRadius: 1,
        }} />
      ))}
    </div>
  )
}
