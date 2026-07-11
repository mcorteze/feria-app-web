# Flujo activo — Feria App Web
Actualizado: 2026-07-10

## Tarea actual
Rediseño visual completo aplicado (fondo oscuro, avatares, enfoque de grupo). Listo para publicar y que el usuario pruebe en su celular real.

## Decisiones tomadas esta sesión
- [2026-07-10] Réplica web fiel de feria-app (React Native/Expo) en React + Firebase, mobile-first, "mismo flujo pero con mejoras en base a auditoría profunda" (petición explícita del usuario).
- [2026-07-10] Auditoría completa del original ejecutada vía agente Explore — 25 hallazgos documentados (2 críticos: ruta de navegación inexistente al eliminar/finalizar lista, y ausencia de sincronización real causando listas duplicadas).
- [2026-07-10] Propuesta PM en 4 niveles (Producto, UX/Interacción, Datos, Arquitectura técnica) presentada como artifact y aprobada por el usuario sin cambios.
- [2026-07-10] Skill `frontend-design` de github.com/anthropics/skills usado como guía de fidelidad visual; copiado a `skills/frontend-design.md` del proyecto.
- [2026-07-10] Firebase: sin proyecto creado aún — código listo con `.env.example`, se conecta cuando el usuario cree el proyecto en Firebase Console.
- [2026-07-10] Auth: Google Sign-In (decisión del usuario, ver AskUserQuestion).
- [2026-07-10] Proyecto construido completo vía agente en background: tokens, servicios (repository pattern), hooks de dominio, componentes UI, 7 pantallas, `firestore.rules`. `npm run build` verificado limpio.

## Pendiente
- [ ] Usuario debe probar el rediseño en su celular real y dar feedback (fondo oscuro, avatares, cards de guía, iconos nuevos)
- [ ] Quitar el debug banner temporal si quedó algún resto (se agregó y luego se resolvió el bug de auth; verificar que Welcome.jsx no tenga texto "DEBUG:" visible)
- [ ] Code-splitting del bundle de Firebase si el tamaño (~847KB) llega a ser un problema real (nota del agente constructor, no urgente)
- [ ] Evaluar si conviene mostrar avatares de TODOS los colaboradores en History (hoy solo muestra nombre/total, sin grupo)

## Contexto crítico (lo que no puede olvidarse)
- El modelo de datos usa `collaborators: [{uid, role}]` por lista — NO reintroducir un `list_mode` global como tenía el original, fue un hallazgo de auditoría a corregir.
- `estimatedPrice` (planner) y `paidPrice` (buyer) son campos separados a propósito — no fusionarlos.
- Toda la paleta vive en `src/styles/tokens.css`, incluye soporte de tema oscuro vía `prefers-color-scheme` + `data-theme` override.
- El proyecto original real sigue en `C:\Proyectos\feria-app` (Expo/React Native) — es solo referencia, no se toca.

