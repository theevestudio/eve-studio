'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type State = 'loading' | 'valid' | 'invalid' | 'already_signed' | 'submitting' | 'success'

export default function SignNdaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#555', fontFamily: 'system-ui', fontSize: 15 }}>Loading…</p></div>}>
      <SignNdaContent />
    </Suspense>
  )
}

function SignNdaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState('')
  const [applicantName, setApplicantName] = useState('')
  const [fullName, setFullName] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (!token) { setState('invalid'); setError('No signing link found. Please use the link from your email.'); return }

    fetch(`/api/nda/validate?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.already_signed) { setState('already_signed'); return }
        if (!data.valid) { setState('invalid'); setError(data.error ?? 'Invalid or expired link.'); return }
        setApplicantName(data.name)
        setState('valid')
      })
      .catch(() => { setState('invalid'); setError('Something went wrong. Please try again.') })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !agreed) return

    setState('submitting')
    try {
      const res = await fetch('/api/nda/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, full_name: fullName }),
      })
      const data = await res.json()
      if (data.success || data.already_signed) {
        setState('success')
      } else {
        setError(data.error ?? 'Failed to record signature. Please try again.')
        setState('valid')
      }
    } catch {
      setError('Network error. Please try again.')
      setState('valid')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Brand */}
        <p style={{ margin: '0 0 32px', fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase' }}>
          The E.V.E. Studio
        </p>

        {state === 'loading' && (
          <p style={{ color: '#555', fontSize: 15 }}>Verifying your link…</p>
        )}

        {state === 'invalid' && (
          <div>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 600, color: '#fff' }}>Link unavailable</h1>
            <p style={{ margin: 0, fontSize: 15, color: '#888', lineHeight: 1.6 }}>{error}</p>
          </div>
        )}

        {state === 'already_signed' && (
          <div>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 600, color: '#fff' }}>Already signed</h1>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#888', lineHeight: 1.6 }}>
              Your NDA is already on file. Head to the app and log in.
            </p>
            <a href="https://theevestudio.io/auth/login" style={{ display: 'inline-block', padding: '12px 24px', background: '#fff', color: '#000', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Go to login →
            </a>
          </div>
        )}

        {state === 'success' && (
          <div>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 600, color: '#fff' }}>You're in.</h1>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#888', lineHeight: 1.6 }}>
              Your NDA has been signed and recorded. Your beta access is now active.
            </p>
            <p style={{ margin: '0 0 32px', fontSize: 15, color: '#888', lineHeight: 1.6 }}>
              Log in with the email address you used to apply.
            </p>
            <a href="https://theevestudio.io/auth/login" style={{ display: 'inline-block', padding: '12px 24px', background: '#fff', color: '#000', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Log in to E.V.E. Studio →
            </a>
          </div>
        )}

        {(state === 'valid' || state === 'submitting') && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
              Beta Tester NDA
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: '#666', lineHeight: 1.6 }}>
              {applicantName ? `Hi ${applicantName} —` : ''} Please read the agreement below and sign to activate your beta access.
            </p>

            {/* NDA Document */}
            <div style={{ border: '1px solid #222', borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
              {/* PDF viewer */}
              <iframe
                src="https://www.theevestudio.io/E.V.E._studio__beta_tester_nda.pdf"
                style={{ width: '100%', height: 480, border: 'none', display: 'block', background: '#fff' }}
                title="E.V.E. Studio Beta Tester NDA"
              />
            </div>

            {/* Signature capture */}
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 24, marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>
                Full legal name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Type your full name to sign"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  fontSize: 16,
                  color: '#fff',
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#444' }}>
                By typing your name, you are signing this document electronically. This constitutes a legally binding signature under the US ESIGN Act.
              </p>
            </div>

            {/* Agree checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#fff', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
                I have read and agree to the E.V.E. Studio Beta Tester Non-Disclosure Agreement. I understand this is a legally binding electronic signature.
              </span>
            </label>

            {error && (
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#f87171' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={!fullName.trim() || !agreed || state === 'submitting'}
              style={{
                width: '100%',
                padding: '14px',
                background: (!fullName.trim() || !agreed || state === 'submitting') ? '#1a1a1a' : '#fff',
                color: (!fullName.trim() || !agreed || state === 'submitting') ? '#444' : '#000',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: (!fullName.trim() || !agreed || state === 'submitting') ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {state === 'submitting' ? 'Recording signature…' : 'Sign NDA & activate access'}
            </button>
          </form>
        )}

        <p style={{ margin: '32px 0 0', fontSize: 12, color: '#333' }}>
          Questions? Email us at alana.productions.co@gmail.com
        </p>
      </div>
    </div>
  )
}
