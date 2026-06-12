import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // استخراج پارامترهای داینامیک از درخواست
        const { 
            systemPrompt, 
            userContent, 
            isJsonMode = true, // پیش‌فرض روی JSON است چون معمولا دیتای ساختاریافته می‌خواهیم
            temperature = 0.1 
        } = body;

        // اعتبارسنجی ورودی‌ها
        if (!systemPrompt || !userContent) {
            return NextResponse.json(
                { error: 'پارامترهای systemPrompt و userContent الزامی هستند.' },
                { status: 400 }
            );
        }

        // تبدیل محتوای کاربر به رشته (اگر آبجکت یا آرایه فرستاده بود)
        const contentString = typeof userContent === 'string' 
            ? userContent 
            : JSON.stringify(userContent);

        // ارسال درخواست به OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: temperature,
            // اگر isJsonMode فعال باشد، مدل را مجبور می‌کنیم فقط JSON معتبر برگرداند
            response_format: isJsonMode ? { type: 'json_object' } : { type: 'text' },
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: contentString,
                },
            ],
        });

        const aiContent = response.choices[0].message.content;

        if (!aiContent) {
            throw new Error('محتوایی از هوش مصنوعی دریافت نشد');
        }

        // پردازش خروجی بر اساس مود انتخابی
        let finalResult = aiContent;
        if (isJsonMode) {
            finalResult = JSON.parse(aiContent);
        }

        return NextResponse.json({
            success: true,
            data: finalResult,
        });

    } catch (error: any) {
        console.error('خطا در API همه‌کاره OpenAI:', error);
        return NextResponse.json(
            { 
                error: 'خطا در پردازش درخواست',
                details: error.message || 'خطای سرور'
            },
            { status: 500 }
        );
    }
}