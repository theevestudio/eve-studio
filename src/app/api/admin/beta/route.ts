import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendNdaForSigning } from '@/lib/dropbox-sign'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'alana.productions.co@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return false
  return true
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

// POST — approve or reject
export async function POST(req: Request) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id, action } = await req.json()
  if (!id || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Update status
  const { data: app, error } = await supabase
    .from('beta_applications')
    .update({ status: action, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-send NDA on approval
  if (action === 'approved' && app) {
    try {
      const signatureRequestId = await sendNdaForSigning(app.name, app.email, id)
      await supabase
        .from('beta_applications')
        .update({ nda_sent_at: new Date().toISOString(), signature_request_id: signatureRequestId })
        .eq('id', id)
      return NextResponse.json({ success: true, nda_sent: true })
    } catch (err) {
      console.error('[NDA send error]', err)
      // Still return success for the approval — NDA failure shouldn't block it
      return NextResponse.json({ success: true, nda_sent: false, nda_error: String(err) })
    }
  }

  return NextResponse.json({ success: true })
}
