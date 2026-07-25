import React, { useState, useEffect, useRef } from "react";
import "./Grades.css";

// ─── Grade calculation (10-point scale) ───────────────────────
const getGrade = (percentage) => {
  if (percentage >= 90)
    return { letter: "O", label: "Outstanding", points: 10, cls: "gr-o" };
  if (percentage >= 80)
    return { letter: "A+", label: "Excellent", points: 9, cls: "gr-ap" };
  if (percentage >= 70)
    return { letter: "A", label: "Very Good", points: 8, cls: "gr-a" };
  if (percentage >= 60)
    return { letter: "B+", label: "Good", points: 7, cls: "gr-bp" };
  if (percentage >= 50)
    return { letter: "B", label: "Average", points: 6, cls: "gr-b" };
  if (percentage >= 40)
    return { letter: "C", label: "Pass", points: 5, cls: "gr-c" };
  return { letter: "F", label: "Fail", points: 0, cls: "gr-f" };
};

const calcGPA = (subjects) => {
  if (!subjects || subjects.length === 0) return "0.00";
  const totalCredits = subjects.reduce((s, sub) => s + Number(sub.credits), 0);
  const weightedPoints = subjects.reduce(
    (s, sub) =>
      s + getGrade(Number(sub.percentage)).points * Number(sub.credits),
    0,
  );
  return totalCredits ? (weightedPoints / totalCredits).toFixed(2) : "0.00";
};

