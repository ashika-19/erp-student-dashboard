import React, { useState } from "react";

function Hostel() {
  const [studentId, setStudentId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/allocate_hostel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        room_number: roomNumber,
      }),
    });

    const data = await response.json();
    alert(data.message);

    setStudentId("");
    setRoomNumber("");
  };

  return (
    <div className="card">
      <h2>Hostel Allocation</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
        <input
          placeholder="Room Number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
        />
        <button type="submit">Allocate</button>
      </form>
    </div>
  );
}

export default Hostel;
