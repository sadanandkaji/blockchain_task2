import React, { useState, useEffect } from "react";
import "./input.css";
import jsPDF from "jspdf";
import { useAuth, ConnectWallet } from "@nfid/identitykit/react";
import { marks_card_gen_backend } from "../../declarations/marks_card_gen_backend";

export default function StudentReportCard() {
  const { user } = useAuth();
  const isConnected = !!user;

  const [name, setName] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [numSubjects, setNumSubjects] = useState("");
  const [average, setAverage] = useState(null);
  const [grade, setGrade] = useState("");
  const [storedReports, setStoredReports] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  // Toggle theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const calculateAverage = (total, subjects) => total / subjects;

  const assignGrade = (avg) => {
    if (avg >= 90) return "A";
    if (avg >= 75) return "B";
    if (avg >= 60) return "C";
    return "D";
  };

  const storeInBackend = async () => {
    try {
      await marks_card_gen_backend.store_report_card(
        name,
        parseInt(totalMarks),
        parseInt(numSubjects)
      );
      console.log("Report stored in backend.");
    } catch (err) {
      console.error("Failed to store report:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseFloat(totalMarks);
    const subjects = parseInt(numSubjects);
    const avg = calculateAverage(total, subjects);
    const grd = assignGrade(avg);
    setAverage(avg);
    setGrade(grd);
    await storeInBackend();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student Report Card", 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${name}`, 20, 40);
    doc.text(`Total Marks: ${totalMarks}`, 20, 50);
    doc.text(`Subjects: ${numSubjects}`, 20, 60);
    doc.text(`Average: ${average?.toFixed(2)}`, 20, 70);
    doc.text(`Grade: ${grade}`, 20, 80);
    doc.save("report_card.pdf");
  };

  const fetchReports = async () => {
    try {
      const reports = await marks_card_gen_backend.get_my_reports();
      setStoredReports(reports);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-gray-100 dark:bg-gray-900 shadow-md sticky top-0 z-50">
        <h1 className="text-xl sm:text-2xl font-bold">📄 Report Card</h1>
        <div className="flex items-center gap-3">
          <ConnectWallet />
          {isConnected && (
            <span className="hidden sm:inline bg-green-600 text-white px-3 py-1 rounded shadow text-sm">
              Connected
            </span>
          )}
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-sm sm:text-base bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded shadow hover:scale-105 transition"
          >
            {isDark ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      {!isConnected ? (
        <div className="text-center mt-20 p-6 bg-yellow-200 text-black rounded-md w-fit mx-auto shadow-lg">
          <p className="text-lg font-semibold">Please connect your wallet to continue.</p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-6 mt-10 bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Enter Student Report</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="w-full p-3 rounded bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="number"
              placeholder="Number of Subjects"
              value={numSubjects}
              onChange={(e) => setNumSubjects(e.target.value)}
              className="w-full p-3 rounded bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded shadow"
            >
              Generate & Store Report
            </button>
          </form>

          {average !== null && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-900 p-4 rounded-xl text-center">
              <p className="text-lg"><strong>Name:</strong> {name}</p>
              <p><strong>Average:</strong> {average.toFixed(2)}</p>
              <p><strong>Grade:</strong> {grade}</p>
              <button
                onClick={generatePDF}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
              >
                Download PDF
              </button>
            </div>
          )}

          <button
            onClick={fetchReports}
            className="mt-6 bg-blue-600 hover:bg-blue-700 w-full text-white py-2 rounded shadow"
          >
            View My Stored Reports
          </button>

          {storedReports.length > 0 && (
  <div className="mt-6">
    <h3 className="text-xl font-bold mb-3">Stored Reports</h3>
    <div className="space-y-4 mt-4">
      {storedReports.map((r, idx) => (
        <div
          key={idx}
          className="w-full bg-gradient-to-br from-indigo-500 to-purple-700 text-white p-6 rounded-2xl shadow-lg"
        >
          <p><strong>Name:</strong> {r.student_name}</p>
          <p><strong>Average:</strong> {r.average.toFixed(2)}</p>
          <p><strong>Grade:</strong> {r.grade}</p>
        </div>
      ))}
    </div>
  </div>
)}

        </div>
      )}
    </div>
  );
}
