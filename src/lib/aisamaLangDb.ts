import {
  LearningItem,
  Script,
  SpeakingScore,
  Video,
} from "@/types/aisama-lang";
import { supabase } from "./supabase";

export const db = {
  videos: {
    list: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Video[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("video_id", id)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows found"
      return data as Video | null;
    },
    upsert: async (video: Video) => {
      const { error } = await supabase.from("videos").upsert(
        {
          video_id: video.video_id,
          title: video.title,
          date: video.date,
          location: video.location,
          memo: video.memo,
          status: video.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "video_id" },
      );
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("video_id", id);
      if (error) throw error;
    },
  },
  scripts: {
    list: async (videoId: string) => {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("video_id", videoId)
        .order("version", { ascending: true });
      if (error) throw error;
      return data as Script[];
    },
    add: async (script: Script) => {
      // Deactivate others of same lang for this video
      const { error: updateError } = await supabase
        .from("scripts")
        .update({ active: false })
        .eq("video_id", script.video_id)
        .eq("language", script.language);

      if (updateError) throw updateError;

      const { error } = await supabase.from("scripts").insert({
        video_id: script.video_id,
        language: script.language,
        level: script.level,
        version: script.version,
        text: script.text,
        active: true,
      });
      if (error) throw error;
    },
  },
  learningItems: {
    listAll: async () => {
      const { data, error } = await supabase
        .from("learning_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LearningItem[];
    },
    list: async (videoId: string) => {
      const { data, error } = await supabase
        .from("learning_items")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LearningItem[];
    },
    add: async (item: LearningItem) => {
      const { error } = await supabase.from("learning_items").insert({
        video_id: item.video_id,
        language: item.language,
        type: item.type,
        head: item.head,
        tail: item.tail,
        example: item.example,
        usage: item.usage,
        priority: item.priority || "med",
        active: item.active,
        is_favorite: item.is_favorite || false,
        mastery_score: item.mastery_score ?? 0,
        error_count: item.error_count ?? 0,
        last_reviewed_at: item.last_reviewed_at,
        priority_score: item.priority_score ?? 0,
      });
      if (error) throw error;
    },
    addMany: async (items: LearningItem[]) => {
      const { error } = await supabase.from("learning_items").insert(
        items.map((item) => ({
          video_id: item.video_id,
          language: item.language,
          type: item.type,
          head: item.head,
          tail: item.tail,
          example: item.example,
          usage: item.usage,
          priority: item.priority || "med",
          active: item.active,
          is_favorite: item.is_favorite || false,
          mastery_score: item.mastery_score ?? 0,
          error_count: item.error_count ?? 0,
          last_reviewed_at: item.last_reviewed_at,
          priority_score: item.priority_score ?? 0,
        })),
      );
      if (error) throw error;
    },
    toggleActive: async (id: string) => {
      // Need to find existing first if using UUID from supabase vs logic
      // But let's assume 'id' here is the primary key.
      // Current localStorage logic uses random string.
      // In Supabase, it will be UUID.
      const { data: item, error: getError } = await supabase
        .from("learning_items")
        .select("active")
        .eq("id", id)
        .single();

      if (getError) throw getError;

      const { error } = await supabase
        .from("learning_items")
        .update({ active: !item.active })
        .eq("id", id);
      if (error) throw error;
    },
    toggleFavorite: async (id: string) => {
      const { data: item, error: getError } = await supabase
        .from("learning_items")
        .select("is_favorite")
        .eq("id", id)
        .single();

      if (getError) throw getError;

      const { error } = await supabase
        .from("learning_items")
        .update({ is_favorite: !item.is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    updateMastery: async (id: string, newMastery: number) => {
      const { error } = await supabase
        .from("learning_items")
        .update({
          mastery_score: newMastery,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    incrementErrorCount: async (id: string) => {
      // Fetch current count first
      const { data: item, error: getError } = await supabase
        .from("learning_items")
        .select("error_count, mastery_score")
        .eq("id", id)
        .single();
      if (getError) throw getError;

      const newErrorCount = (item.error_count || 0) + 1;
      // Penalize mastery on error
      const newMastery = Math.max(0, (item.mastery_score || 0) - 10);

      const { error } = await supabase
        .from("learning_items")
        .update({
          error_count: newErrorCount,
          mastery_score: newMastery,
        })
        .eq("id", id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from("learning_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  },
  scores: {
    list: async (videoId: string) => {
      const { data, error } = await supabase
        .from("speaking_scores")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SpeakingScore[];
    },
    listAll: async () => {
      const { data, error } = await supabase
        .from("speaking_scores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SpeakingScore[];
    },
    add: async (score: SpeakingScore) => {
      const { error } = await supabase.from("speaking_scores").insert({
        video_id: score.video_id,
        language: score.language,
        date: score.date,
        script_version: score.script_version,
        pronunciation: score.pronunciation,
        grammar: score.grammar,
        fluency: score.fluency,
        clarity: score.clarity,
        total: score.total,
        main_problem: score.main_problem,
        improvement_tip: score.improvement_tip,
        comment: score.comment,
      });
      if (error) throw error;
    },
  },
};
