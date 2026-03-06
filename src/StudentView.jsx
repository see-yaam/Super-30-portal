import { useState, useEffect, useRef, useCallback } from "react";
import { getHomeworks, getQuestions, addSubmission } from "./supabaseService";
import ProblemsView from "./ProblemsView";

export default function StudentView({ student, onLogout }) {
  const [homeworks, setHomeworks] = useState([]);
  const [selectedHW, setSelectedHW] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [droppedFile, setDroppedFile] = useState(null);
  const [codeContent, setCodeContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("homework");
  const fileInputRef = useRef();

  useEffect(() => {
    getHomeworks().then((data) => {
      setHomeworks(data);
      setLoading(false);
    });
  }, []);

  const handleSelectHW = async (hw) => {
    setSelectedHW(hw);
    setSelectedQuestion(null);
    setCodeContent("");
    setDroppedFile(null);
    setSubmitSuccess(null);
    const qs = await getQuestions(hw.id);
    setQuestions(qs);
    if (qs.length === 1) setSelectedQuestion(qs[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setDroppedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCodeContent(ev.target.result);
      reader.readAsText(file);
    }
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDroppedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCodeContent(ev.target.result);
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestion || !codeContent.trim()) return;
    setSubmitting(true);
    setSubmitSuccess(null);

    const filename = droppedFile
      ? droppedFile.name
      : selectedHW.title + "_solution.txt";

    try {
      const path =
        "students/" +
        student.id +
        "_" +
        student.name.replace(/ /g, "_") +
        "/" +
        selectedHW.title.replace(/ /g, "_") +
        "/" +
        selectedQuestion.title.replace(/ /g, "_") +
        "/" +
        filename;

      const content = btoa(unescape(encodeURIComponent(codeContent)));

      const res = await fetch(
        "https://api.github.com/repos/" +
          import.meta.env.VITE_GITHUB_OWNER +
          "/" +
          import.meta.env.VITE_GITHUB_REPO +
          "/contents/" +
          path,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + import.meta.env.VITE_GITHUB_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: student.id + " - " + student.name + " submitted " + selectedHW.title,
            content,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        await addSubmission({
          student_id: student.id,
          student_name: student.name,
          homework_id: selectedHW.id,
          question_id: selectedQuestion.id,
          filename,
          github_url: data.content.html_url,
          type: "homework",
        });
        setSubmitSuccess({ hw: selectedHW.title, question: selectedQuestion.title });
        setDroppedFile(null);
        setCodeContent("");
      } else {
        setSubmitSuccess({ error: true });
      }
    } catch (err) {
      console.error(err);
      setSubmitSuccess({ error: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="bg-green-600 text-white font-black text-sm px-3 py-1 rounded-lg tracking-widest">
            SUPER-30
          </span>
          <span className="text-gray-300 font-semibold">হ্যালো, {student.name}!</span>
        </div>
        <button
          className="border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
          onClick={onLogout}
        >
          বের হও
        </button>
      </header>

      <div className="bg-gray-900 border-b border-gray-800 px-8 flex gap-1">
        <button
          onClick={() => setTab("homework")}
          className={
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all " +
            (tab === "homework"
              ? "border-green-500 text-green-400"
              : "border-transparent text-gray-400 hover:text-white")
          }
        >
          Homework
        </button>
        <button
          onClick={() => setTab("problems")}
          className={
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all " +
            (tab === "problems"
              ? "border-green-500 text-green-400"
              : "border-transparent text-gray-400 hover:text-white")
          }
        >
          150 Problems
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-6">
        {tab === "problems" && <ProblemsView student={student} />}

        {tab === "homework" && (
          <div>
            {loading ? (
              <p className="text-gray-400">লোড হচ্ছে...</p>
            ) : (
              <div>
                {!selectedHW && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-white text-lg font-bold mb-5">Homework List</h2>
                    <div className="flex flex-col gap-3">
                      {homeworks.map((hw) => (
                        <button
                          key={hw.id}
                          onClick={() => handleSelectHW(hw)}
                          className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-5 py-4 transition-all"
                        >
                          <div className="text-white font-semibold">{hw.title}</div>
                          {hw.description && (
                            <div className="text-gray-400 text-sm mt-1">{hw.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedHW && !selectedQuestion && questions.length > 1 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <button
                      onClick={() => setSelectedHW(null)}
                      className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-2"
                    >
                      {"<- Back"}
                    </button>
                    <h2 className="text-white text-lg font-bold mb-5">{selectedHW.title}</h2>
                    <div className="flex flex-col gap-3">
                      {questions.map((q, i) => (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuestion(q)}
                          className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-5 py-4 transition-all"
                        >
                          <div className="text-blue-400 text-xs mb-1">
                            {selectedHW.title}.{i + 1}
                          </div>
                          <div className="text-white font-semibold">{q.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
                    <button
                      onClick={() => {
                        if (questions.length === 1) setSelectedHW(null);
                        else setSelectedQuestion(null);
                      }}
                      className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
                    >
                      {"<- Back"}
                    </button>

                    <div>
                      <div className="text-blue-400 text-xs mb-1">{selectedHW.title}</div>
                      <h2 className="text-white text-xl font-bold">{selectedQuestion.title}</h2>

                      {selectedQuestion.type === "link" && selectedQuestion.link && (
                        <a
                          href={selectedQuestion.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline text-sm mt-2 inline-block"
                        >
                          Problem দেখো
                        </a>
                      )}

                      {selectedQuestion.type === "text" && selectedQuestion.content && (
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                          {selectedQuestion.content}
                        </p>
                      )}

                      {selectedQuestion.type === "pdf" && selectedQuestion.pdf_url && (
                        <a
                          href={selectedQuestion.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline text-sm mt-2 inline-block"
                        >
                          PDF দেখো
                        </a>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Code File</p>
                      <div
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={
                          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all " +
                          (isDragging
                            ? "border-blue-500 bg-blue-900/10"
                            : "border-gray-700 hover:border-gray-500")
                        }
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".py,.java,.cpp,.c,.js,.ts,.txt"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                        {droppedFile ? (
                          <div className="flex items-center justify-center gap-3 text-green-400">
                            <span className="text-2xl">📄</span>
                            <span className="font-semibold">{droppedFile.name}</span>
                            <span className="text-gray-500 text-xs">
                              ({(droppedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 text-gray-400">
                            <span className="text-3xl">⬆</span>
                            <span className="text-sm">এখানে file drag করো অথবা click করো</span>
                            <span className="text-xs text-gray-600">.py .java .cpp .c .js</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
                        অথবা Code Paste করো
                      </p>
                      <textarea
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-sm font-mono min-h-40 resize-y outline-none"
                        placeholder="# এখানে code paste করো..."
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        spellCheck={false}
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!codeContent.trim() || submitting}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                    >
                      {submitting ? "জমা হচ্ছে..." : "✓ জমা দাও"}
                    </button>

                    {submitSuccess && !submitSuccess.error && (
                      <div className="bg-green-900/20 border border-green-700 rounded-lg px-5 py-4 flex gap-4 items-center text-green-400 text-sm">
                        <span className="text-2xl">🎉</span>
                        <span>
                          <strong>{submitSuccess.question}</strong> সফলভাবে জমা হয়েছে!
                        </span>
                      </div>
                    )}

                    {submitSuccess && submitSuccess.error && (
                      <div className="bg-red-900/20 border border-red-700 rounded-lg px-5 py-4 text-red-400 text-sm">
                        কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করো।
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}