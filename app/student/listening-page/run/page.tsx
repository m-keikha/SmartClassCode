// این کدها مناسب زمانیست که ترنسکریپت توسط 
//whisper-1 open Ai 
// انجام شده باشد

'use client'
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import AudioPlayer from '@/components/MusicPlayer'
import { addStudentResponse, getListeningById, getQuestionsListeningByListeningId } from '@/app/actions';

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
    explanationAnswer?: string;
    options: string[];
    wordsIndexPlayQuestion: null | string;
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
        transcription?: TranscriptionResponse;
    };
    vipListeningVoice?: AudioType;
    question: IQuestion[];
    createdAt: string;
    updatedAt: string;
}

interface WordTimestamp {
    word: string;
    start: number;
    end: number;
}

interface Translate {
    word: string;
    phrasalWerb?: string;
    translatePharseWerb?: string;
    index: number;
}

interface QuestionResult {
    questionIndex: number;
    selectedOption: string;
    isCorrect: boolean;
}

// ─── مودال سوال ──────────────────────────────────────────────────────────────
function QuestionModal({
    question,
    questionNumber,
    totalQuestions,
    isPinned = false,
    onAnswer,
}: {
    question: IQuestion;
    questionNumber: number;
    totalQuestions: number;
    isPinned?: boolean;
    onAnswer: (selected: string, isCorrect: boolean) => void;
}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);

    const searchParams = useSearchParams();
    const myId = searchParams.get('id');

    const handlerPostUserAnswer = async (userResponse: string, correctAnswer: string, textQuestion: string, isCorrect: boolean) => {

        const userAnswerData = {
            listeningId: myId,
            userResponse,
            correctAnswer,
            textQuestion,
            isCorrect,
        }
        const sid = localStorage.getItem('student_id');

        const result = await addStudentResponse({...userAnswerData}, sid, myId)
        // if (result.success) {
        //     alert('ذخیره شد')
        //     console.log(result.result)
        // }





    }


    // reset وقتی سوال عوض میشه
    useEffect(() => {
        setSelected(null);
        setAnswered(false);
    }, [question]);

    const handleSelect = async (opt: string) => {
        if (answered) return;
        const isCorrect = opt === question.answer;
        setSelected(opt);
        setAnswered(true);

        await handlerPostUserAnswer(opt, question.answer, question.text, isCorrect)



        setTimeout(() => onAnswer(opt, isCorrect), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${isPinned ? 'bg-purple-500' : 'bg-indigo-500'}`}>
                            {questionNumber}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">سوال {questionNumber} از {totalQuestions}</p>
                            <p className="text-xs font-medium text-indigo-500">
                                {isPinned ? '📋 سوال پایانی' : '⏸ پخش متوقف شد'}
                            </p>
                        </div>
                    </div>
                    {!isPinned && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                            بعد از پاسخ ادامه می‌یابد
                        </span>
                    )}
                </div>

                <p className="text-gray-800 dark:text-gray-200 font-medium text-base leading-relaxed mb-5">
                    {question.text}
                </p>

                <div className="flex flex-col gap-2.5">
                    {question.options.map((opt, i) => {
                        let cls = 'w-full text-right px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-300 flex items-center gap-3 ';
                        if (!answered) {
                            cls += 'border-gray-200 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 cursor-pointer';
                        } else if (opt === question.answer) {
                            cls += 'border-green-500 bg-green-50 text-green-800 scale-[1.01]';
                        } else if (opt === selected) {
                            cls += 'border-red-500 bg-red-50 text-red-800';
                        } else {
                            cls += 'border-gray-100 bg-gray-50 text-gray-400 dark:bg-slate-700 dark:border-slate-600';
                        }
                        return (
                            <button key={i} className={cls} onClick={() => handleSelect(opt)}>
                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                                    ${!answered ? 'border-gray-300 text-gray-400' :
                                        opt === question.answer ? 'border-green-500 bg-green-500 text-white' :
                                            opt === selected ? 'border-red-500 bg-red-500 text-white' :
                                                'border-gray-200 text-gray-300'}`}>
                                    {answered && opt === question.answer ? '✓' :
                                        answered && opt === selected ? '✗' :
                                            String.fromCharCode(65 + i)}
                                </span>
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {answered && (
                    <div className={`mt-4 p-4 rounded-xl text-center transition-all duration-500 ${selected === question.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                        <p className={`font-bold text-base mb-1 ${selected === question.answer ? 'text-green-700' : 'text-red-700'}`}>
                            {selected === question.answer ? '✅ پاسخ شما درست بود!' : '❌ پاسخ شما اشتباه بود'}
                        </p>
                        {selected !== question.answer && (
                            <p className="text-sm text-gray-600">
                                پاسخ صحیح: <span className="font-semibold text-green-700">{question.answer}</span>
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                            {isPinned ? 'سوال بعدی...' : 'پخش ادامه می‌یابد...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── خلاصه نتایج ─────────────────────────────────────────────────────────────
function ResultSummary({ results, questions }: { results: QuestionResult[]; questions: IQuestion[] }) {
    const correct = results.filter((r) => r.isCorrect).length;
    const percent = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    return (
        <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-inner border border-indigo-100 dark:border-slate-500">
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200 mb-2">📊 نتیجه نهایی</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-indigo-600">{correct}</span>
                <span className="text-2xl text-gray-400">/</span>
                <span className="text-2xl font-semibold text-gray-500">{results.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                    className={`h-3 rounded-full transition-all duration-1000 ${percent >= 70 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">{percent}% پاسخ صحیح</p>
            <div className="flex flex-wrap gap-2 justify-center">
                {results.map((r, i) => (
                    <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${r.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span>{r.isCorrect ? '✓' : '✗'}</span>
                        <span>سوال {i + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── کامپوننت اصلی ───────────────────────────────────────────────────────────
export function Listening() {
    const params = useParams();
    const { id } = params;
    const translateRef = useRef<HTMLSpanElement>(null);
    const searchParams = useSearchParams();
    const myId = searchParams.get('id');

    const [audioUrl, setAudioUrl] = useState<string>('');
    const [words, setWords] = useState<WordTimestamp[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [translateWord, setTranslateWord] = useState<Translate>({ word: '', index: -2 });
    const [error, setError] = useState('');
    const [listeningData, setListeningData] = useState<IListeningData | null>(null);
    const [questions, setQuestions] = useState<IQuestion[]>([]);

    const [activeQuestion, setActiveQuestion] = useState<{ q: IQuestion; num: number; isPinned: boolean } | null>(null);

    // ── refs برای دسترسی در closure بدون stale state ──
    const activeQuestionRef = useRef<{ q: IQuestion; num: number; isPinned: boolean } | null>(null);
    const questionsRef = useRef<IQuestion[]>([]);
    const askedQuestionsRef = useRef<Set<string>>(new Set());
    const endQuestionsShownRef = useRef(false);
    const endQueueIndexRef = useRef(0);
    const endQuestionsRef = useRef<IQuestion[]>([]);
    const allResultsRef = useRef<QuestionResult[]>([]);

    const [allResults, setAllResults] = useState<QuestionResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    // sync refs با state
    useEffect(() => { activeQuestionRef.current = activeQuestion; }, [activeQuestion]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { allResultsRef.current = allResults; }, [allResults]);

    useEffect(() => {
        const sid = localStorage.getItem('student_id');
        if (!sid) window.location.href = '/';
    }, []);

    // ─── بارگذاری صدا ────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const listening = await getListeningById(myId);
                if (!listening) return;
                setListeningData(listening);
                const voiceData = listening.vipListeningVoice?.data;
                const voiceType = listening.vipListeningVoice?.contentType;
                if (voiceData) {
                    const binary = window.atob(voiceData);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    const blob = new Blob([bytes], { type: voiceType });
                    setAudioUrl(URL.createObjectURL(blob));
                }
            } catch {
                setError('خطا در بارگذاری فایل صوتی');
            }
        }
        load();
    }, [id]);

    // ─── transcribe ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!audioUrl || isLoading) return;
        handleTranscribe();
    }, [audioUrl]);

    const handleTranscribe = async () => {
        if (!listeningData?.vipListeningVoice?.data) { setError('فایل صوتی موجود نیست'); return; }
        setIsLoading(true);
        try {
            const res = listeningData.vipListening?.transcription as TranscriptionResponse;
            if (!res?.success) throw new Error('خطا در دریافت نتیجه');
            setWords(res.words);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'خطای نامشخص');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── دریافت سوالات ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetchQ = async () => {
            const sid = localStorage.getItem('student_id');

            const res = await getQuestionsListeningByListeningId(myId, sid);
            if (res.success) {
                setQuestions(res.data);
                questionsRef.current = res.data;
            }
        };
        fetchQ();
    }, []);

    // ─── نمایش سوال پایانی ───────────────────────────────────────────────────
    const triggerEndQuestion = (idx: number) => {
        const qList = endQuestionsRef.current;
        if (idx >= qList.length) {
            setActiveQuestion(null);
            activeQuestionRef.current = null;
            setShowResults(true);
            return;
        }
        const duringCount = questionsRef.current.filter(
            (q) => q.wordsIndexPlayQuestion !== null && q.wordsIndexPlayQuestion !== ''
        ).length;
        const newQ = { q: qList[idx], num: duringCount + idx + 1, isPinned: true };
        setActiveQuestion(newQ);
        activeQuestionRef.current = newQ;
    };

    // ─── پاسخ دانش‌آموز ──────────────────────────────────────────────────────
    const handleAnswer = (selected: string, isCorrect: boolean) => {
        const newResult = { questionIndex: allResultsRef.current.length, selectedOption: selected, isCorrect };
        const updated = [...allResultsRef.current, newResult];
        allResultsRef.current = updated;
        setAllResults(updated);

        const wasPinned = activeQuestionRef.current?.isPinned;
        setActiveQuestion(null);
        activeQuestionRef.current = null;

        if (wasPinned) {
            const nextIdx = endQueueIndexRef.current + 1;
            endQueueIndexRef.current = nextIdx;
            setTimeout(() => triggerEndQuestion(nextIdx), 150);
        } else {
            setTimeout(() => audioRef.current?.play(), 300);
        }
    };

    // ─── event listeners صوتی (فقط یکبار mount) ────────────────────────────
    useEffect(() => {

        const audio = audioRef.current;
        if (!audio || words.length === 0) return;


        const handleTimeUpdate = () => {

            // اگر سوال فعالی هست، کاری نکن
            if (activeQuestionRef.current) return;

            const ct = audio.currentTime;
            const qs = questionsRef.current;
            if (!qs.length) return;

            // هایلایت کلمه جاری (words از closure گرفته میشه - باید از ref بگیریم)
            // برای words از state استفاده می‌کنیم چون در useEffect دیگه‌ای handle میشه

            // بررسی تریگر سوالات حین پخش
            const duringQs = qs.filter(
                (q) => q.wordsIndexPlayQuestion !== null && q.wordsIndexPlayQuestion !== ''
            );


            for (let qi = 0; qi < duringQs.length; qi++) {
                const q = duringQs[qi];
                // console.log(q)
                const triggerTime = parseFloat(q.wordsIndexPlayQuestion as string);
                // console.log(triggerTime ,' triggerTime ')
                const key = `during_${qi}`;

                // triggerTime = ایندکس کلمه، باید time کلمه را بگیریم
                // چون words در این closure نیست، از currentTime مستقیم استفاده نمیکنیم
                // بجاش wordsIndexPlayQuestion رو به عنوان ایندکس کلمه نگه می‌داریم
                // و از wordsRef استفاده می‌کنیم
                // 
                if (!isNaN(triggerTime) && !askedQuestionsRef.current.has(key)) {
                    console.log('شرط فعالسازی سوال')
                    const triggerWordTime = wordsRef.current[triggerTime]?.start;
                    if (triggerWordTime !== undefined && ct >= triggerWordTime) {
                        askedQuestionsRef.current.add(key);
                        audio.pause();
                        const newQ = { q, num: qi + 1, isPinned: false };
                        setActiveQuestion(newQ);
                        activeQuestionRef.current = newQ;
                        break;
                    }
                }
            }
        };

        const handleEnded = () => {
            if (endQuestionsShownRef.current) return;
            const qs = questionsRef.current;
            const endQs = qs.filter((q) => q.wordsIndexPlayQuestion === null);
            if (endQs.length > 0) {
                endQuestionsShownRef.current = true;
                endQuestionsRef.current = endQs;
                endQueueIndexRef.current = 0;
                triggerEndQuestion(0);
            } else {
                setShowResults(true);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [words]); // ← فقط یکبار، چون از refs استفاده می‌کنیم

    // ─── هایلایت کلمه (جداگانه چون به words نیاز داره) ─────────────────────
    const wordsRef = useRef<WordTimestamp[]>([]);
    useEffect(() => {
        wordsRef.current = words;
    }, [words]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || words.length === 0) return;

        const handleHighlight = () => {
            const ct = audio.currentTime;
            const idx = words.findIndex((w) => ct >= w.start && ct <= w.end);
            setCurrentWordIndex(idx);
        };

        audio.addEventListener('timeupdate', handleHighlight);
        return () => audio.removeEventListener('timeupdate', handleHighlight);
    }, [words]);

    const handleWordClick = (index: number) => {
        if (audioRef.current && words[index]) {
            audioRef.current.currentTime = words[index].start;
            audioRef.current.play();
        }
    };

    useEffect(() => {
        const handleOut = (e: MouseEvent) => {
            if (translateRef.current && !translateRef.current.contains(e.target as Node))
                setTranslateWord({ word: '', index: -1 });
        };
        if (translateWord.word) document.addEventListener('mousedown', handleOut);
        return () => document.removeEventListener('mousedown', handleOut);
    }, [translateWord]);

    const totalQ = questions.length;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">

            {/* ── نوار شناور ── */}
            {audioUrl && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-lg">
                    <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-1">
                                🎧 {listeningData?.title || '...'}
                            </p>
                            <AudioPlayer ref={audioRef} audioSrc={audioUrl} />
                        </div>
                        {questions.length > 0 && (
                            <div className="flex-shrink-0 text-center bg-indigo-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl">
                                <p className="text-xs text-gray-400">سوالات</p>
                                <p className="text-sm font-bold text-indigo-600">{allResults.length}/{totalQ}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {audioUrl && <div className="h-20" />}

            {/* ── مودال سوال ── */}
            {activeQuestion && (
                <QuestionModal
                    question={activeQuestion.q}
                    questionNumber={activeQuestion.num}
                    totalQuestions={totalQ}
                    isPinned={activeQuestion.isPinned}
                    onAnswer={handleAnswer}
                />
            )}

            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-3">
                            تحلیل صوتی پیشرفته
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {listeningData?.title || 'در حال بارگذاری...'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {words.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl p-6 shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">خوانداری</h2>
                            </div>

                            {questions.some(q => q.wordsIndexPlayQuestion !== null && q.wordsIndexPlayQuestion !== '') && (
                                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block flex-shrink-0" />
                                    کلماتی که نقطه آبی دارند، محل پرسش سوال هستند
                                </div>
                            )}

                            <div className="text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-6">
                                {words.map((wordObj, index) => {
                                    const isQuestionTrigger = questions.some(
                                        (q) =>
                                            q.wordsIndexPlayQuestion !== null &&
                                            q.wordsIndexPlayQuestion !== '' &&
                                            parseInt(q.wordsIndexPlayQuestion) === index
                                    );
                                    return (
                                        <span
                                            key={index}
                                            onClick={() => handleWordClick(index)}
                                            className={`inline-block relative px-2 py-1 mx-0.5 my-0.5 rounded-lg cursor-pointer transition-all duration-200 select-none
                                                ${currentWordIndex === index
                                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold scale-110 shadow-lg ring-2 ring-yellow-300'
                                                    : 'hover:bg-purple-100 dark:hover:bg-slate-600 hover:scale-105'}
                                            `}
                                        >
                                            {wordObj.word}
                                            {isQuestionTrigger && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full ring-1 ring-white" />
                                            )}
                                            {translateWord.index === index && (
                                                <span ref={translateRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-green-600 text-white text-sm rounded-md py-2 px-3 shadow-lg z-10">
                                                    {translateWord.word}
                                                </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>

                            {showResults && allResults.length > 0 && (
                                <ResultSummary results={allResults} questions={questions} />
                            )}
                        </div>
                    )}

                    {!words.length && !isLoading && (
                        <div className="mt-8 p-6 bg-blue-50 dark:bg-slate-700 border-l-4 border-blue-500 rounded-xl">
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                روی هر کلمه کلیک کنید تا پخش از آن نقطه شروع شود.
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ListeningPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <Listening />
        </Suspense>
    );
}