## Historial de esta sesión
- Auditoría profunda del proyecto original (agente Explore, ~93k tokens, 19 tool uses)
- Documento de propuesta PM publicado como artifact y aprobado
- Skill frontend-design obtenido de GitHub (clonado localmente, copiado al proyecto)
- Scaffolding Vite + instalación de dependencias (firebase, react-router-dom, lucide-react)
- Construcción completa de la app vía agente en background (~106k tokens, 92 tool uses): 50 archivos fuente, build verificado
- CLAUDE.md y este flujo activo creados para cerrar el sistema operativo del proyecto
- Firebase real configurado: proyecto `feria-app-web`, Auth Google habilitado, Firestore creado, credenciales en `.env`
- `firestore.rules` corregido (el editor de reglas no soporta arrow functions en `.filter()`/`.map()`) — se agregó campo `collaboratorUids` (array plano) para usar `hasAny()`, y se sincronizó en `listsRepository.js`; reglas publicadas exitosamente
- Categorías semilla: se decidió NO cargarlas en Firestore, se mantiene el fallback local en `categoriesRepository.js`
- Despliegue a GitHub Pages configurado: `HashRouter` en vez de `BrowserRouter` (evita 404 en subpath al recargar), `base: '/feria-app-web/'` en `vite.config.js`, workflow `.github/workflows/deploy.yml` (build + deploy-pages), 6 GitHub Secrets configurados, Pages Source = GitHub Actions
- Git inicializado, remote `origin` → `https://github.com/mcorteze/feria-app-web.git`, rama `main`, primer push hecho — sitio publicado en https://mcorteze.github.io/feria-app-web/
- Seed de catálogo de productos: `categories` usa fallback local (decisión previa, sin cambios). `products` (~100 items del original) NO tenía seed — se creó `src/data/seedProducts.js` con el catálogo completo migrado (category_id numérico → slug de categoría, unidades no soportadas mapeadas: litro→lt, lata/rollo→un, bolsa/sobre/frasco/caja→paquete) y un botón "Cargar catálogo inicial" en `/products` (solo visible si el catálogo está vacío, usa `writeBatch` vía `seedProducts()` en `productsRepository.js`). `EmptyState` ampliado con acción secundaria opcional para soportar el botón "Nuevo producto" junto al de seed.
- Bug de login en móvil, 3 iteraciones hasta la causa real:
  1. Popup se cerraba solo → cambio a `signInWithRedirect` en móvil (insuficiente)
  2. Redirect completaba pero sesión no persistía → se agregó `setPersistence(browserLocalPersistence)` (insuficiente)
  3. `HashRouter` y `signInWithRedirect` competían por el fragmento `#` de la URL → cambio a `BrowserRouter` + `basename` + patrón `404.html` de GitHub Pages
  4. **Causa raíz final confirmada por consola del navegador**: GitHub Pages sirve todo con `Cross-Origin-Opener-Policy: same-origin` (no configurable ahí), lo que bloquea que `signInWithPopup` cierre su propio popup y se comunique de vuelta — la promesa quedaba colgada sin lanzar error capturable. Fix definitivo: se eliminó el popup por completo, `signInWithGoogle` usa siempre `signInWithRedirect`. **Confirmado funcionando en dispositivo Android real.**

- Rediseño visual completo a pedido del usuario (fondo oscuro tipo "panel de entrenador", acento único vibrante `#3ddc97`, sin colores dulces, cero emojis):
  - `tokens.css` reescrito de cero — paleta oscura, tipografía técnica, radios geométricos, sombras casi planas. Verificado con `comm` que no queda ningún token CSS huérfano en todo `src/`.
  - `Welcome.jsx`: se quitó el copy de marketing ("Organiza tus compras..."), se agregó topbar con avatar de Google (componente `Avatar` nuevo, reutilizable) y nombre arriba-izquierda, botón "Salir". Se quitó el límite artificial de 10 caracteres en `useProfileName` (venía del original React Native, sin sentido en web con `displayName` real de Google).
  - Navegación: botón "Cambiar" (texto) → ícono `ArrowLeftRight` con label accesible; ícono de catálogo `Tag` (poco intuitivo) → `ShoppingBasket`, en `PlannerHome` y `BuyerHome`.
  - **Enfoque de grupo** (pedido explícito): `collaborators` ahora guarda también `photoURL` (antes solo uid/displayName/role) en `createList` y `joinListAsBuyer`. Nuevo componente `Avatar.jsx` reutilizable. `PlannerHome`/`BuyerHome` muestran stack de avatares + fecha de creación en cada card de lista (patrón `.avatar-stack` con superposición). `ActiveList` muestra barra de grupo bajo el header (avatares + colaboradores + fecha) y el modal de compartir ahora lista a cada colaborador con avatar, nombre y rol (Pill), no solo el código crudo.
  - Nuevo componente `GuideCard.jsx` (patrón "card de notificación/guía"): usado en `PlannerHome` para avisar cuando el catálogo de productos está vacío (resuelve el problema de descubribilidad que reportó el usuario — `/products` existía pero nadie lo encontraba), con acción directa "Ir al catálogo" y opción de descartar (persistida en localStorage).
  - Verificado: todas las pantallas ya tenían `onBack` correcto: solo faltaba que fuera descubrible, no que faltara la función.
