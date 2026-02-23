import esbuild from 'esbuild'
import path from 'path';
import z from 'zod';
import { KrakoanProgramSchema } from '../schema/krakoa.schema.js';

export default async function krakoa(input: string, isPath: boolean = true) {
  try {
    let rawSourceCode: string = input;

    if (isPath) {
      const fileName = path.basename(input);
      if (!fileName.endsWith('.ksl')) return;

      const result = await esbuild.build({
        entryPoints: [input],
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'node',
        loader: { '.ksl': 'ts' }
      });

      rawSourceCode = result.outputFiles[0]?.text || '';
    }

    if (!rawSourceCode) {
      throw new Error("The .ksl file must have an export default k`...`");
    }

    const rawModule = await import(`data:text/javascript;base64,${Buffer.from(rawSourceCode).toString('base64')}`);
    return KrakoanProgramSchema.parse(rawModule.default);
  } catch(error: any) {
    if (error instanceof z.ZodError) {
      console.error(`⚠️ Schema mismatch: ${z.treeifyError(error)}`);
    } else {
      console.error(`⚠️ System error: ${input}:${error.location?.start.line || 0}:${error.location?.start.column || 0}: ${error.message}`);
    }
  }
}