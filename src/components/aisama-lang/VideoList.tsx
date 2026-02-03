"use client";

import { db } from "@/lib/aisamaLangDb";
import { Video, VideoStatus } from "@/types/aisama-lang";
import { clsx, type ClassValue } from "clsx";
import {
  Calendar,
  ChevronRight,
  Filter,
  Ghost,
  MapPin,
  Play,
  Plus,
  Search,
  Tag,
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

export const VideoList = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<VideoStatus | "all">("all");

  useEffect(() => {
    setVideos(db.videos.list());
  }, []);

  const filtered = videos
    .filter((v) => {
      const matchesSearch =
        search === "" ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.video_id.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === "all" || v.status === activeFilter;
      return matchesSearch && matchesFilter;
    })
    .reverse();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">
            動画プロジェクト
          </h2>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            スクリプトと学習データの拠点です。
          </p>
        </div>
        <Link
          href="/aisama-lang/videos/new"
          className="group bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 uppercase italic tracking-widest text-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          新規作成
        </Link>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative group flex-1">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="プロジェクト名またはIDで検索..."
            className="w-full pl-20 pr-10 py-6 rounded-[2.5rem] border-2 border-slate-100 bg-white shadow-sm text-sm font-bold focus:border-blue-500/20 focus:ring-0 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-white p-2 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-8 py-4 text-[10px] font-black rounded-2xl transition-all duration-300 tracking-widest uppercase",
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xl"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            すべて
          </button>
          {(["draft", "practicing", "recorded", "posted"] as VideoStatus[]).map(
            (s) => (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                className={cn(
                  "px-8 py-4 text-[10px] font-black rounded-2xl transition-all duration-300 tracking-widest uppercase",
                  activeFilter === s
                    ? "bg-blue-600 text-white shadow-xl"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {statusLabel[s]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filtered.map((v) => (
          <Link
            key={v.video_id}
            href={`/aisama-lang/videos/${v.video_id}`}
            className="group relative bg-white rounded-[4rem] p-10 border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col justify-between h-[450px]"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors duration-500" />

            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="w-16 h-16 rounded-[1.75rem] bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-sm border border-slate-100 group-hover:border-transparent">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-black px-6 py-2.5 rounded-full border-2 tracking-widest uppercase",
                    v.status === "posted"
                      ? "bg-green-50 border-green-100 text-green-600"
                      : v.status === "recorded"
                        ? "bg-blue-50 border-blue-100 text-blue-600"
                        : "bg-slate-50 border-slate-100 text-slate-400",
                  )}
                >
                  {statusLabel[v.status]}
                </span>
              </div>

              <h3 className="text-3xl font-black text-slate-800 leading-tight tracking-tight group-hover:text-blue-600 transition-colors mb-6">
                {v.title}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                  <Tag className="w-4 h-4 text-blue-500" />
                  {v.video_id}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {v.date}
                </div>
                {v.location && (
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {v.location}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                View Project
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-40 border-4 border-dashed border-slate-50 rounded-[4rem] bg-white/50 flex flex-col items-center justify-center text-slate-200">
            <Ghost className="w-20 h-20 mb-6 opacity-10 animate-pulse" />
            <p className="font-black text-sm uppercase tracking-[0.3em] pl-2">
              プロジェクトが見つかりません
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
              className="mt-8 text-xs font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest underline underline-offset-8"
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
