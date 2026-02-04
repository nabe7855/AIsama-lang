"use client";

import { Language, SpeakingScore } from "@/types/aisama-lang";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScoreChartProps = {
  scores: SpeakingScore[];
  activeTab: Language;
  onPointClick: (date: string) => void;
};

export const ScoreChart = ({
  scores,
  activeTab,
  onPointClick,
}: ScoreChartProps) => {
  const chartData = scores
    .filter((s) => s.language === activeTab)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-200 border-4 border-dashed border-slate-50 rounded-[3rem] flex-1 min-h-[300px]">
        <p className="font-black text-xs uppercase tracking-[0.2em]">
          No records for {activeTab}
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full mt-4 cursor-pointer relative z-10"
      style={{ width: "100%", height: 300, minWidth: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
          onClick={(data: any) => {
            if (data && data.activePayload) {
              const date = data.activePayload[0].payload.date;
              onPointClick(date);
            }
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fontWeight: "900",
              fill: "#94a3b8",
            }}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fontWeight: "900",
              fill: "#cbd5e1",
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10">
                    <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">
                      {payload[0].payload.date}
                    </p>
                    <p className="text-xl font-black italic">
                      {payload[0].value}
                      <span className="text-[10px] ml-1">PTS</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#4f46e5"
            strokeWidth={4}
            dot={{
              r: 12,
              fill: "#4f46e5",
              strokeWidth: 4,
              stroke: "#fff",
            }}
            activeDot={{
              r: 14,
              fill: "#4f46e5",
              strokeWidth: 4,
              stroke: "#fff",
              onClick: (e, payload: any) => {
                const date = payload.payload.date;
                onPointClick(date);
              },
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6">
        Tap any point to see details
      </p>
    </div>
  );
};
