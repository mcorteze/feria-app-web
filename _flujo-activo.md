# Flujo activo — Feria App Web
Actualizado: 2026-07-10

## Tarea actual
Ninguna en curso. Fase 1 (construcción completa del proyecto) cerrada. Pendiente que el usuario decida cuándo avanzar a Fase 2 (conectar Firebase real).

## Decisiones tomadas esta sesión
- [2026-07-10] Réplica web fiel de feria-app (React Native/Expo) en React + Firebase, mobile-first, "mismo flujo pero con mejoras en base a auditoría profunda" (petición explícita del usuario).
- [2026-07-10] Auditoría completa del original ejecutada vía agente Explore — 25 hallazgos documentados (2 críticos: ruta de navegación inexistente al eliminar/finalizar lista, y ausencia de sincronización real causando listas duplicadas).
- [2026-07-10] Propuesta PM en 4 niveles (Producto, UX/Interacción, Datos, Arquitectura técnica) presentada como artifact y aprobada por el usuario sin cambios.
- [2026-07-10] Skill `frontend-design` de github.com/anthropics/skills usado como guía de fidelidad visual; copiado a `skills/frontend-design.md` del proyecto.
- [2026-07-10] Firebase: sin proyecto creado aún — código listo con `.env.example`, se conecta cuando el usuario cree el proyecto en Firebase Console.
- [2026-07-10] Auth: Google Sign-In (decisión del usuario, ver AskUserQuestion).
- [2026-07-10] Proyecto construido completo vía agente en background: tokens, servicios (repository pattern), hooks de dominio, componentes UI, 7 pantallas, `firestore.rules`. `npm run build` verificado limpio.

## Pendiente
- [ ] Confirmar que el primer deploy a GitHub Pages corrió bien (revisar pestaña Actions del repo)
- [ ] Agregar `feria-app-web.github.io` (o el dominio exacto que asigne Pages) a "Authorized domains" en Firebase Authentication → Settings, si no aparece ya cubierto por el dominio de Firebase
- [ ] Probar el flujo end-to-end en la URL pública (login Google, crear lista, unirse como comprador)
- [ ] Code-splitting del bundle de Firebase si el tamaño (~837KB) llega a ser un problema real (nota del agente constructor, no urgente)
- [ ] Revisar visualmente fidelidad de diseño en navegador real (mobile viewport) comparando contra capturas del original si el usuario las tiene

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
- Git inicializado, remote `origin` → `https://github.com/mcorteze/feria-app-web.git`, rama `main`
