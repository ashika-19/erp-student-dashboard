import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import DeptAnalytics from "./DeptAnalytics";

function Dashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingFees: 0,
    totalHostel: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    semester: "",
    admission_date: "",
    address: "",
  });

  useEffect(() => {
    fetchDashboardData();
    fetchStudents();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/dashboard/stats");
      const data = await response.json();
      setStats(data);

      const chartResponse = await fetch(
        "http://localhost:5000/api/dashboard/charts",
      );
      const chartData = await chartResponse.json();
      console.log("Chart data:", chartData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      semester: "",
      admission_date: "",
      address: "",
    });
    setSelectedStudent(null);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      let url = "http://localhost:5000/api/students";
      let method = "POST";

      if (selectedStudent) {
        url = `http://localhost:5000/api/students/${selectedStudent.id}`;
        method = "PUT";

        const { student_id, ...updateData } = formData;

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (response.ok) {
          alert("✅ Student updated successfully!");
          setShowAddModal(false);
          setSelectedStudent(null);
          resetForm();
          fetchStudents();
          fetchDashboardData();
        } else {
          alert("❌ Error: " + (data.error || "Update failed"));
        }
      } else {
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          alert("✅ Student added successfully!");
          setShowAddModal(false);
          resetForm();
          fetchStudents();
          fetchDashboardData();
        } else {
          alert("❌ Error: " + (data.error || "Add failed"));
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Cannot connect to server");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        alert("❌ Server returned unexpected response.");
        return;
      }

      if (response.ok) {
        alert("✅ Student deleted successfully!");
        fetchStudents();
        fetchDashboardData();
      } else {
        alert("❌ Error: " + (data.error || "Failed to delete student"));
      }
    } catch (error) {
      alert("❌ Cannot connect to server. Is the backend running?");
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      department: student.department,
      semester: student.semester,
      admission_date: student.admission_date,
      address: student.address || "",
    });
    setShowAddModal(true);
  };

  const handleViewStudent = (student) => {
    setViewStudent(student);
    setShowViewModal(true);
  };

  const handleFeePayment = async (e) => {
    e.preventDefault();
    alert("Fee payment processed!");
    setShowFeeModal(false);
  };

  const handleHostelAllocation = async (e) => {
    e.preventDefault();
    alert("Hostel allocated successfully!");
    setShowHostelModal(false);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Tab Bar ── */}
      <div className="dash-tab-bar">
        <button
          className={`dash-tab ${activeView === "dashboard" ? "dash-tab--active" : ""}`}
          onClick={() => setActiveView("dashboard")}
        >
          📊 Overview
        </button>
        <button
          className={`dash-tab ${activeView === "analytics" ? "dash-tab--active" : ""}`}
          onClick={() => setActiveView("analytics")}
        >
          🏛️ Dept Analytics
        </button>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeView === "dashboard" && (
        <>
          {/* Header with Action Buttons */}
          <div className="dashboard-header">
            <div>
              <h2>Admin Dashboard</h2>
              <p className="date">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="header-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <span className="btn-icon">➕</span> Add Student
              </button>
              <button
                className="btn-success"
                onClick={() => setShowFeeModal(true)}
              >
                <span className="btn-icon">💰</span> Record Fee
              </button>
              <button
                className="btn-warning"
                onClick={() => setShowHostelModal(true)}
              >
                <span className="btn-icon">🏢</span> Allocate Hostel
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon students">👥</div>
              <div className="stat-details">
                <h3>Total Students</h3>
                <p className="stat-number">{stats.totalStudents}</p>
                <span className="stat-link">View All →</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon teachers">👨‍🏫</div>
              <div className="stat-details">
                <h3>Total Teachers</h3>
                <p className="stat-number">{stats.totalTeachers}</p>
                <span className="stat-link">View All →</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon fees">💰</div>
              <div className="stat-details">
                <h3>Pending Fees</h3>
                <p className="stat-number">
                  ₹{stats.pendingFees?.toLocaleString()}
                </p>
                <span className="stat-link">Collect →</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon hostel">🏢</div>
              <div className="stat-details">
                <h3>Hostel Students</h3>
                <p className="stat-number">{stats.totalHostel}</p>
                <span className="stat-link">Manage →</span>
              </div>
            </div>
          </div>

          {/* Recent Students Table */}
          <div className="recent-students">
            <div className="section-header">
              <h3>Recent Students</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((student) => (
                    <tr key={student.id}>
                      <td>{student.student_id}</td>
                      <td>{student.name}</td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                      <td>
                        <span
                          className={`status-badge ${student.status || "active"}`}
                        >
                          {student.status
                            ? student.status.toUpperCase()
                            : "ACTIVE"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewStudent(student)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditStudent(student)}
                            title="Edit Student"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteStudent(student.id)}
                            title="Delete Student"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities and Quick Actions */}
          <div className="dashboard-bottom">
            <div className="recent-activities">
              <h3>Recent Activities</h3>
              <div className="activity-list">
                {stats.recentActivities?.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">📋</div>
                    <div className="activity-details">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-meta">
                        <span className="activity-user">{activity.user}</span>
                        <span className="activity-time">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button
                  className="action-btn"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <span className="action-icon">➕</span>
                  Add New Student
                </button>
                <button
                  className="action-btn"
                  onClick={() => setShowFeeModal(true)}
                >
                  <span className="action-icon">💰</span>
                  Process Fee Payment
                </button>
                <button
                  className="action-btn"
                  onClick={() => setShowHostelModal(true)}
                >
                  <span className="action-icon">🏢</span>
                  Allocate Hostel
                </button>
                <button
                  className="action-btn"
                  onClick={() => alert("Coming soon!")}
                >
                  <span className="action-icon">👨‍🏫</span>
                  Add Teacher
                </button>
                <button
                  className="action-btn"
                  onClick={() => setActiveView("analytics")}
                >
                  <span className="action-icon">📊</span>
                  Dept Analytics
                </button>
                <button
                  className="action-btn"
                  onClick={() => alert("Coming soon!")}
                >
                  <span className="action-icon">📢</span>
                  Announcement
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DEPT ANALYTICS TAB ── */}
      {activeView === "analytics" && <DeptAnalytics />}

      {/* ── MODALS — always outside so they work from both tabs ── */}

      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedStudent ? "Edit Student" : "Add New Student"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Student ID *</label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., STU001"
                    disabled={selectedStudent !== null}
                    style={
                      selectedStudent
                        ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" }
                        : {}
                    }
                  />
                  {selectedStudent && (
                    <small
                      style={{
                        color: "#666",
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      Student ID cannot be changed
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester *</label>
                  <input
                    type="number"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="8"
                    placeholder="1-8"
                  />
                </div>
                <div className="form-group">
                  <label>Admission Date *</label>
                  <input
                    type="date"
                    name="admission_date"
                    value={formData.admission_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter address"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedStudent ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Payment Modal */}
      {showFeeModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Fee Payment</h3>
              <button
                className="close-btn"
                onClick={() => setShowFeeModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleFeePayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Student *</label>
                  <select required>
                    <option value="">Choose Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_id} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input type="date" required />
                </div>
                <div className="form-group">
                  <label>Payment Mode *</label>
                  <select required>
                    <option value="">Select Mode</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="8"
                    placeholder="Semester"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFeeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-success">
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hostel Allocation Modal */}
      {showHostelModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Allocate Hostel</h3>
              <button
                className="close-btn"
                onClick={() => setShowHostelModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleHostelAllocation}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Student *</label>
                  <select required>
                    <option value="">Choose Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_id} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hostel Name *</label>
                  <select required>
                    <option value="">Select Hostel</option>
                    <option value="Boys Hostel A">Boys Hostel A</option>
                    <option value="Boys Hostel B">Boys Hostel B</option>
                    <option value="Girls Hostel A">Girls Hostel A</option>
                    <option value="Girls Hostel B">Girls Hostel B</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Number *</label>
                  <input type="text" required placeholder="e.g., A-101" />
                </div>
                <div className="form-group">
                  <label>Bed Number</label>
                  <input type="text" placeholder="e.g., B1" />
                </div>
                <div className="form-group">
                  <label>Fee Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="form-group">
                  <label>Joining Date *</label>
                  <input type="date" required />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowHostelModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-warning">
                  Allocate Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && viewStudent && (
        <div className="modal">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h3>Student Details</h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="view-student-container">
              <div className="view-header">
                <div className="view-avatar">
                  {viewStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="view-title">
                  <h2>{viewStudent.name}</h2>
                  <span
                    className={`status-badge-large ${viewStudent.status || "active"}`}
                  >
                    {viewStudent.status
                      ? viewStudent.status.toUpperCase()
                      : "ACTIVE"}
                  </span>
                </div>
              </div>
              <div className="view-details-grid">
                <div className="view-detail-item">
                  <span className="detail-label">📋 Student ID</span>
                  <span className="detail-value">{viewStudent.student_id}</span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">📧 Email</span>
                  <span className="detail-value">{viewStudent.email}</span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">📞 Phone</span>
                  <span className="detail-value">
                    {viewStudent.phone || "N/A"}
                  </span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">🏛️ Department</span>
                  <span className="detail-value">{viewStudent.department}</span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">📚 Semester</span>
                  <span className="detail-value">{viewStudent.semester}</span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">📅 Admission Date</span>
                  <span className="detail-value">
                    {new Date(viewStudent.admission_date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="view-detail-item full-width">
                  <span className="detail-label">📍 Address</span>
                  <span className="detail-value">
                    {viewStudent.address || "N/A"}
                  </span>
                </div>
                <div className="view-detail-item">
                  <span className="detail-label">💰 Fee Status</span>
                  <span className="detail-value">
                    <span className="status-badge-small paid">Paid</span>
                  </span>
                </div>
              </div>
              <div className="view-footer">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditStudent(viewStudent);
                  }}
                >
                  ✏️ Edit Student
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
