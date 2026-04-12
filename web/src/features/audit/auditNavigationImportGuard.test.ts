import { readdir, readFile } from 'fs/promises';
import path from 'path';

import { describe, expect, it } from 'vitest';

const auditFeatureDir = path.resolve(process.cwd(), 'src/features/audit');
const srcRoot = path.resolve(auditFeatureDir, '..', '..');
const allowedDirectImportFiles = new Set([
  path.resolve(auditFeatureDir, 'auditNavigation.ts'),
  path.resolve(auditFeatureDir, 'AuditTargetActionLink.tsx'),
]);
const restrictedImportPatterns = [
  './auditRouteState',
  './auditTargets',
  './AuditTargetActionLink',
  '../audit/auditRouteState',
  '../audit/auditTargets',
  '../audit/AuditTargetActionLink',
  '../../features/audit/auditRouteState',
  '../../features/audit/auditTargets',
  '../../features/audit/AuditTargetActionLink',
];

describe('audit navigation import guard', () => {
  it('prevents direct imports of audit internals outside the shared entry points', async () => {
    const files = await listSourceFiles(srcRoot);
    const violations: string[] = [];

    for (const file of files) {
      if (allowedDirectImportFiles.has(file)) {
        continue;
      }

      const content = await readFile(file, 'utf8');

      for (const importPath of restrictedImportPatterns) {
        if (content.includes(`from '${importPath}'`) || content.includes(`from "${importPath}"`)) {
          violations.push(`${path.relative(srcRoot, file)} -> ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}
