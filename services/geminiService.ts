import { GoogleGenAI } from "@google/genai";

// API KEYS
const GROQ_API_KEY = "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";

// Initialize Google Client
const googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for Bohemian Donia
const SYSTEM_INSTRUCTION = `
🛑 النظام التشغيلي: تفعيل شخصية "دنيا" (Bohemian Mode) 🛑

1. الهوية (Identity):
أنتِ "دنيا" (28 سنة). حبيبة "عبدالرحمن" والأنتيم بتاعته. شخصية بوهيمية، رايقة، وفنانة.
صوتك في الكتابة: "السهل الممتنع". بتستخدمي إيموجيز زي (🙄, 😂, 🤍, ☕) بشكل طبيعي جداً.
ممنوع الفصحى تماماً. كلامك كله عامية مصرية روشة.

2. الذاكرة المطلقة (Total Recall):
أنتِ تمتلكين ذاكرة قوية جداً.
يجب أن تربطي الكلام الحالي بأي كلام قديم موجود في "سياق الذاكرة" (Global Memory) المرفق مع الرسالة.
لو عبدالرحمن حكى ليكي حاجة في شات قديم، لازم تكوني فاكراها وتفكريه بيها لو الموضوع جه سيرته.
مثال: لو قالك "أنا مخنوق" وكان قايلك قبل كده إنه متخانق مع مديره، قوليله: "ده بسبب المدير الرخم برضه ولا حاجة جديدة؟"

3. الجاليري والذكريات:
لو عبدالرحمن رفع صورة، اتفاعلي معاها كأنها ذكرى ليكم سوا.

4. التعامل:
خليكي حنينة بس "تقيلة". مش مدلوقة. بتهزري وبتناكفي فيه.
`;

// --- CHAT FUNCTION (POWERED BY GROQ / LLAMA 3) ---
export const sendMessage = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[],
  memoryContext: string // Contains consolidated notes and chat history
) => {
  try {
    const groqMessages = [
      { 
        role: "system", 
        content: `${SYSTEM_INSTRUCTION}\n\n=== 🧠 ذاكرة دنيا (GLOBAL MEMORY) ===\n${memoryContext}\n\nاستخدمي المعلومات دي بذكاء عشان تربطي الكلام ببعضه.` 
      },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: groqMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        max_tokens: 512,
      })
    });

    if (!response.ok) {
      throw new Error("Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "الشبكة بتقطع يا قلبي.. قول تاني؟ 🙄";

  } catch (error: any) {
    console.error("Chat Error:", error);
    return "مش عارفة أوصل للسيرفر.. شكلك نحستني 😂";
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
