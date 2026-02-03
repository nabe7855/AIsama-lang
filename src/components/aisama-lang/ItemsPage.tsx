"use client";

import { db } from "@/lib/aisamaLangDb";
import { ItemType, Language, LearningItem, Video } from "@/types/aisama-lang";
import { clsx, type ClassValue } from "clsx";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  Filter,
  Ghost,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Type,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const typeLabel: Record<ItemType, string> = {
  grammar: "文法",
  vocab: "単語",
  phrase: "フレーズ",
  mistake: "ミス",
};

const typeIcon: Record<ItemType, any> = {
  grammar: BookOpen,
  vocab: Type,
  phrase: MessageCircle,
  mistake: AlertTriangle,
};

const typeColor: Record<ItemType, string> = {
  grammar: "bg-blue-500",
  vocab: "bg-orange-500",
  phrase: "bg-purple-500",
  mistake: "bg-red-500",
};

export const ItemsPage = () => {
  const [selectedLang, setSelectedLang] =
    useState<Exclude<Language, "JP">>("EN");
  const [selectedType, setSelectedType] = useState<ItemType | "all">("all");
  const [items, setItems] = useState<LearningItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());

  const refresh = async () => {
    try {
      let all = await db.learningItems.listAll();
      const vList = await db.videos.list();
      setVideos(vList);

      // Filter by lang
      all = all.filter((i) => i.language === selectedLang);

      // Filter by type
      if (selectedType !== "all") {
        all = all.filter((i) => i.type === selectedType);
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        all = all.filter(
          (i) =>
            i.head.toLowerCase().includes(q) ||
            i.tail.toLowerCase().includes(q) ||
            i.video_id.toLowerCase().includes(q),
        );
      }

      setItems(all.reverse());
    } catch (error) {
      console.error("Error refreshing items:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, [selectedLang, selectedType, searchQuery]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    const vId = d.get("video_id") as string;
    const head = d.get("head") as string;
    const tail = d.get("tail") as string;
    const type = d.get("type") as ItemType;

    if (!vId || !head || !tail) return alert("必須項目を入力してください");

    try {
      await db.learningItems.add({
        id: Math.random().toString(36).substring(2, 9),
        video_id: vId,
        language: selectedLang,
        type: type || (selectedType === "all" ? "vocab" : selectedType),
        head,
        tail,
        example: d.get("example") as string,
        usage: d.get("usage") as string,
        priority: "med",
        active: true,
        created_at: new Date().toISOString(),
      });

      form.reset();
      setShowAddForm(false);
      await refresh();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await db.learningItems.toggleActive(id);
      await refresh();
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("削除しますか？")) {
      try {
        await db.learningItems.delete(id);
        await refresh();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">
            学習アイテム・ライブラリ
          </h2>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            全プロジェクトの知識を統合管理します。
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm shadow-xl transition-all duration-300",
            showAddForm
              ? "bg-slate-200 text-slate-600"
              : "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-blue-200",
          )}
        >
          {showAddForm ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {showAddForm ? "閉じる" : "新規アイテム追加"}
        </button>
      </header>

      {showAddForm && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-50 shadow-2xl shadow-blue-100/30 animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleManualAdd} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  対象動画
                </label>
                <select
                  name="video_id"
                  required
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500/20 focus:ring-0 outline-none transition-all text-sm font-bold"
                >
                  <option value="">動画を選択...</option>
                  {videos.map((v) => (
                    <option key={v.video_id} value={v.video_id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  種別
                </label>
                <select
                  name="type"
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500/20 focus:ring-0 outline-none transition-all text-sm font-bold"
                >
                  {(
                    ["vocab", "grammar", "phrase", "mistake"] as ItemType[]
                  ).map((t) => (
                    <option key={t} value={t}>
                      {typeLabel[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Head (単語/表現)
                </label>
                <input
                  name="head"
                  required
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500/20 focus:ring-0 outline-none transition-all text-sm font-bold"
                  placeholder="Pattern, Word, Phrase..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Tail (意味/修正)
                </label>
                <input
                  name="tail"
                  required
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-blue-500/20 focus:ring-0 outline-none transition-all text-sm font-bold"
                  placeholder="Meaning, Correct..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 uppercase italic tracking-widest text-sm"
              >
                アイテムを保存
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-sm w-full lg:w-fit overflow-x-auto whitespace-nowrap scrollbar-hide">
          {(["EN", "ZH", "ES"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLang(l)}
              className={cn(
                "px-12 py-3.5 text-xs font-black rounded-2xl transition-all duration-300",
                selectedLang === l
                  ? "bg-slate-900 text-white shadow-xl rotate-0"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-sm w-full lg:w-fit overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setSelectedType("all")}
            className={cn(
              "px-8 py-3.5 text-xs font-black rounded-2xl transition-all duration-300",
              selectedType === "all"
                ? "bg-blue-600 text-white shadow-xl"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
            )}
          >
            すべて
          </button>
          {(["vocab", "grammar", "phrase", "mistake"] as ItemType[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={cn(
                  "px-10 py-3.5 text-xs font-black rounded-2xl transition-all duration-300",
                  selectedType === t
                    ? "bg-blue-600 text-white shadow-xl"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                )}
              >
                {typeLabel[t]}
              </button>
            ),
          )}
        </div>

        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="キーワード検索..."
            className="w-full pl-16 pr-8 py-4.5 rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm text-sm font-bold focus:border-blue-500/20 focus:ring-0 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => {
          const Icon = typeIcon[item.type];
          return (
            <div
              key={item.id}
              className="relative h-96 perspective-1000 group"
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
                <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-50 rounded-[3rem] p-10 shadow-xl shadow-slate-100/50 flex flex-col justify-between overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 right-10 w-16 h-1 blur-md",
                      typeColor[item.type],
                    )}
                  />
                  <div className="flex justify-between items-start">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                        typeColor[item.type],
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.id);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                          item.active
                            ? "bg-green-500 text-white scale-110"
                            : "bg-slate-200 text-slate-400",
                        )}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight group-hover:text-blue-600 transition-colors uppercase italic">
                      {item.head}
                    </h3>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] truncate max-w-[150px]">
                        ID: {item.video_id}
                      </span>
                    </div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-6">
                      TAP TO LEARN
                    </p>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-[3rem] p-10 shadow-2xl rotate-y-180 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16"></div>

                  <div className="relative z-10 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                        Translation
                      </h4>
                      <p className="text-white text-lg font-black italic">
                        {item.tail}
                      </p>
                    </div>

                    {(item.example || item.usage) && (
                      <div className="space-y-4">
                        {item.example && (
                          <div>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                              Example
                            </h4>
                            <p className="text-slate-300 text-xs font-bold leading-relaxed italic">
                              “{item.example}”
                            </p>
                          </div>
                        )}
                        {item.usage && (
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                              Explanation
                            </h4>
                            <p className="text-slate-400 text-[10px] font-bold leading-relaxed">
                              {item.usage}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">
                      {item.language} / ENGLISH FIRST
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Possible link to video detail?
                        alert(`Project: ${item.video_id}`);
                      }}
                      className="text-[9px] font-black text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                    >
                      VIEW PROJECT
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-span-full py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-200 animate-in fade-in duration-1000">
            <Ghost className="w-24 h-24 mb-6 opacity-10 animate-bounce" />
            <p className="font-black text-sm uppercase tracking-[0.3em] pl-2 text-slate-300">
              アイテムが見つかりません
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
