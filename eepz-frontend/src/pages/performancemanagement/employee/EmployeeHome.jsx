import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeNominations } from "../../../services/performancemanagement/hr/api";
import "../../../styles/performancemanagement/employee/EmployeeHome.css";

export default function EmployeeHome() {
  const navigate = useNavigate();
  const [hasNominations, setHasNominations] = useState(false);
  const [awardName, setAwardName] = useState("");


  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user ? user.empId : null;

  if (!employeeId) {
    navigate("/employee/login");
    return null;
  }


  const fetchNominations = async () => {
    try {
      const response = await getEmployeeNominations(employeeId);
      console.log("Fetched Nominations: ", response);
      if (response.data.success && response.data.data.length > 0) {
        setHasNominations(true);
        setAwardName(response.data.data[0].roleType);
      } else {
        setHasNominations(false);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      setHasNominations(false);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, [employeeId]);

  const handleNavigateToAssessments = () => {
    navigate("/employee/dashboard/performance/my-assessments");
  };

  const handleNavigateToNominations = () => {
    navigate("/employee/dashboard/performance/nominations");
  };

  return (
    <div className="ehp-page" style={{ position: "relative", minHeight: "80vh" }}>
      <div
        className="ehp-container"
        style={{ padding: 24, paddingTop: 110, position: "relative" }}
      >

        {hasNominations && (
          <div
            onClick={handleNavigateToNominations}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleNavigateToNominations()
            }
            aria-label="View Nominations"
            style={{
              position: "absolute",
              top: "-70px",
              right: "-29px",
              width: 320,
              backgroundColor: "#f5f5f7",
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 12px 32px rgba(45, 18, 145, 0.4)",
              cursor: "pointer",
              zIndex: 50,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "flex",
              alignItems: "center",

              gap: "16px",

            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.15)";
            }}
          >

            <div
              style={{
                position: "relative",
                width: 90,
                height: 90,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >

              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  fontSize: 8,
                  color: "#e74c3c",
                }}
              >
                ★
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 12,
                  fontSize: 7,
                  color: "#3498db",
                }}
              >
                ★
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 0,
                  fontSize: 7,
                  color: "#3498db",
                }}
              >
                ★
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  right: 0,
                  fontSize: 10,
                  color: "#e67e22",
                }}
              >
                ✦
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 4,
                  fontSize: 6,
                  color: "#16a085",
                }}
              >
                ★
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 32,
                  fontSize: 8,
                  color: "#9b59b6",
                }}
              >
                ✦
              </div>


              <div
                style={{
                  width: 75,
                  height: 75,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #f9ca24 0%, #f39c12 50%, #e67e22 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 8px 20px rgba(243, 156, 18, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.15)",
                  position: "relative",
                }}
              >

                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ffd93d 0%, #f9ca24 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      color: "#f39c12",
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
                    }}
                  >
                    ★
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: -20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 42,
                  height: 34,
                  display: "flex",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 34,
                    background: "linear-gradient(180deg, #ff6b9d 0%, #c44569 100%)",
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  }}
                />
                <div
                  style={{
                    width: 20,
                    height: 34,
                    background: "linear-gradient(180deg, #ffa07a 0%, #ff6b9d 100%)",
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  }}
                />
              </div>
            </div>


            <div style={{ flex: 1, textAlign: "left" }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: "0 0 4px",
                  letterSpacing: "-0.01em",
                }}
              >
                Congratulations!
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4a5568",
                  margin: "0 0 12px",
                  fontWeight: 600,
                  lineHeight: 1.6,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "4px 0",
                  paddingRight: "130px"
                }}
              >
                {awardName ? `${awardName}` : "You earned points"}
              </p>



              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToNominations();
                }}
                style={{
                  width: "50%",
                  padding: "8px 16px",
                  backgroundColor: "#27235c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "#27235c",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#27235c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#27235ce";
                }}
              >
                View
              </button>
            </div>
          </div>
        )}


        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 500,
            marginTop: "20px",
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
              border: "1px solid darkblue"
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
                style={{ fontSize: 24, margin: 0, color: "#0f172a" }}
              >
                My Assessments
                <br />
                <br />
              </h3>
              <p
                className="ehp-assessment-description"
                style={{ marginTop: "0px", color: "#6b7280", fontSize: 13 }}
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
            
            /* Move notification to static position on mobile */
            .ehp-container > div[role="button"][aria-label="View Nominations"] {
              position: static !important;
              margin-bottom: 20px;
              width: 100% !important;
              right: auto !important;
              flex-direction: column;
              text-align: center;
            }
            
            .ehp-container > div[role="button"][aria-label="View Nominations"] > div:last-child {
              text-align: center !important;
            }
          }
        `}</style>

      </div>
    </div>
  );
}
