import { Team } from "@/data/teams";
import { useState } from "react";

type Props = {
  teamA: Team;
  teamB: Team;
  onConfirm: (winner: Team, decision: "BAT" | "BOWL") => void;
};

export default function TossPanel({ teamA, teamB, onConfirm }: Props) {
  const [winner, setWinner] = useState<Team | null>(null);
  const [decision, setDecision] = useState<"BAT" | "BOWL" | null>(null);

  const handleToss = () => {
    const w = Math.random() < 0.5 ? teamA : teamB;
    setWinner(w);
  };

  return (
    <div className="bg-gray-900 p-4 rounded text-white space-y-4">

      <h2 className="text-lg font-semibold">Toss</h2>

      {!winner && (
        <button
          onClick={handleToss}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Flip Coin
        </button>
      )}

      {winner && (
        <>
          <p className="text-green-400">
            {winner.name} won the toss 🎉
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setDecision("BAT")}
              className="bg-gray-700 px-3 py-2 rounded"
            >
              Bat
            </button>

            <button
              onClick={() => setDecision("BOWL")}
              className="bg-gray-700 px-3 py-2 rounded"
            >
              Bowl
            </button>
          </div>
        </>
      )}

      {winner && decision && (
        <button
          onClick={() => onConfirm(winner, decision)}
          className="bg-green-600 px-4 py-2 rounded w-full"
        >
          Start Match
        </button>
      )}

    </div>
  );
}