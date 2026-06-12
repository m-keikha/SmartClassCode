'use client'
import { getCourses, removeGrade, studentScoreById } from '@/app/actions';
import Toast from '@/components/notification';
import { error } from 'console';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react'

export interface Grades {
    _id: string
    classId: string
    studentId: string
    courseId: string
    score: number
    description: string
    date: string
    __v: number
}

export interface CoursesType {
    _id: string
    classId: string
    name: string
    __v: number
}

export function StudentScorePage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [studentScores, setStudentScores] = useState<Grades[] | null>(null)
    const [courses, setCourses] = useState<CoursesType[] | null>(null)
    const [showMessage, setShowMessage] = useState<boolean>(false)
    const [message, setMessage] = useState<string>('')

    useEffect(() => {
        const getStudentScoreData = async () => {
            const scores = await studentScoreById(id)
            const courseData = await getCourses()
            console.log(courseData)
            setCourses(courseData.courses)
            setStudentScores(scores.students)
        }
        getStudentScoreData()
    }, [id])

    const findCourseName = (id: string) => {
        const course = courses?.find((i) => i._id === id)
        return course?.name || 'نامشخص'
    }

    // تابع برای مرتب‌سازی نمرات بر اساس تاریخ (از قدیمی به جدید)
    const sortGradesByDate = (grades: Grades[]) => {
        return [...grades].sort((a, b) => {
            // تبدیل تاریخ شمسی به فرمت قابل مقایسه
            const dateA = a.date.split('/').reverse().join('')
            const dateB = b.date.split('/').reverse().join('')
            return dateA.localeCompare(dateB)
        })
    }

    // محاسبه میانگین نمرات
    const calculateAverage = (grades: Grades[]) => {
        if (grades.length === 0) return 0
        const sum = grades.reduce((acc, grade) => acc + grade.score, 0)
        return (sum / grades.length).toFixed(2)
    }

    // گروه‌بندی نمرات بر اساس درس
    const groupGradesByCourse = () => {
        if (!studentScores || !courses) return []

        return courses.map(course => {
            const courseGrades = studentScores.filter(grade => grade.courseId === course._id)
            const sortedGrades = sortGradesByDate(courseGrades)
            return {
                courseName: course.name,
                grades: sortedGrades,
                average: calculateAverage(sortedGrades)
            }
        })
    }


    const onRemoveHandler = async (gradeId: any) => {
        const resultRemove = await removeGrade(gradeId)
        console.log(resultRemove)

        if (resultRemove.success && !resultRemove.error) {
            setMessage('عملیات با موفقیت انجام شد!')
            setShowMessage(true)
            window.location.reload()
        }
        else setMessage('عدم موفقیت !!! دوباره تلاش کنید.')
    }


    const closeMessageManage = () => {
        setShowMessage(false)
        setMessage('')
    }



    const groupedData = groupGradesByCourse()



    if (!studentScores || !courses) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-lg text-gray-600">در حال بارگذاری...</div>
            </div>
        )
    }

    return (
        <div className="flex h-screen relative bg-gray-100 font-sans">
            {showMessage && <Toast message={message} duration={3000} onClose={closeMessageManage} isVisible={showMessage} />}

            <div className="container mx-auto p-6" dir="rtl">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium p-6">
                        <h1 className="text-2xl font-bold text-white text-center">
                            کارنامه دانش‌آموز
                        </h1>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b-2 border-gray-200 w-48">
                                        نام درس
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 border-b-2 border-gray-200">
                                        نمرات (به ترتیب تاریخ)
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-200 w-32">
                                        میانگین
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedData.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 text-right font-medium text-gray-800 border-b border-gray-200 align-top">
                                            {item.courseName}
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200">
                                            <div className="flex flex-wrap gap-3">
                                                {item.grades.length > 0 ? (
                                                    item.grades.map((grade, gradeIndex) => (
                                                        <div
                                                            key={gradeIndex}
                                                            className="group relative"
                                                            title={grade.description || 'بدون توضیحات'}
                                                        >
                                                            <div className={`
                                                                inline-flex flex-col items-center justify-center
                                                                px-4 py-2 rounded-lg shadow-sm
                                                                transition-all duration-200
                                                                cursor-pointer
                                                                ${grade.score >= 10
                                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-md'
                                                                }
                                                            `}>
                                                                <div>
                                                                    <button
                                                                        onClick={() => onRemoveHandler(grade._id)}
                                                                        className="absolute top-2 left-2 text-gray-400 hover:text-red-500 transition-colors text-xl"
                                                                    >
                                                                        ✕
                                                                    </button>

                                                                </div>


                                                                <span className="text-lg font-bold">
                                                                    {grade.score}
                                                                </span>
                                                                <span className="text-xs mt-1 opacity-75">
                                                                    {grade.date}
                                                                </span>
                                                            </div>

                                                            {/* Tooltip برای description */}
                                                            {grade.description && (
                                                                <div className="
                                                                    absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                                                    hidden group-hover:block
                                                                    bg-gray-900 text-white text-xs rounded-lg py-2 px-3
                                                                    whitespace-nowrap z-10 shadow-lg
                                                                    before:content-[''] before:absolute before:top-full 
                                                                    before:left-1/2 before:transform before:-translate-x-1/2
                                                                    before:border-4 before:border-transparent 
                                                                    before:border-t-gray-900
                                                                    max-w-xs
                                                                ">
                                                                    {grade.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">
                                                        نمره‌ای ثبت نشده است
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200 text-center align-top">
                                            {item.grades.length > 0 ? (
                                                <div className={`
                                                    inline-flex items-center justify-center
                                                    px-4 py-2 rounded-lg font-bold text-lg
                                                    ${parseFloat(item.average) >= 10
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                    }
                                                `}>
                                                    {item.average}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {groupedData.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            هیچ اطلاعاتی یافت نشد
                        </div>
                    )}
                </div>

                {/* راهنما */}
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-gray-700">نمرات 10 و بالاتر</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-gray-700">نمرات زیر 10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StudentScorePage />
        </Suspense>
    )
}
