import { prisma } from '@/server/lib/db';

import { generateEmbedding } from './embeddings';

export type DocumentMatch = {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

/**
 * Search for the most relevant documents using pgvector cosine similarity.
 */
export async function searchDocuments(
  conflictId: string,
  query: string,
  topK = 8,
): Promise<DocumentMatch[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRawUnsafe<DocumentMatch[]>(
    `SELECT
       id,
       "sourceType"::text AS "sourceType",
       "sourceId" AS "sourceId",
       content,
       metadata,
       1 - (embedding <=> $1::vector) AS similarity
     FROM "DocumentEmbedding"
     WHERE "conflictId" = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vectorLiteral,
    conflictId,
    topK,
  );

  return results;
}
