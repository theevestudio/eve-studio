'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Pinterest']
const HOOK_STYLES = ['Question', 'Bold statement', 'Story open', 'Contrast/Before-After', 'Curiosity gap', 'Direct offer']
const CONTENT_GOALS = ['Grow audience', 'Drive sales', 'Build trust', 'Educate', 'Entertain', 'Book consultations']
const PERSONALITIES = ['Educational', 'Entertaining', 'Inspirational', 'Controversial', 'Authentic/Raw', 'Luxury', 'Funny']

export default function NewThemePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    client_name: '',
    industry: '',
    sub_niche: '',
    platforms: [] as string[],
    videos_per_month: '',
    audience_age: '',
    audience_gender: '',
    audience_lifestyle: '',
    audience_wants: '',
    audience_knowledge: '',
    content_personality: [] as string[],
    on_camera: '',
    speaking_style: '',
    hook_styles: [] as string[],
    topics_never: '',
    content_goals: [] as string[],
    primary_cta: '',
    signature_offer: '',
    content_pillars: '',
    filming_location: '',
    visual_vibe: '',
    audio_style: '',
    brand_differentiators: '',
    real_comments: '',
    common_misconception: '',
  })

  function toggle(field: 'platforms' | 'content_personality' | 'hook_styles' | 'content_goals', val: string) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
    }))
  }

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!form.client_name.trim()) { setError('Client name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const payload = {
      user_id: user.id,
      client_name: form.client_name.trim(),
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

    const { error: err } = await supabase.from('themes').insert(payload)
    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/dashboard/themes')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/themes')} className="text-zinc-500 hover:text-white transition text-sm">← Themes</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">New Client Theme</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <Section title="Client Info">
          <Field label="Client name *">
            <input value={form.client_name} onChange={e => set('client_name', e.target.value)}
              className={input} placeholder="e.g. The E.V.E. Studio" />
          </Field>
          <Field label="Industry">
            <input value={form.industry} onChange={e => set('industry', e.target.value)}
              className={input} placeholder="e.g. Real Estate, Fitness, Beauty" />
          </Field>
          <Field label="Sub-niche">
            <input value={form.sub_niche} onChange={e => set('sub_niche', e.target.value)}
              className={input} placeholder="e.g. Luxury waterfront homes" />
          </Field>
          <Field label="Videos per month">
            <input value={form.videos_per_month} onChange={e => set('videos_per_month', e.target.value)}
              className={input} placeholder="e.g. 12" />
          </Field>
        </Section>

        <Section title="Platforms">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <Chip key={p} label={p} active={form.platforms.includes(p)} onClick={() => toggle('platforms', p)} />
            ))}
          </div>
        </Section>

        <Section title="Audience">
          <Field label="Age range">
            <input value={form.audience_age} onChange={e => set('audience_age', e.target.value)}
              className={input} placeholder="e.g. 28-45" />
          </Field>
          <Field label="Gender">
            <input value={form.audience_gender} onChange={e => set('audience_gender', e.target.value)}
              className={input} placeholder="e.g. Women, Men, All" />
          </Field>
          <Field label="Lifestyle (comma separated)">
            <input value={form.audience_lifestyle} onChange={e => set('audience_lifestyle', e.target.value)}
              className={input} placeholder="e.g. homeowners, outdoor lovers, high income" />
          </Field>
          <Field label="What they want (comma separated)">
            <input value={form.audience_wants} onChange={e => set('audience_wants', e.target.value)}
              className={input} placeholder="e.g. sell faster, look credible, grow following" />
          </Field>
          <Field label="Their knowledge level">
            <input value={form.audience_knowledge} onChange={e => set('audience_knowledge', e.target.value)}
              className={input} placeholder="e.g. beginner, intermediate, expert" />
          </Field>
        </Section>

        <Section title="Content Style">
          <Field label="Content personality">
            <div className="flex flex-wrap gap-2">
              {PERSONALITIES.map(p => (
                <Chip key={p} label={p} active={form.content_personality.includes(p)} onClick={() => toggle('content_personality', p)} />
              ))}
            </div>
          </Field>
          <Field label="On camera?">
            <input value={form.on_camera} onChange={e => set('on_camera', e.target.value)}
              className={input} placeholder="e.g. Yes — client, Yes — editor only, Voiceover only" />
          </Field>
          <Field label="Speaking style">
            <input value={form.speaking_style} onChange={e => set('speaking_style', e.target.value)}
              className={input} placeholder="e.g. Conversational, professional, hype" />
          </Field>
          <Field label="Hook styles">
            <div className="flex flex-wrap gap-2">
              {HOOK_STYLES.map(h => (
                <Chip key={h} label={h} active={form.hook_styles.includes(h)} onClick={() => toggle('hook_styles', h)} />
              ))}
            </div>
          </Field>
          <Field label="Topics to never cover (comma separated)">
            <input value={form.topics_never} onChange={e => set('topics_never', e.target.value)}
              className={input} placeholder="e.g. politics, competitors, pricing" />
          </Field>
        </Section>

        <Section title="Brand Strategy">
          <Field label="Content goals">
            <div className="flex flex-wrap gap-2">
              {CONTENT_GOALS.map(g => (
                <Chip key={g} label={g} active={form.content_goals.includes(g)} onClick={() => toggle('content_goals', g)} />
              ))}
            </div>
          </Field>
          <Field label="Primary CTA">
            <input value={form.primary_cta} onChange={e => set('primary_cta', e.target.value)}
              className={input} placeholder="e.g. Book a call, DM us, Visit link in bio" />
          </Field>
          <Field label="Signature offer">
            <input value={form.signature_offer} onChange={e => set('signature_offer', e.target.value)}
              className={input} placeholder="e.g. Free home valuation, 30-min consult" />
          </Field>
          <Field label="Content pillars (comma separated)">
            <input value={form.content_pillars} onChange={e => set('content_pillars', e.target.value)}
              className={input} placeholder="e.g. education, behind the scenes, results" />
          </Field>
        </Section>

        <Section title="Visuals & Brand">
          <Field label="Filming location">
            <input value={form.filming_location} onChange={e => set('filming_location', e.target.value)}
              className={input} placeholder="e.g. On location, studio, outdoors" />
          </Field>
          <Field label="Visual vibe">
            <input value={form.visual_vibe} onChange={e => set('visual_vibe', e.target.value)}
              className={input} placeholder="e.g. Clean luxury, gritty authentic, bright & fun" />
          </Field>
          <Field label="Audio style">
            <input value={form.audio_style} onChange={e => set('audio_style', e.target.value)}
              className={input} placeholder="e.g. Trending sounds, original music, silent" />
          </Field>
          <Field label="Brand differentiators (comma separated)">
            <input value={form.brand_differentiators} onChange={e => set('brand_differentiators', e.target.value)}
              className={input} placeholder="e.g. local expert, fastest response time, award winning" />
          </Field>
        </Section>

        <Section title="Extras (optional but improves output)">
          <Field label="Real comments / questions your audience asks">
            <textarea value={form.real_comments} onChange={e => set('real_comments', e.target.value)}
              className={`${input} h-24 resize-none`}
              placeholder="Paste real DMs, comments or FAQs here..." />
          </Field>
          <Field label="Common misconception in your niche">
            <input value={form.common_misconception} onChange={e => set('common_misconception', e.target.value)}
              className={input} placeholder="e.g. People think you need a huge budget to sell fast" />
          </Field>
        </Section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pb-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-semibold px-6 py-3 rounded-lg"
          >
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
          <button
            onClick={() => router.push('/dashboard/themes')}
            className="text-zinc-400 hover:text-white transition px-4 py-3 text-sm"
          >
            Cancel
          </button>
        </div>
      </main>
    </div>
  )
}

const input = "w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3 py-1 rounded-full border transition ${
        active ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
      }`}
    >
      {label}
    </button>
  )
}
