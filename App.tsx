import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { UserSession } from './types';
import { seedData } from './services/storage';
import '../styles/globals.css'
const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {

    seedData();
  }, []);

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-100 min-h-screen">
      {!session ? (
        <Login onLogin={handleLogin} />
      ) : session.role === 'teacher' ? (
        <TeacherDashboard onLogout={handleLogout} />
      ) : (
        <StudentDashboard 
          studentId={session.studentId!} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
};

export default App;