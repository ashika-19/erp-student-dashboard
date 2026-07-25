import React, { useState } from "react";

function FeePayment() {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/pay_fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        amount: amount,
      }),
    });

    const data = await response.json();
    alert(data.message);

    setStudentId("");
    setAmount("");
  };

  return (
    <div className="card">
      <h2>Fee Payment</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Pay Fee</button>
      </form>
    </div>
  );
}

export default FeePayment;
