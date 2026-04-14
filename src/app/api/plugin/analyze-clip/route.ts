import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Color labels mapped to Premiere Pro's label indices
const CATEGORY_COLORS: Record<string, string> = {
  talking_head: 'violet',
  broll:        'teal',
  bts:          'yellow',
  interview:    'blue',
  title_card:   'green',
  unknown:      'none',
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, path, duration, frames } = await req.json()
  if (!name) return NextResponse.json({ error: 'clip name required' }, { status: 400 })

  // Build content array — text + optional vision frames
  const content: Anthropic.MessageParam['content'] = []

  if (frames && frames.length > 0) {
    // Add frame images for visual analysis
    for (const frame of frames.slice(0, 6)) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: frame },
      })
    }
  }

  content.push({
    type: 'text',
    text: `You are analyzing a video clip for an AI video editor called E.V.E.

Clip info:
- Name: ${name}
- Path: ${path || 'unknown'}
- Duration: ${duration ? `${Math.round(duration)}s` : 'unknown'}
${frames?.length ? `- ${frames.length} frames provided above` : '- No frames available (metadata-only analysis)'}

Classify this clip and respond with ONLY valid JSON, no other text:
{
  "category": "talking_head" | "broll" | "bts" | "interview" | "title_card" | "unknown",
  "subcategory": "indoor_closeup" | "outdoor" | "handheld" | "product" | "environment" | "action" | "other",
  "description": "one sentence describing what is in this clip",
  "tags": ["tag1", "tag2"],
  "energy_level": "low" | "medium" | "high",
  "suggested_label": "short human-readable label e.g. 'Talking Head — Indoor'"
}

Categories:
- talking_head: person speaking directly to camera
- broll: supplemental footage (products, environment, hands, activities)
- bts: behind-the-scenes, candid, setup shots
- interview: person speaking but not directly at camera, or with interviewer
- title_card: graphics, text overlays, slides
- unknown: cannot determine

Use the filename as a strong hint if no frames are available.`,
  })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const result = JSON.parse(json)
    result.color_label = CATEGORY_COLORS[result.category] ?? 'none'

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-clip error]', err)
    // Return a safe fallback
    return NextResponse.json({
      category: 'unknown',
      subcategory: 'other',
      description: `Clip: ${name}`,
      tags: [],
      energy_level: 'medium',
      suggested_label: name,
      color_label: 'none',
    })
  }
}
