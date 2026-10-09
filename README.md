# Render for OpenAI FDEs

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Ho1yShif/why-render)

An unofficial explainer for OpenAI forward-deployed engineers shipping customer apps and agents on Render. The page loads no remote assets or trackers.

## Architecture

A Node web service (Starter) renders page copy from Render Postgres (Basic 256 MB) on each request. Both paid resources run in Oregon in one project environment and connect over Render's private network. `GET /api/content` exposes the blocks as JSON. The pre-deploy command applies forward-only SQL migrations and inserts missing default blocks without overwriting existing content.

## Local development

Set `DATABASE_URL` to a local PostgreSQL connection URL, then:

```bash
npm ci
npm run build
npm run migrate
npm run dev
```

`npm run dev` runs Vite in build-watch mode alongside the TypeScript server in watch mode. Open http://localhost:4173. Run `npm run migrate` again after adding a migration. `npm run typecheck` and `npm run build` check the application; `npm start` serves a built application. `GET /health` returns `ok` without querying Postgres.

Deploy using the button above. Its Blueprint provisions paid plans. After the new `why-render-web` service is live, the old static site `fde-render-explainer` can be deleted from the Dashboard; Blueprint sync does not delete it.
