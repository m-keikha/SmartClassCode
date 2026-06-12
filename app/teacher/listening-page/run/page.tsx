'use client'
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import AudioPlayer from '@/components/MusicPlayer'
import { addListening, getListeningById, listeningUpdateById, postQuestion, teacherAccess } from '@/app/actions';
import { Input } from '@/components/ui/input';
import Toast from '@/components/notification';
export interface AudioType {
    data: string;
    contentType: string;
    filename: string;
    size: number;
}

export interface TranscriptionResponse {
    success: boolean;
    text: string;
    words: WordTimestamp[];
    language: string;
    duration: number;
}

interface IQuestion {
    text: string;
    answer: string;
    options: string[];
    wordsIndexPlayQuestion?: string | null
}

interface IListeningData {
    _id: string;
    classId?: string;
    title: string;
    level: string;
    text?: string;
    vipListening?: {
        voiceName?: string;
        text?: string;
        transcription?: TranscriptionResponse
    }

    vipListeningVoice?: AudioType,
    createdAt: string
    updatedAt: string;

}


interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

export interface TranscriptionResponse {
    success: boolean;
    text: string;
    words: WordTimestamp[];
    language: string;
    duration: number;
}


interface Translate {
    word: string,
    phrasalWerb?: string,
    translatePharseWerb?: string
    index: number

}
interface Correct {
    index: number | null;
    text: string
}





