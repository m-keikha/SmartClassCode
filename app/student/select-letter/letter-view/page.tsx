'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAlphabetById } from '@/app/actions'; 
import { Volume2, Loader2, AlertCircle, Sparkles,Heart , VolumeX } from 'lucide-react';

interface MediaItem {
    text: string;
    imageUrl?: string;
    audioUrl?: string;
}

interface AlphabetData {
    letterGroup: string;
    letterVariants: MediaItem[];
    examples: MediaItem[];
    sentences: MediaItem[];
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

    return { playingUrl, playAudio };
};

const HighlightedText = ({ text }: { text: string }) => {
    if (!text) return null;
    
    const parts = text.split('-');

    return (
    
        <span>
            {parts.map((part, index) => (
                <span 
                    key={index} 
                    className={index % 2 !== 0 ? "text-[#FF6B6B]" : "text-gray-700"}
                >
                    {part}
                </span>
            ))}
        </span>
    );
};

const VariantCard = ({ item, isPlaying, onPlay }: { item: MediaItem, isPlaying: boolean, onPlay: () => void }) => (
    <button 
        onClick={onPlay}
        className={`relative flex flex-col items-center justify-center w-60 h-60 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 active:scale-95 overflow-hidden ${
            isPlaying ? 'border-green-400 bg-green-50 ring-4 ring-green-100' : 'border-transparent bg-white hover:border-green-200'
        }`}
    >
        {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.text} className="w-full h-full object-cover hover:scale-105 transition-all duration-300 hover:translate-y-2  drop-shadow-sm" />
        ) : (
            <div className={`w-20 h-20 flex items-center justify-center text-5xl font-black mb-3 ${isPlaying ? 'text-green-500' : 'text-blue-500'}`}>
                {item.text.replace(/-/g, '')}
            </div>
        )}
        {/* <span className={`text-lg font-bold ${isPlaying ? 'text-green-600' : 'text-gray-700'}`}>
            {item.text.replace(/-/g, '')}
        </span> */}
    </button>
);


const ExampleCard = ({ item, isPlaying, onPlay }: { item: MediaItem, isPlaying: boolean, onPlay: () => void }) => (
    <button 
        onClick={onPlay}
        className={`flex flex-col group items-center p-5 rounded-3xl transition-all duration-300 border-2 active:scale-95 w-full ${
            isPlaying ? 'border-blue-400 bg-blue-100 shadow-md ring-4 ring-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-lg'
        }`}
    >
        {item.imageUrl && (
            <div className="w-full aspect-square relative mb-4 bg-cyan-400 rounded-2xl shadow-inner p-3 flex items-center justify-center">
                <img src={item.imageUrl} alt="مثال" className="w-full h-full object-cover rounded-2xl  group-hover:scale-105 transition-all duration-300 group-hover:-translate-y-1 drop-shadow-md" />
            </div>
        )}
        <div className="text-2xl md:text-3xl font-bold text-center mt-auto">
            <HighlightedText text={item.text} />
        </div>
    </button>
);


const SentenceRow = ({ item, isPlaying, onPlay }: { item: MediaItem, isPlaying: boolean, onPlay: () => void }) => (
    <div className={`flex items-center hover:scale-105  hover:translate-y-1 justify-between p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 ${
        isPlaying ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'border-gray-100 bg-white hover:border-yellow-200 hover:shadow-md'
    }`}>
        <div className="text-2xl md:text-3xl font-bold leading-loose flex-1 text-right">
            <HighlightedText text={item.text} />
        </div>
        <button 
            onClick={onPlay}
            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-md transform transition-all active:scale-90 ${
                isPlaying ? 'bg-yellow-400 text-yellow-900 animate-pulse' : 'bg-[#FF6B6B] hover:bg-red-500 text-white hover:scale-110'
            }`}
            aria-label="پخش صدا"
        >
            {isPlaying ? <VolumeX size={26} /> : <Volume2 size={26} />}
        </button>
    </div>
);


function AlphabetContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [data, setData] = useState<AlphabetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { playingUrl, playAudio } = useAudioPlayer();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('یافت نشد - از طریق صفحه بندی اقدام کنید');
                setLoading(false);
                return;
            }

            try {
                const result = await getAlphabetById(id);
                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                setError(' اتصال اینترنت خود را بررسی کنید.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center dir-rtl">
            <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
            <p className="text-gray-600 font-bold text-lg animate-pulse">در حال ورود به کلاس درس...</p>
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
                
                {/* هدر */}
                <header className="bg-white rounded-[2.5rem] shadow-sm p-8 text-center border-b-4 border-green-400 relative overflow-hidden">
                    <div className="absolute top-2 right-4 opacity-30 animate-bounce"><Heart  size={40} className="text-yellow-400" /></div>
                    <div className="absolute bottom-2 left-4 opacity-30 animate-pulse"><Heart  size={30} className="text-blue-400" /></div>
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
                    <section className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-gray-100">
                        <div className="flex justify-center md:justify-start mb-8">
                            <h2 className="text-xl font-bold text-gray-700 bg-yellow-100 px-6 py-2 rounded-full shadow-sm">بیا با هم بخوانیم</h2>
                        </div>
                        <div className="flex flex-col gap-5">
                            {data.sentences.map((item, index) => (
                                <SentenceRow 
                                    key={index} 
                                    item={item} 
                                    isPlaying={playingUrl === item.audioUrl} 
                                    onPlay={() => playAudio(item.audioUrl)} 
                                />
                            ))}
                        </div>
                    </section>
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