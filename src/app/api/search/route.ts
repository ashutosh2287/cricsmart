import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;

  const [teams, players] = await Promise.all([
    prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: pattern, mode: "insensitive" } },
          { shortName: { contains: pattern, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, name: true, shortName: true, slug: true },
    }),
    prisma.playerProfile.findMany({
      where: {
        OR: [
          { displayName: { contains: pattern, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, displayName: true, role: true },
    }),
  ]);

  const results = [
    ...teams.map((t) => ({
      type: "team" as const,
      id: t.id,
      title: t.name,
      subtitle: t.shortName ?? "",
      href: `/teams/${t.slug}`,
    })),
    ...players.map((p) => ({
      type: "player" as const,
      id: p.id,
      title: p.displayName,
      subtitle: p.role ?? "Player",
      href: `/players/profiles/${p.id}`,
    })),
  ];

  return NextResponse.json(results);
}
