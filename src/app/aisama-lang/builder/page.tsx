"use client";

import { useLanguage } from "@/components/aisama-lang/LanguageContext"; // Ensure correct import path
import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import { db } from "@/lib/aisamaLangDb";
import { ItemSelector, SpecGenerator } from "@/lib/boudgetSlotSystem";
import { LearningItem } from "@/types/aisama-lang";
import {
  Bolt,
  Brain,
  Check,
  Copy,
  RefreshCw,
  Settings2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(inputs);
}

export default function BuilderPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <BuilderContent />
      </Layout>
    </ProtectedRoute>
  );
}

function BuilderContent() {
  const { selectedLang } = useLanguage();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [topic, setTopic] = useState("");

  // Budget Config
  const [weakCount, setWeakCount] = useState(3);
  const [reviewCount, setReviewCount] = useState(5);
  const [newCount, setNewCount] = useState(2);

  // Selected Items
  const [selectedWeak, setSelectedWeak] = useState<LearningItem[]>([]);
  const [selectedReview, setSelectedReview] = useState<LearningItem[]>([]);

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      const all = await db.learningItems.listAll();
      setItems(all.filter((i) => i.language === selectedLang));
    };
    loadItems();
  }, [selectedLang]);

  // Auto-select items when config/items change
  useEffect(() => {
    if (items.length === 0) return;
    const selection = ItemSelector.selectItems(
      items,
      { weakCount, reviewCount, newCount },
      selectedLang,
    );
    setSelectedWeak(selection.weakItems);
    setSelectedReview(selection.reviewItems);
  }, [items, weakCount, reviewCount, newCount, selectedLang]);

  const handleGenerate = () => {
    const spec = SpecGenerator.generate(
      selectedLang,
      topic || "Daily Conversation",
      selectedWeak,
      selectedReview,
      {
        level: "B1",
        durationSeconds: 60,
      },
    );
    const prompt = SpecGenerator.renderToPrompt(spec);
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            ミッション作成 (BUILDER)
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-2 ml-16 tracking-widest uppercase">
            次回の学習セッションを設計しましょう
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Topic */}
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
              1. セッションのテーマ (Topic)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: カフェでの注文、面接の練習、旅行の計画..."
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:bg-white focus:border-indigo-500/20 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </section>

          {/* 2. Budget Sliders */}
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                2. 構成バランス (Budget)
              </h3>
            </div>

            {/* Weakness Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <TriangleAlert className="w-3 h-3" />
                  苦手項目 (Weak)
                </label>
                <span className="text-xs font-black bg-red-50 text-red-500 px-3 py-1 rounded-full">
                  {weakCount} 個
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={weakCount}
                onChange={(e) => setWeakCount(Number(e.target.value))}
                className="w-full accent-red-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Review Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  復習・定着 (Review)
                </label>
                <span className="text-xs font-black bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full">
                  {reviewCount} 個
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={reviewCount}
                onChange={(e) => setReviewCount(Number(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* New Slider */}
            <div className="space-y-3 opacity-50 pointer-events-none grayscale">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <Bolt className="w-3 h-3" />
                  新規挑戦 (New)
                </label>
                <span className="text-xs font-black bg-green-50 text-green-500 px-3 py-1 rounded-full">
                  {newCount} 個
                </span>
              </div>
              <input
                type="range"
                value={newCount}
                readOnly
                className="w-full accent-green-500 h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-400 font-bold text-center mt-1">
                Coming Soon
              </p>
            </div>
          </section>
        </div>

        {/* Middle: Preview */}
        <div className="lg:col-span-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col h-[600px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block flex items-center gap-2">
            <Brain className="w-4 h-4" />
            選択された学習項目
          </label>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {selectedWeak.length === 0 && selectedReview.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold gap-2">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                  <Bolt className="w-5 h-5 opacity-50" />
                </div>
                項目が選択されていません
              </div>
            )}

            {selectedWeak.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border-l-4 border-red-400 shadow-sm flex items-start gap-3"
              >
                <div className="mt-0.5">
                  <TriangleAlert className="w-3 h-3 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">
                    {item.head}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 line-clamp-1">
                    {item.tail}
                  </p>
                </div>
              </div>
            ))}
            {selectedReview.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border-l-4 border-indigo-400 shadow-sm flex items-start gap-3"
              >
                <div className="mt-0.5">
                  <RefreshCw className="w-3 h-3 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">
                    {item.head}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 line-clamp-1">
                    {item.tail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-black text-slate-500 mb-2">
              <span>難易度スコア</span>
              <span className="text-indigo-600">
                {selectedWeak.length * 3 + selectedReview.length} pts
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (selectedWeak.length * 3 + selectedReview.length) * 2)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-3">
          <div className="sticky top-8">
            <button
              onClick={handleGenerate}
              className={cn(
                "w-full py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 mb-6 flex items-center justify-center gap-3",
                generatedPrompt
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200",
              )}
            >
              {generatedPrompt ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generatedPrompt ? "再生成する" : "プロンプト生成"}
            </button>

            {generatedPrompt && (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-slate-300 relative group animate-in slide-in-from-bottom-4">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={copyToClipboard}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isCopied
                        ? "bg-green-500 text-white"
                        : "bg-white/10 hover:bg-white text-white/50 hover:text-slate-900",
                    )}
                  >
                    {isCopied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-indigo-400">
                  生成結果 (Generated Prompt)
                </h3>
                <div className="h-[400px] overflow-y-auto pr-2 font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-white/20">
                  {generatedPrompt}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">
                  コピーしてChatGPTで使用してください
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
