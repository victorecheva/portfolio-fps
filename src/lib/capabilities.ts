/**
 * ¿Puede este dispositivo con el modo juego?
 *
 * El modo FPS depende de Pointer Lock, que no existe en táctil, y de WebGL2.
 * Cuando algo de eso falta, la web arranca directamente en la versión clásica
 * del CV — mismo contenido, sin canvas.
 */

export interface Capabilities {
  webgl2: boolean
  pointerLock: boolean
  touchOnly: boolean
  reducedMotion: boolean
  /** true si tiene sentido ofrecer el modo juego. */
  canPlay: boolean
  /** Motivo por el que no se puede jugar, para mostrarlo al usuario. */
  reason: string | null
}

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

export function detectCapabilities(): Capabilities {
  if (typeof window === 'undefined') {
    return {
      webgl2: false,
      pointerLock: false,
      touchOnly: false,
      reducedMotion: false,
      canPlay: false,
      reason: 'Sin navegador',
    }
  }

  const webgl2 = hasWebGL2()
  const pointerLock = 'pointerLockElement' in document
  // Puntero grueso y sin hover = táctil. Un portátil con pantalla táctil
  // sigue teniendo ratón, así que no se le bloquea el juego.
  const touchOnly =
    window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-hover: hover)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let reason: string | null = null
  if (!webgl2) reason = 'Tu navegador no soporta WebGL2, necesario para el 3D.'
  else if (!pointerLock) reason = 'Tu navegador no soporta la captura del puntero.'
  else if (touchOnly) reason = 'El modo juego necesita teclado y ratón.'
  else if (reducedMotion) reason = 'Tienes activada la reducción de movimiento del sistema.'

  return {
    webgl2,
    pointerLock,
    touchOnly,
    reducedMotion,
    canPlay: webgl2 && pointerLock && !touchOnly && !reducedMotion,
    reason,
  }
}
