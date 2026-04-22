import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SNAPSHOT_DIR, SNAPSHOT_META } from '../manifest';

export type SnapshotMetadata = {
  checksumSha256: string;
  excludedTables: readonly string[];
  formatVersion: 1;
  generatedAt: string;
  includedTables: readonly string[];
  latestMigration: string;
  releaseTag: string;
  repo: string;
  requiredTables: readonly string[];
  rowCounts: Record<string, number>;
};

export function snapshotPath(fileName: string) {
  return path.join(process.cwd(), SNAPSHOT_DIR, fileName);
}

export async function ensureSnapshotDir() {
  await mkdir(snapshotPath(''), { recursive: true });
}

export async function checksum(filePath: string) {
  const file = await readFile(filePath);
  return createHash('sha256').update(file).digest('hex');
}

export async function readMetadata() {
  const raw = await readFile(snapshotPath(SNAPSHOT_META), 'utf8');
  return JSON.parse(raw) as SnapshotMetadata;
}

export async function writeMetadata(metadata: SnapshotMetadata) {
  await ensureSnapshotDir();
  await writeFile(snapshotPath(SNAPSHOT_META), `${JSON.stringify(metadata, null, 2)}\n`);
}
