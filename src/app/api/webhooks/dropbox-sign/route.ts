import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Dropbox Sign sends a form POST with a "json" field containing the event payload
export async function POST(req: Request) {
  const formData = await req.formData()
  const jsonStr = formData.get('json') as string
  if (!jsonStr) return new NextResponse('Hello API Event Received', { status: 200 })

  let payload: any
  try {
    payload = JSON.parse(jsonStr)
  } catch {
    return new NextResponse('Hello API Event Received', { status: 200 })
  }

  const eventType = payload?.event?.event_type
  const signatureRequest = payload?.signature_request

  if (eventType === 'signature_request_all_signed' && signatureRequest) {
    const signatureRequestId = signatureRequest.signature_request_id
    const applicationId = signatureRequest.metadata?.application_id

    const supabase = createAdminClient()

    if (applicationId) {
      await supabase
        .from('beta_applications')
        .update({ nda_signed_at: new Date().toISOString() })
        .eq('id', applicationId)
    } else if (signatureRequestId) {
      await supabase
        .from('beta_applications')
        .update({ nda_signed_at: new Date().toISOString() })
        .eq('signature_request_id', signatureRequestId)
    }

    console.log(`[Dropbox Sign] NDA signed — request: ${signatureRequestId}, app: ${applicationId}`)
  }

  // Dropbox Sign requires this exact response to acknowledge receipt
  return new NextResponse('Hello API Event Received', { status: 200 })
}
