import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendBetaReportNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

const VALID_TYPES = ['bug', 'plugin_error', 'recommendation', 'other'] as const

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('is_beta_user')
      .eq('id', user.id)
      .single()

    if (!profile?.is_beta_user) {
      return NextResponse.json({ error: 'Beta access required' }, { status: 403 })
    }

    const { type, description, page } = await req.json()

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (!description?.trim() || description.trim().length < 5) {
      return NextResponse.json({ error: 'Description is too short' }, { status: 400 })
    }

    await admin.from('beta_reports').insert({
      user_id: user.id,
      type,
      description: description.trim().slice(0, 2000),
      page: page ? String(page).slice(0, 200) : null,
    })

    // Email alert for bugs and plugin errors — not for recommendations
    if (type === 'bug' || type === 'plugin_error') {
      const { data: profile } = await admin
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      sendBetaReportNotification({
        reporterEmail: profile?.email ?? null,
        type,
        description: description.trim(),
        page: page ?? null,
      }).catch(err => console.error('[Beta report email error]', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
