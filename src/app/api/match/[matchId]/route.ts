import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getMatchRegistry } from "@/services/match/matchRegistry";
import {
  cacheMatchSnapshot,
  consumeStaleFallback,
} from "@/services/runtime/snapshotCache";

function normalizeFormat(format?: string): "T20" | "ODI" | "TEST" {
  const value = format?.trim().toUpperCase();
  if (value === "ODI" || value === "TEST" || value === "T20") return value;
  return "T20";
}

function buildUnstartedState(input: {
  runtimeMatchId: string;
  format?: string;
  teamAName?: string | null;
  teamBName?: string | null;
}) {
  const teamAName = input.teamAName?.trim() || "Team A";
  const teamBName = input.teamBName?.trim() || "Team B";

  return {
    matchId: input.runtimeMatchId,
    format: normalizeFormat(input.format),
    configOvers: null,
    innings: [
      {
        runs: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        overs: {},
        battingTeam: teamAName,
        bowlingTeam: teamBName,
        completed: false,
        striker: "",
        nonStriker: "",
        lastDismissedBatsman: "",
        currentBowler: "",
        bowlingStats: {},
        battingRecords: [],
        nextBatsmanIndex: 2,
        battingOrder: [],
      },
      {
        runs: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        overs: {},
        battingTeam: teamBName,
        bowlingTeam: teamAName,
        completed: false,
        striker: "",
        nonStriker: "",
        lastDismissedBatsman: "",
        currentBowler: "",
        bowlingStats: {},
        battingRecords: [],
        nextBatsmanIndex: 2,
        battingOrder: [],
      },
    ],
    currentInningsIndex: 0,
    activeBranchId: "main",
    branches: ["main"],
    commentary: [],
    teamA: { name: teamAName, squad: [] },
    teamB: { name: teamBName, squad: [] },
    tossWinner: teamAName,
    decision: "BAT" as const,
    matchEnded: false,
    winner: null,
    winBy: null,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: "Invalid matchId" },
        { status: 400 }
      );
    }

    const storage = new RedisSimulationStorage();
    const [data, registry] = await Promise.all([
      storage.load(matchId),
      getMatchRegistry(matchId),
    ]);

    if (!data) {
      const stale = consumeStaleFallback(matchId);
      if (stale) {
        return NextResponse.json({
          success: true,
          match: stale.state,
          runtime: {
            isRunning: false,
            isPaused: false,
            speed: 1500,
          },
          registry,
          staleSnapshot: true,
          staleBadge: "STALE",
          staleLastUpdatedAt: new Date(stale.cachedAt).toISOString(),
        });
      }

      const hostedMatch = await prisma.hostedMatch.findFirst({
        where: {
          OR: [{ runtimeMatchId: matchId }, { id: matchId }],
        },
        include: {
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
        },
      });

      if (!hostedMatch) {
        return NextResponse.json(
          { success: false, message: "Match not found" },
          { status: 404 }
        );
      }

      const runtimeMatchId = hostedMatch.runtimeMatchId?.trim() || null;
      if (runtimeMatchId && runtimeMatchId !== matchId) {
        const [runtimeData, runtimeRegistry] = await Promise.all([
          storage.load(runtimeMatchId),
          getMatchRegistry(runtimeMatchId),
        ]);

        if (runtimeData) {
          cacheMatchSnapshot(
            runtimeMatchId,
            runtimeData.state,
            runtimeRegistry?.sourceType ??
              (runtimeRegistry?.type === "LIVE" ? "LIVE" : "SIMULATION")
          );

          return NextResponse.json({
            success: true,
            match: runtimeData.state,
            runtime: runtimeData.control ?? {
              isRunning: false,
              isPaused: false,
              speed: 1500,
            },
            registry: runtimeRegistry,
            resolvedRuntimeMatchId: runtimeMatchId,
          });
        }

        const runtimeStale = consumeStaleFallback(runtimeMatchId);
        if (runtimeStale) {
          return NextResponse.json({
            success: true,
            match: runtimeStale.state,
            runtime: {
              isRunning: false,
              isPaused: false,
              speed: 1500,
            },
            registry: runtimeRegistry,
            staleSnapshot: true,
            staleBadge: "STALE",
            staleLastUpdatedAt: new Date(runtimeStale.cachedAt).toISOString(),
            resolvedRuntimeMatchId: runtimeMatchId,
          });
        }
      }

      return NextResponse.json({
        success: true,
        match: buildUnstartedState({
          runtimeMatchId: runtimeMatchId ?? matchId,
          format: hostedMatch.format,
          teamAName: hostedMatch.teamA?.name,
          teamBName: hostedMatch.teamB?.name,
        }),
        runtime: {
          isRunning: false,
          isPaused: false,
          speed: 1500,
        },
        registry: null,
        hostedMatchId: hostedMatch.id,
        resolvedRuntimeMatchId: runtimeMatchId,
        started: Boolean(runtimeMatchId),
      });
    }

    cacheMatchSnapshot(
      matchId,
      data.state,
      registry?.sourceType ?? (registry?.type === "LIVE" ? "LIVE" : "SIMULATION")
    );

    return NextResponse.json({
      success: true,
      match: data.state,
      runtime: data.control ?? {
        isRunning: false,
        isPaused: false,
        speed: 1500,
      },
      registry,
    });
  } catch (error) {
    console.error("❌ API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
