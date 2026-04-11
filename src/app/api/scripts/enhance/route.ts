import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { script_id } = await req.json()
  if (!script_id) return NextResponse.json({ error: 'Missing script_id' }, { status: 400 })

  const admin = createAdminClient()

  // Check token balance
  const { data: balance } = await admin
    .from('token_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!balance || balance.balance < 1) {
    return NextResponse.json({ error: 'Insufficient tokens — Enhancement costs 1 token' }, { status: 402 })
  }

  // Fetch the script
  const { data: script } = await admin
    .from('scripts')
    .select('*')
    .eq('id', script_id)
    .eq('user_id', user.id)
    .single()

  if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

  // Fetch theme context if available
  let themeContext = ''
  if (script.theme_id) {
    const { data: theme } = await admin.from('themes').select('*').eq('id', script.theme_id).single()
    if (theme) {
      themeContext = `\nCLIENT BRAND CONTEXT:\nClient: ${theme.client_name}\n${theme.industry ? `Industry: ${theme.industry}` : ''}\n${theme.synthesized_theme ? `Brand synthesis: ${theme.synthesized_theme}` : ''}\n${theme.primary_cta ? `Primary CTA: ${theme.primary_cta}` : ''}`
    }
  }

  const originalText = script.raw_text || [
    script.script_content?.hook,
    ...(script.script_content?.body || []),
    script.script_content?.cta,
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are VIBE — an expert social media script writer.
Your job is to take a user's existing script idea and rewrite it in VIBE's optimized format — keeping the same core topic and message, but making it sharper, punchier, and more scroll-stopping.
Always output valid JSON only — no markdown, no explanation.`

  const userPrompt = `Enhance this script using VIBE's proven viral framework. Keep the same topic and core message, but rewrite it to be sharper and more optimized for social media.
${themeContext}

ORIGINAL SCRIPT:
${originalText}

Return a single JSON object:
{
  "title": "short descriptive title",
  "hook": "rewritten opening hook — must stop the scroll in first 3 seconds",
  "body": ["punchy line 1", "punchy line 2", "..."],
  "cta": "clear and compelling call to action",
  "hook_type": "one of: Question, Bold statement, Story open, Contrast, Curiosity gap, Direct offer",
  "virality_score": number 1-10,
  "duration_estimate": "e.g. 30s, 45s, 60s",
  "b_roll_notes": ["visual suggestion 1", "visual suggestion 2"]
}

Rules:
- Hook must be specific and punchy — no generic openers
- Body lines should be short (3-8 words each ideal)
- Keep the original core idea intact — enhance the delivery, not the topic
- No fluff`

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
    return NextResponse.json({ error: 'Enhancement failed. Please try again.' }, { status: 500 })
  }

  // Deduct 1 token
  await admin
    .from('token_balances')
    .update({ balance: balance.balance - 1, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -1,
    type: 'spend',
    description: `Enhanced imported script: ${script.title || 'Untitled'}`,
  })

  // Update the script with enhanced content
  const enhanced = {
    hook: parsed.hook,
    body: parsed.body,
    cta: parsed.cta,
    duration_estimate: parsed.duration_estimate,
    b_roll_notes: parsed.b_roll_notes,
  }

  const { data: updated, error } = await admin
    .from('scripts')
    .update({
      script_content: enhanced,
      original_content: script.original_content || script.script_content,
      title: parsed.title,
      virality_score: parsed.virality_score,
      hook_type: parsed.hook_type,
      source: 'vibe',
      is_edited: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', script_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save enhanced script' }, { status: 500 })

  return NextResponse.json({ script: updated, new_balance: balance.balance - 1 })
}
