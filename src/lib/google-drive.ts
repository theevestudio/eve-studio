import { google } from 'googleapis'
import { Readable } from 'stream'

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const credentials = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
}

export async function uploadNdaToDrive({
  fileName,
  pdfBuffer,
}: {
  fileName: string
  pdfBuffer: Buffer
}): Promise<string> {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  const folderId = process.env.GOOGLE_DRIVE_NDA_FOLDER_ID
  if (!folderId) throw new Error('GOOGLE_DRIVE_NDA_FOLDER_ID is not set')

  const stream = Readable.from(pdfBuffer)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
    fields: 'id, webViewLink',
  })

  return res.data.webViewLink ?? res.data.id ?? ''
}
