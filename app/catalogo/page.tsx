import Link from 'next/link'
import catalogoData from '@/FresiAlluminio/catalogo-global45.json'
import { ACCENT, NAVY } from '@/lib/tokens'

export const metadata = {
  title: 'Catalogo Global 45 — Fresia Alluminio',
}

const LABELS: Record<string, string> = {
  telai: 'Telai',
  ante: 'Ante',
  riporti_centrali: 'Riporti centrali',
  fasce_zoccoli: 'Fasce e zoccoli',
  profili_meccanismi: 'Profili meccanismi',
}

type ProfiloRaw = {
  codice: string
  descrizione: string
  peso_gr_m?: number
  lunghezza_barra_mm: number
  note?: string
  cava?: string
}

export default function CatalogoPage() {
  const meta = catalogoData.meta
  const g45 = (catalogoData.profili as Record<string, Record<string, ProfiloRaw[]>>).global45

  const categories = Object.entries(g45)

  return (
    <div style={{ background: '#EEEEEE', minHeight: '100vh' }}>
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-2" style={{ color: ACCENT }}>
            {meta.sistema} · {meta.produttore}
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900 mb-1">
            Catalogo tecnico profili
          </h1>
          <p className="text-[14px] text-slate-500">
            Edizione {meta.edizione}
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="space-y-8">
          {categories.map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-[11px] uppercase tracking-[0.16em] font-bold mb-3" style={{ color: NAVY }}>
                {LABELS[cat] ?? cat}
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold">Codice</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold">Descrizione</th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold">kg/m</th>
                      <th className="text-right px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-slate-400 font-semibold">Barra (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.codice} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-[13px]" style={{ color: ACCENT }}>
                          {p.codice}
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {p.descrizione}
                          {p.cava && <span className="ml-2 text-[11px] text-slate-400">cava: {p.cava}</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600">
                          {p.peso_gr_m != null ? (p.peso_gr_m / 1000).toFixed(3) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600">
                          {p.lunghezza_barra_mm.toLocaleString('it-IT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/configuratore"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-white text-[14px] transition hover:-translate-y-px"
            style={{ background: ACCENT, boxShadow: '0 8px 24px rgba(167,0,0,0.20)' }}
          >
            Avvia configurazione →
          </Link>
        </div>
      </div>
    </div>
  )
}
