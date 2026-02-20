import { z } from "zod";

const ReferenceSchema = z.string().startsWith("@").transform((val) => {
  const cleanPath = val.slice(1);
  const segments = cleanPath.split("::");
  return {
    kind: "reference",
    original: val,
    segments: segments,
    root: segments[0],
    target: segments[segments.length - 1]
  };
});

const TagSchema = z.string().startsWith("#").transform((val) => {
  const cleanPath = val.slice(1);
  const segments = cleanPath.split("::");
  return {
    kind: "tag",
    original: val,
    segments: segments,
    root: segments[0],
    target: segments[segments.length - 1]
  };
});

const BaseKrakoanNodeSchema = z.object({
  type: z.string(),
  params: z.object({
    id: z.string().optional(),
    tags: z.array(z.union([TagSchema, ReferenceSchema])).default([]),
    timestamp: z.number().default(Date.now()),
    code: z.string().optional(),
    isComplex: z.boolean().optional(),
  })
})

export const KrakoanNodeSchema = BaseKrakoanNodeSchema.extend({
  body: z.array(z.lazy((): z.ZodObject => KrakoanNodeSchema)),
});

export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;

const InstructionSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).nullable().default(null),
  next: z.union([
    z.number(), 
    z.object({ then: z.number(), else: z.number() }) // <--- CALEA DE IEȘIRE
  ])
});

const KrakoanProgramSchema = z.object({
  entry: z.union([z.number(), z.array(z.number())]),
  text: z.record(z.number(), z.any()).default({}),
  code: z.record(z.number(), InstructionSchema)
}).nullable();

export type KrakoanProgram = z.infer<typeof KrakoanProgramSchema>;