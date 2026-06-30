'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LogOut, Trophy, TrendingUp, BrainCircuit, Calendar, FileText, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { getStudentData, Level } from '../actions';
import { Student, Course, Grade, Attendance, Homework, AIReport } from '@/types';

export default function StudentDashboard() {
    const router = useRouter();
    const [data, setData] = useState<{
        student: Student;
        courses: Course[];
        grades: Grade[];
        attendance: Attendance[];
        homeworks: Homework[];
        report?: AIReport;
    } | null>(null);

    useEffect(() => {
        const sId = localStorage.getItem('student_id');
        if (!sId) {
            router.push('/');
            return;
        }
        getStudentData(sId).then((res) => setData(res as any));

    }, []);
    

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('user_role');
        router.push('/');
    };

    if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">در حال بارگذاری پنل دانش‌آموز...</div>;

    const average = data.grades.length > 0
        ? (data.grades.reduce((a, b) => a + b.score, 0) / data.grades.length).toFixed(2)
        : 0;

    const chartData = data.grades.map(g => ({
        name: data.courses.find(c => c._id === g.courseId)?.name || '?',
        score: g.score
    }));

    const getCourseAverage = (courseId: string) => {
        const sGrades = data.grades.filter(g => g.courseId === courseId);
        if (sGrades.length === 0) return '-';
        const sum = sGrades.reduce((a, b) => a + b.score, 0);
        return (sum / sGrades.length).toFixed(2);
    };


    const farsiDirectHander = (level: Level) => {

        router.push(`/student/listening-page?level=${level}`)

    }



    const levels = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"]




    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-emerald-600 text-white p-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg"><Trophy className="w-6 h-6" /></div>
                    <div>
                        <h1 className="text-lg font-bold">پنل دانش‌آموز</h1>
                        <span className="text-emerald-100 text-xs">سال تحصیلی 1405-1404</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="font-bold">{data.student.firstName} {data.student.lastName}</p>
                        <p className="text-emerald-200 text-xs">کد ملی: {data.student.nationalId}</p>
                    </div>
                    <button onClick={handleLogout} className="bg-emerald-700 hover:bg-emerald-800 p-2 rounded-lg transition-colors" title="خروج"><LogOut className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8">

                {/* Homework Section (Top Priority) */}
                {data.homeworks.length > 0 ? (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-purple-900 flex items-center mb-4 text-lg">
                            <FileText className="w-6 h-6 ml-2 text-purple-600" /> تکالیف فعال
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.homeworks.map(hw => (
                                <div key={hw._id} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-800 text-lg">{hw.title}</span>
                                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">تحویل: {hw.dueDate}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{hw.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center text-green-700 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> هیچ تکلیف جدیدی ندارید!
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-emerald-200 transition">
                        <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><TrendingUp className="w-8 h-8" /></div>
                        <div><p className="text-gray-400 text-sm mb-1">معدل کل</p><p className="text-4xl font-bold text-gray-800">{average}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-red-200 transition">
                        <div className="bg-red-100 p-4 rounded-2xl text-red-600"><Calendar className="w-8 h-8" /></div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">تعداد غیبت‌ها</p>
                            <p className="text-4xl font-bold text-gray-800">{data.attendance.filter(a => a.status === 'absent').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-blue-200 transition">
                        <div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><CheckCircle className="w-8 h-8" /></div>
                        <div><p className="text-gray-400 text-sm mb-1">تعداد نمرات ثبت شده</p><p className="text-4xl font-bold text-gray-800">{data.grades.length}</p></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Grades Chart */}
                    <div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[450px]">
                            <h3 className="font-bold text-gray-700 mb-6 border-b border-gray-50 pb-4">نمودار پیشرفت تحصیلی</h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fill: '#888' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis domain={[0, 20]} hide />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={50}>
                                        {chartData.map((e, i) => <Cell key={i} fill={e.score >= 15 ? '#10b981' : e.score >= 10 ? '#f59e0b' : '#ef4444'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>


                        <div className="bg-white p-5 w-full mt-6 rounded-3xl shadow-sm border border-gray-100 h-auto min-h-[150px]">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                                <BookOpen className="w-6 h-6 ml-2 text-blue-500" />
                                تمرین خوانداری فارسی
                            </h3>

                            {/* کانتینر دکمه‌ها با استایل گرید */}
                            <div className="grid grid-cols-3 gap-3">
                                {levels.map((level: Level, i) => (
                                    <button
                                        onClick={() => farsiDirectHander(level)}
                                        key={i}
                                        className="py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
                           bg-blue-50 text-blue-700 border border-blue-100
                           hover:bg-blue-500 hover:text-white hover:shadow-md 
                           active:scale-95 text-center"
                                    >
                                        پایه {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* AI Report */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[280px]">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center"><BrainCircuit className="ml-2 text-indigo-600" /> تحلیل هوشمند عملکرد</h3>
                            <div className="flex-1 bg-indigo-50/50 rounded-2xl p-5 leading-relaxed text-sm text-gray-700 overflow-y-auto custom-scrollbar">
                                {data.report ? (
                                    <p className="whitespace-pre-line">{data.report.content}</p>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <BrainCircuit className="w-10 h-10 mb-2 opacity-20" />
                                        <p>هنوز تحلیلی ثبت نشده است.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance List */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[150px] overflow-hidden">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center"><AlertCircle className="w-4 h-4 ml-2 text-red-500" /> لیست غیبت‌ها</h3>
                            <div className="flex flex-wrap gap-2 overflow-y-auto h-full pb-4">
                                {data.attendance.length === 0 && <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">بدون غیبت! عالیه.</span>}
                                {data.attendance.map(a => (
                                    <span key={a._id} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-xl text-sm font-medium">{a.date}</span>
                                ))}
                            </div>
                        </div>



                    </div>
                </div>

                {/* Detailed Grades Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gray-50/50 font-bold text-gray-800 border-b border-gray-100">کارنامه تفصیلی</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                    <th className="p-4 text-right">نام درس</th>
                                    <th className="p-4 text-center">نمره اخذ شده</th>
                                    <th className="p-4 text-center">میانگین آن درس</th>
                                    <th className="p-4 text-right">تاریخ</th>
                                    <th className="p-4 text-right">توضیحات معلم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.grades.map(g => (
                                    <tr key={g._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                                        <td className="p-4 font-bold text-gray-700">{data.courses.find(c => c._id === g.courseId)?.name}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-4 py-1.5 rounded-full font-bold ${g.score >= 17 ? 'bg-green-100 text-green-700' : g.score >= 12 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {g.score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-gray-500 font-mono">{getCourseAverage(g.courseId)}</td>
                                        <td className="p-4 text-gray-500">{g.date}</td>
                                        <td className="p-4 text-gray-500 italic max-w-xs truncate">{g.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}