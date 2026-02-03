"use client";

import { clsx, type ClassValue } from "clsx";
import { Bolt, ChevronRight, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useAuth } from "./AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { signInWithGoogle, user } = useAuth();

  if (user) {
    router.push("/aisama-lang");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, only Google Auth is fully supported with Supabase
    alert(
      "現在、Googleログインのみサポートされています。下のボタンを使用してください。",
    );
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-6 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 -right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-12 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center space-y-6">
          <div className="inline-block w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(37,99,235,0.6)] transform rotate-12 hover:rotate-0 transition-all duration-700 group cursor-none">
            <Bolt className="text-white w-12 h-12 fill-white animate-bounce group-hover:animate-none" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter italic scale-y-110">
              AIsama-lang OS
            </h1>
            <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px] pl-2 drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]">
              AIsama-lang（アイ様語学）
            </p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] space-y-10 border border-white/10">
          <div className="flex bg-slate-100/50 p-2 rounded-[2rem] border-2 border-slate-100">
            <button
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-4 text-[10px] font-black rounded-2xl transition-all duration-500 tracking-widest uppercase",
                isLogin
                  ? "bg-white text-slate-900 shadow-xl"
                  : "text-slate-400",
              )}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-4 text-[10px] font-black rounded-2xl transition-all duration-500 tracking-widest uppercase",
                !isLogin
                  ? "bg-white text-slate-900 shadow-xl"
                  : "text-slate-400",
              )}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Email Address
              </label>
              <input
                required
                type="email"
                className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-blue-500/20 outline-none transition-all shadow-inner"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <input
                required
                type="password"
                className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-blue-500/20 outline-none transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-8 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm tracking-[0.3em] uppercase italic flex items-center justify-center gap-4"
            >
              {isLogin ? "Enter OS" : "Initialize Account"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-50"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300">
              <span className="px-6 bg-white tracking-widest">
                Or Secure Login With
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-6 border-2 border-slate-100 bg-white text-slate-600 font-bold rounded-[2rem] flex items-center justify-center gap-4 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 text-xs"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </button>
        </div>
      </div>
    </div>
  );
};
