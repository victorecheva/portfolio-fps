import { create } from 'zustand'
import type { SectionId } from '../data/portfolio'

/**
 * Máquina de estados del juego.
 *
 *   menu ──click──> playing ──TAB──> tablet ──TAB/Esc──> playing
 *                     │  ^ ──disparo a diana──> section ──Esc──> playing
 *                     └──Esc──> paused ──click──> playing
 *
 * El puntero solo debe estar capturado en 'playing'. Un único sitio decide
 * eso (`shouldLockPointer`) para que ninguna vista pelee por el foco.
 */
export type GamePhase = 'menu' | 'playing' | 'paused' | 'tablet' | 'section'

/** Pestañas de la tablet. */
export type TabletTab = 'sobre-mi' | 'experiencia' | 'skills' | 'contacto'

export interface Settings
{
  /** Postprocesado y luces extra. Se puede bajar en equipos flojos. */
  highQuality: boolean
  audio: boolean
  invertY: boolean
  sensitivity: number
}

interface GameStore {
  phase: GamePhase
  /** El navegador confirma la captura del puntero por su cuenta. */
  pointerLocked: boolean
  activeSection: SectionId | null
  tabletTab: TabletTab
  /** Sección a la que apunta el jugador ahora mismo (para el HUD). */
  aimedSection: SectionId | null
  /** Secciones ya visitadas, para el contador de progreso del HUD. */
  visited: SectionId[]
  shotsFired: number
  settings: Settings

  start: () => void
  toMenu: () => void
  pause: () => void
  resume: () => void
  toggleTablet: () => void
  setTabletTab: (tab: TabletTab) => void
  openSection: (id: SectionId) => void
  closeSection: () => void
  setAimedSection: (id: SectionId | null) => void
  setPointerLocked: (locked: boolean) => void
  registerShot: () => void
  updateSettings: (patch: Partial<Settings>) => void
}

export const useGame = create<GameStore>((set, get) => ({
  phase: 'menu',
  pointerLocked: false,
  activeSection: null,
  tabletTab: 'sobre-mi',
  aimedSection: null,
  visited: [],
  shotsFired: 0,
  settings: {
    highQuality: true,
    audio: true,
    invertY: false,
    sensitivity: 1,
  },

  start: () => set({ phase: 'playing', activeSection: null }),
  toMenu: () => set({ phase: 'menu', activeSection: null, aimedSection: null }),
  pause: () => set({ phase: 'paused' }),
  resume: () => set({ phase: 'playing' }),

  toggleTablet: () => {
    const { phase } = get()
    if (phase === 'tablet') set({ phase: 'playing' })
    // Desde el menú no: la tablet forma parte del juego, y el menú ya ofrece
    // la versión clásica para quien solo quiere leer el CV.
    else if (phase === 'playing' || phase === 'paused' || phase === 'section') {
      set({ phase: 'tablet', activeSection: null })
    }
  },

  setTabletTab: (tabletTab) => set({ tabletTab }),

  openSection: (id) =>
    set((s) => ({
      phase: 'section',
      activeSection: id,
      visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
    })),

  closeSection: () => set({ phase: 'playing', activeSection: null }),
  setAimedSection: (aimedSection) => {
    // Se llama en cada frame: evitamos re-render si no ha cambiado.
    if (get().aimedSection !== aimedSection) set({ aimedSection })
  },
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  registerShot: () => set((s) => ({ shotsFired: s.shotsFired + 1 })),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
}))

/** El puntero se captura únicamente mientras se juega. */
export const shouldLockPointer = (phase: GamePhase) => phase === 'playing'

/** ¿Debe el jugador responder a teclado y ratón? */
export const isInteractive = (phase: GamePhase) => phase === 'playing'
