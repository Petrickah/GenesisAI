import * as dotenv from "dotenv";
import { z } from 'zod';

dotenv.config();

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OLLAMA_HOST_LOCAL: z.url({ message: "Trebuie să fie un URL valid pentru OLLAMA" }),
  DISCORD_API_KEY: z.string().min(10, { message: "API_KEY e prea scurtă" }),
  PORT: z.string({message: "Trebuie să fie un număr de port valid pentru Express"}),
  SURREALDB_URL: z.url({ message: "Trebuie să fie un URL valid pentru SurrealDB" }),
});

export type IEnvironment = z.infer<typeof EnvironmentSchema>;

// Validăm process.env față de schemă
const _env = EnvironmentSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Eroare la variabilele de mediu:', _env.error.format());
  process.exit(1); // Oprim aplicația dacă lipsește ceva critic
}

export const env = _env.data as IEnvironment;