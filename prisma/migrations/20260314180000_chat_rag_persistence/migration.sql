-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "RagDocumentSourceType" AS ENUM ('EVENT', 'XPOST', 'SNAPSHOT', 'ACTOR', 'STORY');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "AnonymousVisitor" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSessionMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatSessionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentEmbedding" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "sourceType" "RagDocumentSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousVisitor_tokenHash_key" ON "AnonymousVisitor"("tokenHash");

-- CreateIndex
CREATE INDEX "ChatSession_conflictId_visitorId_updatedAt_idx" ON "ChatSession"("conflictId", "visitorId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ChatSession_visitorId_updatedAt_idx" ON "ChatSession"("visitorId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ChatSessionMessage_sessionId_ord_key" ON "ChatSessionMessage"("sessionId", "ord");

-- CreateIndex
CREATE INDEX "ChatSessionMessage_sessionId_createdAt_idx" ON "ChatSessionMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentEmbedding_conflictId_sourceType_sourceId_key" ON "DocumentEmbedding"("conflictId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_conflictId_sourceType_idx" ON "DocumentEmbedding"("conflictId", "sourceType");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_conflictId_updatedAt_idx" ON "DocumentEmbedding"("conflictId", "updatedAt");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_embedding_idx" ON "DocumentEmbedding" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSessionMessage" ADD CONSTRAINT "ChatSessionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentEmbedding" ADD CONSTRAINT "DocumentEmbedding_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;
