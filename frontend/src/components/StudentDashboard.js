import React, { useState, useEffect } from "react";
import "./StudentDashboard.css";
import Attendance from "./Attendance";
import Grades from "./Grades";
import Transport from "./Transport";
import BurnoutDetector from "./BurnoutDetector";
import AnalyticsHub from "./AnalyticsHub";
import PlacementScore from "./PlacementScore";
const StudentDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch student data on component mount
  useEffect(() => {
    if (user) {
      console.log("👤 User from props:", user);
      setStudentData(user); // Use the user data directly from login
      setFormData({
        phone: user?.phone || "",
        email: user?.email || "",
        address: user?.address || "",
      });
      setLoading(false);
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle("sd-dark", darkMode);
    return () => document.body.classList.remove("sd-dark");
  }, [darkMode]);

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now
      setNotifications([
        {
          id: 1,
          title: "Fee Payment Reminder",
          message: "Your semester fee payment is due on March 20th",
          date: "2026-03-10",
          type: "warning",
          read: false,
        },
        {
          id: 2,
          title: "Exam Schedule",
          message: "Mid-term exams start from April 5th",
          date: "2026-03-08",
          type: "info",
          read: false,
        },
        {
          id: 3,
          title: "Holiday Announcement",
          message: "College will remain closed on March 20th",
          date: "2026-03-05",
          type: "success",
          read: true,
        },
      ]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/${studentData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        setStudentData({ ...studentData, ...formData });
        setEditMode(false);
        showNotification("Profile updated successfully!");
      } else {
        showNotification("Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("Error updating profile", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="sd-loading">
        <p>No student data found. Please login again.</p>
        <button onClick={onLogout}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className={`sd-root ${darkMode ? "sd-dark" : ""}`}>
      {/* Notification Toast */}
      {notification && (
        <div className={`sd-toast sd-toast--${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-sidebar__brand">
          <span className="sd-brand-icon">🎓</span>
          <div className="sd-brand-text">
            <span className="sd-brand-name">EduAdmin</span>
            <span className="sd-brand-role">Student Portal</span>
          </div>
          <button
            className="sd-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <nav className="sd-sidebar__nav">
          <button
            className={`sd-nav-item ${activeTab === "dashboard" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="sd-nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "profile" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="sd-nav-icon">👤</span>
            <span>My Profile</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "idcard" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("idcard")}
          >
            <span className="sd-nav-icon">🪪</span>
            <span>Student ID Card</span>
          </button>

          <button
            className={`sd-nav-item ${activeTab === "notifications" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <span className="sd-nav-icon">🔔</span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="sd-nav-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className={`sd-nav-item ${activeTab === "attendance" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            <span className="sd-nav-icon">📈</span>
            <span>Attendance</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "grades" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("grades")}
          >
            <span className="sd-nav-icon">🏆</span>
            <span>Grades</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "burnout" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("burnout")}
          >
            <span className="sd-nav-icon">🧠</span>
            <span>Burnout Check</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "analytics" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <span className="sd-nav-icon">🎯</span>
            <span>Analytics Hub</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "placementscore" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("placementscore")}
          >
            <span className="sd-nav-icon">💼</span>
            <span>Placement Score</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "transport" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("transport")}
          >
            <span className="sd-nav-icon">🚌</span>
            <span>Transport</span>
          </button>
          <button
            className={`sd-nav-item ${activeTab === "settings" ? "sd-nav-item--active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span className="sd-nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="sd-sidebar__footer">
          <div className="sd-user-info">
            <div className="sd-avatar-sm">
              {studentData?.name?.charAt(0) || "S"}
            </div>
            <div className="sd-user-details">
              <span className="sd-user-name">
                {studentData?.name?.split(" ")[0] || "Student"}
              </span>
              <span className="sd-user-role">
                {studentData?.studentId || studentData?.student_id || "STU000"}
              </span>
            </div>
          </div>
          <button className="sd-logout-btn" onClick={onLogout} title="Logout">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        {/* Top Bar */}
        <header className="sd-topbar">
          <h1 className="sd-page-title">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "profile" && "My Profile"}
            {activeTab === "idcard" && "Student ID Card"}

            {activeTab === "notifications" && "Notifications"}
            {activeTab === "settings" && "Settings"}
            {activeTab === "attendance" && "Attendance"}
            {activeTab === "transport" && "Transport Info"}
            {activeTab === "grades" && "Grades & Marks"}
            {activeTab === "burnout" && "Burnout Detector"}
            {activeTab === "placementscore" && "Placement Score"}
          </h1>
          <div className="sd-topbar-right">
            <span className="sd-date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <button
              className="sd-notif-btn"
              onClick={() => setActiveTab("notifications")}
            >
              🔔
              {unreadCount > 0 && (
                <span className="sd-notif-pip">{unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="sd-content">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="sd-welcome-banner">
                <div className="sd-welcome-text">
                  <h2>
                    Welcome back, {studentData.name?.split(" ")[0] || "Student"}
                    ! 👋
                  </h2>
                  <p>
                    Here's your academic overview for{" "}
                    {studentData.department || "your department"}
                  </p>
                </div>
                <div className="sd-welcome-stats">
                  <div className="sd-stat-chip">
                    <span>Semester</span>
                    <strong>{studentData.semester || "N/A"}</strong>
                  </div>
                  <div className="sd-stat-chip">
                    <span>Status</span>
                    <strong
                      className={`sd-status-${studentData.status || "active"}`}
                    >
                      {studentData.status?.toUpperCase() || "ACTIVE"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="sd-summary-grid">
                <div className="sd-sum-card">
                  <div className="sd-sum-icon">🆔</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Student ID</span>
                    <span className="sd-sum-value">
                      {studentData.studentId || studentData.student_id}
                    </span>
                  </div>
                </div>

                <div className="sd-sum-card">
                  <div className="sd-sum-icon">🏛️</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Department</span>
                    <span className="sd-sum-value">
                      {studentData.department || "Not set"}
                    </span>
                  </div>
                </div>

                <div className="sd-sum-card">
                  <div className="sd-sum-icon">📚</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Semester</span>
                    <span className="sd-sum-value">
                      {studentData.semester || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="sd-sum-card">
                  <div className="sd-sum-icon">📅</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Admission</span>
                    <span className="sd-sum-value sd-sum-value--small">
                      {studentData.admission_date
                        ? new Date(
                            studentData.admission_date,
                          ).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="sd-sum-card">
                  <div className="sd-sum-icon">📧</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Email</span>
                    <span className="sd-sum-value sd-sum-value--small">
                      {studentData.email}
                    </span>
                  </div>
                </div>

                <div className="sd-sum-card">
                  <div className="sd-sum-icon">📞</div>
                  <div className="sd-sum-info">
                    <span className="sd-sum-label">Phone</span>
                    <span className="sd-sum-value">
                      {studentData.phone || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashboard Grid - 2 Column Layout */}
              <div className="sd-dash-grid">
                {/* Left Column - Profile Card */}
                <div className="sd-card">
                  <div className="sd-card__hdr">
                    <h3>Profile</h3>
                    <button
                      className="sd-btn sd-btn--ghost"
                      onClick={() => setActiveTab("profile")}
                    >
                      Edit
                    </button>
                  </div>

                  <div
                    className="sd-profile-hero"
                    style={{ padding: 0, border: "none", boxShadow: "none" }}
                  >
                    <div className="sd-profile-hero__av">
                      {studentData.name?.charAt(0) || "S"}
                    </div>
                    <div className="sd-profile-hero__info">
                      <h3>{studentData.name || "Student"}</h3>
                      <p>{studentData.studentId || studentData.student_id}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <div className="sd-profile-field">
                      <span className="sd-field-label">Email</span>
                      <span className="sd-field-value">
                        {studentData.email}
                      </span>
                    </div>
                    <div className="sd-profile-field">
                      <span className="sd-field-label">Phone</span>
                      <span className="sd-field-value">
                        {studentData.phone || "Not set"}
                      </span>
                    </div>
                    <div className="sd-profile-field">
                      <span className="sd-field-label">Address</span>
                      <span className="sd-field-value">
                        {studentData.address || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="sd-card">
                  <div className="sd-card__hdr">
                    <h3>Recent Activity</h3>
                  </div>

                  {notifications.length > 0 ? (
                    <div className="sd-mini-notifications">
                      {notifications.slice(0, 3).map((notif) => (
                        <div key={notif.id} className="sd-mini-notif">
                          <span
                            className={`sd-notif-dot sd-notif-${notif.type}`}
                          />
                          <div>
                            <p className="sd-mini-title">{notif.title}</p>
                            <p className="sd-mini-date">{notif.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty-state">
                      <span>📭</span>
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="sd-card sd-card--wide">
                  <div className="sd-card__hdr">
                    <h3>Quick Actions</h3>
                  </div>

                  <div className="sd-quick-actions-grid">
                    <button
                      className="sd-quick-action-btn"
                      onClick={() => setActiveTab("idcard")}
                    >
                      <span className="sd-quick-action-icon">🪪</span>
                      <span className="sd-quick-action-label">
                        View ID Card
                      </span>
                    </button>
                    <button
                      className="sd-quick-action-btn"
                      onClick={() => setActiveTab("profile")}
                    >
                      <span className="sd-quick-action-icon">✏️</span>
                      <span className="sd-quick-action-label">
                        Edit Profile
                      </span>
                    </button>
                    <button className="sd-quick-action-btn" onClick={() => {}}>
                      <span className="sd-quick-action-icon">💰</span>
                      <span className="sd-quick-action-label">
                        Fee Payments
                      </span>
                    </button>
                    <button className="sd-quick-action-btn" onClick={() => {}}>
                      <span className="sd-quick-action-icon">🏢</span>
                      <span className="sd-quick-action-label">Hostel Info</span>
                    </button>
                    <button
                      className="sd-quick-action-btn"
                      onClick={() => setActiveTab("notifications")}
                    >
                      <span className="sd-quick-action-icon">🔔</span>
                      <span className="sd-quick-action-label">
                        Notifications
                      </span>
                    </button>
                    <button
                      className="sd-quick-action-btn"
                      onClick={() => setActiveTab("settings")}
                    >
                      <span className="sd-quick-action-icon">⚙️</span>
                      <span className="sd-quick-action-label">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="sd-profile">
              <div className="sd-profile-hero">
                <div className="sd-profile-hero__av">
                  {studentData.name?.charAt(0) || "S"}
                </div>
                <div className="sd-profile-hero__info">
                  <h2>{studentData.name}</h2>
                  <p>
                    {studentData.studentId || studentData.student_id} ·{" "}
                    {studentData.department || "Department"}
                  </p>
                </div>
                <button
                  className="sd-edit-btn"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? "Cancel" : "✏️ Edit Profile"}
                </button>
              </div>

              <div className="sd-profile-grid">
                <div className="sd-profile-card">
                  <h3>Personal Information</h3>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Full Name</span>
                    <span className="sd-field-value">{studentData.name}</span>
                  </div>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Student ID</span>
                    <span className="sd-field-value">
                      {studentData.studentId || studentData.student_id}
                    </span>
                  </div>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Department</span>
                    <span className="sd-field-value">
                      {studentData.department || "Not set"}
                    </span>
                  </div>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Semester</span>
                    <span className="sd-field-value">
                      {studentData.semester || "N/A"}
                    </span>
                  </div>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Admission Date</span>
                    <span className="sd-field-value">
                      {studentData.admission_date
                        ? new Date(
                            studentData.admission_date,
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="sd-profile-field">
                    <span className="sd-field-label">Status</span>
                    <span
                      className={`sd-field-value sd-status-${studentData.status || "active"}`}
                    >
                      {studentData.status?.toUpperCase() || "ACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="sd-profile-card">
                  <h3>Contact Information</h3>
                  {editMode ? (
                    <>
                      <div className="sd-form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="sd-input"
                        />
                      </div>
                      <div className="sd-form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="sd-input"
                        />
                      </div>
                      <div className="sd-form-group">
                        <label>Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          className="sd-input sd-textarea"
                          rows="3"
                        />
                      </div>
                      <button
                        className="sd-save-btn"
                        onClick={handleUpdateProfile}
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="sd-profile-field">
                        <span className="sd-field-label">Email</span>
                        <span className="sd-field-value">
                          {studentData.email}
                        </span>
                      </div>
                      <div className="sd-profile-field">
                        <span className="sd-field-label">Phone</span>
                        <span className="sd-field-value">
                          {studentData.phone || "Not set"}
                        </span>
                      </div>
                      <div className="sd-profile-field">
                        <span className="sd-field-label">Address</span>
                        <span className="sd-field-value">
                          {studentData.address || "Not set"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STUDENT ID CARD TAB */}
          {activeTab === "idcard" && (
            <div className="sd-idcard-container">
              <div className="sd-idcard">
                <div className="sd-idcard-header">
                  <div className="sd-idcard-logo">🎓</div>
                  <div className="sd-idcard-title">
                    <h2>STUDENT ID CARD</h2>
                    <p>University ERP System</p>
                  </div>
                </div>

                <div className="sd-idcard-body">
                  <div className="sd-idcard-photo">
                    {studentData.name?.charAt(0) || "S"}
                  </div>
                  <div className="sd-idcard-info">
                    <div className="sd-idcard-row">
                      <span className="sd-idcard-label">Name</span>
                      <span className="sd-idcard-value">
                        {studentData.name}
                      </span>
                    </div>
                    <div className="sd-idcard-row">
                      <span className="sd-idcard-label">Student ID</span>
                      <span className="sd-idcard-value">
                        {studentData.studentId || studentData.student_id}
                      </span>
                    </div>
                    <div className="sd-idcard-row">
                      <span className="sd-idcard-label">Department</span>
                      <span className="sd-idcard-value">
                        {studentData.department || "N/A"}
                      </span>
                    </div>
                    <div className="sd-idcard-row">
                      <span className="sd-idcard-label">Semester</span>
                      <span className="sd-idcard-value">
                        {studentData.semester || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sd-idcard-footer">
                  <div className="sd-idcard-valid">Valid: 2024-2028</div>
                  <div className="sd-idcard-signature">
                    Authorized Signature
                  </div>
                </div>
              </div>
              <button
                className="sd-download-btn"
                onClick={() => window.print()}
              >
                🖨️ Download / Print
              </button>
            </div>
          )}
          {/* {activeTab === "chatbot" && <Chatbot studentData={studentData} />} */}
          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="sd-notifications">
              <div className="sd-notifications-header">
                <h2>All Notifications</h2>
                <span className="sd-notif-count">{unreadCount} unread</span>
              </div>

              <div className="sd-notifications-list">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`sd-notif-card ${!notif.read ? "unread" : ""}`}
                  >
                    <div className={`sd-notif-icon sd-notif-${notif.type}`}>
                      {notif.type === "info" && "ℹ️"}
                      {notif.type === "warning" && "⚠️"}
                      {notif.type === "success" && "✅"}
                    </div>
                    <div className="sd-notif-content">
                      <div className="sd-notif-card__title">{notif.title}</div>
                      <div className="sd-notif-card__msg">{notif.message}</div>
                      <span className="sd-notif-date">{notif.date}</span>
                    </div>
                    {!notif.read && <span className="sd-notif-badge">New</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "attendance" && (
            <Attendance studentData={studentData} />
          )}
          {activeTab === "grades" && <Grades studentData={studentData} />}
          {/* SETTINGS TAB */}
          {activeTab === "transport" && <Transport studentData={studentData} />}
          {activeTab === "settings" && (
            <div className="sd-settings">
              <div className="sd-settings-card">
                <h3>Account Settings</h3>

                <div className="sd-settings-section">
                  <h4>Profile Information</h4>
                  <button
                    className="sd-settings-btn"
                    onClick={() => setActiveTab("profile")}
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="sd-settings-section">
                  <h4>Security</h4>
                  <button
                    className="sd-settings-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </button>
                </div>

                <div className="sd-settings-section">
                  <h4>Preferences</h4>
                  <div className="sd-toggle-item">
                    <span>Dark Mode</span>
                    <label className="sd-switch">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                      />
                      <span className="sd-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="sd-settings-section">
                  <h4>Notifications</h4>
                  <div className="sd-toggle-item">
                    <span>Email Notifications</span>
                    <label className="sd-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="sd-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "burnout" && (
            <BurnoutDetector studentData={studentData} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsHub studentData={studentData} />
          )}
          {activeTab === "placementscore" && (
            <PlacementScore studentData={studentData} />
          )}
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="sd-modal-backdrop"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Password</h3>
            <div className="sd-form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="sd-input"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="sd-form-group">
              <label>New Password</label>
              <input
                type="password"
                className="sd-input"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="sd-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="sd-input"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="sd-modal-btns">
              <button
                className="sd-btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="sd-btn-primary"
                onClick={() => {
                  if (
                    passwordData.newPassword !== passwordData.confirmPassword
                  ) {
                    showNotification("Passwords do not match", "error");
                    return;
                  }
                  showNotification("Password changed successfully!");
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
