import { useEffect, useRef } from 'react'

/**
 * Estado del teclado leído por referencia mutable.
 *
 * El bucle de render lo consulta 60 veces por segundo; guardarlo en estado de
 * React causaría un re-render por pulsación. Aquí solo se escribe el objeto.
 */
export interface MoveInput {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  sprint: boolean
  jump: boolean
}

const EMPTY: MoveInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
}

/** Soporta WASD y flechas; en AZERTY el `code` físico ya da ZQSD. */
function resolve(code: string): keyof MoveInput | null {
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      return 'forward'
    case 'KeyS':
    case 'ArrowDown':
      return 'back'
    case 'KeyA':
    case 'ArrowLeft':
      return 'left'
    case 'KeyD':
    case 'ArrowRight':
      return 'right'
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'sprint'
    case 'Space':
      return 'jump'
    default:
      return null
  }
}

export function useKeyboard() {
  const input = useRef<MoveInput>({ ...EMPTY })

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault() // que no haga scroll la página
      const action = resolve(e.code)
      if (action) input.current[action] = true
    }
    const onUp = (e: KeyboardEvent) => {
      const action = resolve(e.code)
      if (action) input.current[action] = false
    }
    // Al perder el foco de la pestaña las teclas se quedarían "pegadas".
    const onBlur = () => {
      input.current = { ...EMPTY }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return input
}

/** Resetea el input: se usa al pausar o al abrir la tablet. */
export function clearInput(input: { current: MoveInput }) {
  input.current = { ...EMPTY }
}
