import { useEffect, useRef, type ComponentRef } from 'react'
import { PointerLockControls } from '@react-three/drei'
import { useGame, shouldLockPointer } from '../store/gameStore'

/**
 * Único responsable de la captura del puntero.
 *
 * Es el punto donde estas webs se rompen: si varias vistas piden y sueltan el
 * puntero, el foco se queda a medias. Aquí solo se compara "lo que la fase
 * pide" con "lo que el navegador tiene", y se corrige la diferencia.
 *
 * Detalle importante: tras salir con Escape, Chrome bloquea nuevas capturas
 * durante ~1 s. Por eso un fallo al capturar no es un error — simplemente se
 * queda a la espera de que el usuario haga clic, y el HUD lo indica.
 */
export function Controls() {
  // El tipo se deriva del propio componente en vez de importarlo de
  // `three-stdlib`, que aquí solo es una dependencia transitiva de drei.
  const controls = useRef<ComponentRef<typeof PointerLockControls>>(null)
  const phase = useGame((s) => s.phase)
  const pointerLocked = useGame((s) => s.pointerLocked)
  const sensitivity = useGame((s) => s.settings.sensitivity)
  const setPointerLocked = useGame((s) => s.setPointerLocked)
  const pause = useGame((s) => s.pause)

  const wants = shouldLockPointer(phase)

  useEffect(() => {
    const ctrl = controls.current
    if (!ctrl) return
    if (wants && !pointerLocked) {
      // Puede fallar por el enfriamiento del navegador: se reintenta al clic.
      try {
        ctrl.lock()
      } catch {
        /* el usuario hará clic */
      }
    } else if (!wants && pointerLocked) {
      ctrl.unlock()
    }
  }, [wants, pointerLocked])

  // Reintento por clic mientras se está jugando sin puntero capturado.
  useEffect(() => {
    if (!wants || pointerLocked) return
    const onClick = () => controls.current?.lock()
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [wants, pointerLocked])

  return (
    <PointerLockControls
      ref={controls}
      // Escape sale de la captura: el navegador lo hace por su cuenta y aquí
      // se traduce a "pausa".
      onUnlock={() => {
        setPointerLocked(false)
        if (useGame.getState().phase === 'playing') pause()
      }}
      onLock={() => setPointerLocked(true)}
      pointerSpeed={sensitivity}
      makeDefault
    />
  )
}
