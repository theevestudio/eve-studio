'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Theme } from '@/lib/types'
import LoadingEVE from '@/components/LoadingEVE'

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('themes').select('*').order('created_at', { ascending: false })
      setThemes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <PageShell><LoadingEVE /></PageShell>

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Client Themes</h1>
          <p className="text-zinc-500 text-sm mt-1">Each theme is a brand profile used to generate scripts.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/themes/new')}
          className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + New Theme
        </button>
      </div>

      {themes.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500 mb-4">No themes yet. Create one to start generating scripts.</p>
          <button
            onClick={() => router.push('/dashboard/themes/new')}
            className="bg-violet-600 hover:bg-violet-500 transition text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Create your first theme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map(theme => (
            <div
              key={theme.id}
              onClick={() => router.push(`/dashboard/themes/${theme.id}`)}
              className="bg-zinc-900 border border-zinc-800 hover:border-violet-500 transition cursor-pointer rounded-xl p-6"
            >
              <p className="font-bold text-lg mb-1">{theme.client_name}</p>
              {theme.industry && <p className="text-zinc-500 text-sm">{theme.industry}{theme.sub_niche ? ` · ${theme.sub_niche}` : ''}</p>}
              {theme.platforms && theme.platforms.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {theme.platforms.map(p => (
                    <span key={p} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-600 mt-4">
                Created {new Date(theme.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition text-sm shrink-0">← Dashboard</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-semibold">Client Themes</span>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  )
}
