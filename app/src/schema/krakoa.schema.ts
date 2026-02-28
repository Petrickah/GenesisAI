import { z } from "zod";

/**
 * Lambda Expression Schema
 * Represents the λ(...) blocks in the DSL
 */
export const KrakoanLambdaSchema = z.object({
  type: z.literal(":lambda"),
  code: z.string(),
}).strict();

/**
 * Poolable String
 * During compilation, strings are pooled and replaced by their index (number).
 * Schemas must accept both during the transition.
 */
const PoolableString = z.union([z.string(), z.number()]);

/**
 * Parameter Value Schema
 * Valid values for instruction parameters (e.g., id: "value", hp: λ(ctx.hp))
 */
const KrakoanValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  KrakoanLambdaSchema,
  z.array(z.any()),
  z.record(z.string(), z.any())
]);

/**
 * Tag / Reference Schema
 * Represents hashtags (#Tag) and references (@Path::To::Node)
 */
export const KrakoanTagsSchema = z.object({
  root: PoolableString,
  kind: z.union([z.literal('hashtag'), z.literal('reference'), z.literal('state')]),
  original: z.string().optional(),
  target: PoolableString.optional(),
  segments: z.array(z.union([
    PoolableString,
    z.object({
      kind: z.literal('hashtag'),
      root: PoolableString
    })
  ])).default([]),
  address: z.number().optional()
}).strict();

/**
 * Node Schema (AST)
 * Represents the structure returned by the Peggy.js parser
 */
export const KrakoanNodeSchema = z.object({
  type: z.string(), // AST always has string types
  params: z.record(z.string(), KrakoanValueSchema).default({}),
  body: z.array(z.lazy((): z.ZodObject<any> => KrakoanNodeSchema)).default([]),
  tags: z.array(KrakoanTagsSchema).default([]),
}).strict();

/**
 * Compiled Instruction Schema (IR)
 * Represents a single executable instruction in the VM
 */
export const KrakoanInstructionSchema = z.object({
  id: PoolableString.optional(),
  type: PoolableString,
  timestamp: z.number().default(() => Date.now()),
  params: z.record(z.string(), KrakoanValueSchema).default({}),
  tags: z.array(KrakoanTagsSchema).optional(),
  next: z.array(z.number()).min(1),
}).strict();


/**
 * Program Schema
 * The complete compiled IR bundle
 */
export const KrakoanProgramSchema = z.object({
  entry: z.number().nonnegative(),
  symbols: z.record(z.string(), z.number()).default({}),
  text: z.array(z.string()).default([]),
  code: z.record(z.coerce.number(), KrakoanInstructionSchema),
}).strict().nullable().optional();

/**
 * Execution Frame Info
 */
export const KrakoanInfoBaseSchema = z.object({
  instruction: KrakoanInstructionSchema,
  address: z.number().nonnegative(),
  next: z.number().nonnegative(),
}).strict();

export type KrakoanLambda = z.infer<typeof KrakoanLambdaSchema>;
export type KrakoanTags = z.infer<typeof KrakoanTagsSchema>;
export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;
export type KrakoanInstruction = z.infer<typeof KrakoanInstructionSchema>;
export type KrakoanProgram = z.infer<typeof KrakoanProgramSchema>;
export type KrakoanInfo = z.infer<typeof KrakoanInfoBaseSchema>;
export type KrakoanInfoNullable = KrakoanInfo | null;
