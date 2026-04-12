'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Pinterest']
const HOOK_STYLES = ['Question', 'Bold statement', 'Story open', 'Contrast/Before-After', 'Curiosity gap', 'Direct offer']
const CONTENT_GOALS = ['Grow audience', 'Drive sales', 'Build trust', 'Educate', 'Entertain', 'Book consultations']
const PERSONALITIES = ['Educational', 'Entertaining', 'Inspirational', 'Controversial', 'Authentic/Raw', 'Luxury', 'Funny']

type FormState = {
  industry: string; sub_niche: string; platforms: string[]
  videos_per_month: string; audience_age: string; audience_gender: string
  audience_lifestyle: string; audience_wants: string; audience_knowledge: string
  content_personality: string[]; on_camera: string; speaking_style: string
  hook_styles: string[]; topics_never: string; content_goals: string[]
  primary_cta: string; signature_offer: string; content_pillars: string
  filming_location: string; visual_vibe: string; audio_style: string
  brand_differentiators: string; real_comments: string; common_misconception: string
}

const empty: FormState = {
  industry: '', sub_niche: '', platforms: [], videos_per_month: '',
  audience_age: '', audience_gender: '', audience_lifestyle: '', audience_wants: '',
  audience_knowledge: '', content_personality: [], on_camera: '', speaking_style: '',
  hook_styles: [], topics_never: '', content_goals: [], primary_cta: '',
  signature_offer: '', content_pillars: '', filming_location: '', visual_vibe: '',
  audio_style: '', brand_differentiators: '', real_comments: '', common_misconception: '',
}

