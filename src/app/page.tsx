'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import AnimatedDashboard from '@/components/AnimatedDashboard'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">

      <style>{`
        /* Robot glow pulse */
        @keyframes eve-pulse {
          0%, 100% {
            filter:
              drop-shadow(0 0 30px rgba(139,92,246,0.7))
              drop-shadow(0 0 70px rgba(124,58,237,0.4))
              drop-shadow(0 0 120px rgba(109,40,217,0.2));
          }
          50% {
            filter:
              drop-shadow(0 0 60px rgba(167,139,250,1))
              drop-shadow(0 0 120px rgba(139,92,246,0.7))
              drop-shadow(0 0 200px rgba(124,58,237,0.4));
          }
        }

        /* Silky vertical flows */
        @keyframes silk-rise {
          0%   { transform: translateY(100%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }

        /* CTA shimmer */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .eve-pulse { animation: eve-pulse 2.5s ease-in-out infinite; }

        .cta-primary {
          background: linear-gradient(
            90deg,
            #7c3aed 0%,
            #8b5cf6 40%,
            #a78bfa 50%,
            #8b5cf6 60%,
            #7c3aed 100%
          );
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          box-shadow: 0 0 24px rgba(124,58,237,0.5), 0 0 60px rgba(124,58,237,0.2);
          transition: box-shadow 0.3s;
        }

        .cta-primary:hover {
          box-shadow: 0 0 36px rgba(139,92,246,0.7), 0 0 80px rgba(124,58,237,0.35);
        }

        .silk-wrap {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .silk {
          position: absolute;
          bottom: 0;
          width: 1px;
          height: 60%;
          background: linear-gradient(to top, transparent, rgba(139,92,246,0.6), rgba(167,139,250,0.8), rgba(139,92,246,0.6), transparent);
          animation: silk-rise linear infinite;
          filter: blur(0.5px);
        }

        .silk-wide {
          position: absolute;
          bottom: 0;
          width: 3px;
          height: 45%;
          background: linear-gradient(to top, transparent, rgba(124,58,237,0.25), rgba(139,92,246,0.35), rgba(124,58,237,0.25), transparent);
          animation: silk-rise linear infinite;
          filter: blur(2px);
        }
      `}</style>

      {/* Beta announcement bar */}
      <div className="bg-violet-950/60 border-b border-violet-800/40 text-center py-2.5 px-4">
        <p className="text-violet-300 text-sm">
          E.V.E. is in <span className="font-bold text-violet-200">closed beta</span> —{' '}
          <button
            onClick={() => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' })}
            className="underline text-violet-200 hover:text-white transition font-medium"
          >
            apply for founding member access
          </button>
        </p>
      </div>

      {/* Nav — desktop: single row | mobile: logo top, buttons bottom */}
      <nav className="border-b border-zinc-900">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between px-6" style={{height: 100}}>
          <Image src="/logo-full.png" alt="The E.V.E. Studio" width={325} height={53} priority />
          <div className="flex items-center gap-6">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-zinc-300 hover:text-white transition text-xl">Features</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-zinc-300 hover:text-white transition text-xl">Pricing</button>
            <button onClick={() => document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' })} className="text-violet-400 hover:text-violet-300 transition text-xl font-semibold">Beta ✦</button>
            <button onClick={() => router.push('/auth/login')} className="text-zinc-300 hover:text-white transition text-xl">Sign in</button>
            <button onClick={() => router.push('/auth/signup')} className="cta-primary text-white font-bold px-6 py-3 rounded-lg text-lg">Get started free</button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden flex-col items-center py-4 gap-3 px-4">
          <Image src="/logo-full.png" alt="The E.V.E. Studio" width={200} height={33} priority />
          <div className="flex w-full gap-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition text-white font-semibold py-3 rounded-lg text-sm"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="flex-1 cta-primary text-white font-bold py-3 rounded-lg text-sm"
            >
              Start free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-4xl mx-auto px-6 pt-14 pb-20 text-center overflow-visible">

        <h1 className="text-6xl font-bold leading-tight tracking-tight mb-2 relative z-10">
          Introducing E.V.E.
        </h1>
        <p className="text-zinc-500 text-xl font-medium mb-1 tracking-wide relative z-10">(Script. Film. Edit. Repeat.)</p>

        {/* Robot + silky background */}
        <div className="relative flex justify-center" style={{marginTop: '8px', marginBottom: '-80px'}}>
          {/* Silk background */}
          <div className="silk-wrap" style={{width: 440, height: 440, left: '50%', transform: 'translateX(-50%)'}}>
            <div className="silk" style={{left:'15%', animationDuration:'6s', animationDelay:'0s', height:'55%'}} />
            <div className="silk" style={{left:'25%', animationDuration:'8s', animationDelay:'1.5s', height:'70%'}} />
            <div className="silk" style={{left:'38%', animationDuration:'7s', animationDelay:'0.8s', height:'60%'}} />
            <div className="silk" style={{left:'50%', animationDuration:'9s', animationDelay:'2.2s', height:'80%'}} />
            <div className="silk" style={{left:'62%', animationDuration:'6.5s', animationDelay:'0.4s', height:'65%'}} />
            <div className="silk" style={{left:'75%', animationDuration:'8.5s', animationDelay:'1.1s', height:'55%'}} />
            <div className="silk" style={{left:'85%', animationDuration:'7.5s', animationDelay:'3s', height:'70%'}} />
            <div className="silk-wide" style={{left:'30%', animationDuration:'11s', animationDelay:'0s'}} />
            <div className="silk-wide" style={{left:'55%', animationDuration:'13s', animationDelay:'2s'}} />
            <div className="silk-wide" style={{left:'72%', animationDuration:'10s', animationDelay:'1s'}} />
          </div>

          {/* Robot */}
          <div className="eve-pulse relative z-10">
            <Image src="/logo-icon.png" alt="E.V.E." width={440} height={440} priority />
          </div>
        </div>

        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-8 leading-relaxed relative z-10">
          VIBE writes your scripts. E.V.E. powers your edit inside Premiere Pro.<br />
          You focus on what only you can do — being behind the lens.
        </p>
        <div className="flex flex-col items-center gap-3 relative z-10">
          <button
            onClick={() => router.push('/auth/signup')}
            className="cta-primary text-white font-bold px-10 py-5 rounded-2xl text-xl"
          >
            Start for free — no card needed
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-zinc-500 hover:text-white transition text-base py-2"
          >
            See how it works ↓
          </button>
        </div>
        <p className="text-zinc-500 text-base mt-4 relative z-10">3 free VIBE tokens on signup · cancel anytime</p>
        <p className="text-zinc-600 text-base mt-1 relative z-10">Built by a video editor, for video editors.</p>
      </section>

      {/* Animated Dashboard */}
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <p className="text-center text-zinc-400 text-base uppercase tracking-widest font-semibold mb-5">Watch VIBE work in real time</p>
        <AnimatedDashboard />
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 mb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything your production needs</h2>
        <p className="text-zinc-500 text-center mb-14 max-w-xl mx-auto">Built for editors who manage multiple clients and need to move fast without sacrificing quality.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon="⚡" title="VIBE Script Engine" description="Generate scroll-stopping video scripts trained on your client's brand, audience, and goals. 1 token = 1 script. Never generic." />
          <FeatureCard icon="🎯" title="Client Themes" description="Build a deep brand profile for each client. VIBE uses it to write scripts that actually sound like them — not like every other account." />
          <FeatureCard icon="✏️" title="Edit & Restore" description="Edit any generated script directly in the platform. Changed your mind? Restore the original with one click — no lost work." />
          <FeatureCard icon="🎬" title="Premiere Pro Plugin" description="E.V.E. lives inside Adobe Premiere Pro. Access your scripts, client notes, and files without ever leaving your timeline." />
          <FeatureCard icon="📁" title="Client Management" description="Every client's brand, scripts, and notes — organized in one place. Built for editors juggling multiple accounts at once." />
          <FeatureCard icon="🔗" title="Share with clients" description="Send one link — your client sees every script you made for them, hearts the ones they love, and you know exactly which to film first." />
        </div>

        {/* Share callout */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-lg mb-1">Share all your client&apos;s scripts with one link.</p>
            <p className="text-zinc-500 text-sm">They open it, read through, and heart the ones they love. You see the picks instantly — no back-and-forth, no confusion.</p>
          </div>
          <button
            onClick={() => router.push('/auth/signup')}
            className="shrink-0 border border-violet-600 hover:bg-violet-600 transition text-violet-300 hover:text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Try it free →
          </button>
        </div>
      </section>

      {/* VIBE breakdown */}
      <section className="bg-zinc-950 border-t border-b border-zinc-900 py-20 mb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-3">The script engine</p>
            <h2 className="text-3xl font-bold mb-3">E.V.E. is a VIBE.</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">Video Idea Batch Engine — the AI script writer built into your workflow. Give it a client, tell it what you need, and it delivers production-ready scripts in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Step number="1" title="Pick a client theme" description="Select the brand profile you've built — their audience, platforms, voice, and goals." />
              <Step number="2" title="Customize (optional)" description="Specify a topic, hook style, tone, or CTA override. Or leave it blank — VIBE knows what to do." />
              <Step number="3" title="Generate" description="Scripts come back in seconds with hooks, body lines, CTA, b-roll notes, and a virality score." />
              <Step number="4" title="Edit, share, or use" description="Refine in the platform, share a link with your client, or export as PDF. One click either way." />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-violet-400">Generated script</p>
                <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">9/10 virality</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Hook</p>
                <p className="text-white font-medium">"The #1 mistake buyers make in this market — and how to avoid it."</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Body</p>
                <p className="text-zinc-300 text-sm">Most buyers lowball and lose the house.</p>
                <p className="text-zinc-300 text-sm">Here's what the data actually says.</p>
                <p className="text-zinc-300 text-sm">In this market, strategy beats price every time.</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">CTA</p>
                <p className="text-white text-sm">DM me "READY" and I'll send you the full buyer's guide.</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">B-roll notes</p>
                <p className="text-zinc-500 text-xs">· Exterior home shot, wide angle</p>
                <p className="text-zinc-500 text-xs">· Phone screen showing offer amount</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta */}
      <BetaSection />

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 mb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-zinc-500 text-center mb-14">Start free. Scale when you're ready.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col">
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">Starter</p>
              <p className="text-4xl font-bold mb-1">$0</p>
              <p className="text-zinc-500 text-sm mb-6">forever</p>
              <ul className="space-y-2 text-sm text-zinc-400 mb-8">
                <li>✓ 3 VIBE tokens on signup</li>
                <li>✓ Unlimited client themes</li>
                <li>✓ Script editing + restore</li>
                <li>✓ Full dashboard access</li>
                <li>✓ Buy more tokens anytime</li>
              </ul>
            </div>
            <button onClick={() => router.push('/auth/signup')} className="w-full border border-zinc-700 hover:border-violet-500 transition text-white font-semibold py-3 rounded-xl text-sm">
              Get started free
            </button>
          </div>

          {/* EVE Monthly */}
          <div className="bg-violet-950/30 border border-violet-600 rounded-2xl p-7 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Most popular</div>
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">EVE Monthly</p>
              <p className="text-4xl font-bold mb-1">$39</p>
              <p className="text-zinc-500 text-sm mb-6">per month · cancel anytime</p>
              <ul className="space-y-2 text-sm text-zinc-300 mb-8">
                <li>✓ Everything in Starter</li>
                <li>✓ Premiere Pro plugin (E.V.E.)</li>
                <li>✓ In-timeline script access</li>
                <li>✓ Client file management in-app</li>
                <li>✓ Early access to new features</li>
              </ul>
            </div>
            <BetaGatedButton className="w-full bg-violet-600 hover:bg-violet-500 transition text-white font-bold py-3 rounded-xl text-sm">
              Apply for Beta Access
            </BetaGatedButton>
          </div>

          {/* Tokens */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col">
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">VIBE Tokens</p>
              <p className="text-4xl font-bold mb-1">from <span className="text-2xl">$0.60</span><span className="text-lg font-normal text-zinc-500">/script</span></p>
              <p className="text-zinc-500 text-sm mb-6">pay as you go · no subscription</p>
              <ul className="space-y-2 text-sm text-zinc-400 mb-8">
                <li>✓ 5 tokens — $4</li>
                <li>✓ 15 tokens — $10 <span className="text-violet-400 text-xs">best value</span></li>
                <li>✓ 30 tokens — $18</li>
                <li>✓ Never expire</li>
                <li>✓ Available on any plan</li>
              </ul>
            </div>
            <BetaGatedButton className="w-full border border-zinc-700 hover:border-violet-500 transition text-white font-semibold py-3 rounded-xl text-sm">
              Apply for Beta Access
            </BetaGatedButton>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <div className="bg-violet-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to produce more?</h2>
          <p className="text-violet-200 mb-2 text-xl font-medium">All you need to do is film.</p>
          <p className="text-violet-300 text-sm mb-8">VIBE handles your scripts. E.V.E. handles your edit.</p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-white text-violet-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-violet-50 transition"
          >
            Get started free — no card needed
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-600 text-sm">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="text-zinc-500">© 2026 The E.V.E. Studio. All rights reserved.</span>
          <span className="text-zinc-600 text-xs">Built by a video editor, for video editors.</span>
        </div>
        <div className="flex gap-6">
          <button className="hover:text-white transition">Privacy</button>
          <button className="hover:text-white transition">Terms</button>
          <button onClick={() => router.push('/auth/login')} className="hover:text-white transition">Sign in</button>
        </div>
      </footer>

    </div>
  )
}

function BetaGatedButton({ className, children }: { className: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <button className={className} onClick={() => setShow(true)}>{children}</button>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" onClick={() => setShow(false)}>
          <div className="bg-zinc-900 border border-violet-700 rounded-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <span className="inline-block bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">Beta Mode</span>
            <h3 className="text-xl font-bold mb-3">E.V.E. is in closed beta.</h3>
            <p className="text-zinc-400 text-sm mb-6">Paid plans aren&apos;t open yet. Apply for founding member access — it&apos;s free during beta, and you lock in a discounted rate at launch.</p>
            <button
              onClick={() => { setShow(false); document.getElementById('beta')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="w-full cta-primary text-white font-bold py-3 rounded-xl text-sm mb-3"
            >
              Apply for Beta Access
            </button>
            <button onClick={() => setShow(false)} className="text-zinc-600 text-xs hover:text-zinc-400 transition">Close</button>
          </div>
        </div>
      )}
    </>
  )
}

function BetaSection() {
  const [form, setForm] = useState({ name: '', email: '', use_case: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.already) setStatus('already')
      else if (data.success) setStatus('success')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="beta" className="max-w-3xl mx-auto px-6 mb-24">
      <div className="relative bg-zinc-950 border border-violet-800/50 rounded-2xl px-8 py-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)'}} />

        <div className="relative z-10 text-center mb-8">
          <span className="inline-block bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-5">Now in Beta</span>
          <h2 className="text-3xl font-bold mb-3">Be a Founding Member.</h2>
          <p className="text-zinc-400 max-w-lg mx-auto mb-2">Full access — free while we&apos;re in beta. No card, no commitment.</p>
          <p className="text-zinc-500 text-sm">Founding members lock in a discounted rate forever when we launch. Spots are limited — we review every application personally.</p>
        </div>

        {status === 'success' && (
          <div className="text-center bg-violet-950/50 border border-violet-700 rounded-xl px-6 py-6 text-violet-300 font-medium">
            Application received. We&apos;ll review it and reach out soon — welcome to the crew.
          </div>
        )}
        {status === 'already' && (
          <div className="text-center bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-400">
            You&apos;re already on the list. We&apos;ve got you.
          </div>
        )}
        {status === 'error' && (
          <div className="text-center bg-red-950/40 border border-red-800 rounded-xl px-6 py-4 text-red-400 text-sm">
            Something went wrong — try again or reach out at theevestudio.io
          </div>
        )}

        {(status === 'idle' || status === 'loading') && (
          <form onSubmit={submit} className="max-w-md mx-auto space-y-3">
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600"
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600"
            />
            <textarea
              placeholder="How do you plan to use E.V.E.? (optional — but it helps)"
              value={form.use_case}
              onChange={e => setForm(f => ({...f, use_case: e.target.value}))}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600 resize-none"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full cta-primary text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : 'Apply for Beta Access'}
            </button>
          </form>
        )}

        <p className="text-center text-zinc-600 text-xs mt-5">No spam. We only reach out when your access is ready.</p>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <p className="text-2xl mb-3">{icon}</p>
      <p className="font-bold mb-2">{title}</p>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{number}</div>
      <div>
        <p className="font-semibold mb-1">{title}</p>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