const Grades = ({ studentData }) => {
  const [grades, setGrades] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [gpaData, setGpaData] = useState([]);
  const [selectedSemester, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef();

  const studentId = studentData?.studentId || studentData?.student_id;

  // ── Fetch on mount ──────────────────────────────────────────
  useEffect(() => {
    if (studentId) {
      fetchSemesters();
      fetchGPA();
    }
  }, [studentId]);

  // ── Re-fetch grades when semester changes ──────────────────
  useEffect(() => {
    if (studentId && selectedSemester !== null) {
      fetchGrades(selectedSemester);
    }
  }, [selectedSemester]);

  // ── API calls ───────────────────────────────────────────────
  const fetchSemesters = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/grades/${studentId}/semesters`,
      );
      if (!res.ok) throw new Error("Failed to fetch semesters");
      const data = await res.json();
      setSemesters(data);
      if (data.length > 0) {
        setSelected(data[data.length - 1]); // default: latest semester
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.log("❌ Error fetching semesters:", err);
      setError("Could not load grade data. Please check your connection.");
      setLoading(false);
    }
  };

  const fetchGrades = async (semester) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5000/api/grades/${studentId}?semester=${semester}`,
      );
      if (!res.ok) throw new Error("Failed to fetch grades");
      const data = await res.json();
      setGrades(data);
    } catch (err) {
      console.log("❌ Error fetching grades:", err);
      setError("Could not load grades. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGPA = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/grades/${studentId}/gpa`,
      );
      if (!res.ok) throw new Error("Failed to fetch GPA");
      const data = await res.json();
      setGpaData(data);
    } catch (err) {
      console.log("❌ Error fetching GPA:", err);
    }
  };

  // ── PDF Download via print ──────────────────────────────────
  const handleDownloadPDF = () => {
    setDownloading(true);
    const printContents = printRef.current.innerHTML;
    const originalBody = document.body.innerHTML;

    // Build a clean print page
    const printHTML = `
      <html>
        <head>
          <title>Grade Report - ${studentData?.name || "Student"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 32px; }
            .gr-print-header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
            .gr-print-header h1 { font-size: 1.4rem; font-weight: 700; color: #111827; }
            .gr-print-header p  { font-size: 0.82rem; color: #6b7280; margin-top: 4px; }
            .gr-print-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.8rem; color: #374151; }
            .gr-print-meta span strong { color: #111827; }
            table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 20px; }
            th { background: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 9px 12px; border: 1px solid #e5e7eb; color: #111827; vertical-align: middle; }
            tr:nth-child(even) td { background: #f9fafb; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; }
            .g-o  { background: #d1fae5; color: #065f46; }
            .g-ap { background: #dbeafe; color: #1e40af; }
            .g-a  { background: #ede9fe; color: #5b21b6; }
            .g-bp { background: #fef3c7; color: #92400e; }
            .g-b  { background: #ffedd5; color: #9a3412; }
            .g-c  { background: #fee2e2; color: #991b1b; }
            .g-f  { background: #fecaca; color: #7f1d1d; }
            .gr-print-footer { display: flex; justify-content: space-between; font-size: 0.78rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; }
            .gr-gpa-box { text-align: center; padding: 12px 24px; background: #f3f4f6; border-radius: 8px; margin-bottom: 20px; display: inline-block; }
            .gr-gpa-box strong { font-size: 1.5rem; color: #111827; display: block; }
            .gr-gpa-box span { font-size: 0.75rem; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="gr-print-header">
            <h1>🎓 Grades & Marks Report Card</h1>
            <p>University ERP System — Official Academic Record</p>
          </div>
          <div class="gr-print-meta">
            <span>Name: <strong>${studentData?.name || "N/A"}</strong></span>
            <span>Student ID: <strong>${studentId || "N/A"}</strong></span>
            <span>Department: <strong>${studentData?.department || "N/A"}</strong></span>
            <span>Semester: <strong>${selectedSemester || "N/A"}</strong></span>
          </div>
          <div style="margin-bottom:20px;">
            <div class="gr-gpa-box">
              <strong>${calcGPA(grades)}</strong>
              <span>Semester GPA / 10</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Subject</th>
                <th>Credits</th>
                <th>Internal</th>
                <th>External</th>
                <th>Total</th>
                <th>%</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${grades
                .map((sub, i) => {
                  const pct = Number(sub.percentage);
                  const grade = getGrade(pct);
                  const max = Number(sub.max_marks);
                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${sub.subject_code}</td>
                    <td>${sub.subject_name}</td>
                    <td>${sub.credits}</td>
                    <td>${sub.internal_marks}</td>
                    <td>${sub.external_marks}</td>
                    <td>${sub.total_marks} / ${max}</td>
                    <td>${pct}%</td>
                    <td><span class="badge ${grade.cls.replace("gr-", "g-")}">${grade.letter}</span></td>
                    <td>${grade.points}</td>
                    <td>${grade.letter === "F" ? "❌ Fail" : "✅ Pass"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="gr-print-footer">
            <span>Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>This is a computer-generated report.</span>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setDownloading(false);
    }, 500);
  };

  // ── Derived values ──────────────────────────────────────────
  const gpa = calcGPA(grades);
  const currentGPA = gpaData.find((g) => g.semester === selectedSemester);
  const passCount = grades.filter(
    (s) => getGrade(Number(s.percentage)).letter !== "F",
  ).length;
  const failCount = grades.length - passCount;
  const totalCredits = grades.reduce((s, sub) => s + Number(sub.credits), 0);

  // ── Loading state ───────────────────────────────────────────
  if (loading)
    return (
      <div className="gr-loading">
        <div className="gr-spinner" />
        <p>Loading grades…</p>
      </div>
    );

  // ── Error state ─────────────────────────────────────────────
  if (error)
    return (
      <div className="gr-error">
        <span className="gr-error-icon">⚠️</span>
        <p>{error}</p>
        <button
          className="gr-retry-btn"
          onClick={() => {
            fetchSemesters();
            fetchGPA();
          }}
        >
          Retry
        </button>
      </div>
    );

  // ── No data ─────────────────────────────────────────────────
  if (semesters.length === 0)
    return (
      <div className="gr-empty">
        <span>📭</span>
        <p>No grade records found for your account.</p>
        <small>Please contact your department if this is incorrect.</small>
      </div>
    );

  // ── Main render ─────────────────────────────────────────────
  return (
    <div className="gr-root" ref={printRef}>
      {/* ── Page header ── */}
      <div className="gr-page-header">
        <div>
          <h2 className="gr-page-title">Grades & Marks</h2>
          <p className="gr-page-sub">
            {studentData?.department} · Semester {selectedSemester}
          </p>
        </div>
        <button
          className={`gr-download-btn ${downloading ? "gr-download-btn--loading" : ""}`}
          onClick={handleDownloadPDF}
          disabled={downloading || grades.length === 0}
        >
          {downloading ? "⏳ Preparing…" : "⬇️ Download PDF"}
        </button>
      </div>

      {/* ── Semester filter tabs ── */}
      <div className="gr-sem-tabs">
        {semesters.map((sem) => (
          <button
            key={sem}
            className={`gr-sem-tab ${selectedSemester === sem ? "gr-sem-tab--active" : ""}`}
            onClick={() => setSelected(sem)}
          >
            Semester {sem}
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className="gr-summary-grid">
        <div className="gr-sum-card gr-sum-card--gpa">
          <span className="gr-sum-label">Semester GPA</span>
          <span className="gr-sum-value">{gpa}</span>
          <span className="gr-sum-sub">out of 10.0</span>
        </div>
        <div className="gr-sum-card">
          <span className="gr-sum-label">Subjects</span>
          <span className="gr-sum-value">{grades.length}</span>
          <span className="gr-sum-sub">this semester</span>
        </div>
        <div className="gr-sum-card gr-sum-card--pass">
          <span className="gr-sum-label">Passed</span>
          <span className="gr-sum-value">{passCount}</span>
          <span className="gr-sum-sub">{failCount} failed</span>
        </div>
        <div className="gr-sum-card">
          <span className="gr-sum-label">Total Credits</span>
          <span className="gr-sum-value">{totalCredits}</span>
          <span className="gr-sum-sub">credit hours</span>
        </div>
      </div>

      {/* ── Marks Table ── */}
      {grades.length === 0 ? (
        <div className="gr-empty">
          <span>📭</span>
          <p>No grades found for Semester {selectedSemester}.</p>
        </div>
      ) : (
        <div className="gr-table-card">
          <div className="gr-table-hdr">
            <h3>Subject-wise Marks</h3>
            <span className="gr-table-count">{grades.length} subjects</span>
          </div>
          <div className="gr-table-wrap">
            <table className="gr-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Credits</th>
                  <th>Internal</th>
                  <th>External</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Points</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((sub, i) => {
                  const pct = Number(sub.percentage);
                  const grade = getGrade(pct);
                  const max = Number(sub.max_marks);
                  return (
                    <tr
                      key={sub.subject_code}
                      className={grade.letter === "F" ? "gr-row--fail" : ""}
                    >
                      <td className="gr-td-num">{i + 1}</td>
                      <td>
                        <span className="gr-code">{sub.subject_code}</span>
                      </td>
                      <td className="gr-td-name">{sub.subject_name}</td>
                      <td className="gr-td-center">{sub.credits}</td>
                      <td className="gr-td-center">{sub.internal_marks}</td>
                      <td className="gr-td-center">{sub.external_marks}</td>
                      <td className="gr-td-center">
                        <span className="gr-total">{sub.total_marks}</span>
                        <span className="gr-max">/{max}</span>
                      </td>
                      <td className="gr-td-center">
                        <div className="gr-pct-wrap">
                          <div className="gr-pct-bar">
                            <div
                              className="gr-pct-fill"
                              style={{
                                width: `${pct}%`,
                                background:
                                  grade.letter === "F" ? "#ef4444" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="gr-pct-val">{pct}%</span>
                        </div>
                      </td>
                      <td className="gr-td-center">
                        <span className={`gr-badge ${grade.cls}`}>
                          {grade.letter}
                        </span>
                      </td>
                      <td className="gr-td-center">
                        <span className="gr-points">{grade.points}</span>
                      </td>
                      <td className="gr-td-center">
                        {grade.letter === "F" ? (
                          <span className="gr-result gr-result--fail">
                            Fail
                          </span>
                        ) : (
                          <span className="gr-result gr-result--pass">
                            Pass
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="gr-tfoot-row">
                  <td colSpan={3} className="gr-tfoot-label">
                    Semester Summary
                  </td>
                  <td className="gr-td-center gr-tfoot-val">{totalCredits}</td>
                  <td colSpan={3}></td>
                  <td className="gr-td-center gr-tfoot-val">
                    {grades.length > 0
                      ? (
                          grades.reduce(
                            (s, sub) => s + Number(sub.percentage),
                            0,
                          ) / grades.length
                        ).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td colSpan={2} className="gr-td-center gr-tfoot-val">
                    GPA: {gpa}
                  </td>
                  <td className="gr-td-center">
                    {failCount === 0 ? (
                      <span className="gr-result gr-result--pass">
                        All Clear
                      </span>
                    ) : (
                      <span className="gr-result gr-result--fail">
                        {failCount} Arrear{failCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── GPA across semesters ── */}
      {gpaData.length > 1 && (
        <div className="gr-gpa-card">
          <div className="gr-table-hdr">
            <h3>GPA across Semesters</h3>
          </div>
          <div className="gr-gpa-grid">
            {gpaData.map((g) => {
              const gpaNum = Number(g.gpa);
              const color =
                gpaNum >= 8.5
                  ? "#22c55e"
                  : gpaNum >= 7
                    ? "#3b82f6"
                    : gpaNum >= 5
                      ? "#f59e0b"
                      : "#ef4444";
              return (
                <div
                  key={g.semester}
                  className={`gr-gpa-sem ${g.semester === selectedSemester ? "gr-gpa-sem--active" : ""}`}
                >
                  <div className="gr-gpa-sem-bar-wrap">
                    <div
                      className="gr-gpa-sem-bar"
                      style={{
                        height: `${(gpaNum / 10) * 80}px`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className="gr-gpa-sem-val" style={{ color }}>
                    {gpaNum.toFixed(1)}
                  </span>
                  <span className="gr-gpa-sem-label">Sem {g.semester}</span>
                </div>
              );
            })}
          </div>
          <div className="gr-gpa-cumulative">
            <span>Cumulative GPA: </span>
            <strong>
              {gpaData.length > 0
                ? (
                    gpaData.reduce((s, g) => s + Number(g.gpa), 0) /
                    gpaData.length
                  ).toFixed(2)
                : "N/A"}
            </strong>
            <span> / 10.0</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
