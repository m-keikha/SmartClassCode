import { AIReport, Attendance, Course, Grade, Homework, Student } from '@/types';
import { Trophy } from 'lucide-react'
import React from 'react'
interface Iprops {
    handleLogout: () => void
    data: {
        student: Student;
        courses: Course[];
        grades: Grade[];
        attendance: Attendance[];
        homeworks: Homework[];
        report?: AIReport;
    }
}

export default function header() {
    return (
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

    )
}
