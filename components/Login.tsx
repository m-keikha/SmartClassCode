import React, { useState } from 'react';
import { User, Shield, GraduationCap, School } from 'lucide-react';
import { getStudents } from '../services/storage';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'selection' | 'teacher' | 'student'>('selection');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleTeacherLogin = () => {

    if (password === 'admin') {
      onLogin({ role: 'teacher' });
    } else {
      setError('رمز عبور اشتباه است (رمز پیش‌فرض: admin)');
    }
  };

  const handleStudentLogin = () => {
    const students = getStudents();
    const student = students.find(s => s.nationalId === nationalId);

    if (student) {
      const studentPass = student.password || student.nationalId;
      if (password === studentPass) {
        onLogin({ role: 'student', studentId: student._id });
      } else {
        setError('رمز عبور اشتباه است.');
      }
    } else {
      setError('دانش‌آموزی با این کد ملی یافت نشد.');
    }
  };

  if (mode === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="flex justify-center mb-6">
            <School className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">سامانه هوشمند مدرسه</h1>
          
          <p className="text-gray-500 mb-10">لطفاً نقش خود را انتخاب کنید</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setMode('teacher')}
              className="group p-6 border-2 border-gray-100 hover:border-blue-500 rounded-xl transition-all duration-300 hover:shadow-lg flex flex-col items-center"
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 transition-colors">
                <Shield className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">پنل معلم</h3>
              <p className="text-sm text-gray-500 mt-2">مدیریت نمرات و دانش‌آموزان</p>
            </button>

            <button 
              onClick={() => setMode('student')}
              className="group p-6 border-2 border-gray-100 hover:border-emerald-500 rounded-xl transition-all duration-300 hover:shadow-lg flex flex-col items-center"
            >
              <div className="bg-emerald-100 p-4 rounded-full mb-4 group-hover:bg-emerald-600 transition-colors">
                <GraduationCap className="w-8 h-8 text-emerald-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">پنل دانش‌آموز</h3>
              <p className="text-sm text-gray-500 mt-2">مشاهده نمرات و کارنامه</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <button 
          onClick={() => { setMode('selection'); setError(''); }}
          className="text-sm text-gray-500 hover:text-blue-600 mb-6 flex items-center gap-1"
        >
          بازگشت به انتخاب نقش
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {mode === 'teacher' ? 'ورود معلم' : 'ورود دانش‌آموز'}
        </h2>

        <div className="space-y-4">
          {mode === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد ملی</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="کد ملی خود را وارد کنید"
                dir="ltr"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور خود را وارد کنید"
              dir="ltr"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={mode === 'teacher' ? handleTeacherLogin : handleStudentLogin}
            className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
              mode === 'teacher' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            ورود به سیستم
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;