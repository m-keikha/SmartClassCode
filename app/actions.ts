"use server";
import { cookies } from "next/headers";
import { ObjectId, Types } from "mongoose";

import connectDB from "@/lib/db";
import {
  StudentModel,
  CourseModel,
  GradeModel,
  AttendanceModel,
  HomeworkModel,
  ClassModel,
  ListeningModel,
  ReportModel,
  QuestionModel,
  StudentResponseModel,
} from "@/models";
import { GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";

interface Login {
  email: string;
  password: string;
}

interface VipListening {
  voiceName?: string;
  text?: string;
  transcription?: any;
}

interface ListeningDetail {
  _id: string;
  classId?: string;
  title: string;
  level: string;
  text?: string;
  vipListening?: VipListening;
  vipListeningVoice?: any;
  createdAt: string;
  updatedAt: string;
}

export type Level = "اول" | "دوم" | "سوم" | "چهارم" | "پنجم" | "ششم";

// --- Initialization ---
export async function seedData() {
  await connectDB();
  const count = await CourseModel.countDocuments();
  if (count === 0) {
    await CourseModel.insertMany([
      { name: "ریاضی" },
      { name: "علوم تجربی" },
      { name: "ادبیات فارسی" },
    ]);
  }
}

// --- Fetching ---
export async function getTeacherData() {
  const cookieStore = await cookies();

  const session = cookieStore.get("teacher_session");

  // بررسی اینکه آیا معلم لاگین هست یا خیر
  if (!session || !session.value) {
    return { error: "عدم دسترسی: لطفاً ابتدا وارد شوید." };
  }

  const classId = session.value; // آیدی کلاس که از کوکی گرفتیم

  await connectDB();
  const students = await (StudentModel as any).find({ classId }).lean();
  const courses = await (CourseModel as any).find({ classId }).lean();
  const grades = await (GradeModel as any).find({ classId }).lean();
  const attendance = await (AttendanceModel as any).find({ classId }).lean();
  const homeworks = await (
    HomeworkModel.find({ classId }).sort({ createdAt: -1 }) as any
  ).lean();

  // Convert _id to string for serialization
  const serialize = (arr: any[]) =>
    arr.map((item) => ({ ...item, _id: item._id.toString() }));

  return {
    students: serialize(students),
    courses: serialize(courses),
    grades: serialize(grades),
    attendance: serialize(attendance),
    homeworks: serialize(homeworks),
  };
}

export async function getListeningById(
  id: string,
): Promise<ListeningDetail | null> {
  try {
    await connectDB();

    // بررسی معتبر بودن ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("شناسه نامعتبر است");
    }

    const listening = await ListeningModel.findById(id)
      .populate("classId", "name") // اگر می‌خواید اطلاعات کلاس رو هم بگیرید
      .lean();

    if (!listening) {
      return null;
    }

    // تبدیل به فرمت مناسب برای client
    return {
      _id: listening._id.toString(),
      classId: listening.classId?.toString(),
      title: listening.title,
      level: listening.level,
      text: listening.text,
      vipListening: listening.vipListening,
      vipListeningVoice: listening.vipListeningVoice,
      createdAt: listening.createdAt?.toISOString(),
      updatedAt: listening.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("Error in getListeningById:", error);
    throw new Error("خطا در دریافت اطلاعات listening");
  }
}

export async function studentScoreById(studentId: string) {
  await connectDB();

  const students = await (GradeModel as any).find({ studentId }).lean();

  // تبدیل کل آبجکت به یک Plain Object استاندارد برای Next.js
  const serializedStudents = JSON.parse(JSON.stringify(students));

  return {
    students: serializedStudents,
  };
}

export async function getCourses() {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };

  await connectDB();

  const courses = await (CourseModel as any).find({ classId }).lean();

  // تبدیل کل آبجکت به یک Plain Object استاندارد برای Next.js
  const serializedCourses = JSON.parse(JSON.stringify(courses));

  return {
    courses: serializedCourses,
  };
}

export async function checkStudentLogin(nationalId: string) {
  await connectDB();

  const students = await (StudentModel as any)
    .find({ nationalId: nationalId })
    .lean();

  // تبدیل کل آبجکت به یک Plain Object استاندارد برای Next.js
  const serializedStudents = JSON.parse(JSON.stringify(students));

  return {
    students: serializedStudents,
  };
}

