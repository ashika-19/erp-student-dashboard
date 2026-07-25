import React, { useState, useEffect, useRef } from "react";
import "./Teacherdashboard.css";

// ── API Configuration ──────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

// ── Main Component ─────────────────────────────────────────────
export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState("All");
  const [attendanceData, setAttendanceData] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeForm, setGradeForm] = useState({
    marks: "",
    grade: "",
    remarks: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    priority: "medium",
    class: "All",
  });
  const [darkMode, setDarkMode] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const notifTimer = useRef(null);

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // ── Fetch Real Data ────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch students
        console.log("🔍 Fetching students...");
        const studentsRes = await fetch(`${API_BASE}/students`);

        if (!studentsRes.ok) {
          throw new Error(`HTTP error! status: ${studentsRes.status}`);
        }

        const studentsData = await studentsRes.json();
        console.log("✅ Students received:", studentsData);

        if (Array.isArray(studentsData)) {
          setStudents(studentsData);

          // Initialize attendance data
          const initAtt = {};
          studentsData.forEach((s) => {
            initAtt[s.id] = "present";
          });
          setAttendanceData(initAtt);
        }

        // Fetch teacher data (using first teacher for demo)
        console.log("🔍 Fetching teachers...");
        const teachersRes = await fetch(`${API_BASE}/teachers`);

        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          console.log("✅ Teachers received:", teachersData);

          if (teachersData && teachersData.length > 0) {
            const teacherData = teachersData[0];
            setTeacher({
              name: teacherData.name,
              subject: teacherData.department,
              employeeId: teacherData.teacher_id,
              avatar: teacherData.name.charAt(0),
              email: teacherData.email,
              phone: teacherData.phone || "+91 98765 43210",
              qualification: teacherData.qualification,
              experience: calculateExperience(teacherData.joining_date),
            });
          }
        }

        // Fetch activities as announcements
        console.log("🔍 Fetching activities...");
        const activitiesRes = await fetch(`${API_BASE}/dashboard/stats`);

        if (activitiesRes.ok) {
          const statsData = await activitiesRes.json();
          if (
            statsData.recentActivities &&
            statsData.recentActivities.length > 0
          ) {
            setAnnouncements(
              statsData.recentActivities.map((act) => ({
                id: act.id,
                title: act.action,
                message: act.details,
                date: act.created_at
                  ? act.created_at.split("T")[0]
                  : new Date().toISOString().split("T")[0],
                priority: "medium",
                class: "All",
              })),
            );
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
        showNotif("❌ Failed to load data", "error");
      }
    };

    fetchData();
  }, []);

  // Helper function to calculate experience from joining date
  const calculateExperience = (joiningDate) => {
    if (!joiningDate) return "N/A";
    const joined = new Date(joiningDate);
    const now = new Date();
    const years = now.getFullYear() - joined.getFullYear();
    return `${years} Years`;
  };

  // Mock Schedule (will need backend endpoint later)
  const MOCK_SCHEDULE = [
    {
      id: 1,
      day: "Mon",
      time: "09:00",
      subject: teacher?.subject || "Computer Science",
      class: "CS-A",
      room: "Lab 3",
      duration: "1h 30m",
      type: "Lab",
    },
    {
      id: 2,
      day: "Mon",
      time: "11:30",
      subject: teacher?.subject || "Computer Science",
      class: "CS-B",
      room: "Room 12",
      duration: "1h",
      type: "Lecture",
    },
    {
      id: 3,
      day: "Tue",
      time: "10:00",
      subject: teacher?.subject || "Computer Science",
      class: "CS-C",
      room: "Room 5",
      duration: "1h",
      type: "Lecture",
    },
    {
      id: 4,
      day: "Wed",
      time: "09:00",
      subject: teacher?.subject || "Computer Science",
      class: "CS-A",
      room: "Room 8",
      duration: "1h",
      type: "Lecture",
    },
    {
      id: 5,
      day: "Wed",
      time: "14:00",
      subject: teacher?.subject || "Computer Science",
      class: "CS-B",
      room: "Lab 1",
      duration: "2h",
      type: "Lab",
    },
    {
      id: 6,
      day: "Thu",
      time: "11:00",
      subject: teacher?.subject || "Computer Science",
      class: "CS-C",
      room: "Room 12",
      duration: "1h",
      type: "Lecture",
    },
    {
      id: 7,
      day: "Fri",
      time: "09:30",
      subject: teacher?.subject || "Computer Science",
      class: "CS-A",
      room: "Seminar",
      duration: "2h",
      type: "Review",
    },
  ];

  useEffect(() => {
    document.body.classList.toggle("td-dark", darkMode);
    return () => document.body.classList.remove("td-dark");
  }, [darkMode]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  };

  // ── Computed stats based on real student data ─────────────────
  const departments = [
    ...new Set(students.map((s) => s.department).filter(Boolean)),
  ];

  const classStudents =
    selectedClass === "All"
      ? students
      : students.filter((s) => s.department === selectedClass);

  const filteredStudents = students.filter(
    (s) =>
      !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const presentCount = Object.values(attendanceData).filter(
    (v) => v === "present",
  ).length;
  const absentCount = Object.values(attendanceData).filter(
    (v) => v === "absent",
  ).length;

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "short" })
    .substring(0, 3);
  const todaySchedule = MOCK_SCHEDULE.filter((s) => s.day === today);

  // ── Handlers ──────────────────────────────────────────────
  const toggleAttendance = (id) => {
    setAttendanceData((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
    setAttendanceSaved(false);
  };

  const saveAttendance = async () => {
    setAttendanceSaved(true);
    showNotif("✅ Attendance saved successfully!");
  };

  const handleGradeSave = async () => {
    setShowGradeModal(false);
    showNotif("✅ Grade updated successfully!");
  };

  const handleAnnouncement = async () => {
    const newAnn = {
      id: announcements.length + 1,
      ...announcementForm,
      date: new Date().toISOString().split("T")[0],
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    setShowAnnouncement(false);
    setAnnouncementForm({
      title: "",
      message: "",
      priority: "medium",
      class: "All",
    });
    showNotif("📢 Announcement posted!");
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showNotif("🗑️ Announcement deleted", "warning");
  };

  const openGradeModal = (student) => {
    setSelectedStudent(student);
    setGradeForm({ marks: "", grade: "", remarks: "" });
    setShowGradeModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "inactive":
        return "status-inactive";
      case "graduated":
        return "status-graduated";
      default:
        return "status-active";
    }
  };

  if (loading) {
    return (
      <div className="td-root">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.2rem",
            color: "#666",
          }}
        >
          <div className="spinner"></div>
          <p style={{ marginLeft: "15px" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`td-root${darkMode ? " td-dark" : ""}`}>
      {/* Notification Toast */}
      {notification && (
        <div className={`td-toast td-toast--${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="td-sidebar">
        <div className="td-sidebar__brand">
          <div className="td-brand-icon">🎓</div>
          <div className="td-brand-text">
            <span className="td-brand-name">EduAdmin</span>
            <span className="td-brand-role">Teacher Portal</span>
          </div>
        </div>

        <nav className="td-sidebar__nav">
          {[
            { id: "overview", icon: "⚡", label: "Overview" },
            { id: "students", icon: "👥", label: "Students" },
            { id: "attendance", icon: "📋", label: "Attendance" },
            { id: "grades", icon: "📊", label: "Grades" },
            { id: "schedule", icon: "🗓️", label: "Schedule" },
            { id: "announcements", icon: "📢", label: "Announcements" },
          ].map((item) => (
            <button
              key={item.id}
              className={`td-nav-item${activeTab === item.id ? " td-nav-item--active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="td-nav-icon">{item.icon}</span>
              <span className="td-nav-label">{item.label}</span>
              {activeTab === item.id && <span className="td-nav-pill" />}
            </button>
          ))}
        </nav>

        <div className="td-sidebar__footer">
          <button
            className="td-dark-toggle"
            onClick={() => setDarkMode((d) => !d)}
            title="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            className="td-profile-mini"
            onClick={() => setShowProfile(true)}
          >
            <div className="td-avatar-sm">{teacher?.avatar || "T"}</div>
            <div className="td-profile-mini__info">
              <span className="td-profile-name">
                {teacher?.name?.split(" ")[0] || "Teacher"}
              </span>
              <span className="td-profile-sub">
                {teacher?.subject || "Subject"}
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="td-main">
        {/* Top Bar */}
        <header className="td-topbar">
          <div className="td-topbar__left">
            <h1 className="td-page-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="td-page-subtitle">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="td-topbar__right">
            <div className="td-search-wrap">
              <span className="td-search-icon">🔍</span>
              <input
                className="td-search"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="td-btn td-btn--primary"
              onClick={() => setShowAnnouncement(true)}
            >
              <span>📢</span> Announce
            </button>
            <button
              className="td-avatar-btn"
              onClick={() => setShowProfile(true)}
            >
              {teacher?.avatar || "T"}
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="td-content">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="td-overview">
              {/* Welcome banner */}
              <div className="td-welcome-banner">
                <div className="td-welcome-text">
                  <h2>
                    Good Morning, {teacher?.name?.split(" ")[1] || "Teacher"} 👋
                  </h2>
                  <p>
                    You have <strong>{todaySchedule.length} classes</strong>{" "}
                    today and <strong>{students.length} total students</strong>.
                  </p>
                </div>
                <div className="td-welcome-art">
                  <div className="td-art-circle td-art-circle--1" />
                  <div className="td-art-circle td-art-circle--2" />
                  <div className="td-art-circle td-art-circle--3" />
                  <span className="td-art-emoji">📚</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="td-stats-grid">
                <div className="td-stat-card td-stat-card--indigo">
                  <div className="td-stat-icon">👥</div>
                  <div className="td-stat-info">
                    <span className="td-stat-label">Total Students</span>
                    <span className="td-stat-value">{students.length}</span>
                    <span className="td-stat-sub">
                      Across {departments.length} depts
                    </span>
                  </div>
                </div>

                <div className="td-stat-card td-stat-card--green">
                  <div className="td-stat-icon">✅</div>
                  <div className="td-stat-info">
                    <span className="td-stat-label">Active Students</span>
                    <span className="td-stat-value">
                      {students.filter((s) => s.status === "active").length}
                    </span>
                    <span className="td-stat-sub">
                      {students.filter((s) => s.status === "inactive").length}{" "}
                      inactive
                    </span>
                  </div>
                </div>

                <div className="td-stat-card td-stat-card--amber">
                  <div className="td-stat-icon">🏛️</div>
                  <div className="td-stat-info">
                    <span className="td-stat-label">Departments</span>
                    <span className="td-stat-value">{departments.length}</span>
                    <span className="td-stat-sub">
                      {departments.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="td-stat-card td-stat-card--cyan">
                  <div className="td-stat-icon">🗓️</div>
                  <div className="td-stat-info">
                    <span className="td-stat-label">Classes Today</span>
                    <span className="td-stat-value">
                      {todaySchedule.length}
                    </span>
                    <span className="td-stat-sub">
                      {todaySchedule.length > 0
                        ? `Next: ${todaySchedule[0]?.time}`
                        : "No classes"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom grid */}
              <div className="td-overview-grid">
                {/* Today's schedule */}
                <div className="td-card">
                  <div className="td-card__header">
                    <h3>📅 Today's Schedule</h3>
                    <span className="td-badge td-badge--blue">
                      {todaySchedule.length} Classes
                    </span>
                  </div>
                  <div className="td-schedule-list">
                    {todaySchedule.length === 0 && (
                      <p className="td-empty">No classes today 🎉</p>
                    )}
                    {todaySchedule.map((cls) => (
                      <div
                        className={`td-schedule-item td-schedule-item--${cls.type.toLowerCase()}`}
                        key={cls.id}
                      >
                        <div className="td-schedule-time">
                          <span>{cls.time}</span>
                          <span className="td-schedule-dur">
                            {cls.duration}
                          </span>
                        </div>
                        <div className="td-schedule-bar" />
                        <div className="td-schedule-info">
                          <strong>{cls.subject}</strong>
                          <span>
                            {cls.class} · {cls.room}
                          </span>
                        </div>
                        <span
                          className={`td-type-badge td-type-badge--${cls.type.toLowerCase()}`}
                        >
                          {cls.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Students */}
                <div className="td-card">
                  <div className="td-card__header">
                    <h3>👥 Recent Students</h3>
                    <button
                      className="td-btn td-btn--ghost"
                      onClick={() => setActiveTab("students")}
                    >
                      View All <span style={{ marginLeft: "5px" }}>→</span>
                    </button>
                  </div>
                  <div className="td-recent-list">
                    {students.length > 0 ? (
                      students.slice(0, 5).map((student) => (
                        <div className="td-recent-item" key={student.id}>
                          <div
                            className="td-recent-avatar"
                            style={{
                              background:
                                student.status === "active"
                                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  : student.status === "inactive"
                                    ? "#9ca3af"
                                    : "#6b7280",
                            }}
                          >
                            {student.name?.[0] || "S"}
                          </div>
                          <div className="td-recent-info">
                            <strong>{student.name}</strong>
                            <span>
                              {student.department || "N/A"} · Sem{" "}
                              {student.semester || "N/A"}
                            </span>
                            <small
                              style={{
                                color:
                                  student.status === "active"
                                    ? "#10b981"
                                    : student.status === "inactive"
                                      ? "#f59e0b"
                                      : "#6b7280",
                                fontSize: "11px",
                                display: "block",
                                marginTop: "2px",
                              }}
                            >
                              {student.status || "active"}
                            </small>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              className={`td-status-dot ${attendanceData[student.id] === "present" ? "present" : "absent"}`}
                              title={
                                attendanceData[student.id] === "present"
                                  ? "Present today"
                                  : "Absent today"
                              }
                            />
                            <button
                              className="td-icon-btn td-icon-btn--view"
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowGradeModal(true);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "16px",
                                cursor: "pointer",
                                padding: "4px",
                                borderRadius: "4px",
                                opacity: 0.6,
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = 1)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = 0.6)
                              }
                              title="Quick grade"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="td-empty-state"
                        style={{ padding: "30px 20px" }}
                      >
                        <span>👥</span>
                        <p>No students found</p>
                        <button
                          className="td-btn td-btn--primary"
                          onClick={() => setActiveTab("students")}
                          style={{ marginTop: "10px" }}
                        >
                          Add Students
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick stats footer */}
                  {students.length > 0 && (
                    <div
                      style={{
                        marginTop: "15px",
                        paddingTop: "15px",
                        borderTop: "1px solid #eef2f6",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      <span>
                        ✅ Present:{" "}
                        {
                          Object.values(attendanceData).filter(
                            (v) => v === "present",
                          ).length
                        }
                      </span>
                      <span>
                        ❌ Absent:{" "}
                        {
                          Object.values(attendanceData).filter(
                            (v) => v === "absent",
                          ).length
                        }
                      </span>
                      <span>📊 Total: {students.length}</span>
                    </div>
                  )}
                </div>

                {/* Recent announcements */}
                <div className="td-card td-card--wide">
                  <div className="td-card__header">
                    <h3>📢 Recent Announcements</h3>
                    <button
                      className="td-btn td-btn--ghost"
                      onClick={() => setShowAnnouncement(true)}
                    >
                      + New
                    </button>
                  </div>
                  <div className="td-ann-list">
                    {announcements.slice(0, 3).map((ann) => (
                      <div
                        className={`td-ann-item td-ann-item--${ann.priority}`}
                        key={ann.id}
                      >
                        <div className="td-ann-priority-dot" />
                        <div className="td-ann-body">
                          <div className="td-ann-title">{ann.title}</div>
                          <div className="td-ann-msg">{ann.message}</div>
                          <div className="td-ann-meta">
                            <span
                              className={`td-badge td-badge--${ann.priority}`}
                            >
                              {ann.priority}
                            </span>
                            <span>{ann.class}</span>
                            <span>{ann.date}</span>
                          </div>
                        </div>
                        <button
                          className="td-ann-del"
                          onClick={() => deleteAnnouncement(ann.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="td-students">
              <div className="td-toolbar">
                <div className="td-class-tabs">
                  <button
                    className={`td-class-tab${selectedClass === "All" ? " active" : ""}`}
                    onClick={() => setSelectedClass("All")}
                  >
                    All
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      className={`td-class-tab${selectedClass === dept ? " active" : ""}`}
                      onClick={() => setSelectedClass(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                <span className="td-count-badge">
                  {filteredStudents.length} students
                </span>
              </div>

              <div className="td-student-grid">
                {filteredStudents
                  .filter(
                    (s) =>
                      selectedClass === "All" || s.department === selectedClass,
                  )
                  .map((student, i) => (
                    <div
                      className="td-student-card"
                      key={student.id}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="td-student-card__top">
                        <div className="td-student-avatar">
                          {student.name?.[0] || "S"}
                        </div>
                        <div className="td-student-info">
                          <strong>{student.name}</strong>
                          <span>
                            {student.student_id} · {student.department} · Sem{" "}
                            {student.semester}
                          </span>
                        </div>
                        <span className={`status-badge ${student.status}`}>
                          {student.status}
                        </span>
                      </div>

                      <div className="td-student-stats">
                        <div className="td-mini-stat">
                          <span className="td-mini-label">Email</span>
                          <span className="td-mini-value">{student.email}</span>
                        </div>
                        <div className="td-mini-stat">
                          <span className="td-mini-label">Phone</span>
                          <span className="td-mini-value">
                            {student.phone || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="td-student-card__actions">
                        <button
                          className="td-icon-btn td-icon-btn--edit"
                          onClick={() => openGradeModal(student)}
                        >
                          ✏️ Grade
                        </button>
                        <span
                          className={`td-status-dot ${attendanceData[student.id] === "present" ? "present" : "absent"}`}
                        >
                          {attendanceData[student.id] === "present"
                            ? "● Present"
                            : "● Absent"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === "attendance" && (
            <div className="td-attendance">
              <div className="td-toolbar">
                <div className="td-class-tabs">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      className={`td-class-tab${selectedClass === dept ? " active" : ""}`}
                      onClick={() => setSelectedClass(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                <div className="td-att-meta">
                  <span className="td-att-stat present">
                    ✓ Present: {presentCount}
                  </span>
                  <span className="td-att-stat absent">
                    ✗ Absent: {absentCount}
                  </span>
                </div>
              </div>

              <div className="td-att-table-wrap">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Today</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`td-tr ${attendanceData[s.id] === "absent" ? "td-tr--absent" : ""}`}
                      >
                        <td className="td-td-num">{i + 1}</td>
                        <td>
                          <div className="td-cell-student">
                            <div className="td-table-avatar">
                              {s.name?.[0] || "S"}
                            </div>
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="td-mono">{s.student_id}</span>
                        </td>
                        <td>{s.department}</td>
                        <td>{s.semester}</td>
                        <td>
                          <span
                            className={`td-status-badge ${attendanceData[s.id] === "present" ? "present" : "absent"}`}
                          >
                            {attendanceData[s.id] === "present"
                              ? "Present"
                              : "Absent"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`td-toggle-btn ${attendanceData[s.id] === "present" ? "present" : "absent"}`}
                            onClick={() => toggleAttendance(s.id)}
                          >
                            {attendanceData[s.id] === "present"
                              ? "Mark Absent"
                              : "Mark Present"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="td-att-footer">
                <button
                  className="td-btn td-btn--primary"
                  onClick={saveAttendance}
                >
                  {attendanceSaved ? "✅ Saved!" : "💾 Save Attendance"}
                </button>
              </div>
            </div>
          )}

          {/* GRADES TAB */}
          {activeTab === "grades" && (
            <div className="td-grades">
              <div className="td-att-table-wrap">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={s.id} className="td-tr">
                        <td className="td-td-num">{i + 1}</td>
                        <td>
                          <div className="td-cell-student">
                            <div className="td-table-avatar">
                              {s.name?.[0] || "S"}
                            </div>
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td>{s.student_id}</td>
                        <td>{s.department}</td>
                        <td>{s.semester}</td>
                        <td>
                          <span className={`status-badge ${s.status}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="td-icon-btn td-icon-btn--edit"
                            onClick={() => openGradeModal(s)}
                          >
                            ✏️ Add Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === "schedule" && (
            <div className="td-schedule">
              <div className="td-week-grid">
                {DAYS.map((day) => (
                  <div className="td-day-col" key={day}>
                    <div
                      className={`td-day-header ${day === today ? "today" : ""}`}
                    >
                      {day}
                      {day === today && <span className="td-today-dot" />}
                    </div>
                    <div className="td-day-slots">
                      {MOCK_SCHEDULE.filter((s) => s.day === day).length ===
                        0 && <div className="td-free-slot">Free</div>}
                      {MOCK_SCHEDULE.filter((s) => s.day === day).map((cls) => (
                        <div
                          className={`td-slot td-slot--${cls.type.toLowerCase()}`}
                          key={cls.id}
                        >
                          <div className="td-slot-time">{cls.time}</div>
                          <div className="td-slot-subject">{cls.subject}</div>
                          <div className="td-slot-meta">
                            {cls.class} · {cls.room}
                          </div>
                          <div className="td-slot-dur">{cls.duration}</div>
                          <span
                            className={`td-slot-type td-type-badge--${cls.type.toLowerCase()}`}
                          >
                            {cls.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === "announcements" && (
            <div className="td-announcements">
              <div className="td-toolbar">
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                  All Announcements
                </h3>
                <button
                  className="td-btn td-btn--primary"
                  onClick={() => setShowAnnouncement(true)}
                >
                  + New Announcement
                </button>
              </div>
              <div className="td-ann-full-list">
                {announcements.map((ann, i) => (
                  <div
                    className={`td-ann-card td-ann-card--${ann.priority}`}
                    key={ann.id}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="td-ann-card__left">
                      <div
                        className={`td-ann-icon td-ann-icon--${ann.priority}`}
                      >
                        {ann.priority === "high"
                          ? "🔴"
                          : ann.priority === "medium"
                            ? "🟡"
                            : "🟢"}
                      </div>
                    </div>
                    <div className="td-ann-card__body">
                      <div className="td-ann-card__title">{ann.title}</div>
                      <div className="td-ann-card__msg">{ann.message}</div>
                      <div className="td-ann-card__footer">
                        <span className={`td-badge td-badge--${ann.priority}`}>
                          {ann.priority.toUpperCase()}
                        </span>
                        <span className="td-ann-class">📚 {ann.class}</span>
                        <span className="td-ann-date">🗓️ {ann.date}</span>
                      </div>
                    </div>
                    <button
                      className="td-ann-del-btn"
                      onClick={() => deleteAnnouncement(ann.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="td-empty-state">
                    <span>📭</span>
                    <p>No announcements yet</p>
                    <button
                      className="td-btn td-btn--primary"
                      onClick={() => setShowAnnouncement(true)}
                    >
                      Create One
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && teacher && (
        <div
          className="td-modal-backdrop"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="td-modal td-modal--profile"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="td-modal-close"
              onClick={() => setShowProfile(false)}
            >
              ✕
            </button>
            <div className="td-profile-header">
              <div className="td-profile-avatar">{teacher.avatar}</div>
              <div>
                <h2>{teacher.name}</h2>
                <p>
                  {teacher.subject} · {teacher.employeeId}
                </p>
              </div>
            </div>
            <div className="td-profile-details">
              <div className="td-profile-row">
                <span className="td-profile-icon">📧</span>
                <div>
                  <span className="td-profile-label">Email</span>
                  <span className="td-profile-value">{teacher.email}</span>
                </div>
              </div>
              <div className="td-profile-row">
                <span className="td-profile-icon">📞</span>
                <div>
                  <span className="td-profile-label">Phone</span>
                  <span className="td-profile-value">{teacher.phone}</span>
                </div>
              </div>
              <div className="td-profile-row">
                <span className="td-profile-icon">🎓</span>
                <div>
                  <span className="td-profile-label">Qualification</span>
                  <span className="td-profile-value">
                    {teacher.qualification}
                  </span>
                </div>
              </div>
              <div className="td-profile-row">
                <span className="td-profile-icon">⏱️</span>
                <div>
                  <span className="td-profile-label">Experience</span>
                  <span className="td-profile-value">{teacher.experience}</span>
                </div>
              </div>
              <div className="td-profile-row">
                <span className="td-profile-icon">🏫</span>
                <div>
                  <span className="td-profile-label">Department</span>
                  <span className="td-profile-value">{teacher.subject}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedStudent && (
        <div
          className="td-modal-backdrop"
          onClick={() => setShowGradeModal(false)}
        >
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="td-modal-close"
              onClick={() => setShowGradeModal(false)}
            >
              ✕
            </button>
            <h3 className="td-modal-title">
              ✏️ Add Grade — {selectedStudent.name}
            </h3>
            <div className="td-modal-form">
              <div className="td-form-group">
                <label>Marks (out of 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.marks}
                  onChange={(e) =>
                    setGradeForm((f) => ({ ...f, marks: e.target.value }))
                  }
                  className="td-input"
                  placeholder="Enter marks"
                />
              </div>
              <div className="td-form-group">
                <label>Grade</label>
                <select
                  value={gradeForm.grade}
                  onChange={(e) =>
                    setGradeForm((f) => ({ ...f, grade: e.target.value }))
                  }
                  className="td-input"
                >
                  <option value="">Select Grade</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="td-form-group">
                <label>Remarks</label>
                <textarea
                  className="td-input td-textarea"
                  placeholder="Optional remarks..."
                  value={gradeForm.remarks}
                  onChange={(e) =>
                    setGradeForm((f) => ({ ...f, remarks: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="td-modal-footer">
              <button
                className="td-btn td-btn--ghost"
                onClick={() => setShowGradeModal(false)}
              >
                Cancel
              </button>
              <button
                className="td-btn td-btn--primary"
                onClick={handleGradeSave}
              >
                💾 Save Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncement && (
        <div
          className="td-modal-backdrop"
          onClick={() => setShowAnnouncement(false)}
        >
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="td-modal-close"
              onClick={() => setShowAnnouncement(false)}
            >
              ✕
            </button>
            <h3 className="td-modal-title">📢 New Announcement</h3>
            <div className="td-modal-form">
              <div className="td-form-group">
                <label>Title</label>
                <input
                  className="td-input"
                  placeholder="Announcement title..."
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="td-form-group">
                <label>Message</label>
                <textarea
                  className="td-input td-textarea"
                  placeholder="Write your message..."
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="td-form-row">
                <div className="td-form-group">
                  <label>Priority</label>
                  <select
                    className="td-input"
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        priority: e.target.value,
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="td-form-group">
                  <label>Target Class</label>
                  <select
                    className="td-input"
                    value={announcementForm.class}
                    onChange={(e) =>
                      setAnnouncementForm((f) => ({
                        ...f,
                        class: e.target.value,
                      }))
                    }
                  >
                    <option value="All">All Classes</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="td-modal-footer">
              <button
                className="td-btn td-btn--ghost"
                onClick={() => setShowAnnouncement(false)}
              >
                Cancel
              </button>
              <button
                className="td-btn td-btn--primary"
                onClick={handleAnnouncement}
              >
                📢 Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
