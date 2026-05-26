'use client'

import { useState, useMemo, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTelai, getAnte, getOvaline, getFasceZoccoli, getRiportiCentrali } from '@/lib/catalogo'
import type { Profilo, TipoConfigurazione, TipoMeccanismo } from '@/lib/types'
import {
  generaListaMateriali,
  validaConfigurazione,
  suggerisciMeccanismo,
  calcolaNumOvalinePreview,
} from '@/lib/engine'

const ACCENT = '#E8600E'
const NAVY = '#1B3A6B'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppState {
  tipologia: TipoConfigurazione
  profili: { telaio: string | null; anta: string | null; ovalina: string | null; fascia: string | null }
  dimensioni: { larghezza: number; altezza: number; ante: number }
  meccanismo: TipoMeccanismo
  accessori: string[]
}

const DEFAULT_STATE: AppState = {
  tipologia: 'con_telaio',
  profili: { telaio: null, anta: null, ovalina: null, fascia: null },
  dimensioni: { larghezza: 1200, altezza: 1800, ante: 2 },
  meccanismo: 'nessuno',
  accessori: [],
}

// ─── Dati statici ─────────────────────────────────────────────────────────────

const TIPOLOGIE = [
  {
    id: 'con_telaio' as TipoConfigurazione,
    name: 'Con Telaio',
    tag: 'Standard',
    desc: 'Sistema completo con telaio perimetrale fisso. La soluzione più diffusa per ristrutturazione e nuova posa.',
    needs: { telaio: true, cieca: false, scorrevole: false, sportellino: false },
  },
  {
    id: 'senza_telaio' as TipoConfigurazione,
    name: 'Senza Telaio',
    tag: 'Diretto a muro',
    desc: 'Cerniere fissate direttamente sul vano murario. Massima luce passante, posa veloce su murature regolari.',
    needs: { telaio: false, cieca: false, scorrevole: false, sportellino: false },
  },
  {
    id: 'senza_telaio_con_sportellino' as TipoConfigurazione,
    name: 'Con Sportellino',
    tag: 'Apertura ridotta',
    desc: 'Anta principale con sportellino integrato per piccola apertura senza spalancare la persiana.',
    needs: { telaio: true, cieca: false, scorrevole: false, sportellino: true },
  },
  {
    id: 'scorrevole' as TipoConfigurazione,
    name: 'Scorrevole',
    tag: 'A scomparsa',
    desc: 'Sistema scorrevole su binario superiore. Per balconi dove l\'apertura a battente non è possibile.',
    needs: { telaio: true, cieca: false, scorrevole: true, sportellino: false },
  },
  {
    id: 'scurone' as TipoConfigurazione,
    name: 'Scurone',
    tag: 'Oscurante',
    desc: 'Anta cieca a pannello pieno, totale oscuramento. Versione tecnica senza lamelle.',
    needs: { telaio: true, cieca: true, scorrevole: false, sportellino: false },
  },
]

const MECCANISMI = [
  { id: 'nessuno' as TipoMeccanismo, name: 'Nessuno', desc: 'Apertura libera, senza meccanismo orientabile' },
  { id: 'perla_70' as TipoMeccanismo, name: 'Perla 70', desc: 'Meccanismo orientabile lamelle, passo 70 mm' },
  { id: 'venere' as TipoMeccanismo, name: 'Venere', desc: 'Meccanismo silenzioso con asta interna' },
]

const STEPS = ['Tipologia', 'Profili', 'Dimensioni', 'Accessori', 'Lista materiali']

// ─── Small UI primitives ──────────────────────────────────────────────────────

function Btn({
  kind = 'primary',
  onClick,
  disabled,
  children,
}: {
  kind?: 'primary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const base = 'inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-md transition-all duration-200 select-none'
  const styles =
    kind === 'primary'
      ? { background: ACCENT, color: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 24px rgba(232,96,14,0.28)' }
      : { background: 'transparent', color: '#475569', border: '1px solid #E5E9F0' }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={base + (disabled ? ' opacity-40 cursor-not-allowed' : ' hover:-translate-y-px active:translate-y-0')}
      style={styles}
    >
      {children}
    </button>
  )
}

function StepHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: ACCENT }}>{eyebrow}</div>
      <h2 className="mt-3 text-[40px] sm:text-[48px] leading-[1.02] font-bold tracking-[-0.025em] text-slate-900">{title}</h2>
      {sub && <p className="mt-4 max-w-2xl text-[16px] text-slate-500 leading-relaxed">{sub}</p>}
    </div>
  )
}

// ─── Custom Select dropdown ───────────────────────────────────────────────────

interface SelectOption {
  value: string | null
  code: string
  label: string
  desc?: string
  meta?: string
}

