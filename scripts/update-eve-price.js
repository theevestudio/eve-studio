const Stripe = require('stripe')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function main() {
  // Get the existing price to find the product ID
  const existing = await stripe.prices.retrieve(process.env.STRIPE_PRICE_EVE_MONTHLY)
  console.log(`Existing product: ${existing.product}`)

  // Archive old price
  await stripe.prices.update(existing.id, { active: false })

  // Create new $39 price on the same product
  const newPrice = await stripe.prices.create({
    product: existing.product,
    unit_amount: 3900,
    currency: 'usd',
    recurring: { interval: 'month' },
  })
  console.log(`New price ID: ${newPrice.id}`)

  // Update .env.local
  const envPath = path.join(__dirname, '../.env.local')
  let env = fs.readFileSync(envPath, 'utf8')
  env = env
    .replace(/STRIPE_PRICE_EVE_MONTHLY=.*/, `STRIPE_PRICE_EVE_MONTHLY=${newPrice.id}`)
    .replace(/NEXT_PUBLIC_STRIPE_PRICE_EVE_MONTHLY=.*/, `NEXT_PUBLIC_STRIPE_PRICE_EVE_MONTHLY=${newPrice.id}`)
  fs.writeFileSync(envPath, env)

  console.log('Done — EVE Monthly updated to $39/mo')
}

main().catch(console.error)
