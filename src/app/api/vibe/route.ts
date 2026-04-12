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

  // Load dynamic framework (auto-updated monthly by cron, falls back to hardcoded defaults)
  const { data: vibeConfig } = await admin
    .from('vibe_config')
    .select('hook_framework, platform_signals, virality_rubric')
    .eq('id', 1)
    .single()

  const hookFramework = vibeConfig?.hook_framework ?? DEFAULT_HOOK_FRAMEWORK
  const platformSignals = vibeConfig?.platform_signals ?? DEFAULT_PLATFORM_SIGNALS
  const viralityRubric = vibeConfig?.virality_rubric ?? DEFAULT_VIRALITY_RUBRIC

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

${hookFramework}

${platformSignals}

${viralityRubric}

Output a JSON array of exactly ${count} script objects. Each object must have:
{
  "title": "short descriptive title",
  "hook": "the opening line — first 3 seconds, must stop the scroll",
  "body": ["line 1", "line 2", "line 3", "..."],
  "cta": "clear call to action",
  "hook_type": "one of: Educational, Storytelling, Myth Busting, Comparison, Authority/Proof, Curiosity Gap, Pain Point, Controversy, Pattern Interrupt, Day in the Life",
  "virality_score": number 1-10,
  "duration_estimate": "e.g. 30s, 45s, 60s",
  "b_roll_notes": ["visual suggestion 1", "visual suggestion 2"],
  "algorithm_notes": "1-2 sentences explaining why this script is built to perform algorithmically — which engagement triggers are present and what platform signals it activates"
}

Rules:
- Hooks must be specific and punchy — no generic openers
- Body lines should be short and punchy (3-8 words each ideal) — every line must earn its place or it kills watch-through
- Scripts should feel native to the client's platforms and audience
- Vary hook types across the batch
- Build at least 2 engagement triggers into every script (share, save, comment, follow, watch-through)
- Score virality honestly using the algorithm rubric — most scripts should land 6-8, only scripts with 3+ engagement triggers and a clear share moment earn 9-10
- Target 15-35s scripts for max completion rates unless the topic genuinely requires more
- No fluff, no filler — dead lines destroy watch-through rates and kill algorithmic reach`

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

// ─── VIBE defaults ────────────────────────────────────────────────────────────
// These are used when vibe_config has not been seeded or the DB read fails.
// The monthly cron job at /api/cron/vibe-update overwrites the DB copy with
// research-backed updates — these are just the fallback.

const DEFAULT_HOOK_FRAMEWORK = `HOOK FRAMEWORK LIBRARY — Pick the best fit for each script and fill in specifics from the client profile:
- Educational: "Here's exactly how to [result]" / "It took me 10 years to learn this, I'll teach you in 1 minute" / "Everyone tells you to [X] but never shows you how" / "In 60 seconds I'm going to teach you more about [X] than you've learned in your entire life"
- Storytelling: "X years ago I [decision/struggle/pain point]" / "I started [thing] at [age] with [nothing]" / "I don't have a backup plan so this kind of needs to work" / "I did everything right. Here's what happened."
- Myth Busting: "Everything you know about [X] is wrong" / "Let me de-influence you from [X]" / "They said [famous belief]. That's a lie." / "More [target audience] need to hear this — [common belief] will NOT [result]"
- Comparison: "This vs this — same [metric], completely different [result]" / "Cheap vs. expensive [X]" / "[Before state] to [after state] in [timeframe]" / "This group did [X] and this group didn't — here's what happened"
- Authority/Proof: "My client went from [before] to [after] in [time]" / "I [dream result] in the past [time], here's proof" / "Just [one thing] took my client from [before] to [after]"
- Curiosity Gap: "The reason your [X] isn't working is..." / "Why is nobody talking about [X]?" / "There is one thing above all that sets the top [title] apart from everyone else" / "The lack of [studies/talk] on [X] isn't because it doesn't work, it's because..."
- Pain Point: "If you have [pain point 1], [pain point 2], and [pain point 3] — you might be doing [X] wrong" / "Stop [action] if you actually want [result]" / "Do you feel [pain point] no matter what you do?"
- Controversy: "This may be controversial but [hot take]" / "Not to flex, but I'm pretty good at [niche]" / "I do not believe in [common belief], I believe in [your belief]" / "Hot take: [common thing] is the worst thing you can do for [result]"
- Pattern Interrupt: "Don't touch this." / "That is crazy." / "So I messed up." / "Apparently if you…" / Ultra-short incomplete sentence that forces the viewer to stop and watch
- Day in the Life: "Day in the life of a [title] — [specific edition]" / "Come with me to [action] as a [title]" / "This is what an average day of a [title] looks like"`

const DEFAULT_PLATFORM_SIGNALS = `PLATFORM ALGORITHM SIGNALS — what each platform rewards (apply when scoring):
TikTok: Shares are the #1 signal. Every video is tested on ~200 viewers first — 70%+ completion rate unlocks 3x broader reach. Algorithm ranks: Shares > Comments > Likes. Videos tested hard in first 3 hours.
Instagram Reels: DM sends are the #1 distribution signal. Saves drive non-follower reach. Watch-through rate is critical. Captions are read by the algorithm like blog posts.
YouTube Shorts: 15-35s is the optimal length for completion. 70%+ completion rate triggers promotion. Shares signal viral potential to the algorithm.

ENGAGEMENT TRIGGER HIERARCHY (build at least 2 into every script):
- SHARE TRIGGER (most powerful): Creates a "you have to see this" moment — surprising stat, relatable pain, controversial take, or genuine value someone wants to send to a friend
- WATCH-THROUGH ARCHITECTURE: Hook opens a loop or plants a question the viewer must watch to resolve. Body lines build toward a satisfying payoff. No filler that gives permission to scroll.
- SAVE TRIGGER: Contains a list, framework, step-by-step, or insight worth revisiting. Saves = long-term algorithmic distribution boost.
- COMMENT TRIGGER: Sparks debate, hits a "this is literally me" moment, or asks a direct question. Comments signal strong content-viewer connection to the algorithm.
- FOLLOW TRIGGER: Script positions the creator as someone with a distinct POV worth following for more. Weaker signal than the above but compounds over time.`

const DEFAULT_VIRALITY_RUBRIC = `VIRALITY SCORE RUBRIC — score based on cumulative algorithm alignment:
- 9-10: Proven viral framework + specific numbers/details/names + clear share trigger (someone will DM this) + open loop hook that forces watch-through + at least 2 additional engagement triggers (save, comment, or follow) + directly addresses a pain or desire the audience feels right now
- 7-8: Strong framework + has a clear share or save trigger + above-average specificity + good retention architecture (hook builds to a payoff) + relevant to the target audience's actual pain or desire
- 5-6: Recognizable hook pattern but missing 2+ engagement triggers — generic execution, weak specificity, or body doesn't deliver on what the hook promised
- 3-4: Vague opener with no clear hook structure, body doesn't build on the hook, no identifiable share/save/comment trigger
- 1-2: Pure filler — could apply to any video in any niche, no reason to watch to the end, nothing worth sharing or saving`

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
