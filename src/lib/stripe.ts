import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  EVE_MONTHLY: {
    name: 'EVE Monthly',
    price: 39,
    priceId: process.env.STRIPE_PRICE_EVE_MONTHLY!,
    description: 'Full EVE plugin access + 3 free VIBE tokens',
  },
  EVE_LIFETIME: {
    name: 'EVE Monthly — Founding Member Rate',
    price: 29,
    priceId: process.env.STRIPE_PRICE_EVE_LIFETIME!,
    description: 'Locked-in $29/month forever. Beta tester exclusive.',
  },
}

export const TOKEN_PACKS = {
  TOKENS_5: {
    tokens: 5,
    price: 4,
    priceId: process.env.STRIPE_PRICE_TOKENS_5!,
  },
  TOKENS_15: {
    tokens: 15,
    price: 10,
    priceId: process.env.STRIPE_PRICE_TOKENS_15!,
  },
  TOKENS_30: {
    tokens: 30,
    price: 18,
    priceId: process.env.STRIPE_PRICE_TOKENS_30!,
  },
}
