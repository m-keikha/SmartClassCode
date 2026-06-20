import { MediaItem } from "../page";
import { useRef } from "react";

export default function VariantCard({ item, isPlaying, onPlay }: { item: MediaItem, isPlaying: boolean, onPlay: () => void }) {

    const videoRef = useRef<HTMLVideoElement>(null);

    const videoUrl = item.writingAnimationUrl?.replace('.gif', '.mp4');


    const handleVideoEnd = () => {
        setTimeout(() => {
            if (videoRef.current) {

                videoRef.current.currentTime = 0;
                videoRef.current.play();
            }
        }, 3000); 
    };

    return (
        <button
            onClick={onPlay}
            className={`group relative flex flex-col items-center justify-between w-60 h-72 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 active:scale-95 overflow-hidden ${
                isPlaying ? 'border-green-400 bg-green-50 ring-4 ring-green-100' : 'border-gray-100 bg-white hover:border-green-300'
            }`}
        >

            <div className="flex-1 w-full flex items-center justify-center p-0 overflow-hidden">
                {item.imageUrl ? (
                    <img 
                        src={item.imageUrl} 
                        alt={item.text} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" 
                    />
                ) : (
                    <div className={`text-7xl font-black transition-colors duration-300 ${isPlaying ? 'text-green-500' : 'text-blue-500'}`}>
                        {item.text.replace(/-/g, '')}
                    </div>
                )}
            </div>


            {videoUrl && (
                <div className="w-full h-24 bg-slate-50/80 border-t border-slate-100 flex flex-col items-center justify-center py-2 px-4 transition-colors duration-300 group-hover:bg-green-50">
                    <span className="text-[10px] text-gray-400 font-bold mb-1 tracking-wider">
                        نحـوه نوشتـن
                    </span>
                    <video 
                        ref={videoRef}
                        src={videoUrl} 
                        autoPlay 
                        muted 
                        playsInline 
                        onEnded={handleVideoEnd} 
                        className="h-full w-full scale-125 object-contain mix-blend-multiply" 
                    />
                </div>
            )}
            
            {isPlaying && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-3xl pointer-events-none animate-pulse" />
            )}
        </button>
    );
}