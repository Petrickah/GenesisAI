import { z } from "zod";

const BaseKrakoanNodeSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any())
})

export const KrakoanNodeSchema = BaseKrakoanNodeSchema.extend({
  body: z.array(z.lazy((): z.ZodObject => KrakoanNodeSchema)),
});

export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;

const KrakoanInstructionSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).default({}),
  next: z.array(z.number())
});

export const KrakoanProgramSchema = z.object({
  entry: z.number(),
  symbols: z.record(z.string(), z.number()).optional().default({}),
  text: z.any(),
  code: z.record(z.number(), KrakoanInstructionSchema)
}).nullable();

export type KrakoanProgram = z.infer<typeof KrakoanProgramSchema>;
export type KrakoanInstruction = z.infer<typeof KrakoanInstructionSchema>;