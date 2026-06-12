'use client'
import { checkAccessAdmin } from '@/app/actions';
import React, { useEffect, useState } from 'react'
import Pronunciation from './Pronunciation';
import { Input } from '@/components/ui/input';
import Toast from '@/components/notification';
import Alefba from './Alefba';
import { AudioType, AudioUtils } from '@/components/TtsTranslate';

export interface IQuestion {
    title: string;
    level: 'اول' | 'دوم' | 'سوم' | 'چهارم' | 'پنجم' | 'ششم';
    options: string[]
    pronunciation?: {
        mainPharse: string
        MainWordPronunciation: AudioData
        optionsPronunciation: AudioData[]
    }
}

export interface MainLetter {
    letterParts: string[];
    textOfVoiceLetter: string[];
    voices: AudioType[];

}


export default function page() {


    const [message, setMessage] = useState<string>('')
    const [showMessage, setShowMessage] = useState<boolean>(false)

    const [question, setQuestion] = useState<IQuestion>({
        title: "",
        level: 'اول',
        options: [''],

    });

    const [mainLetter, setMainLetter] = useState({
        letterParts: [''],
        textOfVoiceLetter: [''],
        voices: []
    })


    const [speakerName, setSpeakerName] = useState<string>('')



    const handleAddOptions = () => {
        if (question.options.length >= 16) {
            setShowMessage(true)
            setMessage('حداکثر 16 گزینه می توانید وارد کنید')

            return
        }

        setQuestion(prev => ({
            ...prev, options: [...prev.options, '']
        }))
    }

    const handleAddMainLetterParts = () => {
        setMainLetter(prev => ({
            ...prev, letterParts: [...prev.letterParts, ''],
            textOfVoiceLetter: [...prev.textOfVoiceLetter, '']
        }))
    }
    const handleDeleteMainLetterPartsInput = (index: number) => {
        const newLetterParts = mainLetter.letterParts.filter((_, i) => i != index)
        const newTextVoice = mainLetter.textOfVoiceLetter.filter((_, i) => i != index)
        const newVoice = mainLetter.voices.filter((_, i) => i != index)

        setMainLetter(prev => ({
            ...prev, letterParts: newLetterParts,
            textOfVoiceLetter: newTextVoice,
            voices: newVoice
        }))

    }


    const handleOptionsChange = (value: string, index: number) => {
        const newOption = [...question.options]
        newOption[index] = value
        setQuestion({
            ...question,
            options: newOption
        })
    }

    const handleTextVoiceChange = (value: string, index: number) => {
        const newTextOfVoice = { ...mainLetter.textOfVoiceLetter }
        newTextOfVoice[index] = value
        setMainLetter({ ...mainLetter, textOfVoiceLetter: newTextOfVoice })

    }

    const handleLetterPartsChange = (value: string, index: number) => {
        const newLetterParts = { ...mainLetter.letterParts }
        newLetterParts[index] = value,
            setMainLetter({ ...mainLetter, letterParts: newLetterParts })

    }





    const handleDeleteOptInput = (index: number) => {
        const newOpt = question.options.filter((_, i) => i != index)
        setQuestion({ ...question, options: newOpt })
    }


    useEffect(() => {
        const checkAccess = async () => {
            const checkIsAdmin = await checkAccessAdmin()

            if (checkIsAdmin.success === false) {
                window.location.href = '/'
                return
            }
        }
        checkAccess()

    }, [])


    const closeMessageManage = () => {
        setShowMessage(false)
        setMessage('')
    }



    return (
        <div dir="rtl" className="   p-4  bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen min-w-screen  flex flex-col items-center ">
            {showMessage && <Toast message={message} duration={3000} onClose={closeMessageManage} isVisible={showMessage} />}

            <div className=" relative space-y-6   bg-slate-50 p-15 h-[90%]  rounded-2xl  text-black  flex flex-col   w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] ">
                <div className="flex flex-col items-center justify-center ">




                    <Alefba setQuestion={setQuestion} question={question} setSpeakerName={setSpeakerName} speakerName={speakerName} handleAddOptions={handleAddOptions} handleDeleteOptInput={handleDeleteOptInput} handleTextVoiceChange={handleTextVoiceChange} handleLetterPartsChange={handleLetterPartsChange} handleAddMainLetterParts={handleAddMainLetterParts} mainLetter={mainLetter} handleDeleteMainLetterPartsInput={handleDeleteMainLetterPartsInput} setMainLetter={setMainLetter} handleOptionsChange={handleOptionsChange} />

                    {/* <button
                        type="button"
                        // onClick={() => addListening(question)}
                        className={`flex items-center  justify-center w-full sm:w-auto px-6 py-2.5 mt-6 bg-blue-400 text-white border border-blue-500 hover:bg-blue-500 hover:border-blue-500 rounded-xl transition-all duration-200 font-medium`}
                    >
                        {'+ افزودن سوال'}

                    </button> */}


                </div>
            </div>
        </div>
    )
}
