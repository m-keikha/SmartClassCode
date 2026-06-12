export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  fatherName: string;
  password?: string;
  phoneNumber?: string; // New
  dailyNotes?: { date: string; content: string }[]; // New
}

export interface Course {
  _id: string;
  name: string;
}

export interface Grade {
  _id: string;
  studentId: string;
  courseId: string;
  score: number;
  description?: string;
  date: string;
}

export interface Attendance {
  _id: string;
  studentId: string;
  date: string;
  status: 'absent' | 'present'; // We mainly track 'absent'
}

export interface Homework {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  target: 'ALL' | string; // 'ALL' or specific studentId
  createdAt: string;
}

export interface AIReport {
  _id?: string;
  studentId: string;
  content: string;
  timestamp: number;
}

export interface UserSession {
  role: 'teacher' | 'student';
  studentId?: string;
  name?: string;
}