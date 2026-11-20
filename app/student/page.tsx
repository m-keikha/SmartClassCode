'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import {
    LogOut,
    Trophy,
    TrendingUp,
    TrendingDown,
    BrainCircuit,
    Calendar,
    FileText,
    CheckCircle,
    AlertCircle,
    BookOpen,
    ArrowRight,
    MousePointerClick,
    BarChart3,
    Activity,
} from 'lucide-react';
import { getStudentData, Level } from '../actions';
import { Student, Course, Grade, Attendance, Homework, AIReport } from '@/types';

// تابع کمکی برای رنگ‌بندی یکپارچه نمرات در کل نمودار
const getScoreColor = (score: number) => {
    if (score >= 17) return '#10b981'; // سبز (عالی)
    if (score >= 12) return '#f59e0b'; // نارنجی (متوسط)
    return '#ef4444'; // قرمز (نیاز به تلاش بیشتر)
};

// تولتیپ اختصاصی برای نمودار ستونی (میانگین دروس)
const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
        <div
            dir="rtl"
            className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-gray-100 text-right min-w-[170px]"
        >
            <p className="font-bold text-gray-800 mb-2 text-sm">{item.name}</p>
            <div className="flex items-center justify-between gap-4 text-xs mb-1">
                <span className="text-gray-500">میانگین نمره:</span>
                <span
                    className="font-bold text-sm"
                    style={{ color: getScoreColor(item.average) }}
                >
                    {item.average} از ۲۰
                </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs mb-2">
                <span className="text-gray-500">تعداد نمرات:</span>
                <span className="font-medium text-gray-700">{item.count} مورد</span>
            </div>
            <p className="text-[11px] text-emerald-600 border-t border-gray-100 pt-1.5 flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                برای مشاهده روند کلیک کنید
            </p>
        </div>
    );
};

// تولتیپ اختصاصی برای نمودار خطی (روند نمرات یک درس در زمان)
const CustomLineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
        <div
            dir="rtl"
            className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-gray-100 text-right max-w-[230px]"
        >
            <p className="text-xs text-gray-400 mb-1">{item.date}</p>
            <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-600">نمره کسب‌شده:</span>
                <span
                    className="font-bold text-base"
                    style={{ color: getScoreColor(item.score) }}
                >
                    {item.score} <span className="text-xs font-normal text-gray-400">/ ۲۰</span>
                </span>
            </div>
            {item.description && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-2 leading-relaxed">
                    {item.description}
                </p>
            )}
        </div>
    );
};

