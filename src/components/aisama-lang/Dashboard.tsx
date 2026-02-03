"use client";

import { db } from "@/lib/aisamaLangDb";
import { Video, VideoStatus } from "@/types/aisama-lang";
import { clsx, type ClassValue } from "clsx";
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  History,
  Play,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusLabel: Record<VideoStatus, string> = {
  draft: "下書き",
  practicing: "練習中",
  recorded: "収録済み",
  posted: "投稿済み",
};

export const Dashboard = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [latestScores, setLatestScores] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vList = await db.videos.list();
        setVideos(vList);

        const counts = vList.reduce(
          (acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        setStatusCounts(counts);

        const allScores = await db.scores.listAll();
        const scores = (["EN", "ZH", "ES"] as const).map((lang) => {
          const langScores = allScores.filter((s) => s.language === lang);
          const latest = langScores.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0];
          return { lang, latest };
        });
        setLatestScores(scores);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          ダッシュボード
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
          進捗状況と最新スコアのサマリーです。
        </p>
      </header>

      {/* Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {(["draft", "practicing", "recorded", "posted"] as VideoStatus[]).map(
          (status) => (
            <div
              key={status}
              className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    status === "posted"
                      ? "bg-green-500"
                      : status === "recorded"
                        ? "bg-blue-500"
                        : "bg-slate-300",
                  )}
                />
                {statusLabel[status]}
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">
                {statusCounts[status] || 0}
                <span className="text-xs sm:text-sm font-bold text-slate-300 ml-2">
                  PROJECTS
                </span>
              </p>
            </div>
          ),
        )}
      </div>

      {/* Language Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {latestScores.map(({ lang, latest }) => (
          <div
            key={lang}
            className="bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150 group-hover:opacity-20",
                lang === "EN"
                  ? "bg-blue-500"
                  : lang === "ZH"
                    ? "bg-red-500"
                    : "bg-yellow-500",
              )}
            ></div>

            <div className="flex justify-between items-center mb-8 sm:mb-10">
              <div
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center font-black text-base sm:text-lg shadow-lg",
                  lang === "EN"
                    ? "bg-blue-600 text-white"
                    : lang === "ZH"
                      ? "bg-red-600 text-white"
                      : "bg-yellow-500 text-slate-900",
                )}
              >
                {lang}
              </div>
              {latest && latest.total >= 75 && (
                <div className="flex items-center gap-2 bg-green-500 text-white text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg shadow-green-200 animate-pulse uppercase tracking-widest">
                  <Activity className="w-3 h-3" />
                  POST OK
                </div>
              )}
            </div>

            {latest ? (
              <div className="space-y-6">
                <div>
                  <div className="text-6xl font-black text-slate-800 tracking-tighter flex items-end gap-1">
                    {latest.total}
                    <span className="text-xl text-slate-300 font-bold mb-2">
                      /100
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Play className="w-3 h-3 fill-slate-400" />
                    Latest Project
                  </p>
                  <p className="text-sm font-black text-slate-700 truncate">
                    {latest.video_id}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                <Trophy className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-bold italic">No data recorded</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <History className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            最近のプロジェクト
          </h3>
          <Link
            href="/aisama-lang/videos"
            className="text-xs sm:text-sm font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 group w-fit"
          >
            すべて見る
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="space-y-4">
          {videos
            .slice(0, 5)
            .reverse()
            .map((v) => (
              <Link
                key={v.video_id}
                href={`/aisama-lang/videos/${v.video_id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-slate-50 transition-all duration-300 border-2 border-transparent hover:border-slate-100 group gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-sm border border-slate-100 group-hover:border-transparent shrink-0">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-lg sm:text-xl text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {v.title}
                    </h4>
                    <div className="flex items-center gap-3 sm:gap-4 mt-1">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1 shrink-0">
                        <Activity className="w-3 h-3" />
                        {v.video_id}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {v.date}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "w-fit text-[8px] sm:text-[10px] font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 tracking-widest uppercase",
                    v.status === "posted"
                      ? "bg-green-50 border-green-100 text-green-600"
                      : v.status === "recorded"
                        ? "bg-blue-50 border-blue-100 text-blue-600"
                        : "bg-slate-50 border-slate-100 text-slate-400",
                  )}
                >
                  {statusLabel[v.status]}
                </span>
              </Link>
            ))}

          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-slate-50 rounded-[3rem]">
              <BarChart3 className="w-16 h-16 text-slate-100 mb-4" />
              <p className="text-slate-300 font-bold italic">
                ビデオがまだ作成されていません。
              </p>
              <Link
                href="/aisama-lang/videos/new"
                className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
              >
                最初のプロジェクトを作成
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
