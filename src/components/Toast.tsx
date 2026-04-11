'use client'

import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error'

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const show = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, show }
}

export function Toast({ toast }: { toast: { message: string; type: ToastType } | null }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-xl pointer-events-none animate-fade-in ${
      toast.type === 'error'
        ? 'bg-red-950 border border-red-700 text-red-200'
        : 'bg-zinc-800 border border-zinc-600 text-white'
    }`}>
      {toast.type === 'success' ? '✓  ' : '✕  '}{toast.message}
    </div>
  )
}
