import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST (authenticated) — create a new intake link
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_name } = await req.json()
  if (!client_name?.trim()) return NextResponse.json({ error: 'Client name required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('theme_intakes')
    .insert({ user_id: user.id, client_name: client_name.trim() })
    .select('token')
    .single()

  if (error) {
    console.error('[Intake create error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ token: data.token })
}

// GET (public) — verify token and return client_name
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('theme_intakes')
    .select('client_name, completed')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (data.completed) return NextResponse.json({ error: 'This form has already been submitted.' }, { status: 410 })

  return NextResponse.json({ client_name: data.client_name })
}

// PUT (public) — client submits the form, creates the theme
export async function PUT(req: Request) {
  const { token, ...formData } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const admin = createAdminClient()

  // Get intake
  const { data: intake, error: intakeErr } = await admin
    .from('theme_intakes')
    .select('user_id, client_name, completed')
    .eq('token', token)
    .single()

  if (intakeErr || !intake) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (intake.completed) return NextResponse.json({ error: 'Already submitted.' }, { status: 410 })

  // Create theme under editor's user_id
  const { data: theme, error: themeErr } = await admin
    .from('themes')
    .insert({ ...formData, user_id: intake.user_id, client_name: intake.client_name })
    .select('id')
    .single()

  if (themeErr) {
    console.error('[Intake submit error]', themeErr)
    return NextResponse.json({ error: themeErr.message }, { status: 500 })
  }

  // Mark intake as completed
  await admin
    .from('theme_intakes')
    .update({ completed: true, theme_id: theme.id })
    .eq('token', token)

  return NextResponse.json({ success: true })
}
