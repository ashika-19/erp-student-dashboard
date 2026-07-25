const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple test routes
app.get("/", (req, res) => {
  res.json({ message: "Server is working!" });
});

app.get("/api/students", (req, res) => {
  res.json([{ id: 1, name: "Test Student", student_id: "STU001" }]);
});

app.delete("/api/students/:id", (req, res) => {
  console.log("Delete request for ID:", req.params.id);
  res.json({ success: true, message: "Student deleted!" });
});

app.listen(5000, () => {
  console.log("✅ Simple server running on http://localhost:5000");
});
