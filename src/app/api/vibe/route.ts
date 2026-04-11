import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { theme_id, count, topic, tone, hookPref, ctaOverride } = await req.json()
  if (!theme_id || !count || count < 1 || count > 10) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check token balance
  const { data: balance } = await admin
    .from('token_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!balance || balance.balance < count) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 })
  }

  // Fetch theme
  const { data: theme } = await supabase
    .from('themes')
    .select('*')
    .eq('id', theme_id)
    .eq('user_id', user.id)
    .single()

  if (!theme) return NextResponse.json({ error: 'Theme not found' }, { status: 404 })

  // Build prompt
  const themeContext = buildThemeContext(theme)

  const customInstructions = [
    topic ? `TOPIC FOCUS: All scripts must be about — "${topic}"` : '',
    tone ? `TONE: Write in a ${tone.toLowerCase()} tone` : '',
    hookPref ? `HOOK STYLE: Use "${hookPref}" hooks only` : '',
    ctaOverride ? `CTA OVERRIDE: Use this CTA instead of the theme default — "${ctaOverride}"` : '',
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are VIBE — an expert social media script writer for video content creators and editors.
You write scroll-stopping, platform-native scripts that drive real engagement.
Your scripts are punchy, specific, and built around proven viral structures.
Always output valid JSON only — no markdown, no explanation.`

  const userPrompt = `Generate exactly ${count} unique video script(s) for this client.

CLIENT BRAND PROFILE:
${themeContext}
${customInstructions ? `\nCUSTOM INSTRUCTIONS (take priority):\n${customInstructions}` : ''}

Output a JSON array of exactly ${count} script objects. Each object must have:
{
  "title": "short descriptive title",
  "hook": "the opening line — first 3 seconds, must stop the scroll",
  "body": ["line 1", "line 2", "line 3", "..."],
  "cta": "clear call to action",
  "hook_type": "one of: Question, Bold statement, Story open, Contrast, Curiosity gap, Direct offer",
  "virality_score": number 1-10,
  "duration_estimate": "e.g. 30s, 45s, 60s",
  "b_roll_notes": ["visual suggestion 1", "visual suggestion 2"]
}

Rules:
- Hooks must be specific and punchy — no generic openers
- Body lines should be short and punchy (3-8 words each ideal)
- Scripts should feel native to the client's platforms and audience
- Vary hook types across the batch
- No fluff, no filler — every line earns its place`

  let parsed: any[]
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const raw = (message.content[0] as any).text.trim()
    const jsonStr = raw.startsWith('[') ? raw : raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    return NextResponse.json({ error: 'Script generation failed. Please try again.' }, { status: 500 })
  }

  // Save scripts first — deduct tokens only if save succeeds
  const batch_id = crypto.randomUUID()
  const scriptRows = parsed.map(s => ({
    user_id: user.id,
    theme_id,
    title: s.title,
    script_content: {
      hook: s.hook,
      body: s.body,
      cta: s.cta,
      duration_estimate: s.duration_estimate,
      b_roll_notes: s.b_roll_notes,
    },
    original_content: {
      hook: s.hook,
      body: s.body,
      cta: s.cta,
      duration_estimate: s.duration_estimate,
      b_roll_notes: s.b_roll_notes,
    },
    virality_score: s.virality_score,
    hook_type: s.hook_type,
    token_cost: 1,
    batch_id,
    is_new: true,
    is_edited: false,
  }))

  const { data: savedScripts, error: saveError } = await admin.from('scripts').insert(scriptRows).select()

  if (saveError || !savedScripts) {
    return NextResponse.json({ error: 'Failed to save scripts. Your tokens were not deducted.' }, { status: 500 })
  }

  // Deduct tokens after successful save
  await admin
    .from('token_balances')
    .update({ balance: balance.balance - count, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -count,
    type: 'spend',
    description: `Generated ${count} script(s) for ${theme.client_name}`,
  })

  return NextResponse.json({ scripts: savedScripts!, batch_id, new_balance: balance.balance - count })
}

function buildThemeContext(theme: any): string {
  const lines: string[] = []
  if (theme.client_name) lines.push(`Client: ${theme.client_name}`)
  if (theme.industry) lines.push(`Industry: ${theme.industry}`)
  if (theme.sub_niche) lines.push(`Sub-niche: ${theme.sub_niche}`)
  if (theme.platforms?.length) lines.push(`Platforms: ${theme.platforms.join(', ')}`)
  if (theme.videos_per_month) lines.push(`Videos/month: ${theme.videos_per_month}`)
  if (theme.audience_age) lines.push(`Audience age: ${theme.audience_age}`)
  if (theme.audience_gender) lines.push(`Audience gender: ${theme.audience_gender}`)
  if (theme.audience_lifestyle?.length) lines.push(`Audience lifestyle: ${theme.audience_lifestyle.join(', ')}`)
  if (theme.audience_wants?.length) lines.push(`Audience wants: ${theme.audience_wants.join(', ')}`)
  if (theme.audience_knowledge) lines.push(`Audience knowledge level: ${theme.audience_knowledge}`)
  if (theme.content_personality?.length) lines.push(`Content personality: ${theme.content_personality.join(', ')}`)
  if (theme.on_camera) lines.push(`On camera: ${theme.on_camera}`)
  if (theme.speaking_style) lines.push(`Speaking style: ${theme.speaking_style}`)
  if (theme.hook_styles?.length) lines.push(`Preferred hook styles: ${theme.hook_styles.join(', ')}`)
  if (theme.topics_never?.length) lines.push(`Never cover: ${theme.topics_never.join(', ')}`)
  if (theme.content_goals?.length) lines.push(`Content goals: ${theme.content_goals.join(', ')}`)
  if (theme.primary_cta) lines.push(`Primary CTA: ${theme.primary_cta}`)
  if (theme.signature_offer) lines.push(`Signature offer: ${theme.signature_offer}`)
  if (theme.content_pillars?.length) lines.push(`Content pillars: ${theme.content_pillars.join(', ')}`)
  if (theme.filming_location?.length) lines.push(`Filming location: ${theme.filming_location.join(', ')}`)
  if (theme.visual_vibe) lines.push(`Visual vibe: ${theme.visual_vibe}`)
  if (theme.audio_style) lines.push(`Audio style: ${theme.audio_style}`)
  if (theme.brand_differentiators?.length) lines.push(`Brand differentiators: ${theme.brand_differentiators.join(', ')}`)
  if (theme.real_comments) lines.push(`Real audience comments/questions: ${theme.real_comments}`)
  if (theme.common_misconception) lines.push(`Common misconception in niche: ${theme.common_misconception}`)
  if (theme.synthesized_theme) lines.push(`\nBrand synthesis:\n${theme.synthesized_theme}`)
  return lines.join('\n')
}
