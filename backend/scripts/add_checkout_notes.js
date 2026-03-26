import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../src/.env') });

console.log('Script started...');

(async () => {
    try {
        console.log('Importing database config...');
        const dbModule = await import('../src/config/db.js');
        const db = dbModule.default;
        console.log('Database module loaded.');

        const sql = `
      ALTER TABLE visitor_log
      ADD COLUMN checkout_notes TEXT DEFAULT NULL;
    `;

        console.log('Running migration query...');

        db.query(sql, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column checkout_notes already exists. Skipping.');
                } else {
                    console.error('Migration failed:', err.message);
                    process.exit(1);
                }
            } else {
                console.log('Migration successful. Column added.');
            }

            db.end();
            process.exit(0);
        });
    } catch (error) {
        console.error('Script error:', error);
    }
})();
