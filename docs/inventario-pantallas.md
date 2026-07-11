# Inventario de pantallas — Feria App Web

Stack: React 19 + Vite + React Router 7 + Firebase (Auth + Firestore). Mobile-first (~390px). Tema actual: claro (fondo `#f4f5f2`, cards blancas, texto oscuro `#1c1f17`), acento verde `#6ee23f`, un único bloque oscuro (`--color-ink`) reservado al header. Sistema de tokens CSS en `src/styles/tokens.css` (colores, radios, sombras, espaciado, tipografía — nada de hex/px sueltos en componentes).

Rutas: `/` (Welcome), `/planner`, `/buyer`, `/list/:listId`, `/list/:listId/add-product`, `/products`, `/history`, `/collaborators`.

---

## Componentes compartidos (usados por casi todas las pantallas)

- **ScreenHeader**: barra superior fija (sticky), fondo oscuro (`--color-ink`). Slots: botón "volver" opcional (ícono flecha), título (texto o botón clickeable), y una zona de `actions` a la derecha con botones-ícono circulares (variante ghost o "activa" con fondo verde).
- **Modal**: genérico, overlay + panel inferior deslizante, título + contenido libre, cierra con Escape o click afuera. Usado por casi toda pantalla para formularios cortos (crear, renombrar, confirmar, etc).
- **Card**: contenedor blanco con sombra sutil, opcionalmente clickeable (se vuelve `<button>`).
- **EmptyState**: ícono + título + mensaje + hasta 2 botones de acción. Para listas vacías.
- **LoadingState**: spinner/label simple.
- **Avatar**: foto de Google o inicial como fallback, tamaño configurable.
- **Pill**: etiqueta pequeña con variante de color (success, pending, info, neutral).
- **HeroButton**: botón grande de acción principal, con ícono, label y variante de color (brand=verde, buyer=azul).
- **FAB**: botón circular flotante fijo abajo-derecha.
- **GuideCard**: card de aviso/onboarding descartable (persistido en localStorage).
- **ImportListModal**: modal reutilizado en Planificador y Comprador para importar una lista desde JSON.

---

## 1. Welcome (`/`) — pantalla raíz

**Función**: login, definir nombre de perfil, elegir rol (Planificador/Comprador).

**Header**: no usa `ScreenHeader`. Solo cuando hay usuario logueado, aparece un avatar flotante (sin texto) en la esquina superior derecha, que abre un menú desplegable con una sola opción: "Cerrar sesión" (con confirmación en modal aparte).

**Estados de contenido** (secuenciales, condicionados por auth):
1. Sin usuario: título "Feria App" + botón "Iniciar sesión con Google".
2. Usuario logueado sin nombre guardado: mismo título + formulario de un campo (nombre) + botón "Continuar".
3. Usuario con nombre: etiqueta pequeña "FERIA APP" + saludo grande "Hola, {nombre}" + dos `HeroButton` grandes ("Planificador" / "Comprador") + texto de ayuda debajo.

**Componentes usados**: Avatar, HeroButton, LoadingState, Modal.

**Oportunidades de mejora observables**: es la única pantalla sin `ScreenHeader` (arquitectura distinta al resto); no hay forma de editar el nombre de perfil una vez guardado sin borrar datos manualmente; el flujo de 3 estados secuenciales vive todo en un mismo componente con lógica condicional anidada.

---

## 2. Planificador (`/planner`) — home del rol planner

**Función**: listar las listas de compra creadas por el usuario, crear una nueva, acceso a funciones satélite.

**Header**: título "Planificador", botón volver (a `/`). Acciones: catálogo de productos, historial, importar lista (JSON), colaboradores habituales, cambiar de rol — **5 íconos en el header**, todos ghost.

**Contenido**:
- Aviso descartable si el catálogo de productos está vacío (GuideCard).
- `HeroButton` "Nueva Lista" (abre modal).
- Lista de cards, cada una: nombre, pill de estado (Pendiente/Finalizada), fecha, stack de avatares de colaboradores.
- Estado vacío con CTA a crear la primera lista.

**Modal "Nueva lista"**: campo de nombre + sección opcional de checkboxes para agregar colaboradores habituales directamente + acciones cancelar/crear.

**Modal de importar**: ver sección ImportListModal más abajo.

**Componentes usados**: ScreenHeader, GuideCard, HeroButton, Card, Pill, Avatar, EmptyState, LoadingState, Modal, ImportListModal.

