import nodemailer from 'nodemailer'

export async function sendNdaApprovalEmail({
  name,
  email,
  signingUrl,
}: {
  name: string
  email: string
  signingUrl: string
}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  })

  await transporter.sendMail({
    from: 'E.V.E. Studio <noreply@theevestudio.io>',
    to: email,
    subject: "You're approved — sign your NDA to activate access",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:36px 40px 24px;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.15em;color:#888;text-transform:uppercase;">The E.V.E. Studio</p>
              <h1 style="margin:12px 0 0;font-size:26px;font-weight:600;color:#fff;line-height:1.3;">You're approved, ${name}.</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#aaa;line-height:1.7;">
                Your beta application has been reviewed and approved. Before we activate your access, we need you to sign a short NDA.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#aaa;line-height:1.7;">
                It takes about 60 seconds — just read, type your name, and confirm. Your access goes live the moment you sign.
              </p>
              <a href="${signingUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background:#fff;border-radius:8px;font-size:15px;font-weight:600;color:#000;text-decoration:none;">
                Sign my NDA &rarr;
              </a>
              <p style="margin:20px 0 4px;font-size:13px;color:#555;line-height:1.6;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:13px;color:#888;word-break:break-all;">
                ${signingUrl}
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#555;line-height:1.6;">
                This link expires in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#444;">
                The E.V.E. Studio &nbsp;·&nbsp; theevestudio.io<br>
                If you didn't apply for beta access, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
