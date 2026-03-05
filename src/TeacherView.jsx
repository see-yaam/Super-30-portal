import { useState, useEffect } from "react";
import { STUDENTS, HW_LIST } from "./data";

export default function TeacherView({ onLogout }) {
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/contents/students`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
          },
        }
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const studentFolders = await res.json();
      const result = {};

      await Promise.all(
        studentFolders.map(async (folder) => {
          const studentId = folder.name.split("_")[0];
          const hwRes = await fetch(folder.url, {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
          });
          const hwFolders = await hwRes.json();

          result[studentId] = {};
          await Promise.all(
            hwFolders.map(async (hwFolder) => {
              const hwId = hwFolder.name.split("_")[0];
              const filesRes = await fetch(hwFolder.url, {
                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
                },
              });
              const files = await filesRes.json();
              if (files.length > 0) {
                result[studentId][hwId] = {
                  filename: files[0].name,
                  url: files[0].html_url,
                };
              }
            })
          );
        })
      );

      setSubmissions(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getSubs = (sid) => submissions[sid] || {};

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <span className="bg-blue-600 text-white font-black text-sm px-3 py-1 rounded-lg tracking-widest">SUPER-30</span>
          <span className="text-gray-300 font-semibold">Teacher Dashboard</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSubmissions}
            className="border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onLogout}
            className="border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            বের হও
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "মোট Students", value: STUDENTS.length, color: "text-blue-400" },
            { label: "মোট HW", value: HW_LIST.length, color: "text-purple-400" },
            {
              label: "মোট Submissions",
              value: Object.values(submissions).reduce((a, b) => a + Object.keys(b).length, 0),
              color: "text-green-400",
            },
            {
              label: "সব জমা দিয়েছে",
              value: STUDENTS.filter((s) => Object.keys(getSubs(s.id)).length === HW_LIST.length).length,
              color: "text-yellow-400",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-400 text-xs mt-2">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white text-lg font-bold mb-5">Submission Matrix</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-xs uppercase pb-3 pr-4 min-w-[180px]">Student</th>
                    {HW_LIST.map((hw) => (
                      <th key={hw.id} className="text-center text-gray-400 text-xs uppercase pb-3 px-2" title={hw.title}>
                        {hw.id}
                      </th>
                    ))}
                    <th className="text-center text-gray-400 text-xs uppercase pb-3 px-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map((student, i) => {
                    const subs = getSubs(student.id);
                    const count = Object.keys(subs).length;
                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/40 transition-all ${
                          i % 2 === 0 ? "" : "bg-gray-900/50"
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <td className="py-3 pr-4">
                          <span className="text-gray-500 text-xs mr-2">{student.id}</span>
                          <span className="text-gray-200">{student.name}</span>
                        </td>
                        {HW_LIST.map((hw) => {
                          const done = !!subs[hw.id];
                          return (
                            <td key={hw.id} className="py-3 px-2 text-center">
                              <div
                                className={`w-6 h-6 rounded mx-auto flex items-center justify-center text-xs font-bold ${
                                  done ? "bg-green-600 text-white" : "bg-gray-800"
                                }`}
                              >
                                {done ? "✓" : ""}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              count === HW_LIST.length
                                ? "bg-green-700 text-white"
                                : count > 0
                                ? "bg-blue-900 text-blue-300"
                                : "bg-gray-800 text-gray-500"
                            }`}
                          >
                            {count}/{HW_LIST.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per HW Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white text-lg font-bold mb-5">HW Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HW_LIST.map((hw) => {
              const count = STUDENTS.filter((s) => !!getSubs(s.id)[hw.id]).length;
              const pct = Math.round((count / STUDENTS.length) * 100);
              return (
                <div key={hw.id} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <div className="text-blue-400 text-xs font-bold mb-1">{hw.id}</div>
                  <div className="text-gray-200 text-sm mb-3">{hw.title}</div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-gray-400 text-xs">{count}/{STUDENTS.length} জন</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-gray-400 text-xs">{selectedStudent.id}</p>
                <h3 className="text-white font-bold text-lg">{selectedStudent.name}</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs uppercase pb-3">HW</th>
                  <th className="text-left text-gray-400 text-xs uppercase pb-3">File</th>
                  <th className="text-center text-gray-400 text-xs uppercase pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {HW_LIST.map((hw) => {
                  const sub = getSubs(selectedStudent.id)[hw.id];
                  return (
                    <tr key={hw.id} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300">{hw.title}</td>
                      <td className="py-2">
                        {sub ? (
                          
                            <a href={sub.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:underline text-xs"
                          >
                            {sub.filename}
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2 text-center">
                        {sub ? (
                          <span className="text-green-400 text-xs font-bold">✓ জমা</span>
                        ) : (
                          <span className="text-red-400 text-xs">✗ বাকি</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}