export interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

interface Iprops {
    audioRef: React.MutableRefObject<HTMLAudioElement>;
    words: WordTimestamp[];
    activeWordIdx: number;
    onPlay: () => void;

}

export default function HighlightedText({ words, activeWordIdx, audioRef, onPlay }: Iprops) {
    if (!words) return null;

    const handleWordClick = (index: number) => {
        onPlay

        if (audioRef.current && words[index]) {
            audioRef.current.currentTime = words[index].start;
            audioRef.current.play();
        }
    }


    return (
        <span>
            {words.map((wordItem, index) => {
                let parts = null
                if (wordItem.word.includes('-')) {
                    parts = wordItem.word.split('-')
                }
                const isActive = index === activeWordIdx

                return (

                    <span
                        className={`inline-block px-1 py-1 rounded-lg transition-colors duration-200 ${isActive ? "bg-yellow-200 text-gray-900 scale-110 shadow-sm  " : "text-gray-700"}`}
                        onClick={() => handleWordClick(index)}

                    >
                        {parts !== null ? parts.map((part: string, pIndex: number) => (

                            <span
                                className={pIndex % 2 !== 0 ? (isActive ? "text-red-700 " : "text-[#FF6B6B] ") : ""}                            >
                                {part}
                            </span>

                        )) :
                            wordItem.word

                        }
                    </span>


                )

            })}
        </span>
    );
};
