import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('beta_applications')
    .select('id, name, email, nda_token_expires_at, nda_signed_at, status')
    .eq('nda_token', token)
    .single()

  if (error || !data) return NextResponse.json({ valid: false, error: 'Invalid link' }, { status: 404 })
  if (data.status !== 'approved') return NextResponse.json({ valid: false, error: 'Application not approved' }, { status: 403 })
  if (data.nda_signed_at) return NextResponse.json({ valid: false, already_signed: true })
  if (new Date(data.nda_token_expires_at) < new Date()) return NextResponse.json({ valid: false, error: 'This link has expired. Please contact us for a new one.' }, { status: 410 })

  return NextResponse.json({ valid: true, name: data.name, email: data.email, application_id: data.id })
}
