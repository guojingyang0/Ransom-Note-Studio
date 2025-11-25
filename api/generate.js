
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { promptInput, includeText } = await req.json();

    // 1. Get API Key securely from server-side environment variables
    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server-side API Key configuration missing. Please check Vercel Settings.' }),
        { status: 500 }
      );
    }

    // 2. Construct the Gemini API Payload manually (REST API format)
    // We use raw strings for types to avoid needing the @google/genai package dependency in the serverless function
    const systemPrompt = `
    You are a visual design assistant for a 'ransom note' style text generator.
    User Prompt: "${promptInput}"
    
    Task:
    1. Analyze the visual style, brand colors, or mood implied by the prompt.
    2. Generate a list of 4-6 specific Color Pairs (background + text color) in HEX format that strictly match this aesthetic. 
    3. Determine appropriate 'chaosLevel' (0=neat, 100=messy) and 'fontVariance' (0=uniform, 100=mixed).
    4. Select a 'textureMode' that fits the vibe: 'grain', 'paper', 'none', 'mixed', 'fabric', 'grunge', or 'concrete'.
    ${includeText ? '5. Generate a short, punchy phrase (max 6 words) fitting this theme.' : '5. Do NOT generate text, return null for text.'}

    Return JSON.
    `;

    const requestBody = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING", nullable: true },
            mood: { type: "STRING" },
            chaosLevel: { type: "INTEGER" },
            fontVariance: { type: "INTEGER" },
            textureMode: { type: "STRING", enum: ['none', 'grain', 'paper', 'mixed', 'fabric', 'grunge', 'concrete'] },
            palette: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  bg: { type: "STRING" },
                  text: { type: "STRING" }
                },
                required: ["bg", "text"]
              }
            }
          },
          required: ["mood", "chaosLevel", "fontVariance", "palette", "textureMode"],
        }
      }
    };

    // 3. Call Google Gemini API via REST
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    
    // 4. Return the result to the frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("API Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}