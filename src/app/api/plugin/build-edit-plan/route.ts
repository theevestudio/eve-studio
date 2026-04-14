import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { script, manifest, sequence_settings } = await req.json()
  if (!script || !manifest?.clips?.length) {
    return NextResponse.json({ error: 'script and manifest required' }, { status: 400 })
  }

  const fps = parseFloat(sequence_settings?.fps || '29.97')
  const clips = manifest.clips.filter((c: { category: string }) => c.category !== 'unknown')

  const clipSummary = clips.map((c: {
    name: string; category: string; subcategory: string;
    description: string; tags: string[]; energy_level: string;
    duration: number; path: string;
  }, i: number) => (
    `[${i}] ${c.name} | ${c.category} | ${c.subcategory} | energy:${c.energy_level} | ${Math.round(c.duration)}s\n    "${c.description}"\n    tags: ${c.tags?.join(', ')}`
  )).join('\n')

  const scriptText = JSON.stringify({
    hook: script.hook,
    body: script.body,
    cta: script.cta,
    b_roll_notes: script.b_roll_notes,
    duration_estimate: script.duration_estimate,
  }, null, 2)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are E.V.E., an autonomous AI video editor. Build a precise edit plan for a short-form vertical video.

SCRIPT:
${scriptText}

AVAILABLE FOOTAGE (${clips.length} clips):
${clipSummary}

SEQUENCE SETTINGS: ${fps}fps

Rules:
1. HOOK (first beat): Use the highest-energy talking_head clip. Duration: 6-12 seconds.
2. BODY BEATS: Alternate between talking_head and broll clips. Each beat: 4-10 seconds.
   - Match b_roll_notes to broll clips by description/tags similarity.
   - Use different clips for different beats — no repeats unless necessary.
3. CTA (last beat): End on a clean talking_head clip. Duration: 4-8 seconds.
4. In/out points: Choose start/end within the clip's duration with a 0.5s buffer from edges.
5. Prefer clips where energy_level matches the script beat's emotional tone.
6. Total edit should be 30-90 seconds for short-form.

Respond with ONLY valid JSON, no other text:
{
  "edit_plan": [
    {
      "beat": "hook" | "body_1" | "body_2" | ... | "broll_1" | ... | "cta",
      "clip_index": <number from the list above>,
      "clip_name": "<filename>",
      "clip_path": "<path>",
      "in_point": <seconds float>,
      "out_point": <seconds float>,
      "timeline_position": <cumulative seconds float>,
      "audio_action": "keep" | "mute" | "duck",
      "reason": "<one short sentence why this clip for this beat>"
    }
  ],
  "total_duration": <seconds>,
  "summary": "<one sentence describing the edit>"
}`,
    }],
  })

  try {
    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const json = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const plan = JSON.parse(json)

    // Enrich with full clip data
    plan.edit_plan = plan.edit_plan.map((beat: { clip_index: number }) => ({
      ...beat,
      ...clips[beat.clip_index] ? {
        clip_path: clips[beat.clip_index].path,
        clip_name: clips[beat.clip_index].name,
      } : {},
    }))

    return NextResponse.json(plan)
  } catch (err) {
    console.error('[build-edit-plan error]', err)
    return NextResponse.json({ error: 'Failed to build edit plan' }, { status: 500 })
  }
}
