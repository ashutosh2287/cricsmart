"use client";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  data: MomentumPoint[];
};

function getTone(score: number) {
  if (score >= 4) {
    return {
      bar: "from-emerald-300 to-emerald-500",
      label: "Batting surge",
    };
  }

  if (score > 0) {
    return {
      bar: "from-emerald-200 to-emerald-400",
      label: "Batting edge",
    };
  }

  if (score <= -4) {
    return {
      bar: "from-rose-300 to-rose-500",
      label: "Bowling surge",
    };
  }

  if (score < 0) {
    return {
      bar: "from-orange-200 to-orange-400",
      label: "Bowling edge",
    };
  }

  return {
    bar: "from-amber-200 to-amber-400",
    label: "Balanced phase",
  };
}

export default function MomentumHeatmap({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="w-full rounded-[28px] border border-white/10 bg-slate-950/45 p-5">
      <div className="mb-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-white">Momentum Map</h3>
        <p className="text-sm leading-6 text-white/60">
          Green blocks favour the batting side, red blocks favour the bowling
          side, and yellow shows a balanced spell.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {data.map((point) => {
          const tone = getTone(point.score);

          return (
            <div
              key={`${point.over}-${point.score}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              title={`Over ${point.over}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                <span>Over {point.over}</span>
                <span>{tone.label}</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
                  style={{
                    width: `${Math.min(100, Math.max(20, Math.abs(point.score) * 16))}%`,
                  }}
                />
              </div>

              <div className="mt-3 text-sm font-medium text-white">
                {point.score > 0 ? "+" : ""}
                {point.score.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
