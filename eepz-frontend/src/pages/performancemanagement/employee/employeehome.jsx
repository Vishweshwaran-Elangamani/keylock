/**
 * EmployeeHome Component (updated ribbons)
 *
 * - More & smaller ribbons
 * - Ribbons show only when congratulations text is present (nominations exist)
 * - Smooth fall + fade (3s)
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { getEmployeeNominations } from "../../../services/performancemanagement/hr/api";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/performancemanagement/employee/EmployeeHome.css";

export default function EmployeeHome() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loadingNominations, setLoadingNominations] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user ? user.empId : null;
  const [employeeId] = useState(() => empId);

  // Ribbons state
  const [showRibbons, setShowRibbons] = useState(false);
  const timeoutRef = useRef(null);

  // Generate many smaller ribbons (memoized)
  const ribbons = useMemo(() => {
    const colors = ["#FF4D4F", "#40A9FF", "#73D13D", "#FAAD14", "#9254DE", "#FF85C0"];
    const arr = [];
    // increase count to 40 for more confetti-like effect
    for (let i = 0; i < 40; i++) {
      arr.push({
        left: Math.random() * 100, // percentage
        delay: Math.random() * 0.5, // seconds (stagger start)
        rotate: Math.floor(Math.random() * 360),
        color: colors[Math.floor(Math.random() * colors.length)],
        // smaller ribbons
        width: 4 + Math.random() * 8,
        height: 10 + Math.random() * 20,
        opacity: 0.8 - Math.random() * 0.5,
        // gentle horizontal drift amplitude (px)
        drift: -30 + Math.random() * 60,
      });
    }
    return arr;
  }, []);

  // ========================
  // EFFECTS
  // ========================

  useEffect(() => {
    if (!employeeId) {
      navigate("/employee/login");
      return;
    }
    fetchNominations();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, navigate]);

  // Show ribbons when nominations exist and loading finished
  useEffect(() => {
    // only show ribbons when nominations are present
    if (!loadingNominations && nominations && nominations.length > 0) {
      // show for 3 seconds
      setShowRibbons(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowRibbons(false), 3000);
    } else {
      // ensure ribbons hidden if no nominations
      setShowRibbons(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [loadingNominations, nominations]);

  // ========================
  // API FUNCTIONS
  // ========================

  const fetchNominations = async () => {
    try {
      const response = await getEmployeeNominations(employeeId);
      if (response.status === 200 && response.data.success && response.data.count > 0) {
        setNominations(response.data.data);
      } else {
        setNominations([]);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setNominations([]);
    } finally {
      setLoadingNominations(false);
    }
  };

  // ========================
  // HANDLER FUNCTIONS
  // ========================

  const handleNavigateToAssessments = () => {
    navigate("/employee/dashboard/performance/my-assessments");
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  const renderNominationCard = () => {
    if (loadingNominations || nominations.length === 0) return null;

    return (
      <div className="ehp-nomination-card">
        
        <div className="ehp-nomination-content">
          <h3 className="ehp-nomination-title">Congratulations!</h3>
          <p className="ehp-nomination-text">
            You have been nominated for: <strong>{nominations.map(n => n.roleType).join(", ")}</strong>
          </p>
          <p className="ehp-nomination-subtext">
            Your hard work and dedication have been recognized!
          </p>
        </div>
      </div>
    );
  };

  // ========================
  // LOADING STATE
  // ========================

  if (loadingNominations) {
    return (
      <div className="ehp-loading-container">
        <div className="ehp-loading-content">
          <div className="spinner-border"></div>
          <p className="ehp-loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER
  // ========================

  return (
    <div className="ehp-page" style={{ position: "relative", minHeight: "100vh" }}>
      <ToastContainer />

      {/* Ribbons overlay - appears only for a few seconds and does not block interactions */}
      {showRibbons && (
        <div
          aria-hidden
          className="ehp-ribbons-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* local keyframes for falling + slight horizontal drift to avoid jitter */}
          <style>{`
            @keyframes ehpRibbonFall {
              0% {
                transform: translateY(-10vh) translateX(0) rotate(var(--start-rot));
                opacity: 1;
              }
              70% {
                opacity: 1;
              }
              100% {
                transform: translateY(110vh) translateX(var(--drift)) rotate(calc(var(--start-rot) + 360deg));
                opacity: 0;
              }
            }

            /* improve rendering performance and smoothness */
            .ehp-ribbon {
              will-change: transform, opacity;
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
              border-radius: 2px;
            }
          `}</style>

          {ribbons.map((r, idx) => (
            <div
              key={idx}
              className="ehp-ribbon"
              style={{
                position: "absolute",
                left: `${r.left}%`,
                top: `-10vh`,
                width: r.width,
                height: r.height,
                background: r.color,
                transform: `rotate(${r.rotate}deg)`,
                opacity: r.opacity,
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                animation: `ehpRibbonFall 3s cubic-bezier(.2,.8,.2,1) ${r.delay}s both`,
                // custom properties for keyframes
                ['--start-rot']: `${r.rotate}deg`,
                ['--drift']: `${r.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className="ehp-container">
        {/* Nomination Celebration Card */}
        {renderNominationCard()}

        {/* My Assessments Card - Single Centered Card */}
        <div className="ehp-assessment-section">
          <div
            className="ehp-assessment-card"
            onClick={handleNavigateToAssessments}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNavigateToAssessments()}
          >
            <div className="ehp-assessment-icon">
              <i className="bi bi-clipboard-check"></i>
            </div>
            <div className="ehp-assessment-content">
              <h3 className="ehp-assessment-title">My Assessments</h3>
              <p className="ehp-assessment-description">
                Complete your performance assessments and track your progress across all assigned evaluations
              </p>
              <div className="ehp-assessment-link">
                View Details
                <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
