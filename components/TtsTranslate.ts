// types.ts
export interface TranslationResult {
  completeTranslation: string;
  words: Array<{ word: string; translate: string }>;
}

export interface AudioType {
  data: string;
  contentType: string;
}

export interface TranscriptionResponse {
  success: boolean;
  text: string;
}

export interface VipListening {
  voiceName: string;
  text: string;
  full_translate?: string;
  translate_per_word?: Array<{ word: string; translation: string }>;
  transcription?: TranscriptionResponse;
}

// utils/audioUtils.ts
export class AudioUtils {
  static base64ToBlob(base64: string, contentType: string): Blob {
    const binaryString = window.atob(base64);
    const byteArray = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }

    return new Blob([byteArray], { type: contentType });
  }

  static blobToFile(blob: Blob, fileName: string, mimeType: string): File {
    return new File([blob], fileName, { type: mimeType });
  }

  static revokeAudioUrl(url: string): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  static createAudioUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }
}

// utils/errorHandler.ts
export class ErrorHandler {
  /**
   * مدیریت خطاهای API
   */
  static async handleApiError(
    response: Response,
    defaultMessage: string,
  ): Promise<never> {
    let errorMessage = defaultMessage;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;

      if (errorData.details) {
        errorMessage += `: ${errorData.details}`;
      }
    } catch (e) {
      errorMessage = `خطا ${response.status}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  static handleGeneralError(err: unknown): string {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      return "خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید";
    } else if (err instanceof Error) {
      return err.message;
    }
    return "خطای نامشخص رخ داد";
  }
}

// services/translationService.ts
export class TranslationService {
  static async translateText(text: string[]): Promise<TranslationResult> {
    if (!text || text.length === 0) {
      throw new Error("لطفاً متن را وارد کنید");
    }

    const response = await fetch("/api/translate-advaced", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) {
      await ErrorHandler.handleApiError(response, "خطا در ترجمه متن");
    }

    const data = await response.json();
    return {
      completeTranslation: data.data.completeTranslation,
      words: data.data.words,
    };
  }

  static async translateTextString(text: string): Promise<TranslationResult> {
    if (!text || !text.trim()) {
      throw new Error("لطفاً متن را وارد کنید");
    }

    const words = text.trim().split(/\s+/);
    return this.translateText(words);
  }
}

// services/ttsService.ts
export class TTSService {
  static async generateVoice(
    text: string,
    voiceName: string,
    model: "gemini" | "openAi" = "openAi",
    apiNum: number = 1,
  ): Promise<Blob> {
    if (!text || !text.trim()) {
      throw new Error("لطفاً متن را وارد کنید");
    }

    if (!voiceName) {
      throw new Error("لطفاً صدا را انتخاب کنید");
    }

    const url = model == "openAi" ? "openai_tts" : "tts-gemini";
    const response = await fetch(`/api/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voiceName: voiceName, apiNum }),
    });

    if (!response.ok) {
      await ErrorHandler.handleApiError(response, "خطا در تولید صوت");
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("audio")) {
      throw new Error("فرمت پاسخ سرور معتبر نیست");
    }

    const audioBlob = await response.blob();

    // بررسی اندازه فایل
    if (audioBlob.size === 0) {
      throw new Error("فایل صوتی خالی است");
    }

    return audioBlob;
  }
}

// services/transcriptionService.ts
export class TranscriptionService {
  /**
   * تبدیل صدا به متن
   */
  static async transcribeAudio(
    audioData: AudioType,
  ): Promise<TranscriptionResponse> {
    if (!audioData || !audioData.data) {
      throw new Error("داده صوتی یافت نشد");
    }

    // تبدیل base64 به File
    const blob = AudioUtils.base64ToBlob(audioData.data, audioData.contentType);
    const audioFile = AudioUtils.blobToFile(blob, "audio.mp3", "audio/mpeg");

    const formData = new FormData();
    formData.append("audio", audioFile);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      await ErrorHandler.handleApiError(response, "خطا در تبدیل صدا به متن");
    }

    const responseData: TranscriptionResponse = await response.json();

    if (!responseData.success) {
      throw new Error(responseData.text || "خطا در دریافت نتیجه");
    }

