-- CreateTable
CREATE TABLE "public"."HostedMatch" (
    "id" TEXT NOT NULL,
    "externalMatchId" TEXT,
    "teamA" TEXT NOT NULL,
    "teamB" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIVE',
    "runtimeMatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostedMatch_externalMatchId_key" ON "public"."HostedMatch"("externalMatchId");
