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


        let audioArray = []

        for (let i = 0; i < question.options.length; i++) {
            const ttsOptionsGenerate = await TTSService.generateVoice(question.options[i], speakerName, 'openAi')
            const file = AudioUtils.blobToFile(ttsOptionsGenerate, `${question.options[i]}.mp3`, ttsOptionsGenerate.type);
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
