import React, { useState, useEffect } from "react";
import "./Attendance.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Attendance = ({ studentData }) => {
  const [subjects, setSubjects] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [attendanceDates, setAttendanceDates] = useState({
    present: [],
    absent: [],
  });

  const studentId = studentData?.studentId || studentData?.student_id;

  useEffect(() => {
    if (studentId) {
      fetchAttendance();
      fetchOverallStats();
    }
  }, [studentId]);

  useEffect(() => {
    if (selectedSubject && studentId) fetchSubjectDates(selectedSubject);
  }, [selectedSubject, calendarDate]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/attendance/${studentId}`,
      );
      const data = await res.json();
      setSubjects(data);
      if (data.length > 0) setSelectedSubject(data[0].subject_code);
    } catch {
      const mock = [
        {
          subject_code: "CS101",
          subject_name: "Data Structures",
          credits: 4,
          total_classes: 45,
          present_count: 38,
          absent_count: 7,
          percentage: 84.4,
        },
        {
          subject_code: "CS102",
          subject_name: "Operating Systems",
          credits: 4,
          total_classes: 40,
          present_count: 32,
          absent_count: 8,
          percentage: 80.0,
        },
        {
          subject_code: "CS103",
          subject_name: "Database Management",
          credits: 3,
          total_classes: 30,
          present_count: 28,
          absent_count: 2,
          percentage: 93.3,
        },
        {
          subject_code: "CS104",
          subject_name: "Computer Networks",
          credits: 3,
          total_classes: 25,
          present_count: 18,
          absent_count: 7,
          percentage: 72.0,
        },
        {
          subject_code: "CS105",
          subject_name: "Software Engineering",
          credits: 3,
          total_classes: 28,
          present_count: 22,
          absent_count: 6,
          percentage: 78.6,
        },
      ];
      setSubjects(mock);
      setSelectedSubject("CS101");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/attendance/${studentId}/stats/overall`,
      );
      setOverallStats(await res.json());
    } catch {
      setOverallStats({
        total_classes: 168,
        total_present: 138,
        total_absent: 30,
        overall_percentage: 82.1,
      });
    }
  };

  const fetchSubjectDates = async (code) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/attendance/${studentId}/${code}`,
      );
      const data = await res.json();
      setAttendanceDates({
        present: data
          .filter((r) => r.status === "present")
          .map((r) => r.date?.substring(0, 10)),
        absent: data
          .filter((r) => r.status === "absent")
          .map((r) => r.date?.substring(0, 10)),
      });
    } catch {
      const y = calendarDate.getFullYear();
      const m = String(calendarDate.getMonth() + 1).padStart(2, "0");
      setAttendanceDates({
        present: [
          `${y}-${m}-03`,
          `${y}-${m}-05`,
          `${y}-${m}-10`,
          `${y}-${m}-12`,
          `${y}-${m}-17`,
          `${y}-${m}-19`,
          `${y}-${m}-24`,
          `${y}-${m}-26`,
        ],
        absent: [`${y}-${m}-07`, `${y}-${m}-14`, `${y}-${m}-21`],
      });
    }
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    let d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };
  const prevMonth = () =>
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const getDayStatus = (day) => {
    const y = calendarDate.getFullYear(),
      m = String(calendarDate.getMonth() + 1).padStart(2, "0");
    const s = `${y}-${m}-${String(day).padStart(2, "0")}`;
    if (attendanceDates.present.includes(s)) return "present";
    if (attendanceDates.absent.includes(s)) return "absent";
    return null;
  };

  const getColor = (pct) => {
    if (pct >= 90)
      return {
        stroke: "#10b981",
        bg: "rgba(16,185,129,0.12)",
        text: "#059669",
        label: "Excellent",
      };
    if (pct >= 75)
      return {
        stroke: "#3b82f6",
        bg: "rgba(59,130,246,0.12)",
        text: "#1d4ed8",
        label: "Good",
      };
    if (pct >= 60)
      return {
        stroke: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
        text: "#b45309",
        label: "Low",
      };
    return {
      stroke: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      text: "#dc2626",
      label: "Critical",
    };
  };

  const CircleProgress = ({ pct, size = 90, strokeW = 8, color }) => {
    const r = (size - strokeW) / 2,
      circ = 2 * Math.PI * r,
      dash = (pct / 100) * circ;
    return (
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--att-track,#f3f4f6)"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
    );
  };

  if (loading)
    return (
      <div className="att-loading">
        <div className="att-spinner" />
        <p>Loading attendance...</p>
      </div>
    );

  const daysInMonth = getDaysInMonth(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
  );
  const firstDayIndex = getFirstDayOfMonth(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
  );
  const today = new Date();
  const selData = subjects.find((s) => s.subject_code === selectedSubject);

  return (
    <div className="att-root">
      {/* Page Title */}
      <div className="att-page-header">
        <h2 className="att-page-title">Attendance</h2>
        <p className="att-page-sub">
          {studentData?.department} · Semester {studentData?.semester}
        </p>
      </div>

      {/* ── Insight Strip ── */}
      <div className="att-insights">
        {[
          {
            label: "Present %",
            value: `${overallStats?.overall_percentage || 0}%`,
            color: "blue",
            change: "↑ On track",
            spark: "M0,25 15,18 25,22 40,10 55,15 65,8 80,12",
          },
          {
            label: "Absent %",
            value: `${overallStats ? (100 - overallStats.overall_percentage).toFixed(1) : 0}%`,
            color: "red",
            change: "↓ Absences",
            spark: "M0,10 15,15 25,12 40,20 55,14 65,22 80,18",
          },
          {
            label: "Total Classes",
            value: overallStats?.total_classes || 0,
            color: "teal",
            change: `📚 ${subjects.length} subjects`,
            spark: "M0,20 15,15 25,18 40,8 55,12 65,6 80,10",
          },
          {
            label: "Present Days",
            value: overallStats?.total_present || 0,
            color: "amber",
            change: `❌ ${overallStats?.total_absent || 0} absent`,
            spark: "M0,22 15,16 25,20 40,10 55,14 65,8 80,12",
          },
        ].map((ins, i) => (
          <div key={i} className={`att-insight att-insight-${ins.color}`}>
            <div className="att-insight-top">
              <span className="att-insight-label">{ins.label}</span>
              <span className="att-insight-period">
                {MONTHS[today.getMonth()].slice(0, 3)}
              </span>
            </div>
            <div className="att-insight-val">{ins.value}</div>
            <svg
              viewBox="0 0 80 32"
              className={`att-spark att-spark-${ins.color}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={ins.spark}
                fill="none"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="att-insight-change">{ins.change}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="att-main-grid">
        {/* LEFT — Subject List */}
        <div className="att-panel">
          <div className="att-panel-hdr">
            <h3>Subjects</h3>
            <span className="att-panel-count">{subjects.length}</span>
          </div>
          <div className="att-subj-list">
            {subjects.map((subj) => {
              const col = getColor(subj.percentage),
                active = selectedSubject === subj.subject_code;
              return (
                <div
                  key={subj.subject_code}
                  className={`att-subj-row ${active ? "att-subj-row--active" : ""}`}
                  onClick={() => {
                    setSelectedSubject(subj.subject_code);
                    fetchSubjectDates(subj.subject_code);
                  }}
                >
                  <div className="att-subj-ring">
                    <CircleProgress
                      pct={subj.percentage}
                      size={54}
                      strokeW={5}
                      color={col.stroke}
                    />
                    <span
                      className="att-subj-ring-pct"
                      style={{ color: col.stroke }}
                    >
                      {subj.percentage}%
                    </span>
                  </div>
                  <div className="att-subj-info">
                    <span className="att-subj-code">{subj.subject_code}</span>
                    <span className="att-subj-name">{subj.subject_name}</span>
                    <span className="att-subj-meta">
                      {subj.present_count}/{subj.total_classes} classes
                    </span>
                  </div>
                  <span
                    className="att-subj-badge"
                    style={{ background: col.bg, color: col.text }}
                  >
                    {col.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Calendar + Detail */}
        <div className="att-right">
          {/* Calendar */}
          <div className="att-cal">
            <div className="att-cal-hdr">
              <button className="att-cal-nav" onClick={prevMonth}>
                ‹
              </button>
              <div className="att-cal-title">
                <strong>{MONTHS[calendarDate.getMonth()]}</strong>
                <span>{calendarDate.getFullYear()}</span>
              </div>
              <button className="att-cal-nav" onClick={nextMonth}>
                ›
              </button>
            </div>

            <div className="att-cal-days">
              {DAYS.map((d) => (
                <span key={d} className="att-cal-day-lbl">
                  {d}
                </span>
              ))}
            </div>

            <div className="att-cal-grid">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`e${i}`} className="att-cal-cell att-cal-empty" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const status = getDayStatus(day);
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === calendarDate.getMonth() &&
                    today.getFullYear() === calendarDate.getFullYear();
                  return (
                    <div
                      key={day}
                      className={`att-cal-cell ${status === "present" ? "att-cal-p" : ""} ${status === "absent" ? "att-cal-a" : ""} ${isToday ? "att-cal-today" : ""}`}
                    >
                      {day}
                    </div>
                  );
                },
              )}
            </div>

            <div className="att-cal-legend">
              <span>
                <span className="att-leg att-leg-p" />
                Present
              </span>
              <span>
                <span className="att-leg att-leg-a" />
                Absent
              </span>
              <span>
                <span className="att-leg att-leg-t" />
                Today
              </span>
            </div>
          </div>

          {/* Subject Detail */}
          {selData && (
            <div className="att-detail">
              <div className="att-detail-hdr">
                <div>
                  <div className="att-detail-code">{selData.subject_code}</div>
                  <div className="att-detail-name">{selData.subject_name}</div>
                </div>
                <div className="att-detail-ring">
                  <CircleProgress
                    pct={selData.percentage}
                    size={70}
                    strokeW={7}
                    color={getColor(selData.percentage).stroke}
                  />
                  <span
                    className="att-detail-ring-pct"
                    style={{ color: getColor(selData.percentage).stroke }}
                  >
                    {selData.percentage}%
                  </span>
                </div>
              </div>

              <div className="att-detail-stats">
                {[
                  {
                    val: selData.present_count,
                    lbl: "Present",
                    cls: "att-green",
                  },
                  { val: selData.absent_count, lbl: "Absent", cls: "att-red" },
                  { val: selData.total_classes, lbl: "Total", cls: "att-blue" },
                  { val: selData.credits, lbl: "Credits", cls: "att-purple" },
                ].map((s, i) => (
                  <div key={i} className="att-detail-stat">
                    <span className={`att-detail-val ${s.cls}`}>{s.val}</span>
                    <span className="att-detail-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>

              <div className="att-detail-prog">
                <div className="att-detail-bar">
                  <div
                    className="att-detail-fill"
                    style={{
                      width: `${selData.percentage}%`,
                      background: getColor(selData.percentage).stroke,
                    }}
                  />
                  <div className="att-detail-marker" />
                </div>
                <div className="att-detail-bar-lbls">
                  <span>0%</span>
                  <span className="att-min-lbl">75% min</span>
                  <span>100%</span>
                </div>
              </div>

              {selData.percentage < 75 ? (
                <div className="att-warn">
                  ⚠️ Attend more classes to reach 75% requirement
                </div>
              ) : (
                <div className="att-safe">
                  ✅ You're meeting the minimum attendance requirement
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
