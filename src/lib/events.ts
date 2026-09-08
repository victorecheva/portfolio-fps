import * as THREE from 'three'
import type { SectionId } from '../data/portfolio'

/**
 * Bus de eventos mínimo para lo que ocurre dentro del canvas.
 *
 * El disparo lo resuelve un solo sitio (el arma) y varios componentes
 * reaccionan al resultado: las marcas de impacto, la diana golpeada, el HUD.
 * Pasar esto por el estado de React provocaría un re-render por bala.
 */

export interface HitEvent {
  point: THREE.Vector3
  normal: THREE.Vector3
  /** Sección alcanzada, si el disparo dio en una diana. */
  sectionId: SectionId | null
}

type Events = {
  hit: HitEvent
  /** Diana alcanzada: la usa el propio panel para su animación. */
  targetHit: { sectionId: SectionId }
}

type Handler<K extends keyof Events> = (payload: Events[K]) => void

const listeners: { [K in keyof Events]: Set<Handler<K>> } = {
  hit: new Set(),
  targetHit: new Set(),
}

export function on<K extends keyof Events>(event: K, handler: Handler<K>): () => void {
  listeners[event].add(handler)
  return () => {
    listeners[event].delete(handler)
  }
}

export function emit<K extends keyof Events>(event: K, payload: Events[K]): void {
  for (const handler of listeners[event]) handler(payload)
}
