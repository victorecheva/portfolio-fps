import type { SectionId } from '../data/portfolio'

/** Dimensiones del laboratorio. Todo lo demás se deriva de aquí. */
export const ROOM = {
  /** Semi-anchura interior en X y Z: la sala va de -HALF a +HALF. */
  half: 14,
  height: 6,
  wallThickness: 0.6,
} as const

export const PLAYER = {
  /** Altura de los ojos sobre el suelo. */
  eyeHeight: 1.7,
  radius: 0.4,
  /** Altura total de la cápsula de colisión. */
  height: 1.8,
  walkSpeed: 5.2,
  sprintSpeed: 8.4,
  /** Aceleración en suelo (m/s²). Alta = respuesta inmediata. */
  accel: 60,
  /** Aceleración en el aire: control reducido pero no nulo. */
  airAccel: 12,
  /**
   * Frenado en suelo cuando no hay input. A 20 m/s² el jugador recorre unos
   * 0,65 m antes de pararse: se nota el peso pero no patina.
   */
  damping: 20,
  /** Con la gravedad de la escena (-22) da unos 1,1 m: justo para subirse
   *  a las cajas de 1 m sin que el salto se sienta flotante. */
  jumpVelocity: 7,
  spawn: [0, 1.2, 9] as [number, number, number],
} as const

export const CAMERA = {
  fov: 76,
  sprintFov: 84,
  near: 0.05,
  far: 200,
} as const

/** Paleta del laboratorio limpio: blancos fríos, grises y cian de acento. */
export const PALETTE = {
  // Suelo gris claro, no oscuro: es lo que hace que la sala lea como
  // "laboratorio limpio" y no como un sótano con neones.
  floor: '#c9d4da',
  floorLine: '#7c95a3',
  wall: '#dfe6ea',
  wallTrim: '#aab8c0',
  ceiling: '#eef2f4',
  accent: '#37d6f0',
  accentDim: '#1d8fa5',
  metal: '#8f9ea8',
  darkMetal: '#3c4a54',
  glass: '#9fe8f5',
  targetIdle: '#f4f8fa',
  targetHot: '#37d6f0',
  targetDone: '#4ade80',
} as const

export interface TargetPlacement {
  id: SectionId
  /** Centro del panel. */
  position: [number, number, number]
  /** Giro en Y para que el panel mire hacia el interior de la sala. */
  rotationY: number
}

const wallInset = ROOM.half - 0.05

/** Una diana por pared, en el orden de lectura del CV. */
export const TARGET_PLACEMENTS: TargetPlacement[] = [
  { id: 'sobre-mi', position: [0, 2.4, -wallInset], rotationY: 0 },
  { id: 'experiencia', position: [wallInset, 2.4, 0], rotationY: -Math.PI / 2 },
  { id: 'proyectos', position: [0, 2.4, wallInset], rotationY: Math.PI },
  { id: 'contacto', position: [-wallInset, 2.4, 0], rotationY: Math.PI / 2 },
]

/** Nº máximo de marcas de impacto simultáneas (búfer circular). */
export const MAX_DECALS = 40
