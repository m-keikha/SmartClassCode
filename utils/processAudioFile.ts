export async function processAudioFile(audioFile: File): Promise<{
    data?: {
        data: string;
        contentType: string;
        filename: string;
        size: number;
    };
    error?: string;
}> {
    try {
        console.log(audioFile)
        // بررسی نوع فایل
        if (!audioFile.type.startsWith('audio/')) {
            return { error: "فایل ارسال شده باید از نوع صوتی باشد" };
        }

        // بررسی حجم فایل (مثلاً حداکثر 5MB برای فایل‌های کوتاه)
        const maxSize = 10 * 1024 * 1024; // 5MB
        if (audioFile.size > maxSize) {
            return { error: "حجم فایل صوتی نباید بیش از 10 مگابایت باشد" };
        }

        // تبدیل فایل به Base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        console.log(`Audio file processed: ${audioFile.name}, Size: ${audioFile.size} bytes`);

        return {
            data: {
                data: base64Audio,
                contentType: audioFile.type,
                filename: audioFile.name,
                size: audioFile.size
            }
        };
    } catch (error) {
        console.error("Error processing audio file:", error);
        return { error: "خطا در پردازش فایل صوتی" };
    }
}

