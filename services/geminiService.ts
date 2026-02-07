import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  if (!process.env.API_KEY) {
    return "Error: API Key is missing. Please add API_KEY to Vercel Environment Variables.";
  }

  try {
    // Limit history to last 15 turns for better context
    const recentHistory = history.slice(-15);

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: recentHistory, 
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    console.error("Chat Error:", error);
    if (error.status === 429 || error.message?.includes('429')) {
      return "Systems Overheating. اهدى شوية يا وحش.";
    }
    return "Network glitch. (Check your Gemini API Key in Vercel settings)";
  }
};

export const generateSpeech = async (text: string) => {
  try {
    // Strip out the hidden note command before speaking
    const cleanText = text.replace(/\|\|SAVE_NOTE:.*?\|\|/g, '').trim();

    if (!cleanText) return null;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: TTSVoice.Fenrir }, // Deep Male voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};