import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function build(output = new URL('../dist/', import.meta.url)) {
  // Only this generated output directory is cleared. Never publish the repository root.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const root = new URL('../', import.meta.url);
  for (const name of ['index.html', 'src', 'public']) {
    await cp(new URL(name, root), path.join(fileURLToPath(output), name), {
      recursive: true,
      dereference: false,
    });
  }
  await writeFile(new URL('.nojekyll', output), '');
  console.log(`Built static site: ${fileURLToPath(output)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
