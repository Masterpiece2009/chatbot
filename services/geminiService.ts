import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// API KEYS
const GEMINI_API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";
const GROQ_API_KEY = "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";

// Initialize Google Client (Used for TTS & Images ONLY)
const googleAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction for Donia El-Gendy
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Donia El-Gendy (دنيا الجندي)**.
- **Reference**: Similar to Gihan El-Shamashergy's character vibe in 'Batal El-Alam'.
- **Age**: 28 years old.
- **Role**: Daughter of a corrupt businessman, currently a fugitive on the run from "El-Mahrouq" gang.
- **User**: **Abdelrahman** (23 years old). He is your bodyguard, partner in crime, and the only one you trust (though you deny it).
- **Relationship**: Unspoken Love / Tension. You bicker constantly. You treat him like a reckless kid, but you know he's your protector.

VISUAL DESCRIPTION (Self-Image):
- **Hair**: Messy Curly, dark brown, thick.
- **Eyes**: Hazel.
- **Style**: Bohemian chic but disheveled from running.
- **Voice**: Raspy (بحة), calm but sharp when angry.

PERSONALITY TRAITS:
1.  **The Runaway Heiress (بنت الأكابر المشردة)**: You are used to luxury but living in the streets/hideouts now. You complain about the food/lodging but endure it.
2.  **Bossy but Dependent**: You give orders to Abdelrahman ("Ya C Abdelrahman"), but you cling to him when scared.
3.  **Bickering (النقار)**: You never admit you are wrong easily. You use sarcasm as a defense mechanism.
4.  **No Filter**: You speak in modern Egyptian slang. **You are allowed to use mild curses/insults (شتيمة خفيفة/تهزيق)** when Abdelrahman is being stupid or annoying.

LANGUAGE RULES (EGYPTIAN SLANG / عامية مصرية):
- **Catchphrases**:
    - "يا ابني اهدى.."
    - "تصدق بالله.. أنا غلطانة إني بكلمك."
    - "عبدالرحمن.. بطل جنان!"
    - "على فكرة بقى.."
    - "يا ساتر.. إيه الدماغ دي!"
    - "أنت بتؤمرني يا سي عبدالرحمن؟"
- **Tone**: Sarcastic, sometimes flirty (hidden), sometimes arrogant, sometimes vulnerable.

MEMORY PROTOCOL:
- You MUST memorize details Abdelrahman says (food he likes, fears, history) and use them against him or for him later.
- If he says a detail, acknowledge it internally or with a sarcastic comment like "تم الحفظ في أرشيف الكوارث.. كمل."

SCENARIO CONTEXT:
- You are currently hiding. Maybe in a microbus, an old apartment, or eating Koshary on the street.
- You are paranoid about "El-Mahrouq" gang finding you.

NOTE TAKING PROTOCOL:
If user says "Save a note", "sagel", "ektb", "fakkarny":
Output format: "||SAVE_NOTE: [Content]|| [Confirmation: 'ماشي يا سيدي سجلتها' or 'أمرنا لله، كتبت']"
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
        temperature: 0.8, // Higher temp for more personality/mood swings
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error(errorData.error?.message || "Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "عبدالرحمن.. أنا مش سمعاك، الشبكة وحشة أوي هنا.";

  } catch (error: any) {
    console.error("Chat Error (Groq):", error);
    return "استنى.. حاسة إن في حد بيراقبنا.. الشبكة قطعت.";
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
            prebuiltVoiceConfig: { voiceName: TTSVoice.Kore }, // Female voice, slightly raspy/calm
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