import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Rótulos 3D dibujados en un canvas 2D y usados como textura.
 *
 * La alternativa habitual (`<Text>` de drei) descarga un fichero de fuente en
 * tiempo de ejecución; esto usa la fuente del sistema, no pide red y sale nítido.
 */

export interface LabelOptions {
  text: string
  /** Ancho del canvas en píxeles. La altura se calcula con `ratio`. */
  width?: number
  ratio?: number
  color?: string
  background?: string
  fontSize?: number
  fontWeight?: number | string
  letterSpacing?: number
  align?: CanvasTextAlign
  fontFamily?: string
}

const FALLBACK_FONT = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export function createLabelTexture({
  text,
  width = 1024,
  ratio = 0.25,
  color = '#0e1a24',
  background = 'transparent',
  fontSize = 150,
  fontWeight = 800,
  letterSpacing = 8,
  align = 'center',
  fontFamily = FALLBACK_FONT,
}: LabelOptions): THREE.CanvasTexture {
  const height = Math.round(width * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')!

  if (background !== 'transparent') {
    g.fillStyle = background
    g.fillRect(0, 0, width, height)
  }

  g.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  g.fillStyle = color
  g.textAlign = align
  g.textBaseline = 'middle'
  // `letterSpacing` en canvas es reciente; si no está, se dibuja sin tracking.
  if ('letterSpacing' in g) {
    ;(g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`
  }

  const x = align === 'center' ? width / 2 : align === 'right' ? width - 24 : 24
  g.fillText(text, x, height / 2, width - 48)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/** Versión memoizada para usar dentro de componentes. */
export function useLabelTexture(options: LabelOptions): THREE.CanvasTexture {
  const { text, color, background, fontSize, fontWeight, letterSpacing, align, width, ratio } = options
  return useMemo(
    () => createLabelTexture(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, color, background, fontSize, fontWeight, letterSpacing, align, width, ratio],
  )
}

/**
 * Textura de rejilla para el suelo del laboratorio. Se genera una vez y se
 * repite por UV, así que no hay ficheros de imagen.
 */
export function createGridTexture(
  size = 512,
  line = '#22333f',
  fill = '#0d141a',
  lineWidth = 3,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  g.fillStyle = fill
  g.fillRect(0, 0, size, size)
  g.strokeStyle = line
  g.lineWidth = lineWidth
  g.strokeRect(0, 0, size, size)
  // Subdivisión interior más tenue.
  g.globalAlpha = 0.45
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(size / 2, 0)
  g.lineTo(size / 2, size)
  g.moveTo(0, size / 2)
  g.lineTo(size, size / 2)
  g.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
