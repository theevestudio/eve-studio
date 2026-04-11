'use client'

import Image from 'next/image'

export default function LoadingEVE({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div style={{ animation: 'eve-load-pulse 2s ease-in-out infinite', borderRadius: '50%' }}>
        <Image src="/logo-icon.png" alt="Loading" width={72} height={72} priority />
      </div>
      <p className="text-zinc-500 text-sm">{label}</p>
      <style>{`
        @keyframes eve-load-pulse {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(139,92,246,0.7)) drop-shadow(0 0 32px rgba(124,58,237,0.35)); }
          50%       { filter: drop-shadow(0 0 32px rgba(167,139,250,1)) drop-shadow(0 0 64px rgba(139,92,246,0.7)); }
        }
      `}</style>
    </div>
  )
}
