'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Pinterest']
const HOOK_STYLES = ['Question', 'Bold statement', 'Story open', 'Contrast/Before-After', 'Curiosity gap', 'Direct offer']
const CONTENT_GOALS = ['Grow audience', 'Drive sales', 'Build trust', 'Educate', 'Entertain', 'Book consultations']
const PERSONALITIES = ['Educational', 'Entertaining', 'Inspirational', 'Controversial', 'Authentic/Raw', 'Luxury', 'Funny']

type Mode = 'self' | 'import' | 'send'

export default function NewThemePage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('self')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Import mode
  const [importText, setImportText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [flaggedFields, setFlaggedFields] = useState<Set<string>>(new Set())

  // Send mode
  const [sendName, setSendName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [intakeLink, setIntakeLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val] }))
    // Clear flag when user interacts
    setFlaggedFields(prev => { const next = new Set(prev); next.delete(field); return next })
  }

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
    // Clear flag when user types
    setFlaggedFields(prev => { const next = new Set(prev); next.delete(field); return next })
  }

  // Parse pasted form text with AI
  async function handleImport() {
    if (!importText.trim()) return
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/themes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setParsing(false); return }

      const fields = data.fields
      const newFlagged = new Set<string>()

      // Apply extracted fields and flag nulls
      const mappings: Record<string, any> = {
        client_name: fields.client_name,
        industry: fields.industry,
        sub_niche: fields.sub_niche,
        platforms: fields.platforms,
        videos_per_month: fields.videos_per_month,
        audience_age: fields.audience_age,
        audience_gender: fields.audience_gender,
        audience_lifestyle: Array.isArray(fields.audience_lifestyle) ? fields.audience_lifestyle.join(', ') : fields.audience_lifestyle,
        audience_wants: Array.isArray(fields.audience_wants) ? fields.audience_wants.join(', ') : fields.audience_wants,
        audience_knowledge: fields.audience_knowledge,
        content_personality: fields.content_personality,
        on_camera: fields.on_camera,
        speaking_style: fields.speaking_style,
        hook_styles: fields.hook_styles,
        topics_never: Array.isArray(fields.topics_never) ? fields.topics_never.join(', ') : fields.topics_never,
        content_goals: fields.content_goals,
        primary_cta: fields.primary_cta,
        signature_offer: fields.signature_offer,
        content_pillars: Array.isArray(fields.content_pillars) ? fields.content_pillars.join(', ') : fields.content_pillars,
        filming_location: Array.isArray(fields.filming_location) ? fields.filming_location.join(', ') : fields.filming_location,
        visual_vibe: fields.visual_vibe,
        audio_style: fields.audio_style,
        brand_differentiators: Array.isArray(fields.brand_differentiators) ? fields.brand_differentiators.join(', ') : fields.brand_differentiators,
        real_comments: fields.real_comments,
        common_misconception: fields.common_misconception,
      }

      const updated: any = { ...form }
      for (const [key, val] of Object.entries(mappings)) {
        if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          updated[key] = val
        } else {
          newFlagged.add(key)
        }
      }

      setForm(updated)
      setFlaggedFields(newFlagged)
      setImportDone(true)
    } catch {
      setError('Failed to parse — try again.')
    }
    setParsing(false)
  }

  // Generate client intake link
  async function handleGenerateLink() {
    if (!sendName.trim()) return
    setGenerating(true)
    const res = await fetch('/api/themes/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: sendName.trim() }),
    })
    const data = await res.json()
    setGenerating(false)
    if (data.token) {
      setIntakeLink(`${process.env.NEXT_PUBLIC_APP_URL}/themes/intake/${data.token}`)
    } else {
      setError('Failed to generate link — try again.')
    }
  }

  function copyLink() {
    if (!intakeLink) return
    navigator.clipboard.writeText(intakeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (!form.client_name.trim()) { setError('Client name is required'); return }
    // Block save if there are still flagged fields
    if (flaggedFields.size > 0) {
      setError(`${flaggedFields.size} field${flaggedFields.size > 1 ? 's' : ''} still need to be filled in (highlighted in red).`)
      return
    }
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
    if (err) { setError(err.message); setSaving(false) }
    else router.push('/dashboard/themes')
  }

  const inputClass = (field: string) =>
    `w-full bg-zinc-900 border ${flaggedFields.has(field) ? 'border-red-500' : 'border-zinc-800'} text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600`

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/themes')} className="text-zinc-500 hover:text-white transition text-sm">← Themes</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">New Client Theme</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Mode selector */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-1 flex gap-1">
          {([
            { key: 'self', label: 'Fill it yourself' },
            { key: 'import', label: 'Import from existing' },
            { key: 'send', label: 'Send to client' },
          ] as const).map(m => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setError(''); setImportDone(false); setFlaggedFields(new Set()); setIntakeLink(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${mode === m.key ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* SEND TO CLIENT mode */}
        {mode === 'send' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Send to client</h3>
              <p className="text-zinc-500 text-sm">Enter your client's name and we'll generate a private link they can fill out themselves. No login needed on their end.</p>
            </div>
            {!intakeLink ? (
              <>
                <input
                  type="text"
                  placeholder="Client name (e.g. Bri Garcia)"
                  value={sendName}
                  onChange={e => setSendName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600"
                />
                <button
                  onClick={handleGenerateLink}
                  disabled={!sendName.trim() || generating}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-semibold py-3 rounded-lg text-sm"
                >
                  {generating ? 'Generating...' : 'Generate Client Link'}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-400 text-sm">Link ready — send this to <span className="text-white font-medium">{sendName}</span>:</p>
                <div className="flex gap-2">
                  <input readOnly value={intakeLink} className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-4 py-2.5 text-sm" />
                  <button onClick={copyLink} className="bg-violet-600 hover:bg-violet-500 transition text-white font-semibold px-4 py-2.5 rounded-lg text-sm whitespace-nowrap">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-zinc-600 text-xs">Once they submit, the theme will appear in your Themes dashboard automatically.</p>
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {/* IMPORT mode — paste area */}
        {mode === 'import' && !importDone && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Import from existing</h3>
              <p className="text-zinc-500 text-sm">Paste in your client's completed onboarding form, intake answers, email responses — anything. VIBE will read it and fill in what it can. Fields it can't answer will be flagged red for you to fill in.</p>
            </div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste your client's form responses here..."
              rows={10}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition placeholder-zinc-600 resize-none"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleImport}
              disabled={!importText.trim() || parsing}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-semibold py-3 rounded-lg text-sm"
            >
              {parsing ? 'Parsing with VIBE...' : 'Parse & Fill Fields'}
            </button>
          </div>
        )}

        {/* Import result banner */}
        {mode === 'import' && importDone && (
          <div className={`border rounded-xl px-5 py-4 text-sm ${flaggedFields.size > 0 ? 'bg-red-950/30 border-red-800 text-red-300' : 'bg-green-950/30 border-green-800 text-green-300'}`}>
            {flaggedFields.size > 0
              ? `VIBE filled in what it could. ${flaggedFields.size} field${flaggedFields.size > 1 ? 's' : ''} couldn't be determined — they're highlighted in red below. Fill them in before saving.`
              : 'All fields were successfully imported. Review and save when ready.'}
          </div>
        )}

        {/* Main form — shown in 'self' mode always, shown in 'import' mode after parsing */}
        {(mode === 'self' || (mode === 'import' && importDone)) && (
          <>
            <Section title="Client Info">
              <Field label="Client name *" flagged={flaggedFields.has('client_name')}>
                <input value={form.client_name} onChange={e => set('client_name', e.target.value)} className={inputClass('client_name')} placeholder="e.g. The E.V.E. Studio" />
              </Field>
              <Field label="Industry" flagged={flaggedFields.has('industry')}>
                <input value={form.industry} onChange={e => set('industry', e.target.value)} className={inputClass('industry')} placeholder="e.g. Real Estate, Fitness, Beauty" />
              </Field>
              <Field label="Sub-niche" flagged={flaggedFields.has('sub_niche')}>
                <input value={form.sub_niche} onChange={e => set('sub_niche', e.target.value)} className={inputClass('sub_niche')} placeholder="e.g. Luxury waterfront homes" />
              </Field>
              <Field label="Videos per month" flagged={flaggedFields.has('videos_per_month')}>
                <input value={form.videos_per_month} onChange={e => set('videos_per_month', e.target.value)} className={inputClass('videos_per_month')} placeholder="e.g. 12" />
              </Field>
            </Section>

            <Section title="Platforms">
              <div className={`flex flex-wrap gap-2 p-3 rounded-lg ${flaggedFields.has('platforms') ? 'border border-red-500' : ''}`}>
                {PLATFORMS.map(p => (
                  <Chip key={p} label={p} active={form.platforms.includes(p)} onClick={() => toggle('platforms', p)} />
                ))}
              </div>
              {flaggedFields.has('platforms') && <p className="text-red-400 text-xs mt-1">Select at least one platform</p>}
            </Section>

            <Section title="Audience">
              <Field label="Age range" flagged={flaggedFields.has('audience_age')}>
                <input value={form.audience_age} onChange={e => set('audience_age', e.target.value)} className={inputClass('audience_age')} placeholder="e.g. 28-45" />
              </Field>
              <Field label="Gender" flagged={flaggedFields.has('audience_gender')}>
                <input value={form.audience_gender} onChange={e => set('audience_gender', e.target.value)} className={inputClass('audience_gender')} placeholder="e.g. Women, Men, All" />
              </Field>
              <Field label="Lifestyle (comma separated)" flagged={flaggedFields.has('audience_lifestyle')}>
                <input value={form.audience_lifestyle} onChange={e => set('audience_lifestyle', e.target.value)} className={inputClass('audience_lifestyle')} placeholder="e.g. homeowners, outdoor lovers, high income" />
              </Field>
              <Field label="What they want (comma separated)" flagged={flaggedFields.has('audience_wants')}>
                <input value={form.audience_wants} onChange={e => set('audience_wants', e.target.value)} className={inputClass('audience_wants')} placeholder="e.g. sell faster, look credible, grow following" />
              </Field>
              <Field label="Their knowledge level" flagged={flaggedFields.has('audience_knowledge')}>
                <input value={form.audience_knowledge} onChange={e => set('audience_knowledge', e.target.value)} className={inputClass('audience_knowledge')} placeholder="e.g. beginner, intermediate, expert" />
              </Field>
            </Section>

            <Section title="Content Style">
              <Field label="Content personality" flagged={flaggedFields.has('content_personality')}>
                <div className={`flex flex-wrap gap-2 p-3 rounded-lg ${flaggedFields.has('content_personality') ? 'border border-red-500' : ''}`}>
                  {PERSONALITIES.map(p => (
                    <Chip key={p} label={p} active={form.content_personality.includes(p)} onClick={() => toggle('content_personality', p)} />
                  ))}
                </div>
              </Field>
              <Field label="On camera?" flagged={flaggedFields.has('on_camera')}>
                <input value={form.on_camera} onChange={e => set('on_camera', e.target.value)} className={inputClass('on_camera')} placeholder="e.g. Yes — client, Yes — editor only, Voiceover only" />
              </Field>
              <Field label="Speaking style" flagged={flaggedFields.has('speaking_style')}>
                <input value={form.speaking_style} onChange={e => set('speaking_style', e.target.value)} className={inputClass('speaking_style')} placeholder="e.g. Conversational, professional, hype" />
              </Field>
              <Field label="Hook styles" flagged={flaggedFields.has('hook_styles')}>
                <div className={`flex flex-wrap gap-2 p-3 rounded-lg ${flaggedFields.has('hook_styles') ? 'border border-red-500' : ''}`}>
                  {HOOK_STYLES.map(h => (
                    <Chip key={h} label={h} active={form.hook_styles.includes(h)} onClick={() => toggle('hook_styles', h)} />
                  ))}
                </div>
              </Field>
              <Field label="Topics to never cover (comma separated)" flagged={flaggedFields.has('topics_never')}>
                <input value={form.topics_never} onChange={e => set('topics_never', e.target.value)} className={inputClass('topics_never')} placeholder="e.g. politics, competitors, pricing" />
              </Field>
            </Section>

            <Section title="Brand Strategy">
              <Field label="Content goals" flagged={flaggedFields.has('content_goals')}>
                <div className={`flex flex-wrap gap-2 p-3 rounded-lg ${flaggedFields.has('content_goals') ? 'border border-red-500' : ''}`}>
                  {CONTENT_GOALS.map(g => (
                    <Chip key={g} label={g} active={form.content_goals.includes(g)} onClick={() => toggle('content_goals', g)} />
                  ))}
                </div>
              </Field>
              <Field label="Primary CTA" flagged={flaggedFields.has('primary_cta')}>
                <input value={form.primary_cta} onChange={e => set('primary_cta', e.target.value)} className={inputClass('primary_cta')} placeholder="e.g. Book a call, DM us, Visit link in bio" />
              </Field>
              <Field label="Signature offer" flagged={flaggedFields.has('signature_offer')}>
                <input value={form.signature_offer} onChange={e => set('signature_offer', e.target.value)} className={inputClass('signature_offer')} placeholder="e.g. Free home valuation, 30-min consult" />
              </Field>
              <Field label="Content pillars (comma separated)" flagged={flaggedFields.has('content_pillars')}>
                <input value={form.content_pillars} onChange={e => set('content_pillars', e.target.value)} className={inputClass('content_pillars')} placeholder="e.g. education, behind the scenes, results" />
              </Field>
            </Section>

            <Section title="Visuals & Brand">
              <Field label="Filming location" flagged={flaggedFields.has('filming_location')}>
                <input value={form.filming_location} onChange={e => set('filming_location', e.target.value)} className={inputClass('filming_location')} placeholder="e.g. On location, studio, outdoors" />
              </Field>
              <Field label="Visual vibe" flagged={flaggedFields.has('visual_vibe')}>
                <input value={form.visual_vibe} onChange={e => set('visual_vibe', e.target.value)} className={inputClass('visual_vibe')} placeholder="e.g. Clean luxury, gritty authentic, bright & fun" />
              </Field>
              <Field label="Audio style" flagged={flaggedFields.has('audio_style')}>
                <input value={form.audio_style} onChange={e => set('audio_style', e.target.value)} className={inputClass('audio_style')} placeholder="e.g. Trending sounds, original music, silent" />
              </Field>
              <Field label="Brand differentiators (comma separated)" flagged={flaggedFields.has('brand_differentiators')}>
                <input value={form.brand_differentiators} onChange={e => set('brand_differentiators', e.target.value)} className={inputClass('brand_differentiators')} placeholder="e.g. local expert, fastest response time, award winning" />
              </Field>
            </Section>

            <Section title="Extras (optional but improves output)">
              <Field label="Real comments / questions your audience asks" flagged={flaggedFields.has('real_comments')}>
                <textarea value={form.real_comments} onChange={e => set('real_comments', e.target.value)} className={`${inputClass('real_comments')} h-24 resize-none`} placeholder="Paste real DMs, comments or FAQs here..." />
              </Field>
              <Field label="Common misconception in your niche" flagged={flaggedFields.has('common_misconception')}>
                <input value={form.common_misconception} onChange={e => set('common_misconception', e.target.value)} className={inputClass('common_misconception')} placeholder="e.g. People think you need a huge budget to sell fast" />
              </Field>
            </Section>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pb-10">
              <button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white font-semibold px-6 py-3 rounded-lg">
                {saving ? 'Saving...' : 'Save Theme'}
              </button>
              <button onClick={() => router.push('/dashboard/themes')} className="text-zinc-400 hover:text-white transition px-4 py-3 text-sm">
                Cancel
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children, flagged }: { label: string; children: React.ReactNode; flagged?: boolean }) {
  return (
    <div>
      <label className={`block text-sm mb-1 ${flagged ? 'text-red-400' : 'text-zinc-400'}`}>
        {label}{flagged && <span className="ml-2 text-xs font-medium">← fill this in</span>}
      </label>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-sm px-3 py-1 rounded-full border transition ${active ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
      {label}
    </button>
  )
}
