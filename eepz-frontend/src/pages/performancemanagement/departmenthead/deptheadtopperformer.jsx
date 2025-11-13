import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
 
const THEME = {
  primary: "#27235C",
  secondary: "#AC5098",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#2C3E50",
  textLight: "#6C757D",
  border: "#E0E0E0"
};
 
export default function TopPerformers() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [showModal, setShowModal] = useState(false);
 
  const user = JSON.parse(localStorage.getItem("user"));
  const deptHeadId = user ? user.empId : null;
 
  useEffect(() => {
    if (!deptHeadId) {
      navigate("/depthead/login");
      return;
    }
    fetchNominations();
  }, [deptHeadId]);
 
  const fetchNominations = async () => {
    try {
      const response = await fetch(
        `http://localhost:5253/api/DepartmentHeadNomination/depthead/${deptHeadId}/approved-nominations`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Flatten all nominations from grouped data
          const allNominations = data.data.flatMap(group => group.nominations);
          setNominations(allNominations);
        }
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleViewDetails = (e, nomination) => {
    e.stopPropagation(); // FIXED: Prevent event bubbling
    setSelectedNomination(nomination);
    setShowModal(true);
  };
 
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: THEME.background
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner-border" style={{ color: THEME.primary }}></div>
          <p style={{ marginTop: "16px", color: THEME.textLight }}>Loading nominations...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div style={{
      minHeight: "100vh",
      background: THEME.background,
      padding: "32px 20px"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "32px",
          color: "#fff"
        }}>
          <button
            onClick={() => navigate("/depthead/homes")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "16px"
            }}
          >
            ← Back to Home
          </button>
          <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>
            Top Performers
          </h1>
          <p style={{ fontSize: "16px", opacity: 0.9, margin: 0 }}>
            {nominations.length} Approved Nominations
          </p>
        </div>
 
        {/* Nominations Grid */}
        {nominations.length === 0 ? (
          <div style={{
            background: THEME.card,
            borderRadius: "12px",
            padding: "60px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
            <h3 style={{ color: THEME.text, marginBottom: "8px" }}>No Approved Nominations</h3>
            <p style={{ color: THEME.textLight }}>There are no approved nominations in your department yet.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px"
          }}>
            {nominations.map((nomination) => (
              <div
                key={nomination.nominationId}
                style={{
                  background: THEME.card,
                  borderRadius: "12px",
                  padding: "24px",
                  border: `2px solid ${THEME.border}`,
                  transition: "all 0.3s",
                  cursor: "pointer"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = THEME.secondary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = THEME.border;
                }}
              >
                {/* Employee Info */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "12px"
                  }}>
                    {nomination.nominee.firstName[0]}{nomination.nominee.lastName[0]}
                  </div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: THEME.text,
                    marginBottom: "4px"
                  }}>
                    {nomination.nominee.fullName}
                  </h3>
                  <p style={{ fontSize: "14px", color: THEME.textLight, margin: 0 }}>
                    {nomination.nominee.email}
                  </p>
                </div>
 
                {/* Opportunity Info */}
                <div style={{
                  padding: "12px",
                  background: `${THEME.secondary}10`,
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}>
                  <p style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: THEME.secondary,
                    marginBottom: "4px"
                  }}>
                    {nomination.rewardType.rewardName}
                  </p>
                  <p style={{ fontSize: "12px", color: THEME.text, margin: 0 }}>
                    {nomination.opportunityName}
                  </p>
                </div>
 
                {/* Justification Preview */}
                <p style={{
                  fontSize: "14px",
                  color: THEME.text,
                  lineHeight: "1.6",
                  marginBottom: "16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {nomination.justification}
                </p>
 
                {/* View Button - FIXED */}
                <button
                  onClick={(e) => handleViewDetails(e, nomination)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* Details Modal */}
      {showModal && selectedNomination && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: THEME.card,
              borderRadius: "16px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
              padding: "24px",
              color: "#fff",
              borderRadius: "16px 16px 0 0"
            }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
                Nomination Details
              </h2>
            </div>
 
            {/* Modal Body */}
            <div style={{ padding: "32px" }}>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px"
                  }}>
                    NOMINEE NAME
                  </label>
                  <p style={{ fontSize: "16px", color: THEME.text, fontWeight: "600", margin: 0 }}>
                    {selectedNomination.nominee.fullName}
                  </p>
                </div>
                <div className="col-md-6">
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px"
                  }}>
                    EMPLOYEE ID
                  </label>
                  <p style={{ fontSize: "16px", color: THEME.text, fontWeight: "600", margin: 0 }}>
                    {selectedNomination.nominee.employeeId}
                  </p>
                </div>
              </div>
 
              <div className="row mb-4">
                <div className="col-md-6">
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px"
                  }}>
                    DEPARTMENT
                  </label>
                  <p style={{ fontSize: "16px", color: THEME.text, fontWeight: "600", margin: 0 }}>
                    {selectedNomination.nominee.department || "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px"
                  }}>
                    REWARD TYPE
                  </label>
                  <p style={{ fontSize: "16px", color: THEME.text, fontWeight: "600", margin: 0 }}>
                    {selectedNomination.rewardType.rewardName}
                  </p>
                </div>
              </div>
 
              <div className="mb-4">
                <label style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: THEME.textLight,
                  marginBottom: "8px",
                  display: "block"
                }}>
                  JUSTIFICATION
                </label>
                <div style={{
                  background: THEME.background,
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  color: THEME.text,
                  lineHeight: "1.7"
                }}>
                  {selectedNomination.justification}
                </div>
              </div>
 
              {/* Parameters */}
              {selectedNomination.parameterValues && selectedNomination.parameterValues.length > 0 && (
                <div>
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "12px",
                    display: "block"
                  }}>
                    NOMINATION PARAMETERS
                  </label>
                  {selectedNomination.parameterValues.map((param, idx) => (
                    <div key={idx} style={{
                      background: THEME.background,
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "8px"
                    }}>
                      <div className="row align-items-center">
                        <div className="col-7">
                          <p style={{ fontSize: "14px", fontWeight: "600", color: THEME.text, margin: 0 }}>
                            {param.parameterName}
                          </p>
                          <p style={{ fontSize: "12px", color: THEME.textLight, margin: 0 }}>
                            {param.parameterType}
                          </p>
                        </div>
                        <div className="col-5 text-end">
                          <p style={{ fontSize: "16px", fontWeight: "700", color: THEME.secondary, margin: 0 }}>
                            {param.parameterType === "Rating" ? `⭐ ${param.parameterValue}/5` : param.parameterValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* Modal Footer */}
            <div style={{
              padding: "20px 32px",
              borderTop: `1px solid ${THEME.border}`,
              textAlign: "right"
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "12px 32px",
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
