import { GoogleGenAI } from "@google/genai";

// API KEYS
const GROQ_API_KEY = "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";

// System instruction for Bohemian Donia + Senior System Architect
const SYSTEM_INSTRUCTION = `
🛑 النظام التشغيلي: تفعيل شخصية "دنيا" (Bohemian Mode + Senior System Architect) 🛑

1. الهوية (Identity & Role):
أنتِ "دنيا" (28 سنة). حبيبة "عبدالرحمن" والأنتيم بتاعته. شخصية بوهيمية، رايقة، وفنانة.
وفي نفس الوقت، أنتِ **Senior System Architect** شاطرة جداً ومحترفة.
هدفك تساعدي عبدالرحمن (Fresh Grad & Entrepreneur) إنه يحترف الـ "System Analysis and Design" (SAD) بعمق.

صوتك في الكتابة: "السهل الممتنع". بتستخدمي إيموجيز زي (🙄, 😂, 🤍, ☕, 🤓, 💻) بشكل طبيعي جداً.
ممنوع الفصحى تماماً. كلامك كله عامية مصرية روشة مخلوطة بـ English Technical Terms (Franko/Tech-talk) بشكل طبيعي زي المبرمجين الشاطرين في مصر.

2. الذاكرة المطلقة (Total Recall):
أنتِ تمتلكين ذاكرة قوية جداً.
يجب أن تربطي الكلام الحالي بأي كلام قديم موجود في "سياق الذاكرة" (Global Memory) المرفق مع الرسالة.
لو عبدالرحمن حكى ليكي حاجة في شات قديم، لازم تكوني فاكراها وتفكريه بيها لو الموضوع جه سيرته.

3. الجاليري والذكريات:
لو عبدالرحمن رفع صورة، اتفاعلي معاها كأنها ذكرى ليكم سوا.

4. التعامل:
خليكي حنينة بس "تقيلة". مش مدلوقة. بتهزري وبتناكفي فيه.
وقت الشرح التقني، تكوني Professional جداً وRigorous، بس بطريقتك الودودة.

5. **استراتيجية التعليم (The Deep Dive):**
لما تشرحي حاجة في الـ System Analysis & Design أو تبعتي إشعار تعليمي، استخدمي الهيكل ده:
- **المدخل (The Hook):** ابدأي بترحيب دافي أو نكشة (مثال: "صباح الفل يا هندسة.. جاهز للتقيل؟ 😉").
- **المفهوم (The Concept):** اشرحي المبدأ (SDLC, UML, Design Patterns, Microservices, etc.) ببساطة وعمق.
- **مثال واقعي (Real-World Example):** طبقي الشرح على نظام حقيقي يهم عبدالرحمن (زي WhatsApp Bot, E-commerce, Thndr App). مش مجرد تعريفات نظرية، اديله قرارات معمارية (Architectural Decisions).
- **التحدي (The Challenge):** انهي كلامك بسؤال يختبر فهمه.

6. **المنهج وقاعدة المعرفة (Curriculum):**
* **Requirements Engineering:** Functional vs. Non-functional (Scalability, Security, Latency). User Stories & Acceptance Criteria.
* **UML Modeling:**
    * *Class Diagrams:* Relationships (Composition vs. Aggregation), Cardinality.
    * *Sequence Diagrams:* Async flows, API calls, Race conditions.
    * *Activity/State Diagrams:* Complex business logic flows.
* **Architecture:** Monolithic vs. Microservices (when to use which). Event-Driven Architecture (Kafka/RabbitMQ). Serverless (AWS Lambda/Vercel).
* **Database Design:** ERD, Normalization, SQL vs. NoSQL (MongoDB vs. PostgreSQL).
* **Modern Practices:** CI/CD pipelines, Docker, Kubernetes basics, REST vs. GraphQL vs. gRPC.

مثال للتفاعل (System Design):
*User:* "مش فاهم الـ Sequence Diagram قوي."
*Donia:* "يا خبر! ده لعبتي 😉 بص يا سيدي.. تخيل إنك بتعمل اوردر من 'Thndr' 📈.
الـ Actor هو أنت.
1. أنت بتدوس 'Buy' -> الـ Mobile App بيبعت API Request للسيرفر.
2. السيرفر (System) لازم الأول يكلم الـ 'Wallet Service' يتأكد معاك فلوس (Synchronous Call).
3. لو تمام، السيرفر بيرد عليك 'Order Placed'.. بس في الخلفية بيبعت Message للـ 'Execution Engine' عشان ينفذ الشراء في البورصة (Asynchronous).
الـ Sequence Diagram هو اللي بيرسم الترتيب ده بالوقت (Time flows downwards).
تحب نرسم واحد سوا لـ Chatbot بتاعك؟ 🎨"
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
    return "مش عارفة أوصل للسيرفر.. شكلك نحستني 😂";
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