'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, BookOpen, GraduationCap, BrainCircuit, LogOut,
    Calendar, CheckCircle, XCircle, FileText, BarChart, Phone,
    Save, Trash2, Send, Trophy, UserX, BookMinus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getTeacherData, addStudent, addCourse, addGrade,
    addAttendance, removeAttendance, updateStudent,
    generateAIReportAction, saveAIReport, addHomework, logoutAction, loginCheck,
    removeStudent,
    removeCourse,
    Level,
    getStudentResponse
} from '../actions';
import { Student, Course, Grade, Attendance, Homework } from '@/types';
import Modal from '@/components/Modal';
import Toast from '@/components/notification';
import { number } from 'yup';
import StudentResponseGrid from '@/components/StudentResponses';



// اینترفیس برای هر سوال تک تک
interface IQuestionResponse {
    listeningId: string;
    userResponse: string;
    correctAnswer: string;
    textQuestion: string;
    isCorrect: boolean;
    updatedAt?: Date; // اگر در اسکیما اضافه کرده باشیم
}

// اینترفیس برای کل داکیومنت پاسخ دانش‌آموز
interface IStudentResponseDoc {
    _id: string;
    classId: string;
    studentId: string;
    questions: IQuestionResponse[];
    createdAt: Date;
    __v: number;
}

interface IGetStudentResponseResult {
    success: boolean;
    result?: IStudentResponseDoc[];
}




