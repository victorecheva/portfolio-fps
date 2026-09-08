import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame } from '../store/gameStore'

/**
 * Puente de inspección para las pruebas automatizadas.
 *
 * Solo se monta en desarrollo (`import.meta.env.DEV`), así que en el build de
 * producción este módulo se elimina por completo y no expone nada.
 *
 * Existe porque un FPS no se puede comprobar desde fuera: hace falta poder
 * preguntar dónde está la cámara, hacia dónde mira y a qué frecuencia va.
 */

declare global {
  interface Window {
    __labState?: () => { phase: string; activeSection: string | null; aimedSection: string | null }
    __labCameraY?: () => number
    __labCameraPos?: () => [number, number, number]
    __labLookAt?: (x: number, y: number, z: number) => void
    __labFps?: () => number
    /** Lo registra `Weapon`, que es quien resuelve el raycast. */
    __labShoot?: () => void
  }
}

export function DebugBridge() {
  const camera = useThree((s) => s.camera)
  const samples = useRef<number[]>([])

  useEffect(() => {
    if (!import.meta.env.DEV) return

    window.__labState = () => {
      const s = useGame.getState()
      return { phase: s.phase, activeSection: s.activeSection, aimedSection: s.aimedSection }
    }
    window.__labCameraY = () => camera.position.y
    window.__labCameraPos = () => [camera.position.x, camera.position.y, camera.position.z]
    window.__labLookAt = (x, y, z) => camera.lookAt(new THREE.Vector3(x, y, z))
    window.__labFps = () => {
      const list = samples.current
      if (!list.length) return 0
      return Math.round(list.reduce((a, b) => a + b, 0) / list.length)
    }

    return () => {
      delete window.__labState
      delete window.__labCameraY
      delete window.__labCameraPos
      delete window.__labLookAt
      delete window.__labFps
    }
  }, [camera])

  useFrame((_, delta) => {
    if (!import.meta.env.DEV || delta <= 0) return
    const list = samples.current
    list.push(1 / delta)
    if (list.length > 120) list.shift()
  })

  return null
}
