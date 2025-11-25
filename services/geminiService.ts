
import { GeneratedStyle } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export const generateStyleAndContent = async (promptInput: string, includeText: boolean): Promise<GeneratedStyle> => {
  
  // Strategy: Try Serverless Proxy first (Production/Vercel), fallback to Client SDK (Dev/Preview)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promptInput, includeText }),
    });

    if (!response.ok) {
      // If 404, it likely means the API route doesn't exist (e.g. running in AI Studio preview)
      // If 500, it might be a server error or missing key on server
      // We throw to trigger the fallback catch block
      throw new Error(`Proxy failed: ${response.status}`);
    }

    const data = await response.json();
    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonString) throw new Error("Invalid response format from AI Proxy");
    return JSON.parse(jsonString) as GeneratedStyle;

  } catch (proxyError) {
    console.warn("Backend proxy failed, falling back to client-side SDK. This is normal in local/preview environments.", proxyError);
    
    // --- FALLBACK: CLIENT-SIDE DIRECT CALL ---
    // This allows the app to work in AI Studio or local dev without a running Node backend
    
    // 2. Init SDK
    // Use process.env.API_KEY as per guidelines. 
    // This assumes the environment is configured to replace this variable during build (e.g. Vite define) or execution.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 3. Prompt (Synced with api/generate.js)
    const systemPrompt = `
    You are a visual design assistant for a 'ransom note' style text generator.
    User Prompt: "${promptInput}"
    
    Task:
    1. Analyze the visual style, brand colors, or mood implied by the prompt.
    2. Generate a list of specific Color Pairs (bg + text) in HEX format. The number of pairs is up to you based on the best aesthetic fit (no fixed limit, usually 3-8 pairs).
    3. Determine appropriate 'chaosLevel' (0=neat, 100=messy) and 'fontVariance' (0=uniform, 100=mixed).
    4. Select a 'textureMode' that fits the vibe: 'grain', 'paper', 'none', 'mixed', 'fabric', 'grunge', or 'concrete'.
    ${includeText ? '5. Generate a short, punchy phrase (max 6 words) fitting this theme.' : '5. Do NOT generate text, return null for text.'}

    Return JSON.
    `;

    // 4. Call
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, nullable: true },
              mood: { type: Type.STRING },
              chaosLevel: { type: Type.INTEGER },
              fontVariance: { type: Type.INTEGER },
              textureMode: { type: Type.STRING, enum: ['none', 'grain', 'paper', 'mixed', 'fabric', 'grunge', 'concrete'] },
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
          }
        }
      });

      if (!response.text) throw new Error("No response text from AI");
      return JSON.parse(response.text) as GeneratedStyle;

    } catch (sdkError: any) {
       // If client-side fails with 400 location error, catch it to give a helpful message
       if (sdkError.message?.includes('location') || sdkError.message?.includes('400')) {
          throw new Error("Connection failed: User location not supported. Please check your network/VPN or deploy to Vercel.");
       }
       throw sdkError;
    }
  }
};
