import React, { useState, useEffect } from "react";
import "./AnalyticsHub.css";

const AnalyticsHub = ({ studentData }) => {
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [classAverage, setClassAverage] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState("simulator");

  // Grade Simulator states
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [simulatedScore, setSimulatedScore] = useState(75);
  const [currentGPA, setCurrentGPA] = useState(null);
  const [simulatedGPA, setSimulatedGPA] = useState(null);

  // Attendance Recovery states
  const [recoveryData, setRecoveryData] = useState([]);

  // Peer Benchmark states
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [showBenchmark, setShowBenchmark] = useState(false);

  useEffect(() => {
    if (studentData?.studentId || studentData?.student_id) {
      fetchData();
    }
  }, [studentData]);

  const fetchData = async () => {
    const studentId = studentData.studentId || studentData.student_id;
    try {
      // Fetch grades
      const gradesRes = await fetch(
        `http://localhost:5000/api/grades/${studentId}`,
      );
      const gradesData = await gradesRes.json();
      setGrades(gradesData);

      // Fetch attendance
      const attendanceRes = await fetch(
        `http://localhost:5000/api/attendance/${studentId}`,
      );
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);

      // Fetch GPA
      const gpaRes = await fetch(
        `http://localhost:5000/api/grades/${studentId}/gpa`,
      );
      const gpaData = await gpaRes.json();
      const currentSemesterGPA = gpaData.find(
        (g) => g.semester === studentData.semester,
      );
      setCurrentGPA(currentSemesterGPA?.gpa || 0);

      // ✅ Pass gradesData directly so it's available immediately
      await fetchClassAverages(studentId, gradesData);

      // Calculate attendance recovery
      calculateRecovery(attendanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Accept gradesData as a parameter instead of reading from state
  const fetchClassAverages = async (studentId, gradesData) => {
    try {
      // Get all students in same department and semester
      const studentsRes = await fetch(`http://localhost:5000/api/students`);
      const allStudents = await studentsRes.json();

      const sameDeptSem = allStudents.filter(
        (s) =>
          s.department === studentData.department &&
          s.semester === studentData.semester &&
          s.student_id !== studentId,
      );

      // Fetch grades for each student and calculate averages
      const averages = {};

      // ✅ Use gradesData param, not grades state (which would be stale here)
      for (const subject of gradesData) {
        let totalPercent = 0;
        let count = 0;

        for (const otherStudent of sameDeptSem) {
          try {
            const otherGradesRes = await fetch(
              `http://localhost:5000/api/grades/${otherStudent.student_id}`,
            );
            const otherGrades = await otherGradesRes.json();
            const matchingGrade = otherGrades.find(
              (g) => g.subject_code === subject.subject_code,
            );
            if (matchingGrade && matchingGrade.percentage) {
              totalPercent += parseFloat(matchingGrade.percentage);
              count++;
            }
          } catch (e) {
            console.log("Error fetching peer grades");
          }
        }

        averages[subject.subject_code] =
          count > 0 ? (totalPercent / count).toFixed(1) : 0;
      }
      setClassAverage(averages);

      // ✅ Use gradesData param here too
      const benchmark = gradesData.map((grade) => ({
        subject: grade.subject_name,
        subjectCode: grade.subject_code,
        yourScore: parseFloat(grade.percentage),
        classAvg: parseFloat(averages[grade.subject_code]) || 0,
        difference: (
          parseFloat(grade.percentage) -
          (parseFloat(averages[grade.subject_code]) || 0)
        ).toFixed(1),
        credits: grade.credits,
      }));
      setBenchmarkData(benchmark);
    } catch (error) {
      console.error("Error fetching class averages:", error);
    }
  };

  const calculateRecovery = (attendanceData) => {
    const recovery = attendanceData.map((subj) => {
      const totalClasses = subj.total_classes || 0;
      const presentCount = subj.present_count || 0;
      const currentPct = subj.percentage || 0;

      if (currentPct >= 75) {
        return {
          ...subj,
          neededClasses: 0,
          currentPct: currentPct,
          message: "✅ Already above 75%",
          canSkip: Math.floor((presentCount - 0.75 * totalClasses) / 0.75),
        };
      }

      // Calculate classes needed: (present + x) / (total + x) = 0.75
      const needed = Math.ceil((0.75 * totalClasses - presentCount) / 0.25);

      return {
        ...subj,
        neededClasses: Math.max(0, needed),
        currentPct: currentPct,
        message:
          needed > 0 ? `Need ${needed} more consecutive classes` : "On track!",
        canSkip: 0,
      };
    });
    setRecoveryData(recovery);
  };

  const calculateGradePoint = (percentage) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
  };

  const calculateNewGPA = () => {
    if (!selectedSubject || !grades.length) return null;

    const currentSubjects = grades.filter(
      (g) => g.semester == studentData.semester,
    );
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const subject of currentSubjects) {
      let percentage = parseFloat(subject.percentage);
      if (subject.subject_code === selectedSubject.subject_code) {
        percentage = simulatedScore;
      }
      const gradePoint = calculateGradePoint(percentage);
      totalGradePoints += gradePoint * (subject.credits || 3);
      totalCredits += subject.credits || 3;
    }

    const newGPA =
      totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    return newGPA;
  };

  const handleSimulate = () => {
    const newGPA = calculateNewGPA();
    setSimulatedGPA(newGPA);
  };

  const getPerformanceLevel = (difference) => {
    const diff = parseFloat(difference);
    if (diff > 10) return "excellent";
    if (diff > 5) return "good";
    if (diff > -5) return "average";
    if (diff > -10) return "below";
    return "poor";
  };

  if (loading) {
    return (
      <div className="ah-loading">
        <div className="ah-spinner"></div>
        <p>Loading Analytics Hub...</p>
      </div>
    );
  }

  return (
    <div className="analytics-hub">
      {/* Feature Tabs */}
      <div className="ah-tabs">
        <button
          className={`ah-tab ${activeFeature === "simulator" ? "active" : ""}`}
          onClick={() => setActiveFeature("simulator")}
        >
          📊 Grade Simulator
        </button>
        <button
          className={`ah-tab ${activeFeature === "recovery" ? "active" : ""}`}
          onClick={() => setActiveFeature("recovery")}
        >
          📈 Attendance Recovery
        </button>
        <button
          className={`ah-tab ${activeFeature === "benchmark" ? "active" : ""}`}
          onClick={() => setActiveFeature("benchmark")}
        >
          🎯 Peer Benchmark
        </button>
      </div>

      {/* Grade Simulator */}
      {activeFeature === "simulator" && (
        <div className="ah-feature">
          <div className="ah-feature-header">
            <h2>🎓 Grade What-If Simulator</h2>
            <p>See how your GPA changes based on your next exam score</p>
          </div>

          <div className="ah-simulator-container">
            <div className="ah-selector">
              <label>Select Subject:</label>
              <select
                onChange={(e) => {
                  const subject = grades.find(
                    (g) => g.subject_code === e.target.value,
                  );
                  setSelectedSubject(subject);
                  setSimulatedScore(
                    subject ? parseFloat(subject.percentage) : 75,
                  );
                }}
                value={selectedSubject?.subject_code || ""}
              >
                <option value="">Choose a subject...</option>
                {grades
                  .filter((g) => g.semester == studentData.semester)
                  .map((grade, idx) => (
                    <option key={idx} value={grade.subject_code}>
                      {grade.subject_name} (Current: {grade.percentage}%)
                    </option>
                  ))}
              </select>
            </div>

            {selectedSubject && (
              <>
                <div className="ah-slider-container">
                  <label>
                    Next Exam Score: <strong>{simulatedScore}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulatedScore}
                    onChange={(e) =>
                      setSimulatedScore(parseInt(e.target.value))
                    }
                    className="ah-slider"
                  />
                  <div className="ah-slider-marks">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <button
                  className="ah-btn ah-btn-primary"
                  onClick={handleSimulate}
                >
                  Calculate New GPA
                </button>

                {simulatedGPA && (
                  <div className="ah-result">
                    <div className="ah-gpa-comparison">
                      <div className="ah-gpa-card">
                        <span className="ah-gpa-label">Current GPA</span>
                        <span className="ah-gpa-value">
                          {currentGPA || "N/A"}
                        </span>
                      </div>
                      <div className="ah-gpa-arrow">→</div>
                      <div className="ah-gpa-card ah-gpa-new">
                        <span className="ah-gpa-label">New GPA</span>
                        <span className="ah-gpa-value">{simulatedGPA}</span>
                      </div>
                    </div>
                    <div className="ah-insight">
                      {simulatedGPA > (currentGPA || 0) ? (
                        <p>
                          🎉 Great! Your GPA will increase by{" "}
                          {(simulatedGPA - currentGPA).toFixed(2)} points
                        </p>
                      ) : simulatedGPA < (currentGPA || 0) ? (
                        <p>
                          ⚠️ Your GPA will decrease by{" "}
                          {(currentGPA - simulatedGPA).toFixed(2)} points.
                          Consider improving your preparation!
                        </p>
                      ) : (
                        <p>📊 Your GPA will remain the same</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Attendance Recovery Calculator */}
      {activeFeature === "recovery" && (
        <div className="ah-feature">
          <div className="ah-feature-header">
            <h2>📊 Attendance Recovery Calculator</h2>
            <p>
              Know exactly how many classes you need to reach 75% attendance
            </p>
          </div>

          <div className="ah-recovery-container">
            <div className="ah-recovery-summary">
              <div className="ah-stats-card">
                <span className="ah-stats-icon">⚠️</span>
                <div>
                  <div className="ah-stats-label">Subjects Below 75%</div>
                  <div className="ah-stats-value">
                    {recoveryData.filter((r) => r.neededClasses > 0).length}
                  </div>
                </div>
              </div>
              <div className="ah-stats-card">
                <span className="ah-stats-icon">📚</span>
                <div>
                  <div className="ah-stats-label">Total Classes Needed</div>
                  <div className="ah-stats-value">
                    {recoveryData.reduce((sum, r) => sum + r.neededClasses, 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="ah-subject-list">
              {recoveryData.map((subject, idx) => (
                <div
                  key={idx}
                  className={`ah-subject-card ${subject.neededClasses > 0 ? "warning" : "success"}`}
                >
                  <div className="ah-subject-header">
                    <span className="ah-subject-name">
                      {subject.subject_name}
                    </span>
                    <span
                      className={`ah-subject-status ${subject.neededClasses > 0 ? "danger" : "safe"}`}
                    >
                      {subject.neededClasses > 0 ? "⚠️ At Risk" : "✅ Safe"}
                    </span>
                  </div>
                  <div className="ah-attendance-bar">
                    <div
                      className="ah-attendance-fill"
                      style={{ width: `${Math.min(100, subject.currentPct)}%` }}
                    ></div>
                  </div>
                  <div className="ah-subject-details">
                    <span>
                      Current: <strong>{subject.currentPct}%</strong>
                    </span>
                    <span>
                      Target: <strong>75%</strong>
                    </span>
                    {subject.neededClasses > 0 ? (
                      <span className="ah-needed">
                        Need: <strong>{subject.neededClasses}</strong> more
                        classes
                      </span>
                    ) : (
                      <span className="ah-can-skip">
                        Can skip: <strong>{subject.canSkip}</strong> classes
                      </span>
                    )}
                  </div>
                  {subject.neededClasses > 0 && (
                    <div className="ah-recovery-tip">
                      💡 Tip: Attend {subject.neededClasses} consecutive classes
                      for this subject to reach 75%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Peer Benchmark Anonymizer */}
      {activeFeature === "benchmark" && (
        <div className="ah-feature">
          <div className="ah-feature-header">
            <h2>🎯 Peer Benchmark (Anonymous)</h2>
            <p>
              See where you stand compared to class average - No names revealed
            </p>
          </div>

          <div className="ah-benchmark-container">
            <div className="ah-benchmark-summary">
              <div className="ah-benchmark-stats">
                <div className="ah-bench-stat">
                  <span className="ah-bench-icon">📈</span>
                  <div>
                    <div>Above Average Subjects</div>
                    <strong>
                      {benchmarkData.filter((b) => b.difference > 0).length}
                    </strong>
                  </div>
                </div>
                <div className="ah-bench-stat">
                  <span className="ah-bench-icon">📉</span>
                  <div>
                    <div>Below Average Subjects</div>
                    <strong>
                      {benchmarkData.filter((b) => b.difference < 0).length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="ah-benchmark-table">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Your Score</th>
                    <th>Class Average</th>
                    <th>Difference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkData.map((item, idx) => {
                    const diff = parseFloat(item.difference);
                    const status =
                      diff > 0 ? "above" : diff < 0 ? "below" : "equal";
                    return (
                      <tr key={idx} className={`ah-benchmark-row ${status}`}>
                        <td className="ah-subject-cell">{item.subject}</td>
                        <td className="ah-score-cell">{item.yourScore}%</td>
                        <td className="ah-avg-cell">{item.classAvg}%</td>
                        <td
                          className={`ah-diff-cell ${diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral"}`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                          {diff !== 0 && (diff > 0 ? "▲" : "▼")}
                        </td>
                        <td className="ah-status-cell">
                          {diff > 10 && (
                            <span className="ah-badge ah-badge-excellent">
                              Excellent
                            </span>
                          )}
                          {diff > 0 && diff <= 10 && (
                            <span className="ah-badge ah-badge-good">Good</span>
                          )}
                          {diff === 0 && (
                            <span className="ah-badge ah-badge-average">
                              Average
                            </span>
                          )}
                          {diff < 0 && diff >= -10 && (
                            <span className="ah-badge ah-badge-below">
                              Below Avg
                            </span>
                          )}
                          {diff < -10 && (
                            <span className="ah-badge ah-badge-poor">
                              Needs Work
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ah-benchmark-insight">
              <div className="ah-insight-card">
                <span className="ah-insight-icon">📊</span>
                <div>
                  <h4>Anonymous Analysis</h4>
                  <p>
                    {benchmarkData.filter((b) => b.difference > 0).length >
                    benchmarkData.filter((b) => b.difference < 0).length
                      ? `🎉 You're performing above class average in ${benchmarkData.filter((b) => b.difference > 0).length} out of ${benchmarkData.length} subjects. Keep it up!`
                      : `📚 Focus on improving in ${benchmarkData.filter((b) => b.difference < 0).length} subjects where you're below average.`}
                  </p>
                  <p className="ah-privacy-note">
                    🔒 All data is anonymous - peer identities are never
                    revealed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsHub;
