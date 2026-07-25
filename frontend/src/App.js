import React, { useState } from "react";
import Login from "./components/Login";
import AddStudent from "./components/AddStudent";
import StudentList from "./components/TeacherDashboard";
import FeePayment from "./components/FeePayment";
import Hostel from "./components/Hostel";
import Dashboard from "./components/Dashboard";
import StudentDashboard from "./components/StudentDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div className="container">
      {user.role === "admin" && (
        <>
          <Dashboard />
        </>
      )}

      {user.role === "teacher" && (
        <>
          <StudentList />
        </>
      )}

      {user.role === "student" && (
        <>
          {/* Hide aurora background for student */}
          <style>{`body::before { display: none !important; } body { background: #f5f6fa !important; }`}</style>
          <StudentDashboard user={user} onLogout={() => setUser(null)} />
        </>
      )}

      <button onClick={() => setUser(null)}>Logout</button>
    </div>
  );
}

export default App;
