import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get their profile to confirm they're a beta user
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, is_beta_user')
    .eq('id', user.id)
    .single()

  if (!profile?.is_beta_user) {
    return NextResponse.json({ error: 'No active beta session found.' }, { status: 400 })
  }

  // Insert a reapplication — admin reviews these same as original applications
  const { error } = await admin
    .from('beta_applications')
    .insert({
      name: profile.full_name || user.email || 'Unknown',
      email: profile.email || user.email || '',
      use_case: '[BETA EXTENSION REQUEST] Existing beta tester requesting 3-month extension.',
      status: 'pending',
    })

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
