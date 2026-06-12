'use client'
import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, GraduationCap, Star, BrainCircuit, Key, LogOut } from 'lucide-react';
import {
  getStudents, saveStudent, getCourses, saveCourse, getGrades, saveGrade,
  updateStudent, getStudentReport, saveReport
} from '../services/storage';
import { generateStudentPerformanceReport } from '../services/geminiService';
import { Student, Course, Grade, AIReport } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TeacherDashboardProps {
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'courses'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // UI States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Forms
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', nationalId: '', fatherName: '' });
  const [newCourseName, setNewCourseName] = useState('');
  const [newGrade, setNewGrade] = useState({ courseId: '', score: '', description: '' });

  // Password Reset
  const [newPassword, setNewPassword] = useState('');

  // AI Loading State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentReport, setCurrentReport] = useState<AIReport | undefined>(undefined);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStudents(getStudents());
    setCourses(getCourses());
    setGrades(getGrades());
  };

  const handleAddStudent = () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.nationalId) return;
    const student: Student = {
      _id: uuidv4(),
      ...newStudent
    };
    saveStudent(student);
    setNewStudent({ firstName: '', lastName: '', nationalId: '', fatherName: '' });
    setShowAddStudent(false);
    refreshData();
  };

  const handleAddCourse = () => {
    if (!newCourseName) return;
    saveCourse({ _id: uuidv4(), name: newCourseName });
    setNewCourseName('');
    setShowAddCourse(false);
    refreshData();
  };

  const handleAddGrade = () => {
    if (!selectedStudent || !newGrade.courseId || !newGrade.score) return;
    const grade: Grade = {
      _id: uuidv4(),
      studentId: selectedStudent._id,
      courseId: newGrade.courseId,
      score: Number(newGrade.score),
      description: newGrade.description,
      date: new Date().toLocaleDateString('fa-IR'),
    };
    saveGrade(grade);
    setNewGrade({ courseId: '', score: '', description: '' });
    refreshData();
  };

  const handleUpdatePassword = () => {
    if (!selectedStudent || !newPassword) return;
    const updated = { ...selectedStudent, password: newPassword };
    updateStudent(updated);
    setSelectedStudent(updated);
    setNewPassword('');
    alert('رمز عبور با موفقیت تغییر کرد.');
    refreshData();
  };

  const handleGenerateReport = async () => {
    if (!selectedStudent) return;
    setIsGeneratingAI(true);

    // اطمینان از اینکه studentId ها به رشته تبدیل می‌شن
    const studentGrades = grades.filter(
      g => g.studentId?.toString() === selectedStudent._id?.toString()
    );

    console.log('mmm');

    // تبدیل selectedStudent به plain object قابل استفاده
    const safeStudent = {
      ...selectedStudent,
      _id: selectedStudent._id?.toString(),
    };

    const reportText = await generateStudentPerformanceReport(
      safeStudent,
      studentGrades.map(g => ({
        ...g,
        studentId: g.studentId?.toString(),
        courseId: g.courseId?.toString(),
        date: g.date instanceof Date ? g.date.toISOString() : g.date,
      })),
      courses.map(c => ({
        ...c,
        _id: c._id?.toString(),
      }))
    );

    const report: AIReport = {
      studentId: selectedStudent._id?.toString(), // تبدیل به رشته
      content: reportText,
      timestamp: Date.now(),
    };

    saveReport(report);
    setCurrentReport(report);
    setIsGeneratingAI(false);
  };


  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setCurrentReport(getStudentReport(student._id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
          <BrainCircuit className="w-8 h-8" />
          پنل مدیریت مدرسه
        </h1>
        <button onClick={onLogout} className="flex items-center text-red-600 hover:text-red-700 font-medium">
          <LogOut className="w-5 h-5 ml-2" />
          خروج
        </button>
      </header>

      <div className="flex flex-1 p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col gap-2">
          <button
            onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
            className={`flex items-center p-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            <GraduationCap className="w-5 h-5 ml-3" />
            دانش‌آموزان
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setSelectedStudent(null); }}
            className={`flex items-center p-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            <BookOpen className="w-5 h-5 ml-3" />
            درس‌ها
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm p-6 overflow-hidden">

          {selectedStudent ? (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                  <p className="text-gray-500 text-sm">کد ملی: {selectedStudent.nationalId} | نام پدر: {selectedStudent.fatherName}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-sm text-gray-500 hover:text-blue-600">
                  بازگشت به لیست
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grades Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                      <Plus className="w-5 h-5 ml-2" />
                      ثبت نمره جدید
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <select
                        className="p-2 rounded border border-gray-300 w-full"
                        value={newGrade.courseId}
                        onChange={(e) => setNewGrade({ ...newGrade, courseId: e.target.value })}
                      >
                        <option value="">انتخاب درس...</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="نمره (0-20)"
                        className="p-2 rounded border border-gray-300 w-full"
                        value={newGrade.score}
                        onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
                      />
                    </div>
                    <textarea
                      placeholder="توضیحات (اختیاری)"
                      className="w-full p-2 rounded border border-gray-300 mb-3 h-20 resize-none"
                      value={newGrade.description}
                      onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                    />
                    <button onClick={handleAddGrade} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                      ثبت نمره
                    </button>
                  </div>

                  <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-3 text-right">درس</th>
                          <th className="p-3 text-center">نمره</th>
                          <th className="p-3 text-right">توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.filter(g => g.studentId === selectedStudent._id).map(g => (
                          <tr key={g._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-3">{courses.find(c => c._id === g.courseId)?.name}</td>
                            <td className={`p-3 text-center font-bold ${g.score >= 10 ? 'text-green-600' : 'text-red-500'}`}>{g.score}</td>
                            <td className="p-3 text-gray-500 truncate max-w-xs">{g.description}</td>
                          </tr>
                        ))}
                        {grades.filter(g => g.studentId === selectedStudent._id).length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-gray-400">هنوز نمره‌ای ثبت نشده است.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI & Settings Section */}
                <div className="space-y-6">
                  {/* AI Report Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-indigo-900 flex items-center">
                        <BrainCircuit className="w-5 h-5 ml-2" />
                        گزارش هوش مصنوعی
                      </h3>
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingAI}
                        className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {isGeneratingAI ? 'در حال تحلیل...' : 'تولید گزارش جدید'}
                      </button>
                    </div>

                    <div className="bg-white/80 p-4 rounded-lg text-sm leading-relaxed text-gray-800 min-h-[150px] shadow-sm whitespace-pre-line">
                      {currentReport ? currentReport.content : 'هنوز گزارشی تولید نشده است.'}
                    </div>
                    {currentReport && (
                      <p className="text-xs text-gray-400 mt-2 text-left" dir="ltr">
                        Generated: {new Date(currentReport.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Password Management */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                      <Key className="w-5 h-5 ml-2" />
                      تغییر رمز عبور دانش‌آموز
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="رمز عبور جدید"
                        className="flex-1 p-2 rounded border border-gray-300 text-sm"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button onClick={handleUpdatePassword} className="bg-gray-800 text-white px-4 rounded-lg text-sm hover:bg-gray-900">
                        تغییر
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      رمز عبور فعلی: {selectedStudent.password || selectedStudent.nationalId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">لیست دانش‌آموزان</h2>
                    <button
                      onClick={() => setShowAddStudent(!showAddStudent)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition"
                    >
                      <Plus className="w-5 h-5 ml-2" />
                      افزودن دانش‌آموز
                    </button>
                  </div>

                  {showAddStudent && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-slide-down">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          placeholder="نام"
                          className="p-2 rounded border"
                          value={newStudent.firstName}
                          onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        />
                        <input
                          placeholder="نام خانوادگی"
                          className="p-2 rounded border"
                          value={newStudent.lastName}
                          onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        />
                        <input
                          placeholder="کد ملی"
                          className="p-2 rounded border"
                          value={newStudent.nationalId}
                          onChange={e => setNewStudent({ ...newStudent, nationalId: e.target.value })}
                        />
                        <input
                          placeholder="نام پدر"
                          className="p-2 rounded border"
                          value={newStudent.fatherName}
                          onChange={e => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                        />
                      </div>
                      <button onClick={handleAddStudent} className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">ثبت</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map(student => (
                      <div
                        key={student._id}
                        onClick={() => openStudentDetails(student)}
                        className="bg-white border hover:border-blue-400 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{student.firstName} {student.lastName}</h3>
                            <p className="text-xs text-gray-500 mt-1">کد ملی: {student.nationalId}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="col-span-full text-center py-10 text-gray-400">
                        دانش‌آموزی ثبت نشده است.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">درس‌های ارائه شده</h2>
                    <button
                      onClick={() => setShowAddCourse(!showAddCourse)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition"
                    >
                      <Plus className="w-5 h-5 ml-2" />
                      افزودن درس
                    </button>
                  </div>

                  {showAddCourse && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-2">
                      <input
                        placeholder="نام درس جدید"
                        className="flex-1 p-2 rounded border"
                        value={newCourseName}
                        onChange={e => setNewCourseName(e.target.value)}
                      />
                      <button onClick={handleAddCourse} className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700">ثبت</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courses.map(course => (
                      <div key={course._id} className="bg-white border p-4 rounded-xl shadow-sm flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">{course.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;