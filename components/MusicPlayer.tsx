import { useState, useRef, useEffect, forwardRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioSrc: string;
  title?: string;
}

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ audioSrc, title }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      if (!ref || typeof ref === 'function') return;
      const audio = ref.current;
      if (!audio) return;

      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);

      const handlePause = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('play', handlePlay);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('play', handlePlay);
      };
    }, [ref]);

    const togglePlay = () => {
      if (!ref || typeof ref === 'function') return;
      const audio = ref.current;
      if (!audio) return;
      isPlaying ? audio.pause() : audio.play();
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!ref || typeof ref === 'function') return;
      const audio = ref.current;
      if (!audio) return;
      const t = parseFloat(e.target.value);
      audio.currentTime = t;
      setCurrentTime(t);
    };

    const formatTime = (t: number) => {
      if (isNaN(t)) return '0:00';
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
      <div className="w-full">
        {/* نوار فشرده */}
        <div className="flex items-center gap-2.5">

          <button
            onClick={togglePlay}
            className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow hover:shadow-purple-400/50 hover:scale-110 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-white" fill="currentColor" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* زمان جاری */}
          <span className="text-xs text-gray-500 dark:text-gray-400 w-8 flex-shrink-0 tabular-nums">
            {formatTime(currentTime)}
          </span>

          {/* نوار پیشرفت */}
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleTimeChange}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
                direction: 'ltr',
              }}
            />
          </div>

          {/* مدت کل */}
          <span className="text-xs text-gray-400 dark:text-gray-500 w-8 flex-shrink-0 text-left tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        <audio ref={ref} src={audioSrc} className="hidden" />

        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            cursor: pointer;
            border: 1.5px solid white;
            box-shadow: 0 2px 6px rgba(168, 85, 247, 0.4);
          }
          input[type='range']::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            cursor: pointer;
            border: 1.5px solid white;
          }
        `}</style>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;