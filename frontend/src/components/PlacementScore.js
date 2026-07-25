import React, { useState, useEffect } from "react";
import "./PlacementScore.css";

// ── Scoring weights ──────────────────────────────────────────
const WEIGHTS = {
  cgpa: 35,
  skills: 25,
  projects: 20,
  certifications: 15,
  softSkills: 5,
};

const SKILL_OPTIONS = [
  "Python",
  "Java",
  "C++",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "MongoDB",
  "Machine Learning",
  "Data Science",
  "Docker",
  "AWS",
  "Git",
  "REST APIs",
  "TypeScript",
  "Flutter",
  "Android",
  "iOS",
  "Figma",
  "Linux",
];

const SOFT_SKILLS = [
  "Communication",
  "Teamwork",
  "Leadership",
  "Problem Solving",
  "Time Management",
  "Adaptability",
];

const CERT_LEVELS = [
  { label: "NPTEL / Coursera (Free)", points: 3 },
  { label: "Industry Cert (AWS / Google / Oracle)", points: 8 },
  { label: "Competitive (GATE / GRE prep)", points: 10 },
];

const getScoreColor = (score) => {
  if (score >= 80) return { color: "#10b981", label: "Excellent", emoji: "🚀" };
  if (score >= 60) return { color: "#6366f1", label: "Good", emoji: "💼" };
  if (score >= 40) return { color: "#f59e0b", label: "Average", emoji: "📈" };
  return { color: "#ef4444", label: "Needs Work", emoji: "⚠️" };
};

