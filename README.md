# Portfolio FPS 3D — Víctor Echevarría

Un portfolio que se juega. El visitante recorre un laboratorio en primera
persona, **dispara** a los paneles de las paredes para abrir cada sección y
pulsa **TAB** para sacar una tablet con el currículum completo.

Quien no quiera jugar tiene el CV entero a un clic en versión clásica.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
```

## Comandos

| Comando          | Qué hace                                                  |
| ---------------- | --------------------------------------------------------- |
| `npm run dev`    | Servidor de desarrollo con recarga en caliente             |
| `npm run build`  | Comprueba tipos (`tsc -b`) y compila a `dist/`             |
| `npm run lint`   | Solo la comprobación de tipos                              |
| `npm run smoke`  | Prueba de humo de punta a punta en Chrome headless         |
| `npm run preview`| Sirve el build de producción                               |

La prueba de humo necesita el servidor de desarrollo levantado en el puerto
5199 y Chrome instalado:

```bash
npx vite --port 5199 --strictPort   # en una terminal
npm run smoke                       # en otra
```

Se puede apuntar a otra URL o a otro navegador con `SMOKE_URL` y `CHROME_PATH`,
y elegir dónde deja las capturas con `SMOKE_OUT`.

## Controles

| Tecla        | Acción                        |
| ------------ | ----------------------------- |
| `W` `A` `S` `D` | Moverse                    |
| `Shift`      | Correr                        |
| `Espacio`    | Saltar                        |
| Clic izq.    | Disparar                      |
| `TAB`        | Sacar / guardar la tablet     |
| `Esc`        | Pausa                         |

## Cómo está montado

**React + Vite + TypeScript + React Three Fiber.** La escena 3D es declarativa
y la interfaz (tablet, paneles, HUD) es HTML y Tailwind de verdad, con scroll,
enlaces y texto seleccionable. Esa fue la razón de elegir React Three Fiber
frente a Three.js pelado: el currículum es un documento, y renderizarlo dentro
de WebGL habría sido más trabajo para un resultado peor.

- **Física y movimiento**: `@react-three/rapier`. El jugador es una cápsula
  dinámica cuya velocidad se acelera hacia la deseada en vez de asignarse de
  golpe, con control reducido en el aire, balanceo de paso y FOV dinámico al
  esprintar.
- **Disparo**: raycast desde el centro de la pantalla. Si la malla alcanzada
  lleva un `sectionId` en su `userData`, es una diana y abre su sección.
- **Sin assets externos**: no hay ni un modelo, ni una textura, ni un fichero de
  audio. La sala y el blaster se construyen con primitivas, los rótulos se
  dibujan en un canvas 2D, el mapa de entorno lo genera `RoomEnvironment`, y los
  sonidos se sintetizan con la Web Audio API. El proyecto carga al instante y no
  arrastra licencias de terceros.

### Estructura

```
src/
├── data/portfolio.ts     ← TODO el contenido del CV. Única fuente de verdad.
├── store/gameStore.ts    ← Máquina de estados del juego (zustand)
├── game/                 ← Lo que vive dentro del <Canvas>
│   ├── Scene.tsx           Composición e iluminación
│   ├── Player.tsx          Controlador en primera persona
│   ├── Controls.tsx        Captura del puntero (un solo responsable)
│   ├── Level.tsx           El laboratorio y sus colisiones
│   ├── SectionTarget.tsx   Panel-diana reutilizable
│   ├── Weapon.tsx          Viewmodel del arma y la tablet, y el disparo
│   ├── Impacts.tsx         Marcas de impacto y trazadoras
│   └── LabEnvironment.tsx  Mapa de entorno procedural
├── ui/                   ← Todo lo que es HTML, fuera del canvas
│   ├── TabletOverlay.tsx   El CV con TAB
│   ├── SectionModal.tsx    Panel al acertar una diana
│   ├── ClassicView.tsx     Versión clásica del portfolio
│   ├── HUD.tsx, MainMenu.tsx, PauseMenu.tsx
│   └── content.tsx         Bloques de CV compartidos por las tres vistas
└── lib/                  ← Audio, capacidades del dispositivo, rótulos
```

## Actualizar el contenido

Todo el CV está en [`src/data/portfolio.ts`](src/data/portfolio.ts). Ese fichero
alimenta el juego, la tablet y la versión clásica a la vez, así que no hay forma
de que se desincronicen. Añadir una sección nueva es añadir una entrada en
`sections` y una colocación en `TARGET_PLACEMENTS`; el 3D no se toca.

Falta por rellenar: el email público en `contactLinks`, si decides publicarlo
(se ha dejado fuera a propósito, porque publicar un correo es una decisión
personal). LinkedIn y GitHub ya están.

## Versión clásica

No es un plan B técnico, es la vista principal para buena parte de la audiencia
real. La web arranca directamente en ella cuando el dispositivo no puede con el
modo juego —táctil, sin WebGL2, o con la reducción de movimiento del sistema
activada— y siempre está accesible desde el menú. El motor 3D se carga con
`lazy()`, así que quien lee el CV desde el móvil no descarga Three.js: el chunk
inicial son unos 67 KB comprimidos frente a 1,1 MB del juego.

## Despliegue

`.github/workflows/deploy.yml` publica en GitHub Pages con cada empuje a `main`.
El build usa rutas relativas, así que funciona igual en la raíz de un dominio
que en un subdirectorio de Pages.
