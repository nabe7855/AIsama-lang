"use client";

import { Layout } from "@/components/aisama-lang/Layout";
import { ProtectedRoute } from "@/components/aisama-lang/ProtectedRoute";
import {
  BookOpen,
  ChevronRight,
  Clock,
  GraduationCap,
  Info,
  Star,
  Target,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(inputs);
}

const cefrData = [
  {
    level: "A1",
    name: "Beginner / 初学者",
    description:
      "日常的な簡単な挨拶や、具体的な要求を伝えるための非常に基本的な表現を理解し、使うことができる。",
    hours: "75 - 100時間",
    vocab: "~ 500語",
    features: [
      "自己紹介ができる",
      "簡単な質問ができる・答えられる",
      "短い基本的な文章が読める",
    ],
    color: "bg-slate-100 text-slate-600",
    accent: "bg-slate-50 border-slate-200",
  },
  {
    level: "A2",
    name: "Elementary / 初級",
    description:
      "身近な話題（家族、仕事、買い物など）に関する日常的な表現を理解し、簡単な情報のやり取りができる。",
    hours: "180 - 200時間",
    vocab: "~ 1,000語",
    features: [
      "日常会話ができる",
      "過去の経験を簡単に説明できる",
      "身近な環境について話せる",
    ],
    color: "bg-emerald-100 text-emerald-600",
    accent: "bg-emerald-50 border-emerald-200",
  },
  {
    level: "B1",
    name: "Intermediate / 中級",
    description:
      "標準的な話し方であれば、身近な話題や関心のある分野の概要を理解でき、旅行中などのトラブルにも対応できる。",
    hours: "350 - 400時間",
    vocab: "~ 2,000語",
    features: [
      "意見や夢、計画を語れる",
      "話の筋道を説明できる",
      "未知の状況でも何とか対応できる",
    ],
    color: "bg-blue-100 text-blue-600",
    accent: "bg-blue-50 border-blue-200",
  },
  {
    level: "B2",
    name: "Upper Intermediate / 中上級",
    description:
      "複雑な文章の要点を理解し、専門分野の議論にも参加できる。自然で流暢なやり取りが可能になる。",
    hours: "500 - 600時間",
    vocab: "~ 4,000語",
    features: [
      "抽象的な話題も理解できる",
      "ネイティブと普通に会話ができる",
      "詳細なレポートを書ける",
    ],
    color: "bg-indigo-100 text-indigo-600",
    accent: "bg-indigo-50 border-indigo-200",
  },
  {
    level: "C1",
    name: "Advanced / 上級",
    description:
      "広範で複雑な長い文章を理解し、含意を把握できる。言葉に詰まることなく、流暢に、かつ自然に自己表現ができる。",
    hours: "700 - 800時間",
    vocab: "~ 8,000語",
    features: [
      "社会的・学術的・専門的に使いこなせる",
      "複雑なトピックを詳細に説明できる",
      "論理的な文章を自在に書ける",
    ],
    color: "bg-purple-100 text-purple-600",
    accent: "bg-purple-50 border-purple-200",
  },
  {
    level: "C2",
    name: "Mastery / 最上級",
    description:
      "聞いたり読んだりした、ほぼ全てのものを容易に理解できる。非常に細かいニュアンスを正確に伝え分けられる。",
    hours: "1,000時間 〜",
    vocab: "16,000語 〜",
    features: [
      "自然かつ正確で流暢な表現",
      "複雑なニュアンスの解釈",
      "専門家レベルの言語運用能力",
    ],
    color: "bg-rose-100 text-rose-600",
    accent: "bg-rose-50 border-rose-200",
  },
];

export default function GuidePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
          {/* Header */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 blur-[120px] -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic">
                  CEFR LEVEL GUIDE
                </h2>
              </div>
              <p className="max-w-2xl text-slate-500 font-bold leading-relaxed">
                CEFR（ヨーロッパ言語共通参照枠）は、語学の習得レベルを評価するための国際的な基準です。
                目標とするレベルに合わせて、必要な学習時間やスキルの目安を確認しましょう。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cefrData.map((data) => (
              <div
                key={data.level}
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div
                      className={cn(
                        "px-4 py-2 rounded-2xl font-black text-lg italic tracking-widest",
                        data.color,
                      )}
                    >
                      {data.level}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Target Time
                      </p>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-2 justify-end">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {data.hours}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
                      {data.name}
                    </h3>
                    <p className="text-[11px] leading-relaxed font-bold text-slate-500">
                      {data.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Vocabulary
                      </p>
                      <p className="text-xs font-black text-slate-800">
                        {data.vocab}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3 text-red-400" />
                      Key Skills
                    </p>
                    <ul className="space-y-2">
                      {data.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-[10px] font-bold text-slate-600"
                        >
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto p-2">
                  <div
                    className={cn(
                      "py-4 rounded-[1.5rem] flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0",
                      data.color,
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Learn this level
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advice Section */}
          <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-full bg-blue-600/10 -rotate-12 translate-y-1/2"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter mb-6">
                  YOUR LEARNING JOURNEY
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <p className="font-black text-sm mb-1 uppercase tracking-wide">
                        継続は力なり
                      </p>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        B2レベル（中上級）に到達するには約500〜600時間の学習が必要です。
                        毎日の動画練習を習慣化し、コツコツと学習時間を積み上げましょう。
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm mb-1 uppercase tracking-wide">
                        アダプティブ学習
                      </p>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        AIsama-lang
                        OSは、あなたの苦手項目やレベル設定に合わせて、最適なスクリプト生成プロンプトを作成します。
                        今の実力に少しだけ「チャレンジ」を加えるのが最短ルートです。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] space-y-6">
                <p className="text-xs font-bold text-blue-300 italic">
                  "The limit of my language means the limit of my world."
                </p>
                <div className="space-y-4">
                  <p className="text-sm font-black italic">Next Milestone:</p>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-blue-500 rounded-full w-2/3 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>A2 Level</span>
                    <span className="text-white">67% Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
