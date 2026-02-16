import { Surreal } from 'surrealdb';

const db = new Surreal();

async function main() {
    try {
        // Conectare la endpoint-ul Docker
        await db.connect(`${process.env.SURREALDB_URL}`);

        // Autentificare (folosind datele din docker-compose)
        await db.signin({
            username: 'root',
            password: 'root',
        });

        // Selectăm Namespace-ul și Baza de Date pentru GenesisAI
        await db.use({ namespace: 'genesis_nexus', database: 'lore' });

        console.log("✅ Conexiune stabilită: GenesisAI este online în SurrealDB!");
    } catch (e) {
        console.error("❌ Eroare de conectare:", e);
    }
}

main();