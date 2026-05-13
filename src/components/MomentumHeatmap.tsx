"use client";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  data: MomentumPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toCellStyle(normalized: number) {
  const red = Math.max(0, -normalized);
  const green = Math.max(0, normalized);
  const balanced = 1 - Math.abs(normalized);

  return {
    background: `linear-gradient(135deg,
      rgba(239,68,68,${0.12 + red * 0.45}) 0%,
      rgba(245,158,11,${0.1 + balanced * 0.35}) 52%,
      rgba(34,197,94,${0.12 + green * 0.45}) 100%)`,
    borderColor: `rgba(255,255,255,${0.08 + Math.abs(normalized) * 0.24})`,
  };
}

export default function MomentumHeatmap({ data }: Props) {
  if (!data.length) return null;

  const maxAbs = Math.max(...data.map((point) => Math.abs(point.score)), 1);
  const normalized = data.map((point) => ({
    over: point.over,
    raw: point.score,
    norm: clamp(point.score / maxAbs, -1, 1),
  }));

  const lanes = [
    {
      key: "overall",
      label: "Overall",
      values: normalized.map((point) => point.norm),
    },
    {
      key: "batting",
      label: "Batting",
      values: normalized.map((point) => Math.max(0, point.norm)),
    },
    {
      key: "bowling",
      label: "Bowling",
      values: normalized.map((point) => -Math.min(0, point.norm)),
    },
    {
      key: "swing",
      label: "Swing",
      values: normalized.map((point) => Math.abs(point.norm)),
    },
  ];

  return (
    <div className="w-full rounded-[16px] border border-white/10 bg-slate-950/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">Momentum Heatmap</h3>
        <span className="text-xs text-white/55">Normalized scale</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px] space-y-2">
          <div
            className="grid items-center gap-1.5"
            style={{ gridTemplateColumns: `96px repeat(${normalized.length}, minmax(38px, 1fr))` }}
          >
            <div />
            {normalized.map((point) => (
              <div key={`head-${point.over}`} className="text-center text-[10px] text-white/55">
                {point.over}
              </div>
            ))}
          </div>

          {lanes.map((lane) => (
            <div
              key={lane.key}
              className="grid items-center gap-1.5"
              style={{ gridTemplateColumns: `96px repeat(${lane.values.length}, minmax(38px, 1fr))` }}
            >
              <div className="pr-2 text-xs text-white/70">{lane.label}</div>
              {lane.values.map((value, index) => {
                const signedValue =
                  lane.key === "overall"
                    ? value
                    : lane.key === "bowling"
                    ? -value
                    : value;
                const style = toCellStyle(signedValue);

                return (
                  <div
                    key={`${lane.key}-${index}`}
                    title={`Over ${normalized[index].over}: ${normalized[index].raw.toFixed(1)}`}
                    className="h-6 rounded border"
                    style={style}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