export async function getQuestionsListeningByListeningId(
  listeningId: any,
  studentId: string,
) {
  // const cookieStore = await cookies();
  // const classId = cookieStore.get("teacher_session")?.value;

  // if (!classId) return { success: false, error: "عدم دسترسی" };

  await connectDB();
  const student = await (StudentModel.findById(studentId) as any).lean();
  if (!student) return { success: false };
  // console.log('stId:',student.classId)
  // console.log('st: ',student)

  const questions = await QuestionModel.find({
    listeningId: listeningId,
    classId: student.classId,
  })
    .sort({ createdAt: -1 })
    .lean();

  console.log("q :", questions);
  if (questions) return { success: true, data: questions[0].questions };
  else return { success: false };
}

export async function postQuestion(data: any, id) {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };

  await connectDB();
  console.log(data);
  const q = await QuestionModel.create({
    listeningId: id,
    classId: classId,
    questions: data,
  });
  revalidatePath("/teacher");

  if (q) return { success: true };
  else return { success: false };
}

export async function getListeningTitlesByLevel(level: string) {
  try {
    await connectDB();
    // اعتبارسنجی level
    const validLevels = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"];
    if (!validLevels.includes(level)) {
      throw new Error("سطح وارد شده معتبر نیست");
    }

    // جستجو در دیتابیس و انتخاب فقط title و id
    const listenings = await ListeningModel.find({ level })
      .select("_id title") // فقط _id و title برگردانده می‌شود
      .lean(); // برای بهبود performance

    // فرمت کردن نتایج
    const result = listenings.map((item) => ({
      id: item._id,
      title: item.title,
    }));

    return {
      success: true,
      data: result,
      count: result.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "خطای ناشناخته",
    };
  }
}

export async function getStudentData(studentId: string) {
  await connectDB();
  const student = await (StudentModel.findById(studentId) as any).lean();

  const courses = await (
    CourseModel.find({ classId: student.classId }) as any
  ).lean();
  const grades = await (GradeModel.find({ studentId }) as any).lean();
  const attendance = await (AttendanceModel.find({ studentId }) as any).lean();
  const homeworks = await (
    HomeworkModel.find({ classId: student.classId }).sort({ dueDate: 1 }) as any
  ).lean();
  const report = await (ReportModel.findOne({ studentId }) as any).lean();

  const serialize = (item: any) =>
    item ? { ...item, _id: item._id.toString() } : null;
  const serializeArr = (arr: any[]) =>
    arr.map((item) => ({ ...item, _id: item._id.toString() }));

  return {
    student: serialize(student),
    courses: serializeArr(courses),
    grades: serializeArr(grades),
    attendance: serializeArr(attendance),
    homeworks: serializeArr(homeworks),
    report: serialize(report),
  };
}

export async function checkExistingUser(email: string) {
  await connectDB();

  // ۱. پیدا کردن معلم بر اساس userName (ایمیل)
  const teacherClass = await ClassModel.findOne({ userName: email });

  if (teacherClass) {
    return {
      success: false,
      error: "این ایمیل قبلا ثبت شده است از قسمت ورود اقدام کنید.",
    };
  }
  if (!teacherClass) {
    return { success: true };
  }
}
export async function checkAccessAdmin() {
  const cookieStore = await cookies();

  const classId = cookieStore.get("teacher_session").value;

  // بررسی اینکه آیا معلم لاگین هست یا خیر
  if (!classId) {
    return { error: "عدم دسترسی: لطفاً ابتدا وارد شوید." };
  }

  await connectDB();

  // ۱. پیدا کردن معلم بر اساس userName (ایمیل)
  const teacherClass = await ClassModel.findById(classId);

  if (teacherClass.role === "adminstor") {
    return {
      success: true,
    };
  } else {
    return { success: false, error: "خطای عدم دسترسی" };
  }
}

// --- Mutations ---

