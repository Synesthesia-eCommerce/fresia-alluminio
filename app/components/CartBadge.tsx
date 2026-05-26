'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { leggiElementi, ELEMENTI_EVENT } from '@/lib/elementi-store'
import { ACCENT, NAVY } from '@/lib/tokens'

export default function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const sync = () => setCount(leggiElementi().length)
    sync()
    window.addEventListener(ELEMENTI_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ELEMENTI_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <Link
      href="/lista"
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
      style={{ background: '#F5F5F5', color: NAVY, border: '1px solid #E3E3E3' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Lista elementi
      {count > 0 && (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white"
          style={{ background: ACCENT }}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