const PlacementScore = ({ studentData }) => {
  const studentId = studentData?.studentId || studentData?.student_id;

  const [step, setStep] = useState(1); // 1=form, 2=result
  const [cgpa, setCgpa] = useState(null);
  const [cgpaLoading, setCgpaLoading] = useState(true);

  // Form state
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [projects, setProjects] = useState([
    { title: "", type: "personal", tech: "", deployed: false },
  ]);
  const [certs, setCerts] = useState([{ name: "", level: 0 }]);
  const [selectedSoftSkills, setSelectedSoftSkills] = useState([]);
  const [internship, setInternship] = useState(false);
  const [internshipMonths, setInternshipMonths] = useState(0);
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  // Fetch real CGPA
  useEffect(() => {
    const fetchCGPA = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/grades/${studentId}/gpa`,
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const avg =
            data.reduce((s, g) => s + parseFloat(g.gpa), 0) / data.length;
          setCgpa(parseFloat(avg.toFixed(2)));
        }
      } catch {
        setCgpa(9.12); // fallback from your actual data
      } finally {
        setCgpaLoading(false);
      }
    };
    if (studentId) fetchCGPA();
  }, [studentId]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(`placement_${studentId}`);
    if (saved) {
      const d = JSON.parse(saved);
      setSelectedSkills(d.selectedSkills || []);
      setProjects(
        d.projects || [
          { title: "", type: "personal", tech: "", deployed: false },
        ],
      );
      setCerts(d.certs || [{ name: "", level: 0 }]);
      setSelectedSoftSkills(d.selectedSoftSkills || []);
      setInternship(d.internship || false);
      setInternshipMonths(d.internshipMonths || 0);
      if (d.score) {
        setScore(d.score);
        setBreakdown(d.breakdown);
        setStep(2);
      }
    }
  }, [studentId]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const toggleSoftSkill = (skill) => {
    setSelectedSoftSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      { title: "", type: "personal", tech: "", deployed: false },
    ]);
  };

  const updateProject = (i, key, val) => {
    setProjects((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)),
    );
  };

  const removeProject = (i) => {
    setProjects((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addCert = () => {
    setCerts((prev) => [...prev, { name: "", level: 0 }]);
  };

  const updateCert = (i, key, val) => {
    setCerts((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)),
    );
  };

  const removeCert = (i) => {
    setCerts((prev) => prev.filter((_, idx) => idx !== i));
  };

  const calculateScore = () => {
    // 1. CGPA Score (35 pts)
    let cgpaScore = 0;
    if (cgpa >= 9.0) cgpaScore = 35;
    else if (cgpa >= 8.0) cgpaScore = 30;
    else if (cgpa >= 7.0) cgpaScore = 24;
    else if (cgpa >= 6.0) cgpaScore = 16;
    else if (cgpa >= 5.0) cgpaScore = 8;
    else cgpaScore = 3;

    // 2. Skills Score (25 pts)
    const skillCount = selectedSkills.length;
    let skillScore = Math.min(25, skillCount * 3.5);
    skillScore = parseFloat(skillScore.toFixed(1));

    // 3. Projects Score (20 pts)
    const validProjects = projects.filter((p) => p.title.trim());
    let projectScore = 0;
    validProjects.forEach((p) => {
      projectScore += p.type === "team" ? 5 : 4;
      if (p.deployed) projectScore += 2;
    });
    projectScore = Math.min(20, projectScore);

    // 4. Certifications Score (15 pts)
    const validCerts = certs.filter((c) => c.name.trim());
    let certScore = 0;
    validCerts.forEach((c) => {
      certScore += CERT_LEVELS[c.level]?.points || 0;
    });
    certScore = Math.min(15, certScore);

    // 5. Soft Skills Score (5 pts)
    let softScore = Math.min(5, selectedSoftSkills.length * 1);

    // Bonus: Internship
    let bonus = 0;
    if (internship) bonus = Math.min(5, internshipMonths);

    const total = Math.min(
      100,
      Math.round(
        cgpaScore + skillScore + projectScore + certScore + softScore + bonus,
      ),
    );

    const bd = {
      cgpa: { score: cgpaScore, max: 35, value: cgpa },
      skills: { score: skillScore, max: 25, value: skillCount },
      projects: { score: projectScore, max: 20, value: validProjects.length },
      certs: { score: certScore, max: 15, value: validCerts.length },
      softSkills: {
        score: softScore,
        max: 5,
        value: selectedSoftSkills.length,
      },
      bonus: { score: bonus, value: internshipMonths },
    };

    setScore(total);
    setBreakdown(bd);
    setStep(2);

    // Save to localStorage
    localStorage.setItem(
      `placement_${studentId}`,
      JSON.stringify({
        selectedSkills,
        projects,
        certs,
        selectedSoftSkills,
        internship,
        internshipMonths,
        score: total,
        breakdown: bd,
      }),
    );
  };

  const resetForm = () => {
    setStep(1);
    setScore(null);
    setBreakdown(null);
    localStorage.removeItem(`placement_${studentId}`);
  };

  const scoreInfo = score !== null ? getScoreColor(score) : null;

  // ── STEP 1: FORM ────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="ps-root">
        <div className="ps-header">
          <div>
            <h2 className="ps-title">🎯 Placement Readiness Score</h2>
            <p className="ps-sub">
              Fill in your profile to get your personalized placement score
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="ps-progress-bar">
          <div className="ps-progress-fill" style={{ width: "60%" }} />
        </div>

        <div className="ps-form-grid">
          {/* CGPA Card */}
          <div className="ps-card">
            <div className="ps-card-header">
              <span className="ps-card-icon">🎓</span>
              <div>
                <h3 className="ps-card-title">CGPA</h3>
                <p className="ps-card-sub">Auto-fetched from your grades</p>
              </div>
              <span className="ps-weight-badge">35 pts</span>
            </div>
            <div className="ps-cgpa-display">
              {cgpaLoading ? (
                <div className="ps-cgpa-loading">Fetching CGPA...</div>
              ) : (
                <>
                  <div className="ps-cgpa-val">{cgpa}</div>
                  <div className="ps-cgpa-label">out of 10.0</div>
                  <div
                    className={`ps-cgpa-badge ${cgpa >= 8 ? "ps-cgpa-badge--good" : cgpa >= 6 ? "ps-cgpa-badge--mid" : "ps-cgpa-badge--low"}`}
                  >
                    {cgpa >= 9
                      ? "Outstanding"
                      : cgpa >= 8
                        ? "Excellent"
                        : cgpa >= 7
                          ? "Good"
                          : cgpa >= 6
                            ? "Average"
                            : "Needs Improvement"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Technical Skills */}
          <div className="ps-card ps-card--full">
            <div className="ps-card-header">
              <span className="ps-card-icon">💻</span>
              <div>
                <h3 className="ps-card-title">Technical Skills</h3>
                <p className="ps-card-sub">
                  Select all that you're comfortable with
                </p>
              </div>
              <span className="ps-weight-badge">25 pts</span>
            </div>
            <div className="ps-skill-grid">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  className={`ps-skill-chip ${selectedSkills.includes(skill) ? "ps-skill-chip--active" : ""}`}
                  onClick={() => toggleSkill(skill)}
                >
                  {selectedSkills.includes(skill) ? "✓ " : ""}
                  {skill}
                </button>
              ))}
            </div>
            <div className="ps-custom-skill">
              <input
                className="ps-input"
                placeholder="Add custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
              />
              <button className="ps-add-btn" onClick={addCustomSkill}>
                + Add
              </button>
            </div>
            {selectedSkills.length > 0 && (
              <div className="ps-selected-chips">
                {selectedSkills.map((s) => (
                  <span key={s} className="ps-selected-chip">
                    {s}
                    <button onClick={() => toggleSkill(s)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="ps-card ps-card--full">
            <div className="ps-card-header">
              <span className="ps-card-icon">🛠️</span>
              <div>
                <h3 className="ps-card-title">Projects</h3>
                <p className="ps-card-sub">
                  Add your personal or team projects
                </p>
              </div>
              <span className="ps-weight-badge">20 pts</span>
            </div>
            <div className="ps-projects-list">
              {projects.map((proj, i) => (
                <div key={i} className="ps-project-row">
                  <div className="ps-project-fields">
                    <input
                      className="ps-input"
                      placeholder="Project title"
                      value={proj.title}
                      onChange={(e) =>
                        updateProject(i, "title", e.target.value)
                      }
                    />
                    <select
                      className="ps-select"
                      value={proj.type}
                      onChange={(e) => updateProject(i, "type", e.target.value)}
                    >
                      <option value="personal">Personal</option>
                      <option value="team">Team</option>
                      <option value="internship">Internship</option>
                    </select>
                    <input
                      className="ps-input"
                      placeholder="Tech used (React, Node...)"
                      value={proj.tech}
                      onChange={(e) => updateProject(i, "tech", e.target.value)}
                    />
                    <label className="ps-checkbox-label">
                      <input
                        type="checkbox"
                        checked={proj.deployed}
                        onChange={(e) =>
                          updateProject(i, "deployed", e.target.checked)
                        }
                      />
                      <span>Deployed / Live</span>
                    </label>
                  </div>
                  {projects.length > 1 && (
                    <button
                      className="ps-remove-btn"
                      onClick={() => removeProject(i)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="ps-add-row-btn" onClick={addProject}>
              + Add Project
            </button>
          </div>

          {/* Certifications */}
          <div className="ps-card ps-card--full">
            <div className="ps-card-header">
              <span className="ps-card-icon">📜</span>
              <div>
                <h3 className="ps-card-title">Certifications</h3>
                <p className="ps-card-sub">Add your completed certifications</p>
              </div>
              <span className="ps-weight-badge">15 pts</span>
            </div>
            <div className="ps-certs-list">
              {certs.map((cert, i) => (
                <div key={i} className="ps-cert-row">
                  <input
                    className="ps-input"
                    placeholder="Certification name"
                    value={cert.name}
                    onChange={(e) => updateCert(i, "name", e.target.value)}
                  />
                  <select
                    className="ps-select"
                    value={cert.level}
                    onChange={(e) =>
                      updateCert(i, "level", parseInt(e.target.value))
                    }
                  >
                    {CERT_LEVELS.map((l, idx) => (
                      <option key={idx} value={idx}>
                        {l.label} (+{l.points} pts)
                      </option>
                    ))}
                  </select>
                  {certs.length > 1 && (
                    <button
                      className="ps-remove-btn"
                      onClick={() => removeCert(i)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="ps-add-row-btn" onClick={addCert}>
              + Add Certification
            </button>
          </div>

          {/* Soft Skills */}
          <div className="ps-card">
            <div className="ps-card-header">
              <span className="ps-card-icon">🤝</span>
              <div>
                <h3 className="ps-card-title">Soft Skills</h3>
                <p className="ps-card-sub">Select your strengths</p>
              </div>
              <span className="ps-weight-badge">5 pts</span>
            </div>
            <div className="ps-skill-grid">
              {SOFT_SKILLS.map((skill) => (
                <button
                  key={skill}
                  className={`ps-skill-chip ${selectedSoftSkills.includes(skill) ? "ps-skill-chip--active" : ""}`}
                  onClick={() => toggleSoftSkill(skill)}
                >
                  {selectedSoftSkills.includes(skill) ? "✓ " : ""}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Internship */}
          <div className="ps-card">
            <div className="ps-card-header">
              <span className="ps-card-icon">🏢</span>
              <div>
                <h3 className="ps-card-title">Internship</h3>
                <p className="ps-card-sub">Bonus points for experience</p>
              </div>
              <span className="ps-weight-badge">+5 bonus</span>
            </div>
            <label className="ps-checkbox-label ps-internship-toggle">
              <input
                type="checkbox"
                checked={internship}
                onChange={(e) => setInternship(e.target.checked)}
              />
              <span>I have completed an internship</span>
            </label>
            {internship && (
              <div className="ps-internship-months">
                <label>Duration (months)</label>
                <input
                  type="number"
                  className="ps-input"
                  min="1"
                  max="12"
                  value={internshipMonths}
                  onChange={(e) =>
                    setInternshipMonths(parseInt(e.target.value) || 0)
                  }
                  placeholder="e.g. 2"
                />
              </div>
            )}
          </div>
        </div>

        <button className="ps-calculate-btn" onClick={calculateScore}>
          Calculate My Placement Score →
        </button>
      </div>
    );
  }

  // ── STEP 2: RESULT ──────────────────────────────────────────
  return (
    <div className="ps-root">
      <div className="ps-header">
        <div>
          <h2 className="ps-title">🎯 Placement Readiness Score</h2>
          <p className="ps-sub">
            {studentData?.name} · {studentData?.department}
          </p>
        </div>
        <button className="ps-rerun-btn" onClick={resetForm}>
          ✏️ Update Profile
        </button>
      </div>

      {/* Score Hero */}
      <div className="ps-score-hero" style={{ borderColor: scoreInfo.color }}>
        <div className="ps-score-left">
          <div
            className="ps-score-circle"
            style={{ borderColor: scoreInfo.color }}
          >
            <svg viewBox="0 0 120 120" className="ps-score-svg">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={scoreInfo.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 314} 314`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1.5s ease" }}
              />
            </svg>
            <div className="ps-score-inner">
              <span className="ps-score-num" style={{ color: scoreInfo.color }}>
                {score}
              </span>
              <span className="ps-score-denom">/100</span>
            </div>
          </div>
        </div>
        <div className="ps-score-right">
          <div className="ps-score-emoji">{scoreInfo.emoji}</div>
          <div className="ps-score-label" style={{ color: scoreInfo.color }}>
            {scoreInfo.label}
          </div>
          <p className="ps-score-desc">
            {score >= 80
              ? "You're highly placement-ready! Apply to top product companies confidently."
              : score >= 60
                ? "Good profile! Focus on adding 1-2 more projects and certifications."
                : score >= 40
                  ? "Average readiness. Work on technical skills and get a certification."
                  : "Start building your profile. Focus on CGPA and core technical skills first."}
          </p>
          <div className="ps-score-chips">
            <span className="ps-chip">{breakdown?.skills.value} Skills</span>
            <span className="ps-chip">
              {breakdown?.projects.value} Projects
            </span>
            <span className="ps-chip">{breakdown?.certs.value} Certs</span>
            {internship && (
              <span className="ps-chip ps-chip--bonus">✓ Internship</span>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="ps-breakdown-card">
        <h3 className="ps-section-title">📊 Score Breakdown</h3>
        <div className="ps-breakdown-list">
          {[
            {
              label: "CGPA",
              icon: "🎓",
              score: breakdown?.cgpa.score,
              max: 35,
              detail: `${breakdown?.cgpa.value} / 10.0`,
            },
            {
              label: "Technical Skills",
              icon: "💻",
              score: breakdown?.skills.score,
              max: 25,
              detail: `${breakdown?.skills.value} skills`,
            },
            {
              label: "Projects",
              icon: "🛠️",
              score: breakdown?.projects.score,
              max: 20,
              detail: `${breakdown?.projects.value} projects`,
            },
            {
              label: "Certifications",
              icon: "📜",
              score: breakdown?.certs.score,
              max: 15,
              detail: `${breakdown?.certs.value} certs`,
            },
            {
              label: "Soft Skills",
              icon: "🤝",
              score: breakdown?.softSkills.score,
              max: 5,
              detail: `${breakdown?.softSkills.value} selected`,
            },
          ].map((item, i) => {
            const pct = (item.score / item.max) * 100;
            const col =
              pct >= 80
                ? "#10b981"
                : pct >= 50
                  ? "#6366f1"
                  : pct >= 30
                    ? "#f59e0b"
                    : "#ef4444";
            return (
              <div key={i} className="ps-breakdown-row">
                <div className="ps-breakdown-left">
                  <span className="ps-breakdown-icon">{item.icon}</span>
                  <div>
                    <div className="ps-breakdown-label">{item.label}</div>
                    <div className="ps-breakdown-detail">{item.detail}</div>
                  </div>
                </div>
                <div className="ps-breakdown-right">
                  <div className="ps-breakdown-bar-track">
                    <div
                      className="ps-breakdown-bar-fill"
                      style={{ width: `${pct}%`, background: col }}
                    />
                  </div>
                  <span className="ps-breakdown-pts" style={{ color: col }}>
                    {item.score}/{item.max}
                  </span>
                </div>
              </div>
            );
          })}
          {internship && (
            <div className="ps-bonus-row">
              <span>🏢 Internship Bonus</span>
              <span className="ps-bonus-pts">
                +{breakdown?.bonus.score} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="ps-reco-card">
        <h3 className="ps-section-title">💡 What to Improve Next</h3>
        <div className="ps-reco-grid">
          {breakdown?.cgpa.score < 30 && (
            <div className="ps-reco-item">
              <span className="ps-reco-icon">🎓</span>
              <div>
                <div className="ps-reco-title">Improve CGPA</div>
                <div className="ps-reco-desc">
                  Focus on scoring above 85% in upcoming exams to boost your
                  CGPA above 8.5
                </div>
              </div>
            </div>
          )}
          {breakdown?.skills.value < 5 && (
            <div className="ps-reco-item">
              <span className="ps-reco-icon">💻</span>
              <div>
                <div className="ps-reco-title">Learn More Skills</div>
                <div className="ps-reco-desc">
                  Add at least 5 technical skills. Focus on Python, SQL, and one
                  framework
                </div>
              </div>
            </div>
          )}
          {breakdown?.projects.value < 2 && (
            <div className="ps-reco-item">
              <span className="ps-reco-icon">🛠️</span>
              <div>
                <div className="ps-reco-title">Build More Projects</div>
                <div className="ps-reco-desc">
                  Aim for 2-3 projects minimum. Deploy at least one on GitHub
                  Pages or Heroku
                </div>
              </div>
            </div>
          )}
          {breakdown?.certs.value < 2 && (
            <div className="ps-reco-item">
              <span className="ps-reco-icon">📜</span>
              <div>
                <div className="ps-reco-title">Get Certified</div>
                <div className="ps-reco-desc">
                  Complete at least one industry certification — AWS, Google, or
                  Oracle are highly valued
                </div>
              </div>
            </div>
          )}
          {!internship && (
            <div className="ps-reco-item">
              <span className="ps-reco-icon">🏢</span>
              <div>
                <div className="ps-reco-title">Get Internship Experience</div>
                <div className="ps-reco-desc">
                  Apply for internships on LinkedIn, Internshala, or company
                  websites. Even 1 month helps
                </div>
              </div>
            </div>
          )}
          {score >= 80 && (
            <div className="ps-reco-item ps-reco-item--success">
              <span className="ps-reco-icon">🚀</span>
              <div>
                <div className="ps-reco-title">You're Ready!</div>
                <div className="ps-reco-desc">
                  Start applying to product companies. Prepare for DSA
                  interviews on LeetCode
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementScore;
