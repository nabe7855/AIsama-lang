"use client";

import { db } from "@/lib/aisamaLangDb";
import {
  CEFRLevel,
  ItemSelector,
  SpecGenerator,
} from "@/lib/boudgetSlotSystem";
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
import { useLanguage } from "./LanguageContext";
import { ScoreChart } from "./ScoreChart";

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
  const {
    selectedLang: activeTab,
    setSelectedLang: setActiveTab,
    activeLanguages,
  } = useLanguage();
  const [video, setVideo] = useState<Video | null>(null);
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isImportingScore, setIsImportingScore] = useState(false);
  const [isShowingScorePrompt, setIsShowingScorePrompt] = useState(false);
  const [scoreJsonInput, setScoreJsonInput] = useState("");
  const [selectedScores, setSelectedScores] = useState<SpeakingScore[]>([]);
  const [isShowingWizard, setIsShowingWizard] = useState(false);

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
            is_favorite: false,
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

  const handleToggleFavorite = async (itemId: string) => {
    if (!video) return;
    try {
      await db.learningItems.toggleFavorite(itemId);
      const iList = await db.learningItems.list(video.video_id);
      setLearningItems(iList);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleReportStumble = async (itemId: string) => {
    if (!video) return;
    try {
      await db.learningItems.incrementErrorCount(itemId);
      const iList = await db.learningItems.list(video.video_id);
      setLearningItems(iList);
    } catch (error) {
      console.error("Error reporting stumble:", error);
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

  const handleScoreJsonImport = async () => {
    if (!video) return;
    setParseError(null);
    try {
      const parsed = JSON.parse(scoreJsonInput);
      const p = Number(parsed.pronunciation || 0);
      const g = Number(parsed.grammar || 0);
      const f = Number(parsed.fluency || 0);
      const c = Number(parsed.clarity || 0);

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
        main_problem: parsed.main_problem || "",
        improvement_tip: parsed.improvement_tip || "",
        comment: parsed.comment || "",
        created_at: new Date().toISOString(),
      };

      await db.scores.add(score);
      const scList = await db.scores.list(video.video_id);
      setScores(scList);
      setIsImportingScore(false);
      setIsAddingScore(false);
      setScoreJsonInput("");
    } catch (e: any) {
      setParseError(e.message);
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

  const handlePointClick = (date: string) => {
    const matches = scores
      .filter((s) => s.language === activeTab && s.date === date)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    setSelectedScores(matches);
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

      <div className="flex flex-col gap-8 lg:gap-10">
        {/* Top: Scoring Log (Now horizontal) */}
        <div className="w-full">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-12 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-3">
                <History className="w-5 h-5 text-blue-500 shrink-0" />
                採点ログ ({activeTab})
              </h3>
              <button
                onClick={() => setIsAddingScore(true)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-blue-600 uppercase"
              >
                RECORD
              </button>
            </div>

            <div className="p-6 md:p-8 flex flex-col min-h-[300px] sm:min-h-[400px]">
              <ScoreChart
                scores={scores}
                activeTab={activeTab}
                onPointClick={handlePointClick}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column: Script Editor */}
          <div className="lg:col-span-12 xl:col-span-8">
            <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-auto lg:h-[800px] group">
              <div className="flex bg-slate-50/50 p-2 sm:p-3 gap-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                {activeLanguages.map((lang: Language) => (
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
                        onClick={() => setIsShowingWizard(true)}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                      >
                        <Plus className="w-3 h-3" />
                        Smart Gen
                      </button>
                      <button
                        onClick={handleDownloadCSV}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                      >
                        <Download className="w-3 h-3" />
                        CSV
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
                      className="w-full flex-1 p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border-2 border-slate-50 focus:border-blue-500/20 focus:bg-white focus:ring-0 focus:outline-none text-slate-700 font-medium leading-relaxed bg-slate-50/50 text-base sm:text-lg resize-none shadow-inner transition-all h-[500px] lg:h-full"
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
          </div>

          {/* Right Column: Training Items */}
          <div className="lg:col-span-12 xl:col-span-4">
            <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] lg:h-[800px] flex flex-col">
              <div className="p-6 md:p-12 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  アイテム
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsShowingPrompt(true)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-[8px] sm:text-[10px] tracking-[0.1em] hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                  >
                    <Tag className="w-3 h-3" />
                    PROMPT
                  </button>
                  <button
                    onClick={() => setIsBulkImporting(true)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-[8px] sm:text-[10px] tracking-[0.1em] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2 uppercase italic"
                  >
                    <Bolt className="w-3 h-3 fill-white" />
                    IMPORT
                  </button>
                  <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-50 rounded-full text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Check className="w-3 h-3" />
                    {activeTab}
                  </div>
                </div>
              </div>

              {/* Type Filters */}
              <div className="px-6 md:px-10 py-4 sm:py-6 bg-slate-50/30 border-b border-slate-50 flex flex-wrap gap-2 overflow-x-auto scrollbar-hide shrink-0">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    showFavoritesOnly
                      ? "bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-100"
                      : "bg-white text-slate-400 border border-slate-100",
                  )}
                >
                  <Star
                    className={cn(
                      "w-3 h-3",
                      showFavoritesOnly ? "fill-slate-900" : "",
                    )}
                  />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => setActiveItemType("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                    activeItemType === "all"
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-600",
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
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                        activeItemType === type
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      {type === "vocab"
                        ? "V"
                        : type === "grammar"
                          ? "G"
                          : type === "phrase"
                            ? "P"
                            : "M"}
                    </button>
                  ),
                )}
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-hide">
                {activeTab === "JP" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-200 border-4 border-dashed border-slate-50 rounded-[3rem]">
                    <Activity className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em] text-center px-6">
                      Select target lang tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {learningItems
                      .filter(
                        (i) =>
                          i.language === activeTab &&
                          (activeItemType === "all" ||
                            i.type === activeItemType) &&
                          (!showFavoritesOnly || i.is_favorite),
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="relative h-40 perspective-1000 group"
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
                            <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-50 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-black",
                                    item.type === "vocab"
                                      ? "bg-orange-500"
                                      : item.type === "grammar"
                                        ? "bg-blue-500"
                                        : item.type === "phrase"
                                          ? "bg-purple-500"
                                          : "bg-red-500",
                                  )}
                                >
                                  {item.type.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1.5 pointer-events-auto">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(item.id);
                                    }}
                                    className={cn(
                                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                      item.is_favorite
                                        ? "bg-yellow-400 text-white shadow-lg shadow-yellow-100"
                                        : "bg-slate-50 text-slate-200 hover:text-yellow-400",
                                    )}
                                  >
                                    <Star
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        item.is_favorite ? "fill-white" : "",
                                      )}
                                    />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleItem(item.id);
                                    }}
                                    className={cn(
                                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                      item.active
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-300",
                                    )}
                                  >
                                    <Check className="w-4 h-4 stroke-[3px]" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReportStumble(item.id);
                                    }}
                                    title="苦手として報告（復習優先度が上がります）"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-red-50 text-red-200 hover:bg-red-100 hover:text-red-500"
                                  >
                                    <TriangleAlert className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xl font-black text-slate-800 tracking-tight italic uppercase break-words px-2 mt-4">
                                {item.head}
                              </p>
                              <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3">
                                REVEAL
                              </p>
                            </div>

                            {/* Back Side */}
                            <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-[2rem] p-6 shadow-2xl rotate-y-180 flex flex-col items-center justify-center text-center overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl -mr-12 -mt-12"></div>
                              <div className="relative z-10 w-full">
                                <h4 className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
                                  Meaning
                                </h4>
                                <p className="text-white text-sm font-black italic break-words px-2">
                                  {item.tail}
                                </p>
                                {item.usage && (
                                  <div className="mt-3">
                                    <p className="text-slate-400 text-[8px] font-bold leading-relaxed line-clamp-2">
                                      {item.usage}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {learningItems.filter(
                      (i) =>
                        i.language === activeTab &&
                        (activeItemType === "all" || i.type === activeItemType),
                    ).length === 0 && (
                      <div className="py-12 text-center text-slate-200 font-bold border-2 border-dashed border-slate-50 rounded-[2rem] italic flex flex-col items-center gap-2">
                        <Plus className="w-8 h-8 opacity-20" />
                        <p className="text-[9px] uppercase tracking-widest">
                          No Items
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
            <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex flex-col">
                <h3 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tighter italic">
                  採点記録 ({activeTab})
                </h3>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsShowingScorePrompt(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-widest hover:bg-indigo-100 transition-all uppercase"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    AI PROMPT
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportingScore(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-widest hover:bg-blue-100 transition-all uppercase"
                  >
                    <Bolt className="w-3 h-3 fill-current" />
                    IMPORT
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsAddingScore(false)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-white text-slate-400 hover:bg-slate-50 hover:rotate-90 transition-all duration-500 flex items-center justify-center border border-slate-100"
              >
                <X className="w-6 h-6 sm:w-8 h-8" />
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
      {/* Score Prompt Overlay */}
      {isShowingScorePrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
            <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tighter italic shrink-0">
                  SCORE EVAL PROMPT
                </h3>
                <p className="text-[9px] text-slate-400 font-black uppercase mt-1 sm:mt-2 tracking-widest flex items-center gap-2">
                  <Star className="w-3 h-3 text-indigo-500" />
                  Performance Evaluation: {activeTab}
                </p>
              </div>
              <button
                onClick={() => setIsShowingScorePrompt(false)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center"
              >
                <X className="w-6 h-6 sm:w-8 h-8" />
              </button>
            </div>
            <div className="p-8 sm:p-12 space-y-6 sm:space-y-8 overflow-y-auto">
              <div className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 flex-1 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {`Please evaluate my speaking performance for the following script.
Give me a STRICT score (0-100) for each category. Be very critical and strict with the scoring.
Provide a detailed report and specific advice for improvement.

【Output Format】
Output ONLY JSON. Do not include markdown code blocks.

【JSON Structure】
{
  "pronunciation": 0-100,
  "grammar": 0-100,
  "fluency": 0-100,
  "clarity": 0-100,
  "main_problem": "(Detailed English explanation of the biggest issue and why it matters)",
  "improvement_tip": "(Detailed and actionable English advice on how to improve)",
  "comment": "(Detailed English feedback on overall performance, including specific strengths and weaknesses)"
}

【Script】
${activeScript?.text || "No script provided"}

Please provide the scores based on my actual performance (audio/text data provided separately).
Start evaluation now.`}
                </pre>
              </div>
              <button
                onClick={() => {
                  const prompt = `Please evaluate my speaking performance for the following script.
Give me a STRICT score (0-100) for each category. Be very critical and strict with the scoring.
Provide a detailed report and specific advice for improvement.

【Output Format】
Output ONLY JSON. Do not include markdown code blocks.

【JSON Structure】
{
  "pronunciation": 0-100,
  "grammar": 0-100,
  "fluency": 0-100,
  "clarity": 0-100,
  "main_problem": "(Detailed English explanation of the biggest issue and why it matters)",
  "improvement_tip": "(Detailed and actionable English advice on how to improve)",
  "comment": "(Detailed English feedback on overall performance, including specific strengths and weaknesses)"
}

【Script】
${activeScript?.text || "No script provided"}

Please provide the scores based on my actual performance (audio/text data provided separately).
Start evaluation now.`;
                  navigator.clipboard.writeText(prompt);
                  alert("Copied to clipboard!");
                }}
                className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base tracking-[0.3em] uppercase italic flex items-center justify-center gap-4"
              >
                <Copy className="w-6 h-6" />
                COPY EVAL PROMPT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score JSON Import Overlay */}
      {isImportingScore && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
                  SCORE JSON IMPORT
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest flex items-center gap-2">
                  <Bolt className="w-3 h-3 text-blue-500" />
                  Target: {activeTab}
                </p>
              </div>
              <button
                onClick={() => setIsImportingScore(false)}
                className="w-16 h-16 rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 hover:rotate-90 transition-all duration-500 flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="p-12 space-y-8">
              <textarea
                className="w-full h-80 p-10 rounded-[3rem] border-2 border-slate-50 focus:border-blue-500/20 focus:ring-0 text-xs font-mono bg-slate-50/50 resize-none shadow-inner tracking-wider leading-relaxed outline-none transition-all"
                value={scoreJsonInput}
                onChange={(e) => setScoreJsonInput(e.target.value)}
                placeholder="AIが生成したスコアJSONをここに貼り付け..."
              />
              {parseError && (
                <div className="p-6 bg-red-50 text-red-600 text-xs font-black rounded-[2rem] flex items-center gap-4 animate-bounce">
                  <TriangleAlert className="w-6 h-6" />
                  {parseError}
                </div>
              )}
              <button
                onClick={handleScoreJsonImport}
                className="w-full py-8 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base tracking-[0.3em] uppercase italic"
              >
                IMPORT PERFORMANCE SCORE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Smart Script Wizard */}
      {isShowingWizard && (
        <SmartScriptWizard
          videoId={video.video_id}
          activeTab={activeTab}
          scripts={scripts}
          learningItems={learningItems}
          onClose={() => setIsShowingWizard(false)}
        />
      )}

      {/* Score Modal */}
      <ScoreDetailModal
        scores={selectedScores}
        onClose={() => setSelectedScores([])}
      />
    </div>
  );
};

const ScoreDetailModal = ({
  scores,
  onClose,
}: {
  scores: SpeakingScore[];
  onClose: () => void;
}) => {
  const [viewingScore, setViewingScore] = useState<SpeakingScore | null>(null);

  // If only one score, show it immediately. If multiple, show list.
  // We use useEffect to set viewingScore if only 1 exists ONLY when opening.
  // Actually, simpler: render logic based on state.

  useEffect(() => {
    if (scores.length === 1) {
      setViewingScore(scores[0]);
    } else {
      setViewingScore(null); // Reset when scores change (e.g. closing or new selection)
    }
  }, [scores]);

  if (scores.length === 0) return null;

  // Single Detail View (either only 1 score exists OR user selected one from list)
  if (viewingScore) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in duration-300">
        <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
          <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                {scores.length > 0 && (
                  <button
                    onClick={() =>
                      scores.length === 1 ? onClose() : setViewingScore(null)
                    }
                    className="flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    {scores.length > 1 && (
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    )}
                    {viewingScore.date} / PERFORMANCE
                  </button>
                )}
              </div>
              <h3 className="text-4xl sm:text-6xl font-black italic tracking-tighter leading-none">
                {viewingScore.total}
                <span className="text-xl sm:text-2xl text-slate-500 not-italic ml-2 uppercase font-black">
                  pts
                </span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center"
            >
              <X className="w-6 h-6 sm:w-8 h-8" />
            </button>
          </div>
          <div className="p-8 sm:p-12 space-y-8 sm:space-y-10 overflow-y-auto max-h-[60vh] scrollbar-hide">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "PRON", val: viewingScore.pronunciation },
                { label: "GRAM", val: viewingScore.grammar },
                { label: "FLUEN", val: viewingScore.fluency },
                { label: "CLAR", val: viewingScore.clarity },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-4 bg-slate-50 rounded-3xl border border-slate-100"
                >
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {s.label}
                  </p>
                  <p className="text-xl font-black text-slate-800 italic">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4 text-orange-500" />
                  Main Problem
                </h4>
                <p className="text-sm font-bold text-slate-600 leading-relaxed bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50 italic">
                  {viewingScore.main_problem}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Bolt className="w-4 h-4 text-blue-500" />
                  Improvement Tip
                </h4>
                <p className="text-sm font-black text-blue-600 leading-relaxed bg-blue-50/30 p-6 rounded-3xl border border-blue-100/50 italic">
                  {viewingScore.improvement_tip}
                </p>
              </div>

              {viewingScore.comment && (
                <div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    AI Comment
                  </h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    {viewingScore.comment}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="p-8 sm:p-12 bg-slate-50/50 border-t border-slate-50">
            <button
              onClick={() => {
                if (scores.length > 1) {
                  setViewingScore(null);
                } else {
                  onClose();
                }
              }}
              className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest italic"
            >
              {scores.length > 1 ? "BACK TO LIST" : "CLOSE REPORT"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multiple Scores List View
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
        <div className="p-8 sm:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">
              {scores[0]?.date}
            </p>
            <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter">
              HISTORY LIST
            </h3>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 w-12 h-12 rounded-2xl bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4 overflow-y-auto max-h-[60vh]">
          {scores.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setViewingScore(s)}
              className="w-full group text-left"
            >
              <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-[9px] font-black tracking-widest">
                        {new Date(s.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {i === 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black tracking-widest">
                          LATEST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black italic text-slate-800 group-hover:text-blue-600 transition-colors">
                        {s.total}
                        <span className="text-xs text-slate-400 ml-1">pts</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SmartScriptWizard = ({
  videoId,
  activeTab,
  scripts,
  learningItems,
  onClose,
}: {
  videoId: string;
  activeTab: Language;
  scripts: Script[];
  learningItems: LearningItem[];
  onClose: () => void;
}) => {
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [duration, setDuration] = useState(60);
  const [persona, setPersona] = useState("");
  const [baseScriptId, setBaseScriptId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const jpScripts = scripts.filter((s) => s.language === "JP");

  const speeds: Record<Language, number> = {
    EN: 2.5, // words/sec
    JP: 5.5, // chars/sec
    ZH: 3.5, // chars/sec
    ES: 2.5, // words/sec
  };
  const estimatedAmount = Math.floor(duration * (speeds[activeTab] || 2.5));
  const unit = activeTab === "JP" || activeTab === "ZH" ? "文字" : "語";

  // Auto-select latest JP script
  useEffect(() => {
    if (jpScripts.length > 0 && !baseScriptId) {
      setBaseScriptId(jpScripts[jpScripts.length - 1].id);
    }
  }, [jpScripts]);

  const baseScript = jpScripts.find((s) => s.id === baseScriptId);

  const handleCopy = () => {
    const { weakItems, reviewItems } = ItemSelector.selectItems(
      learningItems,
      { weakCount: 4, reviewCount: 4, newCount: 0 },
      activeTab,
    );

    const spec = SpecGenerator.generate(
      activeTab,
      "Daily Conversation",
      weakItems,
      reviewItems,
      {
        level,
        durationSeconds: duration,
        persona,
        baseScript: baseScript?.text,
      },
    );

    const prompt = SpecGenerator.renderToPrompt(spec);
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center bg-blue-600 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter">
              SMART SCRIPT WIZARD
            </h3>
            <p className="text-[10px] text-blue-100 font-black uppercase mt-2 tracking-widest flex items-center gap-2">
              <Star className="w-3 h-3 fill-current" />
              Custom Prompt for {activeTab}
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 w-12 h-12 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 sm:p-12 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
          {/* Base Script Select */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3 text-blue-500" />
              Base Japanese Script
            </label>
            <select
              value={baseScriptId}
              onChange={(e) => setBaseScriptId(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-bold outline-none focus:border-blue-500/20"
            >
              {jpScripts.length === 0 && (
                <option value="">No JP scripts found</option>
              )}
              {jpScripts.map((s) => (
                <option key={s.id} value={s.id}>
                  Version {s.version} ({s.text.slice(0, 30)}...)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Level Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-500" />
                CEFR Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-bold outline-none focus:border-blue-500/20"
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Slider */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-purple-500" />
                Target Duration ({duration}s)
              </label>
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-50 space-y-4">
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400">
                    {duration}秒
                  </span>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full italic">
                    約 {estimatedAmount} {unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Star className="w-3 h-3 text-orange-500" />
              Persona (Optional)
            </label>
            <input
              placeholder="e.g. Steve Jobs, Elon Musk, Spider-Man..."
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 text-sm font-bold outline-none focus:border-blue-500/20"
            />
            <p className="text-[9px] text-slate-400 font-medium italic">
              AI will mimic their tone and style.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={handleCopy}
            className={cn(
              "w-full py-6 rounded-3xl font-black text-sm tracking-[0.2em] uppercase italic transition-all duration-300 flex items-center justify-center gap-4 shadow-xl active:scale-95",
              isCopied
                ? "bg-green-500 text-white"
                : "bg-slate-900 text-white hover:bg-blue-600",
            )}
          >
            {isCopied ? (
              <>
                <Check className="w-5 h-5" />
                COPIED TO CLIPBOARD
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                GENERATE & COPY PROMPT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
