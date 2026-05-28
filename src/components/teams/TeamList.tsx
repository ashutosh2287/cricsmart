import { teams } from "@/data/teams";

export default function TeamList() {
  return (
    <div className="bg-[var(--surface)] text-[var(--text-1)] rounded-lg p-4">

      <h2 className="text-lg mb-4 font-semibold">
        International Teams
      </h2>

      <div className="grid grid-cols-2 gap-2">

        {teams.map((team) => (
          <div
            key={team.name}
            className="bg-[var(--surface-2)]/40 p-3 rounded flex justify-between hover:bg-[var(--surface-3)]/50 cursor-pointer"
          >
            <span>{team.name}</span>
            <span>›</span>
          </div>
        ))}

      </div>

    </div>
  );
}