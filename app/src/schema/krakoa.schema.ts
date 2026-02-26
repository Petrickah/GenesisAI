import { z } from "zod";

const PoolValue = z.union([z.string(), z.number(), z.undefined()]);

export const KrakoanTagsSchema = z.object({
  root: PoolValue,
  kind: PoolValue,
  original: PoolValue,
  segments: z.array(z.union([PoolValue, z.any()])).default([]),
  target: z.union([PoolValue, z.any()]).default({}),
  address: z.number().optional()
});

export const KrakoanNodeSchema = z.object({
  type: PoolValue,
  params: z.record(z.string(), z.any()),
  body: z.array(z.lazy((): z.ZodObject => KrakoanNodeSchema)),
  tags: z.array(KrakoanTagsSchema).optional(),
});

export type KrakoanTags = z.infer<typeof KrakoanTagsSchema>;
export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;

export const KrakoanInstructionSchema = z.object({
  id: PoolValue,
  type: PoolValue, // Acum acceptă și indexul din textPool
  timestamp: z.number().optional().default(Date.now()),
  params: z.record(z.string(), z.any()).default({}),
  tags: z.array(KrakoanTagsSchema).optional(),
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

export const KrakoanInfoSchema = z.object({
  instruction: KrakoanInstructionSchema,
  address: z.number(),
  next: z.number()
}).nullable();

export type KrakoanInfo = z.infer<typeof KrakoanInfoSchema>;