**Oportunidades de mejora observables**: 5 íconos en el header es una cantidad alta para mobile (~390px), puede sentirse apretado; no hay ordenar/filtrar listas (siempre por fecha de creación); no hay forma de eliminar una lista desde aquí (solo desde dentro de la lista).

---

## 3. Comprador (`/buyer`) — home del rol buyer

**Función**: listar listas a las que el usuario se unió como comprador, unirse a una nueva vía código, acceso a funciones satélite.

**Header**: título "Comprador", volver. Mismas 5 acciones que Planificador (catálogo, historial, importar, colaboradores, cambiar rol).

**Contenido**:
- `HeroButton` "Unirse a Lista" (abre modal con campo de código de invitación).
- Lista de cards: nombre, pill de estado, avatar+nombre del planificador, fecha, botón eliminar (ícono papelera, rojo).
- Estado vacío con CTA.

**Modal "Unirse a lista"**: input de código + mensaje de error si no existe.
**Modal "Eliminar lista"**: confirmación simple.

**Componentes usados**: mismos que Planificador, más botón de eliminar propio (clase `list-card-delete`).

**Oportunidades de mejora observables**: estructura casi idéntica a Planificador pero duplicada como archivo separado (no hay componente compartido de "Home"); el botón eliminar en la card compite visualmente con el resto de la fila sin agrupación clara.

---

## 4. Lista activa (`/list/:listId`) — la pantalla más compleja

**Función**: vista de una lista de compras, con comportamiento distinto según rol y estado.

**Header**: título = nombre de la lista (clickeable para renombrar, solo si sos planificador y la lista no está finalizada). Volver (a Planificador o Comprador según rol, con `replace`). Acciones: botón "Organizar" (solo comprador, modo edición de grupos/puestos, ícono capas, resalta en verde si está activo), compartir (ícono, abre modal con código + lista de colaboradores), eliminar lista (solo planificador).

**Barra de grupo** (debajo del header, siempre visible): stack de avatares de colaboradores + contador + fecha de creación.

**Banner de resumen** (condicional): si la lista está finalizada, muestra pill "Finalizada" + total gastado. Si es comprador y la lista está activa, muestra el total acumulado en tiempo real.

**Cuerpo — 3 variantes según rol/estado**:
- **Modo comprador, lista activa**: items agrupados por puesto ("General" + puestos custom). Cada grupo tiene header con nombre y contador "x/y comprados". Cada item es una fila clickeable con check circular, nombre, cantidad/unidad, precio si ya está comprado. En **modo Organizar** activo: los headers de grupo ganan botón eliminar-puesto y flechas subir/bajar para reordenar; cada fila gana un checkbox de selección múltiple en vez de abrir el modal de compra; aparece una barra flotante inferior con contador de seleccionados + botón "Agregar a Grupo" que abre un modal de asignación (crear puesto nuevo o mover a uno existente, con preview de items ya asignados).
- **Modo planificador, lista activa**: lista plana (sin agrupar) de items con nombre, cantidad/unidad, precio estimado, comentario opcional, y botones editar/eliminar por fila. FAB para agregar producto (navega a ProductSelection).
- **Lista finalizada** (cualquier rol): misma lista plana, solo lectura, sin botones de acción.

**Modales de esta pantalla**: renombrar lista, compartir (código + lista de colaboradores con avatar/nombre/rol), eliminar lista, comprar item (cantidad + precio pagado, con overlay de selección de cantidad), editar item (cantidad, unidad, precio estimado, comentario), asignar a puesto (modo Organizar).

**Componentes usados**: ScreenHeader, Avatar, EmptyState, FAB, Modal, Pill, QuantityOverlay, UnitOverlay, más 3 componentes locales no exportados (BuyItemModal, EditItemModal, AssignStallModal).

**Oportunidades de mejora observables**: es la pantalla con más ramas condicionales de todo el proyecto (rol × estado × modo organizar); 3 modales locales grandes viven en el mismo archivo que la pantalla (600+ líneas); no hay indicación visual de progreso general de la lista (ej. barra de "60% comprado") más allá del contador por grupo; el modo Organizar cambia el significado del tap en toda la lista (selección vs. compra) sin un indicador visual fuerte de "estás en modo edición" más allá del ícono resaltado en el header.

---

## 5. Agregar producto (`/list/:listId/add-product`)

**Función**: buscar en el catálogo y agregar un producto a la lista actual (solo accesible desde modo planificador).

**Header**: título "Agregar producto", volver fijo a la lista de origen.

