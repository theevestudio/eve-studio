import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {

    // ── One-time token purchase ─────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const tokens = parseInt(session.metadata?.tokens || '0')

      if (!userId || !tokens) break

      // Credit tokens
      const { data: balance } = await admin
        .from('token_balances')
        .select('balance, lifetime_earned')
        .eq('user_id', userId)
        .single()

      if (balance) {
        await admin.from('token_balances').update({
          balance: balance.balance + tokens,
          lifetime_earned: balance.lifetime_earned + tokens,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
      }

      await admin.from('token_transactions').insert({
        user_id: userId,
        amount: tokens,
        type: 'purchase',
        description: `Purchased ${tokens} VIBE token${tokens !== 1 ? 's' : ''}`,
      })

      console.log(`Credited ${tokens} tokens to user ${userId}`)
      break
    }

    // ── Subscription activated ──────────────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const isActive = sub.status === 'active' || sub.status === 'trialing'

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) break

      await admin.from('profiles').update({
        eve_subscription_active: isActive,
        eve_subscription_start: isActive ? new Date().toISOString() : null,
      }).eq('id', profile.id)

      console.log(`Subscription ${isActive ? 'activated' : 'updated'} for customer ${customerId}`)
      break
    }

    // ── Subscription cancelled ──────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile) break

      await admin.from('profiles').update({
        eve_subscription_active: false,
      }).eq('id', profile.id)

      console.log(`Subscription cancelled for customer ${customerId}`)
      break
    }

    // ── Payment failed ──────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      console.log(`Payment failed for customer ${customerId}`)
      // Could send email here in future
      break
    }

    default:
      console.log(`Unhandled event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
