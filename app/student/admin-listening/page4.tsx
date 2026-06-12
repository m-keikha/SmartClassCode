'use client'

import React, { SetStateAction, useEffect, useState } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { CircleAlert, LoaderCircle, Copy, Check } from 'lucide-react';
import { Select as SelectUi, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { processAudioFile } from '../../../utils/processAudioFile'
import { TranslationService } from '@/services/translation.service';
import { Input } from '@/components/ui/input';
import { addListening, checkAccessAdmin } from '../../actions'
import { ListeningModel } from '@/models';
import { useRouter } from 'next/router';
import { AudioUtils, TTSService } from '@/components/TtsTranslate';

export interface Question {
    title: string;
    level: 'اول' | 'دوم' | 'سوم' | 'چهارم' | 'پنجم' | 'ششم'
    text: string;
    vipListening?: {
        voiceName?: string;
        text?: string;
        transcription?: TranscriptionResponse
    }
    vipListeningVoice?: AudioType
}

export interface AudioType {
    data: string;
    contentType: string;
    filename: string;
    size: number;
}

interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

export interface TranscriptionResponse {
    success: boolean;
    text: string;
    words: WordTimestamp[];
    language: string;
    duration: number;
}

export interface WordTranslation {
    word: string;
    translate: string;
    dependent_phrase?: string;
    translate_dependent_phrase?: string;
}

export interface TranslationResponse {
    words: WordTranslation[];
    completeTranslation: string;
}

type Props = {
    setQuestion: (value: SetStateAction<Question>) => void
    question: Question;
};

export default function VipListening() {

    const [question, setQuestion] = useState<Question>({
        title: "",
        text: "",
        level: 'اول',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultTranslate, setResultTranslate] = useState<TranslationResponse>()
    const [apiSelected, setApiSelected] = useState(2)
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    // State های مربوط به ویرایش دستی کلمات با Claude
    const [manualJsonInput, setManualJsonInput] = useState('');
    const [isJsonCopied, setIsJsonCopied] = useState(false);
    const [isPromptCopied, setIsPromptCopied] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            const checkIsAdmin = await checkAccessAdmin()
            // if (checkIsAdmin.success === false) {
            //     window.location.href = '/'
            //     return
            // }
        }
        checkAccess()
    }, [])

    const handleTranslate = async (text: string) => {
        if (!text) {
            setError('Please enter text to translate');
            return;
        }




        try {
            const words = text.trim().split(/\s+/);
            const response = await TranslationService.translateText(words);
            setResultTranslate(response.data);
            setQuestion(prev => ({
                ...prev,
                vipListening: {
                    ...(prev.vipListening ?? { voiceName: '', text: '' }),
                    full_translate: response.data.completeTranslation,
                    translate_per_word: response.data.words
                }
            }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed');
        }
    };

    // کامپوننت داخلی آپلودر صدا (بدون تغییر)
    const AudioUploader = () => {
        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                setAudioFile(file);
                setAudioUrl(URL.createObjectURL(file));
            }
        };

        return (
            <div dir="rtl" className="max-w-md mx-auto mt-12 p-6 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 font-sans">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">آپلود فایل صوتی داستان</h2>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-44 border-2 border-indigo-200 border-dashed rounded-2xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-all duration-300 group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">برای انتخاب فایل کلیک کنید</span></p>
                            <p className="text-xs text-gray-400">فرمت‌های مجاز: MP3, WAV, OGG</p>
                        </div>
                        <input id="dropzone-file" type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
                {audioUrl && audioFile && (
                    <div className="mt-6 animate-fade-in">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-gray-700 truncate block w-48">{audioFile.name}</span>
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full shrink-0">
                                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <audio controls className="w-full h-11" src={audioUrl}>مرورگر شما از پخش صدا پشتیبانی نمی‌کند.</audio>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const handleGetVoiceOpenAi = async (text: string, voiceName: string) => {
        // if (!text.trim() || text === '') return setError('لطفاً متن را وارد کنید');
        // if (!voiceName || voiceName === '') return setError('لطفاً صدا را انتخاب کنید');

        setIsLoading(true);
        setError('');

        try {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl('');
            }

            let file: null | File = null
            if (!audioFile) {
                const ttsFullTextGenerate = await TTSService.generateVoice(text, voiceName, 'gemini', apiSelected)
                file = AudioUtils.blobToFile(ttsFullTextGenerate, 'voice-audio.mp3', ttsFullTextGenerate.type);
            } else file = audioFile

            const audioData = await processAudioFile(file)
            if (audioData.data?.data && !audioData.error) {
                setQuestion({ ...question, vipListeningVoice: audioData.data })
                await handleTranscribe(audioData.data)
            }

            const url = URL.createObjectURL(file);
            setAudioUrl(url);

        } catch (err) {
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                setError('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('خطای نامشخص رخ داد');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleTranscribe = async (listeningData: AudioType) => {
        if (!listeningData || !listeningData.data) return setError('داده صوتی یافت نشد');
        setError('');

        try {
            const binaryString = window.atob(listeningData.data);
            let byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteArray[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: listeningData.contentType });
            const audioFileTranscribe = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });

            const formData = new FormData();
            formData.append('audio', audioFileTranscribe, 'audio.mp3');
            console.log('صوت برای ترنسکریپت شدن به سرور ارسال شد')

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('خطا در تبدیل صدا به متن');

            const responseData: TranscriptionResponse = await response.json();
            if (!responseData.success) throw new Error(responseData.text || 'خطا در دریافت نتیجه');

            // ذخیره مستقیم دیتای خام Whisper در State
            if (question.vipListening) {
                setQuestion(prev => ({
                    ...prev,
                    vipListening: {
                        ...(prev.vipListening ?? { voiceName: '', text: '' }),
                        transcription: responseData
                    }
                }))
            }

        } catch (err) {
            setError('خطا در ارتباط با سرور Whisper');
        }
    };

    const postData = async () => {
        const result = await addListening(question)
        if (result.success) alert('با موفقیت ثبت شد')
    }

    // --- توابع کمکی برای ویرایش دستی Claude ---
    const claudePrompt = `You are an expert Persian language editor. Your task is to receive a JSON object containing an array of transcribed "words" and fix any spelling errors.
CRITICAL RULES:
1. STRICT INDEXING: Maintain the exact length and order of the array.
2. NO SPLITTING: Fix errors within the same single "word" string (e.g. use zero-width non-joiners). Do not split into two items.
3. PRESERVE METADATA: Do not alter "start", "end", or any other keys.
4. JSON OUTPUT: Return valid JSON matching the input format perfectly: { "words": [ ... ] }

Here is the JSON data:`;

    const copyPromptToClipboard = () => {
        navigator.clipboard.writeText(claudePrompt);
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 2000);
    };

    const copyRawJsonToClipboard = () => {
        const rawWords = question.vipListening?.transcription?.words;
        if (rawWords) {
            navigator.clipboard.writeText(JSON.stringify(rawWords, null, 2));
            setIsJsonCopied(true);
            setTimeout(() => setIsJsonCopied(false), 2000);
        }
    };

    const applyManualJson = () => {
        try {
            const parsed = JSON.parse(manualJsonInput);
            const newWords = Array.isArray(parsed) ? parsed : parsed.words;
            
            if (!Array.isArray(newWords) || newWords.length === 0) {
                throw new Error('فرمت JSON نامعتبر است. لطفاً فقط آرایه خروجی را وارد کنید.');
            }

            // جایگذاری کلمات جدید در State
            setQuestion(prev => ({
                ...prev,
                vipListening: {
                    ...prev.vipListening,
                    transcription: {
                        ...prev.vipListening!.transcription!,
                        words: newWords
                    }
                }
            }));
            
            alert('✅ کلمات اصلاح شده با موفقیت جایگزین شدند!');
            setManualJsonInput(''); // پاک کردن فیلد بعد از موفقیت
        } catch (error) {
            alert('❌ خطا در خواندن JSON. لطفاً مطمئن شوید ساختار کپی شده صحیح است.');
        }
    };

    return (
        <div dir="rtl" className="p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen min-w-screen flex flex-col items-center">
            <div className="relative space-y-6 p-10 bg-slate-50 rounded-2xl text-black flex flex-col w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%]">
                <div className='mt-4'>
                    <label className="font-bold block text-slate-800 mb-2">عنوان درس</label>
                    <Input
                        type="text"
                        placeholder="عنوان درس را وارد کنید"
                        value={question.title}
                        onChange={(e) => setQuestion({ ...question, title: e.target.value })}
                        className="input border-2 rounded p-2"
                    />

                    <label className="block mt-6 text-slate-800 mb-2">پایه مدنظر را انتخاب کنید</label>
                    <SelectUi
                        value={question.level}
                        onValueChange={(value: any) => setQuestion({ ...question, level: value })}
                    >
                        <SelectTrigger className="w-[200px] border rounded p-2">
                            <SelectValue placeholder="پایه را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="اول">اول</SelectItem>
                            <SelectItem value="دوم">دوم</SelectItem>
                            <SelectItem value="سوم">سوم</SelectItem>
                            <SelectItem value="چهارم">چهارم</SelectItem>
                            <SelectItem value="پنجم">پنجم</SelectItem>
                            <SelectItem value="ششم">ششم</SelectItem>
                        </SelectContent>
                    </SelectUi>

                    <label className='block mt-6 mb-2 text-slate-800'>گوینده صدا را انتخاب کنید</label>
                    <div className='flex'>
                        <SelectUi
                            value={question.vipListening?.voiceName}
                            onValueChange={(value) => {
                                setQuestion({ ...question, vipListening: { ...question.vipListening, voiceName: value, text: '' } })
                            }}
                        >
                            <SelectTrigger dir="rtl" className="w-[280px] border rounded p-2 mb-4 mt-2 text-right focus:ring-2 focus:ring-green-500">
                                <SelectValue placeholder="گوینده صدا را انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className='h-80 overflow-auto'>
                                <SelectItem value="Not-Select"> انتخاب کنید</SelectItem>
                                <SelectItem value="Puck">Puck (پیش‌فرض، دوستانه و پرانرژی)</SelectItem>
                                <SelectItem value="Charon">Charon (مردانه، عمیق و مقتدر)</SelectItem>
                                <SelectItem value="Kore">Kore (زنانه، قاطع و حرفه‌ای)</SelectItem>
                            </SelectContent>
                        </SelectUi>

                        <SelectUi
                            value={apiSelected.toString()}
                            onValueChange={(value) => setApiSelected(Number(value))}
                        >
                            <SelectTrigger dir="rtl" className="w-[280px] border rounded focus:ring-2 focus:ring-green-500 p-2 mb-4 mt-2 mx-7 text-right">
                                <SelectValue placeholder="سرویس تبدیل متن به صدا را انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="1">سرویس  1</SelectItem>
                                <SelectItem value="2">سرویس  2</SelectItem>
                            </SelectContent>
                        </SelectUi>
                    </div>

                    <label className='mt-6'>متن عباراتی که تبدیل به صوت خواهد شد را وارد کنید
                        <span className='flex space-x-1 items-center bg-white backdrop-blur-2xl rounded-2xl w-max mb-4 p-2 mt-2'>
                            <CircleAlert className='text-amber-400 font-bold text-2xl' />
                            <p className='text-red-500 mb-2 items-center mt-2'>حتما بین هر کلمه فاصله Space بگذارید </p>
                        </span>
                    </label>
                    <Textarea
                        placeholder="Type your text here."
                        onChange={(e) => setQuestion({ ...question, vipListening: { ...question.vipListening, text: e.target.value || '', voiceName: question.vipListening?.voiceName || '', } })}
                        className="input rounded p-2 mb-6 h-30"
                    />

                    <button
                        type="button"
                        // onClick={() => !isLoading && handleGetVoiceOpenAi(question.vipListening?.text ?? '', question.vipListening?.voiceName ?? '')}
                        onClick={() => !isLoading && handleGetVoiceOpenAi(question.vipListening?.text ?? '', question.vipListening?.voiceName ?? '')}
                        disabled={isLoading}
                        className={`group flex items-center justify-center gap-3 mt-12 px-6 py-3 min-w-[260px] bg-amber-300 hover:bg-amber-400 text-amber-950 font-medium text-base rounded-xl shadow-md shadow-amber-300/20 hover:shadow-amber-300/40 transition-all duration-200 active:scale-95 disabled:opacity-80 disabled:cursor-wait disabled:active:scale-100`}
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin text-xl">⏳</span>
                                <span>در حال دریافت داده ها...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xl transition-transform duration-300 group-hover:translate-y-1">{audioUrl !== '' && question.vipListening?.transcription && question.vipListeningVoice ? '✅' : '⬇️'}</span>
                                <span>{audioUrl !== '' && question.vipListening?.transcription && question.vipListeningVoice ? 'عملیات با موفقیت انجام شد' : 'تبدیل متن به صدا'} </span>
                            </>
                        )}
                    </button>



