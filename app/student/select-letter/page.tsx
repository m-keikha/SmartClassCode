'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAlphabetsList } from '@/app/actions'; 
import { ChevronLeft, BookOpen, Loader2, AlertCircle, Type } from 'lucide-react';


interface AlphabetItem {
    _id: string;
    letterGroup: string;
}

export default function AlphabetListPage() {
    const router = useRouter();

    const [data, setData] = useState<AlphabetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await getAlphabetsList();
                console.log('Result:', result);

                if (result.success && Array.isArray(result.data)) {
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
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6 dir-rtl text-right" dir="rtl">

            <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <Type className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">آموزش حروف الفبا</h1>
                        <p className="text-gray-500 text-sm">
                            لیست حروفی که در سیستم ثبت شده است
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
                        <p className="text-gray-500">در حال بارگذاری حروف الفبا...</p>
                    </div>
                ) : data.length > 0 ? (

                    <div className="grid gap-4">
                        {data.map((item) => (
                            <div
                                key={item._id}
                                className="group flex items-center justify-between bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => router.push(`/student/select-letter/letter-view?id=${item._id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-50 group-hover:bg-blue-50 p-3 rounded-full transition-colors">
                                        <BookOpen className="text-gray-400 group-hover:text-blue-500" size={20} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-700 group-hover:text-blue-700">
                                        حرف « {item.letterGroup} »
                                    </span>
                                </div>
                                <ChevronLeft className="text-gray-300 group-hover:text-blue-500 transform group-hover:-translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                ) : (

                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-400">هنوز هیچ حرفی در سیستم ثبت نشده است.</p>
                    </div>
                )}
            </main>
        </div>
    );
}