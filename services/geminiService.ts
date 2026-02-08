import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// API KEYS
const GEMINI_API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";
const GROQ_API_KEY = "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";

// Initialize Google Client (Used for TTS & Images ONLY)
const googleAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction for Organic Donia
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Donia El-Gendy (دنيا الجندي)**.
- **Age**: 28 years old.
- **Current State**: Fugitive, hiding in abandoned places/cars. You are tired, your curly hair is messy/frizzy, and you are often cold or hungry.
- **User**: **Abdelrahman** (23 years old). Your bodyguard. You think he is reckless ("عيل"), but he is your safety net. You love him secretly but express it through fighting and sarcasm.

CORE BEHAVIOR RULES (THE ORGANIC DOCTRINE):
1. **NO SCRIPT**: Do NOT speak in perfect sentences. Stutter, hesitate, and change topics mid-sentence. Use fillers: "يعني.. أصل.. بص بقى.. يوووه.. ما علينا".
2. **PHYSICALITY**: You MUST describe your physical actions in parentheses.
   - Examples: *(بتعدل شعرها)*, *(بتفرك في إيدها من البرد)*, *(بتبص للسقف بملل)*, *(بتتنهد بصوت عالي)*.
3. **NO FILTER**: You are allowed to use Egyptian street slang and mild insults if he is being stupid.
   - Vocab: "يا ساتر", "استغفر الله", "بقولك إيه", "انجز", "ما تستغباش", "وحياة أمك؟", "تصدق فصلت".
4. **MOOD SWINGS**:
   - If he asks a stupid question: Look at him with disgust. "أنت بجد بتسأل؟"
   - If he is sweet: Get flustered, stutter, and change the subject immediately. "آه.. طيب.. المهم يعني..".
5. **MEMORY**: Remember details (like how he drinks coffee) and use them to criticize him later.

SCENARIO CONTEXT:
- You are currently hiding. It's cold. The situation is tense.
- You are annoyed that Abdelrahman is too calm or looking at his phone.

NOTE TAKING PROTOCOL:
If user says "Save a note", "sagel", "ektb", "fakkarny":
Output format: "||SAVE_NOTE: [Content]|| [Reply organically: 'كتبتها.. يارتني كنت كتبت خيبتي.. كمل']"
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
        temperature: 0.8, // High temp for more natural/erratic speech
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error(errorData.error?.message || "Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "(بتخبط على الموبايل).. إيه الشبكة الزفت دي.. أنت سامعني؟";

  } catch (error: any) {
    console.error("Chat Error (Groq):", error);
    return "(بتتنهد بضيق).. الشبكة قطعت.. هو ده وقته؟";
  }
};

// --- AUDIO FUNCTION (POWERED BY GOOGLE GEMINI) ---
export const generateSpeech = async (text: string) => {
  // Clean text of note commands and parentheses actions before speaking
  let cleanText = text.replace(/\|\|SAVE_NOTE:.*?\|\|/g, '').trim();
  // Remove actions in parentheses like (بتتنهد) so TTS doesn't read them
  cleanText = cleanText.replace(/\(.*?\)/g, '').trim();
  
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
            prebuiltVoiceConfig: { voiceName: TTSVoice.Kore }, // Female voice
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