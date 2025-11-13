import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";

function HRAssessmentView() {
  const [submittedForms, setSubmittedForms] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("submitted");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const { data: submittedData } = await api.get("/SelfAssessment/submitted");
      const { data: allAssignmentsData } = await api.get("/AppraisalProcess/all");

      if (submittedData.success) {
        setSubmittedForms(submittedData.data.assessments || []);
      }

      if (allAssignmentsData.success) {
        const pending = allAssignmentsData.data.filter(a => !a.isSubmitted);
        setPendingForms(pending);
      }

      setMsg("Data loaded successfully.");
    } catch (error) {
      console.error("Fetch error:", error);
      setMsg("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const viewAssessmentDetails = async (assessmentId) => {
    try {
      const { data } = await api.get(`/SelfAssessment/${assessmentId}`);
      
      if (data.success) {
        setViewingDetails(data.data);
      } else {
        alert("Failed to load assessment details.");
      }
    } catch (error) {
      console.error("Details error:", error);
      alert("Error loading details.");
    }
  };

  const closeDetailsModal = () => {
    setViewingDetails(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>HR Assessment Management Dashboard</h3>
      </div>

      {msg && (
        <div style={styles.alertInfo}>
          {msg}
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <div className="spinner-border" style={styles.spinner}></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div style={styles.summaryRow}>
            <div style={styles.summaryCardSubmitted}>
              <div style={styles.summaryCardBody}>
                <h2 style={styles.summaryNumber}>{submittedForms.length}</h2>
                <small style={styles.summaryLabel}>Submitted Forms</small>
              </div>
            </div>
            <div style={styles.summaryCardPending}>
              <div style={styles.summaryCardBody}>
                <h2 style={styles.summaryNumber}>{pendingForms.length}</h2>
                <small style={styles.summaryLabel}>Pending Forms</small>
              </div>
            </div>
          </div>

          {/* Tab Buttons */}
          <div style={styles.tabContainer}>
            <button
              style={activeTab === "submitted" ? styles.tabButtonActiveSubmitted : styles.tabButtonInactive}
              onClick={() => setActiveTab("submitted")}
            >
              View Submitted Assessments ({submittedForms.length})
            </button>
            <button
              style={activeTab === "pending" ? styles.tabButtonActivePending : styles.tabButtonInactive}
              onClick={() => setActiveTab("pending")}
            >
              View Pending Assessments ({pendingForms.length})
            </button>
          </div>

          {/* Submitted Forms Section */}
          {activeTab === "submitted" && (
            <div style={styles.card}>
              <div style={styles.cardHeaderSubmitted}>
                <h5 style={styles.cardHeaderTitle}>Submitted Assessments ({submittedForms.length})</h5>
              </div>
              <div style={styles.cardBody}>
                {submittedForms.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.tableHead}>
                        <tr>
                          <th style={styles.th}>Assessment ID</th>
                          <th style={styles.th}>Form Name</th>
                          <th style={styles.th}>Employee Name</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Form Type</th>
                          <th style={styles.th}>Submitted At</th>
                          <th style={styles.th}>Competencies</th>
                          <th style={styles.th}>Employee Submission</th>
                          <th style={styles.th}>Manager Submission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submittedForms.map((form) => (
                          <tr key={form.assessmentId} style={styles.tableRow}>
                            <td style={styles.td}>
                              <span style={styles.badgePrimary}>{form.assessmentId}</span>
                            </td>
                            <td style={styles.td}><strong>{form.formName}</strong></td>
                            <td style={styles.td}>{form.userName}</td>
                            <td style={styles.td}><small>{form.email}</small></td>
                            <td style={styles.td}>
                              <span style={styles.badgeAccent}>{form.formType}</span>
                            </td>
                            <td style={styles.td}>
                              <small>
                                {form.submittedAt
                                  ? new Date(form.submittedAt).toLocaleString()
                                  : "-"}
                              </small>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.badgeBlue}>{form.competencyCount}</span>
                            </td>
                            <td style={styles.td}>
                              <button
                                style={styles.btnPrimary}
                                onClick={() => viewAssessmentDetails(form.assessmentId)}
                              >
                                View Details
                              </button>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.badgeGray}>Not Yet Submitted</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    No submitted assessments found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Forms Section */}
          {activeTab === "pending" && (
            <div style={styles.card}>
              <div style={styles.cardHeaderPending}>
                <h5 style={styles.cardHeaderTitle}>Pending Assessments ({pendingForms.length})</h5>
              </div>
              <div style={styles.cardBody}>
                {pendingForms.length > 0 ? (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.tableHead}>
                        <tr>
                          <th style={styles.th}>Assignment ID</th>
                          <th style={styles.th}>Form Name</th>
                          <th style={styles.th}>Employee Name</th>
                          <th style={styles.th}>Form Type</th>
                          <th style={styles.th}>Assigned At</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingForms.map((form) => (
                          <tr key={form.assignmentId} style={styles.tableRow}>
                            <td style={styles.td}>
                              <span style={styles.badgePrimary}>{form.assignmentId}</span>
                            </td>
                            <td style={styles.td}><strong>{form.formName}</strong></td>
                            <td style={styles.td}>{form.employeeName}</td>
                            <td style={styles.td}>
                              <span style={styles.badgeAccent}>{form.formType}</span>
                            </td>
                            <td style={styles.td}>
                              <small>
                                {form.assignedAt
                                  ? new Date(form.assignedAt).toLocaleString()
                                  : "-"}
                              </small>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.badgeWarning}>Pending</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    No pending assessments found.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {viewingDetails && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalDialog}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h5 style={styles.modalTitle}>
                  Assessment Details: {viewingDetails.formName}
                </h5>
                <button
                  style={styles.closeButton}
                  onClick={closeDetailsModal}
                >
                  ×
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.detailsRow}>
                  <div style={styles.detailsCol}>
                    <p style={styles.detailText}>
                      <strong>Employee:</strong> {viewingDetails.userName}
                    </p>
                    <p style={styles.detailText}>
                      <strong>Status:</strong>{" "}
                      <span style={styles.badgeSuccess}>{viewingDetails.status}</span>
                    </p>
                  </div>
                  <div style={styles.detailsCol}>
                    <p style={styles.detailText}>
                      <strong>Submitted:</strong>{" "}
                      {viewingDetails.submittedAt
                        ? new Date(viewingDetails.submittedAt).toLocaleString()
                        : "-"}
                    </p>
                    <p style={styles.detailText}>
                      <strong>Assessment ID:</strong> {viewingDetails.assessmentId}
                    </p>
                  </div>
                </div>

                <h6 style={styles.sectionTitle}>Competency Ratings</h6>

                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={{...styles.th, width: "5%"}}>No.</th>
                        <th style={{...styles.th, width: "25%"}}>Competency</th>
                        <th style={{...styles.th, width: "35%"}}>Description</th>
                        <th style={{...styles.th, width: "10%"}}>Rating</th>
                        <th style={{...styles.th, width: "25%"}}>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingDetails.details && viewingDetails.details.length > 0 ? (
                        viewingDetails.details.map((detail, index) => (
                          <tr key={detail.detailId} style={styles.tableRow}>
                            <td style={{...styles.td, textAlign: "center"}}>{index + 1}</td>
                            <td style={styles.td}><strong>{detail.competencyName}</strong></td>
                            <td style={styles.td}>
                              <small>{detail.competencyDescription || "-"}</small>
                            </td>
                            <td style={{...styles.td, textAlign: "center"}}>
                              <span style={styles.badgeBlue}>
                                {detail.employeeRating || 0} / 5
                              </span>
                            </td>
                            <td style={styles.td}>
                              <small>
                                {detail.employeeComments || (
                                  <em style={styles.mutedText}>No comments</em>
                                )}
                              </small>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{...styles.td, textAlign: "center"}}>
                            <span style={styles.mutedText}>No competency details available.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.btnSecondary} onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Professional Styles - Dark Blue Theme (No Rose/Orange)
const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#FFFFFF",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#27235C", // Primary dark blue
    margin: "0",
  },
  alertInfo: {
    padding: "16px",
    marginBottom: "24px",
    backgroundColor: "#FCFCF9",
    border: "1px solid #C1C7C8",
    borderRadius: "8px",
    color: "#27235C",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "48px",
  },
  spinner: {
    color: "#27235C",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCardSubmitted: {
    backgroundColor: "#524F7D", // Medium blue (submitted)
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  summaryCardPending: {
    backgroundColor: "#7D7B90", // Light blue (pending)
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  summaryCardBody: {
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: "48px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#FFFFFF",
    fontWeight: "500",
  },
  tabContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  tabButtonActiveSubmitted: {
    padding: "12px 24px",
    backgroundColor: "#524F7D", // Medium blue
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  tabButtonActivePending: {
    padding: "12px 24px",
    backgroundColor: "#7D7B90", // Light blue
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  tabButtonInactive: {
    padding: "12px 24px",
    backgroundColor: "#FFFFFF",
    color: "#27235C",
    border: "2px solid #C1C7C8",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "24px",
    border: "1px solid #EEEEEE",
  },
  cardHeaderSubmitted: {
    backgroundColor: "#524F7D", // Medium blue
    padding: "16px 24px",
  },
  cardHeaderPending: {
    backgroundColor: "#7D7B90", // Light blue
    padding: "16px 24px",
  },
  cardHeaderTitle: {
    margin: "0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardBody: {
    padding: "0",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHead: {
    backgroundColor: "#F9F9F9",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#27235C",
    borderBottom: "2px solid #EEEEEE",
  },
  tableRow: {
    borderBottom: "1px solid #F5F5F5",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#000000",
  },
  badgePrimary: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#27235C", // Dark blue
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeAccent: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#524F7D", // Medium blue
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeBlue: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#0F82FE", // Bright blue
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeSuccess: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#24A148", // Green
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeWarning: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#7D7B90", // Light blue (instead of orange)
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeGray: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#7F7F7F", // Gray
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnPrimary: {
    padding: "8px 16px",
    backgroundColor: "#27235C", // Dark blue
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnSecondary: {
    padding: "10px 20px",
    backgroundColor: "#7D7B90", // Light blue
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalDialog: {
    width: "90%",
    maxWidth: "1200px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    padding: "24px",
    backgroundColor: "#27235C", // Dark blue
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
  },
  modalTitle: {
    margin: "0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "32px",
    color: "#FFFFFF",
    cursor: "pointer",
    padding: "0",
    lineHeight: "1",
  },
  modalBody: {
    padding: "24px",
  },
  detailsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  detailsCol: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailText: {
    margin: "0",
    fontSize: "14px",
    color: "#000000",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#27235C",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "2px solid #EEEEEE",
  },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #EEEEEE",
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#F9F9F9",
  },
  mutedText: {
    color: "#9E9E9E",
  },
};

export default HRAssessmentView;