# Render for OpenAI FDEs

An unofficial, single-page explainer that makes the case for OpenAI forward-deployed engineers using Render to ship customer apps and agents. It covers private networking, end-to-end observability and example app architectures.

Built with Vite, vanilla TypeScript and hand-written CSS. It loads no remote assets and no trackers.

```bash
npm ci
npm run dev       # local dev server
npm run build     # type-check + build to dist/
npm run preview   # serve dist/

# production-style serve (binds $PORT, default 4173)
npm run build && npm start
```

`public/health` is served at `/health` (returns `ok`) for preview health checks.

Deploy: `render.yaml` defines a Render static site (`dist/`) inside the `fde-render-explainer` project's `production` environment.