function SelectField({
  label,
  helper,
  value,
  options,
  onChange,
  placeholder = 'Seleziona codice…',
  locked,
}: {
  label: string
  helper?: string
  value: string | null
  options: SelectOption[]
  onChange: (v: string | null) => void
  placeholder?: string
  locked?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0)
      return () => clearTimeout(t)
    } else {
      setSearch('')
    }
  }, [open])

  const close = () => { setOpen(false); setSearch('') }

  const q = search.toLowerCase()
  const filtered = q
    ? options.filter(o =>
        o.code.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        (o.desc?.toLowerCase().includes(q) ?? false)
      )
    : options

  const selected = options.find(o => o.value === value)
  const showSearch = options.length >= 5

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[12px] uppercase tracking-[0.14em] font-bold text-slate-500">{label}</label>
        {helper && <span className="text-[11px] text-slate-400">{helper}</span>}
      </div>
      <button
        type="button"
        onClick={() => !locked && setOpen(v => !v)}
        className={'w-full flex items-center justify-between gap-3 rounded-lg px-4 bg-white text-left transition-all duration-200 ' + (locked ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300')}
        style={{
          border: open ? `2px solid ${ACCENT}` : '1.5px solid #E5E9F0',
          padding: open ? 'calc(0.875rem - 0.5px) calc(1rem - 0.5px)' : '0.875rem 1rem',
          boxShadow: open ? '0 8px 24px rgba(232,96,14,0.10)' : 'none',
        }}
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-bold text-slate-900 tabular-nums text-[14px] shrink-0">{selected.code}</span>
              <span className="text-slate-300 shrink-0">·</span>
              <span className="text-slate-700 truncate text-[14px]">{selected.label}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[14px]">{locked ? '—' : placeholder}</span>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={'shrink-0 transition-transform ' + (open ? 'rotate-180' : '')}>
          <path d="M6 9l6 6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5E9F0', boxShadow: '0 24px 64px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.08)' }}
          onKeyDown={e => e.key === 'Escape' && close()}
        >
          {showSearch && (
            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca codice o descrizione…"
                  className="flex-1 bg-transparent text-[13px] outline-none text-slate-700 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); searchRef.current?.focus() }}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Cancella ricerca"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[272px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-7 text-center">
                <div className="text-[13px] text-slate-400">
                  Nessun risultato per <span className="font-semibold text-slate-600">"{search}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSearch(''); searchRef.current?.focus() }}
                  className="mt-2 text-[12px] font-semibold transition-colors"
                  style={{ color: ACCENT }}
                >
                  Mostra tutti
                </button>
              </div>
            ) : filtered.map(o => {
              const active = o.value === value
              return (
                <button
                  key={o.value ?? '__null'}
                  type="button"
                  onClick={() => { onChange(o.value); close() }}
                  className="w-full text-left px-4 py-3 transition flex items-start gap-3"
                  style={{ background: active ? '#FFF8F5' : 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-900 tabular-nums text-[13px]">{o.code}</span>
                      <span className="text-slate-700 text-[14px] font-medium">{o.label}</span>
                    </div>
                    {o.desc && <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">{o.desc}</div>}
                  </div>
                  {o.meta && <div className="text-[11px] text-slate-400 tabular-nums shrink-0 pt-0.5">{o.meta}</div>}
                  {active && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={ACCENT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {search && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-right text-[11px] text-slate-400">
              {filtered.length} di {options.length} risultati
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current, maxReached, onJump }: { current: number; maxReached: number; onJump: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        const locked = i > maxReached
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none gap-2 sm:gap-3">
            <button
              onClick={() => !locked && onJump(i)}
              disabled={locked}
              aria-disabled={locked}
              className="flex-1 flex items-center gap-3 rounded-md transition-all duration-200 px-3 sm:px-4 py-2.5 sm:py-3 text-left"
              style={{
                background: active ? ACCENT : done ? NAVY : '#fff',
                color: active || done ? '#fff' : locked ? '#C8D0DC' : '#475569',
                border: active || done ? '1px solid transparent' : '1px solid #E5E9F0',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded text-[11px] font-bold tabular-nums"
                style={{
                  background: active || done ? 'rgba(255,255,255,0.18)' : '#F4F6F9',
                  color: active || done ? '#fff' : '#94A3B8',
                }}
              >
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : String(i + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className={'text-[10px] uppercase tracking-[0.12em] font-semibold ' + (active || done ? 'opacity-80' : 'opacity-60')}>
                  Step {i + 1}
                </div>
                <div className="text-sm font-semibold truncate">{s}</div>
              </div>
            </button>
            {i < STEPS.length - 1 && <div className="hidden md:block w-3 h-px shrink-0" style={{ background: '#E5E9F0' }} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ state, bom }: { state: AppState; bom: ReturnType<typeof generaListaMateriali> | null }) {
  const tipo = TIPOLOGIE.find(t => t.id === state.tipologia)

  return (
    <aside className="hidden lg:block lg:w-[340px] shrink-0">
      <div className="sticky top-[152px] bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_rgba(27,58,107,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(180deg,#FAFBFD 0%,#fff 100%)' }}>
          <div className="text-[10px] uppercase tracking-[0.16em] font-bold" style={{ color: ACCENT }}>Sistema Global 45</div>
          <div className="text-base font-semibold text-slate-900 mt-0.5">Riepilogo configurazione</div>
        </div>

        <div className="px-5 py-3">
          {[
            { label: 'Tipologia', value: tipo?.name },
            { label: 'Telaio', value: state.profili.telaio, mono: true },
            { label: 'Anta', value: state.profili.anta, mono: true },
            { label: 'Ovalina', value: state.profili.ovalina, mono: true },
            { label: 'Fascia', value: state.profili.fascia, mono: true },
            { label: 'Dimensioni', value: state.dimensioni.larghezza && state.dimensioni.altezza ? `${state.dimensioni.larghezza} × ${state.dimensioni.altezza} mm` : null, mono: true },
            { label: 'Ante', value: `n. ${state.dimensioni.ante}`, mono: true },
          ].map(row => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold">{row.label}</span>
              <span className={'text-sm text-slate-800 font-medium text-right truncate ' + (row.mono ? 'tabular-nums' : '')}>
                {row.value || <span className="text-slate-300">—</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100" style={{ background: '#FAFBFD' }}>
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-semibold">Peso stimato</div>
            <div className="font-bold text-slate-900 tabular-nums" style={{ fontSize: 22 }}>
              {bom ? bom.peso_totale_kg.toFixed(2) : '—'}{' '}
              <span className="text-xs font-medium text-slate-500">kg</span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Calcolo indicativo profili in alluminio.</div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-[11px] leading-relaxed text-slate-500">
          I valori sono calcolati in tempo reale sulla base delle selezioni. La conferma definitiva avverrà nello step 5.
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 mt-3 px-2 text-[10px] uppercase tracking-[0.12em] text-slate-400 font-semibold">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
        Configurazione live
      </div>
    </aside>
  )
}

// ─── MobileSummaryBar ─────────────────────────────────────────────────────────

function MobileSummaryBar({
  state,
  bom,
}: {
  state: AppState
  bom: ReturnType<typeof generaListaMateriali> | null
}) {
  const tipo = TIPOLOGIE.find(t => t.id === state.tipologia)
  const hasDim = state.dimensioni.larghezza > 0 && state.dimensioni.altezza > 0

  return (
    <div
      className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200"
      style={{ boxShadow: '0 -4px 20px rgba(27,58,107,0.08)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ACCENT }} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: ACCENT }}>
              Configurazione live
            </div>
            <div className="text-sm font-semibold text-slate-800 truncate">
              {tipo?.name ?? '—'}
              {hasDim && (
                <span className="text-slate-400 font-normal">
                  {' '}· {state.dimensioni.larghezza} × {state.dimensioni.altezza} mm
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-slate-400">Peso stimato</div>
          <div className="font-bold tabular-nums text-slate-900" style={{ fontSize: 17 }}>
            {bom ? bom.peso_totale_kg.toFixed(2) : '—'}
            <span className="text-xs font-normal text-slate-400 ml-0.5">kg</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ShutterPreview SVG ───────────────────────────────────────────────────────

function ShutterPreview({ state }: { state: AppState }) {
  const tipo = TIPOLOGIE.find(t => t.id === state.tipologia)
  const hasTelaio = tipo?.needs.telaio ?? false
  const isCieca = tipo?.needs.cieca ?? false
  const isSlide = tipo?.needs.scorrevole ?? false
  const hasSport = tipo?.needs.sportellino ?? false
  const N = Math.max(1, state.dimensioni.ante || 2)
  const W = state.dimensioni.larghezza || 1200
  const H = state.dimensioni.altezza || 1800

  const aspect = W / H
  const VBH = 520
  const VBW = Math.min(720, Math.max(280, VBH * aspect))
  const pad = 24
  const outerW = VBW - pad * 2
  const outerH = VBH - pad * 2
  const frameT = hasTelaio ? 18 : 0
  const innerX = pad + frameT
  const innerY = pad + frameT
  const innerW = outerW - frameT * 2
  const innerH = outerH - frameT * 2
  const gap = 2
  const antaW = (innerW - gap * (N - 1)) / N
  const antaThick = 10

  const ovalineInfo = useMemo(() => {
    if (!state.profili.ovalina) return null
    const nLame = calcolaNumOvalinePreview(state.profili.ovalina, H, 1)
    const usableH = innerH - antaThick * 2
    return { nLame, gap: usableH / Math.max(1, nLame) }
  }, [state.profili.ovalina, H, innerH, antaThick])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="w-full h-auto max-h-[520px] drop-shadow-[0_20px_50px_rgba(27,58,107,0.18)]"
        style={{ maxWidth: VBW }}
      >
        {/* dimension labels */}
        <g fontFamily="Inter" fontSize="11" fill="#94A3B8" fontWeight="500">
          <line x1={pad} y1={12} x2={VBW - pad} y2={12} stroke="#CBD5E1" strokeDasharray="2 3" />
          <text x={VBW / 2} y={9} textAnchor="middle">{W} mm</text>
        </g>
        <g fontFamily="Inter" fontSize="11" fill="#94A3B8" fontWeight="500">
          <line x1={VBW - 10} y1={pad} x2={VBW - 10} y2={VBH - pad} stroke="#CBD5E1" strokeDasharray="2 3" />
          <text x={VBW - 5} y={VBH / 2} transform={`rotate(90 ${VBW - 5} ${VBH / 2})`} textAnchor="middle">{H} mm</text>
        </g>

        {/* Telaio */}
        {hasTelaio && (
          <g>
            <rect x={pad} y={pad} width={outerW} height={outerH} fill="none" stroke={NAVY} strokeWidth="2" rx="2" />
            <rect x={pad + frameT - 1} y={pad + frameT - 1} width={outerW - frameT * 2 + 2} height={outerH - frameT * 2 + 2}
              fill="none" stroke={NAVY} strokeWidth="1.2" opacity="0.45" />
            <path
              d={`M${pad},${pad} L${pad + outerW},${pad} L${pad + outerW},${pad + outerH} L${pad},${pad + outerH} Z M${innerX},${innerY} L${innerX + innerW},${innerY} L${innerX + innerW},${innerY + innerH} L${innerX},${innerY + innerH} Z`}
              fill={NAVY} opacity="0.06" fillRule="evenodd"
            />
          </g>
        )}

        {/* Scorrevole rail */}
        {isSlide && (
          <g>
            <line x1={pad} y1={pad - 4} x2={pad + outerW} y2={pad - 4} stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
            <circle cx={pad + 12} cy={pad - 4} r="3" fill={ACCENT} />
            <circle cx={pad + outerW - 12} cy={pad - 4} r="3" fill={ACCENT} />
          </g>
        )}

        {/* Ante */}
        {Array.from({ length: N }).map((_, i) => {
          const x = innerX + i * (antaW + gap)
          const y = innerY
          return (
            <g key={i}>
              <rect x={x} y={y} width={antaW} height={innerH} fill="white" stroke={NAVY} strokeWidth="1.4" />
              <rect x={x + antaThick} y={y + antaThick} width={antaW - antaThick * 2} height={innerH - antaThick * 2}
                fill="none" stroke={NAVY} strokeWidth="0.6" opacity="0.3" />

              {hasSport && i === 0 && (
                <g>
                  <rect x={x + antaThick + 4} y={y + innerH * 0.55} width={antaW - antaThick * 2 - 8} height={innerH * 0.32}
                    fill="white" stroke={ACCENT} strokeWidth="1.4" strokeDasharray="3 2" />
                  <circle cx={x + antaW - antaThick - 10} cy={y + innerH * 0.55 + (innerH * 0.32) / 2} r="2" fill={ACCENT} />
                </g>
              )}

              {isCieca && (
                <g>
                  <rect x={x + antaThick + 2} y={y + antaThick + 2} width={antaW - antaThick * 2 - 4} height={innerH - antaThick * 2 - 4}
                    fill={NAVY} opacity="0.85" />
                  {Array.from({ length: 6 }).map((_, k) => (
                    <line key={k}
                      x1={x + antaThick + 2 + (k + 1) * ((antaW - antaThick * 2 - 4) / 7)}
                      x2={x + antaThick + 2 + (k + 1) * ((antaW - antaThick * 2 - 4) / 7)}
                      y1={y + antaThick + 2} y2={y + innerH - antaThick - 2}
                      stroke="white" strokeWidth="0.4" opacity="0.18" />
                  ))}
                </g>
              )}

              {ovalineInfo && !isCieca && (
                <g>
                  {Array.from({ length: ovalineInfo.nLame }).map((_, k) => {
                    const ly = y + antaThick + (k + 0.5) * ovalineInfo.gap
                    return (
                      <g key={k}>
                        <line x1={x + antaThick + 3} y1={ly} x2={x + antaW - antaThick - 3} y2={ly}
                          stroke={NAVY} strokeWidth={Math.max(1, Math.min(3, ovalineInfo.gap * 0.45))} strokeLinecap="round" opacity="0.78" />
                        <line x1={x + antaThick + 3} y1={ly + 1.5} x2={x + antaW - antaThick - 3} y2={ly + 1.5}
                          stroke={NAVY} strokeWidth="0.3" opacity="0.35" />
                      </g>
                    )
                  })}
                </g>
              )}

              {(i === N - 1 || N === 1) && !isCieca && (
                <circle cx={x + antaW - antaThick - 4} cy={y + innerH / 2} r="2.5" fill={ACCENT} />
              )}

              {hasTelaio && (
                <g opacity="0.5">
                  {[0.18, 0.5, 0.82].map((p, k) => (
                    <rect key={k} x={i === 0 ? x - 3 : x + antaW + 1} y={y + innerH * p - 6} width="2" height="12" fill={NAVY} />
                  ))}
                </g>
              )}
            </g>
          )
        })}

        {N > 1 && (
          <g fontFamily="Inter" fontSize="9" fontWeight="600" fill={NAVY} opacity="0.4">
            {Array.from({ length: N }).map((_, i) => (
              <text key={i} x={innerX + i * (antaW + gap) + antaW / 2} y={VBH - pad + 14} textAnchor="middle">
                ANTA {i + 1}
              </text>
            ))}
          </g>
        )}

        <g fontFamily="Inter" fontSize="9" fontWeight="600" fill="#94A3B8" letterSpacing="0.1em">
          <text x={pad} y={VBH - 4}>GLOBAL 45 — ANTEPRIMA TECNICA</text>
        </g>
      </svg>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ConfiguratorePage({ initialTipo, hasPreselect }: { initialTipo: TipoConfigurazione; hasPreselect: boolean }) {
  const [step, setStep] = useState(hasPreselect ? 1 : 0)
  const [maxReached, setMaxReached] = useState(hasPreselect ? 1 : 0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [state, setState] = useState<AppState>({ ...DEFAULT_STATE, tipologia: initialTipo })

  const update = (patch: Partial<AppState>) => setState(s => ({ ...s, ...patch }))

  const advance = () => {
    const next = Math.min(4, step + 1)
    setDirection('forward')
    setStep(next)
    setMaxReached(r => Math.max(r, next))
  }

  const goBack = () => {
    setDirection('backward')
    setStep(s => Math.max(0, s - 1))
  }

  const jumpTo = (i: number) => {
    setDirection(i >= step ? 'forward' : 'backward')
    setStep(i)
  }

  const telai = useMemo(() => getTelai(), [])
  const ante = useMemo(() => getAnte(), [])
  const ovaline = useMemo(() => getOvaline(), [])
  const fasce = useMemo(() => getFasceZoccoli(), [])
  const riporti = useMemo(() => getRiportiCentrali(), [])

  const tipo = TIPOLOGIE.find(t => t.id === state.tipologia)!

  // Build engine config from state
  const engineConfig = useMemo(() => {
    const findProfilo = (list: Profilo[], code: string | null) =>
      code ? list.find(p => p.codice === code) ?? null : null
    return {
      tipo: state.tipologia,
      profili: {
        telaio: findProfilo(telai, state.profili.telaio),
        anta: findProfilo(ante, state.profili.anta),
        ovalina: findProfilo(ovaline, state.profili.ovalina),
        fascia: findProfilo([...fasce, ...riporti], state.profili.fascia),
        riporto_centrale: null,
      },
      dimensioni: {
        larghezza_mm: state.dimensioni.larghezza,
        altezza_mm: state.dimensioni.altezza,
        num_ante: state.dimensioni.ante,
        meccanismo: state.meccanismo,
      },
      accessori_extra: state.accessori,
    }
  }, [state, telai, ante, ovaline, fasce, riporti])

  const bom = useMemo(() => generaListaMateriali(engineConfig), [engineConfig])
  const validazione = useMemo(() => validaConfigurazione(engineConfig), [engineConfig])

  const mecSuggerito = useMemo(() => {
    if (state.meccanismo === 'nessuno') return null
    return suggerisciMeccanismo(state.meccanismo as 'perla_70' | 'venere', state.dimensioni.altezza)
  }, [state.meccanismo, state.dimensioni.altezza])

  const nOvalinePreview = useMemo(() => {
    if (!state.profili.ovalina) return null
    return calcolaNumOvalinePreview(state.profili.ovalina, state.dimensioni.altezza, state.dimensioni.ante)
  }, [state.profili.ovalina, state.dimensioni.altezza, state.dimensioni.ante])

  const canAdvance = useMemo(() => {
    if (step === 0) return !!state.tipologia
    if (step === 1) {
      if (tipo?.needs.telaio && !state.profili.telaio) return false
      if (!state.profili.anta) return false
      if (!tipo?.needs.cieca && !state.profili.ovalina) return false
      return true
    }
    if (step === 2) return (
      state.dimensioni.larghezza >= 400 && state.dimensioni.larghezza <= 3500 &&
      state.dimensioni.altezza >= 500 && state.dimensioni.altezza <= 3000
    )
    return true
  }, [step, state, tipo])

  // Convert Profilo[] → SelectOption[]
  const toOpts = (list: Profilo[], extra?: string): SelectOption[] =>
    list.map(p => ({
      value: p.codice,
      code: p.codice,
      label: p.descrizione,
      desc: p.cava ? `Cava ${p.cava}` : p.dimensione ? `⌀ ${p.dimensione}` : undefined,
      meta: extra ?? (p.peso_gr_m ? `${p.peso_gr_m} g/m` : undefined),
    }))

  const numero = useMemo(() => {
    const d = new Date()
    return `G45-${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
  }, [])

  const [copied, setCopied] = useState(false)

  const exportCSV = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const rows = [
      ['Tipo', 'Codice', 'Descrizione', 'Taglio (mm)', 'Quantità', 'Peso (kg)'],
      ...bom.profili.map(r => ['Profilo', r.codice, r.descrizione, r.taglio_mm, r.quantita, r.peso_kg]),
      ...bom.accessori.map(a => ['Accessorio', a.codice, a.descrizione, '', a.quantita, '']),
    ]
    const csv = rows.map(row => row.map(esc).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${numero}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyClipboard = async () => {
    const lines = [
      `Distinta tecnica — ${numero}`,
      `${tipo.name} · ${state.dimensioni.larghezza} × ${state.dimensioni.altezza} mm · ${state.dimensioni.ante} ante`,
      '',
      'PROFILI',
      'Codice\tDescrizione\tTaglio (mm)\tQuantità\tPeso (kg)',
      ...bom.profili.map(r => `${r.codice}\t${r.descrizione}\t${r.taglio_mm}\t${r.quantita}\t${r.peso_kg}`),
      '',
      'ACCESSORI',
      'Codice\tDescrizione\tQuantità',
      ...bom.accessori.map(a => `${a.codice}\t${a.descrizione}\t${a.quantita}`),
      '',
      `Peso totale profili: ${bom.peso_totale_kg} kg`,
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard API non disponibile — silent fail
    }
  }

  // ── Step content ────────────────────────────────────────────────────────────

  const renderStep = () => {
    // STEP 0 — Tipologia
    if (step === 0) {
      return (
        <div>
          <StepHeader eyebrow="01 — Tipologia" title="Seleziona il sistema persiana"
            sub="Scegli la configurazione che meglio si adatta al progetto. Ogni tipologia condizionerà i profili disponibili negli step successivi." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {TIPOLOGIE.map(t => {
              const active = state.tipologia === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => { update({ tipologia: t.id }); setDirection('forward'); setStep(1); setMaxReached(r => Math.max(r, 1)) }}
                  className={'relative w-full text-left rounded-2xl transition-all duration-200 overflow-hidden ' +
                    (active ? '-translate-y-1 shadow-[0_20px_48px_rgba(232,96,14,0.22),0_4px_12px_rgba(27,58,107,0.08)]'
                      : 'hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(27,58,107,0.12)] shadow-[0_1px_0_rgba(0,0,0,0.02),0_4px_12px_rgba(27,58,107,0.05)]')}
                  style={{ background: active ? '#FFF8F5' : '#fff', border: active ? `2px solid ${ACCENT}` : '2px solid transparent' }}
                >
                  <div className="aspect-[4/3] flex items-center justify-center relative overflow-hidden"
                    style={{ background: active ? '#fff' : 'linear-gradient(135deg,#F8FAFC 0%,#EEF2F7 100%)' }}>
                    <TipologiaSvg id={t.id} />
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em] font-bold"
                      style={{ background: active ? ACCENT : '#fff', color: active ? '#fff' : NAVY, border: active ? '1px solid transparent' : '1px solid #E5E9F0' }}>
                      {t.tag}
                    </div>
                    {active && (
                      <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: ACCENT, boxShadow: '0 4px 12px rgba(232,96,14,0.3)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-7 py-7" style={{ borderTop: active ? `1px solid ${ACCENT}33` : '1px solid #E5E9F0' }}>
                    <div className="font-bold text-slate-900 text-[22px] leading-tight tracking-[-0.01em]">{t.name}</div>
                    <div className="mt-3 text-[14px] leading-relaxed text-slate-500">{t.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    // STEP 1 — Profili
    if (step === 1) {
      const telaiOpts = toOpts(telai)
      const anteOpts = toOpts(ante)
      const ovalineOpts = toOpts(ovaline, undefined)
      const fasceOpts: SelectOption[] = [
        { value: null, code: '—', label: 'Nessuna fascia', desc: 'Anta senza traverso centrale' },
        ...toOpts(fasce),
      ]

      const totalKgm = [
        tipo.needs.telaio ? telai.find(p => p.codice === state.profili.telaio)?.peso_gr_m ?? 0 : 0,
        ante.find(p => p.codice === state.profili.anta)?.peso_gr_m ?? 0,
        ovaline.find(p => p.codice === state.profili.ovalina)?.peso_gr_m ?? 0,
        fasce.find(p => p.codice === state.profili.fascia)?.peso_gr_m ?? 0,
      ].reduce((a, b) => a + b, 0) / 1000

      return (
        <div>
          <StepHeader eyebrow="02 — Profili" title="Componi i profili in alluminio"
            sub="Seleziona i codici da catalogo Alsistem. Il pannello a destra riassume i componenti selezionati in tempo reale." />

          <div className="grid grid-cols-12 gap-8 mt-10">
            <div className="col-span-12 xl:col-span-7 space-y-6">
              {tipo.needs.telaio && (
                <SelectField label="Telaio" helper="obbligatorio"
                  value={state.profili.telaio} options={telaiOpts}
                  onChange={v => update({ profili: { ...state.profili, telaio: v } })} />
              )}
              <SelectField label="Anta" helper="obbligatorio"
                value={state.profili.anta} options={anteOpts}
                onChange={v => update({ profili: { ...state.profili, anta: v } })} />
              {!tipo.needs.cieca && (
                <SelectField label="Ovalina" helper="lamella orizzontale"
                  value={state.profili.ovalina} options={ovalineOpts}
                  onChange={v => update({ profili: { ...state.profili, ovalina: v } })} />
              )}
              <SelectField label="Fascia / Zoccolo" helper="traverso centrale (opzionale)"
                value={state.profili.fascia} options={fasceOpts}
                onChange={v => update({ profili: { ...state.profili, fascia: v } })} />
            </div>

            <div className="col-span-12 xl:col-span-5">
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_8px_24px_rgba(27,58,107,0.06)] sticky top-[150px] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100" style={{ background: '#FAFBFD' }}>
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold" style={{ color: ACCENT }}>Componenti selezionati</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="text-[17px] font-bold text-slate-900">Riepilogo profili</div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {[tipo.needs.telaio ? state.profili.telaio : 'skip', state.profili.anta, state.profili.ovalina].filter(Boolean).length} / {tipo.needs.telaio ? 3 : 2}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {[
                    tipo.needs.telaio ? { label: 'Telaio', code: state.profili.telaio, list: telai } : null,
                    { label: 'Anta', code: state.profili.anta, list: ante },
                    { label: 'Ovalina', code: state.profili.ovalina, list: ovaline },
                    { label: 'Fascia', code: state.profili.fascia, list: fasce },
                  ].filter(Boolean).map((row, i) => {
                    const item = row!.list.find(p => p.codice === row!.code)
                    return (
                      <div key={i} className="py-3.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-400">{row!.label}</div>
                          {item && <div className="text-[10px] uppercase font-bold tabular-nums" style={{ color: ACCENT }}>{item.peso_gr_m} g/m</div>}
                        </div>
                        {item ? (
                          <div className="mt-1">
                            <div className="font-bold text-slate-900 tabular-nums text-[15px]">{item.codice}</div>
                            <div className="text-[13px] text-slate-600">{item.descrizione}</div>
                          </div>
                        ) : (
                          <div className="mt-1 text-[13px] text-slate-300 italic">Non selezionato</div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="px-6 py-4 border-t border-slate-100 flex items-baseline justify-between" style={{ background: '#FAFBFD' }}>
                  <div className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500">Peso lineare totale</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {totalKgm.toFixed(3)} <span className="text-xs font-medium text-slate-500">kg/m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // STEP 2 — Dimensioni
    if (step === 2) {
      return (
        <div>
          <StepHeader eyebrow="03 — Dimensioni" title="Inserisci le misure del foro"
            sub="Le dimensioni vengono utilizzate per calcolare il numero di lamelle ovaline e per dimensionare il meccanismo orientabile." />

          <div className="grid grid-cols-12 gap-8 mt-10">
            <div className="col-span-12 xl:col-span-7 space-y-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DimField label="Larghezza" suffix="mm" value={state.dimensioni.larghezza}
                  onChange={v => update({ dimensioni: { ...state.dimensioni, larghezza: v } })} min={400} max={3500} />
                <DimField label="Altezza" suffix="mm" value={state.dimensioni.altezza}
                  onChange={v => update({ dimensioni: { ...state.dimensioni, altezza: v } })} min={500} max={3000} />
              </div>

              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-3">Numero di ante</div>
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => update({ dimensioni: { ...state.dimensioni, ante: n } })}
                      className="w-14 h-14 rounded-xl font-bold text-sm transition-all"
                      style={{
                        border: state.dimensioni.ante === n ? `2px solid ${ACCENT}` : '2px solid #E5E9F0',
                        background: state.dimensioni.ante === n ? ACCENT : '#fff',
                        color: state.dimensioni.ante === n ? '#fff' : '#475569',
                        boxShadow: state.dimensioni.ante === n ? '0 2px 8px rgba(232,96,14,0.3)' : 'none',
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-3">Meccanismo orientabile</div>
                <div className="space-y-2">
                  {MECCANISMI.map(m => (
                    <button key={m.id} onClick={() => update({ meccanismo: m.id })}
                      className="w-full flex items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all"
                      style={{
                        background: state.meccanismo === m.id ? '#FFF8F5' : '#fff',
                        border: state.meccanismo === m.id ? `1.5px solid ${ACCENT}` : '1.5px solid #E5E9F0',
                      }}>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ borderColor: state.meccanismo === m.id ? ACCENT : '#CBD5E1' }}>
                        {state.meccanismo === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT }} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-[12px] text-slate-500">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calcoli live */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                <div className="px-5 py-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">Calcoli automatici</div>
                </div>
                {nOvalinePreview !== null && (
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Ovaline totali ({state.dimensioni.ante} ante)</span>
                    <span className="font-bold tabular-nums" style={{ color: ACCENT }}>{nOvalinePreview} pz</span>
                  </div>
                )}
                {mecSuggerito && (
                  <>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-slate-600">Meccanismo consigliato</span>
                      <span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{mecSuggerito.codice}</span>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-slate-600">N. lamelle / Comando</span>
                      <span className="text-sm font-semibold text-slate-700">{mecSuggerito.num_lamelle} lam. · {mecSuggerito.comando}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="col-span-12 xl:col-span-5">
              <div className="sticky top-[150px] bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_8px_24px_rgba(27,58,107,0.06)]">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold mb-4" style={{ color: ACCENT }}>Anteprima tecnica</div>
                <ShutterPreview state={state} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    // STEP 3 — Accessori
    if (step === 3) {
      return (
        <div>
          <StepHeader eyebrow="04 — Accessori" title="Componenti e accessori"
            sub="Gli accessori obbligatori sono calcolati automaticamente. Codici e quantità seguono le regole di compatibilità del sistema Global 45." />

          <div className="mt-10">
            {bom.accessori.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-slate-500">Seleziona tipo e profili (step 1-2) per vedere gli accessori.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bom.accessori.map(acc => (
                  <div key={acc.codice} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: '#16A34A', color: '#fff' }}>✓</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{acc.codice}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(27,58,107,0.08)', color: NAVY }}>× {acc.quantita}</span>
                      </div>
                      <p className="text-xs mt-0.5 text-slate-500 leading-snug">{acc.descrizione}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-[12px] text-slate-400">
              * Le quantità sono calcolate in base alle regole di compatibilità Alsistem. Valori indicativi da verificare con il listino ufficiale.
            </p>
          </div>
        </div>
      )
    }

    // STEP 4 — Lista materiali
    if (step === 4) {
      return (
        <div>
          <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: ACCENT }}>05 — Lista materiali</div>
              <h2 className="mt-3 text-[40px] sm:text-[48px] leading-[1.02] font-bold tracking-[-0.025em] text-slate-900">Distinta tecnica</h2>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">N° preventivo</div>
              <div className="font-mono font-bold text-lg" style={{ color: NAVY }}>{numero}</div>
            </div>
          </div>

          {/* Barra export — nascosta in stampa */}
          <div className="no-print flex items-center gap-2 flex-wrap mb-8 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400 mr-2">Esporta</span>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              style={{ background: '#fff', border: '1px solid #DDE2EA', color: NAVY }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M9 21h6v-7H9v7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Stampa / PDF
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              style={{ background: '#fff', border: '1px solid #DDE2EA', color: NAVY }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Scarica CSV
            </button>

            <button
              onClick={copyClipboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              style={{
                background: copied ? '#F0FDF4' : '#fff',
                border: copied ? '1px solid #86EFAC' : '1px solid #DDE2EA',
                color: copied ? '#16A34A' : NAVY,
              }}
            >
              {copied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copiato!
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Copia TSV
                </>
              )}
            </button>
          </div>

          {/* config box */}
          <div className="rounded-xl p-5 mb-8 flex flex-wrap gap-6" style={{ background: 'rgba(27,58,107,0.04)', border: '1px solid #E5E9F0' }}>
            {[
              { label: 'Tipologia', value: tipo.name },
              { label: 'Telaio', value: state.profili.telaio ?? '—' },
              { label: 'Anta', value: state.profili.anta ?? '—' },
              { label: 'Ovalina', value: state.profili.ovalina ?? '—' },
              { label: 'Dimensioni', value: `${state.dimensioni.larghezza} × ${state.dimensioni.altezza} mm` },
              { label: 'N. ante', value: String(state.dimensioni.ante) },
            ].map(f => (
              <div key={f.label}>
                <div className="text-[11px] text-slate-400">{f.label}</div>
                <div className="font-mono font-bold text-sm" style={{ color: NAVY }}>{f.value}</div>
              </div>
            ))}
            <div>
              <div className="text-[11px] text-slate-400">Peso totale</div>
              <div className="font-mono font-bold text-sm" style={{ color: ACCENT }}>{bom.peso_totale_kg.toFixed(2)} kg</div>
            </div>
          </div>

          {/* Profili */}
          <h3 className="font-bold text-[12px] uppercase tracking-[0.12em] text-slate-400 mb-3">Profili in alluminio</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: NAVY, color: '#fff' }}>
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Codice</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell print-show-cell">Descrizione</th>
                  <th className="text-right px-4 py-3 font-semibold">Taglio</th>
                  <th className="text-right px-4 py-3 font-semibold">Q.tà</th>
                  <th className="text-right px-4 py-3 font-semibold">Peso</th>
                </tr>
              </thead>
              <tbody>
                {bom.profili.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      Nessun profilo calcolato — verifica la selezione negli step precedenti
                    </td>
                  </tr>
                ) : bom.profili.map((r, i) => (
                  <tr key={`${r.codice}-${r.taglio_mm}`} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderTop: '1px solid #E5E9F0' }}>
                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3"><span className="font-mono font-bold" style={{ color: NAVY }}>{r.codice}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell print-show-cell text-xs text-slate-500">{r.descrizione}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{r.taglio_mm} mm</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold px-2 py-0.5 rounded text-xs tabular-nums"
                        style={{ background: 'rgba(27,58,107,0.08)', color: NAVY }}>× {r.quantita}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-500">{r.peso_kg} kg</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(27,58,107,0.06)', borderTop: '2px solid #E5E9F0' }}>
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-sm" style={{ color: NAVY }}>Peso totale profili</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: ACCENT }}>{bom.peso_totale_kg} kg</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Accessori */}
          {bom.accessori.length > 0 && (
            <>
              <h3 className="font-bold text-[12px] uppercase tracking-[0.12em] text-slate-400 mb-3">Accessori e componenti</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th className="text-left px-4 py-3 font-semibold border-b border-slate-200 text-slate-700">#</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-slate-200 text-slate-700">Codice</th>
                      <th className="text-left px-4 py-3 font-semibold border-b border-slate-200 text-slate-700 hidden md:table-cell print-show-cell">Descrizione</th>
                      <th className="text-right px-4 py-3 font-semibold border-b border-slate-200 text-slate-700">Q.tà</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.accessori.map((a, i) => (
                      <tr key={a.codice} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderTop: '1px solid #E5E9F0' }}>
                        <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3"><span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{a.codice}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell print-show-cell text-xs text-slate-500">{a.descrizione}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: NAVY }}>{a.quantita}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="mt-5 text-[12px] text-slate-400">
            * Misure di taglio calcolate sulle formule della distinta tecnica Alsistem Global 45. Quantità accessori indicative.
          </p>
        </div>
      )
    }
  }

  return (
    <div style={{ background: '#F4F6F9', minHeight: '100vh' }}>
      {/* Stepper bar */}
      <div className="no-print bg-white border-b border-slate-200/80 sticky top-[68px] z-30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-3">
          <Stepper current={step} maxReached={maxReached} onJump={jumpTo} />
        </div>
      </div>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14 pb-24 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">
          <div className="min-w-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_rgba(27,58,107,0.04)] overflow-hidden">
              <div key={step} className={direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}>
                {renderStep()}
              </div>
            </div>

            {/* Nav */}
            {step > 0 && step < 4 && (
              <div className="no-print mt-10 pt-6 border-t border-slate-200/70 flex items-center justify-between gap-4">
                <Btn kind="ghost" onClick={goBack}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Indietro
                </Btn>
                <div className="hidden sm:block text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400 tabular-nums">
                  Step {String(step + 1).padStart(2, '0')} di {String(STEPS.length).padStart(2, '0')}
                </div>
                <Btn kind="primary" onClick={advance} disabled={!canAdvance}>
                  {step === 3 ? 'Calcola lista materiali' : 'Continua'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Btn>
              </div>
            )}
            {step === 4 && (
              <div className="no-print mt-10 pt-6 border-t border-slate-200/70 flex items-center justify-between gap-4">
                <Btn kind="ghost" onClick={() => { setDirection('backward'); setStep(3) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Modifica accessori
                </Btn>
                <button onClick={() => { setState(DEFAULT_STATE); setDirection('backward'); setStep(0); setMaxReached(0) }}
                  className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline">
                  Nuova configurazione
                </button>
              </div>
            )}

            {/* Validation warnings */}
            {validazione.warnings.length > 0 && step > 0 && (
              <div className="mt-4 space-y-2">
                {validazione.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
                    style={{
                      background: w.severita === 'error' ? 'rgba(220,38,38,0.05)' : 'rgba(217,119,6,0.05)',
                      border: `1px solid ${w.severita === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)'}`,
                      color: w.severita === 'error' ? '#DC2626' : '#D97706',
                    }}>
                    <span>{w.severita === 'error' ? '✗' : '⚠'}</span>
                    <span>{w.messaggio}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {step < 4 && <Sidebar state={state} bom={bom} />}
        </div>
      </main>

      {/* Barra riepilogo fissa su mobile */}
      {step < 4 && <MobileSummaryBar state={state} bom={bom} />}
    </div>
  )
}

// ─── TipologiaSvg ─────────────────────────────────────────────────────────────

function TipologiaSvg({ id }: { id: TipoConfigurazione }) {
  const c = { stroke: NAVY, strokeWidth: 2, fill: 'none' as const }
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="px-6 py-3">
      {id === 'con_telaio' && (
        <g>
          <rect x="20" y="14" width="120" height="72" {...c} />
          <rect x="28" y="22" width="50" height="56" {...c} strokeWidth={1.2} />
          <rect x="82" y="22" width="50" height="56" {...c} strokeWidth={1.2} />
          {Array.from({ length: 7 }).map((_, i) => <line key={i} x1="32" x2="74" y1={28 + i * 7} y2={28 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          {Array.from({ length: 7 }).map((_, i) => <line key={i} x1="86" x2="128" y1={28 + i * 7} y2={28 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          <circle cx="70" cy="50" r="2" fill={ACCENT} />
          <circle cx="90" cy="50" r="2" fill={ACCENT} />
        </g>
      )}
      {id === 'senza_telaio' && (
        <g>
          <rect x="20" y="14" width="120" height="72" stroke="#CBD5E1" strokeDasharray="3 3" fill="none" strokeWidth={1} />
          <rect x="28" y="20" width="50" height="60" {...c} />
          <rect x="82" y="20" width="50" height="60" {...c} />
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="32" x2="74" y1={24 + i * 7} y2={24 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="86" x2="128" y1={24 + i * 7} y2={24 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
        </g>
      )}
      {id === 'senza_telaio_con_sportellino' && (
        <g>
          <rect x="20" y="14" width="120" height="72" {...c} />
          <rect x="28" y="22" width="50" height="56" {...c} strokeWidth={1.2} />
          <rect x="82" y="22" width="50" height="56" {...c} strokeWidth={1.2} />
          {Array.from({ length: 7 }).map((_, i) => <line key={i} x1="32" x2="74" y1={28 + i * 7} y2={28 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          {Array.from({ length: 3 }).map((_, i) => <line key={i} x1="86" x2="128" y1={28 + i * 7} y2={28 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          <rect x="86" y="50" width="42" height="26" stroke={ACCENT} strokeWidth={1.6} strokeDasharray="2 2" fill="none" />
          <circle cx="124" cy="63" r="1.6" fill={ACCENT} />
        </g>
      )}
      {id === 'scorrevole' && (
        <g>
          <line x1="16" y1="14" x2="144" y2="14" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
          <rect x="20" y="18" width="55" height="68" {...c} />
          <rect x="85" y="18" width="55" height="68" {...c} />
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="24" x2="71" y1={24 + i * 7} y2={24 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="89" x2="136" y1={24 + i * 7} y2={24 + i * 7} stroke={NAVY} strokeWidth={1.2} opacity="0.7" />)}
        </g>
      )}
      {id === 'scurone' && (
        <g>
          <rect x="20" y="14" width="120" height="72" {...c} />
          <rect x="28" y="22" width="50" height="56" fill={NAVY} opacity="0.85" />
          <rect x="82" y="22" width="50" height="56" fill={NAVY} opacity="0.85" />
          {Array.from({ length: 5 }).map((_, i) => <line key={i} x1={34 + i * 9} x2={34 + i * 9} y1="24" y2="76" stroke="white" strokeWidth="0.8" opacity="0.25" />)}
          {Array.from({ length: 5 }).map((_, i) => <line key={i} x1={88 + i * 9} x2={88 + i * 9} y1="24" y2="76" stroke="white" strokeWidth="0.8" opacity="0.25" />)}
        </g>
      )}
    </svg>
  )
}

// ─── DimField ─────────────────────────────────────────────────────────────────

function DimField({ label, suffix, value, onChange, min, max }: {
  label: string; suffix: string; value: number
  onChange: (v: number) => void; min: number; max: number
}) {
  const [focused, setFocused] = useState(false)
  const isInvalid = value > 0 && (value < min || value > max)
  const errorId = `dim-err-${label.toLowerCase().replace(/\s+/g, '-')}`

  const borderColor = focused ? NAVY : isInvalid ? '#EF4444' : '#E2E8F0'

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.14em] font-bold text-slate-500 mb-2">{label}</div>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          className="w-full rounded-xl border bg-white px-4 py-3.5 text-base font-mono font-bold pr-14 outline-none transition-colors"
          style={{ color: '#0F172A', borderColor }}
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold transition-colors"
          style={{ color: isInvalid && !focused ? '#EF4444' : '#94A3B8' }}
        >
          {suffix}
        </span>
      </div>
      {isInvalid && (
        <p id={errorId} className="mt-1.5 text-[12px] font-semibold" style={{ color: '#DC2626' }}>
          Range consentito: {min.toLocaleString('it-IT')} – {max.toLocaleString('it-IT')} mm
        </p>
      )}
    </div>
  )
}

// ─── Wrapper con Suspense (richiesto da useSearchParams in App Router) ─────────

const VALID_TIPI: TipoConfigurazione[] = [
  'con_telaio', 'senza_telaio', 'senza_telaio_con_sportellino', 'scorrevole', 'scurone',
]

function ConfiguratorePageWrapper() {
  const params = useSearchParams()
  const raw = params.get('tipo') as TipoConfigurazione
  const hasPreselect = VALID_TIPI.includes(raw)
  const initialTipo = hasPreselect ? raw : DEFAULT_STATE.tipologia
  return <ConfiguratorePage initialTipo={initialTipo} hasPreselect={hasPreselect} />
}

export default function Page() {
  return (
    <Suspense>
      <ConfiguratorePageWrapper />
    </Suspense>
  )
}
