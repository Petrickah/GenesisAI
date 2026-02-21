import esbuild from 'esbuild'
import path from 'path';
import z from 'zod';

export default async function krakoa(filePath: string) {
  const fileName = path.basename(filePath);
  if (!fileName.endsWith('.kts')) return;

  try {
    const result = await esbuild.build({
      entryPoints: [filePath],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      loader: { '.kts': 'ts' }
    });

    const rawSourceCode = result.outputFiles[0]?.text;
    if(!rawSourceCode) {
      throw new Error("The .kts file must have an export default k`...`");
    }

    const rawModule = await import(`data:text/javascript;base64,${Buffer.from(rawSourceCode).toString('base64')}`);
    return rawModule.default;

  } catch(error: any) {
    if (error instanceof z.ZodError) {
      console.error('⚠️ Schema mismatch:', JSON.stringify(error.format(), null, 2));
    } else {
      //const shortMessage = error.message?.substring(0, 200);
      console.error('⚠️ System error:', error.message);
    }
  }
}