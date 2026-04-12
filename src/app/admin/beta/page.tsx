'use client'

import { useEffect, useState } from 'react'

type Application = {
  id: string
  name: string
  email: string
  use_case: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  nda_sent_at: string | null
  nda_signed_at: string | null
}


export default function AdminBetaPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [acting, setActing] = useState<string | null>(null)
  const [ndaSending, setNdaSending] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/beta')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setApps(d.applications)
      })
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  async function act(id: string, action: 'approved' | 'rejected') {
    setActing(id)
    const res = await fetch('/api/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const data = await res.json()
    if (data.success) {
      setApps(prev => prev.map(a => a.id === id ? {
        ...a,
        status: action,
        reviewed_at: new Date().toISOString(),
        nda_sent_at: data.nda_sent ? new Date().toISOString() : a.nda_sent_at,
      } : a))
    }
    setActing(null)
  }

  async function resendNda(app: Application) {
    setNdaSending(app.id)
    await fetch('/api/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: app.id, action: 'resend_nda' }),
    })
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, nda_sent_at: new Date().toISOString() } : a))
    setNdaSending(null)
  }

  const filtered = apps.filter(a => filter === 'all' || a.status === filter)
  const counts = {
    pending: apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-500">Loading applications...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-red-400">{error === 'Unauthorized' ? 'Access denied. Admin only.' : error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 max-w-5xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Beta Applications</h1>
        <p className="text-zinc-500 text-sm">Review and approve beta testers for E.V.E. Studio.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending', count: counts.pending, color: 'text-yellow-400' },
          { label: 'Approved', count: counts.approved, color: 'text-green-400' },
          { label: 'Rejected', count: counts.rejected, color: 'text-zinc-500' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-zinc-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter === f ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">No {filter === 'all' ? '' : filter} applications.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{app.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    app.status === 'pending' ? 'bg-yellow-900/40 text-yellow-400' :
                    app.status === 'approved' ? 'bg-green-900/40 text-green-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>{app.status}</span>
                </div>
                <p className="text-zinc-400 text-sm">{app.email}</p>
                {app.use_case && <p className="text-zinc-500 text-sm mt-2 italic">"{app.use_case}"</p>}
                <p className="text-zinc-700 text-xs mt-2">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>

              <div className="flex flex-col gap-2 shrink-0 items-end">
                {app.status === 'approved' && (
                  <div className="flex flex-col gap-1.5 items-end">
                    {app.nda_signed_at ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-900/40 text-green-400 font-medium">NDA Signed ✓</span>
                    ) : app.nda_sent_at ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-900/40 text-violet-400 font-medium">NDA Sent — Awaiting Signature</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/40 text-yellow-400 font-medium">NDA Not Sent</span>
                    )}
                    {!app.nda_signed_at && (
                      <button
                        onClick={() => resendNda(app)}
                        disabled={ndaSending === app.id}
                        className="border border-violet-600 text-violet-400 hover:bg-violet-600 hover:text-white disabled:opacity-50 transition px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {ndaSending === app.id ? 'Sending...' : app.nda_sent_at ? 'Resend NDA' : 'Send NDA'}
                      </button>
                    )}
                  </div>
                )}
                {app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => act(app.id, 'approved')}
                      disabled={acting === app.id}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {acting === app.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => act(app.id, 'rejected')}
                      disabled={acting === app.id}
                      className="border border-zinc-700 hover:border-zinc-500 disabled:opacity-50 transition text-zinc-400 px-4 py-1.5 rounded-lg text-sm font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
