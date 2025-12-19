import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";
import toast, { Toaster } from "react-hot-toast";
import Breadcrumb from "../../../components/common/Breadcrumb";
 
const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f7f9",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#27235C",
    fontSize: "24px",
    fontWeight: 700,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    marginBottom: "30px",
  },
  cardHeader: {
    padding: "15px 25px",
    borderBottom: "1px solid #e0e0e0",
  },
  cardTitle: {
    margin: 0,
    color: "#27235C",
    fontWeight: 600,
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#F7F9FA" },
  th: {
    padding: "12px 20px",
    textAlign: "left",
    color: "#5C5C5C",
    fontSize: "14px",
    fontWeight: 600,
    textTransform: "uppercase",
    borderBottom: "2px solid #e0e0e0",
  },
  td: {
    padding: "15px 20px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "14px",
    verticalAlign: "top",
  },
  tableRow: {
    cursor: "default",
    transition: "background-color 0.2s",
  },
  badge: (bgColor, textColor = "#FFFFFF") => ({
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: bgColor,
    color: textColor,
    minWidth: "80px",
    textAlign: "center",
  }),
  loadingContainer: { textAlign: "center", padding: "50px" },
  emptyState: { textAlign: "center", padding: "40px", color: "#6c757d" },
  actionButton: {
    padding: "8px 15px",
    fontSize: "14px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    backgroundColor: "#97247E",
    color: "#FFFFFF",
    fontWeight: 600,
  },
};
 
const Badge = ({ status }) => {
  let color;
  switch (status) {
    case "Completed":
      color = "#24A148";
      break;
    case "Pending":
      color = "#ffc107";
      break;
    case "Not Started":
      color = "#6c757d";
      break;
    case "N/A":
      color = "#e9ecef";
      break;
    default:
      color = "#97247E";
  }
  return (
    <span style={styles.badge(color, status === "N/A" ? "#495057" : "#FFFFFF")}>
      {status}
    </span>
  );
};
 
const processAppraisalData = (data) =>
  data.map((appraisal) => {
    const employeeSubmitted = !!appraisal.selfAssessmentSubmittedAt;
    const firstCompetency = appraisal.competencies[0];
 
    const employeeStatus = employeeSubmitted ? "Completed" : "Pending";
 
    const l1Completed =
      firstCompetency &&
      firstCompetency.l1Rating !== null &&
      firstCompetency.l1Comments?.trim();
 
    const l2Completed =
      firstCompetency &&
      firstCompetency.l2Rating !== null &&
      firstCompetency.l2Comments?.trim();
 
    return {
      ...appraisal,
      employeeStatus,
      l1Status: employeeSubmitted
        ? l1Completed
          ? "Completed"
          : "Pending"
        : "Not Started",
      l2Status: l1Completed
        ? l2Completed
          ? "Completed"
          : "Pending"
        : "Not Started",
    };
  });
 
function AssessmentStatusTracker() {
  const [appraisalData, setAppraisalData] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchAppraisalDetails = async () => {
      try {
        const { data } = await api.get("/AppraisalProcess/all-details");
        if (data.success && Array.isArray(data.data)) {
          setAppraisalData(processAppraisalData(data.data));
          toast.success("Appraisal statuses loaded successfully!");
        } else {
          toast.error("Invalid data format received.");
        }
      } catch (error) {
        toast.error("Failed to load appraisal details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppraisalDetails();
  }, []);
 
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading assessment data...</p>
      </div>
    );
  }
 
  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
 
      {/*  Breadcrumb added here */}
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/hr/dashboard" },
          { label: "Performance", path: "/hr/dashboard/performance" },
          { label: "Appraisal Status", path: null },
        ]}
      />
 
      <div style={styles.header}>
        <h2 style={styles.title}>🎯 Detailed Appraisal Status Tracker</h2>
        <button
          style={styles.actionButton}
          onClick={() => window.location.reload()}
        >
          Refresh Data
        </button>
      </div>
 
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            All Appraisals ({appraisalData.length})
          </h5>
        </div>
 
        <div style={styles.tableContainer}>
          {appraisalData.length > 0 ? (
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>Employee ID</th>
                  <th style={styles.th}>Employee Name</th>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>Employee Status</th>
                  <th style={styles.th}>L1 Status</th>
                  <th style={styles.th}>L2 Status</th>
                  <th style={styles.th}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {appraisalData.map((a) => (
                  <tr key={a.employeeId} style={styles.tableRow}>
                    <td style={styles.td}>{a.employeeId}</td>
                    <td style={styles.td}>
                      <strong>{a.employeeName}</strong>
                    </td>
                    <td style={styles.td}>{a.projectName}</td>
                    <td style={styles.td}>
                      <Badge status={a.employeeStatus} />
                    </td>
                    <td style={styles.td}>
                      <Badge status={a.l1Status} />
                    </td>
                    <td style={styles.td}>
                      <Badge status={a.l2Status} />
                    </td>
                    <td style={styles.td}>
                      <Badge
                        status={
                          a.l2Status === "Completed" ? "Completed" : "Pending"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>No appraisal data found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default AssessmentStatusTracker;
 