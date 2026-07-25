const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});
// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ashika@123",
  database: "erp",
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL - erp database");
  }
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Login route
// Login route - UPDATED with student info
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(query, [username, password], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length > 0) {
      const user = result[0];

      // If user is student, fetch additional student details
      if (user.role === "student") {
        const studentQuery = "SELECT * FROM students WHERE student_id = ?";
        db.query(studentQuery, [user.student_id], (err, studentResult) => {
          if (err) {
            console.log("Error fetching student details:", err);
            return res.status(500).json({ message: "Server error" });
          }

          if (studentResult && studentResult.length > 0) {
            const student = studentResult[0];
            res.json({
              id: user.id,
              username: user.username,
              role: user.role,
              email: student.email,
              name: student.name,
              studentId: student.student_id,
              department: student.department,
              semester: student.semester,
              phone: student.phone,
              address: student.address,
              status: student.status,
              admission_date: student.admission_date,
            });
          } else {
            res.status(404).json({ message: "Student record not found" });
          }
        });
      } else {
        // Admin or teacher login
        res.json({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
        });
      }
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
});

// GET all students
app.get("/api/students", (req, res) => {
  console.log("📋 Fetching all students...");
  db.query("SELECT * FROM students ORDER BY id DESC", (err, results) => {
    if (err) {
      console.log("Error fetching students:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Found ${results.length} students`);
    res.json(results);
  });
});

// ADD new student
app.post("/api/students", (req, res) => {
  console.log("📝 Received request to add student:", req.body);

  const {
    student_id,
    name,
    email,
    phone,
    department,
    semester,
    admission_date,
    address,
  } = req.body;

  // Validate required fields
  if (
    !student_id ||
    !name ||
    !email ||
    !department ||
    !semester ||
    !admission_date
  ) {
    console.log("❌ Missing required fields");
    return res.status(400).json({
      error: "Missing required fields",
      received: req.body,
    });
  }

  const query = `INSERT INTO students 
                 (student_id, name, email, phone, department, semester, admission_date, address) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    query,
    [
      student_id,
      name,
      email,
      phone,
      department,
      semester,
      admission_date,
      address,
    ],
    (err, result) => {
      if (err) {
        console.log("❌ Database error:", err);

        // Handle duplicate entry
        if (err.code === "ER_DUP_ENTRY") {
          if (err.message.includes("student_id")) {
            return res.status(400).json({ error: "Student ID already exists" });
          }
          if (err.message.includes("email")) {
            return res.status(400).json({ error: "Email already exists" });
          }
        }

        return res.status(500).json({ error: err.message });
      }

      console.log("✅ Student added successfully! ID:", result.insertId);

      // Log activity
      const activityQuery =
        "INSERT INTO activities (action, user, user_role, details) VALUES (?, ?, ?, ?)";
      db.query(activityQuery, [
        "New student added",
        "admin",
        "admin",
        `${name} added to ${department}`,
      ]);

      res.json({
        success: true,
        message: "Student added successfully",
        id: result.insertId,
      });
    },
  );
});

// UPDATE student
app.put("/api/students/:id", (req, res) => {
  const studentId = req.params.id;
  const { name, email, phone, department, semester, address, status } =
    req.body;

  console.log("📝 Updating student:", studentId, req.body);

  const query = `UPDATE students 
                 SET name = ?, email = ?, phone = ?, department = ?, semester = ?, address = ?, status = ?
                 WHERE id = ?`;

  db.query(
    query,
    [name, email, phone, department, semester, address, status, studentId],
    (err, result) => {
      if (err) {
        console.log("❌ Error updating student:", err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      console.log("✅ Student updated successfully");

      // Log activity
      const activityQuery =
        "INSERT INTO activities (action, user, user_role, details) VALUES (?, ?, ?, ?)";
      db.query(activityQuery, [
        "Student updated",
        "admin",
        "admin",
        `${name}'s information was updated`,
      ]);

      res.json({
        success: true,
        message: "Student updated successfully",
      });
    },
  );
});

// DELETE student - FIXED VERSION
app.delete("/api/students/:id", (req, res) => {
  const studentId = req.params.id;
  console.log("🔥 DELETE request received for ID:", studentId);

  // First get student name for activity log
  db.query(
    "SELECT name FROM students WHERE id = ?",
    [studentId],
    (err, studentResult) => {
      if (err) {
        console.log("❌ Error fetching student:", err);
      }

      const query = "DELETE FROM students WHERE id = ?";

      db.query(query, [studentId], (err, result) => {
        if (err) {
          console.log("❌ Error deleting student:", err);
          return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Student not found" });
        }

        console.log("✅ Student deleted successfully");

        // Log activity
        if (studentResult && studentResult.length > 0) {
          const activityQuery =
            "INSERT INTO activities (action, user, user_role, details) VALUES (?, ?, ?, ?)";
          db.query(activityQuery, [
            "Student deleted",
            "admin",
            "admin",
            `${studentResult[0].name} was removed from the system`,
          ]);
        }

        res.json({
          success: true,
          message: "Student deleted successfully",
        });
      });
    },
  );
});

