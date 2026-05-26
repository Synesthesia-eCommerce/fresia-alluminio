import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import catalogoData from '@/FresiAlluminio/catalogo-global45.json'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Configuratore Global 45 — Fresi Alluminio',
  description:
    'Configuratore professionale per sistemi in alluminio Global 45 di Alsistem. Seleziona profili, calcola distinte di taglio e genera la lista materiali.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}
      >
        {/* Header */}
        <header
          className="no-print sticky top-0 z-50 border-b"
          style={{
            backgroundColor: 'var(--brand-primary)',
            borderColor: 'var(--brand-primary-hover)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex flex-col leading-tight">
                <span
                  className="font-bold tracking-wide text-lg"
                  style={{ color: '#FFFFFF', letterSpacing: '0.04em' }}
                >
                  FRESI ALLUMINIO
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em' }}
                >
                  Configuratore Global 45
                </span>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/catalogo"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  Catalogo
                </Link>
                <Link
                  href="/configuratore"
                  className="ml-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-accent)', color: '#FFFFFF' }}
                >
                  Configura
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="no-print border-t bg-white" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

            {/* Riga superiore: nav + badge catalogo */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <nav className="flex items-center gap-5">
                <Link
                  href="/catalogo"
                  className="text-xs font-medium transition-colors hover:text-slate-900"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  Catalogo tecnico
                </Link>
                <Link
                  href="/configuratore"
                  className="text-xs font-medium transition-colors hover:text-slate-900"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  Configuratore
                </Link>
              </nav>

              <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: 'var(--brand-bg)', color: 'var(--brand-primary)' }}
                >
                  {catalogoData.meta.sistema}
                </span>
                <span>{catalogoData.meta.produttore} · Edizione {catalogoData.meta.edizione}</span>
              </div>
            </div>

            {/* Riga inferiore: copyright + disclaimer */}
            <div className="flex flex-wrap items-start justify-between gap-3 pt-4">
              <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                &copy; {new Date().getFullYear()} Fresi Alluminio S.p.A. Tutti i diritti riservati.
              </p>
              <p className="text-xs text-right max-w-md leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>
                * {catalogoData.meta.note}
              </p>
            </div>

          </div>
        </footer>
      </body>
    </html>
  )
}
