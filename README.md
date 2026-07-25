# 🎓 ERP Student Dashboard

An AI-augmented university ERP dashboard that goes beyond static attendance/grade viewing — giving students burnout insights, grade simulations, and placement readiness tracking in one place.


## 📖 Overview

Most college ERP systems show raw data — attendance percentages, grade sheets, bus timings — and stop there. This project adds a layer of intelligence on top: helping students understand *what the data means* and *what to do next*, using Claude AI to power the analysis.

Built and presented as a full-stack project during a college review.

## ✨ Key Features

- **Attendance Tracking** — Real-time attendance records with subject-wise breakdown
- **Grades Module** — View semester-wise grades and performance history
- **Bus Routing** — Campus bus route and timing information
- **🤖 AI Burnout Detector** — Uses Claude API to analyze attendance/study patterns and flag early signs of burnout
- **📊 Analytics Hub**
  - **Grade Simulator** — Predict semester GPA outcomes based on hypothetical scores
  - **Attendance Recovery Planner** — Calculates exactly how many classes are needed to hit a target attendance percentage
  - **Peer Benchmark** — Anonymized comparison of performance against classmates
- **🎯 Placement Readiness Score** — AI-generated score estimating a student's readiness for placements based on academic and activity data

## 🛠️ Tech Stack

### Frontend
- React
- JavaScript (ES6+)
- React Router DOM
- CSS / Tailwind CSS

### Backend
- Node.js
- Express.js

### Tools
- Git
- GitHub
- VS Code
- npm
- 




### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/erp-student-dashboard.git
cd erp-student-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```


### Running the App

```bash
# Start backend (from /backend)
npm start

# Start frontend (from /frontend)
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📁 Project Structure

```
erp-student-dashboard/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
└── README.md
```

## 🗺️ Roadmap

- [ ] Mobile-responsive redesign
- [ ] Notification system for low attendance alerts
- [ ] Faculty-facing dashboard view
- [ ] Export analytics reports as PDF

## 👤 Author

**Ashika**
Third-year B.E. CSE, Rajalakshmi Engineering College (Anna University)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