    return responseData;
  }
}

// hooks/useTtsTranslate.ts
import { useState, useEffect } from "react";

interface UseTtsTranslateReturn {
  error: string;
  isLoading: boolean;
  audioUrl: string;
  translateText: (
    text: string,
    onSuccess?: (result: TranslationResult) => void,
  ) => Promise<TranslationResult | null>;
  translateWords: (
    words: string[],
    onSuccess?: (result: TranslationResult) => void,
  ) => Promise<TranslationResult | null>;
  generateAndProcessVoice: (
    text: string,
    voiceName: string,
    processAudioFile: (
      file: File,
    ) => Promise<{ data?: AudioType; error?: string }>,
    onSuccess?: (
      audioData: AudioType,
      transcription: TranscriptionResponse,
      translation: TranslationResult,
    ) => void,
  ) => Promise<boolean>;
  transcribeAudio: (
    audioData: AudioType,
    onSuccess?: (result: TranscriptionResponse) => void,
  ) => Promise<TranscriptionResponse | null>;
  cleanup: () => void;
}

export function useTtsTranslate(): UseTtsTranslateReturn {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const translateText = async (
    text: string,
    onSuccess?: (result: TranslationResult) => void,
  ): Promise<TranslationResult | null> => {
    try {
      setError("");
      const result = await TranslationService.translateTextString(text);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.handleGeneralError(err);
      setError(errorMessage);
      return null;
    }
  };

  const translateWords = async (
    words: string[],
    onSuccess?: (result: TranslationResult) => void,
  ): Promise<TranslationResult | null> => {
    try {
      setError("");
      const result = await TranslationService.translateText(words);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.handleGeneralError(err);
      setError(errorMessage);
      return null;
    }
  };

  /**
   * تولید صدا و پردازش کامل
   */
  const generateAndProcessVoice = async (
    text: string,
    voiceName: string,
    processAudioFile: (
      file: File,
    ) => Promise<{ data?: AudioType; error?: string }>,
    onSuccess?: (
      audioData: AudioType,
      transcription: TranscriptionResponse,
      translation: TranslationResult,
    ) => void,
  ): Promise<boolean> => {
    setIsLoading(true);
    setError("");

    AudioUtils.revokeAudioUrl(audioUrl);
    setAudioUrl("");

    try {
      // تولید صدا
      const audioBlob = await TTSService.generateVoice(text, voiceName);
      const file = AudioUtils.blobToFile(
        audioBlob,
        "voice-audio.mp3",
        audioBlob.type,
      );

      // پردازش فایل صوتی
      const audioData = await processAudioFile(file);

      if (!audioData.data || audioData.error) {
        throw new Error(audioData.error || "خطا در پردازش فایل صوتی");
      }

      // تبدیل صدا به متن
      const transcription = await TranscriptionService.transcribeAudio(
        audioData.data,
      );

      // ترجمه متن
      const translation = await TranslationService.translateTextString(text);

      // ایجاد URL برای پخش
      const url = AudioUtils.createAudioUrl(audioBlob);
      setAudioUrl(url);

      onSuccess?.(audioData.data, transcription, translation);

      return true;
    } catch (err) {
      const errorMessage = ErrorHandler.handleGeneralError(err);
      setError(errorMessage);
      console.error("خطا در تولید و پردازش صوت:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * فقط تبدیل صدا به متن
   */
  const transcribeAudio = async (
    audioData: AudioType,
    onSuccess?: (result: TranscriptionResponse) => void,
  ): Promise<TranscriptionResponse | null> => {
    setIsLoading(true);
    setError("");

    try {
      const result = await TranscriptionService.transcribeAudio(audioData);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = ErrorHandler.handleGeneralError(err);
      setError(errorMessage);
      console.error("خطا در تبدیل صدا به متن:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = (): void => {
    AudioUtils.revokeAudioUrl(audioUrl);
    setAudioUrl("");
  };

  return {
    error,
    isLoading,
    audioUrl,
    translateText,
    translateWords,
    generateAndProcessVoice,
    transcribeAudio,
    cleanup,
  };
}

async function example1_SimpleTranslation() {
  try {
    const text = "Hello World";
    const result = await TranslationService.translateTextString(text);
    console.log("ترجمه:", result.completeTranslation);
    console.log("کلمات:", result.words);
  } catch (error) {
    console.error("خطا:", ErrorHandler.handleGeneralError(error));
  }
}


async function example2_TranslateWords() {
  try {
    const words = ["Hello", "World", "Goodbye"];
    const result = await TranslationService.translateText(words);
    console.log("ترجمه:", result.completeTranslation);
  } catch (error) {
    console.error("خطا:", ErrorHandler.handleGeneralError(error));
  }
}


async function example3_GenerateVoice() {
  try {
    const text = "Hello, how are you?";
    const voiceName = "en-US-Neural2-A";
    const audioBlob = await TTSService.generateVoice(text, voiceName);


    const url = AudioUtils.createAudioUrl(audioBlob);
    console.log("URL صوتی:", url);


    const a = document.createElement("a");
    a.href = url;
    a.download = "voice.mp3";
    a.click();

    // پاک کردن URL
    AudioUtils.revokeAudioUrl(url);
  } catch (error) {
    console.error("خطا:", ErrorHandler.handleGeneralError(error));
  }
}


async function example4_TranscribeAudio(audioData: AudioType) {
  try {
    const result = await TranscriptionService.transcribeAudio(audioData);
    console.log("متن تشخیص داده شده:", result.text);
  } catch (error) {
    console.error("خطا:", ErrorHandler.handleGeneralError(error));
  }
}


function example5_UseInComponent() {
  const {
    error,
    isLoading,
    audioUrl,
    translateText,
    translateWords,
    generateAndProcessVoice,
    transcribeAudio,
    cleanup,
  } = useTtsTranslate();


  const handleTranslate = async (text: string) => {
    const result = await translateText(text);
    if (result) {
      console.log("ترجمه انجام شد:", result.completeTranslation);
    }
  };


  const handleTranslateWithCallback = async (text: string) => {
    await translateText(text, (result) => {
      console.log("ترجمه:", result.completeTranslation);
      console.log("کلمات:", result.words);
    });
  };

  // تابع تولید صدا
  const handleGenerateVoice = async (text: string, voiceName: string) => {
    const processAudioFile = async (file: File) => {
      // پردازش فایل صوتی
      return {
        data: {
          data: "base64_audio_data",
          contentType: file.type,
        },
      };
    };

    await generateAndProcessVoice(
      text,
      voiceName,
      processAudioFile,
      (audioData, transcription, translation) => {
        console.log("صدا تولید شد");
        console.log("متن:", transcription.text);
        console.log("ترجمه:", translation.completeTranslation);
      },
    );
  };


  useEffect(() => {
    return () => cleanup();
  }, []);

  return {
    error,
    isLoading,
    audioUrl,
    handleTranslate,
    handleTranslateWithCallback,
    handleGenerateVoice,
  };
}


export default function TtsTranslate() {
  const [question, setQuestion] = useState<any>({});
  const { translateText, generateAndProcessVoice } = useTtsTranslate();

  const handleTranslate = async (text: string) => {
    await translateText(text, (result) => {
      setQuestion((prev: any) => ({
        ...prev,
        vipListening: {
          ...(prev.vipListening ?? { voiceName: "", text: "" }),
          full_translate: result.completeTranslation,
          translate_per_word: result.words,
        },
      }));
      console.log("داده های ترجمه شده:", result);
    });
  };

  const handleGetVoiceGemini = async (text: string, voiceName: string) => {
    const processAudioFile = async (file: File) => {

      return { data: { data: "", contentType: "audio/mpeg" } };
    };

    await generateAndProcessVoice(
      text,
      voiceName,
      processAudioFile,
      (audioData, transcription, translation) => {
        setQuestion((prev: any) => ({
          ...prev,
          vipListeningVoice: audioData,
          vipListening: {
            ...(prev.vipListening ?? { voiceName: "", text: "" }),
            full_translate: translation.completeTranslation,
            translate_per_word: translation.words,
            transcription: transcription,
          },
        }));
      },
    );
  };

  return {
    handleTranslate,
    handleGetVoiceGemini,
  };
}
