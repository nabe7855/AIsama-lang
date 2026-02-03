"use client";

import { db } from "@/lib/aisamaLangDb";
import { Video } from "@/types/aisama-lang";
import {
  ArrowLeft,
  Bolt,
  Calendar,
  FileText,
  MapPin,
  Plus,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const VideoNew = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);

    const videoId = d.get("video_id") as string;
    const title = d.get("title") as string;

    if (!videoId || !title) {
      alert("Video ID and Title are required");
      setLoading(false);
      return;
    }

    const newVideo: Video = {
      id: crypto.randomUUID(),
      video_id: videoId,
      title,
      date: (d.get("date") as string) || new Date().toISOString().split("T")[0],
      location: (d.get("location") as string) || "",
      memo: (d.get("memo") as string) || "",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await db.videos.upsert(newVideo);
      router.push(`/aisama-lang/videos/${videoId}`);
    } catch (error) {
      console.error("Error creating video:", error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header className="flex items-center gap-4 sm:gap-6 px-1">
        <button
          onClick={() => router.push("/aisama-lang/videos")}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-300 shadow-sm shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
            新規プロジェクト
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            新しいビデオ制作を開始します。
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8 sm:space-y-12 mx-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <Tag className="w-3 h-3 text-blue-500" />
              Project ID (Slug)
            </label>
            <input
              name="video_id"
              required
              placeholder="e.g. aisama-001"
              className="w-full p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all font-bold text-base sm:text-lg"
            />
            <p className="text-[10px] text-slate-400 pl-2 font-medium">
              ※ 英数字とハイフンのみ。後で変更できません。
            </p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <FileText className="w-3 h-3 text-blue-500" />
              Project Title
            </label>
            <input
              name="title"
              required
              placeholder="プロジェクトの名称"
              className="w-full p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all font-bold text-base sm:text-lg"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" />
              Creation Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all font-bold text-base sm:text-lg"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-blue-500" />
              Location / Category
            </label>
            <input
              name="location"
              placeholder="e.g. Studio, Home, Tokyo"
              className="w-full p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all font-bold text-base sm:text-lg"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
            <Plus className="w-3 h-3 text-blue-500" />
            Internal Notes (Memo)
          </label>
          <textarea
            name="memo"
            placeholder="このプロジェクトに関する詳細なメモ..."
            className="w-full p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all font-medium h-40 resize-none text-sm sm:text-base"
          />
        </div>

        <div className="pt-6 border-t border-slate-50 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto group relative bg-slate-900 text-white px-10 sm:px-16 py-6 sm:py-8 rounded-xl sm:rounded-[2.5rem] font-black text-base sm:text-lg shadow-2xl shadow-slate-200 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 uppercase italic tracking-widest disabled:opacity-50"
          >
            {loading ? (
              "INITIALIZING..."
            ) : (
              <>
                <Bolt className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                Create OS Project
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
