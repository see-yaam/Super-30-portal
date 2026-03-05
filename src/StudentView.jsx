import { useState, useRef, useCallback } from "react";
import { HW_LIST } from "./data";

export default function StudentView({ student, onLogout }) {
  const [selectedHW, setSelectedHW] = useState("");
  const [droppedFile, setDroppedFile] = useState(null);
  const [codeContent, setCodeContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const fileInputRef = useRef();

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
    if (!selectedHW || !codeContent.trim()) return;
    setSubmitting(true);
    setSubmitSuccess(null);

    const hw = HW_LIST.find((h) => h.id === selectedHW);
    const filename = droppedFile ? droppedFile.name : `${selectedHW}_solution.txt`;

    // GitHub API call
    try {
      const path = `students/${student.id}_${student.name.replace(/ /g, "_")}/${selectedHW}_${hw.title.replace(/ /g, "_")}/${filename}`;
      const content = btoa(unescape(encodeURIComponent(codeContent)));

      const res = await fetch(
        `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/contents/${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `${student.id} - ${student.name} submitted ${selectedHW}`,
            content,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSubmissions((prev) => ({
          ...prev,
          [selectedHW]: {
            filename,
            url: data.content.html_url,
            timestamp: new Date().toLocaleString("bn-BD"),
          },
        }));
        setSubmitSuccess({ hw: hw.title });
        setDroppedFile(null);
        setCodeContent("");
        setSelectedHW("");
      } else {
        setSubmitSuccess({ error: true });
      }
    } catch {
      setSubmitSuccess({ error: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="bg-green-600 text-white font-black text-sm px-3 py-1 rounded-lg tracking-widest">SUPER-30</span>
          <span className="text-gray-300 font-semibold">Hello, {student.name}!</span>
        </div>
        <button
          className="border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
          onClick={onLogout}
        >
          বের হও
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-6">
        {/* Progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">তোমার Progress</p>
          <div className="flex flex-wrap gap-3">
            {HW_LIST.map((hw) => {
              const done = !!submissions[hw.id];
              return (
                <div
                  key={hw.id}
                  className={`relative flex flex-col gap-1 px-4 py-3 rounded-lg border text-sm min-w-[120px] ${
                    done
                      ? "bg-green-900/30 border-green-700"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <span className="text-xs text-gray-400 font-bold">{hw.id}</span>
                  <span className="text-gray-200">{hw.title}</span>
                  {done && (
                    <span className="absolute top-2 right-2 text-green-400 font-bold text-xs">✓</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-blue-400 text-sm mt-4">
            {Object.keys(submissions).length} / {HW_LIST.length} জমা দেওয়া হয়েছে
          </p>
        </div>

        {/* Submit */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
          <h2 className="text-white text-lg font-bold">Homework জমা দাও</h2>

          {/* HW Select */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Homework বেছে নাও</p>
            <div className="flex flex-wrap gap-2">
              {HW_LIST.map((hw) => {
                const done = !!submissions[hw.id];
                return (
                  <button
                    key={hw.id}
                    onClick={() => setSelectedHW(hw.id)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                      selectedHW === hw.id
                        ? "bg-blue-900/40 border-blue-500 text-blue-300"
                        : done
                        ? "bg-green-900/20 border-green-700 text-green-400"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {done && "✓ "}{hw.id}: {hw.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drop Zone */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Code File</p>
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-900/10"
                  : "border-gray-700 hover:border-gray-500"
              }`}
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
                  <span className="text-gray-500 text-xs">({(droppedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-gray-400">
                  <span className="text-3xl">⬆</span>
                  <span className="text-sm">এখানে file drag করো অথবা click করো</span>
                  <span className="text-xs text-gray-600">.py · .java · .cpp · .c · .js</span>
                </div>
              )}
            </div>
          </div>

          {/* Code Preview */}
          {codeContent && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Code Preview</p>
              <textarea
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-sm font-mono min-h-40 resize-y outline-none"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedHW || !codeContent.trim() || submitting}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
          >
            {submitting ? "GitHub এ পাঠানো হচ্ছে..." : "✓ জমা দাও"}
          </button>

          {/* Success / Error */}
          {submitSuccess && !submitSuccess.error && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg px-5 py-4 flex gap-4 items-center text-green-400 text-sm">
              <span className="text-2xl">🎉</span>
              <span><strong>{submitSuccess.hw}</strong> সফলভাবে জমা হয়েছে!</span>
            </div>
          )}
          {submitSuccess?.error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg px-5 py-4 text-red-400 text-sm">
              ❌ কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করো।
            </div>
          )}
        </div>

        {/* History */}
        {Object.keys(submissions).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">তোমার Submissions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b border-gray-800">
                  <th className="text-left pb-3">HW</th>
                  <th className="text-left pb-3">File</th>
                  <th className="text-left pb-3">সময়</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(submissions).map(([hwId, sub]) => {
                  const hw = HW_LIST.find((h) => h.id === hwId);
                  return (
                    <tr key={hwId} className="border-b border-gray-800/50">
                      <td className="py-3 text-gray-200">{hw?.title}</td>
                      <td className="py-3 text-gray-400">{sub.filename}</td>
                      <td className="py-3 text-gray-400">{sub.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}