export async function loginTeacher(email: string, password: string) {
  try {
    await connectDB();

    // ۱. پیدا کردن معلم بر اساس userName (ایمیل)
    const teacherClass = await ClassModel.findOne({ userName: email });

    if (!teacherClass) {
      return { success: false, error: "کاربری با این ایمیل یافت نشد." };
    }

    // ۲. بررسی پسورد (اگر هش کردید از bcrypt.compare استفاده کنید)
    if (teacherClass.password !== password) {
      return { success: false, error: "رمز عبور اشتباه است." };
    }

    // ۳. ایجاد کوکی برای لاگین ماندن (بسیار مهم)
    // ما ID کلاس را به صورت استرینگ ذخیره می‌کنیم
    const cookieStore = await cookies();

    cookieStore.set("teacher_session", teacherClass._id.toString(), {
      httpOnly: true, // امنیت: دسترسی از طریق جاوااسکریپت فرانت‌اِند ممکن نباشد
      secure: process.env.NODE_ID === "production",
      maxAge: 60 * 60 * 24 * 7, // انقضا: ۷ روز
      path: "/",
    });

    return {
      success: true,
      message: "خوش آمدید!",
      classId: teacherClass._id.toString(),
      teacherName: teacherClass.teacherName,
    };
  } catch (error) {
    return { success: false, error: "خطای سرور" };
  }
}

export async function addStudent(data: any) {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };
  await connectDB();

  await StudentModel.create({ ...data, classId });
  revalidatePath("/teacher");
}

export async function addListening(data: any) {
  // const cookieStore = await cookies();
  // const classId = cookieStore.get("teacher_session")?.value;

  // if (!classId) return { success: false, error: "عدم دسترسی" };
  await connectDB();

  const res = await ListeningModel.create({ ...data });

  revalidatePath("/teacher");
  if (res) return { success: true };
  else return { success: false };
}
export async function listeningUpdateById(data: any, id: any) {
  // const cookieStore = await cookies();
  // const classId = cookieStore.get("teacher_session")?.value;

  // if (!classId) return { success: false, error: "عدم دسترسی" };
  await connectDB();
  const question = [...data];

  const listening = await ListeningModel.findByIdAndUpdate(id, {
    question: question,
  });

  // await ListeningModel.create({ ...data });
  revalidatePath("/teacher");

  if (listening) {
    return { success: true };
  }
}

export async function addClass(data: any) {
  try {
    await connectDB();
    const result = await ClassModel.create({ ...data });
    revalidatePath("/signup/teacher");
    return { success: true, payload: JSON.parse(JSON.stringify(result)) };
  } catch {
    return { success: false, error: "پیام خطا" };
  }
}

export async function addStudentResponse(
  data: any,
  studentId: any,
  listeningId: any,
) {
  await connectDB();

  // پیدا کردن دانش‌آموز برای گرفتن classId
  const student: any = await StudentModel.findById(studentId).lean();
  if (!student) return { success: false, message: "Student not found" };

  // اضافه کردن listeningId به دیتا اگر داخلش نیست (برای اطمینان از جستجوهای بعدی)
  const finalData = { ...data, listeningId: listeningId };

  // ۱. تلاش برای آپدیت سوالی که از قبل در آرایه وجود دارد
  let result = await StudentResponseModel.findOneAndUpdate(
    {
      studentId: studentId,
      classId: student.classId,
      "questions.listeningId": listeningId,
    },
    {
      $set: { "questions.$": finalData },
    },
    { new: true },
  );

  // ۲. اگر مرحله ۱ چیزی پیدا نکرد (یا داکیومنت نیست یا سوال در آرایه نیست)
  if (!result) {
    result = await StudentResponseModel.findOneAndUpdate(
      { studentId: studentId, classId: student.classId },
      {
        $push: { questions: finalData },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );
  }

  return result ? { success: true, result } : { success: false };
}

export async function getStudentResponse() {
  await connectDB();
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };

  const result = await StudentResponseModel.find({
    classId: classId,
  }).lean();

  if (result) return { success: true, result: result };
  else {
    return { success: false };
  }
}
export async function teacherAccess() {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };
  else return { success: true };
}

export async function updateStudent(id: string, data: any) {
  await connectDB();
  const updatedStudent = await StudentModel.findByIdAndUpdate(id, data);
  if (updatedStudent.password) {
    return { success: true };
  }
  revalidatePath("/teacher");
}

export async function addCourse(name: string) {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };
  await connectDB();
  await CourseModel.create({ name, classId: classId });
  revalidatePath("/teacher");
}

export async function addGrade(data: any) {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };
  const gradeData = {
    ...data,
    classId: classId,
  };
  await connectDB();
  const scoreSave = await GradeModel.create(gradeData);
  revalidatePath("/teacher");
  if (scoreSave.score) return true;
  return false;
}

