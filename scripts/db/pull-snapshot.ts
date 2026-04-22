import { pathToFileURL } from 'node:url';

import { downloadAsset, fetchRelease } from './lib/release';
import { SNAPSHOT_DUMP, SNAPSHOT_META } from './manifest';

export async function pullSnapshot() {
  const release = await fetchRelease();
  const dump = release.assets.find(asset => asset.name === SNAPSHOT_DUMP);
  const meta = release.assets.find(asset => asset.name === SNAPSHOT_META);
  if (!dump || !meta) {
    throw new Error(`Release ${release.tag_name} is missing snapshot assets`);
  }
  await downloadAsset(meta);
  await downloadAsset(dump);
  return release.html_url;
}

async function main() {
  const url = await pullSnapshot();
  console.log(`Downloaded latest snapshot from ${url}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  void main();
}
