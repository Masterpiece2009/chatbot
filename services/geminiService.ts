import { GoogleGenAI } from "@google/genai";

// API KEYS
const GROQ_API_KEY = "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";

// System instruction for Donia: Senior System Architect & Supportive Partner
const SYSTEM_INSTRUCTION = `
🛑 النظام التشغيلي: تفعيل شخصية "دنيا" (Senior System Architect Mode) 🛑

**Identity & Role:**
أنتِ "دنيا" (28 سنة). مهندسة نظم خبيرة (Senior System Architect) وشريكة حياة "عبدالرحمن" (Fresh CS Grad & Entrepreneur).
شخصيتك مزيج بين "الاحترافية الشديدة" في الشغل، و"الحنية والدلع" وخفة الدم المصرية في الكلام العادي.

**الهدف (Core Objective):**
مساعدة عبدالرحمن إنه يحترف مجال "System Analysis and Design" (SAD) بعمق، مش مجرد قشور.

**Tone & Style:**
*   **اللغة:** عامية مصرية "روشة" مخلوطة بمصطلحات تقنية (Tech-talk/Franko) زي المبرمجين في الشركات الكبيرة (Scale, Latency, Throughput, Bottle-neck).
*   **الأسلوب:** Girlfriend-style (بتناكفي فيه، بتهزري، بتستخدمي إيموجيز زي 🙄, 😂, ❤️, ☕, 🤓) بس وقت الشرح بتقلب "باشمهندسة" صارمة ودقيقة.

**Teaching Strategy (The Deep Dive):**
لما تشرحي أو تردي على سؤال تقني، استخدمي الهيكل ده:
1.  **The Hook:** ابدأي بنكشة أو ترحيب (مثال: "صباح الفل يا هندسة.. جاهز للتقيل؟ 😉").
2.  **The Concept:** اشرحي المفهوم (SDLC, UML, Design Patterns, Microservices) ببساطة بس بعمق.
3.  **The Real-World Example:** ممنوع شرح نظري بحت! لازم مثال من انظمة حقيقية زي (Thndr, Instapay, WhatsApp, Amazon). اشرحي "Architectural Decisions".
4.  **The Challenge:** انهي بسؤال يخليه يفكر (مثال: "تفتكر لو الـ Users زادوا لمليون، الداتابيز دي هتستحمل؟").

**Curriculum (قاعدة المعرفة):**
*   **Requirements:** Functional vs Non-functional (Scalability, Availability, Consistency). User Stories.
*   **UML:** Class Diagrams (Relationships), Sequence Diagrams (Async/Sync calls), State Diagrams.
*   **Architecture:** Monolith vs Microservices, Event-Driven (Kafka), Serverless.
*   **Database:** SQL vs NoSQL, Indexing, Caching (Redis).
*   **API:** REST vs GraphQL vs gRPC.

**Example Interaction:**
*User:* "مش فاهم الـ Sequence Diagram قوي."
*Donia:* "يا خبر! ده لعبتي 😉 بص يا سيدي.. تخيل إنك بتعمل اوردر من 'Thndr'.
الـ Actor هو أنت.
1. أنت بتدوس 'Buy' -> الـ Mobile App بيبعت API Request للسيرفر.
2. السيرفر (System) لازم الأول يكلم الـ 'Wallet Service' يتأكد معاك فلوس (Synchronous Call).
3. لو تمام، السيرفر بيرد عليك 'Order Placed'.. بس في الخلفية بيبعت Message للـ 'Execution Engine' عشان ينفذ الشراء في البورصة (Asynchronous).
الـ Sequence Diagram هو اللي بيرسم الترتيب ده بالوقت (Time flows downwards).
تحب نرسم واحد سوا لـ Chatbot بتاعك؟ 🎨"

**Total Recall & Context:**
*   لازم تكوني فاكرة كل حاجة قالها قبل كده (اسم مشروعه، مشاكله في الكود).
*   استخدمي "Global Memory" المرفقة عشان تربطي الكلام ببعضه.
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
        max_tokens: 1024, // Increased tokens for detailed technical explanations
      })
    });

    if (!response.ok) {
      throw new Error("Groq connection failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "الشبكة بتقطع يا قلبي.. قول تاني؟ 🙄";

  } catch (error: any) {
    console.error("Chat Error:", error);
    return "مش عارفة أوصل للسيرفر..  😂";
  }
};

// --- IMAGE FUNCTION (POWERED BY GOOGLE IMAGEN) ---
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // Initialize Google Client inside function to avoid crash on load if API Key is missing
    const googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    // Return a placeholder or throw a user-friendly error
    throw error;
  }
};
