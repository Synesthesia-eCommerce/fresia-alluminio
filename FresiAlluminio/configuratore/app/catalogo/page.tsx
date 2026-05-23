import {
  getTelai,
  getAnte,
  getOvaline,
  getFasceZoccoli,
  getRiportiCentrali,
  getProfiliMeccanismi,
  getProfiliScorrimento,
  getSportellini,
  getAltriProfili,
  getAllAccessori,
  getMeccanismoPerla70,
  getMeccanismoVenere,
} from '@/lib/catalogo'
import type { Profilo, Accessorio } from '@/lib/types'
import Link from 'next/link'

function ProfiloTable({ profili }: { profili: Profilo[] }) {
  if (profili.length === 0) return <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Nessun profilo</p>
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--brand-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--brand-bg)' }}>
            <th className="text-left px-4 py-2.5 font-semibold border-b" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Codice</th>
            <th className="text-left px-4 py-2.5 font-semibold border-b hidden md:table-cell" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descrizione</th>
            <th className="text-right px-4 py-2.5 font-semibold border-b" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>g/m</th>
            <th className="text-right px-4 py-2.5 font-semibold border-b hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Barra</th>
            <th className="text-left px-4 py-2.5 font-semibold border-b hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cava</th>
          </tr>
        </thead>
        <tbody>
          {profili.map((p, i) => (
            <tr
              key={p.codice}
              style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'var(--brand-bg)', borderTop: i > 0 ? '1px solid var(--brand-border)' : undefined }}
            >
              <td className="px-4 py-2.5">
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{p.codice}</span>
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell text-sm" style={{ color: 'var(--brand-text)' }}>{p.descrizione}</td>
              <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--brand-text)' }}>{p.peso_gr_m ?? '—'}</td>
              <td className="px-4 py-2.5 text-right font-mono text-sm hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)' }}>
                {p.lunghezza_barra_mm ? `${(p.lunghezza_barra_mm / 1000).toFixed(1)} m` : '—'}
              </td>
              <td className="px-4 py-2.5 hidden sm:table-cell">
                {p.cava && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(27,58,107,0.08)', color: 'var(--brand-primary)' }}
                  >
                    {p.cava}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccessorioTable({ accessori }: { accessori: Accessorio[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--brand-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--brand-bg)' }}>
            <th className="text-left px-4 py-2.5 font-semibold border-b" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Codice</th>
            <th className="text-left px-4 py-2.5 font-semibold border-b hidden md:table-cell" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Descrizione</th>
            <th className="text-left px-4 py-2.5 font-semibold border-b hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)', fontSize: '0.75rem', textTransform: 'uppercase' }}>UdV</th>
          </tr>
        </thead>
        <tbody>
          {accessori.map((a, i) => (
            <tr
              key={a.codice}
              style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'var(--brand-bg)', borderTop: i > 0 ? '1px solid var(--brand-border)' : undefined }}
            >
              <td className="px-4 py-2.5">
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{a.codice}</span>
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell text-sm" style={{ color: 'var(--brand-text)' }}>{a.descrizione}</td>
              <td className="px-4 py-2.5 hidden sm:table-cell text-xs" style={{ color: 'var(--brand-text-muted)' }}>{a.udv ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ titolo, count, children }: { titolo: string; count: number; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>{titolo}</h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(27,58,107,0.08)', color: 'var(--brand-primary)' }}
        >
          {count}
        </span>
      </div>
      {children}
    </section>
  )
}

export default function CatalogoPage() {
  const telai = getTelai()
  const ante = getAnte()
  const ovaline = getOvaline()
  const fasce = getFasceZoccoli()
  const riporti = getRiportiCentrali()
  const profiliMeccanismi = getProfiliMeccanismi()
  const profiliScorrimento = getProfiliScorrimento()
  const sportellini = getSportellini()
  const altriProfili = getAltriProfili()
  const accessori = getAllAccessori()
  const perla70 = getMeccanismoPerla70()
  const venere = getMeccanismoVenere()

  return (
    <div style={{ backgroundColor: 'var(--brand-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--brand-primary)' }} className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Catalogo Global 45</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }} className="text-sm">
            Sistema Persiana Alsistem — tutti i profili, accessori e meccanismi
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Telai', n: telai.length },
            { label: 'Ante', n: ante.length },
            { label: 'Ovaline', n: ovaline.length },
            { label: 'Accessori', n: accessori.length },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{s.n}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
          style={{ backgroundColor: 'rgba(232,96,14,0.06)', border: '1px solid rgba(232,96,14,0.2)' }}
        >
          <div>
            <div className="font-bold" style={{ color: 'var(--brand-primary)' }}>Vuoi generare una distinta?</div>
            <div className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Usa il configuratore per calcolare tagli, quantità e peso</div>
          </div>
          <Link href="/configuratore" className="btn-primary">
            Avvia configurazione →
          </Link>
        </div>

        <Section titolo="Telai" count={telai.length}><ProfiloTable profili={telai} /></Section>
        <Section titolo="Ante" count={ante.length}><ProfiloTable profili={ante} /></Section>
        <Section titolo="Ovaline" count={ovaline.length}><ProfiloTable profili={ovaline} /></Section>
        <Section titolo="Fasce e Zoccoli" count={fasce.length}><ProfiloTable profili={fasce} /></Section>
        <Section titolo="Riporti Centrali" count={riporti.length}><ProfiloTable profili={riporti} /></Section>

        {profiliMeccanismi.length > 0 && (
          <Section titolo="Profili Meccanismi" count={profiliMeccanismi.length}><ProfiloTable profili={profiliMeccanismi} /></Section>
        )}
        {profiliScorrimento.length > 0 && (
          <Section titolo="Profili Scorrimento" count={profiliScorrimento.length}><ProfiloTable profili={profiliScorrimento} /></Section>
        )}
        {sportellini.length > 0 && (
          <Section titolo="Sportellini" count={sportellini.length}><ProfiloTable profili={sportellini} /></Section>
        )}
        {altriProfili.length > 0 && (
          <Section titolo="Altri Profili" count={altriProfili.length}><ProfiloTable profili={altriProfili} /></Section>
        )}

        <Section titolo="Accessori" count={accessori.length}><AccessorioTable accessori={accessori} /></Section>

        {/* Meccanismi */}
        <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--brand-border)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--brand-primary)' }}>Meccanismi Orientabili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { mec: perla70, nome: 'Perla 70' },
              { mec: venere, nome: 'Venere' },
            ].map(({ mec, nome }) => (
              <div key={nome}>
                <div className="font-semibold mb-1 text-sm" style={{ color: 'var(--brand-primary)' }}>{nome}</div>
                <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>{mec.descrizione}</p>
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--brand-border)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--brand-bg)' }}>
                        <th className="text-left px-3 py-2 border-b font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)' }}>Codice</th>
                        <th className="text-right px-3 py-2 border-b font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)' }}>H max</th>
                        <th className="text-right px-3 py-2 border-b font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)' }}>Lamelle</th>
                        <th className="text-right px-3 py-2 border-b font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-text-muted)', borderColor: 'var(--brand-border)' }}>Comando</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mec.tabella_misure.map((v, i) => (
                        <tr
                          key={v.codice}
                          style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'var(--brand-bg)', borderTop: i > 0 ? '1px solid var(--brand-border)' : undefined }}
                        >
                          <td className="px-3 py-2 font-mono font-bold" style={{ color: 'var(--brand-primary)' }}>{v.codice}</td>
                          <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--brand-text)' }}>{v.h_max_mm} mm</td>
                          <td className="px-3 py-2 text-right" style={{ color: 'var(--brand-text)' }}>{v.num_lamelle}</td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: v.comando === 'doppio' ? 'rgba(232,96,14,0.1)' : 'rgba(27,58,107,0.08)',
                                color: v.comando === 'doppio' ? 'var(--brand-accent)' : 'var(--brand-primary)',
                              }}
                            >
                              {v.comando}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
