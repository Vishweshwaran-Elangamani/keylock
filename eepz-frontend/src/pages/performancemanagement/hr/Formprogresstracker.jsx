import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";

export default function FormProgressTrackerPage() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/FormProgressTracker");
      if (res.data.success) {
        setTrackers(res.data.data);
      } else {
        setError("Failed to load progress trackers");
      }
    } catch (e) {
      setError("Error fetching progress trackers");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (trackers.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Tracker ID",
      "Assignment ID",
      "Employee",
      "L1",
      "L2",
      "Initiated",
      "Sent To Employee",
      "Employee Completed",
      "Sent To Manager",
      "Manager Completed",
      "Sent To Dept Head",
      "DeptHead Approved",
      "Emp Acknowledged",
      "Sent To Leadership",
      "Last Updated",
    ];

    const rows = trackers.map((tracker) => [
      tracker.trackerId,
      tracker.assignmentId,
      tracker.employeeName,
      tracker.l1Name,
      tracker.l2Name,
      tracker.initiated ? "Yes" : "No",
      tracker.sentToEmployee ? "Yes" : "No",
      tracker.employeeCompleted ? "Yes" : "No",
      tracker.sentToManager ? "Yes" : "No",
      tracker.managerCompleted ? "Yes" : "No",
      tracker.sentToDeptHead ? "Yes" : "No",
      tracker.deptHeadApproved ? "Yes" : "No",
      tracker.empAcknowledged ? "Yes" : "No",
      tracker.sentToLeadership ? "Yes" : "No",
      tracker.lastUpdated
        ? new Date(tracker.lastUpdated).toLocaleString()
        : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FormProgressTracker_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // pagination
  const totalPages = Math.ceil(trackers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrackers = trackers.slice(startIndex, endIndex);

  const goToPage = (p) => setCurrentPage(p);
  const goToPrev = () => setCurrentPage((cp) => Math.max(1, cp - 1));
  const goToNext = () => setCurrentPage((cp) => Math.min(totalPages, cp + 1));

  const BoolIcon = ({ value }) => (
    <span style={value ? styles.iconYes : styles.iconNo}>
      {value ? "✓" : "✗"}
    </span>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Form Progress Tracker</h2>
        <button onClick={handleExportCSV} style={styles.exportButton}>
          Export CSV
        </button>
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      )}
      {error && <div style={styles.errorAlert}>{error}</div>}
      {!loading && !error && trackers.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No progress tracker data available.</p>
        </div>
      )}

      {trackers.length > 0 && (
        <div style={styles.cardWithBorder}>
          <div style={styles.cardHeaderDark}>
            <h5 style={styles.cardTitleWhite}>Progress Tracking Details</h5>
            <span style={styles.countBadge}>
              {trackers.length} Total Records
            </span>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>ASSIGN</th>
                  <th style={styles.th}>EMPLOYEE</th>
                  <th style={styles.th}>L1</th>
                  <th style={styles.th}>L2</th>
                  <th style={styles.th}>INIT</th>
                  <th style={styles.th}>SENT EMP</th>
                  <th style={styles.th}>EMP DONE</th>
                  <th style={styles.th}>SENT MGR</th>
                  <th style={styles.th}>MGR DONE</th>
                  <th style={styles.th}>DEPT HEAD</th>
                  <th style={styles.th}>EMP ACK</th>
                  <th style={styles.th}>UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {currentTrackers.map((tracker) => (
                  <tr key={tracker.trackerId} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.trackerBadge}>
                        {tracker.trackerId}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.assignmentBadge}>
                        {tracker.assignmentId}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "left" }}>
                      {tracker.employeeName}
                    </td>
                    <td style={styles.td}>{tracker.l1Name}</td>
                    <td style={styles.td}>{tracker.l2Name}</td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.initiated} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.sentToEmployee} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.employeeCompleted} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.sentToManager} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.managerCompleted} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.deptHeadApproved} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.empAcknowledged} />
                    </td>
                    <td style={styles.td}>
                      {tracker.lastUpdated
                        ? new Date(tracker.lastUpdated).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, trackers.length)} of {trackers.length}{" "}
                entries
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={goToPrev}
                  disabled={currentPage === 1}
                  style={
                    currentPage === 1
                      ? styles.paginationButtonDisabled
                      : styles.paginationButton
                  }
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    style={
                      currentPage === i + 1
                        ? styles.paginationNumberActive
                        : styles.paginationNumber
                    }
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  style={
                    currentPage === totalPages
                      ? styles.paginationButtonDisabled
                      : styles.paginationButton
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// (styles object — reuse your existing styles from previous version)
const styles = {
  // copy/paste your styles object from the version you already use.
  // Keep BoolIcon, badges, table and pagination styles as you had.
  container: {
    padding: "24px 40px",
    backgroundColor: "#F7F8FA",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: { fontSize: "32px", fontWeight: 700, color: "#27235C", margin: 0 },
  exportButton: {
    padding: "10px 20px",
    background: "#27235C",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  loadingContainer: { textAlign: "center", padding: "60px 20px" },
  loadingText: { color: "#6B7280" },
  errorAlert: { padding: "16px", backgroundColor: "#FEF2F2", color: "#991B1B" },
  emptyState: { padding: "60px 24px", textAlign: "center" },
  emptyText: { fontSize: "16px" },
  cardWithBorder: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  cardHeaderDark: {
    backgroundColor: "#27235C",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleWhite: { color: "#fff", margin: 0 },
  countBadge: {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "4px 10px",
    borderRadius: "16px",
  },
  tableContainer: { width: "100%" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { backgroundColor: "#F9FAFB" },
  th: {
    padding: "12px 8px",
    textAlign: "center",
    fontSize: "10px",
    textTransform: "uppercase",
    borderBottom: "2px solid #E5E7EB",
  },
  tableRow: { borderBottom: "1px solid #F3F4F6" },
  td: {
    padding: "12px 8px",
    fontSize: "13px",
    color: "#1F2937",
    textAlign: "center",
  },
  trackerBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#7C3AED",
    color: "#fff",
    borderRadius: "4px",
  },
  assignmentBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#27235C",
    color: "#fff",
    borderRadius: "4px",
  },
  iconYes: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#D1FAE5",
    color: "#059669",
  },
  iconNo: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  paginationContainer: {
    padding: "12px 20px",
    backgroundColor: "#FAFBFC",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paginationInfo: { color: "#6B7280" },
  paginationControls: { display: "flex", gap: "6px", alignItems: "center" },
  paginationButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    backgroundColor: "#fff",
    border: "1px solid #D1D5DB",
    cursor: "pointer",
  },
  paginationButtonDisabled: {
    padding: "6px 12px",
    borderRadius: "6px",
    backgroundColor: "#F3F4F6",
    border: "1px solid #E5E7EB",
    cursor: "not-allowed",
  },
  paginationNumber: {
    padding: "6px 10px",
    border: "1px solid #D1D5DB",
    borderRadius: "4px",
    cursor: "pointer",
  },
  paginationNumberActive: {
    padding: "6px 10px",
    backgroundColor: "#27235C",
    color: "#fff",
    borderRadius: "4px",
  },
};
