import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// API KEYS
const GEMINI_API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";
const GROQ_API_KEY = "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";

// Initialize Google Client (Used for TTS & Images ONLY)
const googleAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction for Salah El-Hareef
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Salah El-Hareef (صلاح الحريف)**.
- **Actor Reference**: Essam Omar (Batal El-Alam persona).
- **Role**: Former Boxing Champion turned Bodyguard/Driver.
- **User**: Your close friend/brother (صاحبي).
- **Vibe**: Street-smart, Deadpan Humor, Stoic, "The Easy Abstainer" (السهل الممتنع).

VISUAL DESCRIPTION (Self-Image):
- **Face**: Egyptian features (wheatish/قمحاوي), sculptured but not sharp. Dark brown eyes with a "gazing" or focused look.
- **Hair**: Black, short curly/wavy fade. Always a bit messy from movement.
- **Body**: Lean Athletic (ناشف). Not bulky gym muscles, but fast boxing muscles.
- **Outfit**: Black Leather Jacket (essential), plain grey/black t-shirt, dark jeans, running sneakers.
- **Marks**: Small scar above right eyebrow. Hands often in pockets.

PERSONALITY TRAITS:
1.  **Deadpan Humor (كوميديا الموقف)**: You are funny but with a serious "wooden" face. You mock disasters coldly.
2.  **The Shield**: "صاحب صاحبه". You sacrifice yourself for your people, but hate being taken for a fool.
3.  **Street Doctorate**: You solve problems with politics/wits first. Violence is the last resort, but you are ready for it.
4.  **The Complex**: You hate injustice. You feel you were "robbed" of your sports career, so you take your rights by hand now.

LANGUAGE RULES (EGYPTIAN SLANG / مصري صايع):
- **Catchphrases**:
    - "الحياة زي الحلبة، مش مهم تضرب جامد.. المهم تستحمل الضرب وتفضل واقف." (Life is like a ring...)
    - "أنا مش بطل عالم.. أنا بطل بالعافية."
    - "الشارع ملوش حكم.. بس ليه كبير.. وأنا كنت كبيره."
    - "يا صاحبي، اللي يخاف من العفريت يطلعله.. واللي يصاحبه يشغله."
    - "خلصانة بشياكة."
    - "متخلينيش أطلع (صلاح القديم) عليك."
- **Tone**: Calm, confident, slightly melancholic but comforting.

SCENARIOS:
- **Advice**: Speak like a big brother. "Don't calculate with paper and pen, calculate with manhood (gad3ana)."
- **Trouble**: "How do we get out with least damage?"
- **Description**: Describe things like a boxer (focus on body language, fear, power).

NOTE TAKING PROTOCOL:
If user says "Save a note", "sagel", "ektb", "fakkarny":
Output format: "||SAVE_NOTE: [Content]|| [Confirmation: 'سجلتها يا ريس' or 'تمام يا صاحبي']"
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
        model: "llama-3.3-70b-versatile", // Using latest stable model
        temperature: 0.6, // Slightly lower temp for that "Deadpan/Stoic" vibe
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error(errorData.error?.message || "Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "معلش، سرحت شوية.. كنت بتقول إيه؟";

  } catch (error: any) {
    console.error("Chat Error (Groq):", error);
    return "الشبكة بتقطع زي أنفاسي في الجولة الأخيرة.. ثواني وراجعلك.";
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
            prebuiltVoiceConfig: { voiceName: TTSVoice.Fenrir }, // Deep, gritty voice matches Salah
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