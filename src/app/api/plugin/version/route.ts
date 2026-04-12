export const runtime = 'edge'

// Bump BETA_VERSION each time you fix a bug and repackage the beta plugin.
// Bump PRODUCTION_VERSION only when promoting a stable build to paying subscribers.
const BETA_VERSION       = '1.0.0-beta.1'
const PRODUCTION_VERSION = '1.0.0'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel')
  const version = channel === 'beta' ? BETA_VERSION : PRODUCTION_VERSION
  return Response.json({ version, channel: channel ?? 'production' })
}
