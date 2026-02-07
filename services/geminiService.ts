import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// HARDCODED API KEY
const API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// System instruction to define Mn3em's personality and logic
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

NOTE TAKING PROTOCOL (CRITICAL):
If the user says anything like "Save a note", "sagel", "ektb", "fakkarny" (in Arabic or English):
You MUST output the response in this exact format:
"||SAVE_NOTE: [The content to save]|| [Your conversational confirmation]"

Example:
User: "Fakkarny ageeb 3esh."
Response: "||SAVE_NOTE: Buy bread|| ماشي يا بطل، سجلتها. متنساش أنت بس."
`;

export const sendMessage = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  // FIX: Filter history to ensure it starts with a user turn.
  const validHistory = history.filter((msg, index) => {
    if (index === 0 && msg.role === 'model') return false;
    return true;
  });

  // Initialize Chat with 1.5 Flash (Better Limits)
  const chat = ai.chats.create({
    model: 'gemini-1.5-flash', 
    history: validHistory, 
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('429');
      
      if (isQuotaError && i < retries - 1) {
        const waitTime = 2000 * Math.pow(2, i); // 2s, 4s, 8s
        console.warn(`Quota hit (Chat). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        console.error("Chat Error:", error);
        if (i === retries - 1) {
             return `Network error: ${error.message || "Unknown"}. System overloaded, try again in a minute.`;
        }
      }
    }
  }
  return "System busy. Please try again later.";
};

export const generateSpeech = async (text: string) => {
  const cleanText = text.replace(/\|\|SAVE_NOTE:.*?\|\|/g, '').trim();
  if (!cleanText) return null;

  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      // Must use gemini-2.0-flash for Audio generation
      const response = await ai.models.generateContent({
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

    } catch (error: any) {
      const isQuotaError = error?.message?.includes('429') || error?.status === 429;
      
      if (isQuotaError && i < retries - 1) {
        const waitTime = 2000 * Math.pow(2, i);
        console.warn(`Quota hit (TTS). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        console.error("TTS Error:", error);
        if (i === retries - 1) return null;
      }
    }
  }
  return null;
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
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