"use client";

import { clsx, type ClassValue } from "clsx";
import {
  Bolt,
  ChevronRight,
  FileOutput,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";
import { useAuth } from "./AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/aisama-lang" && pathname === "/aisama-lang") return true;
    if (path !== "/aisama-lang" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: "ダッシュボード", path: "/aisama-lang", icon: LayoutDashboard },
    { name: "動画管理", path: "/aisama-lang/videos", icon: Video },
    { name: "学習アイテム", path: "/aisama-lang/items", icon: ListChecks },
    { name: "CSV出力", path: "/aisama-lang/export", icon: FileOutput },
  ];

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await logout();
      router.push("/aisama-lang/login");
    }
  };

  // const handleReset = () => {
  //   if (confirm("データをすべて削除しますか？")) {
  //     db.clearAll();
  //     window.location.reload();
  //   }
  // };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white shadow-2xl z-20">
        <div className="p-8">
          <Link
            href="/aisama-lang"
            className="text-2xl font-black flex items-center gap-3 tracking-tighter group italic"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Bolt className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            AIsama-lang OS
          </Link>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {user?.user_metadata?.full_name || user?.email || "Guest"} Connected
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 text-sm font-bold",
                isActive(item.path)
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              )}
            </Link>
          ))}

          <div className="pt-8 border-t border-slate-800 mt-6 px-1 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="lg:hidden px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
          <Link
            href="/aisama-lang"
            className="text-xl font-black italic flex items-center gap-2 text-slate-800"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bolt className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            AIsama OS
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-blue-500/10 flex items-center justify-center text-[8px] font-black text-blue-600 uppercase">
                {user?.email?.[0] || "?"}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto p-6 lg:p-10">{children}</div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden flex bg-white border-t border-slate-100 px-2 py-3 pb-8 safe-area-bottom sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-1 transition-all duration-300",
                isActive(item.path) ? "text-blue-600" : "text-slate-400",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive(item.path) && "fill-blue-600/10",
                )}
              />
              <span className="text-[9px] font-black uppercase tracking-tighter">
                {item.name === "ダッシュボード"
                  ? "HOME"
                  : item.name === "動画管理"
                    ? "VIDEOS"
                    : item.name === "学習アイテム"
                      ? "ITEMS"
                      : "EXPORT"}
              </span>
              {isActive(item.path) && (
                <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5 animate-in zoom-in duration-300" />
              )}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};
