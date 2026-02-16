import { Surreal } from 'surrealdb';
import fs from 'fs';
import path from 'path';
import { env } from '../Environment.js';

async function deploy() {
    const db = new Surreal();
    try {
        await db.connect(`${env.SURREALDB_URL}`);
        await db.signin({ username: 'root', password: 'root' });
        await db.use({ namespace: 'genesis_nexus', database: 'krakoa_lore' });

        console.log("📡 Connected to the Database. Checking the schema integirty...");

        const schemaPath = path.join(__dirname, '../database/schema.surql');
        const schemaQueries = fs.readFileSync(schemaPath, 'utf8');

        await db.query(schemaQueries);

        console.log("✅ The Schema was applied / updated successfully with no data loss.");
    } catch (err) {
        console.error("❌ Eroare la deployment:", err);
    } finally {
        db.close();
    }
}

deploy();