export const dynamic = 'force-dynamic';
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 300000, // اختصاص ۵ دقیقه زمان برای انتظار
    maxRetries: 3,   // در صورت قطع شدن سوکت، ۳ بار دیگر خودش تلاش کند
});


export async function POST(request:NextRequest) {

    try{

    
    const {text , voice  } = await request.json()

    if (!text) {
       return NextResponse.json(
            {error : 'متن الزامی است',} , {status:400}
        )
    }

  const mp3 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice,
    input: text,
  });


  const buffer = Buffer.from(await mp3.arrayBuffer());


    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
      },
    });
    }
catch (err) {
    console.error('خطا در تولید صدا:', err);
    return NextResponse.json(
      { error: 'خطا در تولید صدا' },
      { status: 500 }
    );
}


}
