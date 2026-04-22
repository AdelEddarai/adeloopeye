import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { SNAPSHOT_DIR, SNAPSHOT_OWNER, SNAPSHOT_REPO, SNAPSHOT_TAG } from '../manifest';

type ReleaseAsset = {
  browser_download_url: string;
  name: string;
};

type ReleaseInfo = {
  assets: ReleaseAsset[];
  html_url: string;
  tag_name: string;
};

export async function fetchRelease() {
  const url = `https://api.github.com/repos/${SNAPSHOT_OWNER}/${SNAPSHOT_REPO}/releases/tags/${SNAPSHOT_TAG}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch public snapshot release (${response.status})`);
  }
  return (await response.json()) as ReleaseInfo;
}

export async function downloadAsset(asset: ReleaseAsset) {
  const outputPath = path.join(process.cwd(), SNAPSHOT_DIR, asset.name);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const response = await fetch(asset.browser_download_url);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${asset.name} (${response.status})`);
  }
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(outputPath));
  return outputPath;
}
