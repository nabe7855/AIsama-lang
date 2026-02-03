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
  Copy,
  Download,
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
  const [isShowingPrompt, setIsShowingPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [activeItemType, setActiveItemType] = useState<ItemType | "all">("all");
  const [isScriptCollapsed, setIsScriptCollapsed] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (id) {
        try {
          const v = await db.videos.get(id);
          if (v) {
            setVideo(v);
            await refreshData(id);
          }
        } catch (error) {
          console.error("Error loading video:", error);
        }
      }
    };
    init();
  }, [id]);

  const refreshData = async (videoId: string) => {
    try {
      const sList = await db.scripts.list(videoId);
      const iList = await db.learningItems.list(videoId);
      const scList = await db.scores.list(videoId);
      setScripts(sList);
      setLearningItems(iList);
      setScores(scList);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  if (!video) return null;

  const currentScripts = scripts.filter((s) => s.language === activeTab);
  const activeScript =
    currentScripts.find((s) => s.active) ||
    currentScripts[currentScripts.length - 1];

  const handleScriptChange = async (text: string) => {
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
    try {
      await db.scripts.add(newScript);
      const sList = await db.scripts.list(video.video_id);
      setScripts(sList);
    } catch (error) {
      console.error("Error adding script:", error);
    }
  };

  const handleJsonImport = async () => {
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
              : (key as any); // Use any for mapping key to ItemType
        (parsed.items?.[key] || parsed[key] || []).forEach((i: any) => {
          mapped.push({
            id: Math.random().toString(36).substring(2, 9),
            video_id: video.video_id,
            language: importLang,
            type:
              type === "vocab" ||
              type === "grammar" ||
              type === "phrase" ||
              type === "mistake"
                ? type
                : "vocab",
            head: i.pattern || i.word || i.phrase || i.wrong || "",
            tail: i.meaning || i.translation || i.correct || "",
            example: i.example || i.sentence || i.reason || "",
            usage: i.usage || i.explanation || i.note || "",
            priority: (i.priority || "med") as any,
            active: true,
            created_at: new Date().toISOString(),
          });
        });
      });

      await db.learningItems.addMany(mapped);
      const iList = await db.learningItems.list(video.video_id);
      setLearningItems(iList);
      setIsBulkImporting(false);
      setJsonInput("");
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleDownloadCSV = () => {
    if (!video) return;
    const items = learningItems.filter((i) => i.language === activeTab);
    if (items.length === 0) {
      alert("ダウンロードするアイテムがありません。");
      return;
    }

    const headers = [
      "Head",
      "Tail",
      "Type",
      "Example",
      "Usage/Note",
      "Priority",
    ];
    const rows = items.map((item) => [
      `"${item.head.replace(/"/g, '""')}"`,
      `"${item.tail.replace(/"/g, '""')}"`,
      item.type.toUpperCase(),
      `"${(item.example || "").replace(/"/g, '""')}"`,
      `"${(item.usage || "").replace(/"/g, '""')}"`,
      item.priority.toUpperCase(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `aisama_${video.video_id}_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleItem = async (itemId: string) => {
    if (!video) return;
    try {
      await db.learningItems.toggleActive(itemId);
      const iList = await db.learningItems.list(video.video_id);
      setLearningItems(iList);
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleUpdateStatus = async (status: VideoStatus) => {
    if (!video) return;
    const updated = { ...video, status, updated_at: new Date().toISOString() };
    try {
      await db.videos.upsert(updated);
      setVideo(updated);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteVideo = async () => {
    if (confirm("このプロジェクトを完全に削除しますか？")) {
      try {
        await db.videos.delete(video.video_id);
        router.push("/aisama-lang/videos");
      } catch (error) {
        console.error("Error deleting video:", error);
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Hero Header */}
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32"></div>

        <div className="flex-1 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <button
              onClick={() => router.push("/aisama-lang/videos")}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-300 shadow-sm shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                {video.title}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-3 gap-x-6 sm:gap-x-8 text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-4">
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

        <div className="flex items-center justify-center sm:justify-start gap-4 relative">
          <select
            className={cn(
              "flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] border-2 font-black text-[10px] sm:text-xs transition-all shadow-lg active:scale-95 outline-none cursor-pointer",
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
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-red-50 text-red-200 hover:bg-red-500 hover:text-white hover:border-transparent transition-all duration-300 flex items-center justify-center shadow-sm shrink-0"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Script and Items */}
        <div className="lg:col-span-8 space-y-8 lg:space-y-10">
          {/* Script Editor */}
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-auto lg:h-[1000px] group">
            <div className="flex bg-slate-50/50 p-2 sm:p-3 gap-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
              {(["JP", "EN", "ZH", "ES"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={cn(
                    "min-w-[80px] sm:flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-xs transition-all duration-300 rounded-[1rem] sm:rounded-[1.25rem]",
                    activeTab === lang
                      ? "bg-white text-blue-600 shadow-lg sm:shadow-xl shadow-slate-200/50 scale-[1.02]"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-12 flex-1 flex flex-col space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    スクリプト編集
                  </h3>
                  <button
                    onClick={() => setIsScriptCollapsed(!isScriptCollapsed)}
                    className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <ChevronRight
                      className={cn(
                        "w-5 h-5 transition-transform duration-500",
                        !isScriptCollapsed ? "rotate-90" : "rotate-0",
                      )}
                    />
                  </button>
                </div>
                {(!isScriptCollapsed || activeTab === "EN") &&
                activeTab !== "JP" ? (
                  <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setIsShowingPrompt(true)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                    >
                      <Plus className="w-3 h-3" />
                      PROMPT
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </button>
                    <button
                      onClick={() => setIsBulkImporting(true)}
                      className="w-full sm:w-auto flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2 uppercase font-italic"
                    >
                      <Bolt className="w-3 h-3 fill-white" />
                      IMPORT
                    </button>
                  </div>
                ) : null}
              </div>

              <div
                className={cn(
                  "relative transition-all duration-500 ease-in-out overflow-hidden lg:flex-1 lg:flex lg:flex-col",
                  isScriptCollapsed
                    ? "max-h-0 lg:max-h-none opacity-0 lg:opacity-100 lg:mt-0"
                    : "max-h-[1200px] opacity-100 mt-6",
                )}
              >
                <div className="min-h-[300px] lg:flex-1 relative flex flex-col">
                  <textarea
                    className="w-full flex-1 p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border-2 border-slate-50 focus:border-blue-500/20 focus:bg-white focus:ring-0 focus:outline-none text-slate-700 font-medium leading-relaxed bg-slate-50/50 text-base sm:text-lg resize-none shadow-inner transition-all h-[800px] lg:h-full"
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
          </div>

          {/* Training Items */}
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 md:p-12 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-4 w-full sm:w-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                トレーニング ({activeTab})
              </h3>
              <div className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-50 rounded-full text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Check className="w-3 h-3" />
                INTEGRATED
              </div>
            </div>

            {/* Type Filters */}
            <div className="px-6 md:px-12 py-4 sm:py-6 bg-slate-50/30 border-b border-slate-50 flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveItemType("all")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                  activeItemType === "all"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
                )}
              >
                ALL
              </button>
              {(["vocab", "grammar", "phrase", "mistake"] as ItemType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setActiveItemType(type)}
                    className={cn(
                      "px-5 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
                      activeItemType === type
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
                    )}
                  >
                    {type === "vocab" && <Tag className="w-3 h-3" />}
                    {type === "grammar" && <FileText className="w-3 h-3" />}
                    {type === "phrase" && <MapPin className="w-3 h-3" />}
                    {type === "mistake" && (
                      <TriangleAlert className="w-3 h-3" />
                    )}
                    {type === "vocab"
                      ? "Vocab"
                      : type === "grammar"
                        ? "Grammar"
                        : type === "phrase"
                          ? "Phrases"
                          : "Mistakes"}
                  </button>
                ),
              )}
            </div>

            <div className="p-6 md:p-12">
              {activeTab === "JP" ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-slate-300 border-4 border-dashed border-slate-50 rounded-[2rem] sm:rounded-[3rem]">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-6">
                    <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <p className="font-bold italic text-xs sm:text-sm text-center max-w-[200px] sm:max-w-xs leading-relaxed">
                    外国語タブを選択してアイテムを登録・管理してください
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  {learningItems
                    .filter(
                      (i) =>
                        i.language === activeTab &&
                        (activeItemType === "all" || i.type === activeItemType),
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="relative h-48 sm:h-80 perspective-1000 group"
                        onClick={() => {
                          const next = new Set(flippedIds);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          setFlippedIds(next);
                        }}
                      >
                        <div
                          className={cn(
                            "relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer",
                            flippedIds.has(item.id) ? "rotate-y-180" : "",
                            !item.active && "opacity-40 grayscale-[50%]",
                          )}
                        >
                          {/* Front Side */}
                          <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-50 rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center">
                            <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                              <div
                                className={cn(
                                  "w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 pointer-events-auto",
                                  item.type === "vocab"
                                    ? "bg-orange-500"
                                    : item.type === "grammar"
                                      ? "bg-blue-500"
                                      : item.type === "phrase"
                                        ? "bg-purple-500"
                                        : "bg-red-500",
                                )}
                              >
                                {item.type === "vocab" ? (
                                  <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : item.type === "grammar" ? (
                                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : item.type === "phrase" ? (
                                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : (
                                  <TriangleAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleItem(item.id);
                                }}
                                className={cn(
                                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all pointer-events-auto",
                                  item.active
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-300",
                                )}
                              >
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px]" />
                              </button>
                            </div>
                            <div className="w-full">
                              <p className="text-lg sm:text-3xl font-black text-slate-800 tracking-tight italic uppercase break-words px-2">
                                {item.head}
                              </p>
                              <p className="text-[7px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 sm:mt-4">
                                TAP TO REVEAL
                              </p>
                            </div>
                          </div>

                          {/* Back Side */}
                          <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-[1.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-2xl rotate-y-180 flex flex-col items-center justify-center text-center overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16"></div>

                            <div className="relative z-10 w-full space-y-4 sm:space-y-6">
                              <div>
                                <h4 className="text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 sm:mb-2">
                                  Meaning
                                </h4>
                                <p className="text-white text-base sm:text-xl font-black italic break-words px-2">
                                  {item.tail}
                                </p>
                              </div>

                              {item.usage && (
                                <div className="overflow-hidden">
                                  <h4 className="text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 sm:mb-2">
                                    Usage
                                  </h4>
                                  <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold leading-relaxed bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl break-words line-clamp-3">
                                    {item.usage}
                                  </p>
                                </div>
                              )}
                            </div>

                            <p className="relative z-10 text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest text-right italic">
                              AIsama-lang OS
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {learningItems.filter(
                    (i) =>
                      i.language === activeTab &&
                      (activeItemType === "all" || i.type === activeItemType),
                  ).length === 0 && (
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
        <div className="lg:col-span-4 space-y-8 lg:space-y-10">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-auto lg:h-[700px]">
            <div className="p-6 md:p-12 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-3">
                <History className="w-5 h-5 text-blue-500 shrink-0" />
                採点ログ
              </h3>
              <button
                onClick={() => setIsAddingScore(true)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-blue-600 uppercase"
              >
                RECORD
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              {scores.filter((s) => s.language === activeTab).length > 0 ? (
                scores
                  .filter((s) => s.language === activeTab)
                  .reverse()
                  .map((score, idx) => (
                    <div
                      key={score.id}
                      className={cn(
                        "p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 transition-all duration-500 group overflow-hidden relative",
                        idx === 0
                          ? "bg-slate-900 text-white border-transparent shadow-2xl scale-[1.01]"
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
                className="w-full py-6 sm:py-8 bg-indigo-600 text-white font-black rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm sm:text-base tracking-[0.2em] sm:tracking-[0.3em] uppercase italic"
              >
                IMPORT KNOWLEDGE BASE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Overlay */}
      {isShowingPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tighter italic shrink-0">
                  GPT PROMPT
                </h3>
                <p className="text-[9px] text-slate-400 font-black uppercase mt-1 sm:mt-2 tracking-widest flex items-center gap-2">
                  <Star className="w-3 h-3 text-indigo-500" />
                  Target: {activeTab}
                </p>
              </div>
              <button
                onClick={() => setIsShowingPrompt(false)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center"
              >
                <X className="w-6 h-6 sm:w-8 h-8" />
              </button>
            </div>
            <div className="p-8 sm:p-12 space-y-6 sm:space-y-8 overflow-y-auto">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 flex-1 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {`Analyze the following script and create learning JSON data.

【Output Format】
Output ONLY JSON. Do not include markdown code blocks.

【Language & Instruction】
- Target Language: "${activeTab}"
- Instruction Language: **ENGLISH**
- For ZH (Chinese) or ES (Spanish), provide all meanings and explanations in **ENGLISH**.
- For EN (English), provide detailed vocabulary/grammar explanations in **ENGLISH**.

【Structure】
{
  "language": "${activeTab}",
  "vocab": [{"word": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "grammar": [{"pattern": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "phrases": [{"phrase": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "mistakes": [{"wrong": "...", "correct": "...", "reason": "(English Explanation)"}]
}

【Script】
${activeScript?.text || "No script provided"}

Start analysis now.`}
                </pre>
              </div>
              <button
                onClick={() => {
                  const prompt = `Analyze the following script and create learning JSON data.

【Output Format】
Output ONLY JSON. Do not include markdown code blocks.

【Language & Instruction】
- Target Language: "${activeTab}"
- Instruction Language: **ENGLISH**
- For ZH (Chinese) or ES (Spanish), provide all meanings and explanations in **ENGLISH**.
- For EN (English), provide detailed vocabulary/grammar explanations in **ENGLISH**.

【Structure】
{
  "language": "${activeTab}",
  "vocab": [{"word": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "grammar": [{"pattern": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "phrases": [{"phrase": "...", "meaning": "(English Translation)", "example": "(Target Lang Sentence)", "explanation": "(English Usage Note)"}],
  "mistakes": [{"wrong": "...", "correct": "...", "reason": "(English Explanation)"}]
}

【Script】
${activeScript?.text || "No script provided"}

Start analysis now.`;
                  navigator.clipboard.writeText(prompt);
                  alert("Copied to clipboard!");
                }}
                className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base tracking-[0.3em] uppercase italic flex items-center justify-center gap-4"
              >
                <Copy className="w-6 h-6" />
                COPY PROMPT FOR GPT
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
                const addScore = async () => {
                  try {
                    await db.scores.add(score);
                    const scList = await db.scores.list(video.video_id);
                    setScores(scList);
                    setIsAddingScore(false);
                  } catch (error) {
                    console.error("Error adding score:", error);
                  }
                };
                addScore();
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
