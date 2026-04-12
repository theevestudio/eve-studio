export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  stripe_customer_id: string | null
  eve_subscription_active: boolean
  eve_subscription_start: string | null
  is_beta_user: boolean
  beta_expires_at: string | null
  analytics_consent: boolean
  analytics_consent_at: string | null
  created_at: string
}

export type TokenBalance = {
  id: string
  user_id: string
  balance: number
  lifetime_earned: number
  updated_at: string
}

export type Theme = {
  id: string
  user_id: string
  client_name: string
  industry: string | null
  sub_niche: string | null
  platforms: string[] | null
  videos_per_month: string | null
  audience_age: string[] | null
  audience_gender: string | null
  audience_lifestyle: string[] | null
  audience_wants: string[] | null
  audience_knowledge: string | null
  content_personality: string[] | null
  on_camera: string | null
  speaking_style: string | null
  hook_styles: string[] | null
  topics_never: string[] | null
  content_goals: string[] | null
  primary_cta: string | null
  signature_offer: string | null
  content_pillars: string[] | null
  filming_location: string[] | null
  visual_vibe: string | null
  audio_style: string | null
  brand_differentiators: string[] | null
  real_comments: string | null
  common_misconception: string | null
  synthesized_theme: string | null
  created_at: string
  updated_at: string
}

export type Script = {
  id: string
  user_id: string
  theme_id: string | null
  title: string | null
  format: 'vertical' | 'horizontal' | 'square' | null
  script_content: ScriptContent | null
  original_content: ScriptContent | null
  virality_score: number | null
  hook_type: string | null
  is_edited: boolean
  is_new: boolean
  batch_id: string | null
  token_cost: number
  source: 'vibe' | 'imported' | null
  raw_text: string | null
  created_at: string
  updated_at: string
}

export type ScriptContent = {
  hook: string
  body: string[]
  cta: string
  duration_estimate?: string
  b_roll_notes?: string[]
}
