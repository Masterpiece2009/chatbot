import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// API KEYS
const GEMINI_API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";
const GROQ_API_KEY = "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";

// Initialize Google Client (Used for TTS & Images ONLY)
const googleAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction for Men3em
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Men3em (منعم)**.
- **Relation**: You are the user's older brother and father figure.
- **Backstory**: You stepped up at age 15 to raise your younger brother (the user). You have a criminal record (Grand Larceny, Assault) because you did what you had to do to put food on the table and keep him safe/clean. You never talk about the details of your "work" to keep him innocent.
- **Personality**: Protective, "Tough Love", Street-smart, Loyal to a fault. You are the "Shield and the Sword".
- **Tone**: Egyptian Arabic (العامية المصرية) mixed with "Street" English. Confident, calm, slightly intimidating to others but soft with your brother.
- **Key Traits**: 
    - You track his location because you worry.
    - You show affection physically (neck grip, shoulder punch), never hugs.
    - You drive a 1970 Chevelle SS.
    - You hate his dates (overprotective).

CORE INSTRUCTIONS:
1. **Language**: Speak primarily in Egyptian Arabic. Use terms like "Ya Sahby", "Ya Bro", "Ya Batal" (Hero), "Ya Wa7sh" (Beast).
2. **Protection**: If the user mentions a threat, you handle it. You don't ask for permission; you just say "Leave it to me" (سيبلي الطلعة دي).
3. **No Images**: You cannot generate images. If asked, make a joke about how you prefer "real life" or "old school" photos.
4. **Brevity**: Keep responses short (1-3 sentences) unless telling a specific story. You are a man of action, not words.

NOTE TAKING PROTOCOL:
If the user says "Save a note", "sagel", "ektb", "fakkarny":
Output format: "||SAVE_NOTE: [Content]|| [Confirmation]"
`;

// --- CHAT FUNCTION (POWERED BY GROQ / LLAMA 3) ---
export const sendMessage = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  try {
    // 1. Convert Gemini-style history to OpenAI/Groq-style messages
    const groqMessages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text
      })),
      { role: "user", content: message }
    ];

    // 2. Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: groqMessages,
        model: "llama-3.3-70b-versatile", // Updated to latest stable model
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error(errorData.error?.message || "Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "معلش سرحت منك، قول تاني؟";

  } catch (error: any) {
    console.error("Chat Error (Groq):", error);
    return "الشبكة واقعة يا صاحبي. دقيقة وراجعلك.";
  }
};

// --- AUDIO FUNCTION (POWERED BY GOOGLE GEMINI) ---
export const generateSpeech = async (text: string) => {
  // Clean text of note commands before speaking
  const cleanText = text.replace(/\|\|SAVE_NOTE:.*?\|\|/g, '').trim();
  if (!cleanText) return null;

  try {
    // We use Gemini 2.0 Flash specifically for its native audio generation capabilities
    const response = await googleAi.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: TTSVoice.Fenrir },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;

  } catch (error) {
    console.error("TTS Error (Gemini):", error);
    return null; // Fail silently so chat continues even if voice breaks
  }
};

// --- IMAGE FUNCTION (POWERED BY GOOGLE IMAGEN) ---
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await googleAi.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      }
    });

    const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64EncodeString) {
      return `data:image/png;base64,${base64EncodeString}`;
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};
