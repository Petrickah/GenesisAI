import { z } from "zod";

// 1. Definim membrii tag-urilor (ca să nu mai avem "pește stricat")
const TagMemberSchema = z.union([
  z.string(),
  z.object({ type: z.literal("#"), value: z.string() }),
  z.object({ type: z.literal("@"), id: z.string() }),
  z.object({
    type: z.literal("::"),
    root: z.string(),
    members: z.array(z.string())
  })
]);

const TagObjectSchema = z.object({
  type: z.literal(":tag"),
  members: z.array(TagMemberSchema)
});

// 2. Folosim z.lazy pentru a permite nodurilor să aibă body-uri cu alte noduri
const NodeBase = z.lazy((): z.ZodObject => z.object({
  type: z.string(),
  body: z.array(KrakoanNodeSchema).default([]), // Recursivitate aici
  tags: z.union([TagObjectSchema, z.null(), z.array(z.any())]).optional().default(null),
  params: z.record(z.string(), z.any()).default({}),
  metadata: z.object({
    known: z.boolean(),
    timestamp: z.number(),
  }),
}));

// 3. Schema specifică pentru Trigger (➔)
const ActionPathSchema = z.object({
  type: z.literal(":trigger"),
  body: z.array(NodeBase).default([]),
  tags: z.union([TagObjectSchema, z.null(), z.array(z.any())]).optional().default([]),
  params: z.object({
    id: z.string().optional(),
    from: z.any().optional(),
    to: z.any().optional(),
  }),
  metadata: z.object({
    known: z.boolean(),
    timestamp: z.number(),
  }),
});

// 4. Aceasta este uniunea care definește UN SINGUR NOD
export const KrakoanNodeSchema = z.union([ActionPathSchema, NodeBase]);
export const KrakoanProgramASTSchema = z.array(KrakoanNodeSchema);

export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;

const InstructionSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).nullable().default(null),
  next: z.union([z.number(), z.array(z.number())])
});

const KrakoanProgramSchema = z.object({
  entry: z.number(),
  text: z.record(z.number(), z.any()).default({}),
  code: z.record(z.number(), InstructionSchema)
}).nullable();

export type KrakoanProgram = z.infer<typeof KrakoanProgramSchema>;