export const runtime = 'edge'

const CURRENT_VERSION = '1.0.0'

export async function GET() {
  return Response.json({ version: CURRENT_VERSION })
}
