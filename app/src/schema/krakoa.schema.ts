import { z } from "zod";

// Definim schema pentru o singură instrucțiune
export const InstructionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string().trim().min(1), // Emoji-ul (👤, 🛡️, etc.)
    id: z.string().min(1),          // Identificatorul (Wade Wilson, STANCE)
    params: z.record(z.string(), z.union([z.string(), z.number()])), // { status: "hungry" }
    tags: z.array(z.string()),      // [mutant, high_regen]
    children: z.array(InstructionSchema), // RECURSIVITATE! 🔄
    timestamp: z.number().default(() => Date.now()),
  })
);

// Schema pentru întregul program (o listă de instrucțiuni)
export const KrakoaProgramSchema = z.array(InstructionSchema);

// Extragem tipul TypeScript automat din schemă
export type Instruction = z.infer<typeof InstructionSchema>;
export type KrakoaProgram = z.infer<typeof KrakoaProgramSchema>;