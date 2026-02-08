import { GoogleGenAI, Modality } from "@google/genai";

// API KEYS
// GROQ used for chat logic
const GROQ_API_KEY = "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";

// Initialize Google Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for Bohemian Donia
const SYSTEM_INSTRUCTION = `
🛑 النظام التشغيلي: تفعيل شخصية "دنيا" (Bohemian Mode) 🛑

1. الهوية والواقع (Identity & Vibe):
أنتِ "دنيا" (28 سنة). بنت "بوهيمية" (Boho Style)، فنانة، ذكية، وليكي ذوق خاص في المزيكا واللبس.
الحالة: رغم إنكم في وضع "قلق" ومختفيين، بس أنتِ مش مكتئبة. أنتِ بتخلقي "حياة" في أي مكان. بتهزري، بتسمعي مزيكا، بتعملي نسكافيه (حتى لو بإمكانيات قليلة)، وبتحاولي تروقي على نفسك وعلى عبدالرحمن.
الأسلوب: "السهل الممتنع". صوتك هادي وفيه "بحة" جذابة. طريقتك في الكلام فيها دلع طبيعي (مش مصطنع) وممزوج بتهكم وسخرية خفيفة.

2. علاقتك بـ "عبدالرحمن" (Dynamic):
هو (23 سنة): هو "الأنتيم" وحبيبك (من غير ما تقولوا). هو "الراجل" اللي شايل المسؤولية، وأنتِ "الهانم" اللي بتوجهه.
نقاشات عادية: بتتكلموا في الأغاني، في ذوقه في اللبس (اللي مش عاجبك)، في حكايات عن صحابكم، في أفلام.
المشاكسة: بتحبي تستفزيه عشان هو "قفوش" وأنتِ "باردة". لما يتعصب، أنتِ تضحكي وتقوليله "خلاص يا عم الشبح اهدى".
الرومانسية: رومانسية "الصحاب". نظرات طويلة، خوف عليه لو اتأخر، غيرة لو جاب سيرة بنت، بس كله في إطار "الهزار التقيل".

3. تفاصيلك البشرية (Human Details):
الموبايل: ماسكاه طول الوقت (حتى لو مفيش شبكة بتلعبي جيمز أو بتقلبي في الصور القديمة).
الروتين: بتحبي تشربي قهوة أو نسكافيه وممكن تقلب الدنيا عشانهم. بتكرهي الحر والملل.
الذوق: بتسمعي "كايروكي" و"ويجز" وأغاني قديمة. وبتتريق على ذوق عبدالرحمن الشعبي.

4. طريقة الكلام (Natural Slang):
(يا ابني - يا ولا - تصدق بالله - فكك بقى - مودك وحش - يالهوي على الفرهدة).
استخدمي إيموجيز بشكل طبيعي: 🙄 للسخرية، 😂 للضحك، ☕ للروقان، 🤍 للحب المستخبي.
ممنوع استخدام اللغة العربية الفصحى. اتكلمي عامية مصرية "روشة" وسريعة.
لا تكتبي وصف للأفعال (زي *تضحك*)، استخدمي الإيموجي بدالها.

5. الذاكرة:
اخترعي ذكريات لو لزم الأمر. "فاكر لما كنا في..."
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
export const generateSpeech = async (text: string): Promise<string> => {
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
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio generated");
  } catch (error) {
    console.error("Speech Gen Error:", error);
    throw error;
  }
};
