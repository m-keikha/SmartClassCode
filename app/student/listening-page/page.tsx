'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getListeningTitlesByLevel } from '../../actions';
import { Headphones, ChevronLeft, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// تعریف تایپ برای دیتا
interface ListeningItem {
    _id: string;
    title: string;
}

function ListeningContent() {
    const searchParams = useSearchParams();
    const level = searchParams.get('level');
    const router = useRouter()

    const [data, setData] = useState<ListeningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!level) {
                setError('سطح انتخاب نشده است');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await getListeningTitlesByLevel(level);
                console.log('Result:', result);

                // بررسی اینکه result آرایه باشه
                if (Array.isArray(result.data)) {
                    setData(result.data);
                } else {
                    setError('فرمت داده دریافتی نامعتبر است');
                    setData([]);
                }
            } catch (error) {
                console.error("خطا در دریافت اطلاعات:", error);
                setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [level]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 dir-rtl text-right" dir="rtl">
            <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <Headphones className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">تمرینات شنیداری</h1>
                        <p className="text-gray-500 text-sm">
                            سطح انتخاب شده: {level || 'انتخاب نشده'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                        <p className="text-gray-500">در حال بارگذاری درس‌ها...</p>
                    </div>
                ) : data.length > 0 ? (
                    // نمایش لیست
                    <div className="grid gap-4">
                        {data.map((item) => (
                            <div
                                key={item._id}
                                className="group flex items-center justify-between bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                onClick={
                                    () => router.push(`/student/listening-page/run?id=${item.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-50 group-hover:bg-blue-50 p-3 rounded-full transition-colors">
                                        <BookOpen className="text-gray-400 group-hover:text-blue-500" size={20} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-700 group-hover:text-blue-700">
                                        {item.title}
                                    </span>
                                </div>
                                <ChevronLeft className="text-gray-300 group-hover:text-blue-500 transform group-hover:-translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                ) : (
                    // حالت خالی
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-400">محتوایی برای این سطح یافت نشد.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ListeningPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
        }>
            <ListeningContent />
        </Suspense>
    );
}