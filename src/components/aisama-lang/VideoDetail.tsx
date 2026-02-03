"use client";

import { db } from "@/lib/aisamaLangDb";
import {
  ItemType,
  Language,
  LearningItem,
  Script,
  SpeakingScore,
  Video,
  VideoStatus,
} from "@/types/aisama-lang";
import { clsx, type ClassValue } from "clsx";
import {
  Activity,
  ArrowLeft,
  Bolt,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  History,
  MapPin,
  Plus,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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

export const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<Language>("JP");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [scores, setScores] = useState<SpeakingScore[]>([]);

  // UI States
  const [isAddingScore, setIsAddingScore] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const v = db.videos.get(id);
      if (v) {
        setVideo(v);
        refreshData(id);
      }
    }
  }, [id]);

  const refreshData = (videoId: string) => {
    setScripts(db.scripts.list(videoId));
    setLearningItems(db.learningItems.list(videoId));
    setScores(db.scores.list(videoId));
  };

  if (!video) return null;

  const currentScripts = scripts.filter((s) => s.language === activeTab);
  const activeScript =
    currentScripts.find((s) => s.active) ||
    currentScripts[currentScripts.length - 1];

  const handleScriptChange = (text: string) => {
    if (!video) return;
    const nextVer =
      (currentScripts.length > 0
        ? Math.max(...currentScripts.map((s) => s.version))
        : 0) + 1;
    const newScript: Script = {
      id: Math.random().toString(36).substring(2, 9),
      video_id: video.video_id,
      language: activeTab,
      level:
        activeTab === "JP"
          ? "base"
          : activeTab === "EN"
            ? "A"
            : activeTab === "ZH"
              ? "B"
              : "C",
      version: nextVer,
      text,
      active: true,
      created_at: new Date().toISOString(),
    };
    db.scripts.add(newScript);
    setScripts(db.scripts.list(video.video_id));
  };

  const handleJsonImport = () => {
    if (!video) return;
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.language !== activeTab && activeTab !== "JP") {
        throw new Error(
          `言語不一致: 現在のタブは${activeTab}ですがJSONは${parsed.language}です。`,
        );
      }
      const mapped: LearningItem[] = [];
      const importLang = (
        activeTab === "JP" ? parsed.language || "EN" : activeTab
      ) as Exclude<Language, "JP">;

      ["grammar", "vocab", "phrases", "mistakes"].forEach((key) => {
        const type =
          key === "phrases"
            ? "phrase"
            : key === "mistakes"
              ? "mistake"
              : (key as ItemType);
        (parsed.items?.[key] || parsed[key] || []).forEach((i: any) => {
          mapped.push({
            id: Math.random().toString(36).substring(2, 9),
            video_id: video.video_id,
            language: importLang,
            type,
            head: i.pattern || i.word || i.phrase || i.wrong || "",
            tail: i.meaning || i.correct || "",
            example: i.example || i.reason || "",
            usage: i.usage || "",
            priority: (i.priority || "med") as any,
            active: true,
            created_at: new Date().toISOString(),
          });
        });
      });
      db.learningItems.addMany(mapped);
      setLearningItems(db.learningItems.list(video.video_id));
      setIsBulkImporting(false);
      setJsonInput("");
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (!video) return;
    db.learningItems.toggleActive(itemId);
    setLearningItems(db.learningItems.list(video.video_id));
  };

  const handleUpdateStatus = (status: VideoStatus) => {
    if (!video) return;
    const updated = { ...video, status, updated_at: new Date().toISOString() };
    db.videos.upsert(updated);
    setVideo(updated);
  };

  const handleDeleteVideo = () => {
    if (confirm("このプロジェクトを完全に削除しますか？")) {
      db.videos.delete(video.video_id);
      router.push("/aisama-lang/videos");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Hero Header */}
      <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32"></div>

        <div className="flex-1 relative">
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={() => router.push("/aisama-lang/videos")}
              className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
                {video.title}
              </h2>
              <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-4">
                <span className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full">
                  <Tag className="w-3 h-3" />
                  {video.video_id}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {video.location || "NO LOCATION"}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {video.date}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <select
            className={cn(
              "px-8 py-4 rounded-[1.5rem] border-2 font-black text-xs transition-all shadow-lg active:scale-95 outline-none cursor-pointer",
              video.status === "posted"
                ? "bg-green-500 text-white border-green-500 shadow-green-200"
                : video.status === "recorded"
                  ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                  : "bg-white text-slate-500 border-slate-100 shadow-slate-100",
            )}
            value={video.status}
            onChange={(e) => handleUpdateStatus(e.target.value as any)}
          >
            {Object.entries(statusLabel).map(([val, lab]) => (
              <option key={val} value={val} className="text-slate-900 bg-white">
                {lab.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleDeleteVideo}
            className="w-14 h-14 rounded-2xl border-2 border-red-50 text-red-200 hover:bg-red-500 hover:text-white hover:border-transparent transition-all duration-300 flex items-center justify-center shadow-sm"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Script and Items */}
        <div className="lg:col-span-8 space-y-10">
          {/* Script Editor */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px] group">
            <div className="flex bg-slate-50/50 p-3 gap-2 border-b border-slate-100">
              {(["JP", "EN", "ZH", "ES"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={cn(
                    "flex-1 py-4 font-black text-xs transition-all duration-300 rounded-[1.25rem]",
                    activeTab === lang
                      ? "bg-white text-blue-600 shadow-xl shadow-slate-200/50 scale-[1.02]"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="p-12 flex-1 flex flex-col space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  スクリプト編集
                </h3>
                {activeTab !== "JP" && (
                  <button
                    onClick={() => setIsBulkImporting(true)}
                    className="group px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2 uppercase font-italic"
                  >
                    <Bolt className="w-3 h-3 fill-white" />
                    AI JSON IMPORT
                  </button>
                )}
              </div>

              <div className="flex-1 relative">
                <textarea
                  className="w-full h-full p-10 rounded-[3rem] border-2 border-slate-50 focus:border-blue-500/20 focus:bg-white focus:ring-0 focus:outline-none text-slate-700 font-medium leading-relaxed bg-slate-50/50 text-lg resize-none shadow-inner transition-all"
                  placeholder={`${activeTab}で入力してください...`}
                  value={activeScript?.text || ""}
                  onChange={(e) => handleScriptChange(e.target.value)}
                />
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                    <Activity className="w-3 h-3 text-green-400" />
                    Live Saving
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Training Items */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                トレーニング・アイテム ({activeTab})
              </h3>
              <div className="px-5 py-2.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Check className="w-3 h-3" />
                Integrated Learning Path
              </div>
            </div>

            <div className="p-12">
              {activeTab === "JP" ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300 border-4 border-dashed border-slate-50 rounded-[3rem]">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <ChevronRight className="w-10 h-10" />
                  </div>
                  <p className="font-bold italic text-sm text-center max-w-xs">
                    外国語タブを選択してアイテムを登録・管理してください
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {learningItems
                    .filter((i) => i.language === activeTab)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-300 group hover:-translate-y-1",
                          item.active
                            ? "bg-white border-blue-50 shadow-xl shadow-blue-500/5"
                            : "bg-slate-50/50 border-transparent opacity-40 hover:opacity-100",
                        )}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full shadow-lg",
                              item.type === "vocab"
                                ? "bg-orange-500"
                                : item.type === "grammar"
                                  ? "bg-blue-500"
                                  : item.type === "phrase"
                                    ? "bg-purple-500"
                                    : "bg-red-500",
                            )}
                          />
                          <div>
                            <p className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors uppercase italic">
                              {item.head}
                            </p>
                            <p className="text-sm text-slate-400 font-bold mt-1">
                              {item.tail}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleItem(item.id)}
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg active:scale-90",
                            item.active
                              ? "bg-blue-600 text-white rotate-0"
                              : "bg-white text-slate-300 border border-slate-100",
                          )}
                        >
                          {item.active ? (
                            <Check className="w-6 h-6 stroke-[3px]" />
                          ) : (
                            <Star className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  {learningItems.filter((i) => i.language === activeTab)
                    .length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-200 font-bold border-4 border-dashed border-slate-50 rounded-[3rem] italic flex flex-col items-center gap-4">
                      <Plus className="w-12 h-12 mb-2" />
                      アイテム未登録
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scoring */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-3">
                <History className="w-5 h-5 text-blue-500" />
                採点ログ
              </h3>
              <button
                onClick={() => setIsAddingScore(true)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-blue-600 uppercase"
              >
                RECORD
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              {scores.filter((s) => s.language === activeTab).length > 0 ? (
                scores
                  .filter((s) => s.language === activeTab)
                  .reverse()
                  .map((score, idx) => (
                    <div
                      key={score.id}
                      className={cn(
                        "p-8 rounded-[3rem] border-2 transition-all duration-500 group overflow-hidden relative",
                        idx === 0
                          ? "bg-slate-900 text-white border-transparent shadow-2xl scale-[1.02]"
                          : "bg-white border-slate-50 hover:border-blue-100",
                      )}
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16"></div>
                      )}

                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            idx === 0 ? "text-blue-400" : "text-slate-300",
                          )}
                        >
                          {score.date}
                        </span>
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "text-4xl font-black italic leading-none",
                              score.total >= 75
                                ? "text-green-400 underline decoration-green-400/30 decoration-8 underline-offset-4"
                                : idx === 0
                                  ? "text-white"
                                  : "text-slate-800",
                            )}
                          >
                            {score.total}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-black mt-1",
                              idx === 0 ? "text-slate-500" : "text-slate-300",
                            )}
                          >
                            SCORE
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <p
                          className={cn(
                            "text-xs font-black leading-relaxed",
                            idx === 0 ? "text-white" : "text-slate-700",
                          )}
                        >
                          {score.main_problem}
                        </p>
                        <div
                          className={cn(
                            "p-4 rounded-2xl text-[10px] font-bold italic flex items-start gap-3",
                            idx === 0
                              ? "bg-white/5 text-blue-300"
                              : "bg-blue-50 text-blue-600",
                          )}
                        >
                          <Bolt className="w-3 h-3 flex-shrink-0 mt-0.5 fill-current" />
                          {score.improvement_tip}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-200 border-4 border-dashed border-slate-50 rounded-[3rem]">
                  <Activity className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-black text-xs uppercase tracking-[0.2em]">
                    No records for {activeTab}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Overlay */}
      {isBulkImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
                  AI JSON IMPORT
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest flex items-center gap-2">
                  <Bolt className="w-3 h-3 text-indigo-500" />
                  Target Language: {activeTab}
                </p>
              </div>
              <button
                onClick={() => setIsBulkImporting(false)}
                className="w-16 h-16 rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 hover:rotate-90 transition-all duration-500 flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="p-12 space-y-8">
              <textarea
                className="w-full h-80 p-10 rounded-[3rem] border-2 border-slate-50 focus:border-indigo-500/20 focus:ring-0 text-xs font-mono bg-slate-50/50 resize-none shadow-inner tracking-wider leading-relaxed outline-none transition-all"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="ChatGPTで生成したJSONデータをここに貼り付け..."
              />
              {parseError && (
                <div className="p-6 bg-red-50 text-red-600 text-xs font-black rounded-[2rem] flex items-center gap-4 animate-bounce">
                  <TriangleAlert className="w-6 h-6" />
                  {parseError}
                </div>
              )}
              <button
                onClick={handleJsonImport}
                className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base tracking-[0.3em] uppercase italic"
              >
                IMPORT KNOWLEDGE BASE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Dialog */}
      {isAddingScore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
                採点記録 ({activeTab})
              </h3>
              <button
                onClick={() => setIsAddingScore(false)}
                className="w-16 h-16 rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 hover:rotate-90 transition-all duration-500 flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <form
              className="p-12 space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const d = new FormData(form);
                const p = Number(d.get("p")),
                  g = Number(d.get("g")),
                  f = Number(d.get("f")),
                  c = Number(d.get("c"));
                const score: SpeakingScore = {
                  id: Math.random().toString(36).substring(2, 9),
                  video_id: video.video_id,
                  language: activeTab as any,
                  date: new Date().toISOString().split("T")[0],
                  script_version: activeScript?.version || 1,
                  pronunciation: p,
                  grammar: g,
                  fluency: f,
                  clarity: c,
                  total: Math.round((p + g + f + c) / 4),
                  main_problem: d.get("prob") as string,
                  improvement_tip: d.get("tip") as string,
                  comment: d.get("comment") as string,
                  created_at: new Date().toISOString(),
                };
                db.scores.add(score);
                setScores(db.scores.list(video.video_id));
                setIsAddingScore(false);
              }}
            >
              <div className="grid grid-cols-4 gap-6">
                {(["p", "g", "f", "c"] as const).map((cat) => (
                  <div key={cat} className="space-y-3 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {cat === "p"
                        ? "PRON"
                        : cat === "g"
                          ? "GRAM"
                          : cat === "f"
                            ? "FLUEN"
                            : "CLAR"}
                    </label>
                    <input
                      name={cat}
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="75"
                      className="w-full p-5 rounded-2xl border-2 border-slate-50 text-xl font-black text-center bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all shadow-inner"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <input
                  name="prob"
                  required
                  className="w-full p-6 rounded-[1.5rem] border-2 border-slate-50 text-sm font-bold bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all"
                  placeholder="主な課題 (Main Problem)"
                />
                <input
                  name="tip"
                  required
                  className="w-full p-6 rounded-[1.5rem] border-2 border-slate-50 text-sm font-bold bg-slate-50/50 focus:bg-white focus:border-blue-500/20 outline-none transition-all"
                  placeholder="改善策 (Improvement Tip)"
                />
              </div>
              <button
                type="submit"
                className="w-full py-8 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl shadow-slate-200 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base tracking-[0.3em] uppercase italic"
              >
                SAVE PERFORMANCE SCORE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