export default function TeacherDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'leaderboard'>('students');
    const [data, setData] = useState<{
        students: Student[];
        courses: Course[];
        grades: Grade[];
        attendance: Attendance[];
        homeworks: Homework[];
    } | null>(null);



    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);


    const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', nationalId: '', fatherName: '' });
    const [newCourseName, setNewCourseName] = useState('');
    const [newGrade, setNewGrade] = useState({ courseId: '', score: '', description: '', date: new Date().toLocaleDateString('fa-IR') });
    const [newHomework, setNewHomework] = useState({ title: '', description: '', dueDate: '', target: 'ALL' });

    const [studentReadingData, setstudentReadingData] = useState<IStudentResponseDoc[]>()


    const [studentNote, setStudentNote] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [manualAbsenceDate, setManualAbsenceDate] = useState('');
    const [teacherName, setTeacherName] = useState('')

    // Modals
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [showAddHomework, setShowAddHomework] = useState(false);
    const [showLevels, setShowLevels] = useState(false);

    const [showModal, setShowModal] = useState(false)
    const [message, setMessage] = useState<string>('')
    const [showMessage, setShowMessage] = useState<boolean>(false)
    const [password, setPassword] = useState('')

    const [isShowStResponses, setIsShowStResponses] = useState<boolean>(false)



    useEffect(() => {
        const checkAuth = async () => {
            const isLogin = await loginCheck();

            if (!isLogin) {
                // پاکسازی لوکال استوریج در صورتی که کوکی پریده باشد
                localStorage.removeItem('login-data');
                router.push('/');
                return window.location.href = '/'
            } else {
                loadData();
            }


        };

        checkAuth();

    }, []);

    useEffect(() => {
        if (selectedStudent) {
            setStudentPhone(selectedStudent.phoneNumber || '');
            setStudentNote('');
        }
    }, [selectedStudent]);



    const loadData = async () => {
        const name = localStorage.getItem('name')
        setTeacherName(name)

        const res = await getTeacherData();
        if (res.error) return router.push('/')
        console.log(res)
        setData(res as any);
        if (selectedStudent) {
            const updatedStudent = (res as any).students.find((s: Student) => s._id === selectedStudent._id);
            if (updatedStudent) setSelectedStudent(updatedStudent);
        }
    };



    const handleLogout = async () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('login-data');
        await logoutAction()

        router.push('/');
    };

    const getTodayDate = () => new Date().toLocaleDateString('fa-IR');

    const isAbsent = (studentId: string, date: string) => {
        return data?.attendance.some(a => a.studentId === studentId && a.date === date);
    };

    const getStudentAverage = (studentId: string) => {
        if (!data) return 0;

        // const studentGrades = data.grades.filter

        const sGrades = data.grades.filter(g => g.studentId === studentId);
        if (sGrades.length === 0) return 0;
        const sum = sGrades.reduce((a, b) => a + b.score, 0);
        return parseFloat((sum / sGrades.length).toFixed(2));
    };

    const getCourseAverage = (studentId: string, courseId: string) => {
        if (!data) return '-';
        const sGrades = data.grades.filter(g => g.studentId === studentId && g.courseId === courseId);
        if (sGrades.length === 0) return '-';
        const sum = sGrades.reduce((a, b) => a + b.score, 0);
        return (sum / sGrades.length).toFixed(2);
    }


    const handleAddStudent = async () => {
        if (!newStudent.firstName) return;
        const correctionNewStudent = { ...newStudent, password: newStudent.nationalId }

        await addStudent(correctionNewStudent);
        setNewStudent({ firstName: '', lastName: '', nationalId: '', fatherName: '' });
        setShowAddStudent(false);
        loadData();
    };

    const handleAddCourse = async () => {
        if (!newCourseName) return;
        await addCourse(newCourseName);
        setNewCourseName('');
        setShowAddCourse(false);
        loadData();
    };

    const handleAddGrade = async () => {
        if (!selectedStudent || !newGrade.courseId) return;
        const getScore = await addGrade({
            studentId: selectedStudent._id,
            courseId: newGrade.courseId,
            // courseName: newGrade.
            score: Number(newGrade.score),
            description: newGrade.description,
            date: newGrade.date || getTodayDate()
        });
        if (getScore === true) {
            setMessage('نمره با موفقیت ثبت شد')
            setShowMessage(true)
        } else {
            setMessage('نمره ثبت نشد! مجددا تلاش کنید')
            setShowMessage(true)

        }
        setNewGrade(prev => ({ ...prev, score: '', description: '' })); // Keep date and course
        loadData();

    };

    const handleAddHomework = async () => {
        if (!newHomework.title) return;
        await addHomework(newHomework);
        setNewHomework({ title: '', description: '', dueDate: '', target: 'ALL' });
        setShowAddHomework(false);
        alert('تکلیف با موفقیت ارسال شد.');
        loadData();
    };

    const handleToggleAbsence = async (studentId: string, date: string) => {
        if (isAbsent(studentId, date)) {
            await removeAttendance(studentId, date);
        } else {
            await addAttendance(studentId, date);
        }
        loadData();
    };

    const handleSaveStudentInfo = async () => {
        if (!selectedStudent) return;
        const updates: any = {};
        if (studentPhone) updates.phoneNumber = studentPhone;
        if (studentNote) {
            const currentNotes = selectedStudent.dailyNotes || [];
            updates.dailyNotes = [...currentNotes, { date: getTodayDate(), content: studentNote }];
        }
        await updateStudent(selectedStudent._id, updates);
        setStudentNote('');
        alert('اطلاعات ذخیره شد');
        loadData();
    };

    const handleAI = async () => {
        if (!selectedStudent || !data) return;
        setIsGeneratingAI(true);
        const sGrades = data.grades.filter(g => g.studentId === selectedStudent._id);
        const reportText = await generateAIReportAction(selectedStudent, sGrades, data.courses);
        await saveAIReport(selectedStudent._id, reportText);
        setIsGeneratingAI(false);
        loadData();
    };

    const showModalManage = () => {
        setShowModal(true)
    }
    const closeModalManage = () => {
        setShowModal(false)
    }

    const closeMessageManage = () => {
        setShowMessage(false)
        setMessage('')
    }

    const confirmModalManage = async () => {
        console.log(selectedStudent._id)
        const removedStudent = await removeStudent(selectedStudent._id)
        setShowModal(false)
        console.log(removedStudent)
        if (removedStudent) {
            setMessage(`${removedStudent.firstName} ${removedStudent.lastName} با موفقیت حذف شد`)
            setShowMessage(true)
            window.location.reload();
        }
    }


    const removeLesson = async (index: number) => {
        await removeCourse(data.courses[index]._id)
        loadData()
    }


    const studentPassManage = async () => {
        if (password.length < 8) {
            setMessage('رمز عبور بایستی حداقل 8 کاراکتر باشد')
            setShowMessage(true)
            return
        } else {
            const passwordData = { password: password }
            const updatedPass = await updateStudent(selectedStudent._id, passwordData)

            console.log(updatedPass)
            if (updatedPass.success === true) {
                setMessage('رمز عبور با موفقیت تغییر کرد')
                setShowMessage(true)
            }

        }

    }


    const farsiDirectHander = (level: Level) => {

        router.push(`/teacher/listening-page?level=${level}`)

    }

    const responsesPageHandler = async () => {

        const data = await getStudentResponse()

        if (data.success) setstudentReadingData(data.result)
        setIsShowStResponses(true)

    }



    const levels = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"]




    if (!data) return <div className="min-h-screen flex  items-center justify-center bg-gray-50 text-gray-500">در حال دریافت اطلاعات...</div>;
    // if (showModal) return <Modal isOpen={showModal} onClose={closeModalManage} onConfirm={confirmModalManage} title='salam' />

    return (
        <div className="flex h-screen relative bg-gray-100 font-sans">
            {showModal && <Modal isOpen={showModal} onClose={closeModalManage} onConfirm={confirmModalManage} title='حذف دانش آموز' >آیا نسبت به حذف دانش آموز و کلیه داده های آن مطمئن هستید؟</Modal>}
            {showMessage && <Toast message={message} duration={3000} onClose={closeMessageManage} isVisible={showMessage} />}
            {/* <button onClick={() => handleLogout()} className='absolute md:hidden top-0 left-0 p-2 rounded-md bg-white'><LogOut className="w-5 h-5 text-red-500  " /></button> */}
            {/* Sidebar / Bottom Navigation */}
            <aside className="fixed md:static bottom-0 left-0 right-0 w-full md:w-72 bg-white/95 md:bg-white backdrop-blur-lg border-t md:border-t-0 md:border-l border-gray-200 md:shadow-[rgba(0,0,0,0.05)_0px_0px_20px] flex flex-row md:flex-col z-50 transition-all duration-300 md:h-screen">



                <div className="hidden md:flex items-center justify-center py-8 border-b border-gray-100">
                    <div className="bg-blue-50 p-3 rounded-2xl ml-3">
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-800">مدرسه هوشمند</h1>
                </div>

                <div className="hidden md:block px-5 mt-6 mb-2">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50 p-4 rounded-2xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1 font-medium">خوش آمدید،</p>
                        <p className="text-base font-bold text-blue-800 truncate" title={teacherName}>
                            {teacherName}
                        </p>
                    </div>
                </div>

                <nav className="flex flex-row md:flex-col justify-around md:justify-start w-full p-2 md:p-5 md:gap-2 overflow-y-auto">

                    {/* دکمه دانش‌آموزان */}
                    <button
                        onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-2 md:p-3.5 rounded-xl transition-all duration-300 flex-1 md:flex-none ${activeTab === 'students' ? 'bg-blue-100/50 md:bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    >
                        <GraduationCap className={`w-6 h-6 md:w-5 md:h-5 mb-1 md:mb-0 md:ml-3 transition-transform ${activeTab === 'students' ? 'scale-110' : ''}`} />
                        <span className={`text-[10px] md:text-sm font-medium ${activeTab === 'students' ? 'font-bold' : ''}`}>دانش‌آموزان</span>
                    </button>

                    {/* دکمه درس‌ها */}
                    <button
                        onClick={() => { setActiveTab('courses'); setSelectedStudent(null); }}
                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-2 md:p-3.5 rounded-xl transition-all duration-300 flex-1 md:flex-none ${activeTab === 'courses' ? 'bg-blue-100/50 md:bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    >
                        <BookOpen className={`w-6 h-6 md:w-5 md:h-5 mb-1 md:mb-0 md:ml-3 transition-transform ${activeTab === 'courses' ? 'scale-110' : ''}`} />
                        <span className={`text-[10px] md:text-sm font-medium ${activeTab === 'courses' ? 'font-bold' : ''}`}>درس‌ها</span>
                    </button>

                    {/* دکمه رتبه‌بندی */}
                    <button
                        onClick={() => { setActiveTab('leaderboard'); setSelectedStudent(null); }}
                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-2 md:p-3.5 rounded-xl transition-all duration-300 flex-1 md:flex-none ${activeTab === 'leaderboard' ? 'bg-blue-100/50 md:bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    >
                        <BarChart className={`w-6 h-6 md:w-5 md:h-5 mb-1 md:mb-0 md:ml-3 transition-transform ${activeTab === 'leaderboard' ? 'scale-110' : ''}`} />
                        <span className={`text-[10px] md:text-sm font-medium ${activeTab === 'leaderboard' ? 'font-bold' : ''}`}>رتبه‌بندی</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="md:hidden flex flex-col items-center justify-center p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-1"
                    >
                        <LogOut className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium">خروج</span>
                    </button>
                </nav>

                <div className="hidden md:block mt-auto p-5 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3.5 text-red-600 bg-red-50/50 hover:bg-red-100 hover:shadow-sm rounded-xl transition-all duration-300 font-bold group"
                    >
                        <LogOut className="ml-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        خروج از پنل
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {selectedStudent ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-fade-in">
                        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                <div className="flex flex-wrap justify-between">
                                    <div className='flex flex-wrap gap-4 text-sm text-gray-500'>
                                        <span className="bg-gray-100 px-3 py-1 rounded-full">کد ملی: {selectedStudent.nationalId}</span>
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">میانگین کل: {getStudentAverage(selectedStudent._id)}</span>
                                    </div>

                                </div>
                            </div>
                            <div className='flex flex-col space-y-4'>

                                <button onClick={() => showModalManage()} className='bg-red-50 p-2 text-red-600 items-center flex flex-row-reverse space-x-4 justify-center rounded-xl text-sm'>
                                    <UserX className='mx-2' />   حذف                                 </button>
                                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 transition-colors">بازگشت</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Plus className="w-5 h-5 ml-2 text-blue-600" /> ثبت نمره جدید</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <select className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={newGrade.courseId} onChange={e => setNewGrade({ ...newGrade, courseId: e.target.value })}>
                                            <option value="">انتخاب درس...</option>
                                            {data.courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        <input type="number" placeholder="نمره (0-20)" className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newGrade.score} onChange={e => setNewGrade({ ...newGrade, score: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <input type="text" placeholder="تاریخ ثبت نمره" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                            value={newGrade.date} onChange={e => setNewGrade({ ...newGrade, date: e.target.value })} />
                                        <p className="text-xs text-gray-400 mr-1">تاریخ پیش‌فرض: امروز. در صورت نیاز تغییر دهید.</p>
                                    </div>
                                    <textarea placeholder="توضیحات (اختیاری)" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none mb-3 h-20 resize-none"
                                        value={newGrade.description} onChange={e => setNewGrade({ ...newGrade, description: e.target.value })} />
                                    <button onClick={handleAddGrade} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium">ثبت نمره</button>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                    <div className="bg-gray-50 p-4 font-bold text-gray-700 border-b border-gray-200">وضعیت درسی (میانگین هر درس)</div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {data.courses.map(c => (
                                                <tr key={c._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-gray-600">{c.name}</td>
                                                    <td className="p-4 text-left font-bold text-gray-800">{getCourseAverage(selectedStudent._id, c._id)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                    <button onClick={() => router.push(`/teacher/student-score?id=${selectedStudent._id}`)} className="bg-blue-500 hover:bg-indigo-500 transition-all duration-200 shadow-xl shadow-blue-500 hover:shadow-xl hover:shadow-indigo-500  p-4 font-bold text-white  w-full">رفتن به ریز نمرات درسی - کارنامه</button>

                                </div>
                                <div className="bg-white border p-4 space-y-3 border-gray-200 rounded-2xl overflow-hidden">
                                    <div>
                                        <label className='block' htmlFor="">تغییر رمز عبور {selectedStudent.firstName} {selectedStudent.lastName}</label>
                                        <input onChange={(e) => setPassword(e.target.value)} type="text" className="w-full my-2 p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500" />
                                        <button onClick={() => studentPassManage()} className='bg-green-50 shadow-lg transition-all shadow-green-100 text-green-500 p-2 hover:text-green-600 rounded-xl'>ذخیره رمز عبور جدید</button>
                                    </div>
                                </div>









                            </div>

                            <div className="space-y-6">

                                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Calendar className="w-5 h-5 ml-2 text-orange-500" /> مدیریت حضور و غیاب</h3>

                                    <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100">
                                        <span className="text-orange-900 font-medium">وضعیت امروز ({getTodayDate()})</span>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isAbsent(selectedStudent._id, getTodayDate())}
                                                onChange={() => handleToggleAbsence(selectedStudent._id, getTodayDate())}
                                            />
                                            <div className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isAbsent(selectedStudent._id, getTodayDate()) ? 'bg-red-500 text-white shadow-red-200 shadow-md' : 'bg-green-500 text-white shadow-green-200 shadow-md'}`}>
                                                {isAbsent(selectedStudent._id, getTodayDate()) ? 'غایب است' : 'حاضر است'}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex gap-2 mb-4 ">
                                        <input type="text" placeholder="تاریخ خاص (1404/xx/xx)" className="flex-1  w-28 p-3    rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-500"
                                            value={manualAbsenceDate} onChange={e => setManualAbsenceDate(e.target.value)} />
                                        <button onClick={() => { if (manualAbsenceDate) handleToggleAbsence(selectedStudent._id, manualAbsenceDate); }}
                                            className="bg-orange-500 flex-wrap text-white px-1 md:px-4 rounded-xl text-sm hover:bg-orange-600 transition-colors">
                                            ثبت/حذف غیبت
                                        </button>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-400 mb-2">لیست غیبت‌های ثبت شده:</p>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                            {data.attendance.filter(a => a.studentId === selectedStudent._id).map(a => (
                                                <span key={a._id} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg text-xs font-medium">
                                                    {a.date}
                                                </span>
                                            ))}
                                            {data.attendance.filter(a => a.studentId === selectedStudent._id).length === 0 && <span className="text-gray-400 text-sm">بدون غیبت</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Phone className="w-5 h-5 ml-2 text-purple-500" /> تماس و یادداشت</h3>

                                    <div className="mb-4">
                                        <label className="text-xs text-gray-400 block mb-1">شماره تماس والدین</label>
                                        <input
                                            type="text"
                                            placeholder="مثال: 0912..."
                                            className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-purple-500"
                                            value={studentPhone}
                                            onChange={e => setStudentPhone(e.target.value)}
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-xs text-gray-400 block mb-1">افزودن یادداشت روزانه جدید</label>
                                        <textarea
                                            placeholder="رفتار امروز دانش‌آموز چطور بود؟"
                                            className="w-full p-3 rounded-xl border border-gray-200 text-sm h-24 resize-none outline-none focus:border-purple-500"
                                            value={studentNote}
                                            onChange={e => setStudentNote(e.target.value)}
                                        />
                                    </div>

                                    <button onClick={handleSaveStudentInfo} className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-xl hover:bg-black transition-colors text-sm">
                                        <Save className="w-4 h-4" /> ذخیره اطلاعات
                                    </button>

                                    {selectedStudent.dailyNotes && selectedStudent.dailyNotes.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 mb-2">تاریخچه یادداشت‌ها:</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                {selectedStudent.dailyNotes.map((note, i) => (
                                                    <div key={i} className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm">
                                                        <div className="text-xs text-yellow-700 font-bold mb-1">{note.date}</div>
                                                        <div className="text-gray-700">{note.content}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Analysis */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-indigo-900 flex items-center"><BrainCircuit className="w-5 h-5 ml-2" /> هوش مصنوعی</h3>
                                        <button onClick={handleAI} disabled={isGeneratingAI} className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-indigo-200 shadow-md">
                                            {isGeneratingAI ? 'در حال تحلیل...' : 'تولید گزارش جدید'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white/50 p-4 rounded-xl min-h-[100px]">
                                        {/* In a real scenario, this would come from props or fresh fetch */}
                                        {isGeneratingAI ? "لطفا صبر کنید..." : "برای دریافت تحلیل عملکرد، دکمه بالا را فشار دهید."}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'students' && (
                            <div className="animate-slide-up">
                                <div className="flex flex-col  md:flex-row justify-between items-center mb-8 gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">مدیریت دانش‌آموزان</h2>
                                    <div className="flex  gap-3 w-full md:w-auto">
                                        <button onClick={() => setShowAddHomework(!showAddHomework)} className="flex-1 md:flex-none bg-purple-600 text-white px-2 py-1 md:px-6 md:py-3 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                                            <FileText className="w-4 h-4" /> ارسال تکلیف
                                        </button>
                                        <button onClick={() => setShowLevels(!showLevels)} className="flex-1 md:flex-none bg-purple-600 text-white px-2 py-1 md:px-6 md:py-3 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                                            <FileText className="w-4 h-4" /> مدیریت خوانداری
                                        </button>
                                        <button onClick={() => setShowAddStudent(!showAddStudent)} className="flex-1 md:flex-none bg-blue-600 text-white px-2 py-1 md:px-6 md:py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                            <Plus className="w-4 h-4" /> دانش‌آموز جدید
                                        </button>
                                    </div>

                                </div>
                                {showLevels && (
                                    <div className="bg-white p-5 w-full mt-6 mb-8 rounded-3xl shadow-sm border border-gray-100 h-auto min-h-[150px]">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                                            <BookOpen className="w-6 h-6 ml-2 text-blue-500" />
                                            تمرین خوانداری فارسی
                                        </h3>

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
                                        <button onClick={() => responsesPageHandler()} className='bg-indigo-400 border-1 hover:bg-sky-400 transition-all duration-200 active:scale-95 mt-6  rounded-lg text-white p-2  '>مشاهده پاسخ دانش آموزان</button>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button onClick={() => setShowLevels(false)} className="px-6 py-2 text-gray-500 hover:bg-blue-100 rounded-xl">انصراف</button>
                                        </div>
                                    </div>


                                )
                                }

                                {isShowStResponses && showLevels && (<StudentResponseGrid data={data} responses={studentReadingData} />)}


                                {showAddHomework && (
                                    <div className="bg-white p-6 rounded-2xl mb-8 border border-purple-100 shadow-sm animate-fade-in">
                                        <h3 className="font-bold text-purple-900 mb-4 flex items-center"><FileText className="ml-2" /> تعریف تکلیف جدید</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input placeholder="عنوان تکلیف" className="p-3 rounded-xl border border-gray-200 outline-none focus:border-purple-500"
                                                value={newHomework.title} onChange={e => setNewHomework({ ...newHomework, title: e.target.value })} />
                                            <input placeholder="تاریخ تحویل (مثال: 1404/12/20)" className="p-3 rounded-xl border border-gray-200 outline-none focus:border-purple-500"
                                                value={newHomework.dueDate} onChange={e => setNewHomework({ ...newHomework, dueDate: e.target.value })} />
                                        </div>
                                        <select className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-purple-500 mb-4 bg-white"
                                            value={newHomework.target} onChange={e => setNewHomework({ ...newHomework, target: e.target.value })}>
                                            <option value="ALL">ارسال برای همه دانش‌آموزان</option>
                                            {data.students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                                        </select>
                                        <textarea placeholder="توضیحات کامل تکلیف..." className="w-full p-3 rounded-xl border border-gray-200 h-24 resize-none outline-none focus:border-purple-500 mb-4"
                                            value={newHomework.description} onChange={e => setNewHomework({ ...newHomework, description: e.target.value })} />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAddHomework(false)} className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-xl">انصراف</button>
                                            <button onClick={handleAddHomework} className="bg-purple-600 text-white px-8 py-2 rounded-xl hover:bg-purple-700 shadow-md">ارسال</button>
                                        </div>


                                    </div>
                                )}

                                {showAddStudent && (
                                    <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 animate-fade-in">
                                        <h3 className="font-bold text-blue-900 mb-4">اطلاعات دانش‌آموز جدید</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                            <input placeholder="نام" className="p-3 rounded-xl border border-blue-100" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} />
                                            <input placeholder="نام خانوادگی" className="p-3 rounded-xl border border-blue-100" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} />
                                            <input placeholder="کد ملی" className="p-3 rounded-xl border border-blue-100" value={newStudent.nationalId} onChange={e => setNewStudent({ ...newStudent, nationalId: e.target.value })} />
                                            <input placeholder="نام پدر" className="p-3 rounded-xl border border-blue-100" value={newStudent.fatherName} onChange={e => setNewStudent({ ...newStudent, fatherName: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button onClick={() => setShowAddStudent(false)} className="px-6 py-2 text-gray-500 hover:bg-blue-100 rounded-xl">انصراف</button>
                                            <button onClick={handleAddStudent} className="bg-blue-600 text-white px-8 py-2 rounded-xl hover:bg-blue-700 shadow-md">افزودن</button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {data.students.map(student => {
                                        const todayAbsent = isAbsent(student._id, getTodayDate());
                                        return (
                                            <div key={student._id}
                                                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative group"
                                                onClick={() => setSelectedStudent(student)}>

                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="bg-gray-100 p-3 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                        <GraduationCap className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{student.firstName} {student.lastName}</h3>
                                                        <p className="text-xs text-gray-400 mt-1">{student.nationalId}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">معدل: <span className="font-bold text-gray-800">{getStudentAverage(student._id)}</span></span>
                                                </div>

                                                <div className={`absolute top-4 left-4 px-2 py-1 rounded-lg text-xs font-bold ${todayAbsent ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                    {todayAbsent ? 'غایب' : 'حاضر'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <div className="max-w-4xl mx-auto animate-slide-up">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800"><BarChart className="text-yellow-500" /> رتبه‌بندی دانش‌آموزان</h2>
                                <div className="bg-white rounded-2xl w-96 sm:w-full  shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-gray-600 text-sm">
                                            <tr>
                                                <th className="p-4 text-center w-20">رتبه</th>
                                                <th className="p-4 text-right">نام دانش‌آموز</th>
                                                <th className="p-4 text-right">نام پدر</th>
                                                <th className="p-4 text-center">معدل کل</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.students
                                                .map(s => ({ ...s, avg: getStudentAverage(s._id) }))
                                                .sort((a, b) => b.avg - a.avg)
                                                .map((s, index) => (
                                                    <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="p-4 text-center">
                                                            {index === 0 ? <span className="text-2xl">🥇</span> :
                                                                index === 1 ? <span className="text-2xl">🥈</span> :
                                                                    index === 2 ? <span className="text-2xl">🥉</span> :
                                                                        <span className="font-bold text-gray-400">{index + 1}</span>}
                                                        </td>
                                                        <td className="p-4 font-medium text-gray-800">{s.firstName} {s.lastName}</td>
                                                        <td className="p-4 text-gray-500">{s.fatherName}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${s.avg >= 17 ? 'bg-green-100 text-green-700' : s.avg >= 14 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                {s.avg}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'courses' && (
                            <div className="max-w-4xl mx-auto animate-slide-up">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">لیست دروس</h2>
                                    <button onClick={() => setShowAddCourse(!showAddCourse)} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-md transition">افزودن درس</button>
                                </div>

                                {showAddCourse && (
                                    <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex gap-3">
                                        <input className="flex-1 p-3 rounded-xl border border-gray-200 outline-none" placeholder="نام درس جدید" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
                                        <button onClick={handleAddCourse} className="bg-green-600 text-white px-6 rounded-xl hover:bg-green-700">ثبت</button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.courses.map((c, index) => (
                                        <div key={c._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center gap-4 hover:border-blue-200 transition">
                                            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            {/* <div className=' flex w-full justify-between'> */}

                                            <span className="font-bold text-gray-700 text-lg">{c.name}</span>
                                            <span onClick={() => removeLesson(index)} className="font-bold text-red-400 hover:text-red-500  p-3 rounded-xl bg-red-100  text-lg "><BookMinus /></span>
                                            {/* </div> */}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
