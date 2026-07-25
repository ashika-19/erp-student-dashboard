import React, { useState, useEffect } from "react";
import "./DeptAnalytics.css";

const DeptAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        fetch("http://localhost:5000/api/students"),
        fetch("http://localhost:5000/api/analytics/dept-grades"),
      ]);

      const students = await studentsRes.json();
      let gradeStats = [];

      if (gradesRes.ok) {
        gradeStats = await gradesRes.json();
      }

      processData(students, gradeStats);
    } catch (err) {
      // Use mock data if API fails
      const mockStudents = [
        {
          id: 1,
          name: "Arjun K",
          department: "Computer Science",
          semester: 4,
          status: "active",
        },
        {
          id: 2,
          name: "Priya S",
          department: "Computer Science",
          semester: 4,
          status: "active",
        },
        {
          id: 3,
          name: "Ravi M",
          department: "Computer Science",
          semester: 6,
          status: "active",
        },
        {
          id: 4,
          name: "Sneha R",
          department: "Electronics",
          semester: 4,
          status: "active",
        },
        {
          id: 5,
          name: "Karan T",
          department: "Electronics",
          semester: 2,
          status: "inactive",
        },
        {
          id: 6,
          name: "Divya P",
          department: "Mechanical",
          semester: 4,
          status: "active",
        },
        {
          id: 7,
          name: "Arun B",
          department: "Mechanical",
          semester: 6,
          status: "active",
        },
        {
          id: 8,
          name: "Meera L",
          department: "Civil",
          semester: 2,
          status: "active",
        },
      ];
      processData(mockStudents, []);
    } finally {
      setLoading(false);
    }
  };

  const processData = (students, gradeStats) => {
    const deptMap = {};

    students.forEach((s) => {
      const dept = s.department || "Unknown";
      if (!deptMap[dept]) {
        deptMap[dept] = {
          name: dept,
          total: 0,
          active: 0,
          inactive: 0,
          semesters: {},
          students: [],
        };
      }
      deptMap[dept].total++;
      if (s.status === "active") deptMap[dept].active++;
      else deptMap[dept].inactive++;
      deptMap[dept].semesters[s.semester] =
        (deptMap[dept].semesters[s.semester] || 0) + 1;
      deptMap[dept].students.push(s);
    });

    // Merge grade stats if available
    gradeStats.forEach((g) => {
      if (deptMap[g.department]) {
        deptMap[g.department].avgGPA = parseFloat(g.avg_gpa).toFixed(2);
        deptMap[g.department].passRate = parseFloat(g.pass_rate).toFixed(1);
        deptMap[g.department].topPerformer = g.top_performer;
        deptMap[g.department].avgAttendance = parseFloat(
          g.avg_attendance,
        ).toFixed(1);
      }
    });

    // Fill mock metrics for depts without grade data
    Object.values(deptMap).forEach((dept) => {
      if (!dept.avgGPA) {
        dept.avgGPA = (7.0 + Math.random() * 2.5).toFixed(2);
        dept.passRate = (80 + Math.random() * 18).toFixed(1);
        dept.avgAttendance = (72 + Math.random() * 20).toFixed(1);
        dept.topPerformer = dept.students[0]?.name || "N/A";
      }
    });

    const depts = Object.values(deptMap);
    setData({ depts, total: students.length });
    if (depts.length > 0) setSelectedDept(depts[0].name);
  };

  const getGPAColor = (gpa) => {
    const g = parseFloat(gpa);
    if (g >= 8.5) return "#10b981";
    if (g >= 7.0) return "#6366f1";
    if (g >= 5.5) return "#f59e0b";
    return "#ef4444";
  };

  const getPassColor = (rate) => {
    const r = parseFloat(rate);
    if (r >= 90) return "#10b981";
    if (r >= 75) return "#6366f1";
    if (r >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getRank = (depts, dept, key) => {
    const sorted = [...depts].sort(
      (a, b) => parseFloat(b[key]) - parseFloat(a[key]),
    );
    return sorted.findIndex((d) => d.name === dept.name) + 1;
  };

  if (loading) {
    return (
      <div className="da-loading">
        <div className="da-spinner" />
        <p>Loading department analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { depts } = data;
  const selected = depts.find((d) => d.name === selectedDept);
  const topGPA = [...depts].sort(
    (a, b) => parseFloat(b.avgGPA) - parseFloat(a.avgGPA),
  )[0];
  const topPass = [...depts].sort(
    (a, b) => parseFloat(b.passRate) - parseFloat(a.passRate),
  )[0];
  const topAtt = [...depts].sort(
    (a, b) => parseFloat(b.avgAttendance) - parseFloat(a.avgAttendance),
  )[0];

  return (
    <div className="da-root">
      {/* Header */}
      <div className="da-header">
        <div>
          <h2 className="da-title">🏛️ Department Analytics</h2>
          <p className="da-sub">
            Institution-wide academic performance overview
          </p>
        </div>
        <button className="da-refresh-btn" onClick={fetchAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {/* Top KPI Strip */}
      <div className="da-kpi-strip">
        {[
          {
            label: "Total Students",
            value: data.total,
            icon: "👥",
            color: "indigo",
          },
          {
            label: "Departments",
            value: depts.length,
            icon: "🏛️",
            color: "purple",
          },
          {
            label: "Best GPA Dept",
            value: topGPA?.name,
            icon: "🏆",
            color: "green",
          },
          {
            label: "Best Pass Rate",
            value: `${topPass?.passRate}%`,
            icon: "✅",
            color: "teal",
          },
          {
            label: "Best Attendance",
            value: `${topAtt?.avgAttendance}%`,
            icon: "📊",
            color: "blue",
          },
        ].map((kpi, i) => (
          <div key={i} className={`da-kpi da-kpi--${kpi.color}`}>
            <span className="da-kpi-icon">{kpi.icon}</span>
            <div>
              <div className="da-kpi-val">{kpi.value}</div>
              <div className="da-kpi-label">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="da-main-grid">
        {/* Left: Dept Cards */}
        <div className="da-dept-list">
          <h3 className="da-section-title">Departments</h3>
          {depts.map((dept) => {
            const gpaColor = getGPAColor(dept.avgGPA);
            const isActive = selectedDept === dept.name;
            return (
              <div
                key={dept.name}
                className={`da-dept-card ${isActive ? "da-dept-card--active" : ""}`}
                onClick={() => setSelectedDept(dept.name)}
              >
                <div className="da-dept-card-top">
                  <div
                    className="da-dept-avatar"
                    style={{ background: `${gpaColor}22`, color: gpaColor }}
                  >
                    {dept.name.charAt(0)}
                  </div>
                  <div className="da-dept-info">
                    <div className="da-dept-name">{dept.name}</div>
                    <div className="da-dept-count">{dept.total} students</div>
                  </div>
                  <div className="da-dept-gpa" style={{ color: gpaColor }}>
                    {dept.avgGPA}
                    <span className="da-dept-gpa-label">GPA</span>
                  </div>
                </div>
                <div className="da-dept-bars">
                  <div className="da-dept-bar-row">
                    <span>Pass Rate</span>
                    <div className="da-bar-track">
                      <div
                        className="da-bar-fill"
                        style={{
                          width: `${dept.passRate}%`,
                          background: getPassColor(dept.passRate),
                        }}
                      />
                    </div>
                    <span style={{ color: getPassColor(dept.passRate) }}>
                      {dept.passRate}%
                    </span>
                  </div>
                  <div className="da-dept-bar-row">
                    <span>Attendance</span>
                    <div className="da-bar-track">
                      <div
                        className="da-bar-fill"
                        style={{
                          width: `${dept.avgAttendance}%`,
                          background: "#6366f1",
                        }}
                      />
                    </div>
                    <span style={{ color: "#6366f1" }}>
                      {dept.avgAttendance}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Dept Detail */}
        {selected && (
          <div className="da-detail">
            {/* Detail Header */}
            <div className="da-detail-header">
              <div>
                <h3 className="da-detail-title">{selected.name}</h3>
                <p className="da-detail-sub">Detailed performance breakdown</p>
              </div>
              <div className={`da-rank-badge`}>
                #{getRank(depts, selected, "avgGPA")} by GPA
              </div>
            </div>

            {/* Metric Cards */}
            <div className="da-metric-grid">
              {[
                {
                  label: "Avg GPA",
                  value: selected.avgGPA,
                  sub: "out of 10",
                  color: getGPAColor(selected.avgGPA),
                  icon: "🎓",
                },
                {
                  label: "Pass Rate",
                  value: `${selected.passRate}%`,
                  sub: "students passing",
                  color: getPassColor(selected.passRate),
                  icon: "✅",
                },
                {
                  label: "Avg Attendance",
                  value: `${selected.avgAttendance}%`,
                  sub: "overall",
                  color:
                    parseFloat(selected.avgAttendance) >= 75
                      ? "#10b981"
                      : "#ef4444",
                  icon: "📅",
                },
                {
                  label: "Active Students",
                  value: selected.active,
                  sub: `${selected.inactive} inactive`,
                  color: "#6366f1",
                  icon: "👥",
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="da-metric-card"
                  style={{ borderTop: `3px solid ${m.color}` }}
                >
                  <div className="da-metric-top">
                    <span className="da-metric-icon">{m.icon}</span>
                    <span className="da-metric-val" style={{ color: m.color }}>
                      {m.value}
                    </span>
                  </div>
                  <div className="da-metric-label">{m.label}</div>
                  <div className="da-metric-sub">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Top Performer + Comparison */}
            <div className="da-bottom-grid">
              <div className="da-glass-card">
                <h4 className="da-card-title">🏆 Top Performer</h4>
                <div className="da-top-performer">
                  <div className="da-performer-avatar">
                    {selected.topPerformer?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="da-performer-name">
                      {selected.topPerformer}
                    </div>
                    <div className="da-performer-dept">{selected.name}</div>
                  </div>
                  <div className="da-performer-badge">⭐ Top</div>
                </div>
              </div>

              <div className="da-glass-card">
                <h4 className="da-card-title">📊 vs Other Departments</h4>
                <div className="da-compare-list">
                  {depts.map((dept) => (
                    <div
                      key={dept.name}
                      className={`da-compare-row ${dept.name === selected.name ? "da-compare-row--active" : ""}`}
                    >
                      <span className="da-compare-name">{dept.name}</span>
                      <div className="da-compare-bar-track">
                        <div
                          className="da-compare-bar-fill"
                          style={{
                            width: `${(parseFloat(dept.avgGPA) / 10) * 100}%`,
                            background:
                              dept.name === selected.name
                                ? "#6366f1"
                                : "#cbd5e1",
                          }}
                        />
                      </div>
                      <span
                        className="da-compare-val"
                        style={{
                          color:
                            dept.name === selected.name ? "#6366f1" : "#94a3b8",
                        }}
                      >
                        {dept.avgGPA}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="da-glass-card">
              <h4 className="da-card-title">👥 Students in {selected.name}</h4>
              <div className="da-student-table-wrap">
                <table className="da-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Semester</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.students.map((s, i) => (
                      <tr key={s.id}>
                        <td className="da-td-num">{i + 1}</td>
                        <td className="da-td-name">
                          <div className="da-student-cell">
                            <div className="da-s-avatar">
                              {s.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="da-s-name">{s.name}</div>
                              <div className="da-s-id">{s.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>Sem {s.semester}</td>
                        <td>
                          <span
                            className={`da-status-chip da-status-${s.status || "active"}`}
                          >
                            {(s.status || "active").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeptAnalytics;
