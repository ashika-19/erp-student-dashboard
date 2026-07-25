import React, { useState } from "react";

function AddStudent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    year: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/add_student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    alert(data.message);

    setForm({ name: "", email: "", department: "", year: "" });
  };

  return (
    <div className="card">
      <h2>Add Student</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={form.name}
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <input
          name="email"
          value={form.email}
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="department"
          value={form.department}
          placeholder="Department"
          onChange={handleChange}
          required
        />
        <input
          name="year"
          value={form.year}
          placeholder="Year"
          onChange={handleChange}
          required
        />
        <button type="submit">Add Student</button>
      </form>
    </div>
  );
}

export default AddStudent;
