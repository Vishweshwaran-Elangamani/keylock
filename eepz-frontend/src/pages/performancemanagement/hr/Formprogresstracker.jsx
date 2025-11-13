

import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";

export default function FormProgressTrackerPage() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Reduced for compact view

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

  // ✅ EXPORT TO CSV
  const handleExportCSV = () => {
    if (trackers.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare CSV header
    const headers = [
      "Tracker ID",
      "Assignment ID",
      "Employee Name",
      "L1 Manager",
      "L2 Manager",
      "Initiated",
      "Sent to Employee",
      "Employee Completed",
      "Sent to Manager",
      "Manager Completed",
      "Sent to Dept Head",
      "Sent to Leadership",
      "Last Updated"
    ];

    // Prepare CSV rows
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
      tracker.sentToLeadership ? "Yes" : "No",
      tracker.lastUpdated ? new Date(tracker.lastUpdated).toLocaleString() : "N/A"
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `FormProgressTracker_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculations
  const totalPages = Math.ceil(trackers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrackers = trackers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Helper to display boolean as icon only
  const BoolIcon = ({ value }) => (
    <span style={value ? styles.iconYes : styles.iconNo}>
      {value ? "✓" : "✗"}
    </span>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Form Progress Tracker</h2>
        {/* ✅ EXPORT BUTTON */}
        <button
          onClick={handleExportCSV}
          style={styles.exportButton}
          onMouseOver={(e) => e.currentTarget.style.background = "#1e40af"}
          onMouseOut={(e) => e.currentTarget.style.background = "#27235C"}
        >
          Export to CSV
        </button>
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <div className="spinner-border" style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading progress trackers...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {trackers.length === 0 && !loading && !error && (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📋</span>
          <p style={styles.emptyText}>No progress tracker data available.</p>
        </div>
      )}

      {trackers.length > 0 && !loading && (
        <div style={styles.cardWithBorder}>
          <div style={styles.cardHeaderDark}>
            <h5 style={styles.cardTitleWhite}>Progress Tracking Details</h5>
            <span style={styles.countBadge}>
              {trackers.length} Total Records
            </span>
          </div>

          {/* ✅ NO SCROLL - RESPONSIVE TABLE */}
          <div style={styles.tableContainer}>
            <table style={styles.table} aria-label="Form Progress Tracker Table">
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>ASSIGN ID</th>
                  <th style={styles.th}>EMPLOYEE</th>
                  <th style={styles.th}>L1</th>
                  <th style={styles.th}>L2</th>
                  <th style={styles.th}>INIT</th>
                  <th style={styles.th}>SENT EMP</th>
                  <th style={styles.th}>EMP DONE</th>
                  <th style={styles.th}>SENT MGR</th>
                  <th style={styles.th}>MGR DONE</th>
                  <th style={styles.th}>DEPT HEAD</th>
                  <th style={styles.th}>LEADERSHIP</th>
                  <th style={styles.th}>UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {currentTrackers.map(tracker => (
                  <tr key={tracker.trackerId} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.trackerBadge}>{tracker.trackerId}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.assignmentBadge}>{tracker.assignmentId}</span>
                    </td>
                    <td style={{...styles.td, fontSize: "12px", maxWidth: "80px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      {tracker.employeeName}
                    </td>
                    <td style={{...styles.td, fontSize: "12px", maxWidth: "70px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      {tracker.l1Name}
                    </td>
                    <td style={{...styles.td, fontSize: "12px", maxWidth: "70px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      {tracker.l2Name}
                    </td>
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
                      <BoolIcon value={tracker.sentToDeptHead} />
                    </td>
                    <td style={styles.td}>
                      <BoolIcon value={tracker.sentToLeadership} />
                    </td>
                    <td style={{...styles.td, fontSize: "11px", maxWidth: "100px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      {tracker.lastUpdated 
                        ? new Date(tracker.lastUpdated).toLocaleString() 
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Showing {startIndex + 1} to {Math.min(endIndex, trackers.length)} of{" "}
                {trackers.length} entries
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  style={
                    currentPage === 1
                      ? styles.paginationButtonDisabled
                      : styles.paginationButton
                  }
                >
                  Previous
                </button>

                <div style={styles.paginationNumbers}>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          style={
                            page === currentPage
                              ? styles.paginationNumberActive
                              : styles.paginationNumber
                          }
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} style={styles.paginationEllipsis}>
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

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

// ============================================================
// UPDATED STYLES - COMPACT & NO SCROLL
// ============================================================

const styles = {
  container: {
    padding: "24px 40px",
    margin: "0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#F7F8FA",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
  },

  // Header Section with Export Button
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#27235C",
    margin: "0",
    letterSpacing: "-0.5px",
  },

  // ✅ EXPORT BUTTON
  exportButton: {
    padding: "10px 20px",
    background: "#27235C",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(39, 35, 92, 0.2)"
  },

  // Loading State
  loadingContainer: {
    textAlign: "center",
    padding: "60px 20px",
  },

  spinner: {
    color: "#27235C",
    width: "48px",
    height: "48px",
  },

  loadingText: {
    marginTop: "16px",
    color: "#6B7280",
    fontSize: "15px",
  },

  // Error Alert
  errorAlert: {
    padding: "16px 20px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    color: "#991B1B",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },

  errorIcon: {
    fontSize: "20px",
  },

  // Empty State
  emptyState: {
    padding: "60px 24px",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
  },

  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },

  emptyText: {
    fontSize: "16px",
    color: "#374151",
    fontWeight: "600",
    margin: "0",
  },

  // Card Container
  cardWithBorder: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  },

  cardHeaderDark: {
    backgroundColor: "#27235C",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitleWhite: {
    margin: "0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#FFFFFF",
  },

  countBadge: {
    fontSize: "12px",
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    padding: "4px 10px",
    borderRadius: "16px",
    fontWeight: "600",
  },

  // ✅ NO SCROLL TABLE CONTAINER
  tableContainer: {
    backgroundColor: "#FFFFFF",
    padding: "0",
    width: "100%",
    boxSizing: "border-box",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },

  tableHead: {
    backgroundColor: "#F9FAFB",
  },

  th: {
    padding: "12px 8px",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "#F9FAFB",
    borderBottom: "2px solid #E5E7EB",
    whiteSpace: "nowrap",
  },

  tableRow: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #F3F4F6",
    transition: "background-color 0.2s ease",
  },

  td: {
    padding: "12px 8px",
    fontSize: "13px",
    color: "#1F2937",
    verticalAlign: "middle",
    textAlign: "center",
  },

  // Badge Styles
  trackerBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#7C3AED",
    color: "#FFFFFF",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "center",
  },

  assignmentBadge: {
    display: "inline-block",
    padding: "4px 8px",
    backgroundColor: "#27235C",
    color: "#FFFFFF",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "center",
  },

  // Icon Styles (Boolean Indicators)
  iconYes: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#D1FAE5",
    color: "#059669",
    fontWeight: "700",
    fontSize: "16px",
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
    fontWeight: "700",
    fontSize: "16px",
  },

  // Pagination Styles
  paginationContainer: {
    padding: "16px 20px",
    backgroundColor: "#FAFBFC",
    borderTop: "1px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  paginationInfo: {
    fontSize: "13px",
    color: "#6B7280",
    fontWeight: "500",
  },

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  paginationButton: {
    padding: "6px 12px",
    backgroundColor: "#FFFFFF",
    color: "#27235C",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  paginationButtonDisabled: {
    padding: "6px 12px",
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "not-allowed",
    opacity: "0.6",
  },

  paginationNumbers: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  paginationNumber: {
    padding: "6px 10px",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    border: "1px solid #D1D5DB",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "32px",
    textAlign: "center",
  },

  paginationNumberActive: {
    padding: "6px 10px",
    backgroundColor: "#27235C",
    color: "#FFFFFF",
    border: "1px solid #27235C",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "default",
    minWidth: "32px",
    textAlign: "center",
  },

  paginationEllipsis: {
    padding: "6px 4px",
    color: "#9CA3AF",
    fontSize: "12px",
  },
};
