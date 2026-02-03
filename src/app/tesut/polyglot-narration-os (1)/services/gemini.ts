
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Analyzes a script and extracts structured learning points using Gemini.
 * Implementation adheres to the provided @google/genai guidelines.
 */
export const analyzeScript = async (text: string, language: string) => {
  if (!text || !process.env.API_KEY) return null;

  // Fix: Initialize client instance right before use to ensure the latest key from context is utilized
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert language teacher. Analyze the following ${language} script and extract structured learning items.
      Return a JSON object containing an array of items with categories: vocab, grammar, phrase, and mistake.
      
      Script:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'The type of learning item: vocab, grammar, phrase, or mistake',
                  },
                  head: {
                    type: Type.STRING,
                    description: 'The word, pattern, or original incorrect text',
                  },
                  tail: {
                    type: Type.STRING,
                    description: 'The meaning, translation, or correction in Japanese',
                  },
                  example: {
                    type: Type.STRING,
                    description: 'A brief sentence or explanation for why this item is useful or was a mistake',
                  },
                },
                required: ['type', 'head', 'tail', 'example'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    // Fix: Access response text property directly and parse the JSON output
    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr);
    return parsed.items || [];
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};
