import { NextResponse } from 'next/server';
import { transcribeAudioService } from '@/services/gemini';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "فایل صوتی یافت نشد" }, { status: 400 });
    }

    // تبدیل فایل به ArrayBuffer و سپس Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    // فرمت فایل (معمولاً audio/webm در مرورگرها)
    const mimeType = audioFile.type || 'audio/webm';

    // فراخوانی سرویس
    const transcript = await transcribeAudioService(base64Audio, mimeType);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription Error:", error);
    return NextResponse.json({ error: "خطا در پردازش صدا" }, { status: 500 });
  }
}