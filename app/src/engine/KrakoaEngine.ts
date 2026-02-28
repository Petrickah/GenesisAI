/**
 * Krakoa Script Engine Loader
 * 
 * Handles the loading, transpilation (via esbuild), and dynamic importation
 * of .ksl (Krakoan Script Language) files.
 */

import esbuild from 'esbuild'
import path from 'path';
import z from 'zod';
import { KrakoanProgramSchema, type KrakoanProgram } from '../schema/krakoa.schema.js';

/**
 * Loads and compiles a Krakoan script into a usable KrakoanProgram IR.
 * 
 * @param input - The file path or raw source code.
 * @param isPath - Whether the input should be treated as a file path.
 * @returns A promise resolving to a KrakoanProgram or null if validation fails.
 */
export default async function krakoa(input: string, isPath: boolean = true) : Promise<KrakoanProgram> {
  try {
    let rawSourceCode: string = input;

    if (isPath) {
      const fileName = path.basename(input);
      if (!fileName.endsWith('.ksl')) return null;

      // Bundle and transpile the .ksl (TypeScript-based) into standard ESM
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
      throw new Error("The .ksl file must have an export default k`...` or provided source is empty.");
    }

    // Dynamic import via base64 data URI to load the transpiled module into memory
    const rawModule = await import(`data:text/javascript;base64,${Buffer.from(rawSourceCode).toString('base64')}`);
    
    // Validate the module's default export against the KrakoanProgram schema
    return KrakoanProgramSchema.parse(rawModule.default);
  } catch(error: any) {
    if (error instanceof z.ZodError) {
      console.error(`⚠️ Schema mismatch: ${z.treeifyError(error)}`);
    } else {
      console.error(`⚠️ System error: ${input}:${error.location?.start.line || 0}:${error.location?.start.column || 0}: ${error.message}`);
    }
    return null;
  }
}
