import type { ElementoSalvato, ListaMateriali, RigaAccessorio } from '@/lib/types'

const KEY = 'fresi-elementi'
const EVENT = 'fresi-elementi-updated'

export type { ElementoSalvato }

export function leggiElementi(): ElementoSalvato[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function salvaElementi(items: ElementoSalvato[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVENT))
}

export function aggiungiElemento(el: ElementoSalvato) {
  salvaElementi([...leggiElementi(), el])
}

export function aggiornaElemento(el: ElementoSalvato) {
  salvaElementi(leggiElementi().map(e => (e.id === el.id ? el : e)))
}

export function rimuoviElemento(id: string) {
  salvaElementi(leggiElementi().filter(e => e.id !== id))
}

export const ELEMENTI_EVENT = EVENT

export function mergeBoMs(boms: ListaMateriali[]): ListaMateriali {
  const pMap = new Map<string, ListaMateriali['profili'][number]>()
  const aMap = new Map<string, RigaAccessorio>()
  for (const b of boms) {
    for (const p of b.profili) {
      const k = `${p.codice}|${p.taglio_mm}`
      const ex = pMap.get(k)
      pMap.set(k, ex
        ? { ...ex, quantita: ex.quantita + p.quantita, peso_kg: parseFloat((ex.peso_kg + p.peso_kg).toFixed(3)) }
        : { ...p }
      )
    }
    for (const a of b.accessori) {
      const ex = aMap.get(a.codice)
      aMap.set(a.codice, ex ? { ...ex, quantita: ex.quantita + a.quantita } : { ...a })
    }
  }
  const profili = [...pMap.values()]
  return {
    profili,
    accessori: [...aMap.values()],
    peso_totale_kg: parseFloat(profili.reduce((s, p) => s + p.peso_kg, 0).toFixed(3)),
  }
}
