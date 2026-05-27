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
    <div
      className="p-4 rounded space-y-4"
      style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
    >

      <h2 className="text-lg font-semibold">Toss</h2>

      {!winner && (
        <button
          onClick={handleToss}
          className="bg-blue-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          Flip Coin
        </button>
      )}

      {winner && (
        <>
          <p className="text-[var(--brand)]">
            {winner.name} won the toss 🎉
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setDecision("BAT")}
              className="px-3 py-2 rounded"
              style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)" }}
            >
              Bat
            </button>

            <button
              onClick={() => setDecision("BOWL")}
              className="px-3 py-2 rounded"
              style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)" }}
            >
              Bowl
            </button>
          </div>
        </>
      )}

      {winner && decision && (
        <button
          onClick={() => onConfirm(winner, decision)}
          className="bg-green-600 px-4 py-2 rounded w-full text-[var(--text-inv)]"
        >
          Start Match
        </button>
      )}

    </div>
  );
}
