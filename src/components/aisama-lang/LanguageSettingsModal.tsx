"use client";

import { Check, Globe, Trash2, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "./LanguageContext";

function cn(...inputs: any[]) {
  return twMerge(inputs);
}

const LANGUAGE_POOL = [
  { code: "EN", name: "English", flag: "🇺🇸", desc: "英語" },
  { code: "ZH", name: "Chinese", flag: "🇨🇳", desc: "中国語" },
  { code: "ES", name: "Spanish", flag: "🇪🇸", desc: "スペイン語" },
  { code: "FR", name: "French", flag: "🇫🇷", desc: "フランス語" },
  { code: "DE", name: "German", flag: "🇩🇪", desc: "ドイツ語" },
  { code: "IT", name: "Italian", flag: "🇮🇹", desc: "イタリア語" },
  { code: "KO", name: "Korean", flag: "🇰🇷", desc: "韓国語" },
  { code: "RU", name: "Russian", flag: "🇷🇺", desc: "ロシア語" },
  { code: "PT", name: "Portuguese", flag: "🇵🇹", desc: "ポルトガル語" },
  { code: "TH", name: "Thai", flag: "🇹🇭", desc: "タイ語" },
  { code: "VI", name: "Vietnamese", flag: "🇻🇳", desc: "ベトナム語" },
  { code: "JP", name: "Japanese", flag: "🇯🇵", desc: "日本語" },
];

export const LanguageSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { activeLanguages, addLanguage, removeLanguage } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 sm:p-12 border-b border-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tighter italic">
              LANGUAGE SETTINGS
            </h3>
            <p className="text-[9px] text-slate-400 font-black uppercase mt-1 sm:mt-2 tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3 text-blue-500" />
              学習言語の管理 (ADD / REMOVE)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center"
          >
            <X className="w-6 h-6 sm:w-8 h-8" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-8">
          <section>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
              有効な言語 (Active)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeLanguages.map((langCode) => {
                const info = LANGUAGE_POOL.find((p) => p.code === langCode) || {
                  code: langCode,
                  name: langCode,
                  flag: "🏳️",
                  desc: "Custom",
                };
                return (
                  <div
                    key={langCode}
                    className="group flex items-center justify-between p-4 bg-blue-50/50 border-2 border-blue-100 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{info.flag}</span>
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {info.name}
                        </p>
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                          {info.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLanguage(langCode)}
                      className="w-8 h-8 rounded-lg bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
              言語を追加 (Available)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGE_POOL.filter(
                (p) => !activeLanguages.includes(p.code),
              ).map((info) => (
                <button
                  key={info.code}
                  onClick={() => addLanguage(info.code)}
                  className="p-4 bg-slate-50 border-2 border-transparent hover:border-blue-500/20 hover:bg-white rounded-2xl transition-all text-left flex flex-col gap-1 group"
                >
                  <span className="text-xl mb-1">{info.flag}</span>
                  <p className="text-[10px] font-black text-slate-800 group-hover:text-blue-600">
                    {info.name}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    {info.desc}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-xs tracking-[0.2em] uppercase italic flex items-center justify-center gap-3"
          >
            <Check className="w-4 h-4" />
            SETTINGS COMPLETED
          </button>
        </div>
      </div>
    </div>
  );
};
