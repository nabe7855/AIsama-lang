
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { db } from './services/db';
import { Video, Script, LearningItem, SpeakingScore, Language, ItemType, VideoStatus } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Auth Context ---
interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('polyglot_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const login = (email: string) => {
    const newUser = { email, name: email.split('@')[0] };
    setUser(newUser);
    localStorage.setItem('polyglot_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('polyglot_user');
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-black italic">LOADING OS...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// --- Helpers ---
const statusLabel: Record<VideoStatus, string> = {
  draft: '下書き',
  practicing: '練習中',
  recorded: '収録済み',
  posted: '投稿済み'
};

const typeLabel: Record<ItemType, string> = {
  grammar: '文法',
  vocab: '単語',
  phrase: 'フレーズ',
  mistake: 'ミス'
};

const priorityLabel: Record<string, string> = {
  low: '低',
  med: '中',
  high: '高'
};

// --- Shared Components ---

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <Link to="/" className="text-2xl font-black flex items-center gap-2 tracking-tighter group italic">
            <i className="fa-solid fa-bolt-lightning text-yellow-400 group-hover:scale-110 transition-transform"></i>
            POLYGLOT OS
          </Link>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {user?.name} Connected
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 pb-10 overflow-y-auto">
          <Link to="/" className={`flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm ${isActive('/') ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 text-slate-400'}`}>
            <i className="fa-solid fa-chart-pie w-5"></i> ダッシュボード
          </Link>
          <Link to="/videos" className={`flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm ${location.pathname.startsWith('/videos') ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 text-slate-400'}`}>
            <i className="fa-solid fa-clapperboard w-5"></i> 動画管理
          </Link>
          <Link to="/items" className={`flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm ${isActive('/items') ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 text-slate-400'}`}>
            <i className="fa-solid fa-list-check w-5"></i> 学習アイテム
          </Link>
          <Link to="/scripts" className={`flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm ${isActive('/scripts') ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 text-slate-400'}`}>
            <i className="fa-solid fa-terminal w-5"></i> プロンプト集
          </Link>
          <Link to="/export" className={`flex items-center gap-3 px-4 py-4 rounded-xl transition text-sm ${isActive('/export') ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 text-slate-400'}`}>
            <i className="fa-solid fa-file-export w-5"></i> 4CSV出力
          </Link>
          
          <div className="pt-8 border-t border-slate-800 mt-6 px-4 space-y-2">
            <button 
              onClick={() => { if(confirm('ログアウトしますか？')){ logout(); navigate('/login'); } }}
              className="w-full flex items-center gap-2 py-3 rounded-lg text-slate-400 hover:bg-slate-800 transition text-xs font-bold"
            >
              <i className="fa-solid fa-right-from-bracket"></i> ログアウト
            </button>
            <button 
              onClick={() => { if(confirm('データをすべて削除しますか？')){ localStorage.clear(); window.location.reload(); } }}
              className="w-full flex items-center gap-2 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition text-xs font-bold"
            >
              <i className="fa-solid fa-eraser"></i> データを初期化
            </button>
          </div>
        </nav>
      </aside>
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-10 scroll-smooth">
        {children}
      </main>
    </div>
  );
};

