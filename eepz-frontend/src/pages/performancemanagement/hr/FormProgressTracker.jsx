import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import "../../../styles/performancemanagement/hr/FormProgressTracker.css";

export default function FormProgressTrackerPage() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const navigate = useNavigate();

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
      "Tracker ID", "Assignment ID", "Employee", "L1", "L2",
      "Initiated", "Sent To Employee", "Employee Completed", "Sent To Manager", "Manager Completed",
      "Sent To Dept Head", "DeptHead Approved", "Emp Acknowledged", "Sent To Leadership", "Last Updated"
    ];
    const rows = trackers.map(tracker => [
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
      tracker.lastUpdated ? new Date(tracker.lastUpdated).toLocaleString() : "N/A"
    ]);
    const csvContent = [headers.join(","),
    ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FormProgressTracker_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const totalPages = Math.ceil(trackers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrackers = trackers.slice(startIndex, endIndex);

  const goToPage = p => setCurrentPage(p);
  const goToPrev = () => setCurrentPage(cp => Math.max(1, cp - 1));
  const goToNext = () => setCurrentPage(cp => Math.min(totalPages, cp + 1));

  const BoolIcon = ({ value }) => (
    <span className={value ? "fld-status-icon fld-icon-yes" : "fld-status-icon fld-icon-no"}>
      {value ? <span>&#10003;</span> : <span>&#10007;</span>}
    </span>
  );

  return (
    <div className="fld-root">
      <div className="fld-header-wrapper d-flex justify-content-between align-items-center">

        <nav className="cg-breadcrumbs" aria-label="breadcrumb">
          <style>
            {`
      .cg-breadcrumb-item + .cg-breadcrumb-item::before {
        content: "/";
        margin: 0 0.5rem;
        color:purple;
      }
    `}
          </style>
          <ol className="cg-breadcrumb">
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard")}
              style={{ cursor: "pointer" }}>
              <i className="bi bi-house-door"></i>
            </li>
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard/performance")}
              style={{ cursor: "pointer" }}>
              Performance
            </li>
            <li className="cg-breadcrumb-item active" aria-current="page">
              Initiate Form
            </li>
          </ol>
        </nav>

        <div className="fld-header-row d-flex justify-content-end align-items-center">
          <button className="fld-btn-export" onClick={handleExportCSV}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      {loading && <div className="fld-loading"><div>Loading...</div></div>}
      {error && <div className="fld-error">{error}</div>}
      {!loading && !error && trackers.length === 0 &&
        <div className="fld-empty-state"><p>No progress tracker data available.</p></div>
      }

      {trackers.length > 0 &&
        <div className="fld-card">

          <div
            className="fld-table-wrapper"
            style={{
              border: "2px solid #27235C",
              borderCollapse: "collapse",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "0.5rem",
              borderRadius: "14px"
            }}
          >
            <table
              className="fld-table-formhrp"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>L1</th>
                  <th>L2</th>
                  <th>Initiated</th>
                  <th>Sent Emp</th>
                  <th>Emp Done</th>
                  <th>Sent Mgr</th>
                  <th>Mgr Done</th>
                  <th>Dept Head</th>
                  <th>Emp Ack</th>
                </tr>
              </thead>
              <tbody>
                {currentTrackers.map(tracker => (
                  <tr key={tracker.trackerId}>
                    <td style={{ textAlign: "left" }}>{tracker.employeeName}</td>
                    <td>{tracker.l1Name}</td>
                    <td>{tracker.l2Name}</td>
                    <td style={{ color: tracker.initiated ? "green" : "red" }}>
                      {tracker.initiated ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.sentToEmployee ? "green" : "red" }}>
                      {tracker.sentToEmployee ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.employeeCompleted ? "green" : "red" }}>
                      {tracker.employeeCompleted ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.sentToManager ? "green" : "red" }}>
                      {tracker.sentToManager ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.managerCompleted ? "green" : "red" }}>
                      {tracker.managerCompleted ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.deptHeadApproved ? "green" : "red" }}>
                      {tracker.deptHeadApproved ? "✔" : "✖"}
                    </td>
                    <td style={{ color: tracker.empAcknowledged ? "green" : "red" }}>
                      {tracker.empAcknowledged ? "✔" : "✖"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="fld-pagination-container" style={{ marginTop: "0.5rem" }}>
              <div className="fld-pagination-info">
                <span className="fld-show-entries-label">Show&nbsp;</span>
                <select
                  className="fld-pagination-select"
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                </select>
                <span className="fld-show-entries-label">&nbsp;entries</span>
                <span className="fld-pagination-status">
                  &nbsp;&nbsp;Showing {startIndex + 1} to {Math.min(endIndex, trackers.length)} of {trackers.length} entries
                </span>
              </div>
              <div className="fld-pagination-controls">
                <button
                  onClick={goToPrev}
                  disabled={currentPage === 1}
                  className="fld-pagination-btn"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`fld-pagination-btn${currentPage === i + 1 ? " fld-pagination-btn-active" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="fld-pagination-btn"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  );
}
