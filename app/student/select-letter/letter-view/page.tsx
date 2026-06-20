'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAlphabetById } from '@/app/actions'; 
import { Volume2, Loader2, AlertCircle, Sparkles, Heart, VolumeX } from 'lucide-react';
import { TranscriptionResponse } from '../../listening-page/run/page';
import ShowHighlightLetterInSentence from './components/NoHighlightSentence';
import VariantCard from './components/VariantCard';
import ExampleCard from './components/ExampleCard';


export interface MediaItem {
    text: string;
    imageUrl?: string;
    writingAnimationUrl?: string
    audioUrl?: string;
    transcript?: TranscriptionResponse | undefined

}

interface AlphabetData {
    letterGroup: string;
    letterVariants: MediaItem[];
    examples: MediaItem[];
    sentences: MediaItem[];
}
interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

interface AlphabetServerData {
    success: boolean;
    data: AlphabetData | undefined;
    error?: undefined | string;
}


const useAudioPlayer = () => {
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = (url?: string) => {
        if (!url) return;

        if (playingUrl === url) {
            audioRef.current?.pause();
            setPlayingUrl(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        const newAudio = new Audio(url);
        newAudio.onended = () => setPlayingUrl(null); 
        newAudio.play();

        audioRef.current = newAudio;
        setPlayingUrl(url);
    };


    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return { playingUrl, playAudio, audioRef };
};



function AlphabetContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [data, setData] = useState<AlphabetData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [words, setWords] = useState<WordTimestamp[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);



    const { playingUrl, playAudio, audioRef } = useAudioPlayer();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('حرف مورد نظر مشخص نشده است.');
                setLoading(false);
                return;
            }

            try {
                const result = await getAlphabetById(id) as AlphabetServerData;
                if (result.success) {
                    setData(result.data);
                    const transcriptArr = result.data.sentences.filter((sentence) => sentence.transcript !== undefined)

                } else {
                    setError(result.error);
                }
            } catch (err) {
                setError('خطا در ارتباط با سرور. اتصال اینترنت خود را بررسی کنید.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center dir-rtl">
            <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
            <p className="text-gray-600 font-bold text-lg animate-pulse">در حال ورود به درس...</p>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center dir-rtl p-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-red-100 max-w-md w-full">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={56} />
                <p className="text-gray-800 font-bold text-lg">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white p-4 md:p-8 dir-rtl font-sans pb-24">
            <div className="max-w-4xl mx-auto space-y-12">


                <header className="bg-white rounded-[2.5rem] shadow-sm p-8 text-center border-b-4 border-green-400 relative overflow-hidden">
                    <div className="absolute top-2 right-4 opacity-30 animate-bounce"><Heart size={40} className="text-yellow-400" /></div>
                    <div className="absolute bottom-2 left-4 opacity-30 animate-pulse"><Heart size={30} className="text-blue-400" /></div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-800 font-medium relative z-10">
                        حرف « <span className="text-[#FF6B6B] font-medium px-2">{data.letterGroup}</span> »
                    </h1>
                </header>


                {data.letterVariants.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-gray-700 mb-6 bg-green-200 inline-block px-6 py-2 rounded-full shadow-sm">شکل‌های حرف</h2>
                        <div className="flex flex-wrap justify-center gap-6">
                            {data.letterVariants.map((item, index) => (
                                <VariantCard
                                    key={index}
                                    item={item}
                                    isPlaying={playingUrl === item.audioUrl}
                                    onPlay={() => playAudio(item.audioUrl)}
                                />
                            ))}
                        </div>
                    </section>
                )}


                {data.examples.length > 0 && (
                    <section className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-gray-100">
                        <div className="flex justify-center md:justify-start mb-8">
                            <h2 className="text-xl font-bold text-gray-700 bg-blue-100 px-6 py-2 rounded-full shadow-sm">مثال‌ها</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {data.examples.map((item, index) => (
                                <ExampleCard
                                    key={index}
                                    item={item}
                                    isPlaying={playingUrl === item.audioUrl}
                                    onPlay={() => playAudio(item.audioUrl)}
                                />
                            ))}
                        </div>
                    </section>
                )}



                {data.sentences.length > 0 && (
                    <ShowHighlightLetterInSentence playAudio={playAudio} playingUrl={playingUrl} sentences={data.sentences} audioRef={audioRef} />
                )}

            </div>
        </div>
    );
}


export default function StudentAlphabetPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-green-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        }>
            <AlphabetContent />
        </Suspense>
    );
}