function WordSelectorModal({
    words,
    qIndex,
    currentValue,
    onSelect,
}: {
    words: WordTimestamp[];
    qIndex: number;
    currentValue: string;
    onSelect: (index: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempSelected, setTempSelected] = useState<number | null>(
        currentValue !== '' ? Number(currentValue) : null
    );

    const handleConfirm = () => {
        if (tempSelected !== null) {
            onSelect(tempSelected);

        }
        setIsOpen(false);
    };

    return (
        <div className="mt-2">
            <label className="block mb-1  text-gray-700 font-medium">
                مکانی که می‌خواهید سوال پرسیده شود را انتخاب کنید
            </label>

            <button
                onClick={() => setIsOpen(true)}
                className="bg-purple-200 mt-4 hover:bg-purple-300 text-indigo-900 border border-indigo-300 rounded-lg px-4 py-2 text-md transition-all"
            >
                {currentValue !== ''
                    ? `کلمه انتخاب‌شده: "${words[Number(currentValue)]?.word}"`
                    : 'انتخاب کلمه'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-[90vw] max-w-lg">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
                            کلمه‌ای که می‌خواهید سوال بعد از آن پرسیده شود را انتخاب کنید
                        </h3>

                        {/* نمایش کلمات */}
                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 bg-gray-50 dark:bg-slate-700 rounded-xl mb-4">
                            {words.map((wordObj, index) => (
                                <span
                                    key={index}
                                    onClick={() => setTempSelected(index)}
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 select-none
                    ${tempSelected === index
                                            ? 'bg-indigo-500 text-white scale-105 shadow-md ring-2 ring-indigo-300'
                                            : 'bg-white dark:bg-slate-600 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 border border-gray-200 dark:border-slate-500'
                                        }`}
                                >
                                    {wordObj.word}
                                </span>
                            ))}
                        </div>

                        {/* پیش‌نمایش انتخاب */}
                        {tempSelected !== null && (
                            <p className="text-center text-sm text-indigo-600 dark:text-indigo-300 mb-3">
                                سوال بعد از کلمه <strong>«{words[tempSelected]?.word}»</strong> پرسیده می‌شود
                            </p>
                        )}

                        {/* دکمه‌ها */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleConfirm}
                                disabled={tempSelected === null}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-6 py-2 font-medium transition-all"
                            >
                                تایید
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-6 py-2 font-medium transition-all"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function Listening() {
    const params = useParams();
    const { id } = params;
    const translateRef = useRef<HTMLSpanElement>(null);
    const searchParams = useSearchParams();
    const myId = searchParams.get('id');

    const [message, setMessage] = useState<string>('')
    const [showMessage, setShowMessage] = useState<boolean>(false)


    const [audioUrl, setAudioUrl] = useState<string>('');
    const [transcriptionText, setTranscriptionText] = useState<string>('');
    const [words, setWords] = useState<WordTimestamp[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [translateWord, setTranslateWord] = useState<Translate>({
        word: '',
        index: -2
    })


    const [error, setError] = useState('');
    const [listeningData, setListeningData] = useState<IListeningData | null>(null);

    const [question, setQuestion] = useState<IQuestion>({

        answer: "",
        options: ["", ""],
        text: "",
        wordsIndexPlayQuestion: ""


    })

    const [typeOfImplementingQuestion, setTypeOfImplementingQuestion] = useState<'endContent' | 'duringContent'>('endContent')
    const [indexPlayQuestion, setindexPlayQuestion] = useState<number | null>(null)
    const [allQuestion, setAllQuestion] = useState<IQuestion[]>([{

        answer: "",
        options: ["", ""],
        text: "",
        wordsIndexPlayQuestion: null

    }])

    const [correctAnswer, setCorrectAnswer] = useState<Correct[]>([{
        index: null,
        text: ''
    }])

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const checkAccess = async () => {
            const checkIsAdmin = await teacherAccess()


            if (!checkIsAdmin.success) {
                window.location.href = '/'

                return
            }
        }
        checkAccess()

    }, [])



    // بارگذاری داده از IndexedDB
    useEffect(() => {

        async function load() {
            try {

                const listening = await getListeningById(myId)

                // const data = (await getData('listeningData')) as ListeningData[];
                // const currentLesson = data.find((item) => item.id === id);

                if (listening) {
                    setListeningData(listening);

                    // ساخت URL برای پخش صوت
                    const voiceData = listening.vipListeningVoice?.data;
                    const voiceType = listening.vipListeningVoice?.contentType;

                    if (voiceData) {
                        const binaryString = window.atob(voiceData);
                        let byteArray = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            byteArray[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([byteArray], { type: voiceType });

                        // تبدیل Buffer/ArrayBuffer به Blob
                        const url = URL.createObjectURL(blob);
                        setAudioUrl(url);


                    }
                }
            } catch (err) {
                console.error('خطا در بارگذاری داده:', err);
                setError('خطا در بارگذاری فایل صوتی');
            }
        }
        load();

        // پاکسازی URL هنگام unmount
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [id]);


    useEffect(() => {
        if (!isLoading && audioUrl) {

            handleTranscribe()

        }

    }, [audioUrl])


    // ارسال فایل به API و دریافت transcription
    const handleTranscribe = async () => {
        if (!listeningData) {
            setError('داده صوتی یافت نشد');
            return;
        }

        const voiceData = listeningData.vipListeningVoice?.data;
        const voiceType = listeningData.vipListeningVoice?.contentType;
        if (!voiceData) {
            setError('فایل صوتی موجود نیست');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // // تبدیل data به File برای ارسال به API
            // const binaryString = window.atob(voiceData);
            // let byteArray = new Uint8Array(binaryString.length);
            // for (let i = 0; i < binaryString.length; i++) {
            //   byteArray[i] = binaryString.charCodeAt(i);
            // }
            // const blob = new Blob([byteArray], { type: voiceType });


            // // const blob = new Blob([voiceData], { type: 'audio/mpeg' });
            // const audioFile = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });

            // const formData = new FormData();
            // formData.append('audio', audioFile);

            // const response = await fetch('/api/transcribe', {
            //   method: 'POST',
            //   body: formData,
            // });

            // if (!response.ok) {
            //   let errorMessage = 'خطا در تبدیل صدا به متن';
            //   try {
            //     const errorData = await response.json();
            //     errorMessage = errorData.error || errorMessage;
            //     if (errorData.details) {
            //       errorMessage += `: ${errorData.details}`;
            //     }
            //   } catch (e) {
            //     errorMessage = `خطا ${response.status}: ${response.statusText}`;
            //   }
            //   throw new Error(errorMessage);
            // }

            const responseData: TranscriptionResponse = listeningData.vipListening?.transcription;
            console.log('oooo', listeningData.vipListening)
            console.log('wisper :', responseData)

            if (!responseData || !responseData.success) {
                throw new Error(responseData.text || 'خطا در دریافت نتیجه');
            }

            setTranscriptionText(responseData.text);
            setWords(responseData.words);
        } catch (err) {
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                setError('خطا در اتصال به سرور. اتصال اینترنت را بررسی کنید');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('خطای نامشخص رخ داد');
            }
            console.error('خطا:', err);
        } finally {
            setIsLoading(false);
        }
    };


    // const handleHoverWord = (index: number, word?: string) => {


    //     const newTranslate = listeningData?.vipListening?.translate_per_word[index].translate
    //     const isDependentPharse = listeningData?.vipListening?.translate_per_word[index].dependent_phrase
    //     const translateDependentPharse = listeningData?.vipListening?.translate_per_word[index].translate_dependent_phrase
    //     if (isDependentPharse) setTranslateWord({ word: newTranslate ?? '', index: index, phrasalWerb: isDependentPharse, translatePharseWerb: translateDependentPharse })
    //     else setTranslateWord({ word: newTranslate ?? '', index: index })


    //     console.log(newTranslate)

    // }


    // هایلایت کردن کلمه بر اساس زمان پخش
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || words.length === 0) return;

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;
            const activeIndex = words.findIndex(
                (word) => currentTime >= word.start && currentTime <= word.end
            );
            setCurrentWordIndex(activeIndex);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [words]);

    // رفتن به کلمه خاص با کلیک
    const handleWordClick = (index: number) => {
        if (audioRef.current && words[index]) {
            audioRef.current.currentTime = words[index].start;
            audioRef.current.play();
        }
    };



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (translateRef.current && !translateRef.current.contains(event.target as Node)) {
                setTranslateWord({ word: "", index: -1 });
            }
        };
        if (translateWord.word) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [translateWord]);





    const closeMessageManage = () => {
        setShowMessage(false)
        setMessage('')
    }


    const handleOptionsChange = (value: string, qIndex: number, index: number) => {
        const newOption = [...allQuestion[qIndex].options]
        newOption[index] = value
        setAllQuestion(prev => {
            const newQ = [...prev]
            newQ[qIndex].options[index] = value
            return newQ
        })
    }



    const handleDeleteOptInput = (qIndex: number, index: number) => {
        const newOpt = allQuestion[qIndex].options.filter((_, i) => i != index)
        setAllQuestion(prev => {
            const newQ = [...prev]
            newQ[qIndex].options = newOpt
            return newQ
        })
    }


    const handleAddQuestion = () => {
        setCorrectAnswer([...correctAnswer, { text: '', index: 0 }])
        setAllQuestion(prev => [...prev, { text: "", answer: "", options: ["", ""] }])


    }
    const handleRemoveQuestion = () => {
        setCorrectAnswer(prev => prev.slice(0, -1));
        setAllQuestion(prev => prev.slice(0, -1));

    }

    const handleAddOptions = (qIndex: number, i: number) => {
        if (allQuestion[qIndex].options.length >= 16) {
            // setShowAlert({ alert: true, content: 'حداکثر 16 گزینه می توانید وارد کنید' })

            return
        }

        setAllQuestion(prev => {
            const newOpt = [...prev]
            newOpt[qIndex].options = [...newOpt[qIndex].options, '']
            return newOpt
        })
    }

    const handleCorrectAnswer = (answerText: string, qIndex: number, index: number) => {
        // const newAanswer = [...correctAnswer]

        // newAanswer[index] = { text: answerText, index: index }

        // setCorrectAnswer(newAanswer)

        setCorrectAnswer(prev => {
            const newAnswer = [...prev]
            newAnswer[qIndex] = { text: answerText, index: index }
            return newAnswer
        })

        setAllQuestion(prev => {
            const newQ = [...prev]
            newQ[qIndex].answer = answerText
            return newQ
        })
    }


    const handleQTextChange = (value: string, qIndex: number) => {
        setAllQuestion(prev => {
            const newQ = [...prev]
            newQ[qIndex].text = value
            return newQ
        })

    }

    const sendQuestionToDatabase = async () => {

        const listeningResult = await postQuestion(allQuestion, myId)
        if (listeningResult.success === true) {
            setMessage('سوال با موفقیت ثبت شد!')
            setShowMessage(true)
        } else {
            setMessage('عدم موفقیت')
            setShowMessage(true)

        }
    }


    const handlerTypeImplementQ = (qIndex: number, type: string) => {
        if (type === 'duringContent') {
            setAllQuestion(prev => {
                const newQ = [...prev]
                newQ[qIndex].wordsIndexPlayQuestion = ''
                return newQ
            })
        } else {
            setAllQuestion(prev => {
                const newQ = [...prev]
                newQ[qIndex].wordsIndexPlayQuestion = null
                return newQ
            })
        }
    }




    return (

        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            {showMessage && <Toast message={message} duration={3000} onClose={closeMessageManage} isVisible={showMessage} />}



            {audioUrl && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-lg">
                    <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-1">
                                🎧 {listeningData?.title || '...'}
                            </p>
                            <AudioPlayer ref={audioRef} audioSrc={audioUrl} />
                        </div>
                    </div>
                </div>
            )}

            {audioUrl && <div className="h-20" />}




            <div className="max-w-5xl mx-auto ">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-sm bg-opacity-90">
                    {/* Header */}
                    <div className="text-center mb-8 ">
                        <h1 className="text-3xl sm:text-4xl  font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-3">
                            تحلیل صوتی
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            {listeningData?.title || 'در حال بارگذاری...'}
                        </p>
                    </div>

                    {/* نمایش خطا */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg animate-shake">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    )}



                    {/* نمایش متن با هایلایت کلمات */}
                    {words.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl p-6 sm:p-8 shadow-inner">


                            <div className="flex items-center gap-3 mb-6 rtl">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                    خوانداری
                                </h2>
                            </div>

                            <div className="text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-6">
                                {words.map((wordObj, index) => (
                                    <span
                                        key={index}
                                        // onMouseOver={() => handleHoverWord(index, wordObj.word)}
                                        onClick={() => handleWordClick(index)}
                                        className={`
                      inline-block relative px-2 py-1 mx-0.5 my-0.5 rounded-lg cursor-pointer transition-all duration-200 select-none
                      ${currentWordIndex === index
                                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold scale-110 shadow-lg ring-2 ring-yellow-300'
                                                : 'hover:bg-purple-100 dark:hover:bg-slate-600 hover:scale-105'
                                            }
                    `}
                                    >
                                        {wordObj.word}


                                        {
                                            translateWord.index === index && (
                                                <span
                                                    ref={translateRef}
                                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-green-600 border-2   text-white text-sm rounded-md py-2 px-3 shadow-lg z-10"
                                                >
                                                    {translateWord.phrasalWerb && (
                                                        <span>
                                                            {translateWord.phrasalWerb} : {translateWord.translatePharseWerb}
                                                            <hr />
                                                        </span>)}
                                                    {translateWord.word}
                                                </span>
                                            )
                                        }
                                    </span>

                                )
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl p-2 sm:p-8 shadow-inner">
                                {allQuestion.map((q, qIndex: number) => (
                                    <div className='flex flex-col   gap-4 mt-6'>
                                        <h2 className='text-gray-800 font-medium mr-2'>همکار گرامی شما می توانید از این بخش اقدام به طراحی سوال آموزشی مرتبط با محتوا جهت پرسش از دانش آموزان خود کنید.</h2>
                                        <div className="bg-green-500 my-2 group  hover:bg-gradient-to-br hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-colors duration-500 w-full rounded-2xl items-center p-2">

                                            <h2 className="items-center transition-all duration-200 group-hover:scale-110 group-hover:rotate-6 flex justify-center pr-4 text-white font-bold  ">   سوال {qIndex + 1}</h2>
                                        </div>

                                        <div className='flex flex-col '>
                                            <label htmlFor="">متن سوال را وارد کنید</label>
                                            <Input value={allQuestion[qIndex].text} onChange={(e) => handleQTextChange(e.target.value, qIndex)} placeholder='متن سوال ...' type="text" className="w-52 sm:w-56 md:w-96 lg:w-[28rem] p-4 mt-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                        </div>
                                        <div className='flex flex-col '>
                                            <label htmlFor="">گزینه های سوال رو وارد کرده و گزینه درست مدنظر را انتخاب کنید.</label>
                                            {allQuestion[qIndex].options.map((opt, i) => (
                                                <div key={i} className="flex flex-row mt-2">
                                                    <Input
                                                        placeholder={`گزینه ${i + 1}`}
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleOptionsChange(e.target.value, qIndex, i)}
                                                        className="w-24 sm:w-40 md:w-52 lg:w-64  p-4 ml-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    />

                                                    {allQuestion[qIndex].options.length !== 1 && (
                                                        <button
                                                            className="bg-red-100 ml-2 text-red-500 md:p-2 p-0.5 mx-1  rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center"
                                                            onClick={() => handleDeleteOptInput(qIndex, i)}
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
                                                            className={`flex text-sm items-center justify-center mx-2 md:p-2 p-0.5  text-emerald-600 border border-emerald-200 rounded-lg hover:bg-green-400 ${correctAnswer[qIndex].index === i ? 'bg-green-500 text-white' : 'bg-slate-200'}  hover:text-white hover:border-emerald-600 transition-all duration-200 shadow-sm`}
                                                        >
                                                            گزینه درست
                                                        </button>
                                                    }
                                                </div>
                                            ))}


                                        </div>

                                        <div>
                                            <h2 className='font-medium  text-gray-800 '>زمان اجرای سوال برای دانش آموز را انتخاب کنید</h2>
                                            <button onClick={() => handlerTypeImplementQ(qIndex, 'endContent')}
                                                className={` flex border-1 my-3 border-green-500 ${allQuestion[qIndex].wordsIndexPlayQuestion === null ? ' scale-105 border-b-4 bg-purple-500' : 'bg-purple-400'} hover:bg-purple-500 hover:border-2 active:scale-95 transition-all duration-75  rounded-xl text-white mx-2 p-0.5 md:p-2 mt-4 shadow-md `}
                                            >بعد از پخش کامل درس سوال پرسیده می شود  {allQuestion[qIndex].wordsIndexPlayQuestion === null && <p className='mt-2 mr-1'>✅ </p>}  </button>

                                            <button onClick={() => handlerTypeImplementQ(qIndex, 'duringContent')}
                                                className={`  flex  border-1 border-green-500 ${typeof allQuestion?.[qIndex]?.wordsIndexPlayQuestion === 'string' ? ' scale-105 border-b-4 bg-purple-500' : 'bg-purple-400'}  hover:bg-purple-500 hover:border-2 active:scale-95 transition-all duration-75  text-white mx-2 rounded-xl p-1 md:p-2 shadow-md `}
                                            >انتخاب مکان پخش سوال برای دانش آموز  {typeof allQuestion?.[qIndex]?.wordsIndexPlayQuestion === 'string' && <p className='mt-2 mr-1'>✅</p>}</button>

                                        </div>
                                        <div>
                                            {typeof allQuestion?.[qIndex]?.wordsIndexPlayQuestion === 'string' && (
                                                <WordSelectorModal
                                                    words={words}
                                                    qIndex={qIndex}
                                                    currentValue={allQuestion[qIndex].wordsIndexPlayQuestion}
                                                    onSelect={(selectedIndex) => {
                                                        setAllQuestion(prev => {
                                                            const newQ = [...prev];
                                                            newQ[qIndex].wordsIndexPlayQuestion = String(selectedIndex);
                                                            return newQ;
                                                        });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className='flex flex-col md:flex-row'>
                                    <div className='flex flex-row'>
                                        <button
                                            onClick={() => handleAddQuestion()}
                                            className='flex items-center justify-center gap-1 bg-green-400 hover:bg-green-500 border-2 border-green-600 shadow-md text-white rounded-xl mt-10 p-0.5 md:p-2  '>اضافه کردن سوال
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>

                                        </button>
                                        <button
                                            onClick={() => handleRemoveQuestion()}
                                            className='flex items-center justify-center gap-1 bg-red-300 hover:bg-red-400 border-2 border-orange-600 shadow-md mx-4 text-white rounded-xl mt-10 p-0.5 md:p-2 '>حذف کردن سوال
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-700 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>

                                        </button>

                                    </div>
                                    <button
                                        onClick={() => sendQuestionToDatabase()}
                                        className="flex items-center mt-10 justify-center gap-1 md:px-1 h-12 md:py-0.5 p-0.5 bg-slate-800 text-slate-50  rounded-xl hover:bg-slate-700 active:scale-95 transition-all duration-200 shadow-lg shadow-slate-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        ذخیره و ارسال سوال
                                    </button>


                                </div>

                            </div>

                            {/* اطلاعات اضافی */}
                            <div className="grid  gap-4 pt-6 border-t border-gray-200 dark:border-gray-600 ">


                                {/* پخش کننده صوت */}
                                {/* {audioUrl && (
                                    <div className="mb-8 p-5 bg-gradient-to-r w-full  from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-600 rounded-xl shadow-inner">
                                        <div className="flex items-center gap-3 mb-3 rtl">
                                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">پخش کننده</h3>
                                        </div> */}
                                        {/* <AudioPlayer ref={audioRef} audioSrc={audioUrl} /> */}
                                        {/* <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full rounded-lg"
              >
                مرورگر شما از پخش صوت پشتیبانی نمی‌کند
              </audio> */}
                                    {/* </div>
                                )} */}

                            </div>
                        </div>
                    )}

                    {/* راهنما */}
                    {!words.length && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 border-l-4 border-blue-500 rounded-xl">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">راهنما:</h3>
                                    <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
                                        {/* <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                            صدا را پخش کنید تا کلمات به صورت زنده هایلایت شوند
                                        </li> */}
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                            روی هر کلمه کلیک کنید تا به آن قسمت بروید
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
}

export default function ListeningPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Listening />
        </Suspense>
    )
}