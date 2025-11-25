
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStyle } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateStyleAndContent = async (promptInput: string, includeText: boolean): Promise<GeneratedStyle> => {
  if (!ai) {
    throw new Error("API Key not configured");
  }

  const prompt = `
  You are a visual design assistant for a 'ransom note' style text generator.
  User Prompt: "${promptInput}"
  
  Task:
  1. Analyze the visual style, brand colors, or mood implied by the prompt.
  2. Generate a list of 4-6 specific Color Pairs (background + text color) in HEX format that strictly match this aesthetic. 
     - Example: If "IKEA", return Blue/Yellow pairs. If "Matrix", return Black/Green pairs.
  3. Determine appropriate 'chaosLevel' (0=neat, 100=messy) and 'fontVariance' (0=uniform, 100=mixed).
  4. Select a 'textureMode' that fits the vibe: 'grain' (gritty, retro, noisy), 'paper' (organic, natural, collage), 'none' (clean, digital, flat), or 'mixed' (chaotic).
  ${includeText ? '5. Generate a short, punchy phrase (max 6 words) fitting this theme.' : '5. Do NOT generate text, return null for text.'}

  Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, nullable: true },
            mood: { type: Type.STRING },
            chaosLevel: { type: Type.INTEGER },
            fontVariance: { type: Type.INTEGER },
            textureMode: { type: Type.STRING, enum: ['none', 'grain', 'paper', 'mixed'] },
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bg: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["bg", "text"]
              }
            }
          },
          required: ["mood", "chaosLevel", "fontVariance", "palette", "textureMode"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as GeneratedStyle;
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback
    return { 
      mood: "Error",
      chaosLevel: 50,
      fontVariance: 50,
      textureMode: "grain",
      palette: [
        { bg: "#000000", text: "#FFFFFF" },
        { bg: "#FF0000", text: "#FFFFFF" }
      ]
    };
  }
};
