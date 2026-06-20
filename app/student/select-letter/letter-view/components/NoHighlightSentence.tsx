import React from 'react'
import SentenceRow from './SentenceRow'
import { MediaItem } from '../page'

interface Iprops {
    sentences : MediaItem[];
    playingUrl : string ;
    playAudio :  (url?: string) => void;
    audioRef: React.MutableRefObject<HTMLAudioElement>
}

export default function ShowHighlightLetterInSentence({sentences ,playingUrl , playAudio, audioRef}: Iprops) {
  return (
                    <section className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-gray-100">
                        <div className="flex justify-center md:justify-start mb-8">
                            <h2 className="text-xl font-bold text-gray-700 bg-yellow-100 px-6 py-2 rounded-full shadow-sm">بیا با هم بخوانیم</h2>
                        </div>
                        <div className="flex flex-col gap-5">
                            {sentences.map((item, index) => (
                                <SentenceRow
                                    key={index}
                                    item={item}
                                    audioRef = {audioRef}
                                    isPlaying={playingUrl === item.audioUrl}
                                    onPlay={() => playAudio(item.audioUrl)}
                                />
                            ))}
                        </div>
                    </section>
  )
}
