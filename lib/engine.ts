import type {
  ConfigurazioneUtente,
  ListaMateriali,
  RigaProfilo,
  RigaAccessorio,
  RisultatoValidazione,
  Warning,
  SuggerimentoMeccanismo,
} from './types'
import {
  getProfiloByCodice,
  getAccessorioByCodice,
  getCompatibilitaRaw,
  getMeccanismoPerla70,
  getMeccanismoVenere,
  getConfigurazioniTipo,
} from './catalogo'

// ─── Formula ──────────────────────────────────────────────────────────────────

function evalFormula(formula: string, L: number, H: number): number {
  // Extract from parens if present: "vedi scheda (L/2 - 123)" → "L/2 - 123"
  const parenMatch = formula.match(/\(([^)]+)\)/)
  const f = (parenMatch ? parenMatch[1] : formula).trim()

  // Pattern: (L|H) (/divisor)? ([+-] offset)?
  const m = f.match(/^(L|H)(?:\/(\d+(?:\.\d+)?))?(?:\s*([+-])\s*(\d+(?:\.\d+)?))?$/)
  if (!m) return 0

  const base = m[1] === 'L' ? L : H
  const divisor = m[2] ? parseFloat(m[2]) : 1
  const sign = m[3] === '-' ? -1 : 1
  const offset = m[4] ? parseFloat(m[4]) : 0
  return Math.round(base / divisor + sign * offset)
}

// ─── Config matching ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConfigRaw = any

function trovaConfigurazione(cfg: ConfigurazioneUtente): ConfigRaw | null {
  const configs = getConfigurazioniTipo() as ConfigRaw[]

  const tipoMap: Record<string, string[]> = {
    con_telaio: ['con_telaio', 'con_telaio_orientabile', 'con_telaio_maggiorato', 'con_telaio_storico', 'con_telaio_nuova_generazione'],
    senza_telaio: ['senza_telaio_rustica', 'senza_telaio'],
    senza_telaio_con_sportellino: ['senza_telaio_con_sportellino'],
    scorrevole: ['scorrevole'],
    scurone: ['scurone_senza_telaio', 'scurone_con_telaio'],
  }

  const tipiAccettati = cfg.tipo ? (tipoMap[cfg.tipo] ?? []) : []
  const candidati = configs.filter(c => tipiAccettati.includes(c.tipo))

  if (candidati.length === 0) return configs[0] ?? null

  // Prefer config whose anta matches user selection
  const antaCodice = cfg.profili.anta?.codice
  if (antaCodice) {
    const match = candidati.find(c =>
      (c.componenti_principali.anta ?? []).includes(antaCodice)
    )
    if (match) return match
  }

  // Prefer config matching telaio
  const telaioCodice = cfg.profili.telaio?.codice
  if (telaioCodice) {
    const match = candidati.find(c =>
      (c.componenti_principali.telaio ?? []).includes(telaioCodice)
    )
    if (match) return match
  }

  return candidati[0]
}

// ─── Quantities ───────────────────────────────────────────────────────────────

function ruoloProfilo(codice: string, config: ConfigRaw): string {
  const cp = config.componenti_principali
  if ((cp.telaio ?? []).includes(codice)) return 'telaio'
  if ((cp.anta ?? []).includes(codice)) return 'anta'
  if ((cp.ovalina ?? []).includes(codice)) return 'ovalina'
  if ((cp.fascia_zoccolo ?? []).includes(codice)) return 'fascia'
  if ((cp.riporto_centrale ?? []).includes(codice)) return 'riporto'
  if ((cp.chiudigola ?? []).includes(codice)) return 'chiudigola'
  if ((cp.sportellino ?? []).includes(codice)) return 'sportellino'
  return 'altro'
}

function calcolaQuantitaProfilo(
  ruolo: string,
  numAnte: number,
  nOvaline: number
): number {
  switch (ruolo) {
    case 'telaio': return 2
    case 'anta': return 2 * numAnte
    case 'ovalina': return nOvaline * numAnte
    case 'fascia': return numAnte
    case 'chiudigola': return numAnte
    case 'riporto': return 1
    case 'sportellino': return numAnte
    default: return numAnte
  }
}

function calcolaNOvaline(ovalinaCodice: string, H: number): number {
  const ov = getProfiloByCodice(ovalinaCodice)
  if (!ov?.formula_num_ovaline) return Math.max(1, Math.floor((H - 250) / 40))
  // Evaluate formula like "(H-250)/40"
  const f = ov.formula_num_ovaline.replace(/[()]/g, '')
  const m = f.match(/^H\s*-\s*(\d+)\s*\/\s*(\d+)$/)
  if (!m) return Math.max(1, Math.floor((H - 250) / 40))
  return Math.max(1, Math.floor((H - parseInt(m[1])) / parseInt(m[2])))
}

// ─── Accessori quantities ──────────────────────────────────────────────────────

