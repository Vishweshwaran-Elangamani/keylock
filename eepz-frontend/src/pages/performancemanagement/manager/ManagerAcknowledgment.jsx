import React, { useEffect, useState } from "react";
import { getManagerEmployeeAcknowledgments } from "../../../services/performancemanagement/hr/api";
import { getUserIdFromToken } from "../../../utils/PerformanceManagement/jwtDecoder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManagerAcknowledgment() {
  const [ackList, setAckList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAckList();
  }, []);

  const fetchAckList = async () => {
    setLoading(true);
    setError(null);
    try {
      const managerId = getUserIdFromToken();
      if (!managerId) {
        setError("Manager ID not found in token");
        setLoading(false);
        return;
      }
      const res = await getManagerEmployeeAcknowledgments(managerId);
      if (res.data.success) {
        setAckList(res.data.data);
      } else {
        setError("Failed to load acknowledgments");
      }
    } catch (err) {
      setError("Failed to load acknowledgments");
      toast.error("Failed to load acknowledgments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 style={styles.title}>Employee Acknowledgments</h2>
      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : ackList.length === 0 ? (
        <div style={styles.empty}>No employee acknowledgments found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>Employee Comment</th>
              <th style={styles.th}>Date Acknowledged</th>
            </tr>
          </thead>
          <tbody>
            {ackList.map((row, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.td}>{row.employeeName}</td>
                <td style={styles.td}>{row.employeeComments}</td>
                <td style={styles.td}>
                  {row.acknowledgedAt
                    ? new Date(row.acknowledgedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "32px auto",
    padding: 32,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    fontSize: 28,
    color: "#27235C",
    marginBottom: 24,
    fontWeight: 700,
    textAlign: "center",
  },
  loading: {
    padding: 32,
    textAlign: "center",
  },
  error: {
    padding: 32,
    color: "#b91c1c",
    background: "#fee2e2",
    textAlign: "center",
    borderRadius: 8,
    marginBottom: 24,
  },
  empty: {
    padding: 40,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f1f5f9",
    color: "#27235C",
    fontWeight: 700,
    borderBottom: "2px solid #E0E0E0",
  },
  tr: {
    borderBottom: "1px solid #E0E0E0",
  },
  td: {
    padding: "12px 16px",
    color: "#2C3E50",
    fontSize: "15px",
  },
};
