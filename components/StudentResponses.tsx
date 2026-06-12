import { useState } from "react";

interface IQuestionResponse {
  listeningId: string;
  userResponse: string;
  correctAnswer: string;
  textQuestion: string;
  isCorrect: boolean;
  updatedAt?: Date;
}

interface IStudentResponseDoc {
  _id: string;
  classId: string;
  studentId: string;
  questions: IQuestionResponse[];
  createdAt: Date;
  __v: number;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  fatherName: string;
  password?: string;
  phoneNumber?: string;
  dailyNotes?: { date: string; content: string }[];
}

interface Props {
  responses: IStudentResponseDoc[];
  data: { students: Student[] };
}

interface PopupInfo {
  textQuestion: string;
  userResponse: string;
  correctAnswer: string;
  isCorrect: boolean;
  answered: boolean;
  x: number;
  y: number;
}

export default function StudentResponseGrid({ responses, data }: Props) {
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  const getStudent = (id: string) =>
    data.students.find((s) => s._id === id);

  const allQuestions: { index: number; text: string; listeningId: string }[] = [];
  const seenListeningIds = new Set<string>();

  responses.forEach((r) => {
    r.questions.forEach((q) => {
      if (!seenListeningIds.has(q.listeningId)) {
        seenListeningIds.add(q.listeningId);
        allQuestions.push({
          index: allQuestions.length + 1,
          text: q.textQuestion,
          listeningId: q.listeningId,
        });
      }
    });
  });

  const handleCellClick = (
    e: React.MouseEvent,
    q: IQuestionResponse | null,
    answered: boolean
  ) => {
    if (!q && !answered) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({
      textQuestion: q?.textQuestion ?? "",
      userResponse: q?.userResponse ?? "—",
      correctAnswer: q?.correctAnswer ?? "—",
      isCorrect: q?.isCorrect ?? false,
      answered,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    });
  };

  const getCellStyle = (q: IQuestionResponse | undefined) => {
    if (!q) return "bg-gray-100 text-gray-400 cursor-default border border-gray-200";
    if (q.isCorrect) return "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600";
    return "bg-red-400 text-white cursor-pointer hover:bg-red-500";
  };

  const getCellIcon = (q: IQuestionResponse | undefined) => {
    if (!q) return "–";
    if (q.isCorrect) return "✓";
    return "✗";
  };

  return (
    <div
      className="min-h-screen bg-white text-gray-800 p-8 mb-6 shadow-md rounded-2xl"
      style={{ fontFamily: "'Vazirmatn', 'Tahoma', sans-serif" }}
      dir="rtl"
      onClick={() => setPopup(null)}
    >
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">
          گزارش پاسخ‌های دانش‌آموزان
        </h1>
        <p className="text-gray-500 text-sm">
          {responses.length} دانش‌آموز · {allQuestions.length} سوال
        </p>
        <div className="mt-3 h-1 w-24 bg-gradient-to-l from-violet-500 to-fuchsia-500 rounded-full" />
      </div>

      {/* Questions Legend */}
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          فهرست سوالات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allQuestions.map((q) => (
            <div key={q.listeningId} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {q.index}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                {q.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-5 flex-wrap">
        {[
          { color: "bg-emerald-500", label: "درست" },
          { color: "bg-red-400", label: "اشتباه" },
          { color: "bg-gray-100 border border-gray-200", label: "پاسخ نداده" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-4 h-4 rounded ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky right-0 z-10 bg-gray-50 px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                دانش‌آموز
              </th>
              {allQuestions.map((q) => (
                <th key={q.listeningId} className="px-4 py-4 text-center text-xs font-bold text-gray-500">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-600 font-black">
                    {q.index}
                  </span>
                </th>
              ))}
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                نمره
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response, idx) => {
              const student = getStudent(response.studentId);
              const correctCount = response.questions.filter((q) => q.isCorrect).length;

              return (
                <tr
                  key={response._id}
                  className={`border-b border-gray-100 transition-colors hover:bg-violet-50/40 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                  }`}
                >
                  <td className="sticky right-0 z-10 bg-inherit px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {student ? student.firstName.charAt(0) : "؟"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {student ? `${student.firstName} ${student.lastName}` : 'دانش آموز حذف شده'}
                        </p>
                        {student && (
                          <p className="text-xs text-gray-400">{student.nationalId}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {allQuestions.map((aq) => {
                    const answered = response.questions.find((q) => q.listeningId === aq.listeningId);
                    return (
                      <td key={aq.listeningId} className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(e, answered ?? null, !!answered);
                          }}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm active:scale-95 ${getCellStyle(answered)}`}
                          title={answered ? answered.textQuestion : "پاسخ داده نشده"}
                        >
                          {getCellIcon(answered)}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-5 py-3 text-center">
                    <span
                      className={`text-sm font-black ${
                        correctCount === allQuestions.length
                          ? "text-emerald-500"
                          : correctCount >= allQuestions.length / 2
                          ? "text-amber-500"
                          : "text-red-400"
                      }`}
                    >
                      {correctCount}
                      <span className="text-gray-300 font-normal text-xs">
                        /{allQuestions.length}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Popup */}
      {popup && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 w-80"
          style={{ top: popup.y, left: popup.x }}
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">جزئیات پاسخ</h3>
            <button
              onClick={() => setPopup(null)}
              className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">متن سوال</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                {popup.textQuestion || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">پاسخ دانش‌آموز</p>
                <p
                  className={`text-sm font-semibold rounded-xl p-2.5 text-center ${
                    !popup.answered
                      ? "bg-gray-100 text-gray-400"
                      : popup.isCorrect
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {popup.userResponse}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">پاسخ صحیح</p>
                <p className="text-sm font-semibold bg-emerald-50 text-emerald-600 rounded-xl p-2.5 text-center">
                  {popup.correctAnswer}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  !popup.answered
                    ? "bg-gray-100 text-gray-400"
                    : popup.isCorrect
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {!popup.answered ? "پاسخ داده نشده" : popup.isCorrect ? "✓ درست" : "✗ اشتباه"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}