function quantitaAccessorio(
  ruoloKey: string,
  numAnte: number,
  nOvaline: number
): number {
  const k = ruoloKey.toLowerCase()
  if (k.includes('cerniera') || k.includes('cardine')) return 3 * numAnte
  if (k.includes('tappo_montante')) return 2 * numAnte
  if (k.includes('sella')) return (nOvaline * 2 + 2) * numAnte
  if (k.includes('squadretta_allineamento')) return 4 * numAnte
  if (k.includes('squadretta_assemblaggio')) return 4 * numAnte
  if (k.includes('cremonese') || k.includes('spagnoletta') || k.includes('chiusura')) return numAnte
  if (k.includes('tappo_anti_intestatura')) return 2 * numAnte
  if (k.includes('incontro')) return 2 * numAnte
  if (k.includes('tappo_chiudiforo')) return 4 * numAnte
  if (k.includes('puntale')) return 2 * numAnte
  if (k.includes('fermapersiana')) return 2 * numAnte
  if (k.includes('nasello') || k.includes('kit_collegamento')) return 2 * numAnte
  if (k.includes('guarnizione')) return 1
  if (k.includes('tappo_battuta')) return 4 * numAnte
  if (k.includes('regolo')) return 2
  return numAnte
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function generaListaMateriali(cfg: ConfigurazioneUtente): ListaMateriali {
  const config = trovaConfigurazione(cfg)
  if (!config) return { profili: [], accessori: [], peso_totale_kg: 0 }

  const { larghezza_mm: L, altezza_mm: H, num_ante } = cfg.dimensioni

  const antaCodice = cfg.profili.anta?.codice ?? ''
  const ovalinaCodice = cfg.profili.ovalina?.codice ?? ''
  const nOvaline = ovalinaCodice ? calcolaNOvaline(ovalinaCodice, H) : 0

  // Select the correct distinta key
  const distinte: Record<string, Record<string, string>> = config.distinte_taglio ?? {}
  let distinteKey = num_ante === 1 ? '1_anta' : '2_ante'
  if (!distinte[distinteKey] && Object.keys(distinte).length > 0) {
    distinteKey = Object.keys(distinte)[0]
  }
  const distinta: Record<string, string> = distinte[distinteKey] ?? {}

  const righeProfileProfili: RigaProfilo[] = []

  for (const [key, formula] of Object.entries(distinta)) {
    // Parse key: "AS 4522_orizzontale" or "G4593F"
    const lastUnderscore = key.lastIndexOf('_')
    let codice = key
    if (lastUnderscore !== -1) {
      const suffix = key.slice(lastUnderscore + 1)
      if (suffix === 'orizzontale' || suffix === 'verticale') {
        codice = key.slice(0, lastUnderscore)
      }
    }

    // Use user's selection if it overrides the default
    const profiloSelezionato = (
      cfg.profili.telaio?.codice === codice ? cfg.profili.telaio :
      cfg.profili.anta?.codice === codice ? cfg.profili.anta :
      cfg.profili.ovalina?.codice === codice ? cfg.profili.ovalina :
      cfg.profili.fascia?.codice === codice ? cfg.profili.fascia :
      cfg.profili.riporto_centrale?.codice === codice ? cfg.profili.riporto_centrale :
      null
    ) ?? getProfiloByCodice(codice)

    if (!profiloSelezionato) continue

    const taglio = evalFormula(formula, L, H)
    if (taglio <= 0) continue

    const ruolo = ruoloProfilo(codice, config)
    const quantita = calcolaQuantitaProfilo(ruolo, num_ante, nOvaline)
    const pesoKg = ((profiloSelezionato.peso_gr_m ?? 0) * (taglio / 1000) * quantita) / 1000

    // Check if we already have this profile+taglio combo (same profile, different direction)
    const existing = righeProfileProfili.find(
      r => r.codice === profiloSelezionato.codice && r.taglio_mm === taglio
    )
    if (existing) {
      existing.quantita += quantita
      existing.peso_kg = ((profiloSelezionato.peso_gr_m ?? 0) * (taglio / 1000) * existing.quantita) / 1000
    } else {
      righeProfileProfili.push({
        codice: profiloSelezionato.codice,
        descrizione: profiloSelezionato.descrizione,
        quantita,
        taglio_mm: taglio,
        peso_kg: Math.round(pesoKg * 100) / 100,
        note: `Formula: ${formula}`,
      })
    }
  }

  // Round weights
  righeProfileProfili.forEach(r => {
    r.peso_kg = Math.round(r.peso_kg * 100) / 100
  })

  // ─── Accessori ──────────────────────────────────────────────────────────────

  const accessoriRichiesti: Record<string, string> = config.accessori_richiesti ?? {}
  const righeAccessori: RigaAccessorio[] = []
  const seen = new Set<string>()

  // Apply compatibility overrides
  const compat = getCompatibilitaRaw() as {
    tappi_montante_per_anta: { regole: Array<{ anta: string; tappo: string }> }
    selle_per_ovalina: { regole: Array<{ ovalina: string; cava_8mm?: string; cava_15mm?: string }> }
    tappi_anti_intestatura_per_fascia: { regole: Array<{ fascia: string[]; tappo: string }> }
  }

  // Tappo montante override
  const tappoMontanteOverride = compat.tappi_montante_per_anta.regole.find(
    r => r.anta === antaCodice
  )

  // Sella override
  const antaProfilo = cfg.profili.anta
  const cavaAnta = antaProfilo?.cava ?? '8mm'
  const sellaOverride = compat.selle_per_ovalina.regole.find(
    r => r.ovalina === ovalinaCodice
  )

  for (const [ruoloKey, codiceDefault] of Object.entries(accessoriRichiesti)) {
    let codice = codiceDefault
      .split(' (')[0]  // strip parenthetical notes like " (1 anta)"
      .trim()

    // Apply compatibility overrides
    if (ruoloKey === 'tappo_montante' && tappoMontanteOverride) {
      codice = tappoMontanteOverride.tappo
    }
    if (ruoloKey === 'sella_ovaline' && sellaOverride) {
      codice = cavaAnta.includes('15') ? (sellaOverride.cava_15mm ?? codice) : (sellaOverride.cava_8mm ?? codice)
    }

    if (seen.has(codice)) continue
    seen.add(codice)

    const accessorio = getAccessorioByCodice(codice)
    const quantita = quantitaAccessorio(ruoloKey, num_ante, nOvaline)

    righeAccessori.push({
      codice,
      descrizione: accessorio?.descrizione ?? codice,
      quantita,
      obbligatorio: true,
    })
  }

  // Extra accessori
  for (const codice of cfg.accessori_extra) {
    if (seen.has(codice)) continue
    seen.add(codice)
    const accessorio = getAccessorioByCodice(codice)
    if (accessorio) {
      righeAccessori.push({
        codice,
        descrizione: accessorio.descrizione,
        quantita: num_ante,
        obbligatorio: false,
      })
    }
  }

  const pesoTotale = righeProfileProfili.reduce((sum, r) => sum + r.peso_kg, 0)

  return {
    profili: righeProfileProfili,
    accessori: righeAccessori,
    peso_totale_kg: Math.round(pesoTotale * 100) / 100,
  }
}

// ─── Validazione ──────────────────────────────────────────────────────────────

export function validaConfigurazione(cfg: ConfigurazioneUtente): RisultatoValidazione {
  const warnings: Warning[] = []

  if (!cfg.tipo) {
    warnings.push({ severita: 'error', messaggio: 'Seleziona il tipo di configurazione', campo: 'tipo' })
  }

  const { larghezza_mm: L, altezza_mm: H, num_ante } = cfg.dimensioni

  if (L < 400 || L > 3500) {
    warnings.push({ severita: 'warning', messaggio: `Larghezza ${L}mm fuori range consigliato (400–3500mm)`, campo: 'larghezza' })
  }
  if (H < 500 || H > 3000) {
    warnings.push({ severita: 'warning', messaggio: `Altezza ${H}mm fuori range consigliato (500–3000mm)`, campo: 'altezza' })
  }
  if (num_ante < 1 || num_ante > 4) {
    warnings.push({ severita: 'error', messaggio: 'Numero ante deve essere tra 1 e 4', campo: 'num_ante' })
  }

  if (cfg.tipo === 'con_telaio' && !cfg.profili.telaio) {
    warnings.push({ severita: 'warning', messaggio: 'Telaio non selezionato', campo: 'telaio' })
  }
  if (!cfg.profili.anta) {
    warnings.push({ severita: 'warning', messaggio: 'Anta non selezionata', campo: 'anta' })
  }

  return { valida: warnings.filter(w => w.severita === 'error').length === 0, warnings }
}

// ─── Meccanismo suggestion ─────────────────────────────────────────────────────

export function suggerisciMeccanismo(
  tipo: 'perla_70' | 'venere',
  altezza_mm: number
): SuggerimentoMeccanismo | null {
  const meccanismo = tipo === 'perla_70' ? getMeccanismoPerla70() : getMeccanismoVenere()
  const tabella = meccanismo.tabella_misure

  // Find smallest h_max_mm >= altezza_mm
  const idonei = tabella.filter(v => v.h_max_mm >= altezza_mm)
  const variante = idonei.length > 0
    ? idonei.reduce((min, v) => v.h_max_mm < min.h_max_mm ? v : min)
    : tabella.reduce((max, v) => v.h_max_mm > max.h_max_mm ? v : max)

  return {
    codice: variante.codice,
    h_max_mm: variante.h_max_mm,
    num_lamelle: variante.num_lamelle,
    comando: variante.comando,
    tipo,
  }
}

export function calcolaNumOvalinePreview(ovalinaCodice: string, H: number, numAnte: number): number {
  return calcolaNOvaline(ovalinaCodice, H) * numAnte
}