// --- Auth Page ---

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, user } = useAuth();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
      navigate('/');
    }
  };

  const handleGoogleLogin = () => {
    // 実際の実装ではここでOAuthフローを開始しますが、今回はデモ用に即ログインします
    login('google_user@gmail.com');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="inline-block w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/50 transform rotate-12">
            <i className="fa-solid fa-bolt-lightning text-white text-4xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">POLYGLOT OS</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Multilingual Narration Learning OS</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
            >
              ログイン
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
              <input 
                required
                type="email" 
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500/20 outline-none transition-all" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
              <input 
                required
                type="password" 
                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500/20 outline-none transition-all" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-sm tracking-widest uppercase italic">
              {isLogin ? 'Enter OS' : 'Create Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="px-4 bg-white tracking-widest">Or Continue With</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-4 border-2 border-slate-100 bg-white text-slate-600 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-xs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ItemsPage Implementation (Global/Integrated View) ---

const ItemsPage = () => {
  const [selectedLang, setSelectedLang] = useState<Exclude<Language, 'JP'>>('EN');
  const [selectedType, setSelectedType] = useState<ItemType>('vocab');
  const [items, setItems] = useState<LearningItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const videos = db.videos.list();

  const refresh = () => {
    const all = db.getDB().learningItems;
    setItems(all.filter(i => i.language === selectedLang && i.type === selectedType).reverse());
  };

  useEffect(() => {
    refresh();
  }, [selectedLang, selectedType]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    const vId = d.get('video_id') as string;
    const head = d.get('head') as string;
    const tail = d.get('tail') as string;

    if(!vId || !head || !tail) return alert("必須項目を入力してください");

    db.learningItems.add({
      id: Math.random().toString(36).substr(2, 9),
      video_id: vId,
      language: selectedLang,
      type: selectedType,
      head,
      tail,
      example: d.get('example') as string,
      usage: d.get('usage') as string,
      priority: 'med',
      active: true,
      created_at: new Date().toISOString()
    });
    form.reset();
    setShowAddForm(false);
    refresh();
  };

  const handleToggle = (id: string) => {
    db.learningItems.toggleActive(id);
    refresh();
  };

  const handleDelete = (id: string) => {
    if(confirm('削除しますか？')){
      const state = db.getDB();
      state.learningItems = state.learningItems.filter(i => i.id !== id);
      db.saveDB(state);
      refresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">学習アイテム・ライブラリ</h2>
          <p className="text-slate-500 font-medium mt-2">全プロジェクトの知識を統合管理します。</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition ${showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
        >
          <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'}`}></i> {showAddForm ? '閉じる' : '新規アイテム追加'}
        </button>
      </header>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl border-2 border-blue-50 shadow-2xl shadow-blue-100/50 animate-fadeInUp">
          <form onSubmit={handleManualAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">対象動画</label>
                <select name="video_id" required className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 text-sm font-bold">
                  <option value="">動画を選択...</option>
                  {videos.map(v => <option key={v.video_id} value={v.video_id}>{v.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{typeLabel[selectedType]} (Head)</label>
                <input name="head" required className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 text-sm" placeholder="単語、フレーズ等" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">意味/正答 (Tail)</label>
                <input name="tail" required className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 text-sm" placeholder="意味や正解" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition">アイテムを保存</button>
            </div>
          </form>
        </div>
      )}

      {/* Selectors */}
      <div className="flex flex-col gap-6">
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-fit">
          {(['EN', 'ZH', 'ES'] as const).map(l => (
            <button key={l} onClick={() => setSelectedLang(l)} className={`px-10 py-3 text-xs font-black rounded-xl transition-all ${selectedLang === l ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
          ))}
        </div>
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
          {(['vocab', 'grammar', 'phrase', 'mistake'] as ItemType[]).map(t => (
            <button key={t} onClick={() => setSelectedType(t)} className={`flex-1 px-8 py-3 text-xs font-black rounded-xl transition-all ${selectedType === t ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{typeLabel[t]}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all relative group flex flex-col justify-between ${item.active ? 'border-slate-100 shadow-xl shadow-slate-100/50' : 'border-transparent bg-slate-50/50 opacity-40 hover:opacity-100'}`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] truncate max-w-[150px]">{item.video_id}</span>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => handleToggle(item.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${item.active ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-200 text-slate-400'}`}
                  >
                    <i className="fa-solid fa-check text-xs"></i>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xl font-black text-slate-800 leading-none">{item.head}</p>
                <p className="text-sm font-bold text-blue-600">{item.tail}</p>
              </div>
            </div>
            {item.example && (
              <div className="mt-6 pt-4 border-t border-slate-50 italic text-[11px] text-slate-400 font-medium leading-relaxed">
                “{item.example}”
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-40 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-200">
            <i className="fa-solid fa-ghost text-6xl mb-4 opacity-10"></i>
            <p className="font-black text-sm uppercase tracking-widest">アイテムが見つかりません</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = () => {
  const videos = db.videos.list();
  const allScores = videos.flatMap(v => db.scores.list(v.video_id));
  const statusCounts = videos.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const latestScores = (['EN', 'ZH', 'ES'] as const).map(lang => {
    const scores = allScores.filter(s => s.language === lang);
    const latest = scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return { lang, latest };
  });

  return (
    <div className="space-y-10 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">ダッシュボード</h2>
        <p className="text-slate-500 font-medium mt-1">進捗状況と最新スコアのサマリーです。</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {(['draft', 'practicing', 'recorded', 'posted'] as VideoStatus[]).map(status => (
          <div key={status} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{statusLabel[status]}</p>
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{statusCounts[status] || 0}<span className="text-sm font-bold text-slate-300 ml-1">件</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {latestScores.map(({ lang, latest }) => (
          <div key={lang} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-12 -mt-12 transition-all group-hover:scale-150 ${lang === 'EN' ? 'bg-blue-500' : lang === 'ZH' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{lang}</div>
              {latest && latest.total >= 75 && (
                <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-green-100 animate-pulse">POST OK</span>
              )}
            </div>
            {latest ? (
              <div className="space-y-4">
                <div className="text-5xl font-black text-slate-800 tracking-tighter">{latest.total}<span className="text-base text-slate-300 font-bold">/100</span></div>
                <div className="pt-4 border-t border-slate-50">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Latest Video</p>
                   <p className="text-sm font-black text-slate-600 truncate">{latest.video_id}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-300 text-sm font-bold italic py-6">No data recorded</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <i className="fa-solid fa-history text-blue-500"></i> 最近のビデオプロジェクト
        </h3>
        <div className="space-y-4">
          {videos.slice(0, 5).reverse().map(v => (
            <Link key={v.video_id} to={`/videos/${v.video_id}`} className="flex items-center justify-between p-6 rounded-2xl hover:bg-slate-50 transition border-2 border-transparent hover:border-slate-100 group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                  <i className="fa-solid fa-play text-lg"></i>
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-800">{v.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{v.video_id} • {v.date}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-4 py-2 rounded-xl border-2 tracking-widest ${
                v.status === 'posted' ? 'bg-green-50 border-green-100 text-green-600' :
                v.status === 'recorded' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>{statusLabel[v.status].toUpperCase()}</span>
            </Link>
          ))}
          {videos.length === 0 && <p className="text-center py-10 text-slate-300 italic font-bold">ビデオがまだ作成されていません。</p>}
        </div>
      </div>
    </div>
  );
};

// --- VideoDetail Component ---

const VideoDetail = () => {
  const { video_id } = useParams<{ video_id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<Language>('JP');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [scores, setScores] = useState<SpeakingScore[]>([]);
  
  // UI States
  const [isAddingScore, setIsAddingScore] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (video_id) {
      const v = db.videos.get(video_id);
      if (v) {
        setVideo(v);
        setScripts(db.scripts.list(video_id));
        setLearningItems(db.learningItems.list(video_id));
        setScores(db.scores.list(video_id));
      }
    }
  }, [video_id]);

  if (!video) return <div className="p-20 text-center text-slate-400 font-black">VIDEO NOT FOUND</div>;

  const currentScripts = scripts.filter(s => s.language === activeTab);
  const activeScript = currentScripts.find(s => s.active) || currentScripts[currentScripts.length - 1];
  
  const handleAddScript = (text: string) => {
    const nextVer = (currentScripts.length > 0 ? Math.max(...currentScripts.map(s => s.version)) : 0) + 1;
    const newScript: Script = {
      id: Math.random().toString(36).substr(2, 9),
      video_id: video.video_id,
      language: activeTab,
      level: activeTab === 'JP' ? 'base' : (activeTab === 'EN' ? 'A' : activeTab === 'ZH' ? 'B' : 'C'),
      version: nextVer,
      text,
      active: true,
      created_at: new Date().toISOString()
    };
    db.scripts.add(newScript);
    setScripts(db.scripts.list(video.video_id));
  };

  const handleJsonImport = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.language !== activeTab && activeTab !== 'JP') {
        throw new Error(`言語不一致: 現在のタブは${activeTab}ですがJSONは${parsed.language}です。`);
      }
      const mapped: LearningItem[] = [];
      const importLang = (activeTab === 'JP' ? (parsed.language || 'EN') : activeTab) as Exclude<Language, 'JP'>;

      ['grammar', 'vocab', 'phrases', 'mistakes'].forEach(key => {
        const type = key === 'phrases' ? 'phrase' : key === 'mistakes' ? 'mistake' : key as ItemType;
        (parsed.items[key] || []).forEach((i: any) => {
          mapped.push({
            id: Math.random().toString(36).substr(2, 9),
            video_id: video.video_id,
            language: importLang,
            type,
            head: i.pattern || i.word || i.phrase || i.wrong || "",
            tail: i.meaning || i.correct || "",
            example: i.example || i.reason || "",
            usage: i.usage || "",
            priority: (i.priority || 'med') as any,
            active: true,
            created_at: new Date().toISOString()
          });
        });
      });
      db.learningItems.addMany(mapped);
      setLearningItems(db.learningItems.list(video.video_id));
      setIsBulkImporting(false);
      setJsonInput('');
      alert(`${mapped.length}件のアイテムを追加しました！`);
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleToggleItem = (id: string) => {
    db.learningItems.toggleActive(id);
    setLearningItems(db.learningItems.list(video.video_id));
  };

  const handleUpdateStatus = (status: VideoStatus) => {
    const updated = { ...video, status, updated_at: new Date().toISOString() };
    db.videos.upsert(updated);
    setVideo(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate('/videos')} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition shadow-sm"><i className="fa-solid fa-arrow-left"></i></button>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{video.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] pl-16">
            <span className="flex items-center gap-2 bg-blue-50 text-blue-500 px-3 py-1 rounded-full"><i className="fa-solid fa-tag"></i> {video.video_id}</span>
            <span className="flex items-center gap-2"><i className="fa-solid fa-location-arrow"></i> {video.location || 'NO LOCATION'}</span>
            <span className="flex items-center gap-2"><i className="fa-solid fa-calendar-day"></i> {video.date}</span>
          </div>
        </div>
        <select 
          className={`px-6 py-3 rounded-2xl border-2 font-black text-xs transition-all shadow-md ${video.status === 'posted' ? 'bg-green-500 text-white border-green-500 shadow-green-200' : video.status === 'recorded' ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-slate-50 text-slate-500 border-slate-100 shadow-slate-100'}`}
          value={video.status}
          onChange={(e) => handleUpdateStatus(e.target.value as any)}
        >
          {Object.entries(statusLabel).map(([val, lab]) => <option key={val} value={val}>{lab.toUpperCase()}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex bg-slate-50/50 p-2 border-b border-slate-100">
              {(['JP', 'EN', 'ZH', 'ES'] as Language[]).map(lang => (
                <button key={lang} onClick={() => setActiveTab(lang)} className={`flex-1 py-4 font-black text-xs transition-all rounded-2xl ${activeTab === lang ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-500'}`}>{lang}</button>
              ))}
            </div>
            <div className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
                   <i className="fa-solid fa-file-lines text-blue-500"></i> スクリプト編集
                </h3>
                {activeTab !== 'JP' && (
                  <button onClick={() => setIsBulkImporting(true)} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] tracking-widest hover:bg-indigo-100 transition shadow-sm uppercase"><i className="fa-solid fa-bolt mr-2"></i>AI JSON 一括登録</button>
                )}
              </div>
              <textarea 
                className="w-full h-80 p-8 rounded-[2rem] border-2 border-slate-50 focus:border-blue-500/20 focus:ring-0 focus:outline-none text-slate-700 font-medium leading-relaxed bg-slate-50/30 text-base resize-none shadow-inner"
                placeholder={`${activeTab}で入力してください...`}
                value={activeScript?.text || ''}
                onChange={(e) => handleAddScript(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-700 text-sm flex items-center gap-3">
                 <i className="fa-solid fa-brain text-orange-400"></i> 登録アイテム ({activeTab})
              </h3>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">NotebookLM export ready items</p>
            </div>
            <div className="p-8 space-y-3">
              {activeTab === 'JP' ? (
                 <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] text-slate-300 font-bold italic text-sm">外国語タブを選択してアイテムを登録・管理してください</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningItems.filter(i => i.language === activeTab).map(item => (
                    <div key={item.id} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all group ${item.active ? 'bg-white border-blue-50 shadow-lg shadow-blue-100/20' : 'bg-slate-50 border-transparent opacity-40 hover:opacity-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.type === 'vocab' ? 'bg-orange-400' : item.type === 'grammar' ? 'bg-blue-400' : item.type === 'phrase' ? 'bg-purple-400' : 'bg-red-400'}`}></div>
                        <div>
                          <p className="font-black text-slate-800 text-sm leading-tight">{item.head}</p>
                          <p className="text-xs text-slate-500 font-bold">{item.tail}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleItem(item.id)} 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${item.active ? 'bg-blue-600 text-white scale-110' : 'bg-white text-slate-300 border border-slate-100'}`}
                      >
                        <i className={`fa-solid ${item.active ? 'fa-check' : 'fa-star'}`}></i>
                      </button>
                    </div>
                  ))}
                  {learningItems.filter(i => i.language === activeTab).length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-200 font-bold border-2 border-dashed border-slate-50 rounded-[2rem] italic">アイテム未登録</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-700 text-sm">採点ログ</h3>
              <button onClick={() => setIsAddingScore(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-blue-200">RECORD</button>
            </div>
            <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {scores.filter(s => s.language === activeTab).length > 0 ? (
                scores.filter(s => s.language === activeTab).reverse().map(score => (
                  <div key={score.id} className="p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 space-y-4 hover:border-blue-100 hover:bg-white transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{score.date}</span>
                      <span className={`text-2xl font-black italic ${score.total >= 75 ? 'text-green-500 underline decoration-green-200 decoration-4' : 'text-slate-800'}`}>{score.total}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 leading-relaxed">{score.main_problem}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 italic">💡 {score.improvement_tip}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-200 italic font-black text-xs uppercase tracking-[0.2em]">No records for {activeTab}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Dialog */}
      {isBulkImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fadeInUp">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800">AI JSON 一括インポート</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Target: {activeTab} / Video ID: {video.video_id}</p>
              </div>
              <button onClick={() => setIsBulkImporting(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-10 space-y-6">
              <textarea 
                className="w-full h-64 p-8 rounded-[2rem] border-2 border-slate-50 focus:border-blue-500/20 text-xs font-mono bg-slate-50/50 resize-none shadow-inner"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='ChatGPTで生成したJSONをここに貼り付け...'
              />
              {parseError && <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl animate-shake"><i className="fa-solid fa-triangle-exclamation mr-2"></i> {parseError}</div>}
              <button onClick={handleJsonImport} className="w-full py-6 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all text-sm tracking-widest uppercase italic">IMPORT DATA</button>
            </div>
          </div>
        </div>
      )}

      {/* Score Dialog */}
      {isAddingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fadeInUp">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">スピーキング採点記録 ({activeTab})</h3>
              <button onClick={() => setIsAddingScore(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form className="p-10 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const d = new FormData(form);
              const p = Number(d.get('p')), g = Number(d.get('g')), f = Number(d.get('f')), c = Number(d.get('c'));
              db.scores.add({
                id: Math.random().toString(36).substr(2, 9),
                video_id: video.video_id,
                language: activeTab as any,
                date: new Date().toISOString().split('T')[0],
                script_version: activeScript?.version || 1,
                pronunciation: p, grammar: g, fluency: f, clarity: c,
                total: Math.round((p+g+f+c)/4),
                main_problem: d.get('prob') as string,
                improvement_tip: d.get('tip') as string,
                comment: d.get('comment') as string,
                created_at: new Date().toISOString()
              });
              setScores(db.scores.list(video.video_id));
              setIsAddingScore(false);
            }}>
              <div className="grid grid-cols-4 gap-4">
                {['p', 'g', 'f', 'c'].map(cat => (
                  <div key={cat} className="space-y-2 text-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{cat === 'p' ? 'Pron' : cat === 'g' ? 'Gram' : cat === 'f' ? 'Fluen' : 'Clar'}</label>
                    <input name={cat} type="number" min="0" max="100" defaultValue="75" className="w-full p-4 rounded-xl border-2 border-slate-50 text-base font-black text-center bg-slate-50/50" />
                  </div>
                ))}
              </div>
              <input name="prob" required className="w-full p-5 rounded-2xl border-2 border-slate-50 text-sm font-bold bg-slate-50/50" placeholder="主な課題 (Main Problem)" />
              <input name="tip" required className="w-full p-5 rounded-2xl border-2 border-slate-50 text-sm font-bold bg-slate-50/50" placeholder="改善策 (Improvement Tip)" />
              <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition text-sm tracking-widest uppercase italic">SAVE SCORE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Other Components ---

const VideoList = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => { setVideos(db.videos.list()); }, []);
  const filtered = videos.filter(v => search === '' || v.title.toLowerCase().includes(search.toLowerCase()) || v.video_id.includes(search)).reverse();

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">動画プロジェクト</h2>
          <p className="text-slate-500 font-medium">スクリプトと学習データの拠点です。</p>
        </div>
        <Link to="/videos/new" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> 新規作成
        </Link>
      </header>
      <div className="relative">
        <i className="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
        <input type="text" placeholder="プロジェクト名またはIDで検索..." className="w-full pl-16 pr-8 py-5 rounded-[2rem] border-2 border-slate-50 shadow-sm text-sm font-bold focus:border-blue-500/20 focus:ring-0 outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(v => (
          <Link key={v.video_id} to={`/videos/${v.video_id}`} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:scale-[1.03] transition-all group flex flex-col justify-between h-64 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{v.date}</span>
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border-2 tracking-tighter ${v.status === 'posted' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-100'}`}>{statusLabel[v.status].toUpperCase()}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">{v.title}</h3>
              <p className="text-[10px] text-slate-400 font-black mt-2 tracking-widest uppercase">{v.video_id}</p>
            </div>
            <div className="flex items-center justify-between text-slate-200 group-hover:text-blue-500 transition-colors">
               <div className="flex -space-x-2">
                 {['EN', 'ZH', 'ES'].map(l => <div key={l} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-400">{l}</div>)}
               </div>
               <i className="fa-solid fa-arrow-right-long text-xl translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all"></i>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const VideoForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ video_id: '', title: '', date: new Date().toISOString().split('T')[0], location: '', memo: '', status: 'draft' as VideoStatus });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v: Video = { ...formData, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.videos.upsert(v);
    navigate(`/videos/${v.video_id}`);
  };
  return (
    <div className="max-w-3xl mx-auto py-10 animate-fadeInUp">
      <header className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">CREATE NEW PROJECT</h2>
        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">Setup your travel script baseline</p>
      </header>
      <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[4rem] border-4 border-slate-50 shadow-2xl space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Video Slug (ID)</label>
          <input required className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] text-lg font-black focus:border-blue-500/20 focus:bg-white outline-none transition-all" placeholder="例: 2026-03-tokyo-vlog" value={formData.video_id} onChange={e => setFormData({...formData, video_id: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Title</label>
          <input required className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] text-lg font-black focus:border-blue-500/20 focus:bg-white outline-none transition-all" placeholder="例: 渋谷の夜歩き" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        <button type="submit" className="w-full py-8 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all text-xl italic tracking-tighter">START JOURNEY</button>
      </form>
    </div>
  );
};

// --- ExportPage ---
const ExportPage = () => {
  const dbData = db.getDB();
  const items = dbData.learningItems;

  const downloadCSV = () => {
    const headers = ['Language', 'Type', 'Head', 'Tail', 'Example', 'Priority', 'Active', 'VideoID'];
    const rows = items.map(i => [
      i.language, i.type, i.head, i.tail, i.example, i.priority, i.active, i.video_id
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `polyglot_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">CSVエクスポート</h2>
        <p className="text-slate-500 font-medium mt-1">学習アイテムをCSV形式で出力します。AnkiやNotebookLMへのインポートに利用できます。</p>
      </header>
      <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-8">
        <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl shadow-inner">
          <i className="fa-solid fa-file-csv"></i>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-slate-800">全 {items.length} 件のアイテム</p>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Ready for processing</p>
        </div>
        <button 
          onClick={downloadCSV}
          disabled={items.length === 0}
          className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all text-sm tracking-widest uppercase italic flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-download"></i> CSVをダウンロード
        </button>
      </div>
    </div>
  );
};

// --- AboutPage ---
const AboutPage = () => (
  <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
    <header className="text-center">
      <h2 className="text-5xl font-black text-slate-800 tracking-tighter">ABOUT POLYGLOT OS</h2>
      <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest">Multi-language learning management system</p>
    </header>
    <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-8 text-slate-600 leading-relaxed font-medium">
      <section className="space-y-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><i className="fa-solid fa-compass text-blue-500"></i> コンセプト</h3>
        <p>POLYGLOT OSは、多言語での収録や練習を効率化するためのプラットフォームです。</p>
        <p>日本語のベーススクリプトから各言語への翻訳、AIによる学習ポイントの抽出、およびスピーキング採点ログを一元管理します。</p>
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><i className="fa-solid fa-lightbulb text-yellow-500"></i> 主な機能</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>動画プロジェクト管理:</strong> 場所や日付ごとのスクリプト管理。</li>
          <li><strong>統合学習アイテム:</strong> AI分析や手動入力された語彙・文法のライブラリ化。</li>
          <li><strong>進捗ダッシュボード:</strong> 各言語の最新スコアとプロジェクト進捗を視覚化。</li>
          <li><strong>NotebookLM 連携:</strong> 抽出されたアイテムをエクスポートし、さらに深い学習が可能です。</li>
        </ul>
      </section>
      <div className="pt-10 border-t border-slate-50 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Engineered for polyglots</p>
      </div>
    </div>
  </div>
);

// --- ScriptsPage ---
const ScriptsPage = () => (
  <div className="space-y-10 animate-fadeIn">
    <header>
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">プロンプト集</h2>
      <p className="text-slate-500 font-medium mt-1">AI解析や学習に役立つ便利なプロンプトのテンプレートです。</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {[
        { title: '学習ポイント抽出', icon: 'fa-brain', color: 'text-orange-400', prompt: '以下のスクリプトから、学習すべき「単語」「文法」「フレーズ」および「間違えやすいポイント」を特定し、JSON形式で出力してください。' },
        { title: '自然な表現へのリライト', icon: 'fa-pen-fancy', color: 'text-blue-400', prompt: 'このスクリプトの内容を維持したまま、ネイティブスピーカーが日常的に使うより自然で洗練された表現にリライトしてください。' },
        { title: 'シャドーイング練習', icon: 'fa-microphone', color: 'text-green-400', prompt: 'このスクリプトを効果的に練習するためのポーズの位置、強調すべき単語、発音の注意点を箇条書きで教えてください。' },
        { title: '文化的背景', icon: 'fa-earth-asia', color: 'text-purple-400', prompt: 'スクリプトに含まれる表現が、ターゲット言語の文化圏でどのようなニュアンスを持つか詳しく解説してください。' },
      ].map((p, i) => (
        <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${p.color} flex items-center justify-center text-xl shadow-sm`}><i className={`fa-solid ${p.icon}`}></i></div>
            <h3 className="font-black text-slate-800 text-lg">{p.title}</h3>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl relative group">
            <p className="text-xs font-mono text-slate-500 leading-relaxed">{p.prompt}</p>
            <button 
              onClick={() => { navigator.clipboard.writeText(p.prompt); alert('コピーしました'); }}
              className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition"
            >
              <i className="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- App Entry ---

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><Layout><VideoList /></Layout></ProtectedRoute>} />
          <Route path="/videos/new" element={<ProtectedRoute><Layout><VideoForm /></Layout></ProtectedRoute>} />
          <Route path="/videos/:video_id" element={<ProtectedRoute><Layout><VideoDetail /></Layout></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Layout><ItemsPage /></Layout></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><Layout><ExportPage /></Layout></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><Layout><AboutPage /></Layout></ProtectedRoute>} />
          <Route path="/scripts" element={<ProtectedRoute><Layout><ScriptsPage /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
