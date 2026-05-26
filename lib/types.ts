// ─── Profili ──────────────────────────────────────────────────────────────────

export interface Profilo {
  codice: string
  descrizione: string
  peso_gr_m?: number
  lunghezza_barra_mm?: number
  cava?: string
  note?: string
  dimensione?: string
  passo_mm?: number
  formula_num_ovaline?: string
}

export interface ProfiloGlobal45 {
  telai: Profilo[]
  ante: Profilo[]
  riporti_centrali: Profilo[]
  fasce_zoccoli: Profilo[]
  ovaline: Profilo[]
  profili_meccanismi: Profilo[]
  profili_scorrimento: Profilo[]
  sportellini: Profilo[]
  altri_profili: Profilo[]
}

// ─── Accessori ────────────────────────────────────────────────────────────────

export interface Accessorio {
  codice: string
  descrizione: string
  udv?: string
  conf?: string
  compatibile_con?: string[]
  cava?: string
  richiede?: string
  note?: string
  colori?: string[]
  lunghezza_mm?: number
}

export interface MeccanismoVariante {
  codice: string
  h_max_mm: number
  num_lamelle: number
  comando: 'singolo' | 'doppio'
}

export interface MeccanismoOrientabile {
  descrizione: string
  kit_compensatori: string
  posizionatore: string
  compensatore?: string
  aletta?: string
  note: string
  tabella_misure: MeccanismoVariante[]
}

export interface Guarnizione {
  codice: string
  descrizione: string
  udv?: string
  rotolo_mt?: number
  compatibile_con?: string[]
}

// ─── Configurazione e Selezione Utente ────────────────────────────────────────

export type TipoConfigurazione =
  | 'con_telaio'
  | 'senza_telaio'
  | 'senza_telaio_con_sportellino'
  | 'scorrevole'
  | 'scurone'

export type TipoMeccanismo = 'nessuno' | 'perla_70' | 'venere'

export interface SelezioneProfili {
  telaio: Profilo | null
  anta: Profilo | null
  ovalina: Profilo | null
  fascia: Profilo | null
  riporto_centrale: Profilo | null
}

export interface Dimensioni {
  larghezza_mm: number
  altezza_mm: number
  num_ante: number
  meccanismo: TipoMeccanismo
}

export interface ConfigurazioneUtente {
  tipo: TipoConfigurazione | null
  profili: SelezioneProfili
  dimensioni: Dimensioni
  accessori_extra: string[]
}

// ─── Engine Output ─────────────────────────────────────────────────────────────

export interface RigaProfilo {
  codice: string
  descrizione: string
  quantita: number
  taglio_mm: number
  peso_kg: number
  note?: string
}

export interface RigaAccessorio {
  codice: string
  descrizione: string
  quantita: number
  obbligatorio: boolean
  note?: string
}

export interface ListaMateriali {
  profili: RigaProfilo[]
  accessori: RigaAccessorio[]
  peso_totale_kg: number
}

export type SeveritaWarning = 'error' | 'warning' | 'info'

export interface Warning {
  severita: SeveritaWarning
  messaggio: string
  campo?: string
}

export interface RisultatoValidazione {
  valida: boolean
  warnings: Warning[]
}

export interface SuggerimentoMeccanismo {
  codice: string
  h_max_mm: number
  num_lamelle: number
  comando: 'singolo' | 'doppio'
  tipo: 'perla_70' | 'venere'
}

// ─── App State (configuratore) ────────────────────────────────────────────────

export interface AppState {
  tipologia: TipoConfigurazione
  profili: { telaio: string | null; anta: string | null; ovalina: string | null; fascia: string | null }
  dimensioni: { larghezza: number; altezza: number; ante: number }
  meccanismo: TipoMeccanismo
  accessori: string[]
}

export interface ElementoSalvato {
  id: string
  nome: string
  stato: AppState
  bom: ListaMateriali
}
