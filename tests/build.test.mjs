import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, access, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build.mjs';

test('release contains only web files, clears stale files and resolves under project paths', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'emberfall-build-'));
  const output = pathToFileURL(directory + '/');
  try {
    await writeFile(new URL('stale.js', output), 'old');
    await build(output);
    assert.deepEqual((await readdir(output)).sort(), ['.nojekyll', 'index.html', 'public', 'src']);
    const html = await readFile(new URL('index.html', output), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
    for (const base of ['https://example.github.io/', 'https://example.github.io/diablo2/', 'https://example.github.io/different-repo/']) {
      for (const ref of refs) {
        const resolved = new URL(ref, base);
        assert.ok(resolved.href.startsWith(base), `${ref} escapes ${base}`);
        const relative = resolved.href.slice(base.length) || 'index.html';
        await access(new URL(relative, output));
      }
    }
    const main = await readFile(new URL('src/main.js', output), 'utf8');
    for (const match of main.matchAll(/from\s*['"]([^'"]+)['"]/g)) await access(new URL(match[1], new URL('src/main.js', output)));
    JSON.parse(await readFile(new URL('public/assets/catalog.json', output), 'utf8'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
