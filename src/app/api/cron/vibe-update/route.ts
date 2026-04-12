import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dateContext = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const researchPrompt = `You are updating the VIBE social media script generation engine for ${dateContext}.

Your task: research the current state of short-form video algorithms and viral content patterns, then output an updated framework.

Search for:
1. TikTok algorithm ranking signals and changes in ${now.getFullYear()}
2. Instagram Reels algorithm and distribution factors in ${now.getFullYear()}
3. YouTube Shorts algorithm signals and optimal content structure in ${now.getFullYear()}
4. Most viral short-form video hook patterns and structures from top-performing content right now
5. Emerging hook frameworks and formats that top creators are using

After researching, output ONLY a valid JSON object with no markdown formatting:
{
  "hook_framework": "The full updated HOOK FRAMEWORK LIBRARY — 10+ categories with example hook structures. Each category should have 3-5 proven example structures. Incorporate any new/updated viral hook patterns you found in your research.",
  "platform_signals": "The full updated PLATFORM ALGORITHM SIGNALS section — what each platform rewards, ranked by signal weight. Include TikTok, Instagram Reels, and YouTube Shorts. List the ENGAGEMENT TRIGGER HIERARCHY (Share, Watch-Through, Save, Comment, Follow) with explanations of why each matters algorithmically.",
  "virality_rubric": "The full updated VIRALITY SCORE RUBRIC — 5 tiers (9-10, 7-8, 5-6, 3-4, 1-2) with specific criteria based on algorithm signals. Each tier must reference engagement triggers and algorithm behavior, not just hook quality.",
  "research_summary": "2-3 sentences on the most important new findings — what changed or what's newly confirmed about how these algorithms work right now."
}`

  let finalText = ''

  // Try with Anthropic web search beta first
  try {
    const response = await (anthropic as any).beta.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      betas: ['web-search-2025-03-05'],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: 'You are a social media algorithm researcher. Always search the web for the most current information before answering. Output only valid JSON — no markdown, no explanation outside the JSON.',
      messages: [{ role: 'user', content: researchPrompt }],
    })

    // Handle tool-use loop if needed
    const messages: any[] = [{ role: 'user', content: researchPrompt }, { role: 'assistant', content: response.content }]
    let current = response

    let iterations = 0
    while (current.stop_reason === 'tool_use' && iterations < 6) {
      iterations++
      const toolResults = current.content
        .filter((b: any) => b.type === 'tool_use')
        .map((b: any) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.content ?? 'Search completed',
        }))
      messages.push({ role: 'user', content: toolResults })

      current = await (anthropic as any).beta.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        betas: ['web-search-2025-03-05'],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a social media algorithm researcher. Output only valid JSON — no markdown, no explanation outside the JSON.',
        messages,
      })
      messages.push({ role: 'assistant', content: current.content })
    }

    const textBlock = current.content.find((b: any) => b.type === 'text')
    if (textBlock?.text) finalText = textBlock.text.trim()
  } catch (searchErr) {
    console.log('[vibe-update] web search unavailable, using knowledge mode:', String(searchErr))
  }

  // Fallback: knowledge-only (still valuable — Claude model itself updates over time)
  if (!finalText) {
    const fallback = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'You are a social media algorithm expert updating a script generation system. Output only valid JSON — no markdown, no explanation outside the JSON.',
      messages: [{ role: 'user', content: researchPrompt }],
    })
    finalText = ((fallback.content[0] as any).text ?? '').trim()
  }

  // Parse JSON
  let parsed: any
  try {
    const jsonStr = finalText.startsWith('{')
      ? finalText
      : finalText.slice(finalText.indexOf('{'), finalText.lastIndexOf('}') + 1)
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    console.error('[vibe-update] JSON parse failed:', e, finalText.slice(0, 300))
    return NextResponse.json({ error: 'Failed to parse research output' }, { status: 500 })
  }

  if (!parsed.hook_framework || !parsed.platform_signals || !parsed.virality_rubric) {
    return NextResponse.json({ error: 'Incomplete research output — missing required fields' }, { status: 500 })
  }

  // Write to Supabase
  const admin = createAdminClient()
  const { error } = await admin.from('vibe_config').upsert({
    id: 1,
    hook_framework: parsed.hook_framework,
    platform_signals: parsed.platform_signals,
    virality_rubric: parsed.virality_rubric,
    updated_at: now.toISOString(),
    last_update_source: 'monthly_auto',
    research_summary: parsed.research_summary ?? null,
  })

  if (error) {
    console.error('[vibe-update] DB write failed:', error)
    return NextResponse.json({ error: 'DB write failed', details: error.message }, { status: 500 })
  }

  console.log('[vibe-update] ✓ Updated for', dateContext, '—', parsed.research_summary)
  return NextResponse.json({ success: true, updated: dateContext, summary: parsed.research_summary })
}
