"use client";

import { getPlayers } from "@/services/playerService";
import PlayerCard from "@/components/players/PlayerCard";

export default function PlayersPage() {

  const players = getPlayers();

  return (

    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

      <h1 className="text-3xl font-bold">Players</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {players.map(player => (

          <PlayerCard
  key={player.id}
  matchId="ind-vs-aus"
  name={player.name}
  team={player.team}
/>

        ))}

      </div>

    </main>

  );

}