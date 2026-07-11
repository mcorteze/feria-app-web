# Flujo activo — Feria App Web
Actualizado: 2026-07-10

## Tarea actual
Sitio migrado a Netlify (feria-app-web.netlify.app) + origen OAuth agregado en Google Cloud Console. Esperando confirmación del usuario de que el login ya funciona de forma estable.

## Decisiones tomadas esta sesión
- [2026-07-10] Réplica web fiel de feria-app (React Native/Expo) en React + Firebase, mobile-first, "mismo flujo pero con mejoras en base a auditoría profunda" (petición explícita del usuario).
- [2026-07-10] Auditoría completa del original ejecutada vía agente Explore — 25 hallazgos documentados (2 críticos: ruta de navegación inexistente al eliminar/finalizar lista, y ausencia de sincronización real causando listas duplicadas).
- [2026-07-10] Propuesta PM en 4 niveles (Producto, UX/Interacción, Datos, Arquitectura técnica) presentada como artifact y aprobada por el usuario sin cambios.
- [2026-07-10] Skill `frontend-design` de github.com/anthropics/skills usado como guía de fidelidad visual; copiado a `skills/frontend-design.md` del proyecto.
- [2026-07-10] Firebase: sin proyecto creado aún — código listo con `.env.example`, se conecta cuando el usuario cree el proyecto en Firebase Console.
- [2026-07-10] Auth: Google Sign-In (decisión del usuario, ver AskUserQuestion).
- [2026-07-10] Proyecto construido completo vía agente en background: tokens, servicios (repository pattern), hooks de dominio, componentes UI, 7 pantallas, `firestore.rules`. `npm run build` verificado limpio.

## Pendiente
- [ ] Usuario debe confirmar que el login ya funciona de forma estable en su celular tras agregar el origen OAuth en Google Cloud Console
- [ ] Code-splitting del bundle de Firebase si el tamaño (~848KB) llega a ser un problema real (nota del agente constructor, no urgente)
- [ ] Evaluar si conviene mostrar avatares de TODOS los colaboradores en History (hoy solo muestra nombre/total, sin grupo)
- [ ] Decidir si GitHub Pages (mcorteze.github.io/feria-app-web) se abandona del todo o se deja como espejo secundario — el sitio real ahora es Netlify (feria-app-web.netlify.app). El workflow de GitHub Actions ya se eliminó, pero el deploy viejo puede seguir sirviendo una versión desactualizada hasta que se borre manualmente en GitHub Pages settings si se quiere limpiar del todo.
- [ ] El placeholder de Firebase Hosting (`firebase-hosting-placeholder/`) sigue siendo necesario — activa el endpoint `/__/firebase/init.json` que el SDK de Auth requiere sin importar en qué dominio viva la app real. No borrarlo.

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
  4. GitHub Pages sirve todo con `Cross-Origin-Opener-Policy: same-origin`, lo que bloquea que `signInWithPopup` cierre su propio popup y se comunique de vuelta — se eliminó el popup, `signInWithGoogle` usa siempre `signInWithRedirect`
  5. **Causa raíz verdaderamente final** (confirmada por error de consola en el celular): `GET https://feria-app-web.firebaseapp.com/__/firebase/init.json` devolvía 404. Ese archivo lo sirve automáticamente Firebase Hosting, y **Hosting nunca había tenido un despliegue real** en el proyecto (solo se había "activado" desde el asistente de consola, sin publicar nada) — sin ese endpoint, el SDK de Firebase Auth no puede completar el ciclo de `signInWithRedirect` en absoluto, sin importar cuántas veces se reintentara desde el código de la app. Fix: se creó `firebase.json` + `.firebaserc` + un `firebase-hosting-placeholder/index.html` mínimo (la app real sigue en GitHub Pages, este Hosting solo existe para que el endpoint de Auth exista) y el usuario ejecutó `npx firebase-tools login` + `npx firebase-tools deploy --only hosting` en su propia terminal (el CLI no puede autenticarse desde este entorno, requiere navegador interactivo). Verificado con `curl`: `init.json` pasó de 404 a 200. **Este es el fix real — todos los anteriores eran necesarios pero no suficientes.**

