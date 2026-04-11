'use client'

import { useEffect, useState } from 'react'

const SCENARIOS = [
  {
    client: 'Coastal Key Realty',
    industry: 'Real Estate',
    customPrompt: null,
    script: {
      hook: '"Nobody tells you this about pricing your home in a buyer\'s market."',
      body: ['Most sellers guess. Buyers know.', 'Here\'s what the data actually says.', 'Price it right the first time or pay for it later.'],
      cta: 'DM me "PRICE" and I\'ll send you the full breakdown.',
      hookType: 'Curiosity gap',
      virality: 9,
      duration: '45s',
    },
  },
  {
    client: 'FitLife Coaching',
    industry: 'Fitness',
    customPrompt: 'Bold hook · gym motivation · direct tone',
    script: {
      hook: '"You\'re not tired. You\'re just not ready to be great yet."',
      body: ['Every elite athlete felt exactly what you feel right now.', 'The difference? They showed up anyway.', 'One rep. One day. One decision.'],
      cta: 'Drop a 💪 if you\'re showing up today.',
      hookType: 'Bold statement',
      virality: 8,
      duration: '30s',
    },
  },
  {
    client: 'The Money Edit',
    industry: 'Finance & Investing',
    customPrompt: 'Curiosity gap · passive income · myth-busting',
    script: {
      hook: '"Everyone\'s talking about passive income. Nobody\'s telling you the truth."',
      body: ['It\'s not passive.', 'It takes years of active work to build.', 'But once it\'s built — it changes everything.'],
      cta: 'Follow for the real numbers, not the highlight reel.',
      hookType: 'Curiosity gap',
      virality: 10,
      duration: '35s',
    },
  },
]

type Phase = 'switching' | 'typing-prompt' | 'generating' | 'showing'

export default function AnimatedDashboard() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('showing')
  const [typedHook, setTypedHook] = useState(SCENARIOS[0].script.hook)
  const [typedPrompt, setTypedPrompt] = useState('')
  const [showBody, setShowBody] = useState(true)

  const scenario = SCENARIOS[scenarioIndex]
  const next = SCENARIOS[(scenarioIndex + 1) % SCENARIOS.length]

  useEffect(() => {
    // After 5s of showing, start transition
    const showTimer = setTimeout(() => {
      setPhase('switching')
      setShowBody(false)

      // After switch animation (1.5s), type prompt if exists
      setTimeout(() => {
        const nextScenario = SCENARIOS[(scenarioIndex + 1) % SCENARIOS.length]
        if (nextScenario.customPrompt) {
          setPhase('typing-prompt')
          setTypedPrompt('')
          typeString(nextScenario.customPrompt, setTypedPrompt, () => {
            setTimeout(() => {
              setPhase('generating')
              setTimeout(() => {
                setScenarioIndex(i => (i + 1) % SCENARIOS.length)
                setTypedHook('')
                setPhase('showing')
                setTimeout(() => setShowBody(true), 800)
                typeString(nextScenario.script.hook, setTypedHook, () => {})
              }, 1800)
            }, 600)
          })
        } else {
          setPhase('generating')
          setTimeout(() => {
            setScenarioIndex(i => (i + 1) % SCENARIOS.length)
            setTypedHook('')
            setTypedPrompt('')
            setPhase('showing')
            setTimeout(() => setShowBody(true), 800)
            typeString(nextScenario.script.hook, setTypedHook, () => {})
          }, 1800)
        }
      }, 1200)
    }, 6000)

    return () => clearTimeout(showTimer)
  }, [scenarioIndex])

  // Seed first hook on mount
  useEffect(() => {
    setTypedHook('')
    typeString(SCENARIOS[0].script.hook, setTypedHook, () => {})
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <p className="text-zinc-600 text-xs font-mono">EVE Studio · VIBE</p>
        <div className="w-16" />
      </div>

      <div className="p-6">
        {/* Client selector */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${phase === 'generating' ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Active client</p>
              <p className={`font-bold text-sm transition-all duration-500 ${phase === 'switching' ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                {phase === 'switching' ? next.client : scenario.client}
                <span className="text-zinc-600 font-normal ml-2">· {phase === 'switching' ? next.industry : scenario.industry}</span>
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
            phase === 'generating' ? 'bg-violet-900/60 text-violet-300 animate-pulse' : 'bg-emerald-900/40 text-emerald-400'
          }`}>
            {phase === 'generating' ? 'VIBE generating...' : 'Ready'}
          </span>
        </div>

        {/* Custom prompt (shown when applicable) */}
        {(phase === 'typing-prompt' || (typedPrompt && phase === 'generating')) && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <span className="text-violet-400 text-xs font-semibold shrink-0">Custom:</span>
            <span className="text-zinc-300 text-xs font-mono">
              {typedPrompt}
              {phase === 'typing-prompt' && <span className="animate-pulse">|</span>}
            </span>
          </div>
        )}

        {/* Script output */}
        <div className={`bg-violet-950/30 border border-violet-800/60 rounded-xl p-5 transition-all duration-500 ${phase === 'switching' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-violet-400 font-semibold uppercase tracking-widest">
              {phase === 'generating' ? 'VIBE is writing...' : 'Generated script — Hook'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full transition-all ${phase === 'generating' ? 'bg-zinc-800 text-zinc-600' : 'bg-violet-900 text-violet-300'}`}>
              {phase === 'generating' ? '···' : `${scenario.script.virality}/10 virality`}
            </span>
          </div>

          {phase === 'generating' ? (
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-4/5" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/5" />
            </div>
          ) : (
            <>
              <p className="text-white font-semibold text-base leading-relaxed min-h-[48px]">
                {typedHook}
                {typedHook.length < scenario.script.hook.length && <span className="animate-pulse">|</span>}
              </p>

              <div className={`mt-4 space-y-1 transition-all duration-700 ${showBody ? 'opacity-100' : 'opacity-0'}`}>
                {scenario.script.body.map((line, i) => (
                  <p key={i} className="text-zinc-400 text-sm">{line}</p>
                ))}
                <p className="text-zinc-300 text-sm font-medium mt-2">{scenario.script.cta}</p>
              </div>

              <div className={`flex items-center gap-3 mt-4 pt-3 border-t border-violet-800/40 transition-all duration-700 ${showBody ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{scenario.script.hookType}</span>
                <span className="text-xs text-zinc-600">Est. {scenario.script.duration}</span>
              </div>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-5">
          {SCENARIOS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i === scenarioIndex ? 'w-5 h-1.5 bg-violet-500' : 'w-1.5 h-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function typeString(str: string, setter: (s: string) => void, onDone: () => void) {
  let i = 0
  const interval = setInterval(() => {
    i++
    setter(str.slice(0, i))
    if (i >= str.length) {
      clearInterval(interval)
      onDone()
    }
  }, 28)
  return interval
}
