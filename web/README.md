# Web

React workspace for staff, manager, and admin dashboards covering workflow operations, governance, reporting, and audit visibility.

## Runtime config

- `VITE_API_BASE_URL` is required for production-like runs.
- `VITE_ENABLE_DEMO_MODE=true` enables the demo client intentionally.
- `VITE_ENABLE_API_FALLBACK=true` allows HTTP failures to fall back to demo data; leave this disabled in production.
