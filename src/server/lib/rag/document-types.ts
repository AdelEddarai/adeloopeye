import { RagDocumentSourceType } from '@/generated/prisma/client';

type RagDocument = {
  sourceType: RagDocumentSourceType;
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
};

export type { RagDocument };
