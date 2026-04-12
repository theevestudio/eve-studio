import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const prompt = `You are parsing a client onboarding form to extract social media content strategy information.

Here is the form text:
---
${text}
---

Extract all relevant information and return ONLY a valid JSON object. Use null for anything you cannot determine with reasonable confidence from the text.

{
  "client_name": string or null,
  "industry": string or null,
  "sub_niche": string or null,
  "platforms": array of strings from [Instagram, TikTok, YouTube, Facebook, LinkedIn, Pinterest] or null,
  "videos_per_month": string or null,
  "audience_age": string or null,
  "audience_gender": string or null,
  "audience_lifestyle": array of strings or null,
  "audience_wants": array of strings or null,
  "audience_knowledge": string or null,
  "content_personality": array of strings from [Educational, Entertaining, Inspirational, Controversial, Authentic/Raw, Luxury, Funny] or null,
  "on_camera": string or null,
  "speaking_style": string or null,
  "hook_styles": array of strings from [Question, Bold statement, Story open, Contrast/Before-After, Curiosity gap, Direct offer] or null,
  "topics_never": array of strings or null,
  "content_goals": array of strings from [Grow audience, Drive sales, Build trust, Educate, Entertain, Book consultations] or null,
  "primary_cta": string or null,
  "signature_offer": string or null,
  "content_pillars": array of strings or null,
  "filming_location": array of strings or null,
  "visual_vibe": string or null,
  "audio_style": string or null,
  "brand_differentiators": array of strings or null,
  "real_comments": string or null,
  "common_misconception": string or null
}

Return ONLY the JSON object. No explanation, no markdown, no extra text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (response.content[0] as any).text.trim()
    const fields = JSON.parse(raw)
    return NextResponse.json({ fields })
  } catch (err) {
    console.error('[Theme parse error]', err)
    return NextResponse.json({ error: 'Failed to parse form. Try again.' }, { status: 500 })
  }
}
