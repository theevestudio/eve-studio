import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId, mode, tokens } = await req.json()

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email || user.email || '' })
    customerId = customer.id
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: mode === 'subscription' ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`,
    metadata: { user_id: user.id, tokens: tokens?.toString() || '0' },
  })

  return NextResponse.json({ url: session.url })
}