// نقطه سفارشی روی نمودار خطی با رنگ متناسب با هر نمره
const renderCustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (cx == null || cy == null) return <g key={index} />;
    return (
        <circle
            key={payload.id || index}
            cx={cx}
            cy={cy}
            r={5.5}
            fill={getScoreColor(payload.score)}
            stroke="#ffffff"
            strokeWidth={2.5}
        />
    );
};

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

    // شناسه درس انتخاب‌شده برای نمایش نمودار خطی (null = نمایش ستونی میانگین همه دروس)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                در حال بارگذاری پنل دانش‌آموز...
            </div>
        );
    }

    const average =
        data.grades.length > 0
            ? (data.grades.reduce((a, b) => a + b.score, 0) / data.grades.length).toFixed(2)
            : 0;

    // ۱. داده‌های نمودار ستونی: میانگین نمرات به تفکیک هر درس در courses
    const courseAverageData = data.courses
        .map((course) => {
            const courseGrades = data.grades.filter((g) => g.courseId === course._id);
            if (courseGrades.length === 0) return null;
            const sum = courseGrades.reduce((acc, g) => acc + g.score, 0);
            const avg = Number((sum / courseGrades.length).toFixed(2));
            return {
                courseId: course._id,
                name: course.name,
                average: avg,
                count: courseGrades.length,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

    // ۲. داده‌های نمودار خطی: نمرات درس انتخاب‌شده مرتب‌شده بر اساس زمان
    const selectedCourse = selectedCourseId
        ? data.courses.find((c) => c._id === selectedCourseId) || null
        : null;

    const selectedCourseGrades = selectedCourseId
        ? data.grades
              .filter((g) => g.courseId === selectedCourseId)
              .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
              .map((g, idx) => ({
                  id: g._id,
                  date: g.date || `نمره ${idx + 1}`,
                  score: g.score,
                  description: g.description || '',
              }))
        : [];

    // آمارهای سریع برای درس انتخاب‌شده
    const selectedCourseAvg =
        selectedCourseGrades.length > 0
            ? Number(
                  (
                      selectedCourseGrades.reduce((acc, g) => acc + g.score, 0) /
                      selectedCourseGrades.length
                  ).toFixed(2)
              )
            : 0;

    const selectedCourseMax =
        selectedCourseGrades.length > 0
            ? Math.max(...selectedCourseGrades.map((g) => g.score))
            : 0;

    const selectedCourseTrend =
        selectedCourseGrades.length >= 2
            ? Number(
                  (
                      selectedCourseGrades[selectedCourseGrades.length - 1].score -
                      selectedCourseGrades[0].score
                  ).toFixed(2)
              )
            : null;

    const handleBarClick = (barData: any) => {
        const courseId = barData?.courseId || barData?.payload?.courseId;
        if (courseId) {
            setSelectedCourseId(courseId);
        }
    };

    const getCourseAverage = (courseId: string) => {
        const sGrades = data.grades.filter((g) => g.courseId === courseId);
        if (sGrades.length === 0) return '-';
        const sum = sGrades.reduce((a, b) => a + b.score, 0);
        return (sum / sGrades.length).toFixed(2);
    };

    const farsiDirectHander = (level: Level) => {
        router.push(`/student/listening-page?level=${level}`);
    };

    const levels = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-emerald-600 text-white p-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">پنل دانش‌آموز</h1>
                        <span className="text-emerald-100 text-xs">سال تحصیلی 1405-1404</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="font-bold">
                            {data.student.firstName} {data.student.lastName}
                        </p>
                        <p className="text-emerald-200 text-xs">کد ملی: {data.student.nationalId}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-emerald-700 hover:bg-emerald-800 p-2 rounded-lg transition-colors"
                        title="خروج"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
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
                            {data.homeworks.map((hw) => (
                                <div
                                    key={hw._id}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-800 text-lg">
                                            {hw.title}
                                        </span>
                                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                                            تحویل: {hw.dueDate}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {hw.description}
                                    </p>
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
                        <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">معدل کل</p>
                            <p className="text-4xl font-bold text-gray-800">{average}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-red-200 transition">
                        <div className="bg-red-100 p-4 rounded-2xl text-red-600">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">تعداد غیبت‌ها</p>
                            <p className="text-4xl font-bold text-gray-800">
                                {data.attendance.filter((a) => a.status === 'absent').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-blue-200 transition">
                        <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">تعداد نمرات ثبت شده</p>
                            <p className="text-4xl font-bold text-gray-800">{data.grades.length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Grades Chart (Interactive Bar -> Line Drill-down) */}
                    <div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[470px]">
                            {/* هدر پویا */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`p-2 rounded-xl ${
                                            selectedCourse
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'bg-emerald-50 text-emerald-600'
                                        }`}
                                    >
                                        {selectedCourse ? (
                                            <Activity className="w-5 h-5" />
                                        ) : (
                                            <BarChart3 className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            {selectedCourse
                                                ? `روند نمرات درس ${selectedCourse.name}`
                                                : 'میانگین نمرات دروس'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {selectedCourse
                                                ? 'تغییرات نمره در طول زمان (بازه ۰ تا ۲۰)'
                                                : 'برای مشاهده نمودار روند هر درس، روی ستون آن کلیک کنید'}
                                        </p>
                                    </div>
                                </div>

                                {selectedCourse && (
                                    <button
                                        onClick={() => setSelectedCourseId(null)}
                                        className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 px-3.5 py-2 rounded-xl transition-all active:scale-95"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        بازگشت به همه دروس
                                    </button>
                                )}
                            </div>

                            {/* نوار انتخاب سریع درس‌ها */}
                            {courseAverageData.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2">
                                    <button
                                        onClick={() => setSelectedCourseId(null)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            !selectedCourseId
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        همه دروس
                                    </button>
                                    {courseAverageData.map((c) => (
                                        <button
                                            key={c.courseId}
                                            onClick={() => setSelectedCourseId(c.courseId)}
                                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                selectedCourseId === c.courseId
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* نوار خلاصه آمار هنگام انتخاب یک درس */}
                            {selectedCourse && selectedCourseGrades.length > 0 && (
                                <div className="grid grid-cols-3 gap-2.5 mb-4">
                                    <div className="bg-gray-50 rounded-2xl px-3 py-2 text-center border border-gray-100">
                                        <span className="block text-[11px] text-gray-400">
                                            میانگین درس
                                        </span>
                                        <span
                                            className="font-bold text-sm"
                                            style={{ color: getScoreColor(selectedCourseAvg) }}
                                        >
                                            {selectedCourseAvg}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl px-3 py-2 text-center border border-gray-100">
                                        <span className="block text-[11px] text-gray-400">
                                            بالاترین نمره
                                        </span>
                                        <span className="font-bold text-sm text-emerald-600">
                                            {selectedCourseMax}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl px-3 py-2 text-center border border-gray-100">
                                        <span className="block text-[11px] text-gray-400">
                                            روند تغییر
                                        </span>
                                        {selectedCourseTrend === null ? (
                                            <span className="font-medium text-xs text-gray-400">
                                                تک نمره
                                            </span>
                                        ) : (
                                            <span
                                                className={`font-bold text-sm inline-flex items-center gap-0.5 ${
                                                    selectedCourseTrend >= 0
                                                        ? 'text-emerald-600'
                                                        : 'text-red-500'
                                                }`}
                                            >
                                                {selectedCourseTrend >= 0 ? (
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                ) : (
                                                    <TrendingDown className="w-3.5 h-3.5" />
                                                )}
                                                {selectedCourseTrend > 0
                                                    ? `+${selectedCourseTrend}`
                                                    : selectedCourseTrend}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* بدنه نمودار */}
                            <div className="w-full h-[290px] mt-auto" dir="ltr">
                                {courseAverageData.length === 0 ? (
                                    <div
                                        dir="rtl"
                                        className="h-full flex flex-col items-center justify-center text-gray-400 text-sm"
                                    >
                                        <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                                        هنوز نمره‌ای برای نمایش در نمودار ثبت نشده است.
                                    </div>
                                ) : !selectedCourse ? (
                                    /* نمودار ستونی میانگین هر درس */
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={courseAverageData}
                                            margin={{ top: 10, right: 12, left: -16, bottom: 5 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={8}
                                            />
                                            <YAxis
                                                domain={[0, 20]}
                                                ticks={[0, 5, 10, 15, 20]}
                                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={<CustomBarTooltip />}
                                                cursor={{ fill: '#f8fafc', radius: 10 }}
                                            />
                                            <Bar
                                                dataKey="average"
                                                radius={[10, 10, 0, 0]}
                                                maxBarSize={48}
                                                onClick={handleBarClick}
                                                className="cursor-pointer"
                                            >
                                                {courseAverageData.map((entry) => (
                                                    <Cell
                                                        key={entry.courseId}
                                                        fill={getScoreColor(entry.average)}
                                                        className="hover:opacity-85 transition-opacity"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    /* نمودار خطی روند نمرات درس انتخاب‌شده در طول زمان */
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={selectedCourseGrades}
                                            margin={{ top: 14, right: 16, left: -16, bottom: 5 }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="courseScoreGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="#6366f1"
                                                        stopOpacity={0.28}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="#6366f1"
                                                        stopOpacity={0.0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#f1f5f9"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={8}
                                            />
                                            <YAxis
                                                domain={[0, 20]}
                                                ticks={[0, 5, 10, 15, 20]}
                                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip content={<CustomLineTooltip />} />
                                            {/* خط‌چین نشان‌دهنده میانگین همین درس */}
                                            <ReferenceLine
                                                y={selectedCourseAvg}
                                                stroke="#94a3b8"
                                                strokeDasharray="4 4"
                                                label={{
                                                    value: `میانگین: ${selectedCourseAvg}`,
                                                    position: 'insideTopRight',
                                                    fill: '#64748b',
                                                    fontSize: 11,
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fill="url(#courseScoreGradient)"
                                                dot={renderCustomDot}
                                                activeDot={{
                                                    r: 7,
                                                    fill: '#4f46e5',
                                                    stroke: '#ffffff',
                                                    strokeWidth: 3,
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
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
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                                <BrainCircuit className="ml-2 text-indigo-600" /> تحلیل هوشمند عملکرد
                            </h3>
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
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                                <AlertCircle className="w-4 h-4 ml-2 text-red-500" /> لیست غیبت‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2 overflow-y-auto h-full pb-4">
                                {data.attendance.length === 0 && (
                                    <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                        بدون غیبت! عالیه.
                                    </span>
                                )}
                                {data.attendance.map((a) => (
                                    <span
                                        key={a._id}
                                        className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-xl text-sm font-medium"
                                    >
                                        {a.date}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Grades Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gray-50/50 font-bold text-gray-800 border-b border-gray-100">
                        کارنامه تفصیلی
                    </div>
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
                                {data.grades.map((g) => (
                                    <tr
                                        key={g._id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                                    >
                                        <td className="p-4 font-bold text-gray-700">
                                            {data.courses.find((c) => c._id === g.courseId)?.name}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span
                                                className={`px-4 py-1.5 rounded-full font-bold ${
                                                    g.score >= 17
                                                        ? 'bg-green-100 text-green-700'
                                                        : g.score >= 12
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {g.score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-gray-500 font-mono">
                                            {getCourseAverage(g.courseId)}
                                        </td>
                                        <td className="p-4 text-gray-500">{g.date}</td>
                                        <td className="p-4 text-gray-500 italic max-w-xs truncate">
                                            {g.description || '-'}
                                        </td>
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