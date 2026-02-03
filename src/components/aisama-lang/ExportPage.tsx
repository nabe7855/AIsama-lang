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

  const downloadCSV = (lang?: string) => {
    const targetItems = lang ? items.filter((i) => i.language === lang) : items;
    if (targetItems.length === 0) return;

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
    const rows = targetItems.map((i) => [
      i.language,
      i.type,
      `"${i.head.replace(/"/g, '""')}"`,
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
      `aisama_export_${lang || "all"}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const languages = Array.from(new Set(items.map((i) => i.language)));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="px-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          CSVエクスポート
        </h2>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
          全データを Anki 等へインポート可能な形式で出力します。
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Global Export Card */}
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center relative overflow-hidden group mx-1">
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-125"></div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.5rem] bg-slate-50 text-slate-400 flex items-center justify-center shadow-inner relative z-10 group-hover:text-blue-600 group-hover:rotate-6 transition-all duration-500">
            <FileDown className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
          </div>

          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {loading ? "..." : `全 ${items.length} 件`}
              <span className="text-xs sm:text-sm text-slate-400 font-bold ml-2">
                TOTAL ITEMS
              </span>
            </p>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-2 mt-2">
              <Layers className="w-3 h-3" />
              GLOBAL DATABASE
            </p>
          </div>

          <button
            onClick={() => downloadCSV()}
            disabled={loading || items.length === 0}
            className="relative z-10 w-full py-4 sm:py-5 bg-slate-900 text-white font-black rounded-xl sm:rounded-[2rem] shadow-xl hover:bg-blue-600 active:scale-95 transition-all duration-300 text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] uppercase italic flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            ALL DATA EXPORT
          </button>
        </div>

        {/* Language Specific Export */}
        <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-sm space-y-6 sm:space-y-8 relative overflow-hidden mx-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase italic">
              Language Specific
            </h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center text-slate-300 font-bold italic">
                Loading...
              </div>
            ) : languages.length === 0 ? (
              <div className="py-10 text-center text-slate-300 font-bold italic">
                No Data Found
              </div>
            ) : (
              languages.sort().map((lang) => {
                const langCount = items.filter(
                  (i) => i.language === lang,
                ).length;
                return (
                  <div
                    key={lang}
                    className="flex items-center justify-between p-5 sm:p-6 bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors group/row"
                  >
                    <div>
                      <p className="text-base sm:text-lg font-black text-slate-800 italic uppercase">
                        {lang}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {langCount} Items
                      </p>
                    </div>
                    <button
                      onClick={() => downloadCSV(lang)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all group-hover/row:scale-105"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
