import { LearningItem } from "@/types/aisama-lang";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelStats {
  currentLevel: CEFRLevel;
  nextLevel: CEFRLevel | null;
  progressPercent: number; // 0-100
  totalItems: number;
  averageMastery: number;
}

const LEVEL_THRESHOLDS: Record<CEFRLevel, { vocab: number }> = {
  A1: { vocab: 100 }, // Start at A1 after few items
  A2: { vocab: 500 },
  B1: { vocab: 1000 },
  B2: { vocab: 2000 },
  C1: { vocab: 4000 },
  C2: { vocab: 8000 },
};

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const calculateLevelStats = (items: LearningItem[]): LevelStats => {
  const totalItems = items.length;
  const averageMastery =
    totalItems > 0
      ? items.reduce((acc, item) => acc + (item.mastery_score || 0), 0) /
        totalItems
      : 0;

  // Effective vocabulary count adjusted by mastery
  // Items with low mastery are partially counted
  const effectiveVocab = totalItems * (averageMastery / 100);

  let currentLevel: CEFRLevel = "A1";
  let nextLevel: CEFRLevel | null = "A2";
  let progressPercent = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const threshold = LEVEL_THRESHOLDS[level].vocab;

    if (effectiveVocab >= threshold) {
      currentLevel = level;
      nextLevel = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  if (nextLevel) {
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel].vocab;
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel].vocab;

    // Progress is relative to the range between current and next threshold
    const numerator = effectiveVocab - currentThreshold;
    const denominator = nextThreshold - currentThreshold;

    // If not reached A1 threshold yet
    if (effectiveVocab < LEVEL_THRESHOLDS["A1"].vocab) {
      currentLevel = "A1"; // Still show A1 as starting
      nextLevel = "A1";
      progressPercent = Math.min(
        99,
        (effectiveVocab / LEVEL_THRESHOLDS["A1"].vocab) * 100,
      );
    } else {
      progressPercent = Math.min(99, (numerator / denominator) * 100);
    }
  } else {
    // Max level reached
    progressPercent = 100;
  }

  return {
    currentLevel,
    nextLevel,
    progressPercent: Math.round(progressPercent),
    totalItems,
    averageMastery: Math.round(averageMastery),
  };
};
