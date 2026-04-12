import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendNdaApprovalEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'alana.productions.co@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theevestudio.io'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return false
  return true
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// GET — list all applications
export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('beta_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data })
}

// POST — approve, reject, or resend NDA
export async function POST(req: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id, action } = await req.json()
  if (!id || !['approved', 'rejected', 'resend_nda'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Resend NDA — generate a fresh token and re-email
  if (action === 'resend_nda') {
    const { data: app, error } = await supabase
      .from('beta_applications')
      .select('name, email')
      .eq('id', id)
      .single()

    if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const token = generateToken()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    // Save token to DB FIRST so the link works the moment email arrives
    await supabase
      .from('beta_applications')
      .update({ nda_token: token, nda_token_expires_at: expires.toISOString() })
      .eq('id', id)

    try {
      await sendNdaApprovalEmail({
        name: app.name,
        email: app.email,
        signingUrl: `${APP_URL}/beta/sign-nda?token=${token}`,
      })
      await supabase
        .from('beta_applications')
        .update({ nda_sent_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ success: true, nda_sent: true })
    } catch (err) {
      console.error('[NDA resend error]', err)
      return NextResponse.json({ success: false, nda_error: String(err) }, { status: 500 })
    }
  }

  // Update status
  const { data: app, error } = await supabase
    .from('beta_applications')
    .update({ status: action, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // On approval: activate beta profile + send NDA signing email
  if (action === 'approved' && app) {
    const betaExpiresAt = new Date()
    betaExpiresAt.setMonth(betaExpiresAt.getMonth() + 3)

    await supabase
      .from('profiles')
      .update({
        is_beta_user: true,
        eve_subscription_active: true,
        eve_subscription_start: new Date().toISOString(),
        beta_expires_at: betaExpiresAt.toISOString(),
      })
      .eq('email', app.email)

    const token = generateToken()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    // Save token to DB FIRST so the link works the moment email arrives
    await supabase
      .from('beta_applications')
      .update({ nda_token: token, nda_token_expires_at: expires.toISOString() })
      .eq('id', id)

    try {
      await sendNdaApprovalEmail({
        name: app.name,
        email: app.email,
        signingUrl: `${APP_URL}/beta/sign-nda?token=${token}`,
      })
      await supabase
        .from('beta_applications')
        .update({ nda_sent_at: new Date().toISOString() })
        .eq('id', id)
      return NextResponse.json({ success: true, nda_sent: true })
    } catch (err) {
      console.error('[NDA send error]', err)
      return NextResponse.json({ success: true, nda_sent: false, nda_error: String(err) })
    }
  }

  return NextResponse.json({ success: true })
}
