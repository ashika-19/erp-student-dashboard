import React, { useState, useEffect } from "react";
import "./Transport.css";

const Transport = ({ studentData }) => {
  const [transport, setTransport] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentId = studentData?.studentId || studentData?.student_id;

  useEffect(() => {
    if (studentId) {
      fetchTransport();
    }
  }, [studentId]);

  const fetchTransport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`http://localhost:5000/api/transport/${studentId}`),
        fetch(`http://localhost:5000/api/transport/${studentId}/stops`),
      ]);

      if (!tRes.ok) throw new Error("No transport assigned");
      if (!sRes.ok) throw new Error("Could not load stops");

      const tData = await tRes.json();
      const sData = await sRes.json();

      setTransport(tData);
      setStops(sData);
    } catch (err) {
      console.log("❌ Transport fetch error:", err);
      setError(err.message || "Could not load transport information.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const getStatusColor = (status) => {
    if (status === "active") return "tp-status--active";
    if (status === "maintenance") return "tp-status--maintenance";
    return "tp-status--inactive";
  };

  const getStatusLabel = (status) => {
    if (status === "active") return "✅ Active";
    if (status === "maintenance") return "🔧 Maintenance";
    return "❌ Inactive";
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading)
    return (
      <div className="tp-loading">
        <div className="tp-spinner" />
        <p>Loading transport info…</p>
      </div>
    );

  // ── Error / Not assigned ────────────────────────────────────
  if (error)
    return (
      <div className="tp-error">
        <span className="tp-error-icon">🚌</span>
        <h3>No Transport Assigned</h3>
        <p>{error}</p>
        <small>Please contact the transport office if this is incorrect.</small>
        <button className="tp-retry-btn" onClick={fetchTransport}>
          Retry
        </button>
      </div>
    );

  // ── Find student's stop index for progress indicator ────────
  const studentStopIndex = stops.findIndex(
    (s) => s.stop_name === transport.student_stop,
  );

  return (
    <div className="tp-root">
      {/* ── Page Header ── */}
      <div className="tp-page-header">
        <div>
          <h2 className="tp-page-title">Transport Info</h2>
          <p className="tp-page-sub">
            {transport.route_number} · {transport.route_name}
          </p>
        </div>
        <span className={`tp-status-badge ${getStatusColor(transport.status)}`}>
          {getStatusLabel(transport.status)}
        </span>
      </div>

      {/* ── Top Info Grid ── */}
      <div className="tp-info-grid">
        {/* Bus Card */}
        <div className="tp-card tp-card--bus">
          <div className="tp-card-icon">🚌</div>
          <div className="tp-card-content">
            <span className="tp-card-label">Bus Number</span>
            <span className="tp-card-value">{transport.bus_number}</span>
            <span className="tp-card-sub">
              {transport.bus_model} · {transport.capacity} seats
            </span>
          </div>
        </div>

        {/* Route Card */}
        <div className="tp-card tp-card--route">
          <div className="tp-card-icon">🗺️</div>
          <div className="tp-card-content">
            <span className="tp-card-label">Your Route</span>
            <span className="tp-card-value">{transport.route_number}</span>
            <span className="tp-card-sub">
              {transport.start_point} → {transport.end_point}
            </span>
          </div>
        </div>

        {/* Pickup Card */}
        <div className="tp-card tp-card--pickup">
          <div className="tp-card-icon">📍</div>
          <div className="tp-card-content">
            <span className="tp-card-label">Your Stop</span>
            <span className="tp-card-value">{transport.student_stop}</span>
            <span className="tp-card-sub">
              Pickup: {formatTime(transport.pickup_time)} &nbsp;·&nbsp; Drop:{" "}
              {formatTime(transport.drop_time)}
            </span>
          </div>
        </div>

        {/* Academic Year */}
        <div className="tp-card tp-card--year">
          <div className="tp-card-icon">📅</div>
          <div className="tp-card-content">
            <span className="tp-card-label">Academic Year</span>
            <span className="tp-card-value">{transport.academic_year}</span>
            <span className="tp-card-sub">
              {transport.total_stops} total stops
            </span>
          </div>
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="tp-main-grid">
        {/* LEFT — Stops Table */}
        <div className="tp-panel">
          <div className="tp-panel-hdr">
            <h3>Stop Timings</h3>
            <span className="tp-panel-count">{stops.length} stops</span>
          </div>

          <div className="tp-stops-list">
            {stops.map((stop, index) => {
              const isStudentStop = stop.stop_name === transport.student_stop;
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              const isPast = index < studentStopIndex;
              return (
                <div
                  key={stop.stop_number}
                  className={`tp-stop-row 
                    ${isStudentStop ? "tp-stop-row--mine" : ""}
                    ${isFirst ? "tp-stop-row--first" : ""}
                    ${isLast ? "tp-stop-row--last" : ""}
                    ${isPast ? "tp-stop-row--past" : ""}
                  `}
                >
                  {/* Timeline dot */}
                  <div className="tp-timeline">
                    <div
                      className={`tp-dot ${isStudentStop ? "tp-dot--mine" : isLast ? "tp-dot--end" : ""}`}
                    >
                      {isStudentStop ? "★" : stop.stop_number}
                    </div>
                    {!isLast && <div className="tp-line" />}
                  </div>

                  {/* Stop info */}
                  <div className="tp-stop-info">
                    <div className="tp-stop-name-row">
                      <span className="tp-stop-name">{stop.stop_name}</span>
                      {isStudentStop && (
                        <span className="tp-my-stop-tag">Your Stop</span>
                      )}
                      {isFirst && <span className="tp-origin-tag">Origin</span>}
                      {isLast && (
                        <span className="tp-dest-tag">Destination</span>
                      )}
                    </div>
                    {stop.landmark && (
                      <span className="tp-landmark">📌 {stop.landmark}</span>
                    )}
                  </div>

                  {/* Timings */}
                  <div className="tp-stop-times">
                    <div className="tp-time-row">
                      <span className="tp-time-label">Arr</span>
                      <span className="tp-time-val">
                        {formatTime(stop.arrival_time)}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="tp-time-row">
                        <span className="tp-time-label">Dep</span>
                        <span className="tp-time-val">
                          {formatTime(stop.departure_time)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Driver + Conductor + Route Map */}
        <div className="tp-right">
          {/* Driver Card */}
          <div className="tp-contact-card">
            <div className="tp-contact-hdr">
              <h3>Driver Info</h3>
            </div>
            <div className="tp-contact-body">
              <div className="tp-contact-avatar">🧑‍✈️</div>
              <div className="tp-contact-details">
                <span className="tp-contact-name">{transport.driver_name}</span>
                <a
                  href={`tel:${transport.driver_phone}`}
                  className="tp-contact-phone"
                >
                  📞 {transport.driver_phone}
                </a>
                {transport.driver_license && (
                  <span className="tp-contact-license">
                    🪪 License: {transport.driver_license}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Conductor Card */}
          {transport.conductor_name && (
            <div className="tp-contact-card">
              <div className="tp-contact-hdr">
                <h3>Conductor Info</h3>
              </div>
              <div className="tp-contact-body">
                <div className="tp-contact-avatar">🎫</div>
                <div className="tp-contact-details">
                  <span className="tp-contact-name">
                    {transport.conductor_name}
                  </span>
                  <a
                    href={`tel:${transport.conductor_phone}`}
                    className="tp-contact-phone"
                  >
                    📞 {transport.conductor_phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Route Map View */}
          <div className="tp-map-card">
            <div className="tp-contact-hdr">
              <h3>Route Map</h3>
            </div>
            <div className="tp-map-body">
              {/* Visual route line */}
              <div className="tp-map-route">
                <div className="tp-map-point tp-map-point--start">
                  <span className="tp-map-dot" />
                  <span className="tp-map-label">{transport.start_point}</span>
                </div>

                <div className="tp-map-middle-stops">
                  {stops.slice(1, -1).map((stop) => {
                    const isStudentStop =
                      stop.stop_name === transport.student_stop;
                    return (
                      <div
                        key={stop.stop_number}
                        className={`tp-map-mid-stop ${isStudentStop ? "tp-map-mid-stop--mine" : ""}`}
                      >
                        <div
                          className={`tp-map-mid-dot ${isStudentStop ? "tp-map-mid-dot--mine" : ""}`}
                        />
                        {isStudentStop && (
                          <span className="tp-map-mid-label">You</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="tp-map-point tp-map-point--end">
                  <span className="tp-map-dot tp-map-dot--end" />
                  <span className="tp-map-label">{transport.end_point}</span>
                </div>
              </div>

              {/* Open in Google Maps */}
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(transport.route_name + " " + transport.start_point)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tp-maps-btn"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transport;
