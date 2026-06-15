import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const { 
            systemPrompt, 
            userContent, 
            isJsonMode = true, 
            temperature = 0.1 
        } = body;

        if (!systemPrompt || !userContent) {
            return NextResponse.json(
                { error: 'پارامترهای systemPrompt و userContent الزامی هستند.' },
                { status: 400 }
            );
        }

        const contentString = typeof userContent === 'string' 
            ? userContent 
            : JSON.stringify(userContent);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: temperature,
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