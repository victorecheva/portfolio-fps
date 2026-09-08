import { useEffect } from 'react'
import { useGame } from '../store/gameStore'

/**
 * Atajos globales de la interfaz: TAB y Escape.
 *
 * Sobre Escape: el navegador lo usa para liberar la captura del puntero, y esa
 * liberación llega a `Controls` como `onUnlock`, que la traduce en pausa. Pero
 * el evento de teclado también llega hasta aquí, así que se pausa directamente
 * y no se depende de una sola de las dos rutas. Pausar dos veces no tiene
 * efecto, y así el juego nunca se queda sin salida.
 */
export function useGlobalKeys(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      const { phase, toggleTablet, closeSection, resume, pause } = useGame.getState()
      if (phase === 'menu') return

      if (e.code === 'Tab') {
        // Sin esto, TAB movería el foco a los botones del HUD.
        e.preventDefault()
        toggleTablet()
        return
      }

      if (e.code === 'Escape') {
        if (phase === 'tablet') {
          e.preventDefault()
          toggleTablet()
        } else if (phase === 'section') {
          e.preventDefault()
          closeSection()
        } else if (phase === 'playing') {
          // Se pausa aquí siempre, con puntero capturado o sin él.
          //
          // Con captura, el navegador la libera por su cuenta y `onUnlock`
          // también pausaría — pero la pausa es idempotente, así que no
          // estorba. Sin captura (el navegador la rechazó, o estamos en un
          // entorno automatizado) esta es la única vía, y sin ella el jugador
          // se quedaría sin forma de salir.
          pause()
        }
        return
      }

      // Reanudar desde la pausa sin tener que apuntar al botón.
      if (e.code === 'Enter' && phase === 'paused') resume()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
