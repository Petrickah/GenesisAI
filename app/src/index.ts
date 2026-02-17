import parser from "./grammar/grammar.cjs";
import { KrakoaProgramSchema } from "./schema/krakoa.schema.js";

const rawCode = `👤 ("Wade Wilson") [mutant] { 🛡️ (STANCE) [defensive]; }`;

try {
  // 1. Parsare (transformă string în obiecte "any")
  const rawAst = parser.parse(rawCode);

  // 2. Validare (Zod verifică dacă obiectele respectă regulile și le dă TIPURI)
  const program = KrakoaProgramSchema.parse(rawAst);

  // Acum 'program' este perfect tipizat!
  console.log("💎 Program validat:", program[0].id); 
  
} catch (e) {
  // Aici gestionezi ori eroarea de la Peggy, ori cea de la Zod
  console.error("❌ Validarea a eșuat:", e);
}