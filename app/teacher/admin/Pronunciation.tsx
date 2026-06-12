import React, { Dispatch, SetStateAction, useState } from 'react'
import { IQuestion } from './page';
import { Input } from '@/components/ui/input';
import { processAudioFile } from '@/utils/processAudioFile';
import { AudioUtils, TTSService } from '@/components/TtsTranslate';


type Props = {
    setQuestion: (value: SetStateAction<IQuestion>) => void
    question: IQuestion,
    speakerName: string,
    setSpeakerName: Dispatch<SetStateAction<string>>
    handleOptionsChange: (value: string, index: number) => void
    handleDeleteOptInput: (index: number) => void
    handleAddOptions: () => void

};

export default function Pronunciation({ setQuestion,
    question,
    speakerName,
    setSpeakerName,
    handleOptionsChange,
    handleDeleteOptInput,
    handleAddOptions

}: Props) {


    const [isLoading, setIsLoading] = useState<boolean>(false)



    const handleOptionsTTS = async () => {


        if (!question.pronunciation?.mainPharse) return

        setIsLoading(true)

        //جنریت صدا


        let audioArray = []

        for (let i = 0; i < question.options.length; i++) {
            const ttsOptionsGenerate = await TTSService.generateVoice(question.options[i], speakerName, 'openAi')
            const file = AudioUtils.blobToFile(ttsOptionsGenerate, `${question.options[i]}.mp3`, ttsOptionsGenerate.type);
            // پردازش فایل صوتی
            const TTSWordOfText = await processAudioFile(file)

            audioArray.push(TTSWordOfText?.data)

        }


        const ttsFullTextGenerate = await TTSService.generateVoice(question.pronunciation?.mainPharse, speakerName, 'openAi')


        const file = AudioUtils.blobToFile(ttsFullTextGenerate, 'voice-audio.mp3', ttsFullTextGenerate.type);



        // پردازش فایل صوتی
        const TTSFullText = await processAudioFile(file)

        if (!TTSFullText.data) {
            console.log('خطا در دریافت صدای متن')
        }


        if (TTSFullText.data) {
            setQuestion({ ...question, pronunciation: { ...question.pronunciation, MainWordPronunciation: TTSFullText.data, optionsPronunciation: audioArray } })
        }


        setIsLoading(false)
    }


    return (
        <div className='mt-4'>
            <label className="block mt-2 mb-2 font-medium ml-4">کلمه یا عبارتی که تلفظ آن را میخواهید تست بگیرید را وارد کنید</label>
            <Input
                value={question?.pronunciation?.mainPharse || ''}
                type="text"
                onChange={(e) => setQuestion({ ...question, pronunciation: { ...question.pronunciation, mainPharse: e.target.value || '' } })}
                className="input border-1 rounded p-2"
                placeholder='example: station'
            />


            {/* <div className='mt-4'>

                <label className='font-medium'>گزینه‌های سوال </label>
                {question.options.map((opt, i) => (
                    <div key={i} className="flex flex-row mt-2">
                        <Input
                            placeholder={`گزینه ${i + 1}`}
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionsChange(e.target.value, i)}
                            className="input border-1  rounded w-100 p-2 "
                        />

                        {question.options.length !== 1 && (
                            <button
                                className="bg-red-100 ml-2 text-red-500 md:p-2 p-0.5 mx-1  rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center"
                                onClick={() => handleDeleteOptInput( i)}
                                key={i}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {
                            <button
                                onClick={() => handleAddOptions(qIndex, i)}
                                className="flex items-center justify-center md:p-2 p-0.5 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        }
                        {
                            <button
                                onClick={() => handleCorrectAnswer(allQuestion[qIndex].options[i], qIndex, i)}
                                className={`flex text-sm items-center justify-center mx-2 md:p-2 p-0.5  text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-500 ${correctAnswer[qIndex].index === i ? 'bg-emerald-600 text-white' : 'bg-slate-200'}  hover:text-white hover:border-emerald-600 transition-all duration-200 shadow-sm`}
                            >
                                گزینه درست
                            </button>
                        }
                    </div>
                ))}

            </div> */}


            <button
                type="button"
                onClick={() => !isLoading && handleOptionsTTS()}
                disabled={isLoading}
                className={`
        group flex items-center justify-center gap-3 mt-12 px-6 py-3 min-w-[260px]
        bg-amber-300 hover:bg-amber-400 text-amber-950 font-medium text-base
        rounded-xl shadow-md shadow-amber-300/20 hover:shadow-amber-300/40
        transition-all duration-200 active:scale-95
        disabled:opacity-80 disabled:cursor-wait disabled:active:scale-100
    `}
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin text-xl">⏳</span>
                        <span>در حال دریافت داده ها...</span>
                    </>
                ) : (

                    <>
                        <span className="text-xl transition-transform duration-300 group-hover:translate-y-1">{question.audioOptions ? '✅' : '⬇️'}</span>
                        <span>{question.audioOptions ? 'عملیات با موفقیت انجام شد' : 'تبدیل عبارات به صدا'} </span>
                    </>
                )}

            </button>

        </div>
    )
}
