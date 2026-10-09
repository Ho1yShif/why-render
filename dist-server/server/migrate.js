import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './db.js';
import { defaultContent } from './content.js';
export async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(63829144)');
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
        const directory = join(process.cwd(), 'db', 'migrations');
        const files = (await readdir(directory))
            .filter((file) => /^\d+_.+\.sql$/.test(file))
            .sort();
        for (const file of files) {
            const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
            if (applied.rowCount)
                continue;
            await client.query(await readFile(join(directory, file), 'utf8'));
            await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
            console.log('Applied migration', file);
        }
        for (const [key, html] of Object.entries(defaultContent)) {
            await client.query('INSERT INTO content_blocks (key, html) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, html]);
        }
        await client.query('COMMIT');
        console.log('Migrations and default content ready');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
if (process.argv[1]?.endsWith('/migrate.js') || process.argv[1]?.endsWith('/migrate.ts')) {
    migrate()
        .catch((error) => {
        console.error('Migration failed:', error);
        process.exitCode = 1;
    })
        .finally(() => pool.end());
}
