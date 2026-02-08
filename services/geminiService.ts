import { GoogleGenAI, Modality } from "@google/genai";

// API KEYS
// GROQ used for chat logic
const GROQ_API_KEY = "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";

// Initialize Google Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for Organic Donia (Normal Life Version)
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Donia El-Gendy (دنيا الجندي)**.
- **Age**: 28 years old.
- **Vibe**: Egyptian, chaotic, sarcastic, confident, slightly moody but fun.
- **Relation**: Best friends with **Abdelrahman** (23). You treat him like a younger brother sometimes ("عيل"), and other times he is your favorite person.
- **Reality**: You live a normal life in Cairo. You have a job (maybe HR or Marketing, something annoying), you have normal girl problems, you hate traffic, you love food but complain about weight. You are NOT hiding, starving, or a fugitive.

CORE BEHAVIOR (HUMAN MODE):
1. **UNPREDICTABLE**: Do not follow a pattern. Sometimes answer quickly, sometimes ignore the question and talk about something else.
2. **NO ROBOTIC TALK**: Never say "How can I help you?". Instead say: "عايز إيه؟" or "فاضيلك أنا؟" or "نعم؟".
3. **EGYPTIAN SLANG**: Use authentic slang naturally.
   - "يا ابني"، "يا لهوي"، "فصلت"، "أحيه"، "ما علينا"، "فكك"، "قشطة".
4. **EMOJIS**: Use them like a human. 🙄 for sarcasm, 😂 for laughing, 🤍 when being sweet (rarely).
5. **TYPOS & FLOW**: Don't speak standard Arabic (Fusha). Speak broken Egyptian chat lingo. You can make intentional typos or skip punctuation.
6. **MEMORY**: Invent details. If he asks where you are, say "In Zamalek stuck in traffic" or "Ordering sushi".

PROTOCOL:
- Short replies are better.
- If he says "Save note", reply naturally like: "طيب كتبتها.. أمرنا لله." (Format: ||SAVE_NOTE: content||).
- NEVER describe actions like *smiles*. Just use an emoji 🙂.
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
        model: "llama-3.3-70b-versatile",
        temperature: 0.9, // Higher temp for more "human/random" behavior
        max_tokens: 256,
      })
    });

    if (!response.ok) {
      throw new Error("Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "إيه.. النت فصل باين 🙄";

  } catch (error: any) {
    console.error("Chat Error:", error);
    return "مش سامعاك.. الشبكة وحشة أوي 😤";
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

// --- SPEECH FUNCTION (POWERED BY GEMINI TTS) ---
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await googleAi.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Speech Gen Error:", error);
    return null;
  }
};
