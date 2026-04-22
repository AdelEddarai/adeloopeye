-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('XPOST', 'NEWS_ARTICLE', 'OFFICIAL_STATEMENT', 'PRESS_RELEASE', 'ANALYSIS');

-- CreateEnum
CREATE TYPE "Affiliation" AS ENUM ('FRIENDLY', 'HOSTILE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'FAILED', 'PARTIAL', 'SKIPPED');

-- AlterTable
ALTER TABLE "Actor" ADD COLUMN     "affiliation" "Affiliation",
ADD COLUMN     "colorRgb" INTEGER[],
ADD COLUMN     "cssVar" TEXT,
ADD COLUMN     "mapGroup" TEXT,
ADD COLUMN     "mapKey" TEXT;

-- AlterTable
ALTER TABLE "XPost" ADD COLUMN     "postType" "PostType" NOT NULL DEFAULT 'XPOST',
ADD COLUMN     "tweetId" TEXT,
ADD COLUMN     "verificationResult" JSONB,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "xaiCitations" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Actor_mapKey_key" ON "Actor"("mapKey");

-- CreateIndex
CREATE UNIQUE INDEX "XPost_tweetId_key" ON "XPost"("tweetId");

-- CreateIndex
CREATE INDEX "XPost_verificationStatus_idx" ON "XPost"("verificationStatus");
