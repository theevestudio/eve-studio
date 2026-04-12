export async function sendNdaForSigning(name: string, email: string, applicationId: string): Promise<string> {
  const ndaUrl = 'https://www.theevestudio.io/E.V.E._studio__beta_tester_nda.pdf'

  // URLSearchParams encodes brackets as %5B%5D which Dropbox Sign can't parse
  // Build body manually so keys like signers[0][email_address] stay literal
  const body = [
    `title=${encodeURIComponent('E.V.E. Studio Beta Tester NDA')}`,
    `subject=${encodeURIComponent('Sign your E.V.E. Studio Beta NDA')}`,
    `message=${encodeURIComponent(`Hi ${name}, your beta application has been approved! Please sign the NDA below to activate your access to E.V.E. Studio.`)}`,
    `signers[0][email_address]=${encodeURIComponent(email)}`,
    `signers[0][name]=${encodeURIComponent(name)}`,
    `file_urls[0]=${encodeURIComponent(ndaUrl)}`,
    `metadata[application_id]=${encodeURIComponent(applicationId)}`,
    `test_mode=0`,
  ].join('&')

  const auth = Buffer.from(`${process.env.DROPBOX_SIGN_API_KEY}:`).toString('base64')

  const res = await fetch('https://api.hellosign.com/v3/signature_request/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Dropbox Sign error: ${err}`)
  }

  const data = await res.json()
  return data.signature_request.signature_request_id
}
