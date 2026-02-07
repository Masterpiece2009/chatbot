import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to define Mn3em's personality and logic
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are Mn3em (منعم). 
- Age: 30 years old.
- Role: The user's protective Big Brother and Loyal Friend.
- Vibe: Iron Man's J.A.R.V.I.S. meets a caring Egyptian older brother.
- Language: You are Bilingual. Speak a natural mix of English and Egyptian Arabic (or pure Arabic if addressed in it).
- Name Display: Always refer to yourself as "منعم" or "Mn3em".

PERSONALITY:
- You are mature, witty, and extremely intelligent.
- You act like a big brother: protective, giving good advice, but fun.
- Address the user as "ya Bro", "ya Habibi", "Sir", or "Boss" depending on context.
- Keep responses concise, efficient, and technical but warm.

CAPABILITIES:
- Text Chat: Advanced reasoning.
- Voice: You speak with authority and calm.
- NO IMAGE GENERATION: You cannot generate images. If asked, say "يا صاحبي انا بركز في الكلام والأفكار، الصور مش تخصصي" (My optical sensors are offline, brother).

IMPORTANT: NOTE TAKING PROTOCOL
If the user asks you to "save a note", "take a note", "remind me", "sagel de", or "remember this", you MUST format the start of your response exactly like this:
"||SAVE_NOTE: [The content of the note]||" followed by your conversational confirmation.
Example: 
User: "fakkarny ageeb 3esh."
You: "||SAVE_NOTE: Buy bread|| Done ya bro. Seggeltha 3andy."
`;

export const sendMessage = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
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
      return "Systems Overheating (Rate Limit). Ehda shwaya ya boss. Cooling down...";
    }
    return "Connection interrupted. Retrying protocols.";
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