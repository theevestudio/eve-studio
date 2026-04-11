'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 border-b border-zinc-900" style={{height: 100}}>
        <Image src="/logo-full.png" alt="The E.V.E. Studio" width={325} height={53} priority />
        <div className="flex items-center gap-6">
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-zinc-300 hover:text-white transition text-xl hidden md:block"
          >
            Features
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-zinc-300 hover:text-white transition text-xl hidden md:block"
          >
            Pricing
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-zinc-300 hover:text-white transition text-xl"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white text-lg font-semibold px-6 py-3 rounded-lg"
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-6xl font-bold leading-tight tracking-tight mb-2">
          Introducing E.V.E.
        </h1>
        <p className="text-zinc-500 text-xl font-medium mb-1 tracking-wide">(Script. Film. Edit. Repeat.)</p>

        <div className="flex justify-center" style={{marginTop: '-80px', marginBottom: '-80px'}}>
          <Image src="/logo-icon.png" alt="E.V.E." width={440} height={440} priority />
        </div>

        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          VIBE writes your scripts. E.V.E. powers your edit inside Premiere Pro.<br />
          You focus on what only you can do — being behind the lens.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white font-bold px-8 py-4 rounded-xl text-lg"
          >
            Start for free
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-zinc-400 hover:text-white transition text-sm py-2"
          >
            See how it works ↓
          </button>
        </div>
        <p className="text-zinc-600 text-xs mt-4">No credit card required · 3 free VIBE tokens on signup</p>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-xl p-5 text-left">
              <p className="text-zinc-500 text-xs mb-1">VIBE Tokens</p>
              <p className="text-3xl font-bold text-violet-400">7</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-5 text-left">
              <p className="text-zinc-500 text-xs mb-1">Scripts generated</p>
              <p className="text-3xl font-bold">24</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-5 text-left">
              <p className="text-zinc-500 text-xs mb-1">Client themes</p>
              <p className="text-3xl font-bold">6</p>
            </div>
          </div>
          <div className="bg-violet-600/20 border border-violet-700 rounded-xl p-5 text-left">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest">Generated script — Hook</p>
              <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">9/10 virality</span>
            </div>
            <p className="text-white font-medium text-lg">"Nobody tells you this about selling your home in a buyer's market."</p>
            <p className="text-zinc-500 text-xs mt-2">Hook type: Curiosity gap · Est. duration: 45s</p>
          </div>
        </div>
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
          <FeatureCard icon="📈" title="Built for scale" description="One editor. Ten clients. Scripts in seconds. Your output goes up, your turnaround gets faster, your clients stay happy." />
        </div>
      </section>

      {/* VIBE breakdown */}
      <section className="bg-zinc-950 border-t border-b border-zinc-900 py-20 mb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Meet VIBE</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">Video Idea Batch Engine — the AI script writer built into your workflow. Give it a client, tell it what you need, and it delivers production-ready scripts in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Step number="1" title="Pick a client theme" description="Select the brand profile you've built — their audience, platforms, voice, and goals." />
              <Step number="2" title="Customize (optional)" description="Specify a topic, hook style, tone, or CTA override. Or leave it blank — VIBE knows what to do." />
              <Step number="3" title="Generate" description="Scripts come back in seconds with hooks, body lines, CTA, b-roll notes, and a virality score." />
              <Step number="4" title="Edit and use" description="Refine any script in the platform. Restore the original anytime with one click." />
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
            <button onClick={() => router.push('/auth/signup')} className="w-full bg-violet-600 hover:bg-violet-500 transition text-white font-bold py-3 rounded-xl text-sm">
              Start with EVE
            </button>
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
            <button onClick={() => router.push('/auth/signup')} className="w-full border border-zinc-700 hover:border-violet-500 transition text-white font-semibold py-3 rounded-xl text-sm">
              Buy tokens
            </button>
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
      <footer className="border-t border-zinc-900 px-8 py-8 flex items-center justify-between text-zinc-600 text-sm">
        <span>© 2026 The E.V.E. Studio. All rights reserved.</span>
        <div className="flex gap-6">
          <button className="hover:text-white transition">Privacy</button>
          <button className="hover:text-white transition">Terms</button>
          <button onClick={() => router.push('/auth/login')} className="hover:text-white transition">Sign in</button>
        </div>
      </footer>

    </div>
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
