import Link from 'next/link'

const ACCENT = '#E8600E'
const NAVY = '#1B3A6B'

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: NAVY }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* decorative persiana SVG — right side, large screens */}
        <svg
          className="hidden lg:block absolute right-0 top-0 h-full opacity-[0.08] pointer-events-none"
          width="480" viewBox="0 0 200 300" preserveAspectRatio="xMaxYMid meet"
        >
          <rect x="20" y="20" width="160" height="260" stroke="white" strokeWidth="1" fill="none" />
          <rect x="30" y="30" width="65" height="240" stroke="white" strokeWidth="0.7" fill="none" />
          <rect x="105" y="30" width="65" height="240" stroke="white" strokeWidth="0.7" fill="none" />
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={'a' + i} x1="34" x2="91" y1={36 + i * 9} y2={36 + i * 9} stroke="white" strokeWidth="0.7" />
          ))}
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={'b' + i} x1="109" x2="166" y1={36 + i * 9} y2={36 + i * 9} stroke="white" strokeWidth="0.7" />
          ))}
          <circle cx="100" cy="150" r="2" fill={ACCENT} />
        </svg>

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          {/* eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold mb-5"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            Sistema Persiana · Catalogo Alsistem
          </div>

          <h1
            className="text-white font-bold tracking-[-0.03em] leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)', maxWidth: '16ch' }}
          >
            Configura la tua persiana{' '}
            <span style={{ color: ACCENT }}>Global 45</span>
          </h1>

          <p className="text-white/75 text-[16px] leading-relaxed mb-8" style={{ maxWidth: '52ch' }}>
            Seleziona profili, verifica la compatibilità e genera la lista materiali con codici,
            misure di taglio e peso — in meno di 2 minuti.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Link
              href="/configuratore"
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-white text-[14px] transition-all hover:-translate-y-px"
              style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(232,96,14,0.4)' }}
            >
              Avvia configurazione
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white/85 text-[14px] transition hover:bg-white/8"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Sfoglia catalogo
            </Link>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/10 max-w-2xl">
            {[
              { k: '11', l: 'Codici telaio' },
              { k: '16', l: 'Tipologie anta' },
              { k: '< 2 min', l: 'Tempo configurazione' },
              { k: '100%', l: 'Dati reali Alsistem' },
            ].map((s) => (
              <div key={s.l} className="border-l-2 pl-3" style={{ borderColor: ACCENT }}>
                <div className="text-white font-bold tabular-nums text-2xl">{s.k}</div>
                <div className="text-white/55 text-[11px] uppercase tracking-[0.1em] font-semibold mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16" style={{ background: '#F4F6F9' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: ACCENT }}>Come funziona</div>
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] text-slate-900 leading-tight">
                Tutto in un unico strumento.
              </h2>
            </div>
            <Link
              href="/configuratore"
              className="inline-flex items-center gap-2 text-[13px] font-semibold transition-colors"
              style={{ color: ACCENT }}
            >
              Inizia ora
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                n: '01', title: 'Configurazione guidata',
                desc: '5 step: tipologia → profili → dimensioni → accessori → distinta. Con anteprima SVG che si aggiorna in tempo reale.',
                icon: <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><circle cx="6" cy="14" r="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="22" cy="14" r="3" stroke="currentColor" strokeWidth="1.8" /><line x1="9" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="6" y1="6" x2="6" y2="11" stroke="currentColor" strokeWidth="1.4" /><line x1="22" y1="17" x2="22" y2="22" stroke="currentColor" strokeWidth="1.4" /></svg>,
              },
              {
                n: '02', title: 'Compatibilità automatica',
                desc: 'Tappi montante, selle ovaline e accessori abbinati automaticamente in base alla combinazione profili selezionata.',
                icon: <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><path d="M14 3l11 5v6c0 6.5-4.5 10.5-11 12C7.5 24.5 3 20.5 3 14V8l11-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 14l3.5 3.5L20 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
              },
              {
                n: '03', title: 'Distinta tecnica completa',
                desc: 'Codici Alsistem reali, lunghezze di taglio in mm (formule L+71, L/2-26, ecc.), quantità per anta e peso totale in kg.',
                icon: <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect x="5" y="3" width="18" height="22" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><line x1="9" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><line x1="9" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
              },
            ].map((f) => (
              <div
                key={f.n}
                className="group bg-white rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{ border: '1px solid #E5E9F0', boxShadow: '0 1px 3px rgba(27,58,107,0.06)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: '#F4F6F9', color: NAVY }}
                  >
                    {f.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-300 tabular-nums">{f.n}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-[17px] mb-2 tracking-[-0.01em]">{f.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tipologie quick-pick ─────────────────────────────────────── */}
      <section className="py-10 bg-white border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-5" style={{ color: ACCENT }}>
            Tipologie disponibili
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { slug: 'con_telaio', label: 'Con Telaio', sub: 'Persiana standard' },
              { slug: 'senza_telaio', label: 'Senza Telaio', sub: 'Battuta a muro' },
              { slug: 'senza_telaio_con_sportellino', label: 'Con Sportellino', sub: 'Apertura ridotta' },
              { slug: 'scorrevole', label: 'Scorrevole', sub: 'Su binario' },
              { slug: 'scurone', label: 'Scurone', sub: 'Oscurante' },
            ].map((t) => (
              <Link
                key={t.slug}
                href={`/configuratore?tipo=${t.slug}`}
                className="group rounded-xl border p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{ borderColor: '#E5E9F0', background: '#FAFBFD' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-3 transition-colors"
                  style={{ background: 'rgba(27,58,107,0.07)', color: NAVY }}
                >
                  {t.label.charAt(0)}
                </div>
                <div className="font-bold text-[13px] text-slate-800">{t.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA finale ───────────────────────────────────────────────── */}
      <section className="py-12 text-center" style={{ background: NAVY }}>
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-[26px] font-bold text-white tracking-[-0.02em] mb-3">
            Pronto a generare la distinta?
          </h2>
          <p className="text-white/65 text-[14px] mb-7">
            Inserisci le dimensioni, seleziona i profili e ottieni la lista materiali completa con tutti i codici Alsistem.
          </p>
          <Link
            href="/configuratore"
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-lg font-semibold text-white text-[14px] transition hover:-translate-y-px"
            style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(232,96,14,0.4)' }}
          >
            Inizia ora →
          </Link>
        </div>
      </section>
    </>
  )
}
