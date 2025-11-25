
import { GeneratedStyle } from "../types";

export const generateStyleAndContent = async (promptInput: string, includeText: boolean): Promise<GeneratedStyle> => {
  
  try {
    // Call our own Vercel Serverless Function (proxy)
    // This avoids CORS issues and hides the API Key from the browser network tab
    // It also solves the "User Location Not Supported" error by routing through Vercel's US servers
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promptInput, includeText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();

    // Parse the Gemini Response structure to get our JSON string
    // The structure is candidates[0].content.parts[0].text
    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonString) {
      throw new Error("Invalid response format from AI");
    }

    const result = JSON.parse(jsonString);
    return result as GeneratedStyle;

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate style");
  }
};
