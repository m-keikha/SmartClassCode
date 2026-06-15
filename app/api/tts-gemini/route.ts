// app/api/tts/route.ts
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import mime from 'mime';

interface WavConversionOptions {
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
        numChannels: 1,
    };

    if (format && format.startsWith('L')) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }

    for (const param of params) {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key === 'rate') {
            options.sampleRate = parseInt(value, 10);
        }
    }

    return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

function convertToWav(rawData: string, mimeType: string): Buffer {
    const options = parseMimeType(mimeType);
    const buffer = Buffer.from(rawData, 'base64');
    const wavHeader = createWavHeader(buffer.length, options); 
    return Buffer.concat([wavHeader, buffer]);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, voiceName, apiNum } = body;

        if (!text || !voiceName) {
            return NextResponse.json(
                { error: 'text و voiceName الزامی هستند' },
                { status: 400 }
            );
        }

        function ToFive(n: number) {
            return ((n - 1) % 8) + 1;
        }

        const apiNumber = ToFive(apiNum) || 2;
        const GEMINI_API_KEY = process.env[`GEMINI_API_KEY_${apiNumber}`];

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'کلید API تنظیم نشده است' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });

        const config = {
            temperature: 1,
            responseModalities: ['audio'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName,
                    }
                }
            },
        };

        const model = 'gemini-2.5-flash-preview-tts';
        const contents = [
            {
                role: 'user',
                parts: [{ text: text }],
            },
        ];

        const response = await ai.models.generateContent({
            model,
            config,
            contents,
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (!part || !part.inlineData) {
            return NextResponse.json(
                { error: 'هیچ داده صوتی دریافت نشد' },
                { status: 500 }
            );
        }

        const inlineData = part.inlineData;
        let fileExtension = mime.getExtension(inlineData.mimeType || '');
        let finalBuffer: Buffer;

        if (!fileExtension) {
            finalBuffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
        } else {
            finalBuffer = Buffer.from(inlineData.data || '', 'base64');
        }

        return new NextResponse(finalBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': finalBuffer.length.toString(),
                'Content-Disposition': 'attachment; filename="audio.wav"',
            },
        });

    } catch (error: any) {
        console.error('خطا در تولید صوت:', error);
        
        const isRateLimit = error?.status === 429 || error?.message?.includes('429');
        
        return NextResponse.json(
            { 
                error: isRateLimit ? 'محدودیت درخواست! متن طولانی است یا تعداد درخواست‌ها زیاد بوده.' : 'خطا در پردازش درخواست', 
                details: error instanceof Error ? error.message : 'خطای نامشخص' 
            },
            { status: isRateLimit ? 429 : 500 }
        );
    }
}