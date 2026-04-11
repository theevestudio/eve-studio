import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export default async function ScriptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: script } = await admin
    .from('scripts')
    .select('*, themes(client_name)')
    .eq('id', id)
    .single()

  if (!script) notFound()

  const content = script.script_content
  const clientName = (script.themes as any)?.client_name || null

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>{script.title || 'Script'} — E.V.E. Studio</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #fff;
            color: #111;
            padding: 48px;
            max-width: 720px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #111;
          }
          .brand { font-size: 12px; color: #999; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
          .title { font-size: 22px; font-weight: 800; line-height: 1.3; max-width: 480px; }
          .meta { text-align: right; font-size: 12px; color: #666; line-height: 1.8; }
          .badge {
            display: inline-block;
            background: #7c3aed;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            margin-bottom: 6px;
          }
          .section { margin-bottom: 28px; }
          .section-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 8px;
          }
          .hook {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.4;
            color: #111;
          }
          .body-line {
            font-size: 15px;
            color: #333;
            line-height: 1.7;
            margin-bottom: 4px;
          }
          .cta {
            font-size: 16px;
            font-weight: 600;
            color: #111;
          }
          .broll-item {
            font-size: 13px;
            color: #666;
            margin-bottom: 3px;
          }
          .broll-item::before { content: "· "; }
          .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #bbb;
            display: flex;
            justify-content: space-between;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #7c3aed;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          @media (max-width: 600px) {
            body { padding: 24px 16px; }
            .header { flex-direction: column; gap: 12px; }
            .meta { text-align: left; }
            .title { font-size: 18px; }
            .hook { font-size: 16px; }
            .print-btn { top: 12px; right: 12px; padding: 8px 14px; font-size: 12px; }
          }
          @media print {
            .print-btn { display: none; }
            body { padding: 32px; }
          }
        `}</style>
      </head>
      <body>
        <button className="print-btn" id="print-btn">Export PDF</button>

        <div className="header">
          <div>
            <div className="brand">The E.V.E. Studio{clientName ? ` · ${clientName}` : ''}</div>
            <div className="title">{script.title || 'Untitled Script'}</div>
          </div>
          <div className="meta">
            {script.virality_score && <div><div className="badge">{script.virality_score}/10 virality</div></div>}
            {script.hook_type && <div>{script.hook_type}</div>}
            {content?.duration_estimate && <div>{content.duration_estimate}</div>}
            <div>{new Date(script.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Hook</div>
          <div className="hook">{content?.hook}</div>
        </div>

        <hr className="divider" />

        <div className="section">
          <div className="section-label">Body</div>
          {content?.body?.map((line: string, i: number) => (
            <div key={i} className="body-line">{line}</div>
          ))}
        </div>

        <hr className="divider" />

        <div className="section">
          <div className="section-label">Call to Action</div>
          <div className="cta">{content?.cta}</div>
        </div>

        {content?.b_roll_notes && content.b_roll_notes.length > 0 && (
          <>
            <hr className="divider" />
            <div className="section">
              <div className="section-label">B-Roll Notes</div>
              {content.b_roll_notes.map((note: string, i: number) => (
                <div key={i} className="broll-item">{note}</div>
              ))}
            </div>
          </>
        )}

        <div className="footer">
          <span>Generated by VIBE · The E.V.E. Studio</span>
          <span>theevestudio.io</span>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          document.getElementById('print-btn').onclick = function() { window.print(); };
          if (new URLSearchParams(window.location.search).get('print') === '1') {
            window.onload = function() { window.print(); }
          }
        `}} />
      </body>
    </html>
  )
}
