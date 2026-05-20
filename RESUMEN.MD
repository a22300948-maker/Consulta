# RESUMEN DEL PROYECTO "Consulta"

Última revisión: 12 de mayo de 2026

Este documento explica la arquitectura, comunicación y responsabilidad de los archivos del proyecto.

## 1. Resumen general

- Frontend: Single Page Application escrita con Angular 21 (API moderna, componentes standalone). Código en [src/](src/).
- Backend: Node.js + Express (CommonJS) que expone endpoints REST y conecta con SQLite. Código en [backend/src/](backend/src/).
- Base de datos: SQLite local en [backend/src/database/database.db](backend/src/database/database.db) y scripts de inicialización en [backend/src/database/initDb.js](backend/src/database/initDb.js) y [backend/src/database/init.sql](backend/src/database/init.sql).
- Integración de pagos: PayPal vía REST desde backend usando credenciales en [backend/env.env](backend/env.env) y llamadas desde frontend a través de la capa del backend.

El frontend consume la API en `http://localhost:3000/api` (ver [src/environments/environment.ts](src/environments/environment.ts)).

## 2. Arquitectura y comunicación (alto nivel)

- El servidor Express monta 3 grupos principales de rutas en [backend/src/app.js](backend/src/app.js):
  - `/api` → [backend/src/routes/producto.routes.js](backend/src/routes/producto.routes.js) (productos)
  - `/api/paypal` → [backend/src/router/paypal.router.js](backend/src/router/paypal.router.js) (línea de pago)
  - `/api/venta` → [backend/src/routes/venta.routes.js](backend/src/routes/venta.routes.js) (registro de ventas)

- Flujo de listado de productos:
  1. Frontend: `ProductoService.getAllFromApi()` solicita `GET http://localhost:3000/api/productos` (ver [src/app/Servicios/producto.service.ts](src/app/Servicios/producto.service.ts)).
  2. Backend: [backend/src/routes/producto.routes.js](backend/src/routes/producto.routes.js) enruta a [backend/src/controller/producto.controller.js](backend/src/controller/producto.controller.js) que ejecuta la consulta SQL en la DB a través de [backend/src/config/db.js](backend/src/config/db.js).

- Flujo de pago (PayPal):
  1. Frontend `PaypalComponent` ( [src/app/Componentes/PayPal/paypal.ts](src/app/Componentes/PayPal/paypal.ts) ) carga el SDK de PayPal. Para obtener `client-id` intenta primero [GET /api/paypal/client-id] usando [src/app/Servicios/paypal.service.ts](src/app/Servicios/paypal.service.ts).
  2. Al iniciar pago, el frontend envía `POST /api/paypal/create-order` con `{ items, total }` (vía `PaypalService.crearOrden`).
  3. Backend [backend/src/router/paypal.router.js](backend/src/router/paypal.router.js) recibe `create-order` y lo pasa a [backend/src/controller/paypal.controller.js](backend/src/controller/paypal.controller.js) que llama a [backend/src/services/paypal.service.js](backend/src/services/paypal.service.js). Este módulo habla directamente con la API de PayPal (token OAuth → crear orden).
  4. El backend retorna el `order.id` al frontend; el SDK de PayPal procesa el pago en cliente.
  5. Cuando PayPal confirma el pago, el frontend llama `POST /api/paypal/capture-order` (vía `PaypalService.capturarOrden`), el backend captura con PayPal, y el controller guarda la venta en la BD usando [backend/src/services/venta.service.js](backend/src/services/venta.service.js) (inserta `pedido` + `pedido_item` y actualiza stock en `producto`).

## 3. Archivos clave y su funcionalidad

Agrupado por responsabilidades — incluyo el camino relativo y una explicación.

**Raíz del proyecto**
- [package.json](package.json): scripts y dependencias del frontend (Angular). `start` ejecuta `ng serve`.
- [angular.json](angular.json): configuración del build Angular.
- [proxy.conf.json](proxy.conf.json): proxy opcional (no necesario); el proyecto usa `environment.apiUrl` apuntando al backend.
- [README.md](README.md): documentación general del repo.
- [CLAUDE.md](CLAUDE.md): notas/instrucciones internas para asistentes (no parte funcional de la app).