export async function removeGrade(gradeId: any) {
  const cookieStore = await cookies();
  const session = cookieStore.get("teacher_session");
  if (!session || !session.value) {
    return { error: "عدم دسترسی: لطفاً ابتدا وارد شوید." };
  }
  await connectDB();
  const result = await GradeModel.findByIdAndDelete(gradeId);
  revalidatePath("/teacher");

  if (!result) return { error: "خطای ناشناخته در حذف نمره" };
  if (result) return { success: true, message: "عملیات موفق", result: result };
}



export async function addAttendance(studentId: string, date: string) {
  const cookieStore = await cookies();

  const session = cookieStore.get("teacher_session");

  // بررسی اینکه آیا معلم لاگین هست یا خیر
  if (!session || !session.value) {
    return { error: "عدم دسترسی: لطفاً ابتدا وارد شوید." };
  }

  const classId = session.value; // آیدی کلاس که از کوکی گرفتیم

  await connectDB();
  // Check if exists
  const exists = await AttendanceModel.findOne({ studentId, date });
  if (!exists) {
    await AttendanceModel.create({
      studentId,
      date,
      status: "absent",
      classId,
    });
  }
  revalidatePath("/teacher");
}

export async function removeAttendance(studentId: string, date: string) {
  await connectDB();
  await AttendanceModel.findOneAndDelete({ studentId, date });
  revalidatePath("/teacher");
}

export async function removeStudent(studentId: string) {
  await connectDB();
  const deletedStudent = await StudentModel.findByIdAndDelete(studentId);

  if (!deletedStudent) {
    // یعنی هیچ دانشجویی با این آی‌دی پیدا نشد که پاک بشه
    console.log("موردی پیدا نشد!");
  } else {
    console.log("دانشجو با موفقیت حذف شد:", deletedStudent.firstName);
    return {
      firstName: deletedStudent.firstName,
      lastName: deletedStudent.lastName,
    };
  }
  revalidatePath("/teacher");
}

export async function removeCourse(courseId: string) {
  await connectDB();
  const deletedCourse = await CourseModel.findByIdAndDelete(courseId);

  if (!deletedCourse) {
    // یعنی هیچ دانشجویی با این آی‌دی پیدا نشد که پاک بشه
    console.log("موردی پیدا نشد!");
  } else {
    console.log("درس موردنظر با موفقیت حذف شد:", deletedCourse.firstName);
    return {
      name: deletedCourse.name,
    };
  }
  revalidatePath("/teacher");
}

export async function addHomework(data: any) {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (!classId) return { success: false, error: "عدم دسترسی" };

  await connectDB();
  await HomeworkModel.create({ ...data, classId });
  revalidatePath("/teacher");
}

export async function saveAIReport(studentId: string, content: string) {
  await connectDB();
  await ReportModel.findOneAndUpdate(
    { studentId },
    { content, timestamp: Date.now() },
    { upsert: true },
  );
  revalidatePath("/teacher");
}

// --- AI Generation ---
export async function generateAIReportAction(
  student: any,
  grades: any[],
  courses: any[],
) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key missing";

  const ai = new GoogleGenAI({ apiKey });

  const gradeDetails = grades
    .map((g) => {
      const courseName =
        courses.find((c) => c._id.toString() === g.courseId.toString())?.name ||
        "درس نامشخص";
      return `- درس: ${courseName}، نمره: ${g.score}، توضیحات: ${g.description || "ندارد"}`;
    })
    .join("\n");

  const prompt = `
    نقش: مشاور تحصیلی مدرسه.
    دانش‌آموز: ${student.firstName} ${student.lastName}
    نمرات:
    ${gradeDetails}
    
    یک گزارش کوتاه (حداکثر 150 کلمه) تحلیل عملکرد بنویس. نقاط قوت و ضعف و توصیه ارائه بده.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "خطا در تولید متن";
  } catch (e) {
    console.error(e);
    return "خطا در ارتباط با هوش مصنوعی";
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  // پاک کردن کوکی سشن
  cookieStore.delete("teacher_session");

  // اگر کوکی‌های دیگری هم داری اینجا پاک کن
  return { success: true };
}

export async function loginCheck() {
  const cookieStore = await cookies();
  const classId = cookieStore.get("teacher_session")?.value;

  if (classId) return { success: true };
  if (!classId) return { success: false, error: "عدم دسترسی" };
}
