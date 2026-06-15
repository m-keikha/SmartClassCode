// app/api/transcribe/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai'; 

export const maxDuration = 300; 

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'فایل صوتی ارسال نشده است' }, { status: 400 });
        }

        const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/webm', 'audio/ogg'];
        if (!allowedTypes.includes(audioFile.type)) {
            return NextResponse.json({ error: 'فرمت فایل صوتی پشتیبانی نمی‌شود' }, { status: 400 });
        }

        const maxSize = 25 * 1024 * 1024; // 25MB
        if (audioFile.size > maxSize) {
            return NextResponse.json({ error: 'حجم فایل نباید بیشتر از 25 مگابایت باشد' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'کلید API تنظیم نشده است' }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 300000, 
            maxRetries: 2,  
        });

        console.log(`در حال ارسال فایل ${audioFile.name} با حجم ${(audioFile.size / 1024 / 1024).toFixed(2)} MB از طریق OpenAI SDK...`);

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['word']
        });

        return NextResponse.json({
            success: true,
            text: transcription.text,
            words: transcription.words || [],
            language: transcription.language || 'unknown',
            duration: transcription.duration || 0,
        });

    } catch (error: any) {
        console.error('خطا در پردازش درخواست:', error);
        
        return NextResponse.json(
            { 
                error: 'خطا در تبدیل صدا به متن',
                details: error.message || 'خطای شبکه یا سرور'
            },
            { status: 500 }
        );
    }
}