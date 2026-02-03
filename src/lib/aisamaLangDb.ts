import {
  LearningItem,
  Script,
  SpeakingScore,
  Video,
} from "@/types/aisama-lang";

const STORAGE_KEY = "aisama_lang_db";

interface DBState {
  videos: Video[];
  scripts: Script[];
  learningItems: LearningItem[];
  speakingScores: SpeakingScore[];
}

const initialState: DBState = {
  videos: [],
  scripts: [],
  learningItems: [],
  speakingScores: [],
};

// Internal function to retrieve the full database state from localStorage
export const getDB = (): DBState => {
  if (typeof window === "undefined") return initialState;
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialState;
};

// Internal function to persist the database state to localStorage
export const saveDB = (state: DBState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const db = {
  getDB,
  saveDB,
  videos: {
    list: () => getDB().videos,
    get: (id: string) => getDB().videos.find((v) => v.video_id === id),
    upsert: (video: Video) => {
      const state = getDB();
      const index = state.videos.findIndex(
        (v) => v.video_id === video.video_id,
      );
      if (index > -1) {
        state.videos[index] = { ...state.videos[index], ...video };
      } else {
        state.videos.push(video);
      }
      saveDB(state);
    },
    delete: (id: string) => {
      const state = getDB();
      state.videos = state.videos.filter((v) => v.video_id !== id);
      state.scripts = state.scripts.filter((s) => s.video_id !== id);
      state.learningItems = state.learningItems.filter(
        (i) => i.video_id !== id,
      );
      state.speakingScores = state.speakingScores.filter(
        (s) => s.video_id !== id,
      );
      saveDB(state);
    },
  },
  scripts: {
    list: (videoId: string) =>
      getDB().scripts.filter((s) => s.video_id === videoId),
    add: (script: Script) => {
      const state = getDB();
      // Deactivate others of same lang/level for this video
      state.scripts = state.scripts.map((s) =>
        s.video_id === script.video_id && s.language === script.language
          ? { ...s, active: false }
          : s,
      );
      state.scripts.push({ ...script, active: true });
      saveDB(state);
    },
  },
  learningItems: {
    listAll: () => getDB().learningItems,
    list: (videoId: string) =>
      getDB().learningItems.filter((i) => i.video_id === videoId),
    add: (item: LearningItem) => {
      const state = getDB();
      state.learningItems.push(item);
      saveDB(state);
    },
    addMany: (items: LearningItem[]) => {
      const state = getDB();
      state.learningItems.push(...items);
      saveDB(state);
    },
    toggleActive: (id: string) => {
      const state = getDB();
      const item = state.learningItems.find((i) => i.id === id);
      if (item) item.active = !item.active;
      saveDB(state);
    },
    delete: (id: string) => {
      const state = getDB();
      state.learningItems = state.learningItems.filter((i) => i.id !== id);
      saveDB(state);
    },
  },
  scores: {
    list: (videoId: string) =>
      getDB().speakingScores.filter((s) => s.video_id === videoId),
    listAll: () => getDB().speakingScores,
    add: (score: SpeakingScore) => {
      const state = getDB();
      state.speakingScores.push(score);
      saveDB(state);
    },
  },
  clearAll: () => {
    saveDB(initialState);
  },
};
