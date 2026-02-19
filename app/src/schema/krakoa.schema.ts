// schema.ts
import { z } from "zod";

const MetadataSchema = z.object({
  known: z.boolean(),
  timestamp: z.number(),
});

// Schema pentru noduri standard (Magneto, Wade, etc.)
const BaseNodeSchema = z.object({
  type: z.string(),
  body: z.array(z.any()).default([]), // Forțăm un array gol implicit
  tags: z.array(z.string()).nullable().default(null),
  params: z.record(z.string(), z.any()).default({}), // Forțăm un obiect implicit
  metadata: MetadataSchema,
});

// Schema specifică pentru Trigger (➔)
const ActionPathSchema = BaseNodeSchema.extend({
  type: z.literal(":trigger"),
  params: z.object({
    id: z.string().optional(), // Adăugăm id opțional și aici ca să nu crape TS
    from: z.any().optional(),
    to: z.any(),
  }),
});

export const KrakoanNodeSchema = z.union([ActionPathSchema, BaseNodeSchema]);
export type KrakoanNode = z.infer<typeof KrakoanNodeSchema>;