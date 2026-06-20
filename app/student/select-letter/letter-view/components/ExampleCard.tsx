import { MediaItem } from "../page";
import HighlightedText from "./NewLetterHighlight";
import ShowExampleText from "./ShowExampleText";

export default function ExampleCard({ item, isPlaying, onPlay }: { item: MediaItem, isPlaying: boolean, onPlay: () => void }) {

    return (
        <button
            onClick={onPlay}
            className={`flex flex-col group items-center p-5 rounded-3xl transition-all duration-300 border-2 active:scale-95 w-full ${isPlaying ? 'border-blue-400 bg-blue-100 shadow-md ring-4 ring-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-lg'
                }`}
        >
            {item.imageUrl && (
                <div className="w-full aspect-square relative mb-4 bg-cyan-400 rounded-2xl shadow-inner p-3 flex items-center justify-center">
                    <img src={item.imageUrl} alt="مثال" className="w-full h-full object-cover rounded-2xl  group-hover:scale-105 transition-all duration-300 group-hover:-translate-y-1 drop-shadow-md" />
                </div>
            )}
            <div className="text-2xl md:text-3xl font-bold text-center mt-auto">
                <ShowExampleText text={item.text} />
            </div>
        </button>
    );
}




