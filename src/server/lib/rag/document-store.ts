import type { Prisma } from '@/generated/prisma/client';

import { prisma } from '@/server/lib/db';

import { hashDocumentContent } from './content-hash';
import type { RagDocument } from './document-types';
import { generateEmbedding, generateEmbeddings } from './embeddings';

function formatVector(embedding: number[]) {
  return `[${embedding.join(',')}]`;
}

function toJsonValue(metadata: Record<string, unknown>): Prisma.InputJsonValue {
  return metadata as Prisma.InputJsonValue;
}

export async function removeDocument(conflictId: string, sourceType: string, sourceId: string) {
  await prisma.documentEmbedding.deleteMany({
    where: { conflictId, sourceType: sourceType as never, sourceId },
  });
}

export async function upsertDocument(conflictId: string, document: RagDocument) {
  const contentHash = hashDocumentContent(document.content);
  const existing = await prisma.documentEmbedding.findUnique({
    where: {
      conflictId_sourceType_sourceId: {
        conflictId,
        sourceType: document.sourceType,
        sourceId: document.sourceId,
      },
    },
    select: { id: true, contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    await prisma.documentEmbedding.update({
      where: { id: existing.id },
      data: { metadata: toJsonValue(document.metadata) },
    });
    return false;
  }

  const row = await prisma.documentEmbedding.upsert({
    where: {
      conflictId_sourceType_sourceId: {
        conflictId,
        sourceType: document.sourceType,
        sourceId: document.sourceId,
      },
    },
    create: {
      conflictId,
      sourceType: document.sourceType,
      sourceId: document.sourceId,
      content: document.content,
      contentHash,
      metadata: toJsonValue(document.metadata),
    },
    update: {
      content: document.content,
      contentHash,
      metadata: toJsonValue(document.metadata),
    },
    select: { id: true },
  });

  const embedding = await generateEmbedding(document.content);
  await prisma.$executeRawUnsafe(
    'UPDATE "DocumentEmbedding" SET embedding = $1::vector WHERE id = $2',
    formatVector(embedding),
    row.id,
  );

  return true;
}

export async function upsertDocumentBatch(
  conflictId: string,
  documents: RagDocument[],
  forceEmbed = false,
) {
  if (documents.length === 0) return 0;

  const hashes = documents.map(document => hashDocumentContent(document.content));
  const existing = await prisma.documentEmbedding.findMany({
    where: {
      conflictId,
      OR: documents.map(document => ({ sourceType: document.sourceType, sourceId: document.sourceId })),
    },
    select: { id: true, sourceType: true, sourceId: true, contentHash: true },
  });
  const existingByKey = new Map(existing.map(row => [`${row.sourceType}:${row.sourceId}`, row]));

  const documentsToEmbed = documents.filter((document, index) => {
    if (forceEmbed) return true;
    const existingRow = existingByKey.get(`${document.sourceType}:${document.sourceId}`);
    return existingRow?.contentHash !== hashes[index];
  });

  await Promise.all(documents.map((document, index) =>
    prisma.documentEmbedding.upsert({
      where: {
        conflictId_sourceType_sourceId: {
          conflictId,
          sourceType: document.sourceType,
          sourceId: document.sourceId,
        },
      },
      create: {
        conflictId,
        sourceType: document.sourceType,
        sourceId: document.sourceId,
        content: document.content,
        contentHash: hashes[index],
        metadata: toJsonValue(document.metadata),
      },
      update: {
        content: document.content,
        contentHash: hashes[index],
        metadata: toJsonValue(document.metadata),
      },
    }),
  ));

  if (documentsToEmbed.length === 0) return 0;

  const embeddings = await generateEmbeddings(documentsToEmbed.map(document => document.content));
  await Promise.all(documentsToEmbed.map((document, index) =>
    prisma.$executeRawUnsafe(
      `UPDATE "DocumentEmbedding"
       SET embedding = $1::vector
       WHERE "conflictId" = $2 AND "sourceType" = $3::"RagDocumentSourceType" AND "sourceId" = $4`,
      formatVector(embeddings[index]),
      conflictId,
      document.sourceType,
      document.sourceId,
    ),
  ));

  return documentsToEmbed.length;
}
