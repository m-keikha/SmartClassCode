import { GoogleGenerativeAI } from "@google/generative-ai";

// گرفتن کلید از متغیرهای محیطی
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function transcribeAudioService(base64Audio: string, mimeType: string) {
  // استفاده از مدل فلش که برای پردازش سریع فایل‌های مالتی‌مدیا عالیه
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  // پرامپت دقیق برای تبدیل صدا به متن
  const prompt = "این فایل صوتی را با دقت بالا به متن تبدیل کن. فقط متن داخل صدا را بنویس و هیچ توضیح اضافه‌ای نده.";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType,
      },
    },
  ]);

  return result.response.text();
}