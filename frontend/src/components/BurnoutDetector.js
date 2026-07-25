import React, { useState, useEffect } from "react";
import "./BurnoutDetector.css";

const BurnoutDetector = ({ studentData }) => {
  const [burnoutData, setBurnoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [error, setError] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);

  const studentId = studentData?.studentId || studentData?.student_id;

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAiAdvice(null);
    try {
      const res = await fetch(`http://localhost:5000/api/burnout/${studentId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBurnoutData(data);
      setAnalyzed(true);
      fetchAiAdvice(data);
    } catch (err) {
      setError("Could not run analysis. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiAdvice = async (data) => {
    setAiLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/burnout/${studentId}/advice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const result = await res.json();
      setAiAdvice(result.advice);
    } catch (err) {
      setAiAdvice("Could not load AI advice at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 75)
      return {
        label: "HIGH RISK",
        cls: "risk-high",
        emoji: "🔴",
        color: "#ef4444",
      };
    if (score >= 45)
      return {
        label: "MODERATE RISK",
        cls: "risk-mid",
        emoji: "🟡",
        color: "#f59e0b",
      };
    return {
      label: "LOW RISK",
      cls: "risk-low",
      emoji: "🟢",
      color: "#10b981",
    };
  };

  const getMeter = (score) => {
    const risk = getRiskLevel(score);
    const angle = -135 + (score / 100) * 270;
    return { ...risk, angle };
  };

  if (!analyzed && !loading) {
    return (
      <div className="bd-root bd-landing">
        <div className="bd-landing-card">
          <div className="bd-landing-icon">🧠</div>
          <h2 className="bd-landing-title">AI Burnout Detector</h2>
          <p className="bd-landing-sub">
            Analyzes your <strong>attendance trends</strong>,{" "}
            <strong>grade performance</strong>, and{" "}
            <strong>academic patterns</strong> to detect early signs of burnout
            — before it's too late.
          </p>
          <div className="bd-landing-factors">
            {[
              {
                icon: "📊",
                label: "Attendance %",
                desc: "Tracks subject-wise presence",
              },
              {
                icon: "📈",
                label: "Grade Trend",
                desc: "Monitors score trajectory",
              },
              {
                icon: "⚠️",
                label: "Risk Signals",
                desc: "Flags critical thresholds",
              },
              {
                icon: "🤖",
                label: "AI Suggestions",
                desc: "Personalized Claude advice",
              },
            ].map((f, i) => (
              <div key={i} className="bd-factor-card">
                <span className="bd-factor-icon">{f.icon}</span>
                <span className="bd-factor-label">{f.label}</span>
                <span className="bd-factor-desc">{f.desc}</span>
              </div>
            ))}
          </div>
          <button className="bd-analyze-btn" onClick={runAnalysis}>
            Run Burnout Analysis
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bd-root bd-loading-screen">
        <div className="bd-pulse-ring" />
        <div className="bd-pulse-ring bd-pulse-ring--2" />
        <div className="bd-pulse-ring bd-pulse-ring--3" />
        <div className="bd-load-icon">🧠</div>
        <p className="bd-load-text">Analyzing academic patterns...</p>
        <div className="bd-load-steps">
          {[
            "Fetching attendance data",
            "Analyzing grade trends",
            "Computing risk score",
            "Generating AI advice",
          ].map((s, i) => (
            <div key={i} className="bd-load-step">
              <div
                className="bd-step-dot"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bd-root bd-error">
        <span className="bd-error-icon">⚠️</span>
        <p>{error}</p>
        <button className="bd-analyze-btn" onClick={runAnalysis}>
          Retry
        </button>
      </div>
    );
  }

  if (!burnoutData) return null;

  const meter = getMeter(burnoutData.burnoutScore);

  return (
    <div className="bd-root">
      {/* Header */}
      <div className="bd-header">
        <div>
          <h2 className="bd-title">🧠 Burnout Detector</h2>
          <p className="bd-sub">
            {studentData?.name} · {studentData?.department} · Sem{" "}
            {studentData?.semester}
          </p>
        </div>
        <button className="bd-rerun-btn" onClick={runAnalysis}>
          🔄 Re-analyze
        </button>
      </div>

      {/* Risk Gauge + Score */}
      <div className="bd-gauge-section">
        <div className="bd-gauge-wrap">
          <svg viewBox="0 0 200 130" className="bd-gauge-svg">
            {/* Track arc */}
            <path
              d="M 20 110 A 80 80 0 0 1 180 110"
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Low zone */}
            <path
              d="M 20 110 A 80 80 0 0 1 80 32"
              fill="none"
              stroke="#10b981"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Mid zone */}
            <path
              d="M 80 32 A 80 80 0 0 1 155 55"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* High zone */}
            <path
              d="M 155 55 A 80 80 0 0 1 180 110"
              fill="none"
              stroke="#ef4444"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Needle */}
            <line
              x1="100"
              y1="110"
              x2={100 + 60 * Math.cos(((meter.angle - 90) * Math.PI) / 180)}
              y2={110 + 60 * Math.sin(((meter.angle - 90) * Math.PI) / 180)}
              stroke={meter.color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="110" r="6" fill={meter.color} />
            {/* Labels */}
            <text x="14" y="125" fill="#10b981" fontSize="9" fontWeight="700">
              LOW
            </text>
            <text
              x="85"
              y="18"
              fill="#f59e0b"
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              MID
            </text>
            <text
              x="162"
              y="125"
              fill="#ef4444"
              fontSize="9"
              fontWeight="700"
              textAnchor="end"
            >
              HIGH
            </text>
          </svg>
          <div className="bd-score-badge" style={{ borderColor: meter.color }}>
            <span className="bd-score-num" style={{ color: meter.color }}>
              {burnoutData.burnoutScore}
            </span>
            <span className="bd-score-label">/ 100</span>
          </div>
          <div className={`bd-risk-pill ${meter.cls}`}>
            {meter.emoji} {meter.label}
          </div>
        </div>

        {/* Signal Cards */}
        <div className="bd-signals">
          <h3 className="bd-signals-title">Risk Signals Detected</h3>
          <div className="bd-signals-grid">
            {burnoutData.signals.map((sig, i) => (
              <div key={i} className={`bd-signal-card bd-signal-${sig.level}`}>
                <div className="bd-signal-top">
                  <span className="bd-signal-icon">{sig.icon}</span>
                  <span
                    className={`bd-signal-badge bd-signal-badge-${sig.level}`}
                  >
                    {sig.level}
                  </span>
                </div>
                <div className="bd-signal-label">{sig.label}</div>
                <div className="bd-signal-val">{sig.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bd-breakdown-card">
        <h3 className="bd-section-title">📊 Subject-wise Breakdown</h3>
        <div className="bd-table-wrap">
          <table className="bd-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Attendance</th>
                <th>Grade %</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {burnoutData.subjectBreakdown.map((sub, i) => {
                const attColor =
                  sub.attendance >= 75
                    ? "#10b981"
                    : sub.attendance >= 60
                      ? "#f59e0b"
                      : "#ef4444";
                const gradeColor =
                  sub.gradePercent >= 70
                    ? "#10b981"
                    : sub.gradePercent >= 50
                      ? "#f59e0b"
                      : "#ef4444";
                return (
                  <tr
                    key={i}
                    className={sub.riskLevel === "high" ? "bd-row-high" : ""}
                  >
                    <td className="bd-td-name">{sub.subjectName}</td>
                    <td>
                      <div className="bd-mini-bar-wrap">
                        <div className="bd-mini-bar">
                          <div
                            className="bd-mini-fill"
                            style={{
                              width: `${sub.attendance}%`,
                              background: attColor,
                            }}
                          />
                        </div>
                        <span style={{ color: attColor }}>
                          {sub.attendance}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="bd-mini-bar-wrap">
                        <div className="bd-mini-bar">
                          <div
                            className="bd-mini-fill"
                            style={{
                              width: `${sub.gradePercent}%`,
                              background: gradeColor,
                            }}
                          />
                        </div>
                        <span style={{ color: gradeColor }}>
                          {sub.gradePercent}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`bd-status-chip bd-status-${sub.riskLevel}`}
                      >
                        {sub.riskLevel === "high"
                          ? "⚠️ At Risk"
                          : sub.riskLevel === "medium"
                            ? "⚡ Watch"
                            : "✅ Safe"}
                      </span>
                    </td>
                    <td>
                      <div className="bd-risk-dots">
                        {[1, 2, 3].map((d) => (
                          <div
                            key={d}
                            className={`bd-dot ${(sub.riskLevel === "high" && d <= 3) || (sub.riskLevel === "medium" && d <= 2) || (sub.riskLevel === "low" && d <= 1) ? "bd-dot--on" : ""}`}
                            style={{
                              background:
                                sub.riskLevel === "high" && d <= 3
                                  ? "#ef4444"
                                  : sub.riskLevel === "medium" && d <= 2
                                    ? "#f59e0b"
                                    : "",
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Advice */}
      <div className="bd-ai-card">
        <div className="bd-ai-header">
          <div className="bd-ai-icon">🤖</div>
          <div>
            <h3 className="bd-ai-title">Claude AI Recommendations</h3>
            <p className="bd-ai-sub">
              Personalized advice based on your academic pattern
            </p>
          </div>
        </div>
        {aiLoading ? (
          <div className="bd-ai-loading">
            <div className="bd-ai-dots">
              <span />
              <span />
              <span />
            </div>
            <p>Claude is analyzing your data...</p>
          </div>
        ) : (
          <div className="bd-ai-content">
            {aiAdvice ? (
              <div className="bd-ai-text">{aiAdvice}</div>
            ) : (
              <p className="bd-ai-empty">No advice available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BurnoutDetector;