**Frontend (src/)**
- [src/main.ts](src/main.ts): bootstrap de la aplicación con `bootstrapApplication(App, appConfig)`.
- [src/app/app.config.ts](src/app/app.config.ts): providers globales; incluye `provideHttpClient()` y `provideRouter(routes)` (las rutas están en [src/app/app.routes.ts](src/app/app.routes.ts)).
- [src/app/app.ts](src/app/app.ts): componente raíz `App` (gestiona toast, modal de producto y comunicación con `ProductoService` y `ModalService`).
- [src/app/app.routes.ts](src/app/app.routes.ts): arreglo `routes` usado por `provideRouter`. Rutas registradas: `''` y `/catalogo` → `CatalogoComponent`, `/carrito` → `CarritoComponent`.
- [src/app/app-routing/app-routing.module.ts](src/app/app-routing/app-routing.module.ts): módulo de rutas clásico (NgModule). Observación: NO se utiliza en el arranque actual (la app usa `provideRouter(routes)` con `app.routes.ts`), por lo que este módulo es redundante y puede considerarse huérfano.

Componentes (UI)
- [src/app/Componentes/Catalogo/catalogo.ts/.html/.css](src/app/Componentes/Catalogo/catalogo.ts): lista productos; solicita datos desde `ProductoService.getAllFromApi()`.
- [src/app/Componentes/ProductoCard/producto-card.ts/.html/.css](src/app/Componentes/ProductoCard/producto-card.ts): tarjeta individual de producto; interacciona con `ProductoService` y `ModalService`.
- [src/app/Componentes/Carrito/carrito.ts/.html/.css](src/app/Componentes/Carrito/carrito.ts): vista del carrito; muestra `getCartSummary()` y contiene el botón para abrir el componente PayPal.
- [src/app/Componentes/PayPal/paypal.ts/.html/.css](src/app/Componentes/PayPal/paypal.ts): encapsula la carga del SDK de PayPal, crea ordenes mediante `PaypalService` y captura pagos; emite eventos `approved` y `error` que maneja `CarritoComponent`.

Servicios
- [src/app/Servicios/producto.service.ts](src/app/Servicios/producto.service.ts): logica del carrito y métodos para persistencia temporal (localStorage). Hace `GET http://localhost:3000/api/productos` en `getAllFromApi()` (ver `apiUrl` en el archivo). Es punto central del estado del carrito (Subjects para notificaciones).
- [src/app/Servicios/paypal.service.ts](src/app/Servicios/paypal.service.ts): wrapper HTTP hacia el backend `/paypal` (métodos `crearOrden`, `capturarOrden`, `getClientId`).
- [src/app/Servicios/carrito.service.ts](src/app/Servicios/carrito.service.ts): utilidad para generar y descargar un XML con los items del carrito después del pago.
- [src/app/Servicios/modal.service.ts](src/app/Servicios/modal.service.ts): servicio simple para abrir/cerrar modal de producto usando `Subject`.

