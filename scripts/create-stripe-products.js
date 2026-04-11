const Stripe = require('stripe')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function main() {
  console.log('Creating Stripe products...\n')

  // EVE Monthly Subscription
  const eveSub = await stripe.products.create({
    name: 'EVE Monthly',
    description: 'Full access to The E.V.E. Studio plugin + 3 free VIBE tokens on signup',
  })
  const evePrice = await stripe.prices.create({
    product: eveSub.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
  })
  console.log(`✓ EVE Monthly — $29/mo: ${evePrice.id}`)

  // Token pack: 5 tokens
  const tokens5 = await stripe.products.create({ name: 'VIBE Tokens — 5 Pack', description: '5 VIBE script tokens. Never expire.' })
  const price5 = await stripe.prices.create({ product: tokens5.id, unit_amount: 400, currency: 'usd' })
  console.log(`✓ 5 Tokens — $4: ${price5.id}`)

  // Token pack: 15 tokens
  const tokens15 = await stripe.products.create({ name: 'VIBE Tokens — 15 Pack', description: '15 VIBE script tokens. Never expire.' })
  const price15 = await stripe.prices.create({ product: tokens15.id, unit_amount: 1000, currency: 'usd' })
  console.log(`✓ 15 Tokens — $10: ${price15.id}`)

  // Token pack: 30 tokens
  const tokens30 = await stripe.products.create({ name: 'VIBE Tokens — 30 Pack', description: '30 VIBE script tokens. Never expire.' })
  const price30 = await stripe.prices.create({ product: tokens30.id, unit_amount: 1800, currency: 'usd' })
  console.log(`✓ 30 Tokens — $18: ${price30.id}`)

  // Write price IDs to .env.local
  const envPath = path.join(__dirname, '../.env.local')
  let env = fs.readFileSync(envPath, 'utf8')
  env = env
    .replace(/STRIPE_PRICE_EVE_MONTHLY=.*/, `STRIPE_PRICE_EVE_MONTHLY=${evePrice.id}`)
    .replace(/STRIPE_PRICE_TOKENS_5=.*/, `STRIPE_PRICE_TOKENS_5=${price5.id}`)
    .replace(/STRIPE_PRICE_TOKENS_15=.*/, `STRIPE_PRICE_TOKENS_15=${price15.id}`)
    .replace(/STRIPE_PRICE_TOKENS_30=.*/, `STRIPE_PRICE_TOKENS_30=${price30.id}`)
  fs.writeFileSync(envPath, env)

  console.log('\n✓ .env.local updated with all price IDs')
  console.log('\nDone! Restart your dev server to pick up the new env vars.')
}

main().catch(console.error)
