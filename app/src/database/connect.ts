import { Surreal, type RootAuth } from 'surrealdb';

const db = new Surreal();

async function main() {
    try {
        // Conectare la endpoint-ul Docker
        await db.connect('http://0.0.0.0:8000/rpc');

        // Autentificare (folosind datele din docker-compose)
        await db.signin(({
            username: 'root',
            password: 'root',
        }) as RootAuth);

        // Selectăm Namespace-ul și Baza de Date pentru GenesisAI
        await db.use({ namespace: 'genesis_nexus', database: 'krakoa_lore' });

        console.log("✅ Conexiune stabilită: GenesisAI este online în SurrealDB!");
    } catch (e) {
        console.error("❌ Eroare de conectare:", e);
    }
}

main();