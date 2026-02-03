"use client";

import {
  Brain,
  Copy,
  Globe2,
  MessageSquareQuote,
  Mic,
  Sparkles,
} from "lucide-react";

export const ScriptsPage = () => {
  const prompts = [
    {
      title: "学習ポイント抽出",
      icon: Brain,
      color: "bg-orange-50 text-orange-500",
      prompt:
        "以下のスクリプトから、学習すべき「単語」「文法」「フレーズ」および「間違えやすいポイント」を特定し、JSON形式で出力してください。",
    },
    {
      title: "自然な表現へのリライト",
      icon: Sparkles,
      color: "bg-blue-50 text-blue-500",
      prompt:
        "このスクリプトの内容を維持したまま、ネイティブスピーカーが日常的に使うより自然で洗練された表現にリライトしてください。",
    },
    {
      title: "シャドーイング練習",
      icon: Mic,
      color: "bg-green-50 text-green-500",
      prompt:
        "このスクリプトを効果的に練習するためのポーズの位置、強調すべき単語、発音の注意点を箇条書きで教えてください。",
    },
    {
      title: "文化的背景",
      icon: Globe2,
      color: "bg-purple-50 text-purple-500",
      prompt:
        "スクリプトに含まれる表現が、ターゲット言語の文化圏でどのようなニュアンスを持つか詳しく解説してください。",
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("プロンプトをコピーしました");
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          プロンプト集
        </h2>
        <p className="text-slate-500 font-medium mt-1">
          AI解析や学習に役立つ便利なプロンプトのテンプレートです。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {prompts.map((p, i) => (
          <div
            key={i}
            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex items-center gap-5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${p.color}`}
              >
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-800 text-xl tracking-tight">
                {p.title}
              </h3>
            </div>

            <div className="p-8 bg-slate-50/50 rounded-[2rem] relative group border-2 border-transparent group-hover:border-slate-100 transition-colors">
              <MessageSquareQuote className="w-8 h-8 text-slate-200 absolute top-4 left-4 -z-10" />
              <p className="text-sm font-medium text-slate-600 leading-relaxed font-mono">
                {p.prompt}
              </p>
              <button
                onClick={() => handleCopy(p.prompt)}
                className="absolute top-4 right-4 text-slate-400 hover:text-blue-500 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white p-2 rounded-xl shadow-sm"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