// Dashboard stats
app.get("/api/dashboard/stats", (req, res) => {
  const queries = {
    totalStudents: "SELECT COUNT(*) as count FROM students",
    totalTeachers: "SELECT COUNT(*) as count FROM teachers",
    pendingFees:
      "SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE status IN ('pending', 'overdue')",
    totalHostel: "SELECT COUNT(*) as count FROM hostel",
    recentActivities:
      "SELECT * FROM activities ORDER BY created_at DESC LIMIT 5",
  };

  db.query(queries.totalStudents, (err, students) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(queries.totalTeachers, (err, teachers) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(queries.pendingFees, (err, fees) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(queries.totalHostel, (err, hostel) => {
          if (err) return res.status(500).json({ error: err.message });

          db.query(queries.recentActivities, (err, activities) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              totalStudents: students[0]?.count || 0,
              totalTeachers: teachers[0]?.count || 0,
              pendingFees: fees[0]?.total || 0,
              totalHostel: hostel[0]?.count || 0,
              recentActivities: activities || [],
            });
          });
        });
      });
    });
  });
});

// Dashboard chart data
app.get("/api/dashboard/charts", (req, res) => {
  const departmentQuery = `
    SELECT department, COUNT(*) as count 
    FROM students 
    WHERE status = 'active' 
    GROUP BY department
  `;

  const enrollmentQuery = `
    SELECT DATE_FORMAT(admission_date, '%Y-%m') as month, COUNT(*) as count 
    FROM students 
    WHERE admission_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month 
    ORDER BY month
  `;

  db.query(departmentQuery, (err, deptResults) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(enrollmentQuery, (err, enrollResults) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        departmentDistribution: deptResults,
        enrollmentTrend: enrollResults,
      });
    });
  });
});
// GET student by ID (for student dashboard)
app.get("/api/student/:studentId", (req, res) => {
  const studentId = req.params.studentId;
  console.log(`📋 Fetching student data for ID: ${studentId}`);

  const query = "SELECT * FROM students WHERE student_id = ?";

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.log("Error fetching student:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    console.log(`✅ Found student: ${results[0].name}`);
    res.json(results[0]);
  });
});

