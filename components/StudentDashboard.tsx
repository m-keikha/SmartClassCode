'use client'
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LogOut, Trophy, TrendingUp, BrainCircuit, BookOpen } from 'lucide-react';
import { getStudents, getCourses, getGrades, getStudentReport } from '../services/storage';
import { Student, Course, Grade, AIReport } from '../types';

interface StudentDashboardProps {
  studentId: string;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId, onLogout }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [report, setReport] = useState<AIReport | undefined>(undefined);
  
  // Stats
  const [average, setAverage] = useState(0);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    const allStudents = getStudents();
    const currentStudent = allStudents.find(s => s._id === studentId);
    setStudent(currentStudent || null);

    const allCourses = getCourses();
    setCourses(allCourses);

    const allGrades = getGrades();
    const myGrades = allGrades.filter(g => g.studentId === studentId);
    setGrades(myGrades);

    const myReport = getStudentReport(studentId);
    setReport(myReport);

    // Calculate Stats
    if (myGrades.length > 0) {
      const sum = myGrades.reduce((acc, curr) => acc + curr.score, 0);
      setAverage(Number((sum / myGrades.length).toFixed(2)));
    }

    // Calculate Rank
    const studentAverages = allStudents.map(s => {
      const sGrades = allGrades.filter(g => g.studentId === s._id);
      if (sGrades.length === 0) return { id: s._id, avg: 0 };
      const sum = sGrades.reduce((acc, curr) => acc + curr.score, 0);
      return { id: s._id, avg: sum / sGrades.length };
    });

    // Sort descending
    studentAverages.sort((a, b) => b.avg - a.avg);
    const myRank = studentAverages.findIndex(s => s.id === studentId) + 1;
    setRank(myRank);

  }, [studentId]);

  if (!student) return <div className="p-10 text-center">در حال بارگذاری...</div>;

  // Prepare Chart Data
  const chartData = grades.map(g => ({
    name: courses.find(c => c._id === g.courseId)?.name || 'ناشناس',
    score: g.score,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-600 text-white shadow-lg px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            پنل دانش‌آموز
          </h1>
          <p className="text-emerald-100 text-sm mt-1 mr-8">
            {student.firstName} {student.lastName} | کد ملی: {student.nationalId}
          </p>
        </div>
        <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">میانگین کل</p>
              <p className="text-3xl font-bold text-gray-800">{average}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">رتبه در کلاس</p>
              <p className="text-3xl font-bold text-gray-800">{rank} <span className="text-sm font-normal text-gray-400">از {getStudents().length}</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">تعداد درس‌ها</p>
              <p className="text-3xl font-bold text-gray-800">{grades.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border h-[400px]">
            <h3 className="font-bold text-gray-700 mb-6 border-b pb-2">نمودار پیشرفت تحصیلی</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 20]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{fill: '#f0f9ff'}}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 10 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Report Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 flex items-center">
              <BrainCircuit className="w-5 h-5 ml-2 text-indigo-600" />
              تحلیل عملکرد هوشمند
            </h3>
            
            <div className="flex-1 bg-indigo-50/50 rounded-xl p-5 leading-relaxed text-sm text-gray-700 whitespace-pre-line overflow-y-auto max-h-[300px]">
              {report ? (
                <>
                  <div className="font-medium text-indigo-900 mb-2">گزارش مشاور هوش مصنوعی:</div>
                  {report.content}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <BrainCircuit className="w-12 h-12 mb-2 opacity-20" />
                  <p>هنوز گزارشی توسط معلم ثبت نشده است.</p>
                </div>
              )}
            </div>
            {report && (
              <p className="text-xs text-right text-gray-400 mt-2" dir="ltr">
                {new Date(report.timestamp).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">ریز نمرات</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 bg-gray-50/50">
                <th className="p-4 text-right">درس</th>
                <th className="p-4 text-center">نمره</th>
                <th className="p-4 text-right">توضیحات معلم</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{courses.find(c => c._id === g.courseId)?.name}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full ${g.score >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {g.score}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{g.date}</td>
                  <td className="p-4 text-gray-600">{g.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;