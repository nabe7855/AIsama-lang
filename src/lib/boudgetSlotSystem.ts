import { Language, LearningItem } from "@/types/aisama-lang";

export type SlotType = "new" | "review" | "weak" | "free";

export interface SlotConfig {
  newCount: number;
  reviewCount: number;
  weakCount: number;
}

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ScriptSpec {
  language: Language;
  topic: string;
  baseScript?: string;
  level: CEFRLevel;
  persona?: string;
  durationSeconds: number;
  estimatedAmount: number;
  level_config: {
    sentence_count: number;
    complexity: string;
    details: string;
  };
  slots: {
    type: SlotType;
    item?: LearningItem;
    instruction?: string;
  }[];
}

const LevelDetails: Record<Language, Partial<Record<CEFRLevel, string>>> = {
  EN: {
    A1: "Basic greetings, simple present tense, common nouns.",
    A2: "Simple past tense, basic conjunctions, everyday situational vocabulary.",
    B1: "Present perfect, relative clauses, common idioms, expressing opinions.",
    B2: "Conditional sentences, passive voice, professional terminology, abstract topics.",
    C1: "Subtle nuances, advanced phrasal verbs, sophisticated academic/professional language.",
  },
  JP: {
    A1: "です・ます調、基本的な名詞、日常の挨拶。",
    A2: "、過去形（〜た）、基本的な動詞の活用、日常会話。",
    B1: "て形、可能形、基本的な敬語、日常的な意見表明。",
    B2: "受身、使役、ビジネス表現、社会的なトピック。",
    C1: "高度な語彙、慣用句、フォーマルな場面に応じた使い分け。",
  },
  ZH: {
    B1: "常用成语, 比较句, 表达个人观点.",
  },
  ES: {
    B1: "Pretérito perfecto, subjuntivo básico, modismos comunes.",
  },
} as any;

export const ItemSelector = {
  selectItems: (
    items: LearningItem[],
    config: SlotConfig,
    language: Language,
  ) => {
    const langItems = items.filter((i) => i.language === language);

    // 1. Weak Items (High error count, recent)
    const weakItems = langItems
      .filter((i) => (i.error_count || 0) > 0)
      .sort((a, b) => (b.error_count || 0) - (a.error_count || 0))
      .slice(0, config.weakCount);

    // 2. Review Items (Low mastery, old review date)
    const weakIds = new Set(weakItems.map((i) => i.id));
    const reviewItems = langItems
      .filter((i) => !weakIds.has(i.id) && (i.mastery_score || 0) < 80)
      .sort((a, b) => {
        // Prioritize older reviews
        const dateA = a.last_reviewed_at
          ? new Date(a.last_reviewed_at).getTime()
          : 0;
        const dateB = b.last_reviewed_at
          ? new Date(b.last_reviewed_at).getTime()
          : 0;
        return dateA - dateB;
      })
      .slice(0, config.reviewCount);

    return { weakItems, reviewItems };
  },
};

export const SpecGenerator = {
  generate: (
    language: Language,
    topic: string,
    weakItems: LearningItem[],
    reviewItems: LearningItem[],
    config: {
      level: CEFRLevel;
      persona?: string;
      durationSeconds: number;
      baseScript?: string;
    },
  ): ScriptSpec => {
    const slots: ScriptSpec["slots"] = [];

    // Limit items to prevent prompt bloat (max 8 items total)
    const MAX_ITEMS = 8;
    const items = [...weakItems, ...reviewItems].slice(0, MAX_ITEMS);

    items.forEach((item) => {
      const isWeak = weakItems.some((wi) => wi.id === item.id);
      slots.push({
        type: isWeak ? "weak" : "review",
        item,
        instruction: isWeak
          ? `MUST COSMETICALLY CORRECT/USE: "${item.head}" (${item.tail}) - Focus on natural context`
          : `Naturally integrate: "${item.head}" (${item.tail})`,
      });
    });

    // Estimation logic
    const speeds: Record<Language, number> = {
      EN: 2.5, // words/sec
      JP: 5.5, // chars/sec
      ZH: 3.5, // chars/sec
      ES: 2.5, // words/sec
    };
    const speed = speeds[language] || 2.5;
    const estimatedAmount = Math.floor(config.durationSeconds * speed);

    return {
      language,
      topic,
      baseScript: config.baseScript,
      level: config.level,
      persona: config.persona,
      durationSeconds: config.durationSeconds,
      estimatedAmount,
      level_config: {
        sentence_count: Math.max(
          3,
          Math.floor(config.durationSeconds / 4) + Math.floor(slots.length / 2),
        ),
        complexity: `CEFR ${config.level}`,
        details:
          (LevelDetails[language] || LevelDetails["EN"])?.[config.level] ||
          "Standard level appropriate",
      },
      slots,
    };
  },

  renderToPrompt: (spec: ScriptSpec) => {
    const itemList = spec.slots
      .map((s) => `- [${s.type.toUpperCase()}] ${s.instruction}`)
      .join("\n");

    const personaInstruction = spec.persona
      ? `\n【PERSONA / ROLE】\nYou are **${spec.persona}**. Mimic their speaking style, catchphrases, tone, and worldview perfectly. Speak exactly as ${spec.persona} would in this situation.\n`
      : "\n【ROLE】\nYou are an expert language teacher and natural scriptwriter.\n";

    const baseScriptInstruction = spec.baseScript
      ? `\n【BASE CONTENT (Japanese)】\nUse the following Japanese script as the foundation for topics and flow:\n---\n${spec.baseScript}\n---\n`
      : "";

    return `
${personaInstruction}
Language: ${spec.language}
Topic: ${spec.topic}
Goal: Create a natural dialogue script for speaking practice.
${baseScriptInstruction}

【Constraints】
1. Target Duration: Approx **${spec.durationSeconds} seconds** (Target length: **${spec.estimatedAmount}** ${spec.language === "JP" || spec.language === "ZH" ? "characters" : "words"}).
2. Proficiency Level: ${spec.level_config.complexity} (${spec.level_config.details}).
3. **MANDATORY INCLUSIONS**: You MUST naturally include the following items:
${itemList}
4. **CHALLENGE**: Additionally, introduce 2-3 new advanced expressions suitable for ${spec.level_config.complexity} level with brief explanations.

【Output Format】
Output ONLY JSON. Do not include markdown code blocks.
{
  "title": "Title of script",
  "script": [
    {"speaker": "A", "text": "...", "trans": "English translation"},
    {"speaker": "B", "text": "...", "trans": "..."}
  ],
  "new_expressions": [
    {"expression": "...", "meaning": "...", "usage": "..."}
  ],
  "notes": "Advice on how to sound like ${spec.persona || "a native speaker"}"
}
`;
  },
};
