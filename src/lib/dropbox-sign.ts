export async function sendNdaForSigning(name: string, email: string, applicationId: string): Promise<string> {
  const ndaUrl = 'https://www.theevestudio.io/E.V.E._studio__beta_tester_nda.pdf'

  const params = new URLSearchParams()
  params.append('title', 'E.V.E. Studio Beta Tester NDA')
  params.append('subject', 'Sign your E.V.E. Studio Beta NDA')
  params.append('message', `Hi ${name}, your beta application has been approved! Please sign the NDA below to activate your access to E.V.E. Studio.`)
  params.append('signers[0][email_address]', email)
  params.append('signers[0][name]', name)
  params.append('file_urls[0]', ndaUrl)
  params.append('metadata[application_id]', applicationId)

  const auth = Buffer.from(`${process.env.DROPBOX_SIGN_API_KEY}:`).toString('base64')

  const res = await fetch('https://api.hellosign.com/v3/signature_request/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Dropbox Sign error: ${err}`)
  }

  const data = await res.json()
  return data.signature_request.signature_request_id
}
