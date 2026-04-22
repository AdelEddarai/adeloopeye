import { pathToFileURL } from 'node:url';

import { checksum, readMetadata, snapshotPath } from './lib/metadata';
import { INCLUDED_TABLES, REQUIRED_TABLES, SNAPSHOT_DUMP, SNAPSHOT_TAG } from './manifest';

export async function verifySnapshot() {
  const metadata = await readMetadata();
  const digest = await checksum(snapshotPath(SNAPSHOT_DUMP));
  if (metadata.checksumSha256 !== digest) {
    throw new Error('Snapshot checksum mismatch');
  }
  if (metadata.releaseTag !== SNAPSHOT_TAG) {
    throw new Error(`Unexpected snapshot tag ${metadata.releaseTag}`);
  }
  for (const table of REQUIRED_TABLES) {
    if (!(table in metadata.rowCounts)) throw new Error(`Missing row count for ${table}`);
  }
  const expected = new Set<string>(INCLUDED_TABLES);
  for (const table of metadata.includedTables) {
    if (!expected.has(table)) throw new Error(`Unexpected table in metadata: ${table}`);
  }
  return metadata;
}

async function main() {
  const metadata = await verifySnapshot();
  console.log(`Verified snapshot from ${metadata.generatedAt}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}
