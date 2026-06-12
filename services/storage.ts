import { Student, Course, Grade, AIReport } from "../types";

const KEYS = {
  STUDENTS: "edusmart_students",
  COURSES: "edusmart_courses",
  GRADES: "edusmart_grades",
  REPORTS: "edusmart_reports",
};

// Helpers
const get = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const set = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Students
export const getStudents = (): Student[] => get(KEYS.STUDENTS, []);

export const saveStudent = (student: Student): void => {
  const students = getStudents();
  set(KEYS.STUDENTS, [...students, student]);
};
export const updateStudent = (updatedStudent: Student): void => {
  const students = getStudents();
  set(
    KEYS.STUDENTS,
    students.map((s) => (s._id === updatedStudent._id ? updatedStudent : s)),
  );
};

// Courses
export const getCourses = (): Course[] => get(KEYS.COURSES, []);
export const saveCourse = (course: Course): void => {
  const courses = getCourses();
  set(KEYS.COURSES, [...courses, course]);
};

// Grades
export const getGrades = (): Grade[] => get(KEYS.GRADES, []);
export const saveGrade = (grade: Grade): void => {
  const grades = getGrades();
  set(KEYS.GRADES, [...grades, grade]);
};

// AI Reports
export const getReports = (): AIReport[] => get(KEYS.REPORTS, []);
export const saveReport = (report: AIReport): void => {
  const reports = getReports();
  // Remove old report for this student if exists
  const filtered = reports.filter((r) => r.studentId !== report.studentId);
  set(KEYS.REPORTS, [...filtered, report]);
};
export const getStudentReport = (studentId: string): AIReport | undefined => {
  return getReports().find((r) => r.studentId === studentId);
};

// Seeding initial data for demo purposes
export const seedData = () => {
  if (getStudents().length === 0) {
    saveCourse({ _id: "c1", name: "ریاضی" });
    saveCourse({ _id: "c2", name: "علوم تجربی" });
    saveCourse({ _id: "c3", name: "ادبیات فارسی" });
  }
};
