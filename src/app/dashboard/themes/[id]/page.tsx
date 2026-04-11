'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import type { Theme } from '@/lib/types'
import LoadingEVE from '@/components/LoadingEVE'

export default function ThemeDetailPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('themes').select('*').eq('id', params.id).eq('user_id', user.id).single()
      if (!data) { router.push('/dashboard/themes'); return }
      setTheme(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Shell onBack={() => router.push('/dashboard/themes')} name=""><LoadingEVE /></Shell>
  if (!theme) return null

  return (
    <Shell onBack={() => router.push('/dashboard/themes')} name={theme.client_name}>
      {/* Generate button */}
      <button
        onClick={() => router.push(`/dashboard/vibe?theme=${theme.id}`)}
        className="w-full bg-violet-600 hover:bg-violet-500 transition text-white font-bold py-4 rounded-xl text-lg mb-8"
      >
        Generate Scripts with VIBE →
      </button>

      <div className="space-y-6">
        <Row label="Industry" value={theme.industry} />
        <Row label="Sub-niche" value={theme.sub_niche} />
        <Row label="Platforms" value={theme.platforms?.join(', ')} />
        <Row label="Videos/month" value={theme.videos_per_month} />
        <Row label="Audience age" value={theme.audience_age?.join(', ')} />
        <Row label="Audience gender" value={theme.audience_gender} />
        <Row label="Audience lifestyle" value={theme.audience_lifestyle?.join(', ')} />
        <Row label="Audience wants" value={theme.audience_wants?.join(', ')} />
        <Row label="Audience knowledge" value={theme.audience_knowledge} />
        <Row label="Content personality" value={theme.content_personality?.join(', ')} />
        <Row label="On camera" value={theme.on_camera} />
        <Row label="Speaking style" value={theme.speaking_style} />
        <Row label="Hook styles" value={theme.hook_styles?.join(', ')} />
        <Row label="Topics never" value={theme.topics_never?.join(', ')} />
        <Row label="Content goals" value={theme.content_goals?.join(', ')} />
        <Row label="Primary CTA" value={theme.primary_cta} />
        <Row label="Signature offer" value={theme.signature_offer} />
        <Row label="Content pillars" value={theme.content_pillars?.join(', ')} />
        <Row label="Filming location" value={theme.filming_location?.join(', ')} />
        <Row label="Visual vibe" value={theme.visual_vibe} />
        <Row label="Audio style" value={theme.audio_style} />
        <Row label="Brand differentiators" value={theme.brand_differentiators?.join(', ')} />
        <Row label="Real comments" value={theme.real_comments} />
        <Row label="Common misconception" value={theme.common_misconception} />
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push(`/dashboard/themes/${theme.id}/edit`)}
          className="border border-zinc-700 hover:border-violet-500 transition text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-sm"
        >
          Edit theme
        </button>
      </div>
    </Shell>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-4 border-b border-zinc-900 pb-4">
      <p className="text-zinc-500 text-sm w-48 shrink-0">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  )
}

function Shell({ children, onBack, name }: { children: React.ReactNode; onBack: () => void; name: string }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition text-sm">← Themes</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">{name}</span>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
