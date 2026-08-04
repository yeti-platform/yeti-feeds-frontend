# Frontend agent instructions

These instructions extend the workspace-level `../AGENTS.md` for the
`yeti-feeds-frontend` repository.

## Project map

- `src/views`: route-level views.
- `src/components`: reusable UI components.
- `src/composables`: shared Vue composition logic.
- `src/store`: Pinia stores.
- `src/services`: API adapters, generated schema, and ergonomic type aliases.
- `src/router`: application routing.
- `tests/e2e`: Playwright browser tests with mocked `/api/v2/**` responses.

Use Vue 3 composition patterns already present in nearby files and Vuetify
components before adding new UI abstractions. Preserve accessibility roles and
labels because the browser tests rely on the accessible interface.

## Toolchain and commands

Use Node.js 24 and npm. `package-lock.json` is canonical; do not mix package
managers or replace the lock file.

- Install: `npm ci`
- Development server: `npm run dev`
- Non-mutating lint: `npm run lint:check`
- Auto-fix lint: `npm run lint`
- Type check: `npm run typecheck`
- Production build: `npm run build`
- Browser tests: `npm run test:e2e`
- Interactive browser tests: `npm run test:e2e-ui`

Use `lint:check` for validation. The plain `lint` command changes files.

## Frontend boundaries

- `src/services/api-schema.d.ts` is generated from the backend OpenAPI document.
  Never hand-edit it. Start a compatible local backend and run
  `npm run generate-api` when the contract intentionally changes.
- Import ergonomic aliases from `src/services/types.ts` instead of repeatedly
  indexing generated `components` types.
- Type checking and linting are ratchets. Lower `.typecheck-baseline` or
  `.lint-baseline` when errors are removed; never increase either baseline to
  admit new errors.
- Playwright tests in this repository mock the backend. For contract, auth, or
  persistence behavior, also run the real-stack suite in `yeti-docker`.
- Ask before adding dependencies or making broad changes to shared styles,
  routing, authentication, or generated API contracts.
