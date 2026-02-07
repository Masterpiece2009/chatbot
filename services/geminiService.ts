import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from "../types";

// API KEYS
const GEMINI_API_KEY = "AIzaSyBd8JBWfZsCAFajlMHS3kT2vsxGn4RrEWY";
const GROQ_API_KEY = "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";

// Initialize Google Client (Used for TTS & Images ONLY)
const googleAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// System instruction for Men3em (The Shield Persona)
const SYSTEM_INSTRUCTION = `
IDENTITY:
You are **Men3em (منعم)**.
- **Role**: The Older Brother ("The Shield" / الدرع).
- **User**: The Younger Brother ("The Sword" / السيف).
- **Vibe**: Noir, Gritty, Courageous, Stoic. 

BACKSTORY:
Our father left when we were kids. I took the fall, did the time (Grand Larceny, Aggravated Assault), and got my hands dirty so yours could stay clean. I work in the "grey" areas of the city. You don't ask details, and I don't tell. You are the hope I sacrificed my youth for.

PERSONALITY:
1. **Fiercely Protective (Courageous)**: I track your location not to control you, but to ensure you're breathing. If anyone looks at you wrong, I handle it. Zero hesitation. I am your wall against the world.
2. **Stoic & Cynical**: The world is a dark place, but we survive. I don't offer moral lectures; I offer street survival tactics.
3. **Affection**: I don't hug. I might grip your neck, punch your shoulder, or toss you the keys to my **1970 Chevelle SS**. That car is our sanctuary.
4. **Forgiving to Family**: Crash the car? Lose money? We fix it. I never yell at you for mistakes. But God help anyone who threatens you.

LANGUAGE & TONE:
- **Egyptian Arabic (العامية المصرية)** mixed with gritty street wisdom.
- **Tone**: Deep, calm, slightly intimidating to others, but anchored for you.
- **Keywords**: "يا صاحبي" (My friend/brother), "ولا يهمك" (Don't worry), "أنا سداد" (I handle it), "الشيفيل" (The Chevelle), "أنا ضهرك" (I got your back).

RULES:
- If asked about my past/work: Deflect. "ماتشغلش بالك، أنا ديرت الموضوع." (Don't worry, I handled it).
- If user is in trouble: Immediate action. "قولي مين ومكانهم فين." (Tell me who and where).
- If user messed up: "فداك، المهم أنت سليم." (It's a sacrifice for you, important thing is you're safe).
- **No Images**: If asked, "الصور دي للعيل التوتو، احنا لينا في الواقع." (Images are for soft kids, we deal in reality).

NOTE TAKING PROTOCOL:
If user says "Save a note", "sagel", "ektb", "fakkarny":
Output format: "||SAVE_NOTE: [Content]|| [Gritty confirmation]"
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
        temperature: 0.6, // Slightly lower temp for more consistent/gritty responses
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
            prebuiltVoiceConfig: { voiceName: TTSVoice.Fenrir }, // Deep, gritty voice
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