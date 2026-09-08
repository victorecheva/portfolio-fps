import { useEffect } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useThree } from '@react-three/fiber'

/**
 * Mapa de entorno del laboratorio.
 *
 * En Three.js un material con `metalness` alta y sin entorno no tiene nada que
 * reflejar, así que sale casi negro — por eso el acero de la sala se veía como
 * un agujero oscuro. `RoomEnvironment` construye una habitación iluminada por
 * código y se convierte en mapa de reflexión con PMREM: metales creíbles sin
 * descargar ni un HDR.
 *
 * Se genera una vez y se libera al desmontar; el generador y la escena
 * temporal se destruyen en el acto porque ya no hacen falta.
 */
export function LabEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)

    scene.environment = target.texture
    // Reflejos discretos: el protagonismo lo llevan las luces de la sala.
    scene.environmentIntensity = 0.55

    pmrem.dispose()
    room.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material.dispose()
      }
    })

    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene])

  return null
}
