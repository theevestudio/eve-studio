import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { script_id, session_id } = await req.json()
  if (!script_id || !session_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('script_hearts').upsert(
    { script_id, session_id },
    { onConflict: 'script_id,session_id', ignoreDuplicates: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { script_id, session_id } = await req.json()
  if (!script_id || !session_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('script_hearts').delete()
    .eq('script_id', script_id)
    .eq('session_id', session_id)

  return NextResponse.json({ ok: true })
}
