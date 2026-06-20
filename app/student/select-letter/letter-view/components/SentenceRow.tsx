import { useEffect, useState } from "react";
import { MediaItem } from "../page";
import HighlightedText from "./NewLetterHighlight";
import { Volume2, VolumeX } from 'lucide-react'

interface Iprops {
    item: MediaItem;
    isPlaying: boolean;
    onPlay: () => void;
    audioRef: React.MutableRefObject<HTMLAudioElement>;
}

export default function SentenceRow({ item, isPlaying, onPlay, audioRef }: Iprops) {

    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !isPlaying || !item.transcript?.words) {
            setCurrentWordIndex(-1)
            return
        }

        const handleTimeUpdate = () => {
            if (!audioRef.current || !item.transcript?.words) return;

            const ct = audioRef.current.currentTime

            const idx = item.transcript.words.findIndex((word) => word.start <= ct && ct <= word.end)
            setCurrentWordIndex((prev) => (prev !== idx ? idx : prev))

        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
        }
    }, [isPlaying, item.transcript?.words, audioRef])



    return (

        <div onClick={onPlay} className={`flex items-center hover:scale-105  hover:translate-y-1 justify-between p-5 md:p-6 rounded-3xl border-2 transition-all duration-300 ${isPlaying ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'border-gray-100 bg-white hover:border-yellow-200 hover:shadow-md'
            }`}>
            <div  className="text-2xl md:text-3xl font-bold leading-loose flex-1 text-right">
                <HighlightedText words={item.transcript?.words} audioRef={audioRef} activeWordIdx={currentWordIndex} onPlay={onplay} />
            </div>
            <button
                onClick={onPlay}
                className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-md transform transition-all active:scale-90 ${isPlaying ? 'bg-yellow-400 text-yellow-900 animate-pulse' : 'bg-[#FF6B6B] hover:bg-red-500 text-white hover:scale-110'
                    }`}
                aria-label="پخش صدای جمله"
            >
                {isPlaying ? <VolumeX size={26} /> : <Volume2 size={26} />}
            </button>
        </div>

    );
}
