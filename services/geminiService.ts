import { GoogleGenAI } from "@google/genai";
import { Student, Grade, Course } from "../types";

// Note: In a real app, never expose API keys on the client side.
// This is for demonstration purposes as per instructions.
const apiKey = process.env.GEMINI_API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateStudentPerformanceReport = async (
  student: Student,
  grades: Grade[],
  courses: Course[]
): Promise<string> => {
  console.log('first')
  
  if (!apiKey) {
    console.log("خطا: کلید API یافت نشد. لطفاً تنظیمات محیطی را بررسی کنید.")
    return  "خطا: کلید API یافت نشد. لطفاً تنظیمات محیطی را بررسی کنید.";
  }

  // Construct context for the AI
  const gradeDetails = grades.map(g => {
    const courseName = courses.find(c => c._id === g.courseId)?.name || 'درس نامشخص';
    return `- درس: ${courseName}، نمره: ${g.score}، توضیحات معلم: ${g.description || 'ندارد'}`;
  }).join('\n');

  const prompt = `
    نقش: تو یک مشاور تحصیلی هوشمند و دلسوز هستی.
    وظیفه: نوشتن یک گزارش عملکرد تحصیلی برای دانش‌آموز.
    
    اطلاعات دانش‌آموز:
    نام: ${student.firstName} ${student.lastName}
    نام پدر: ${student.fatherName}
    
    لیست نمرات و ارزیابی‌ها:
    ${gradeDetails}
    
    دستورالعمل‌ها:
    1. گزارش باید به زبان فارسی، رسمی و محترمانه باشد.
    2. ابتدا نقاط قوت دانش‌آموز را برجسته کن.
    3. سپس نقاطی که نیاز به تلاش بیشتر دارند را با لحنی سازنده بیان کن.
    4. یک توصیه نهایی کوتاه و انگیزشی برای دانش‌آموز داشته باش.
    5. گزارش نباید خیلی طولانی باشد (حدود 150 تا 200 کلمه).
    6. از فرمت Markdown برای بولد کردن کلمات کلیدی استفاده کن.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "متاسفانه نتوانستم گزارش را تولید کنم.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "خطا در برقراری ارتباط با هوش مصنوعی. لطفاً بعداً تلاش کنید.";
  }
};