import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/performancemanagement/employee/EmployeeHome.css";

export default function EmployeeHome() {
  const navigate = useNavigate();
  
  // Lazy initialization of user from localStorage
  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const employeeId = user?.empId || null;

  // Authentication check with useEffect
  useEffect(() => {
    if (!employeeId) {
      navigate("/employee/login");
    }
  }, [employeeId, navigate]);

  const handleNavigateToAssessments = () => {
    navigate("/employee/dashboard/performance/my-assessments");
  };

  // Don't render if no employeeId
  if (!employeeId) {
    return null;
  }

  return (
    <div className="ehp-page" style={{ position: "relative", minHeight: "80vh" }}>
      <div
        className="ehp-container"
        style={{ padding: 24, paddingTop: 40, position: "relative" }}
      >
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="ehp-assessment-card ehp-card"
            onClick={handleNavigateToAssessments}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleNavigateToAssessments()
            }
            aria-label="Go to My Assessments"
            style={{
              cursor: "pointer",
              width: "min(500px, 75%)",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 14px 32px rgba(20,30,60,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              background: "#fff",
              border: "1px solid darkblue",
              transition: "all 0.3s ease",
              marginBottom:"110px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(20,30,60,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 14px 32px rgba(20,30,60,0.06)";
            }}
          >
            <div
              className="ehp-assessment-icon"
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgb(3, 34, 112)",
                boxShadow: "0 8px 20px rgba(55, 100, 214, 0.14)",
              }}
            >
              <i
                className="bi bi-clipboard-check"
                style={{ color: "#fff", fontSize: 24 }}
              />
            </div>

            <div className="ehp-assessment-content" style={{ flex: 1 }}>
              <h3
                className="ehp-assessment-title"
                style={{ fontSize: 24, margin: 0, color: "#0f172a", marginBottom: "8px" }}
              >
                My Assessments
              </h3>
              <p
                className="ehp-assessment-description"
                style={{ marginTop: "8px", color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}
              >
                Complete your performance assessments and track your progress across
                all assigned evaluations.
              </p>

              <div style={{ marginTop: 14 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToAssessments();
                  }}
                  className="ehp-primary-btn"
                  style={{
                    background: "#eef2ff",
                    color: "#3740d6",
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#3740d6";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#eef2ff";
                    e.currentTarget.style.color = "#3740d6";
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ehp-container {
              padding: 16px !important;
            }
            
            .ehp-assessment-card {
              width: 100% !important;
              flex-direction: column;
              text-align: center;
            }
            
            .ehp-assessment-content {
              text-align: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
