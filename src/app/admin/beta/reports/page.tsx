'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingEVE from '@/components/LoadingEVE'

type BetaReport = {
  id: string
  user_id: string
  type: 'bug' | 'plugin_error' | 'recommendation' | 'other'
  description: string
  page: string | null
  status: 'open' | 'reviewed' | 'resolved'
  created_at: string
  profiles: { email: string | null; full_name: string | null } | null
}

type BetaEvent = {
  id: string
  user_id: string
  event: string
  page: string | null
  properties: Record<string, unknown> | null
  created_at: string
  profiles: { email: string | null } | null
}

const TYPE_COLORS: Record<string, string> = {
  bug:            'bg-red-900/40 text-red-400',
  plugin_error:   'bg-orange-900/40 text-orange-400',
  recommendation: 'bg-blue-900/40 text-blue-400',
  other:          'bg-zinc-800 text-zinc-400',
}

const STATUS_COLORS: Record<string, string> = {
  open:     'bg-yellow-900/40 text-yellow-400',
  reviewed: 'bg-violet-900/40 text-violet-400',
  resolved: 'bg-green-900/40 text-green-400',
}

export default function BetaReportsPage() {
  const [tab, setTab] = useState<'reports' | 'activity'>('reports')
  const [reports, setReports] = useState<BetaReport[]>([])
  const [events, setEvents] = useState<BetaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'reviewed' | 'resolved'>('open')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/reports')
        if (res.status === 403) { setError('Unauthorized'); return }
        if (!res.ok) { setError('Failed to load data'); return }
        const data = await res.json()
        setReports(data.reports ?? [])
        setEvents(data.events ?? [])
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function updateStatus(id: string, status: 'reviewed' | 'resolved') {
    setUpdatingId(id)
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setUpdatingId(null)
  }

  const filteredReports = reports.filter(r =>
    statusFilter === 'all' ? true : r.status === statusFilter
  )

  const reportCounts = {
    open:     reports.filter(r => r.status === 'open').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  const eventCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event] = (acc[e.event] ?? 0) + 1
    return acc
  }, {})

  const uniqueUsers = new Set(events.map(e => e.user_id)).size

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingEVE />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-red-400">{error === 'Unauthorized' ? 'Access denied.' : error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-zinc-500 hover:text-white text-sm transition flex items-center gap-1.5"
            >
              ← Dashboard
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-1">Beta Reports & Activity</h1>
          <p className="text-zinc-500 text-sm">What beta users are submitting and how they&apos;re using E.V.E.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['reports', 'activity'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'reports' ? `Reports (${reports.length})` : `Activity (${events.length})`}
            </button>
          ))}
        </div>

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Open',     count: reportCounts.open,     color: 'text-yellow-400' },
                { label: 'Reviewed', count: reportCounts.reviewed, color: 'text-violet-400' },
                { label: 'Resolved', count: reportCounts.resolved, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-zinc-500 text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {(['open', 'reviewed', 'resolved', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                    statusFilter === f ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Report list */}
            {filteredReports.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">No {statusFilter === 'all' ? '' : statusFilter} reports.</div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map(report => (
                  <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[report.type]}`}>
                            {report.type.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                          {report.page && (
                            <span className="text-xs text-zinc-600 font-mono">{report.page}</span>
                          )}
                        </div>
                        <p className="text-white text-sm leading-relaxed mb-2">{report.description}</p>
                        <p className="text-zinc-600 text-xs">
                          {report.profiles?.full_name || report.profiles?.email || 'Unknown user'}
                          {' · '}
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {report.status === 'open' && (
                          <button
                            onClick={() => updateStatus(report.id, 'reviewed')}
                            disabled={updatingId === report.id}
                            className="text-xs border border-violet-700 text-violet-400 hover:bg-violet-700 hover:text-white disabled:opacity-50 transition px-3 py-1.5 rounded-lg font-medium"
                          >
                            Mark reviewed
                          </button>
                        )}
                        {report.status !== 'resolved' && (
                          <button
                            onClick={() => updateStatus(report.id, 'resolved')}
                            disabled={updatingId === report.id}
                            className="text-xs border border-green-800 text-green-500 hover:bg-green-800 hover:text-white disabled:opacity-50 transition px-3 py-1.5 rounded-lg font-medium"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === 'activity' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-3xl font-bold text-violet-400">{uniqueUsers}</p>
                <p className="text-zinc-500 text-sm mt-1">Active beta users</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-3xl font-bold text-white">{events.length}</p>
                <p className="text-zinc-500 text-sm mt-1">Total events</p>
              </div>
              {Object.entries(eventCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([event, count]) => (
                  <div key={event} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <p className="text-3xl font-bold text-amber-400">{count}</p>
                    <p className="text-zinc-500 text-sm mt-1">{event.replace(/_/g, ' ')}</p>
                  </div>
                ))}
            </div>

            {/* Event breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="font-bold mb-4">Events by type</h2>
              <div className="space-y-2">
                {Object.entries(eventCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([event, count]) => {
                    const pct = Math.round((count / events.length) * 100)
                    return (
                      <div key={event} className="flex items-center gap-3">
                        <span className="text-zinc-400 text-sm font-mono w-40 shrink-0">{event}</span>
                        <div className="flex-1 bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-violet-600 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-zinc-500 text-sm w-8 text-right shrink-0">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Raw event log */}
            <div>
              <h2 className="font-bold mb-4 text-zinc-400 text-sm uppercase tracking-widest">Recent events</h2>
              <div className="space-y-1.5">
                {events.slice(0, 100).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 text-sm py-2 border-b border-zinc-900">
                    <span className="text-zinc-600 text-xs w-36 shrink-0">
                      {new Date(ev.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-violet-400 font-mono text-xs w-36 shrink-0">{ev.event}</span>
                    <span className="text-zinc-400 text-xs">{ev.profiles?.email ?? ev.user_id}</span>
                    {ev.page && <span className="text-zinc-600 text-xs ml-auto font-mono">{ev.page}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