// GET student by student_id query parameter
app.get("/api/students", (req, res) => {
  const { student_id } = req.query;

  if (student_id) {
    console.log(`📋 Fetching student with ID: ${student_id}`);
    const query = "SELECT * FROM students WHERE student_id = ?";
    db.query(query, [student_id], (err, results) => {
      if (err) {
        console.log("Error fetching student:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Found ${results.length} students`);
      res.json(results);
    });
  } else {
    console.log("📋 Fetching all students...");
    db.query("SELECT * FROM students ORDER BY id DESC", (err, results) => {
      if (err) {
        console.log("Error fetching students:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Found ${results.length} students`);
      res.json(results);
    });
  }
});
// Debug route to check students
app.get("/api/debug/students", (req, res) => {
  console.log("🔍 Debug: Fetching all students");
  db.query("SELECT student_id, name FROM students", (err, results) => {
    if (err) {
      console.log("❌ Debug error:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Debug: Found ${results.length} students`);
    res.json(results);
  });
});

app.get("/api/attendance/:studentId", (req, res) => {
  const { studentId } = req.params;
  console.log(`📋 Fetching attendance for: ${studentId}`);

  const query = `
    SELECT 
      s.subject_code,
      s.subject_name,
      s.credits,
      COUNT(a.id) AS total_classes,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
      ROUND(
        (SUM(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1
      ) AS percentage
    FROM subjects s
    LEFT JOIN attendance a 
      ON s.subject_code = a.subject_code AND a.student_id = ?
    WHERE s.department = (SELECT department FROM students WHERE student_id = ?)
      AND s.semester = (SELECT semester FROM students WHERE student_id = ?)
    GROUP BY s.subject_code, s.subject_name, s.credits
    ORDER BY s.subject_code
  `;

  db.query(query, [studentId, studentId, studentId], (err, results) => {
    if (err) {
      console.log("❌ Error fetching attendance:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Found attendance for ${results.length} subjects`);
    res.json(results);
  });
});

// GET detailed attendance records for a subject
app.get("/api/attendance/:studentId/:subjectCode", (req, res) => {
  const { studentId, subjectCode } = req.params;

  const query = `
    SELECT date, status 
    FROM attendance 
    WHERE student_id = ? AND subject_code = ?
    ORDER BY date DESC
    LIMIT 30
  `;

  db.query(query, [studentId, subjectCode], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET overall attendance stats
app.get("/api/attendance/:studentId/stats/overall", (req, res) => {
  const { studentId } = req.params;

  const query = `
    SELECT 
      COUNT(*) AS total_classes,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS total_present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS total_absent,
      ROUND(
        (SUM(CASE WHEN status = 'present' OR status = 'late' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1
      ) AS overall_percentage
    FROM attendance
    WHERE student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// GET grades for a student (filtered by semester)
app.get("/api/grades/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { semester } = req.query;
  console.log(
    `📋 Fetching grades for: ${studentId}, semester: ${semester || "all"}`,
  );

  let query;
  let params;

  if (semester) {
    query = `
      SELECT 
        s.subject_code,
        s.subject_name,
        s.credits,
        g.semester,
        g.internal_marks,
        g.external_marks,
        g.total_marks,
        g.max_marks,
        ROUND((g.total_marks / g.max_marks) * 100, 1) AS percentage
      FROM subjects s
      INNER JOIN grades g 
        ON s.subject_code = g.subject_code AND g.student_id = ?
      WHERE g.semester = ?
        AND s.department = (SELECT department FROM students WHERE student_id = ?)
      ORDER BY s.subject_code
    `;
    params = [studentId, semester, studentId];
  } else {
    query = `
      SELECT 
        s.subject_code,
        s.subject_name,
        s.credits,
        g.semester,
        g.internal_marks,
        g.external_marks,
        g.total_marks,
        g.max_marks,
        ROUND((g.total_marks / g.max_marks) * 100, 1) AS percentage
      FROM subjects s
      INNER JOIN grades g 
        ON s.subject_code = g.subject_code AND g.student_id = ?
      WHERE s.department = (SELECT department FROM students WHERE student_id = ?)
      ORDER BY g.semester, s.subject_code
    `;
    params = [studentId, studentId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.log("❌ Error fetching grades:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Found grades for ${results.length} subjects`);
    res.json(results);
  });
});

// GET all available semesters for a student (only semesters that have grade records)
app.get("/api/grades/:studentId/semesters", (req, res) => {
  const { studentId } = req.params;
  console.log(`📋 Fetching available semesters for: ${studentId}`);

  const query = `
    SELECT DISTINCT semester 
    FROM grades 
    WHERE student_id = ?
    ORDER BY semester ASC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.log("❌ Error fetching semesters:", err);
      return res.status(500).json({ error: err.message });
    }
    const semesters = results.map((r) => r.semester);
    console.log(`✅ Found semesters: ${semesters.join(", ")}`);
    res.json(semesters);
  });
});

// GET GPA summary — one row per semester
app.get("/api/grades/:studentId/gpa", (req, res) => {
  const { studentId } = req.params;
  console.log(`📋 Fetching GPA summary for: ${studentId}`);

  const query = `
    SELECT 
      g.semester,
      COUNT(g.id) AS total_subjects,
      SUM(s.credits) AS total_credits,
      ROUND(AVG((g.total_marks / g.max_marks) * 100), 1) AS avg_percentage,
      ROUND(
        SUM(
          CASE
            WHEN (g.total_marks / g.max_marks) * 100 >= 90 THEN 10 * s.credits
            WHEN (g.total_marks / g.max_marks) * 100 >= 80 THEN 9  * s.credits
            WHEN (g.total_marks / g.max_marks) * 100 >= 70 THEN 8  * s.credits
            WHEN (g.total_marks / g.max_marks) * 100 >= 60 THEN 7  * s.credits
            WHEN (g.total_marks / g.max_marks) * 100 >= 50 THEN 6  * s.credits
            WHEN (g.total_marks / g.max_marks) * 100 >= 40 THEN 5  * s.credits
            ELSE 0
          END
        ) / SUM(s.credits), 2
      ) AS gpa
    FROM grades g
    INNER JOIN subjects s ON g.subject_code = s.subject_code
    WHERE g.student_id = ?
    GROUP BY g.semester
    ORDER BY g.semester ASC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.log("❌ Error fetching GPA:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Found GPA for ${results.length} semesters`);
    res.json(results);
  });
});
// =============================================
// BUS ROUTE & TRANSPORT INFO - API Routes
// Copy and paste these routes into your server.js
// Add them BEFORE the app.listen(5000) line
// =============================================

// GET transport info for a student (route + stop + driver + bus)
app.get("/api/transport/:studentId", (req, res) => {
  const { studentId } = req.params;
  console.log(`🚌 Fetching transport info for: ${studentId}`);

  const query = `
    SELECT
      t.student_id,
      t.stop_name        AS student_stop,
      t.pickup_time,
      t.drop_time,
      t.academic_year,
      r.route_number,
      r.route_name,
      r.start_point,
      r.end_point,
      r.total_stops,
      r.driver_name,
      r.driver_phone,
      r.driver_license,
      r.conductor_name,
      r.conductor_phone,
      r.bus_number,
      r.bus_model,
      r.capacity,
      r.status
    FROM student_transport t
    JOIN bus_routes r ON t.route_number = r.route_number
    WHERE t.student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.log("❌ Error fetching transport info:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No transport assigned for this student" });
    }
    console.log(`✅ Found transport info for ${studentId}`);
    res.json(results[0]);
  });
});

// GET all stops for a student's assigned route
app.get("/api/transport/:studentId/stops", (req, res) => {
  const { studentId } = req.params;
  console.log(`🚌 Fetching route stops for: ${studentId}`);

  const query = `
    SELECT
      bs.stop_number,
      bs.stop_name,
      bs.arrival_time,
      bs.departure_time,
      bs.landmark
    FROM student_transport t
    JOIN bus_stops bs ON t.route_number = bs.route_number
    WHERE t.student_id = ?
    ORDER BY bs.stop_number ASC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.log("❌ Error fetching stops:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`✅ Found ${results.length} stops`);
    res.json(results);
  });
});

const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET burnout analysis for a student
app.get("/api/burnout/:studentId", async (req, res) => {
  const { studentId } = req.params;
  console.log(`🧠 Running burnout analysis for: ${studentId}`);

  try {
    // 1. Fetch attendance data
    const attendanceQuery = `
      SELECT 
        s.subject_code,
        s.subject_name,
        COUNT(a.id) AS total_classes,
        SUM(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 ELSE 0 END) AS present_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1
        ) AS attendance_pct
      FROM subjects s
      LEFT JOIN attendance a ON s.subject_code = a.subject_code AND a.student_id = ?
      WHERE s.department = (SELECT department FROM students WHERE student_id = ?)
        AND s.semester = (SELECT semester FROM students WHERE student_id = ?)
      GROUP BY s.subject_code, s.subject_name
    `;

    // 2. Fetch grades data
    const gradesQuery = `
      SELECT 
        s.subject_code,
        s.subject_name,
        g.semester,
        ROUND((g.total_marks / g.max_marks) * 100, 1) AS grade_pct
      FROM subjects s
      INNER JOIN grades g ON s.subject_code = g.subject_code AND g.student_id = ?
      WHERE s.department = (SELECT department FROM students WHERE student_id = ?)
      ORDER BY g.semester, s.subject_code
    `;

    const [attendanceRows, gradeRows] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query(
          attendanceQuery,
          [studentId, studentId, studentId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          },
        );
      }),
      new Promise((resolve, reject) => {
        db.query(gradesQuery, [studentId, studentId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
    ]);

    // 3. Compute burnout score
    const subjectBreakdown = attendanceRows.map((att) => {
      const gradeMatch = gradeRows.find(
        (g) => g.subject_code === att.subject_code,
      );
      const attendance = att.attendance_pct || 0;
      const gradePercent = gradeMatch ? gradeMatch.grade_pct : null;

      let riskLevel = "low";
      if (attendance < 60 || (gradePercent !== null && gradePercent < 40)) {
        riskLevel = "high";
      } else if (
        attendance < 75 ||
        (gradePercent !== null && gradePercent < 60)
      ) {
        riskLevel = "medium";
      }

      return {
        subjectName: att.subject_name,
        subjectCode: att.subject_code,
        attendance,
        gradePercent: gradePercent ?? "N/A",
        riskLevel,
      };
    });
    const avgAttendance =
      subjectBreakdown.reduce((s, x) => s + parseFloat(x.attendance), 0) /
      (subjectBreakdown.length || 1);
    const withGrades = subjectBreakdown.filter((s) => s.gradePercent !== "N/A");
    const avgGrade =
      withGrades.length > 0
        ? withGrades.reduce((s, x) => s + parseFloat(x.gradePercent), 0) /
          withGrades.length
        : null;
    const highRiskCount = subjectBreakdown.filter(
      (s) => s.riskLevel === "high",
    ).length;
    const mediumRiskCount = subjectBreakdown.filter(
      (s) => s.riskLevel === "medium",
    ).length;

    let burnoutScore = 0;
    burnoutScore += Math.max(0, ((100 - parseFloat(avgAttendance)) / 100) * 40);
    if (avgGrade !== null)
      burnoutScore += Math.max(0, ((100 - parseFloat(avgGrade)) / 100) * 35);
    burnoutScore += Math.min(25, highRiskCount * 8 + mediumRiskCount * 4);
    burnoutScore = Math.round(Math.min(100, burnoutScore));

    // 4. Build signals
    const signals = [
      {
        icon: "📊",
        label: "Avg Attendance",
        value: `${avgAttendance.toFixed(1)}%`,
        level:
          avgAttendance < 60 ? "danger" : avgAttendance < 75 ? "warning" : "ok",
      },
      {
        icon: "🏆",
        label: "Avg Grade",
        value: avgGrade !== null ? `${avgGrade.toFixed(1)}%` : "No data",
        level:
          avgGrade !== null
            ? avgGrade < 40
              ? "danger"
              : avgGrade < 60
                ? "warning"
                : "ok"
            : "ok",
      },
      {
        icon: "⚠️",
        label: "At-Risk Subjects",
        value: `${highRiskCount} subject${highRiskCount !== 1 ? "s" : ""}`,
        level:
          highRiskCount >= 2
            ? "danger"
            : highRiskCount === 1
              ? "warning"
              : "ok",
      },
      {
        icon: "📉",
        label: "Watch Subjects",
        value: `${mediumRiskCount} subject${mediumRiskCount !== 1 ? "s" : ""}`,
        level:
          mediumRiskCount >= 3
            ? "danger"
            : mediumRiskCount >= 1
              ? "warning"
              : "ok",
      },
      {
        icon: "🎯",
        label: "Burnout Score",
        value: `${burnoutScore}/100`,
        level:
          burnoutScore >= 75 ? "danger" : burnoutScore >= 45 ? "warning" : "ok",
      },
    ];

    res.json({
      burnoutScore,
      avgAttendance: parseFloat(avgAttendance).toFixed(1),
      avgGrade: avgGrade !== null ? parseFloat(avgGrade).toFixed(1) : null,
      highRiskCount,
      mediumRiskCount,
      subjectBreakdown,
      signals,
    });
  } catch (err) {
    console.log("❌ Burnout analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST get AI advice for burnout
app.post("/api/burnout/:studentId/advice", async (req, res) => {
  const burnoutData = req.body;

  const avgGrade = burnoutData.avgGrade;
  const score = parseFloat(burnoutData.burnoutScore);
  const avgAtt = parseFloat(burnoutData.avgAttendance);
  const highRisk = parseInt(burnoutData.highRiskCount);

  let advice = "";

  if (score >= 75) {
    advice = `Your academic health needs immediate attention. With an attendance of ${avgAtt}% and ${highRisk} high-risk subject(s), burnout signs are clearly visible.\n\nHere's what to do now:\n1. Talk to your faculty advisor this week — don't wait.\n2. Attend every class for the next 2 weeks without exception to recover attendance.\n3. Focus on your weakest subject first — spend 1 hour daily on it.\n4. Reduce screen time and get 7-8 hours of sleep — your brain needs recovery time.\n\nYou can turn this around. Small consistent steps every day make a big difference. You've got this! 💪`;
  } else if (score >= 45) {
    advice = `You're at moderate risk of burnout. Your attendance is at ${avgAtt}% which needs improvement before it crosses the detention threshold.\n\nRecommended actions:\n1. Set a personal rule — no bunking for the next 3 weeks.\n2. Review your notes within 24 hours of each class to stay on track.\n3. Form a study group with 2-3 classmates for your weaker subjects.\n4. Take short breaks while studying — 25 min study, 5 min break (Pomodoro method).\n\nYou're not far from being back on track. Stay consistent and you'll see improvement quickly! 🎯`;
  } else {
    advice = `Great work! Your academic health looks good with ${avgAtt}% attendance and manageable grades.\n\nTo maintain and improve:\n1. Keep your attendance above 85% as a personal target.\n2. Start exam preparation 3 weeks early instead of last minute.\n3. Use your strong subjects to help classmates — teaching reinforces your own learning.\n4. Take one day per week to fully relax and recharge.\n\nYou're on the right path. Keep up the consistency and you'll finish the semester strong! 🌟`;
  }

  res.json({ advice });
});
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
