"use client";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  data: MomentumPoint[];
};

export default function MomentumHeatmap({ data }: Props) {

  if (!data.length) return null;

  function getColor(value: number) {
    if (value > 3) return "bg-green-500";
    if (value > 0) return "bg-green-300";
    if (value < -3) return "bg-red-500";
    if (value < 0) return "bg-red-300";
    return "bg-yellow-400";
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl w-full overflow-hidden">

      <h3 className="font-bold mb-3">
        Momentum Map
      </h3>

      <div className="flex gap-1 overflow-x-auto">

        <div className="flex gap-[2px] min-w-max">

          {data.map((p, index) => (
            <div
              key={index}
              className={`w-2 h-10 ${getColor(p.score)}`}
              title={`Over ${p.over}`}
            />
          ))}

        </div>

      </div>

    </div>
  );
}