- Rediseño visual completo a pedido del usuario (fondo oscuro tipo "panel de entrenador", acento único vibrante `#3ddc97`, sin colores dulces, cero emojis):
  - `tokens.css` reescrito de cero — paleta oscura, tipografía técnica, radios geométricos, sombras casi planas. Verificado con `comm` que no queda ningún token CSS huérfano en todo `src/`.
  - `Welcome.jsx`: se quitó el copy de marketing ("Organiza tus compras..."), se agregó topbar con avatar de Google (componente `Avatar` nuevo, reutilizable) y nombre arriba-izquierda, botón "Salir". Se quitó el límite artificial de 10 caracteres en `useProfileName` (venía del original React Native, sin sentido en web con `displayName` real de Google).
  - Navegación: botón "Cambiar" (texto) → ícono `ArrowLeftRight` con label accesible; ícono de catálogo `Tag` (poco intuitivo) → `ShoppingBasket`, en `PlannerHome` y `BuyerHome`.
  - **Enfoque de grupo** (pedido explícito): `collaborators` ahora guarda también `photoURL` (antes solo uid/displayName/role) en `createList` y `joinListAsBuyer`. Nuevo componente `Avatar.jsx` reutilizable. `PlannerHome`/`BuyerHome` muestran stack de avatares + fecha de creación en cada card de lista (patrón `.avatar-stack` con superposición). `ActiveList` muestra barra de grupo bajo el header (avatares + colaboradores + fecha) y el modal de compartir ahora lista a cada colaborador con avatar, nombre y rol (Pill), no solo el código crudo.
  - Nuevo componente `GuideCard.jsx` (patrón "card de notificación/guía"): usado en `PlannerHome` para avisar cuando el catálogo de productos está vacío (resuelve el problema de descubribilidad que reportó el usuario — `/products` existía pero nadie lo encontraba), con acción directa "Ir al catálogo" y opción de descartar (persistida en localStorage).
  - Verificado: todas las pantallas ya tenían `onBack` correcto: solo faltaba que fuera descubrible, no que faltara la función.

- Segunda ronda de ajustes visuales tras feedback del usuario sobre una imagen de referencia (app POS no relacionada, usada solo como referencia de paleta):
  - Acento cambiado de `#3ddc97` (apagado) a `#6ee23f` (más saturado/vibrante, más cercano a la referencia)
  - Íconos aumentados en toda la app: header actions 20→22px, botones de acción secundaria 16→18px, buscador 18→19px; tap target circular de header 36→40px
  - Botón "Salir" (texto plano, sin confirmación) reemplazado por dropdown de perfil: click en avatar+nombre abre menú con "Cerrar sesión" (ícono `LogOut`), que ahora pide confirmación vía `Modal` antes de ejecutar `signOut()`. Cierra al hacer click afuera (listener `mousedown` con `menuRef`).

- **El login seguía fallando pese al fix de Hosting** — nueva señal de Chrome en consola: "Chrome may soon delete state for intermediate websites in a recent navigation chain" apuntando a `feria-app-web.firebaseapp.com`. Esto es **Bounce Tracking Protection**: como el sitio y `firebaseapp.com` son dominios distintos y el usuario nunca "interactúa" directamente ahí (solo rebota durante `signInWithRedirect`), Chrome purga su estado a mitad del flujo — causa raíz real de por qué el redirect nunca completaba de forma confiable, sin importar los fixes anteriores (todos correctos pero insuficientes).
  - GitHub Pages fuerza `Cross-Origin-Opener-Policy: same-origin` sin poder cambiarlo (no soporta cabeceras custom), lo que había obligado a usar `signInWithRedirect` en primer lugar (el popup no podía comunicarse de vuelta). Un intento de agregar `<meta http-equiv="Cross-Origin-Opener-Policy">` fue descartado: **COOP no se puede establecer vía meta tag en ningún navegador**, solo como cabecera HTTP real.
  - **Solución**: migración completa de hosting de GitHub Pages a **Netlify** (`feria-app-web.netlify.app`), que sí permite cabeceras custom vía `netlify.toml`. Se estableció `Cross-Origin-Opener-Policy: unsafe-none` y se restauró `signInWithPopup` como método principal (con fallback a redirect solo si el popup es bloqueado) — el popup nunca navega la ventana fuera del sitio, por lo que Bounce Tracking Protection no aplica en absoluto. Cambios de infraestructura: se quitó el `base`/`basename` de subpath de Vite/Router (Netlify sirve en la raíz), se quitó `404.html` y el script de restauración de `index.html` (`netlify.toml` maneja el SPA fallback con `[[redirects]]`), se quitó el workflow de GitHub Actions.
  - Verificado con `curl`: `Cross-Origin-Opener-Policy: unsafe-none` confirmado activo en `https://feria-app-web.netlify.app/`.
  - **Aun con COOP correcto, el popup seguía fallando** con error "The requested action is invalid" (`auth/internal-error` o similar). Causa: Firebase Auth usa por debajo un **OAuth 2.0 Client ID de Google Cloud Console** con su propia lista separada de "Authorized JavaScript origins" — agregar el dominio en Firebase Console (Authentication → Authorized domains) NO alimenta esta lista automáticamente, son dos configuraciones independientes. Se encontró en **Google Cloud Console → APIs & Services → Credentials** (proyecto `feria-app-web`, no confundir con otros proyectos del usuario como `aloasesoriasexcel`) el "Web client (auto created by Google Service)", y se agregó `https://feria-app-web.netlify.app` a sus Authorized JavaScript origins. Los cambios de OAuth Client tardan unos minutos en propagar.
  - **Nota de proceso**: el CLI de `firebase-tools` no puede autenticarse desde este entorno (Bash ni PowerShell) en ningún modo — ni `login` ni `login:ci` funcionan de forma no interactiva. Cualquier operación que requiera `firebase login` debe correrla el usuario en su propia terminal fuera de esta sesión.
