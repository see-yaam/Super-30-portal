import { useState, useEffect, useRef, useCallback } from "react";
import { getProblemsByCategory, getStudentProblemSubmissions, addProblemSubmission } from "./supabaseService";

export default function ProblemsView({ student }) {
  const [grouped, setGrouped] = useState({});
  const [solvedMap, setSolvedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [droppedFile, setDroppedFile] = useState(null);
  const [codeContent, setCodeContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    Promise.all([
      getProblemsByCategory(),
      getStudentProblemSubmissions(student.id),
    ]).then(([g, subs]) => {
      setGrouped(g);
      const map = {};
      subs.forEach((s) => {
        map[s.question_id] = true;
      });
      setSolvedMap(map);
      setLoading(false);
    });
  }, [student.id]);

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
    if (!codeContent.trim()) return;
    setSubmitting(true);
    setSubmitSuccess(null);

    const filename = droppedFile
      ? droppedFile.name
      : "problem_" + selectedProblem.serial + "_solution.txt";

    try {
      const path =
        "students/" +
        student.id +
        "_" +
        student.name.replace(/ /g, "_") +
        "/problems/" +
        selectedProblem.serial +
        "_" +
        selectedProblem.title.replace(/ /g, "_") +
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
            message:
              student.id +
              " solved problem " +
              selectedProblem.serial +
              ": " +
              selectedProblem.title,
            content,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        await addProblemSubmission({
          student_id: student.id,
          student_name: student.name,
          question_id: selectedProblem.id,
          filename,
          github_url: data.content.html_url,
          type: "problem",
        });

        setSolvedMap((prev) => ({ ...prev, [selectedProblem.id]: true }));
        setSubmitSuccess("success");
        setDroppedFile(null);
        setCodeContent("");
      } else {
        setSubmitSuccess("error");
      }
    } catch (err) {
      console.error(err);
      setSubmitSuccess("error");
    }
    setSubmitting(false);
  };

  const totalSolved = Object.keys(solvedMap).length;

  if (loading) {
    return (
      <p className="text-gray-400 p-6">
        লোড হচ্ছে...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Progress</p>
          <p className="text-white font-bold text-xl">{totalSolved} / 150 solved</p>
        </div>
        <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: (totalSolved / 150) * 100 + "%" }}
          />
        </div>
      </div>

      {!selectedProblem && (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([category, problems]) => (
            <div key={category} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-3">
                {category}
              </h3>
              <div className="flex flex-col gap-2">
                {problems.map((p) => {
                  const solved = !!solvedMap[p.id];
                  return (
                    <div
                      key={p.id}
                      className={
                        "flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-all " +
                        (solved
                          ? "bg-green-900/20 border-green-700 hover:bg-green-900/30"
                          : "bg-gray-800 border-gray-700 hover:bg-gray-700")
                      }
                      onClick={() => {
                        setSelectedProblem(p);
                        setSubmitSuccess(null);
                        setCodeContent("");
                        setDroppedFile(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs w-6">{p.serial}</span>
                        <span
                          className={
                            "text-sm font-medium " +
                            (solved ? "text-green-400" : "text-gray-200")
                          }
                        >
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:underline text-xs"
                          >
                            LeetCode
                          </a>
                        )}
                        {solved && (
                          <span className="text-green-400 font-bold text-sm">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProblem && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
          <button
            onClick={() => setSelectedProblem(null)}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
          >
            {"<- Back"}
          </button>

          <div>
            <span className="text-gray-500 text-xs">
              {selectedProblem.category} #{selectedProblem.serial}
            </span>
            <h2 className="text-white text-xl font-bold mt-1">
              {selectedProblem.title}
            </h2>
            {selectedProblem.link && (
              <a
                href={selectedProblem.link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline text-sm mt-2 inline-block"
              >
                LeetCode এ দেখো
              </a>
            )}
          </div>

          {solvedMap[selectedProblem.id] && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg px-4 py-3 text-green-400 text-sm">
              ✓ তুমি এই problem আগেই solve করেছো!
            </div>
          )}

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
              Code File
            </p>
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
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
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-gray-400">
                  <span className="text-3xl">⬆</span>
                  <span className="text-sm">
                    এখানে file drag করো অথবা click করো
                  </span>
                  <span className="text-xs text-gray-600">
                    .py .java .cpp .c .js
                  </span>
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
            {submitting ? "জমা হচ্ছে..." : "✓ Submit Solution"}
          </button>

          {submitSuccess === "success" && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg px-5 py-4 text-green-400 text-sm">
              🎉 Solution জমা হয়েছে! সবুজ হয়ে গেছে!
            </div>
          )}
          {submitSuccess === "error" && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg px-5 py-4 text-red-400 text-sm">
              কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করো।
            </div>
          )}
        </div>
      )}
    </div>
  );
}