import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { raw_text, theme_id, title } = await req.json()

  if (!raw_text || raw_text.trim().length < 10) {
    return NextResponse.json({ error: 'Script text is too short' }, { status: 400 })
  }

  const systemPrompt = `You are VIBE, an expert social media script analyst.
Your job is to analyze a user-submitted script, extract its structure, score its viral potential, and return valid JSON only — no markdown, no explanation.`

  const userPrompt = `Analyze this user-submitted video script and extract its structure.

SCRIPT:
${raw_text}

Return a single JSON object with these fields:
{
  "title": "a short descriptive title for this script",
  "hook": "the opening hook line (first thing said on camera)",
  "body": ["body line 1", "body line 2", "..."],
  "cta": "the call to action (last thing said)",
  "hook_type": "one of: Question, Bold statement, Story open, Contrast, Curiosity gap, Direct offer, Unknown",
  "virality_score": number 1-10 based on hook strength, clarity, engagement potential,
  "duration_estimate": "estimated video length e.g. 30s, 45s, 60s",
  "b_roll_notes": ["suggested visual 1", "suggested visual 2"],
  "analysis_notes": "1-2 sentences on what works well and what could be improved"
}

Rules:
- If the script doesn't have a clear hook, use the first sentence as the hook
- If there's no clear CTA, write "No CTA detected"
- Be honest with the virality score — score based on real viral potential, not to flatter the user
- Body should be individual lines/sentences, not one big block`

  let parsed: any
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const raw = (message.content[0] as any).text.trim()
    const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Failed to analyze script. Please try again.' }, { status: 500 })
  }

  const admin = createAdminClient()

  const scriptRow = {
    user_id: user.id,
    theme_id: theme_id || null,
    title: title || parsed.title,
    script_content: {
      hook: parsed.hook,
      body: parsed.body,
      cta: parsed.cta,
      duration_estimate: parsed.duration_estimate,
      b_roll_notes: parsed.b_roll_notes,
    },
    original_content: {
      hook: parsed.hook,
      body: parsed.body,
      cta: parsed.cta,
      duration_estimate: parsed.duration_estimate,
      b_roll_notes: parsed.b_roll_notes,
    },
    virality_score: parsed.virality_score,
    hook_type: parsed.hook_type,
    source: 'imported',
    raw_text: raw_text.trim(),
    token_cost: 0,
    is_new: true,
    is_edited: false,
  }

  const { data: saved, error } = await admin.from('scripts').insert(scriptRow).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save script' }, { status: 500 })

  return NextResponse.json({ script: saved, analysis_notes: parsed.analysis_notes })
}
