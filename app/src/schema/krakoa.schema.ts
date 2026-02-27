import { z } from "zod";

// Define more specific types for better type safety
const PoolValue = z.union([z.string(), z.number(), z.undefined()])
const KrakoanType = z.union([z.string(), z.literal('➔'), z.literal('🔗'), z.literal('💬'), z.literal('⚓')])
const KrakoanTagKind = z.union([z.literal('hashtag'), z.literal('reference'), z.literal('state')])

// More precise types for instruction parameters
const KrakoanParams = z.record(z.string(), z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.any()),
  z.record(z.any(), z.any())
]))

// Optimized tags schema with stricter validation
export const KrakoanTagsSchema = z.object({
  root: z.string(), // Always string for root references
  kind: KrakoanTagKind,
  original: z.string().optional(),
  target: z.string().optional(),
  segments: z.array(z.union([
    z.string(),
    z.object({
      kind: z.literal('hashtag'),
      root: z.string()
    })
  ])).default([]),
  address: z.number().optional()
}).strict()

// Optimized node schema with stricter validation
export const KrakoanNodeSchema = z.object({
  type: KrakoanType,
  params: KrakoanParams,
  body: z.array(z.lazy((): z.ZodObject => KrakoanNodeSchema)).default([]),
  tags: z.array(KrakoanTagsSchema).default([]),
}).strict()

// Optimized instruction schema
export const KrakoanInstructionSchema = z.object({
  id: z.string().optional(), // Can be string or number in practice
  type: KrakoanType,
  timestamp: z.number().optional().default(() => Date.now()),
  params: KrakoanParams.default({}),
  tags: z.array(KrakoanTagsSchema).optional(),
  next: z.array(z.number()).min(1, "At least one next instruction required"),
}).strict()

// Optimized program schema with proper text type
export const KrakoanProgramSchema = z.object({
  entry: z.number().nonnegative(),
  symbols: z.record(z.string(), z.number()).optional().default({}),
  text: z.record(z.number(), z.string()), // More specific than z.any()
  code: z.record(z.number(), KrakoanInstructionSchema),
}).strict().nullable()

// Optimized info schemas
export const KrakoanInfoBaseSchema = z.object({
  instruction: KrakoanInstructionSchema,
  address: z.number().nonnegative(),
  next: z.number().nonnegative(),
}).strict()

export const KrakoanInfoSchema = KrakoanInfoBaseSchema.nullable()

// Type exports
export type KrakoanTags = z.infer<typeof KrakoanTagsSchema>;
export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;
export type KrakoanInstruction = z.infer<typeof KrakoanInstructionSchema>;
export type KrakoanProgram = z.infer<typeof KrakoanProgramSchema>;
export type KrakoanInfo = z.infer<typeof KrakoanInfoBaseSchema>;
export type KrakoanInfoNullable = z.infer<typeof KrakoanInfoSchema>;