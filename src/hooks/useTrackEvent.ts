'use client'

import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useTrackEvent() {
  const pathname = usePathname()

  const trackEvent = useCallback((
    event: string,
    properties?: Record<string, unknown>
  ) => {
    // Fire and forget — never block the UI
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, page: pathname, properties }),
    }).catch(() => {/* silent — tracking should never break the app */})
  }, [pathname])

  return { trackEvent }
}
