import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'alana.productions.co@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return false
  return true
}

// GET — fetch reports + events
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const admin = createAdminClient()
  const [{ data: reports, error: repErr }, { data: events, error: evErr }] = await Promise.all([
    admin
      .from('beta_reports')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('beta_events')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  if (repErr || evErr) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }

  return NextResponse.json({ reports, events })
}

// PATCH — update report status
export async function PATCH(req: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id, status } = await req.json()
  if (!id || !['reviewed', 'resolved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('beta_reports').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
