import { createAdminClient } from '@/lib/supabase/admin'
import { generateNdaCertificate } from '@/lib/nda-pdf'
import { uploadNdaToDrive } from '@/lib/google-drive'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token, full_name } = await req.json()

  if (!token || !full_name?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Validate token
  const { data: app, error: lookupError } = await admin
    .from('beta_applications')
    .select('id, name, email, nda_token_expires_at, nda_signed_at, status')
    .eq('nda_token', token)
    .single()

  if (lookupError || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status !== 'approved') return NextResponse.json({ error: 'Application not approved' }, { status: 403 })
  if (app.nda_signed_at) return NextResponse.json({ already_signed: true })
  if (!app.nda_token_expires_at || new Date(app.nda_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired. Please contact us for a new one.' }, { status: 410 })
  }

  // Capture IP and user agent for legal record
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'
  const signedAt = new Date()

  // Record the agreement in Supabase
  const { error: insertError } = await admin.from('nda_agreements').insert({
    application_id: app.id,
    full_name: full_name.trim(),
    email: app.email,
    ip_address: ip,
    user_agent: userAgent,
    nda_version: 'v1',
  })

  if (insertError) {
    console.error('[NDA sign error]', insertError)
    return NextResponse.json({ error: 'Failed to record signature. Please try again.' }, { status: 500 })
  }

  // Mark application as signed
  await admin
    .from('beta_applications')
    .update({ nda_signed_at: signedAt.toISOString() })
    .eq('id', app.id)

  // Generate PDF certificate and upload to Google Drive (non-blocking — don't fail the sign if Drive is down)
  try {
    const pdfBuffer = await generateNdaCertificate({
      fullName: full_name.trim(),
      email: app.email,
      ipAddress: ip,
      signedAt,
      ndaVersion: 'v1',
      applicationId: app.id,
    })

    const safeName = full_name.trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    const dateStr = signedAt.toISOString().split('T')[0]
    const fileName = `NDA_${safeName}_${dateStr}.pdf`

    await uploadNdaToDrive({ fileName, pdfBuffer })
    console.log(`[NDA] Certificate uploaded to Drive: ${fileName}`)
  } catch (driveErr) {
    // Log but don't block — signature is already recorded in Supabase
    console.error('[NDA Drive upload error]', driveErr)
  }

  return NextResponse.json({ success: true })
}
