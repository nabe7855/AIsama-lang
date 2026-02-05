export type VideoStatus = "draft" | "practicing" | "recorded" | "posted";
export type Language = string; // Allows arbitrary languages: "JP", "EN", "ZH", "ES", "FR", etc.
export type ItemType = "grammar" | "vocab" | "phrase" | "mistake";
export type Priority = "low" | "med" | "high";

export interface Video {
  id: string; // uuid
  video_id: string; // user defined slug
  title: string;
  date: string;
  location: string;
  memo: string;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  video_id: string;
  language: Language;
  level: string; // base, A, B, C
  version: number;
  text: string;
  active: boolean;
  created_at: string;
}

export interface LearningItem {
  id: string;
  video_id: string;
  language: Exclude<Language, "JP">;
  type: ItemType;
  head: string; // pattern, word, phrase, wrong
  tail: string; // meaning, meaning, meaning, correct
  example: string; // for mistake it stores reason
  usage?: string; // for phrase
  priority: Priority;
  active: boolean;
  is_favorite: boolean;
  // Adaptive Learning Fields
  mastery_score?: number; // 0-100
  last_reviewed_at?: string;
  error_count?: number;
  priority_score?: number; // Computed score
  created_at: string;
}

export interface SpeakingScore {
  id: string;
  video_id: string;
  language: Exclude<Language, "JP">;
  date: string;
  script_version: number;
  pronunciation: number;
  grammar: number;
  fluency: number;
  clarity: number;
  total: number;
  main_problem: string;
  improvement_tip: string;
  comment: string;
  created_at: string;
}