export default function ClientIntakePage() {
  const { token } = useParams<{ token: string }>()
  const [clientName, setClientName] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done' | 'error'>('loading')
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/themes/intake?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setStatus('invalid'); return }
        setClientName(d.client_name)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  function toggle(field: 'platforms' | 'content_personality' | 'hook_styles' | 'content_goals', val: string) {
    setForm(f => ({ ...f, [field]: (f[field] as string[]).includes(val) ? (f[field] as string[]).filter(x => x !== val) : [...(f[field] as string[]), val] }))
  }

  async function submit() {
    setSaving(true)
    const payload = {
      token,
      industry: form.industry || null,
      sub_niche: form.sub_niche || null,
      platforms: form.platforms.length ? form.platforms : null,
      videos_per_month: form.videos_per_month || null,
      audience_age: form.audience_age ? [form.audience_age] : null,
      audience_gender: form.audience_gender || null,
      audience_lifestyle: form.audience_lifestyle ? form.audience_lifestyle.split(',').map(s => s.trim()) : null,
      audience_wants: form.audience_wants ? form.audience_wants.split(',').map(s => s.trim()) : null,
      audience_knowledge: form.audience_knowledge || null,
      content_personality: form.content_personality.length ? form.content_personality : null,
      on_camera: form.on_camera || null,
      speaking_style: form.speaking_style || null,
      hook_styles: form.hook_styles.length ? form.hook_styles : null,
      topics_never: form.topics_never ? form.topics_never.split(',').map(s => s.trim()) : null,
      content_goals: form.content_goals.length ? form.content_goals : null,
      primary_cta: form.primary_cta || null,
      signature_offer: form.signature_offer || null,
      content_pillars: form.content_pillars ? form.content_pillars.split(',').map(s => s.trim()) : null,
      filming_location: form.filming_location ? [form.filming_location] : null,
      visual_vibe: form.visual_vibe || null,
      audio_style: form.audio_style || null,
      brand_differentiators: form.brand_differentiators ? form.brand_differentiators.split(',').map(s => s.trim()) : null,
      real_comments: form.real_comments || null,
      common_misconception: form.common_misconception || null,
    }

    const res = await fetch('/api/themes/intake', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (data.success) setStatus('done')
    else setStatus('error')
  }

  if (status === 'loading') return <Screen><p className="text-zinc-500 text-sm">Loading your form...</p></Screen>
  if (status === 'invalid') return <Screen><div className="text-center"><p className="text-red-400 font-medium mb-2">This link is invalid or has already been used.</p><p className="text-zinc-500 text-sm">Contact the person who sent it to you.</p></div></Screen>
  if (status === 'done') return (
    <Screen>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold mb-2">You're all set!</h2>
        <p className="text-zinc-400 text-sm">Your brand profile has been submitted. Your editor will take it from here.</p>
      </div>
    </Screen>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-900 px-6 py-5 flex items-center gap-3">
        <Image src="/logo-icon.png" alt="E.V.E." width={32} height={32} className="rounded-full" />
        <div>
          <p className="font-bold text-sm">The E.V.E. Studio</p>
          <p className="text-zinc-500 text-xs">Brand Profile Form</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tell us about {clientName}</h1>
          <p className="text-zinc-400 text-sm">Fill in as much as you can — the more detail you give, the better your content will perform. Nothing here is set in stone; your editor can adjust later.</p>
        </div>

        <CSection title="Your Business">
          <CField label="What industry are you in?">
            <input value={form.industry} onChange={e => set('industry', e.target.value)} className={inp} placeholder="e.g. Real Estate, Fitness, Beauty, Restaurant" />
          </CField>
          <CField label="What's your specific niche?">
            <input value={form.sub_niche} onChange={e => set('sub_niche', e.target.value)} className={inp} placeholder="e.g. Luxury waterfront homes, postpartum fitness" />
          </CField>
          <CField label="How many videos do you want per month?">
            <input value={form.videos_per_month} onChange={e => set('videos_per_month', e.target.value)} className={inp} placeholder="e.g. 8, 12, 16" />
          </CField>
        </CSection>

        <CSection title="Your Platforms">
          <p className="text-zinc-500 text-sm mb-3">Which platforms are you posting on?</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => <Chip key={p} label={p} active={form.platforms.includes(p)} onClick={() => toggle('platforms', p)} />)}
          </div>
        </CSection>

        <CSection title="Your Audience">
          <CField label="Age range of your ideal customer">
            <input value={form.audience_age} onChange={e => set('audience_age', e.target.value)} className={inp} placeholder="e.g. 28-45" />
          </CField>
          <CField label="Gender">
            <input value={form.audience_gender} onChange={e => set('audience_gender', e.target.value)} className={inp} placeholder="e.g. Women, Men, Both" />
          </CField>
          <CField label="How would you describe your ideal customer's lifestyle? (separate with commas)">
            <input value={form.audience_lifestyle} onChange={e => set('audience_lifestyle', e.target.value)} className={inp} placeholder="e.g. homeowners, high income, outdoor lovers" />
          </CField>
          <CField label="What does your ideal customer want most? (separate with commas)">
            <input value={form.audience_wants} onChange={e => set('audience_wants', e.target.value)} className={inp} placeholder="e.g. grow following, sell more, look credible" />
          </CField>
          <CField label="How much do they already know about your topic?">
            <input value={form.audience_knowledge} onChange={e => set('audience_knowledge', e.target.value)} className={inp} placeholder="e.g. beginner, knows the basics, expert" />
          </CField>
        </CSection>

        <CSection title="Your Content Style">
          <CField label="What personality should your content have?">
            <div className="flex flex-wrap gap-2">
              {PERSONALITIES.map(p => <Chip key={p} label={p} active={form.content_personality.includes(p)} onClick={() => toggle('content_personality', p)} />)}
            </div>
          </CField>
          <CField label="Will you be on camera?">
            <input value={form.on_camera} onChange={e => set('on_camera', e.target.value)} className={inp} placeholder="e.g. Yes — face to camera, Voiceover only, No" />
          </CField>
          <CField label="How do you speak / what's your tone?">
            <input value={form.speaking_style} onChange={e => set('speaking_style', e.target.value)} className={inp} placeholder="e.g. Casual and friendly, professional, energetic" />
          </CField>
          <CField label="What types of video hooks do you like?">
            <div className="flex flex-wrap gap-2">
              {HOOK_STYLES.map(h => <Chip key={h} label={h} active={form.hook_styles.includes(h)} onClick={() => toggle('hook_styles', h)} />)}
            </div>
          </CField>
          <CField label="Topics you NEVER want to cover (separate with commas)">
            <input value={form.topics_never} onChange={e => set('topics_never', e.target.value)} className={inp} placeholder="e.g. politics, competitors, pricing" />
          </CField>
        </CSection>

        <CSection title="Your Goals & Offers">
          <CField label="What should your content achieve?">
            <div className="flex flex-wrap gap-2">
              {CONTENT_GOALS.map(g => <Chip key={g} label={g} active={form.content_goals.includes(g)} onClick={() => toggle('content_goals', g)} />)}
            </div>
          </CField>
          <CField label="What's the main action you want viewers to take?">
            <input value={form.primary_cta} onChange={e => set('primary_cta', e.target.value)} className={inp} placeholder="e.g. DM us, Book a call, Visit link in bio" />
          </CField>
          <CField label="What's your signature offer or service?">
            <input value={form.signature_offer} onChange={e => set('signature_offer', e.target.value)} className={inp} placeholder="e.g. Free home valuation, 30-min consult, starter package" />
          </CField>
          <CField label="Content pillars — main topics you'll post about (separate with commas)">
            <input value={form.content_pillars} onChange={e => set('content_pillars', e.target.value)} className={inp} placeholder="e.g. education, behind the scenes, client results, tips" />
          </CField>
        </CSection>

        <CSection title="Visuals & Location">
          <CField label="Where will most content be filmed?">
            <input value={form.filming_location} onChange={e => set('filming_location', e.target.value)} className={inp} placeholder="e.g. On location, home studio, outdoors, office" />
          </CField>
          <CField label="How do you want your content to look and feel?">
            <input value={form.visual_vibe} onChange={e => set('visual_vibe', e.target.value)} className={inp} placeholder="e.g. Clean and minimal, bright & fun, dark luxury" />
          </CField>
          <CField label="What kind of music or audio do you prefer?">
            <input value={form.audio_style} onChange={e => set('audio_style', e.target.value)} className={inp} placeholder="e.g. Trending sounds, calm background music, no music" />
          </CField>
          <CField label="What makes you different from competitors? (separate with commas)">
            <input value={form.brand_differentiators} onChange={e => set('brand_differentiators', e.target.value)} className={inp} placeholder="e.g. local expert, fastest response, personal service" />
          </CField>
        </CSection>

        <CSection title="From Your Audience (optional but powerful)">
          <CField label="Paste any real comments, DMs, or questions your audience has sent you">
            <textarea value={form.real_comments} onChange={e => set('real_comments', e.target.value)} className={`${inp} h-28 resize-none`} placeholder="Copy and paste directly from your Instagram comments, DMs, etc." />
          </CField>
          <CField label="What's the biggest misconception people have about your niche?">
            <input value={form.common_misconception} onChange={e => set('common_misconception', e.target.value)} className={inp} placeholder="e.g. People think you need a huge budget to sell fast" />
          </CField>
        </CSection>

        {status === 'error' && <p className="text-red-400 text-sm">Something went wrong — please try again.</p>}

        <div className="pb-10">
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-bold py-4 rounded-xl text-base"
          >
            {saving ? 'Submitting...' : 'Submit Brand Profile'}
          </button>
          <p className="text-zinc-600 text-xs text-center mt-3">Your editor will receive this instantly and use it to build your content strategy.</p>
        </div>
      </main>
    </div>
  )
}

const inp = "w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600"

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      {children}
    </div>
  )
}

function CSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function CField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-300 mb-2">{label}</label>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-sm px-3 py-1.5 rounded-full border transition ${active ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
      {label}
    </button>
  )
}
