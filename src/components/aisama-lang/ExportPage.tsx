"use client";

import { db } from "@/lib/aisamaLangDb";
import { LearningItem } from "@/types/aisama-lang";
import { Download, FileDown, Layers } from "lucide-react";
import { useEffect, useState } from "react";

export const ExportPage = () => {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const allItems = await db.learningItems.listAll();
        setItems(allItems);
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const downloadCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "Language",
      "Type",
      "Head",
      "Tail",
      "Example",
      "Priority",
      "Active",
      "VideoID",
    ];
    const rows = items.map((i) => [
      i.language,
      i.type,
      `"${i.head.replace(/"/g, '""')}"`, // Escape quotes
      `"${i.tail.replace(/"/g, '""')}"`,
      `"${i.example?.replace(/"/g, '""') || ""}"`,
      i.priority || "med",
      i.active ? "TRUE" : "FALSE",
      i.video_id,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `polyglot_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          CSVエクスポート
        </h2>
        <p className="text-slate-500 font-medium mt-1">
          学習アイテムをCSV形式で出力します。Ankiなどへのインポートに利用できます。
        </p>
      </header>

      <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-10 text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125"></div>

        <div className="w-28 h-28 rounded-[2rem] bg-slate-50 text-slate-400 flex items-center justify-center shadow-inner relative z-10 group-hover:text-blue-600 group-hover:rotate-12 transition-all duration-500">
          <FileDown className="w-12 h-12 stroke-[1.5]" />
        </div>

        <div className="relative z-10 space-y-2">
          <p className="text-4xl font-black text-slate-800 tracking-tight">
            {loading ? "..." : `全 ${items.length} 件`}
            <span className="text-base text-slate-400 font-bold ml-2">
              ITEMS
            </span>
          </p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <Layers className="w-3 h-3" />
            Ready for Processing
          </p>
        </div>

        <button
          onClick={downloadCSV}
          disabled={loading || items.length === 0}
          className="relative z-10 px-12 py-6 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl shadow-slate-200 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm tracking-[0.2em] uppercase italic flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-blue-200"
        >
          <Download className="w-5 h-5 animate-bounce" />
          CSVをダウンロード
        </button>
      </div>
    </div>
  );
};
