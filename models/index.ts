import mongoose, { Schema, model, models } from "mongoose";
import { string } from "yup";

const classSchema = new Schema({
  className: String,
  teacherName: String,
  schoolName: String,
  password: { type: String, required: true }, 
  userName: { type: String, required: true, unique: true }, // اضافه شده برای لاگین
  role: { type: String, default: "teacher", required: true },
});

// Student Schema
const studentSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true,
  },
  firstName: String,
  lastName: String,
  nationalId: { type: String, unique: true },
  fatherName: String,
  password: { type: String, default: "" },
  phoneNumber: { type: String, default: "" },
  dailyNotes: [
    {
      date: String,
      content: String,
    },
  ],
});


const courseSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: "Class", index: true },

  name: String,
});


const gradeSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true,
  },
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  score: Number,
  description: String,
  date: String,
});


const attendanceSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    index: true,
  },
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  date: String, 
  status: { type: String, enum: ["absent", "present"], default: "absent" },
});

const StudentsReadingResponseSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    index: true,
    required: true,
  },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  questions: { type: [Schema.Types.Mixed], default: [] },
});
// if (models.StudentResponse) {
//   delete mongoose.models.StudentResponse;
// }

const homeworkSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true,
  },
  title: String,
  description: String,
  dueDate: String,
  target: String, // 'ALL' or Student ObjectId
  createdAt: { type: Date, default: Date.now },
});

const QuestionSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
  },
  listeningId: { type: Schema.Types.ObjectId, ref: "Listening" },
  questions: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const ListeningSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },

    title: {
      type: String,
      // required: [true, "عنوان الزامی است"],
      trim: true,
    },

    level: {
      type: String,
      // required: [true, "سطح الزامی است"],
      enum: ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"], 
    },

    text: {
      type: String,
    },

    vipListening: {
      voiceName: { type: String },
      text: { type: String },
      transcription: { type: Schema.Types.Mixed }, 
    },

    vipListeningVoice: {
      type: Schema.Types.Mixed, 
    },
  },
  {
    timestamps: true, 
  },
);


const reportSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true,
  },
  studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  content: String,
  timestamp: Number,
});

if (models.Class) {
  delete models.Class;
}





const MediaVariantSchema = new Schema({
  text: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  audioPublicId: { type: String, default: '' },
});

const SentenceVariantSchema = new Schema({
  text: { type: String, required: true },
  audioUrl: { type: String, default: '' },
  audioPublicId: { type: String, default: '' },
});

const AlphabetSchema = new Schema(
  {
    letterGroup: { 
      type: String, 
      required: [true, 'نام گروه حرف الفبایی الزامی است'], 
      unique: true, 
      trim: true 
    },
    letterVariants: [MediaVariantSchema],
    examples: [MediaVariantSchema],
    sentences: [SentenceVariantSchema],
  },
  { 
    timestamps: true 
  }
);







export const ListeningModel =
  models.Listening || model("Listening", ListeningSchema);

export const QuestionModel =
  models.Question || model("Question", QuestionSchema);

export const StudentResponseModel =
  models.StudentResponse ||
  model("StudentResponse", StudentsReadingResponseSchema);
export const ClassModel = models.Class || model("Class", classSchema);
export const StudentModel = models.Student || model("Student", studentSchema);
export const CourseModel = models.Course || model("Course", courseSchema);
export const GradeModel = models.Grade || model("Grade", gradeSchema);
export const AttendanceModel =
  models.Attendance || model("Attendance", attendanceSchema);
export const HomeworkModel =
  models.Homework || model("Homework", homeworkSchema);
export const ReportModel = models.Report || model("Report", reportSchema);
export const Alphabet = models.Alphabet || model('Alphabet', AlphabetSchema);