**Contenido**: buscador con ícono; si el texto no coincide con ningún producto existente, aparece botón "Crear {texto}"; lista de resultados agrupados alfabéticamente por letra inicial. Cada fila es expandible: al tocar el nombre se despliega un mini-formulario (cantidad, unidad — ambos vía overlay de selección —, precio estimado, comentario) con botones cancelar/agregar.

**Componentes usados**: ScreenHeader, Card, EmptyState, LoadingState, QuantityOverlay, UnitOverlay, componente local ProductPickRow.

**Oportunidades de mejora observables**: sin filtro por categoría o puesto (solo búsqueda por texto); la expansión in-line de cada fila puede volverse larga de escanear si hay muchos resultados; no hay indicador de qué productos ya están en la lista actual (se puede agregar el mismo dos veces sin aviso).

---

## 6. Catálogo de productos (`/products`)

**Función**: gestión global de productos reutilizables entre listas (no específicos de una lista).

**Header**: título "Catálogo", volver.

**Contenido**: buscador; si está vacío, EmptyState con dos acciones ("Cargar catálogo inicial" con ~100 productos semilla, o "Nuevo producto"); si tiene productos, lista de cards con avatar de color por categoría (inicial del nombre), nombre, pills de categoría y puesto, precio de última compra si existe. FAB para agregar producto nuevo.

**Modal "Nuevo producto"**: nombre, selector de categoría (chips), selector de puesto (chips + opción crear uno nuevo inline).

**Componentes usados**: ScreenHeader, Card, EmptyState, FAB, LoadingState, Modal, Pill.

**Oportunidades de mejora observables**: no hay edición ni eliminación de productos desde esta pantalla (solo creación); no hay filtro por categoría o puesto, solo búsqueda de texto; el color de categoría es un estilo inline (`style={{background: ...}}`) en vez de vía token/clase.

---

## 7. Historial (`/history`)

**Función**: listar listas ya finalizadas.

**Header**: título "Historial", volver.

**Contenido**: lista de cards con nombre, total gastado, fecha. Click navega a la lista (en modo solo lectura). Estado vacío simple.

**Componentes usados**: ScreenHeader, Card, EmptyState, LoadingState.

**Oportunidades de mejora observables**: es la pantalla más simple/subdesarrollada del proyecto — no hay filtro por fecha, no hay ningún tipo de estadística agregada (gasto total del mes, comparación entre ferias, etc.), no distingue si la lista fue como planificador o comprador.

---

## 8. Colaboradores habituales (`/collaborators`)

**Función**: directorio personal de colaboradores frecuentes, para agregarlos rápido al crear/importar una lista sin compartir código cada vez.

**Header**: título "Colaboradores habituales", volver.

**Contenido**: formulario de búsqueda por email (solo encuentra usuarios que ya iniciaron sesión alguna vez en la app) → si encuentra resultado, card con avatar/nombre + botón "Agregar"; debajo, lista de favoritos ya guardados con botón eliminar por fila.

**Componentes usados**: ScreenHeader, Avatar, Card, EmptyState, LoadingState.

**Oportunidades de mejora observables**: la búsqueda por email es exacta (case-insensitive pero sin coincidencia parcial ni por nombre); no hay feedback visual de "agregado" más allá de que la card de resultado desaparece; no hay forma de invitar a alguien que nunca usó la app desde aquí (hay que usar el código de invitación por separado, en otra pantalla).

---

## Patrones transversales a señalar

- **Duplicación estructural**: PlannerHome y BuyerHome comparten ~80% de estructura (header con 5 acciones, hero button, lista de cards, modal de acción principal) pero están completamente duplicados como archivos, sin componente base compartido.
- **Header saturado**: ambas pantallas Home tienen 5 íconos de acción en una barra de ~390px de ancho — catálogo, historial, importar, colaboradores, cambiar rol — sin jerarquía visual entre ellos (todos mismo tamaño/peso).
- **Modales locales grandes**: varios archivos de pantalla (`ActiveList.jsx`, `ProductsCatalog.jsx`, `ProductSelection.jsx`) definen sus modales como funciones locales no exportadas en el mismo archivo, en vez de componentes separados — funciona pero hace esos archivos largos (ActiveList.jsx supera 650 líneas).
- **Sin gestión de errores de red visible**: casi ninguna pantalla muestra un estado de error de carga distinto a "loading" infinito si Firestore falla.
- **Colores de categoría hardcodeados**: los 6 colores de categoría semilla (`SEED_CATEGORIES`) son hex directos en datos, no tokens CSS — única excepción a la regla de "todo vía token" del resto del proyecto.
