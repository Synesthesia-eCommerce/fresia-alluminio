import catalogoRaw from '@/data/catalogo-global45.json'
import type { Profilo, Accessorio, MeccanismoOrientabile, Guarnizione } from './types'

const catalogo = catalogoRaw as typeof catalogoRaw

// ─── Profili ──────────────────────────────────────────────────────────────────

export function getTelai(): Profilo[] {
  return catalogo.profili.global45.telai
}

export function getAnte(): Profilo[] {
  return catalogo.profili.global45.ante
}

export function getRiportiCentrali(): Profilo[] {
  return catalogo.profili.global45.riporti_centrali
}

export function getFasceZoccoli(): Profilo[] {
  return catalogo.profili.global45.fasce_zoccoli
}

export function getOvaline(): Profilo[] {
  return catalogo.profili.global45.ovaline
}

export function getProfiliMeccanismi(): Profilo[] {
  return catalogo.profili.global45.profili_meccanismi
}

export function getProfiliScorrimento(): Profilo[] {
  return catalogo.profili.global45.profili_scorrimento
}

export function getSportellini(): Profilo[] {
  return catalogo.profili.global45.sportellini
}

export function getAltriProfili(): Profilo[] {
  return catalogo.profili.global45.altri_profili
}

export function getProfiloByCodice(codice: string): Profilo | undefined {
  const tutte = [
    ...getTelai(),
    ...getAnte(),
    ...getRiportiCentrali(),
    ...getFasceZoccoli(),
    ...getOvaline(),
    ...getProfiliMeccanismi(),
    ...getProfiliScorrimento(),
    ...getSportellini(),
    ...getAltriProfili(),
  ]
  return tutte.find(p => p.codice.trim() === codice.trim())
}

// ─── Accessori ────────────────────────────────────────────────────────────────

function flattenAccessori(): Accessorio[] {
  const ac = catalogo.accessori as Record<string, unknown>
  const result: Accessorio[] = []
  for (const key of Object.keys(ac)) {
    if (key === 'meccanismi_orientabili') continue
    const group = ac[key]
    if (Array.isArray(group)) {
      result.push(...(group as Accessorio[]))
    }
  }
  return result
}

export function getAllAccessori(): Accessorio[] {
  return flattenAccessori()
}

export function getAccessorioByCodice(codice: string): Accessorio | undefined {
  return flattenAccessori().find(a => a.codice.trim() === codice.trim())
}

// ─── Meccanismi ───────────────────────────────────────────────────────────────

export function getMeccanismoPerla70(): MeccanismoOrientabile {
  return catalogo.accessori.meccanismi_orientabili.perla_70 as MeccanismoOrientabile
}

export function getMeccanismoVenere(): MeccanismoOrientabile {
  return catalogo.accessori.meccanismi_orientabili.venere as MeccanismoOrientabile
}

// ─── Guarnizioni ──────────────────────────────────────────────────────────────

export function getGuarnizioni(): Guarnizione[] {
  return catalogo.guarnizioni as Guarnizione[]
}

// ─── Compatibilità raw ────────────────────────────────────────────────────────

export function getCompatibilitaRaw() {
  return catalogo.compatibilita
}

export function getConfigurazioniTipo() {
  return catalogo.configurazioni
}