bu




                    <AudioUploader />

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* ---------- بخش جدید: رابط کاربری ویرایش دستی کلمات ---------- */}
                    {question.vipListening?.transcription?.words && (
                        <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span>✨</span> ویرایش دقیق کلمات (با استفاده از Claude)
                            </h3>
                            
                            <div className="space-y-4 text-sm text-gray-700">
                                <p className="font-semibold text-indigo-800">مرحله اول: کپی اطلاعات</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={copyPromptToClipboard}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg transition-colors"
                                    >
                                        {isPromptCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        {isPromptCopied ? 'پرامپت کپی شد!' : 'کپی دستور (Prompt)'}
                                    </button>
                                    <button 
                                        onClick={copyRawJsonToClipboard}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg transition-colors"
                                    >
                                        {isJsonCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        {isJsonCopied ? 'آرایه کپی شد!' : 'کپی آرایه خام (JSON)'}
                                    </button>
                                </div>

                                <p className="font-semibold text-indigo-800 pt-4">مرحله دوم: جایگذاری خروجی</p>
                                <p className="text-xs text-gray-500 mb-2">پرامپت و آرایه را به Claude بدهید، سپس JSON اصلاح شده را اینجا پیست کنید:</p>
                                
                                <Textarea 
                                    dir="ltr"
                                    className="font-mono text-xs h-32 bg-white border-indigo-200 focus-visible:ring-indigo-500"
                                    placeholder='[{"word": "سلام", "start": 0.0, "end": 0.5}, ...]'
                                    value={manualJsonInput}
                                    onChange={(e) => setManualJsonInput(e.target.value)}
                                />

                                <button 
                                    onClick={applyManualJson}
                                    disabled={!manualJsonInput.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex justify-center items-center gap-2"
                                >
                                    <Check size={20} />
                                    تایید و جایگزینی کلمات در دیتابیس
                                </button>
                            </div>
                        </div>
                    )}
                    {/* ------------------------------------------------------------- */}

                    <button
                        type="button"
                        onClick={() => postData()}
                        className={`flex items-center justify-center w-full sm:w-auto px-6 py-2.5 mt-8 bg-blue-500 text-white border border-blue-600 hover:bg-blue-600 rounded-xl transition-all duration-200 font-medium`}
                    >
                        {'+ ثبت نهایی سوال'}
                    </button>

                </div >
            </div>
        </div>
    )
}