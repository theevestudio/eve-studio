import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const admin = createAdminClient()

    // Only track beta users who have consented
    const { data: profile } = await admin
      .from('profiles')
      .select('is_beta_user, analytics_consent')
      .eq('id', user.id)
      .single()

    if (!profile?.is_beta_user || !profile?.analytics_consent) {
      return NextResponse.json({ ok: false, reason: 'not_eligible' })
    }

    const { event, page, properties } = await req.json()
    if (!event) return NextResponse.json({ ok: false }, { status: 400 })

    await admin.from('beta_events').insert({
      user_id: user.id,
      event: String(event).slice(0, 100),
      page: page ? String(page).slice(0, 200) : null,
      properties: properties ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