Modelos / Interfaces
- [src/app/Modelos/producto.model.ts](src/app/Modelos/producto.model.ts): interfaz `Products` (shape esperado desde backend).
- [src/app/Interfaces/*](src/app/Interfaces): interfaces auxiliares para la comunicación entre componentes y tipos de PayPal.

**Backend (backend/src/)**
- [backend/src/server.js](backend/src/server.js): arranque del servidor; carga variables de entorno desde `../env.env` (no desde `.env`) y ejecuta `initializeDatabase()` si es necesario.
- [backend/src/app.js](backend/src/app.js): configura express, CORS y monta rutas: `app.use('/api', productosRoutes); app.use('/api/paypal', paypalRoutes); app.use('/api/venta', ventaRoutes);`.

Rutas y controladores
- [backend/src/routes/producto.routes.js](backend/src/routes/producto.routes.js): expone `GET /productos` → `getProductos`.
- [backend/src/routes/venta.routes.js](backend/src/routes/venta.routes.js): expone `POST /` → `createVenta` (registro directo de ventas).
- [backend/src/router/paypal.router.js](backend/src/router/paypal.router.js): expone `POST /create-order`, `POST /capture-order` y `GET /client-id`.
- [backend/src/controller/producto.controller.js](backend/src/controller/producto.controller.js): ejecuta la consulta SQL para devolver productos (usa [backend/src/config/db.js](backend/src/config/db.js)).
- [backend/src/controller/paypal.controller.js](backend/src/controller/paypal.controller.js): coordina `createOrder`/`captureOrder` y persiste venta tras captura (usa `venta.service`).
- [backend/src/controller/venta.controller.js](backend/src/controller/venta.controller.js): endpoint para guardar venta de forma directa, delega en `venta.service`.

Servicios backend
- [backend/src/services/paypal.service.js](backend/src/services/paypal.service.js): lógica low-level para comunicarse con la API de PayPal: obtiene access token, crea y captura órdenes usando `fetch` hacia PayPal.
- [backend/src/services/venta.service.js](backend/src/services/venta.service.js): persiste `pedido` y `pedido_item` en SQLite (usa `db.run`), normaliza items y actualiza stock en la tabla `producto`.

Configuración y BD
- [backend/src/config/db.js](backend/src/config/db.js): inicializa conexión SQLite a [backend/src/database/database.db](backend/src/database/database.db) y añade método `db.query` para compatibilidad de consultas.
- [backend/src/config/paypal.config.js](backend/src/config/paypal.config.js): exporta `paypalConfig` leyendo variables de entorno (client id/secret/baseUrl).
- [backend/env.env](backend/env.env): archivo de configuración consumido por `server.js` (contiene `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL` y `PORT`). **Atención:** contiene credenciales; NO incluirlas en repositorios públicos en producción.

Scripts de inicialización
- [backend/src/database/initDb.js](backend/src/database/initDb.js): crea tablas `producto`, `pedido`, `pedido_item` si no existen y si es primera ejecución siembra productos de ejemplo.
- [backend/src/database/init.sql](backend/src/database/init.sql): SQL raw de inicialización (script histórico/auxiliar).

**Archivos generados / build artefacts**
- [dist_build/](dist_build/) y [dist/](dist/): builds generados por Angular. No forman parte del origen activo; se regeneran con `npm run build`.

## 4. Archivos detectados como potencialmente huérfanos o redundantes

- [src/app/app-routing/app-routing.module.ts](src/app/app-routing/app-routing.module.ts): Este módulo de rutas (NgModule clásico) no se usa en el arranque actual porque la app usa `provideRouter(routes)` en [src/app/app.config.ts](src/app/app.config.ts) (las rutas están en [src/app/app.routes.ts](src/app/app.routes.ts)). Evidencia: no hay imports de `AppRoutingModule` en el código fuente (solo aparece en caches de compilación y archivos .ngtypecheck). Recomendación: eliminar o consolidar rutas para evitar confusión.

- [backend/.env](backend/.env): existe pero el servidor carga explícitamente `env.env` (ver [backend/src/server.js](backend/src/server.js)), por lo que `.env` aparentemente no se usa. Recomendación: eliminar o documentar su propósito.

- Carpeta `.angular/` y `node_modules/`, `dist/`, `dist_build/`: son artefactos y no deben versionarse.

## 5. Observaciones de seguridad y recomendaciones

- Las credenciales de PayPal están en [backend/env.env](backend/env.env). Evitar dejarlas en repositorios; usar mecanismos seguros (variables de entorno en el host o secret manager) y rotarlas si el repo es compartido.
- `venta.service.js` actualiza `inStock` restando cantidades: su lógica está implementada en la DB pero conviene revisar concurrencia/validación en escenarios reales.

## 6. Flujo detallado de una compra (paso a paso, con archivos involucrados)

1. Usuario en UI añade productos: `ProductoCardComponent` llama `ProductoService.addToCart()` → estado en memoria y `localStorage` (ver [src/app/Servicios/producto.service.ts](src/app/Servicios/producto.service.ts)).
2. Usuario abre `CarritoComponent` que calcula totales con `getCartSummary()`.
3. Al confirmar compra, `CarritoComponent` muestra `PaypalComponent`.
4. `PaypalComponent` carga SDK de PayPal; obtiene `client-id` llamando a `PaypalService.getClientId()` → `GET /api/paypal/client-id` (backend: [backend/src/router/paypal.router.js](backend/src/router/paypal.router.js) → `router.get('/client-id'...)`).
5. SDK inicia flujo de pago en cliente; al crear orden el frontend ejecuta `POST /api/paypal/create-order` (`PaypalService.crearOrden`) → backend controller `paypal.controller.createOrder` → `services/paypal.service.createPaypalOrder` que llama a la API de PayPal. Backend guarda temporalmente `orderId -> items` en un `Map` en memoria.
6. Tras aprobación por PayPal, frontend invoca `POST /api/paypal/capture-order` (`PaypalService.capturarOrden`) → backend captura la orden con `services/paypal.service.capturePaypalOrder`, extrae items (si es necesario) y llama a `venta.service.saveVenta(...)` para persistir la venta y actualizar stock.
7. Backend responde al frontend; el frontend limpia el carrito (`ProductoService.clearCart()`) y el usuario puede descargar el XML (generado por `CarritoService.generateXML()` si así está implementado en el flujo de UI).

## 7. Acciones recomendadas (prioritarias)

1. Eliminar o fusionar [src/app/app-routing/app-routing.module.ts](src/app/app-routing/app-routing.module.ts) (actualmente redundante) para evitar confusión.
2. Eliminar [backend/.env](backend/.env) si no se usa; documentar dónde deben colocarse credenciales (`backend/env.env` actualmente usado por `server.js`).
3. Mover credenciales sensibles fuera del repositorio o enmascararlas en controles de versión; usar variables de entorno del entorno de despliegue.
4. Añadir pruebas básicas al backend (endpoints PayPal y productos) y manejar errores de red/PayPal de forma robusta.

## 8. Inventario breve (lista de archivos principales)

Vea la estructura del repo (archivos más relevantes):

- [angular.json](angular.json)
- [package.json](package.json)
- [README.md](README.md)
- [CLAUDE.md](CLAUDE.md)
- [src/main.ts](src/main.ts)
- [src/environments/environment.ts](src/environments/environment.ts)
- [src/app/app.config.ts](src/app/app.config.ts)
- [src/app/app.ts](src/app/app.ts)
- [src/app/app.routes.ts](src/app/app.routes.ts)
- [src/app/app-routing/app-routing.module.ts](src/app/app-routing/app-routing.module.ts) (posible redundancia)
- [src/app/Componentes/Catalogo/*](src/app/Componentes/Catalogo/catalogo.ts)
- [src/app/Componentes/ProductoCard/*](src/app/Componentes/ProductoCard/producto-card.ts)
- [src/app/Componentes/Carrito/*](src/app/Componentes/Carrito/carrito.ts)
- [src/app/Componentes/PayPal/*](src/app/Componentes/PayPal/paypal.ts)
- [src/app/Servicios/producto.service.ts](src/app/Servicios/producto.service.ts)
- [src/app/Servicios/paypal.service.ts](src/app/Servicios/paypal.service.ts)
- [src/app/Servicios/carrito.service.ts](src/app/Servicios/carrito.service.ts)
- [backend/src/server.js](backend/src/server.js)
- [backend/src/app.js](backend/src/app.js)
- [backend/src/routes/producto.routes.js](backend/src/routes/producto.routes.js)
- [backend/src/router/paypal.router.js](backend/src/router/paypal.router.js)
- [backend/src/controller/paypal.controller.js](backend/src/controller/paypal.controller.js)
- [backend/src/services/paypal.service.js](backend/src/services/paypal.service.js)
- [backend/src/services/venta.service.js](backend/src/services/venta.service.js)
- [backend/env.env](backend/env.env) (contiene PAYPAL_CLIENT_ID/SECRET — rotar si es público)

---

Si quieres, puedo:

- Generar un inventario JSON más detallado con referencias por archivo (referencias entrantes/salientes) para revisión automática.
- Quitar/archivar los archivos huérfanos propuestos (`app-routing.module.ts`, `backend/.env`) en una rama y dejar un commit preparado.

¿Qué prefieres que haga a continuación?
