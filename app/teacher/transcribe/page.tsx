'use client';

import { useState, useRef, ReactNode, useEffect } from 'react';
import { Mic, Square, Clipboard, ClipboardCheck, Loader2, Play } from 'lucide-react';
import { teacherAccess } from '@/app/actions';

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

const ActionButton = ({ onClick, children, variant = 'primary', disabled = false, className = '', icon }: ActionButtonProps) => {
  const baseStyles = "inline-flex items-center gap-2.5 justify-center font-bold transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizeStyles = "px-7 py-3 text-lg";
  
  const variantStyles = {
    primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
    ghost: `bg-transparent text-blue-700 hover:bg-blue-50 focus:ring-blue-300`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}
    >
      {icon && icon}
      {children}
    </button>
  );
};

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToAPI(audioBlob);
        // خاموش کردن میکروفون بعد از ضبط
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(null);
      setCopied(false);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("لطفاً دسترسی میکروفون را تایید کنید.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };


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
  

  const sendAudioToAPI = async (audioBlob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/gemini_transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setTranscript(data.transcript);
      } else {
        alert(data.error || "مشکلی پیش آمد.");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("خطا در ارتباط با سرور.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  return (
    <div className="min-h-screen bg-[url('/nature.jpg')] bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
        
        <div className="flex flex-col items-center mb-10 gap-3 border-b border-gray-100 pb-8">
          <div className="p-4 bg-blue-100 rounded-full shadow-inner border-4 border-white">
            <Mic className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            تبدیل صدا به متن
          </h1>
          <p className="text-gray-600 text-base max-w-sm mt-1">
تبدیل صدا به متن با هوش مصنوعی           </p>
        </div>

        <div className="flex flex-col items-center gap-8 mb-10">
          {!isRecording ? (
            <div className='flex flex-col items-center gap-6'>
                <p className='text-gray-700 text-xl font-bold flex items-center gap-3'>
                    <Play className="w-5 h-5 text-blue-600" />
                    برای شروع صحبت کردن کلیک کنید
                </p>
                <ActionButton 
                    onClick={startRecording}
                    disabled={isLoading}
                    variant="primary"
                    icon={<Mic className="w-6 h-6" />}
                >
                  شروع ضبط🎙️
                </ActionButton>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-6'>
                <p className='text-gray-700 text-xl font-bold'>🎙️ در حال ضبط صدای شما...</p>
                <ActionButton 
                    onClick={stopRecording}
                    variant="danger"
                    className="relative group border-4 border-white shadow-lg shadow-red-100 animate-pulse"
                    icon={<Square className="w-6 h-6" />}
                >
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 group-hover:opacity-100"></div>
                  توقف و ارسال ⏹️
                </ActionButton>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 justify-center text-blue-600 font-bold mb-10 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-inner">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className='text-lg'>در حال پردازش هستم صبور باش :))</p>
          </div>
        )}

        {transcript && (
          <div className="bg-gray-50 p-6 rounded-2xl text-right border border-gray-100 shadow-inner">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Clipboard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">رونوشت نهایی:</h3>
                </div>
              <ActionButton onClick={copyToClipboard} variant="ghost" className="text-sm px-4 py-1.5 gap-1.5">
                {copied ? (
                  <>
                    <ClipboardCheck className="w-5 h-5" />
                    کپی شد
                  </>
                ) : (
                  <>
                    <Clipboard className="w-5 h-5" />
                    کپی در کلیپ‌بورد
                  </>
                )}
              </ActionButton>
            </div>
            
            <textarea 
              value={transcript}
              readOnly
              className="w-full h-40 bg-white border border-gray-200 rounded-xl p-4 text-gray-800 text-lg leading-relaxed dir-rtl focus:ring-2 focus:ring-blue-100 focus:border-blue-200 resize-none"
              placeholder="رونوشت اینجا ظاهر می‌شود..."
            />
          </div>
        )}
      </div>
    </div>
  );
}