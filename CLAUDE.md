# Feria App Web — Hub Operativo

> Réplica web (React + Firebase) de la app móvil Feria App (React Native/Expo), mobile-first.
> Stack: Vite + React 19 + React Router 7 + Firebase (Auth + Firestore) + lucide-react.
> Comando de desarrollo: `npm run dev` (solo cuando el usuario lo pida explícitamente — no levantar dev servers sin permiso).

## Estado actual

Fase 1 completa: proyecto construido de punta a punta (tokens visuales, capa de servicios/repository, hooks de dominio, componentes UI reutilizables, 7 pantallas, reglas de Firestore). `npm run build` pasa limpio. **Falta**: crear el proyecto real en Firebase Console y pegar credenciales en `.env` (hoy solo existe `.env.example`) — sin eso, la app compila pero no puede autenticar ni leer/escribir datos.

## Origen y decisiones de fondo

Este proyecto nace de una auditoría profunda de `C:\Proyectos\feria-app` (ver `docs/auditoria-original.md` si se archivó, o memoria de proyecto). Decisión central: reemplazar el mecanismo original de compartir listas por JSON/ZIP por **sincronización en tiempo real vía Firestore** — una sola lista con colaboradores (`role: 'planner' | 'buyer'`), no copias que puedan divergir.

Correcciones deliberadas respecto al original (no son "features nuevas", son fixes de bugs/confusiones documentados en la auditoría):
- `estimatedPrice` y `paidPrice` son campos separados (el original mezclaba ambos en `bought_price`).
- Asignar un puesto a un producto es una decisión por lista (`items/{itemId}.stallId`), no una mutación del catálogo global.
- Una lista `completed` se abre en modo resumen de solo lectura, nunca en modo edición.
- Eliminar/finalizar una lista navega a una ruta real (`/planner` o `/buyer`), nunca a una ruta inexistente.
- `/products` y `/history` tienen puntos de entrada visibles reales (en el original existían pero eran inalcanzables desde la UI).

## Skills del equipo

| Skill | Archivo | Cuándo activarla |
|-------|---------|-----------------|
| Diseño frontend (Anthropic) | skills/frontend-design.md | Al crear o ajustar cualquier UI/pantalla/componente — guía de fidelidad visual y criterio de diseño intencional |

## Mapa de documentación

| Doc | Cuándo leerlo |
|-----|--------------|
| `_flujo-activo.md` | Al retomar sesión — estado vivo del trabajo |
| `firestore.rules` | Antes de tocar permisos/seguridad de datos |
| `src/styles/tokens.css` | Antes de escribir CSS nuevo — nunca usar hex sueltos, todo vía `var(--token)` |
| `.env.example` | Al configurar el proyecto Firebase real |

## Reglas que nunca se rompen

1. **No levantar `npm run dev` sin que el usuario lo pida explícitamente.** Verificar cambios con `npm run build`.
2. **Todo color/radio/sombra/espaciado sale de `src/styles/tokens.css`.** Ningún componente define hex ni px mágicos sueltos.
3. **Las pantallas nunca importan `firebase/firestore` directo** — siempre pasan por `src/services/*Repository.js`.
4. **Mobile-first siempre**: diseñar para ~390px de ancho primero, escalar después. `AppLayout` ya centra a `max-width: 480px` en pantallas grandes.
5. **Un colaborador (`role`) es por lista, no una propiedad fija de toda la app** — no reintroducir el patrón `list_mode` global del original.

## Flujo activo
Si existe `_flujo-activo.md` → leerlo antes de empezar.
