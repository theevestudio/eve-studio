import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email, use_case } = await req.json()

  if (!name?.trim() || !email?.includes('@')) {
    return NextResponse.json({ error: 'Name and valid email are required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('beta_applications')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      use_case: use_case?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ already: true })
    }
    console.error('[Beta application error]', error)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
