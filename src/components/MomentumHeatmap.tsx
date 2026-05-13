"use client";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  data: MomentumPoint[];
};

const BASE_RED_OPACITY = 0.12;
const BASE_YELLOW_OPACITY = 0.1;
const BASE_GREEN_OPACITY = 0.12;
const RED_GREEN_SCALE = 0.45;
const BALANCE_SCALE = 0.35;
const MID_STOP = 52;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toCellStyle(normalized: number) {
  const red = Math.max(0, -normalized);
  const green = Math.max(0, normalized);
  const balanced = 1 - Math.abs(normalized);

  return {
    background: `linear-gradient(135deg,
      color-mix(in srgb, var(--chart-negative) ${Math.round((BASE_RED_OPACITY + red * RED_GREEN_SCALE) * 100)}%, transparent) 0%,
      color-mix(in srgb, var(--chart-neutral) ${Math.round((BASE_YELLOW_OPACITY + balanced * BALANCE_SCALE) * 100)}%, transparent) ${MID_STOP}%,
      color-mix(in srgb, var(--chart-positive) ${Math.round((BASE_GREEN_OPACITY + green * RED_GREEN_SCALE) * 100)}%, transparent) 100%)`,
    borderColor: `color-mix(in srgb, var(--text-primary) ${Math.round((0.08 + Math.abs(normalized) * 0.24) * 100)}%, transparent)`,
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
    <div className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Momentum Heatmap</h3>
        <span className="text-xs text-[var(--text-secondary)]">Normalized scale</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px] space-y-2">
          <div
            className="grid items-center gap-1.5"
            style={{ gridTemplateColumns: `96px repeat(${normalized.length}, minmax(38px, 1fr))` }}
          >
            <div />
            {normalized.map((point) => (
               <div key={`head-${point.over}`} className="text-center text-[10px] text-[var(--text-secondary)]">
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
               <div className="pr-2 text-xs text-[var(--text-secondary)]">{lane.label}</div>
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
