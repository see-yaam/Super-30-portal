import TeacherView from "./TeacherView";
import StudentView from "./StudentView";
import { useState } from "react";
import { STUDENTS } from "./data";

const TEACHER_ID = "3014";

export default function App() {
  const [loginInput, setLoginInput] = useState("");
  const [error, setError] = useState("");
  const [currentStudent, setCurrentStudent] = useState(null);
  const [view, setView] = useState("login");
  const [teacherPrompt, setTeacherPrompt] = useState(false);
  const [teacherInput, setTeacherInput] = useState("");
  const [teacherError, setTeacherError] = useState("");

  const handleLogin = () => {
    const input = loginInput.trim();
    const student = STUDENTS.find(
      (s) =>
        s.id === input ||
        s.name.toLowerCase() === input.toLowerCase()
    );
    if (student) {
      setCurrentStudent(student);
      setView("student");
      setError("");
    } else {
      setError("Student ID বা নাম পাওয়া যায়নি!");
    }
  };

  const handleTeacherLogin = () => {
    if (teacherInput.trim() === TEACHER_ID) {
      setView("teacher");
      setTeacherError("");
    } else {
      setTeacherError("ভুল ID!");
    }
  };

  if (view === "login") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-96 flex flex-col gap-5 shadow-2xl">
          <div className="flex justify-center">
            <div className="bg-green-600 text-white font-black text-xl px-5 py-3 rounded-xl tracking-widest">
              SUPER-30
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold text-center">DSA Portal</h1>
          <p className="text-gray-400 text-sm text-center">তোমার ID অথবা নাম দাও</p>
          <input
            className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-500"
            placeholder="যেমন: 3001 অথবা MD ROHAN"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all"
            onClick={handleLogin}
          >
            প্রবেশ করো →
          </button>

          <button
            className="border border-gray-700 text-gray-400 hover:text-white py-2 rounded-lg text-sm transition-all"
            onClick={() => setTeacherPrompt(!teacherPrompt)}
          >
            👨‍🏫 Teacher Dashboard
          </button>

          {teacherPrompt && (
            <div className="flex flex-col gap-3">
              <input
                className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                placeholder="Teacher ID দাও"
                value={teacherInput}
                onChange={(e) => setTeacherInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTeacherLogin()}
                autoFocus
              />
              {teacherError && (
                <p className="text-red-400 text-sm text-center">{teacherError}</p>
              )}
              <button
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-all"
                onClick={handleTeacherLogin}
              >
                ঢুকো →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

if (view === "student") {
    return (
      <StudentView
        student={currentStudent}
        onLogout={() => { setView("login"); setLoginInput(""); }}
      />
    );
  }

if (view === "teacher") {
    return (
      <TeacherView
        onLogout={() => { setView("login"); setLoginInput(""); }}
      />
    );
  }
}