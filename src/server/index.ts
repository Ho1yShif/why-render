import express from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { pool } from './db.js';

type ContentRow = { key: string; html: string; updated_at: Date };
const dist = join(process.cwd(), 'dist');
const template = parse(await readFile(join(dist, 'index.html'), 'utf8'));
const slots: { key: string; fallback: string; marker: string }[] = [];

for (const element of template.querySelectorAll('[data-content]')) {
  const key = element.getAttribute('data-content');
  if (!key) continue;
  const marker = `__CONTENT_SLOT_${slots.length}__`;
  slots.push({ key, fallback: element.innerHTML, marker });
  element.set_content(marker);
}

const markedHtml = template.toString();
const pieces: string[] = [];
let cursor = 0;
for (const slot of slots) {
  const location = markedHtml.indexOf(slot.marker, cursor);
  if (location < 0) throw new Error(`Content marker missing: ${slot.key}`);
  pieces.push(markedHtml.slice(cursor, location));
  cursor = location + slot.marker.length;
}
pieces.push(markedHtml.slice(cursor));

function renderPage(rows: ContentRow[]): string {
  const values = new Map(rows.map((row) => [row.key, row.html]));
  let html = pieces[0];
  for (let index = 0; index < slots.length; index++) {
    // Seeded HTML is repo-controlled. Sanitize values before any future editing UI.
    html += (values.get(slots[index].key) ?? slots[index].fallback) + pieces[index + 1];
  }
  return html;
}

const app = express();
app.disable('x-powered-by');
app.use((_request, response, next) => {
  response.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.get('/health', (_request, response) => response.type('text/plain').send('ok'));
app.get('/api/content', async (_request, response) => {
  try {
    const result = await pool.query<ContentRow>('SELECT key, html, updated_at FROM content_blocks ORDER BY key');
    response.json({ blocks: result.rows.map(({ key, html, updated_at }) => ({
      key, html, updatedAt: updated_at.toISOString(),
    })) });
  } catch (error) {
    console.error('Content API database error:', error);
    response.status(503).json({ error: 'Content database unavailable' });
  }
});

app.use('/assets', express.static(join(dist, 'assets'), {
  immutable: true,
  maxAge: '1y',
  fallthrough: false,
}));
app.use(express.static(dist, { index: false }));

app.get('/', async (_request, response) => {
  try {
    const result = await pool.query<ContentRow>('SELECT key, html, updated_at FROM content_blocks');
    response.type('html').send(renderPage(result.rows));
  } catch (error) {
    console.error('Page database error:', error);
    response.status(503).type('html').send('<!doctype html><html><head><title>Temporarily unavailable</title></head><body><h1>Temporarily unavailable</h1><p>The content database is unavailable. Please try again shortly.</p></body></html>');
  }
});

const port = Number(process.env.PORT || 4173);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Web service listening on 0.0.0.0:${port}`);
});

process.on('SIGTERM', () => {
  server.close(async (error) => {
    if (error) console.error('HTTP shutdown error:', error);
    await pool.end();
    process.exit(error ? 1 : 0);
  });
});
