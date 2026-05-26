'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ACCENT, NAVY } from '@/lib/tokens'
import {
  leggiElementi,
  rimuoviElemento,
  salvaElementi,
  mergeBoMs,
  ELEMENTI_EVENT,
  type ElementoSalvato,
} from '@/lib/elementi-store'
import type { ListaMateriali } from '@/lib/types'
import { generaListaMateriali } from '@/lib/engine'
import { getTelai, getAnte, getOvaline, getFasceZoccoli, getRiportiCentrali } from '@/lib/catalogo'
import type { Profilo } from '@/lib/types'

// ─── TIPOLOGIE labels ─────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  con_telaio: 'Con telaio',
  senza_telaio: 'Senza telaio',
  senza_telaio_con_sportellino: 'Con sportellino',
  scorrevole: 'Scorrevole',
  scurone: 'Scurone',
}

// ─── BOM table ────────────────────────────────────────────────────────────────

function BomTable({ b }: { b: ListaMateriali }) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 overflow-hidden mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: NAVY, color: '#fff' }}>
              <th className="text-left px-4 py-2.5 font-semibold w-8">#</th>
              <th className="text-left px-4 py-2.5 font-semibold">Codice</th>
              <th className="text-left px-4 py-2.5 font-semibold hidden md:table-cell">Descrizione</th>
              <th className="text-right px-4 py-2.5 font-semibold">Taglio</th>
              <th className="text-right px-4 py-2.5 font-semibold">Q.tà</th>
              <th className="text-right px-4 py-2.5 font-semibold">Peso</th>
            </tr>
          </thead>
          <tbody>
            {b.profili.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Nessun profilo</td></tr>
            ) : b.profili.map((r, i) => (
              <tr key={`${r.codice}-${r.taglio_mm}`} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderTop: '1px solid #E3E3E3' }}>
                <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                <td className="px-4 py-2"><span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{r.codice}</span></td>
                <td className="px-4 py-2 hidden md:table-cell text-xs text-slate-500">{r.descrizione}</td>
                <td className="px-4 py-2 text-right font-mono text-sm font-semibold text-slate-800">{r.taglio_mm} mm</td>
                <td className="px-4 py-2 text-right">
                  <span className="font-bold px-2 py-0.5 rounded text-xs tabular-nums" style={{ background: 'rgba(0,0,0,0.05)', color: NAVY }}>× {r.quantita}</span>
                </td>
                <td className="px-4 py-2 text-right text-xs font-semibold text-slate-500">{r.peso_kg} kg</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(0,0,0,0.04)', borderTop: '2px solid #E3E3E3' }}>
              <td colSpan={5} className="px-4 py-2 text-right font-bold text-sm" style={{ color: NAVY }}>Peso totale profili</td>
              <td className="px-4 py-2 text-right font-bold" style={{ color: ACCENT }}>{b.peso_totale_kg.toFixed(2)} kg</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {b.accessori.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th className="text-left px-4 py-2.5 font-semibold border-b border-slate-200 text-slate-600 w-8">#</th>
                <th className="text-left px-4 py-2.5 font-semibold border-b border-slate-200 text-slate-600">Codice</th>
                <th className="text-left px-4 py-2.5 font-semibold border-b border-slate-200 text-slate-600 hidden md:table-cell">Descrizione</th>
                <th className="text-right px-4 py-2.5 font-semibold border-b border-slate-200 text-slate-600">Q.tà</th>
              </tr>
            </thead>
            <tbody>
              {b.accessori.map((a, i) => (
                <tr key={a.codice} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFD', borderTop: '1px solid #E3E3E3' }}>
                  <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2"><span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{a.codice}</span></td>
                  <td className="px-4 py-2 hidden md:table-cell text-xs text-slate-500">{a.descrizione}</td>
                  <td className="px-4 py-2 text-right font-bold tabular-nums text-sm" style={{ color: NAVY }}>{a.quantita}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListaPage() {
  const router = useRouter()
  const [elementi, setElementi] = useState<ElementoSalvato[]>([])
  const [tab, setTab] = useState<'elementi' | 'totale'>('elementi')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const sync = useCallback(() => {
    const items = leggiElementi()
    // Re-compute BOM for elements saved with 0 weight (stale data from before engine fix)
    const telai = getTelai()
    const ante = getAnte()
    const ovaline = getOvaline()
    const fasce = getFasceZoccoli()
    const riporti = getRiportiCentrali()
    const findP = (list: Profilo[], code: string | null) =>
      code ? list.find(p => p.codice === code) ?? null : null

    const migrated = items.map(el => {
      if (el.bom.peso_totale_kg > 0) return el
      const s = el.stato
      const bom = generaListaMateriali({
        tipo: s.tipologia,
        profili: {
          telaio: findP(telai, s.profili.telaio),
          anta: findP(ante, s.profili.anta),
          ovalina: findP(ovaline, s.profili.ovalina),
          fascia: findP([...fasce, ...riporti], s.profili.fascia),
          riporto_centrale: null,
        },
        dimensioni: {
          larghezza_mm: s.dimensioni.larghezza,
          altezza_mm: s.dimensioni.altezza,
          num_ante: s.dimensioni.ante,
          meccanismo: s.meccanismo,
        },
        accessori_extra: s.accessori,
      })
      return bom.peso_totale_kg > 0 ? { ...el, bom } : el
    })

    const hasChanges = migrated.some((el, i) => el.bom !== items[i].bom)
    if (hasChanges) salvaElementi(migrated)
    setElementi(migrated)
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener(ELEMENTI_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ELEMENTI_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [sync])

  const handleDelete = (id: string) => {
    rimuoviElemento(id)
    setConfirmDelete(null)
  }

  const handleEdit = (el: ElementoSalvato) => {
    router.push(`/configuratore?edit=${el.id}`)
  }

  const handleClearAll = () => {
    salvaElementi([])
  }

  const bomTotale = mergeBoMs(elementi.map(e => e.bom))

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (elementi.length === 0) {
    return (
      <div style={{ background: '#EEEEEE', minHeight: '100vh' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#fff', border: '1px solid #E3E3E3' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: '#CCCCCC' }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-slate-900 mb-2">Nessun elemento configurato</h1>
          <p className="text-slate-500 text-[14px] mb-8 max-w-[36ch]">
            Configura una persiana, arriva allo step 4 e salvala per vederla qui.
          </p>
          <Link
            href="/configuratore"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-white text-[14px] transition hover:-translate-y-px"
            style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(167,0,0,0.20)' }}
          >
            Avvia configurazione →
          </Link>
        </div>
      </div>
    )
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#EEEEEE', minHeight: '100vh' }}>
      {/* Page header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1.5" style={{ color: ACCENT }}>
                Lista elementi
              </div>
              <h1 className="text-[26px] font-bold tracking-[-0.02em] text-slate-900">
                {elementi.length} {elementi.length === 1 ? 'elemento configurato' : 'elementi configurati'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:bg-red-50 hover:text-red-600"
                style={{ color: '#999', border: '1px solid #E3E3E3', background: '#fff' }}
              >
                Svuota lista
              </button>
              <Link
                href="/configuratore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: ACCENT }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                Aggiungi elemento
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-slate-100 flex-wrap">
            {[
              { l: 'Elementi', v: elementi.length },
              { l: 'Peso totale', v: `${bomTotale.peso_totale_kg.toFixed(2)} kg` },
              { l: 'Codici profilo', v: bomTotale.profili.length },
              { l: 'Codici accessorio', v: bomTotale.accessori.length },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{s.l}:</span>
                <span className="font-mono font-bold text-sm" style={{ color: NAVY }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-6">
        <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: '#E3E3E3' }}>
          {(['elementi', 'totale'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="py-2 px-5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? NAVY : '#666666',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {t === 'elementi' ? `Per elemento` : 'Lista totale magazzino'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 pb-16">
        {tab === 'elementi' ? (
          <div className="space-y-4">
            {elementi.map((el, idx) => {
              const isExpanded = expandedId === el.id
              const isConfirming = confirmDelete === el.id
              return (
                <div
                  key={el.id}
                  className="bg-white rounded-2xl border overflow-hidden transition-all"
                  style={{ borderColor: '#E3E3E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  {/* Element header row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Index badge */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: NAVY }}
                    >
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-[15px] truncate">{el.nome}</div>
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        {TIPO_LABEL[el.stato.tipologia] ?? el.stato.tipologia}
                        {' · '}
                        {el.stato.dimensioni.larghezza} × {el.stato.dimensioni.altezza} mm
                        {' · '}
                        {el.stato.dimensioni.ante} {el.stato.dimensioni.ante === 1 ? 'anta' : 'ante'}
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-[10px] text-slate-400">Peso</div>
                      <div className="font-mono font-bold text-sm" style={{ color: NAVY }}>
                        {el.bom.peso_totale_kg.toFixed(2)} kg
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(el)}
                        title="Modifica"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(el.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition"
                            style={{ background: '#DC2626' }}
                          >
                            Elimina
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(el.id)}
                          title="Elimina"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : el.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Chiudi dettaglio' : 'Vedi distinta'}
                      >
                        <svg
                          width="15" height="15" viewBox="0 0 24 24" fill="none"
                          className="transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Profili codes summary */}
                  <div className="px-5 pb-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                    {[
                      { l: 'Telaio', v: el.stato.profili.telaio },
                      { l: 'Anta', v: el.stato.profili.anta },
                      { l: 'Ovalina', v: el.stato.profili.ovalina },
                      { l: 'Fascia', v: el.stato.profili.fascia },
                    ].filter(f => f.v).map(f => (
                      <div key={f.l} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E3E3E3' }}>
                        <span className="text-[10px] text-slate-400">{f.l}</span>
                        <span className="font-mono font-bold text-[12px]" style={{ color: NAVY }}>{f.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expanded BOM */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                      <BomTable b={el.bom} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add another */}
            <Link
              href="/configuratore"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'rgba(167,0,0,0.05)', border: `2px dashed ${ACCENT}`, color: ACCENT }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
              Aggiungi un altro elemento
            </Link>
          </div>
        ) : (
          /* Total BOM */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold mb-1" style={{ color: ACCENT }}>
                  Lista consolidata
                </div>
                <h2 className="text-[20px] font-bold text-slate-900 tracking-[-0.01em]">
                  Distinta totale magazzino
                </h2>
                <p className="text-[13px] text-slate-400 mt-1">
                  Quantità cumulate su {elementi.length} {elementi.length === 1 ? 'elemento' : 'elementi'} · {bomTotale.peso_totale_kg.toFixed(2)} kg totali
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition hover:-translate-y-px"
                style={{ background: '#F5F5F5', border: '1px solid #E3E3E3', color: NAVY }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M9 21h6v-7H9v7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Stampa / PDF
              </button>
            </div>
            <BomTable b={bomTotale} />
            <p className="mt-4 text-[12px] text-slate-400">
              * Misure di taglio calcolate sulle formule Alsistem Global 45. Quantità accessori indicative.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
