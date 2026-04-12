import fs from 'fs'
import path from 'path'

export async function sendNdaForSigning(name: string, email: string, applicationId: string): Promise<string> {
  const ndaPath = path.join(process.cwd(), 'public', 'E.V.E._studio__beta_tester_nda.pdf')
  const ndaBuffer = fs.readFileSync(ndaPath)
  const ndaBlob = new Blob([ndaBuffer], { type: 'application/pdf' })

  const formData = new FormData()
  formData.append('title', 'E.V.E. Studio Beta Tester NDA')
  formData.append('subject', 'Sign your E.V.E. Studio Beta NDA')
  formData.append('message', `Hi ${name}, your beta application has been approved! Please sign the NDA below to activate your access to E.V.E. Studio.`)
  formData.append('signers[0][email_address]', email)
  formData.append('signers[0][name]', name)
  formData.append('files[0]', ndaBlob, 'eve-studio-beta-nda.pdf')
  formData.append('metadata[application_id]', applicationId)

  const auth = Buffer.from(`${process.env.DROPBOX_SIGN_API_KEY}:`).toString('base64')

  const res = await fetch('https://api.hellosign.com/v3/signature_request/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Dropbox Sign error: ${err}`)
  }

  const data = await res.json()
  return data.signature_request.signature_request_id
}
