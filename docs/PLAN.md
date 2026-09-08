# Plan: Portfolio 3D estilo FPS — Víctor Echevarría

> Portfolio interactivo en primera persona: el visitante "juega" dentro de un
> entorno 3D, navega por las secciones disparando a dianas/paneles, y consulta
> el currículum sacando una tablet con la tecla `TAB`.

- **Contenido fuente:** https://victorecheva.github.io/portfolio/ (Angular + Tailwind)
- **Fecha del plan:** 2026-09-08
- **Estado:** ✅ **Ejecutado.** Fases 0–5 implementadas y verificadas. Ver
  [§10 Estado de ejecución](#10-estado-de-ejecución) para lo que cambió respecto
  a este plan y por qué.

**Decisiones tomadas por Víctor:** contenido en **español**, estética
**laboratorio limpio**, las secciones abren **modal** (variante A).

---

## 1. Decisión de stack: ¿React o sin React?

### Opciones evaluadas

| Opción | Pros | Contras |
|---|---|---|
| **React + React Three Fiber (R3F)** | Ecosistema enorme (`drei`, `rapier`, `postprocessing`), escena declarativa, la UI 2D (tablet/CV, HUD, menús) se hace en React/HTML normal, muchísimos ejemplos de FPS | Capa de abstracción sobre Three.js; hay que entender ambos |
| Three.js "vanilla" + Vite | Control total del game loop, cero overhead | Todo a mano: UI, estado, física, integración HTML↔3D más artesanal |
| Babylon.js | Motor de juego completo (física, GUI, pointer lock integrados) | Comunidad menor, la GUI propia es peor que hacer la tablet en HTML/CSS |
| Angular + Three.js | Es tu stack actual | Angular no aporta nada dentro del canvas; integración 3D mucho menos madura que R3F |

### ✅ Recomendación: **React + Vite + TypeScript + React Three Fiber**

Motivos concretos para este proyecto:

1. **La tablet del CV es el argumento decisivo.** Con R3F la tablet se hace como
   overlay HTML/CSS (o con `<Html>` de drei dentro de la escena), con todo el
   poder de React para maquetar el currículum. En un motor puro habría que
   renderizar UI dentro de WebGL, que es mucho peor.
2. El ecosistema R3F ya resuelve lo difícil del FPS:
   - `@react-three/rapier` → física y *character controller* (colisiones, gravedad, saltos).
   - `@react-three/drei` → `PointerLockControls`, carga de modelos GLTF, `Html`, helpers.
   - `@react-three/postprocessing` → bloom, viñeta, efectos de impacto.
3. Vienes de Angular: React con componentes funcionales se aprende rápido y es
   además un plus para tu CV (demuestras ambos frameworks).

### Stack final

```
Vite + React 18 + TypeScript
@react-three/fiber        → renderer Three.js declarativo
@react-three/drei         → PointerLockControls, useGLTF, Html, Text
@react-three/rapier       → física (character controller, raycasts de colisión)
@react-three/postprocessing → efectos visuales
zustand                   → estado global del juego (sección activa, tablet abierta, ammo…)
tailwindcss               → UI 2D (HUD, tablet, menús) — ya lo conoces
howler (o Audio API)      → sonidos (disparo, pasos, UI)
```

---

## 2. Concepto del juego

### Escenario

**"La galería de tiro / museo personal"**: una sala 3D estilizada (low-poly o
neón/synthwave para que luzca sin assets caros). En las paredes hay **4 dianas
o paneles grandes**, uno por sección:

| Diana | Sección | Qué pasa al dispararla |
|---|---|---|
| 🎯 SOBRE MÍ | Bio | Se abre panel/zona con la bio y foto |
| 🎯 EXPERIENCIA | Trabajo | Timeline: Circontrol (DevOps & Web Dev, 2024–2025), Noria‑TICKobex (IT Support, 2023–2024) |
| 🎯 PROYECTOS | Proyectos | Vitrinas/pantallas con cada proyecto + link a GitHub/demo |
| 🎯 CONTACTO | Contacto | Email, GitHub, LinkedIn (botones clicables) |

Dos variantes de "qué pasa al disparar" (decidir en fase de diseño):

- **Variante A (más sencilla):** el disparo abre un modal/overlay HTML con el
  contenido de la sección. Rápido de implementar, contenido 100% legible.
- **Variante B (más espectacular):** el disparo abre una puerta / teletransporta
  a una sala dedicada a esa sección, con el contenido en pantallas 3D.
- **Recomendado:** empezar con A y evolucionar a B si hay tiempo. El plan de
  fases asume A con puertas a B.

### Mecánicas core

1. **Movimiento FPS** — WASD + ratón (Pointer Lock), sprint con `Shift`,
   salto con `Space`. Character controller con cápsula (Rapier) para colisionar
   con suelo/paredes. Head-bob sutil y FOV dinámico al correr.
2. **Disparo** — clic izquierdo: raycast desde cámara, decal/chispa en el punto
   de impacto, retroceso del arma, sonido y flash. Si el rayo golpea una diana
   de sección → se activa la sección (animación de la diana + apertura del
   contenido). El arma es un *viewmodel* GLTF anclado a la cámara.
3. **Tablet (`TAB`)** — animación de "sacar tablet" (el arma baja, sube una
   tablet ante la cámara) y sobre ella un overlay HTML con el **CV completo**:
   pestañas Sobre mí / Experiencia / Skills / Descargar PDF. Al abrir la tablet
   se libera el pointer lock para poder hacer clic y scroll; `TAB` o `Esc` la
   guarda y devuelve el control FPS.
4. **Crosshair + HUD** — punto de mira central, hints de teclas ("TAB — CV",
   "Click — Disparar"), nombre de la sección al apuntar a una diana.

### Pantallas / estados del juego (máquina de estados en zustand)

```
menu  →  playing  ⇄  tabletOpen
              ⇅
        sectionOpen (modal de sección)
```

- **`menu`**: pantalla de inicio con tu nombre, "Click para jugar" (necesario
  además porque el navegador exige gesto de usuario para pointer lock y audio),
  y un botón **"Versión clásica"** (fallback, ver §6).
- **`playing`**: pointer lock activo, controles FPS.
- **`tabletOpen` / `sectionOpen`**: pointer lock liberado, UI HTML interactiva.

---

## 3. Contenido (extraído de tu portfolio actual)

Centralizar TODO el contenido en `src/data/portfolio.ts` (un solo fichero
tipado), para que actualizar el CV nunca requiera tocar código 3D:

- **Nombre:** Víctor Echevarría García
- **Título:** Junior Full-Stack Developer
- **Bio:** desarrollador Full-Stack junior apasionado por la programación;
  transformar ideas en soluciones funcionales y creativas; mentalidad de
  resolución de problemas.
- **Experiencia:**
  - **nbGroup** — Desarrollador Full-Stack (feb 2026 – actualidad). Mantenimiento
    y configuración de PrestaShop, aplicaciones web personalizadas para clientes
    y desarrollo en AL para Dynamics 365 Business Central. *(Dato aportado por
    Víctor, no estaba en el portfolio antiguo.)*
  - **Circontrol** — DevOps & Web Developer (abr 2024 – abr 2025). Automatización
    de despliegues con Docker y CI/CD; desarrollo web con Angular y Django.
  - **Noria – TICKobex** — Técnico de soporte IT (abr 2023 – dic 2024). Montaje y
    configuración de equipos, mantenimiento, resolución de incidencias,
    atención al cliente presencial y remota.
- **Skills:** Angular, Tailwind, Node.js, Django, Docker, CI/CD, TypeScript…
- **Proyectos:** ⚠️ *rellenar con la lista real (mínimo: este mismo portfolio 3D
  y el portfolio Angular)* — nombre, descripción, tecnologías, links.
- **Contacto:** email, GitHub (`victorecheva`), LinkedIn.
- **Fotos:** `victor.jpg` / `victor2.jpeg` del repo actual.

---

## 4. Arquitectura del proyecto

```
portfolio-3D/
├── docs/                      ← este plan
├── public/
│   ├── models/                ← .glb (arma, tablet, escenario, dianas)
│   ├── sounds/                ← disparo, pasos, UI, ambiente
│   └── textures/
├── src/
│   ├── data/
│   │   └── portfolio.ts       ← TODO el contenido del CV, tipado
│   ├── store/
│   │   └── gameStore.ts       ← zustand: gameState, sección activa, settings
│   ├── game/                  ← todo lo que vive dentro del <Canvas>
│   │   ├── Scene.tsx           ← composición de la escena
│   │   ├── Player.tsx          ← character controller + cámara
│   │   ├── Weapon.tsx          ← viewmodel, animaciones de disparo/guardar
│   │   ├── TabletModel.tsx     ← animación de sacar tablet
│   │   ├── Level.tsx           ← geometría de la sala + colliders
│   │   ├── SectionTarget.tsx   ← diana disparable (reutilizable, recibe sección)
│   │   ├── Effects.tsx         ← postprocesado, muzzle flash, decals
│   │   └── hooks/              ← useShooting (raycast), useFootsteps, useKeyboard
│   ├── ui/                    ← todo lo HTML (fuera del canvas)
│   │   ├── MainMenu.tsx
│   │   ├── HUD.tsx             ← crosshair, hints
│   │   ├── TabletOverlay.tsx   ← el CV interactivo (pestañas)
│   │   ├── SectionModal.tsx    ← contenido al disparar una diana
│   │   └── ClassicFallback.tsx ← versión accesible/móvil (§6)
│   ├── App.tsx
│   └── main.tsx
└── .github/workflows/deploy.yml  ← GitHub Pages (como tu portfolio actual)
```

**Principio clave:** separación estricta *juego (canvas)* / *contenido (data)* /
*UI (HTML)*. Las dianas 3D no saben qué es "Experiencia": reciben un `sectionId`
y disparan una acción del store; la UI reacciona al store.

---

## 5. Assets

Presupuesto cero — fuentes gratuitas con licencia permisiva:

- **Kenney.nl** (CC0): blaster/pistola sci-fi, props, dianas, texturas.
- **Quaternius** (CC0): packs low-poly de armas y escenarios.
- **Sketchfab** (filtrar CC-BY, dar atribución en el footer/créditos).
- **Sonidos:** Kenney (CC0) y freesound.org.
- **Estética recomendada:** low-poly con iluminación cuidada + bloom
  (estilo synthwave/neón o "clean lab"). Perdona la falta de assets AAA y
  rinde bien en portátiles.
- Optimizar todos los `.glb` con `gltf-transform` (draco/meshopt) antes de commitear.

---

## 6. Fallback, accesibilidad y móvil

Un portfolio lo mira gente con prisa, desde el móvil, o reclutadores no gamers.
**Imprescindible:**

1. **Versión clásica**: botón visible en el menú ("¿Sin ganas de jugar? Ver CV
   normal") que muestra el contenido de `portfolio.ts` como página estática
   (Tailwind). Mismo contenido, cero duplicación.
2. **Móvil / sin WebGL2 / `prefers-reduced-motion`**: detectar y redirigir
   automáticamente a la versión clásica (el pointer lock no existe en táctil;
   no merece la pena hacer controles táctiles FPS en v1).
3. **SEO**: el contenido de la versión clásica en el DOM + meta tags OG, para
   que el link se vea bien al compartirlo en LinkedIn.

---

## 7. Fases de implementación

### Fase 0 — Setup (½ día)
- [ ] `npm create vite@latest` (react-ts), instalar R3F/drei/rapier/zustand/tailwind
- [ ] ESLint + Prettier, estructura de carpetas, deploy básico a GitHub Pages
- [ ] Canvas con un cubo girando desplegado en Pages → *pipeline validado desde el día 1*

### Fase 1 — Movimiento FPS (1–2 días) 🎯 *lo más importante: "buen movimiento"*
- [ ] Suelo + paredes con colliders (Rapier)
- [ ] Character controller de cápsula: WASD, sprint, salto, gravedad
- [ ] PointerLockControls + menú "click para jugar" con `Esc` → pausa
- [ ] Pulido del *game feel*: aceleración/fricción, head-bob sutil, FOV al correr, sonido de pasos
- [ ] Probar en portátil sin GPU dedicada (objetivo: 60 fps estables)

### Fase 2 — Disparo (1–2 días)
- [ ] Viewmodel del arma anclado a cámara (GLTF de Kenney/Quaternius)
- [ ] Raycast al hacer clic + retroceso + muzzle flash + sonido + decal de impacto
- [ ] Componente `SectionTarget` que detecta impactos y emite `sectionId`

### Fase 3 — Contenido y secciones (2 días)
- [ ] `portfolio.ts` con todo el contenido de §3 (completar proyectos reales)
- [ ] Level design de la sala: 4 dianas con rótulos 3D (`Text` de drei)
- [ ] `SectionModal` (HTML/Tailwind): al disparar diana → animación de diana + modal con la sección; `Esc`/botón cierra y devuelve pointer lock
- [ ] Hint al apuntar: nombre de la sección junto al crosshair

### Fase 4 — Tablet / CV con `TAB` (1–2 días)
- [ ] Animación: arma baja ↘, tablet sube ↗ ante la cámara (lerp de posición/rotación)
- [ ] `TabletOverlay` HTML: pestañas Sobre mí / Experiencia / Skills / Contacto + botón "Descargar CV (PDF)"
- [ ] Gestión de pointer lock al abrir/cerrar; `TAB` y `Esc` cierran
- [ ] (Opcional, efecto wow) renderizar el overlay con `<Html transform>` de drei *sobre* la pantalla del modelo 3D de la tablet

### Fase 5 — Fallback y pulido (1–2 días)
- [ ] `ClassicFallback` + detección de móvil/WebGL/reduced-motion
- [ ] Pantalla de carga con progreso (`useProgress` de drei), precarga de modelos
- [ ] Postprocesado (bloom, viñeta) con toggle de "calidad" en el menú
- [ ] Ambiente: música/sonido de fondo con botón de mute
- [ ] Meta tags, favicon, créditos de assets

### Fase 6 — Extras (si hay tiempo)
- [ ] Variante B: salas por sección con puertas que se abren al disparar
- [ ] Minijuego de puntería con contador (easter egg)
- [ ] Munición/recarga cosmética con `R`
- [ ] Modo "linterna" o ciclo día/noche
- [ ] Analytics simples (¿cuánta gente usa la versión juego vs. clásica?)

**Estimación total v1 (fases 0–5): ~7–10 días de trabajo efectivo.**

---

## 8. Riesgos y decisiones abiertas

| Riesgo | Mitigación |
|---|---|
| Rendimiento en portátiles flojos | Low-poly, luces horneadas o pocas luces dinámicas, toggle de postprocesado, medir con `r3f-perf` desde la fase 1 |
| El movimiento se siente "flotante" | Dedicar tiempo real a la fase 1 antes de seguir; copiar constantes de ejemplos FPS de R3F (hay varios oficiales con Rapier) |
| Pointer lock + modales = bugs de foco | Centralizar el estado en zustand; un solo sitio decide quién tiene el lock |
| Reclutador no entiende el juego | Hints en pantalla siempre visibles + versión clásica a un clic |
| Assets con licencias dudosas | Solo CC0/CC-BY, mantener `CREDITS.md` |

**Decisiones que hay que tomar antes/durante la fase 3:**
1. Estética: ¿synthwave/neón o "laboratorio limpio"? (afecta a qué assets buscar)
2. Variante A (modales) vs. B (salas) para las secciones — el plan asume A.
3. Lista real de proyectos a mostrar.
4. ¿Idioma ES, EN o toggle? (el portfolio actual está en ES; para reclutamiento
   internacional conviene al menos EN en la tablet).

---

## 9. Referencias útiles

- Ejemplos oficiales R3F + Rapier de FPS: repositorio `pmndrs/racing-game` y
  demos de `@react-three/rapier` (character controller)
- Documentación: docs.pmnd.rs (fiber, drei), rapier.rs
- Assets: kenney.nl, quaternius.com, sketchfab.com (filtro CC)
- Inspiración de portfolios 3D: bruno-simon.com (el clásico), henryheffernan.com


## 10. Estado de ejecución

Fases 0–5 completas. El stack final es el previsto: React 19 + Vite +
TypeScript + React Three Fiber 9 + Rapier 2 + zustand + Tailwind 4.

### Lo que cambió respecto al plan, y por qué

**1. Cero assets externos (§5 queda sin usar).** El plan contaba con descargar
modelos de Kenney y Quaternius. Al implementarlo resultó innecesario: para una
estética de laboratorio limpio, las formas que hacen falta son exactamente
cajas, cilindros y toros. Así que la sala, el blaster y la tablet se construyen
con primitivas; los rótulos 3D se dibujan en un canvas 2D en vez de cargar una
fuente por red; el mapa de entorno lo genera `RoomEnvironment` de Three.js; y
los sonidos se sintetizan con osciladores de la Web Audio API. Resultado: el
juego carga al instante, no hay licencias de terceros que atribuir y no existe
la clase de bug "el modelo no llegó".

**2. El motor 3D se carga aparte.** No estaba en el plan. Three.js y el
WebAssembly de Rapier son 1,1 MB comprimidos; el CV son 67 KB. Cargar el juego
con `lazy()` significa que quien abre el portfolio en el móvil para leer el
currículum no descarga nada del motor.

**3. Prueba de humo automatizada.** Tampoco estaba en el plan, y ha sido la
decisión más rentable: `npm run smoke` recorre el juego de punta a punta en
Chrome headless (15 comprobaciones). Encontró cuatro fallos reales que una
revisión a ojo no habría dado:

- Los hijos de la cámara no se renderizan si la cámara no está en el grafo de la
  escena: **el arma era invisible**.
- El núcleo central medía 2,45 m y **tapaba la línea de tiro** a las dianas, que
  están a 2,4 m. Ahora todo el conjunto remata por debajo de la altura de los
  ojos (1,7 m), y esa restricción está documentada en el código.
- Pausar dependía en exclusiva de que el navegador liberase el puntero al pulsar
  Escape. Si esa captura fallaba, **el jugador se quedaba sin salida**. Ahora
  Escape pausa por su cuenta, y hacerlo dos veces no tiene efecto.
- Dos toros estaban **de canto**: el anillo del suelo cruzaba la pantalla como un
  arco gigante, y el aro de la boca del cañón estaba girado 90°.

**4. Ajustes de sensación de juego medidos, no intuidos.** El frenado subió de
12 a 20 m/s² (unos 0,65 m de parada), el salto a 7 m/s con gravedad −22 para que
alcance justo las cajas de 1 m, y el tope de `delta` se dejó en 1/15 y no más
bajo: Rapier integra la posición con el delta real, así que recortar de más
desacopla el frenado del movimiento y el jugador patina en equipos lentos.

**5. Decisión pendiente para Víctor.** `contactLinks` tiene LinkedIn y GitHub.
El email sigue fuera a propósito: publicar una dirección de correo en una página
pública es una decisión personal, no técnica.

### Fase 6 (extras) — no hecha

Sigue disponible como trabajo futuro: salas por sección en vez de modales,
minijuego de puntería, recarga cosmética, ciclo día/noche.
