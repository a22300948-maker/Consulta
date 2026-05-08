# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working within this repository.

## Summary of the codebase
- **Frontend**: Angular 21‑based SPA located in the root (src/). Implements product listing, shopping cart, PayPal integration, and uses SQLite‑directly exposed via a REST API.
- **Backend**: Node.js/Express server in `backend/`. Provides two API groups:
  * `GET /api/productos` – list all products.
  * PayPal routes under `/api/paypal` for creating and capturing orders, plus `/client‑id` to expose the PayPal client ID.
- **Data store**: SQLite stored in `backend/src/database/database.db`, schema created via `database/initDb.js`.
- **Shared configuration**: Environment variables in `backend/env.env`.
- **Testing**: Angular unit tests run via Vitest (`npm test`). Backend has no tests.
- **Build artifacts**: `dist/` for the Angular build; backend runs directly from JavaScript.

## Common dev commands
| Purpose           | Command                                     |
|-------------------|---------------------------------------------|
| Install deps      | `npm install`                               |
| Run frontend dev  | `npm start` – forwards to `ng serve`        |
| Build frontend    | `npm run build` – `ng build` (default prod) |
| Watch build       | `npm run watch` – `ng build --watch`       |
| Run all tests     | `npm test` – runs Vitest on `src/**/*.spec.ts` |
| Run single test   | `npx vitest run --filter "Test description"` |
| Start backend     | `node backend/src/server.js` or `npm run start` in backend folder |
| Run backend test  | *(none; backend tests not defined)* |

## Notes for future contributors
- The Angular test environment is configured to use the global `vitest/globals`. Tests should import components within the `src` tree.
- PayPal integration expects the environment variables `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Exposing `/api/paypal/client-id` is safe for the front‑end.
- If adding new backend routes, remember to update the CORS policy in `app.js` and to create appropriate database operations.
- When making database changes, run `node backend/src/database/initDb.js` to regenerate the schema and seed data.
- Avoid modifying `node_modules`; consider using `npm install` to reinstall if necessary.
- To run the app with both the frontend and backend concurrently, you can use `pnpm -F` or employ separate terminal windows; no watch script is provided.

## Helpful aliases
- **Serve**: `npm start` (frontend). Backend requires `node backend/src/server.js` or `npm start` inside `backend` if a `scripts` section is added.
- **Build and clean**: `rimraf dist && npm run build` (front‑end).
- **Test a single spec**: `npx vitest run src/app/**/*.spec.ts --filter "product list"`.
