# Web

React workspace for staff, manager, and admin dashboards covering workflow operations, governance, reporting, and audit visibility.

## Node runtime

- Use Node `22` LTS for this workspace.
- `web/.nvmrc` pins the expected major version.
- `web/package.json` declares the supported engine range as `^22.12.0 || ^24.0.0`.
- Node `23` is not a supported target for the current `vite`/`vitest` toolchain, even if some commands appear to work.

## Runtime config

- `VITE_API_BASE_URL` is required for production-like runs.
- `VITE_ENABLE_DEMO_MODE=true` enables the demo client intentionally.
- `VITE_ENABLE_API_FALLBACK=true` allows HTTP failures to fall back to demo data; leave this disabled in production.
