import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import "../../../styles/performancemanagement/hr/FormProgressTracker.css";

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
      "Tracker ID","Assignment ID","Employee","L1","L2",
      "Initiated","Sent To Employee","Employee Completed","Sent To Manager","Manager Completed",
      "Sent To Dept Head","DeptHead Approved","Emp Acknowledged","Sent To Leadership","Last Updated"
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
    link.download = `FormProgressTracker_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
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
      {/* Breadcrumbs */}
      <nav className="fld-breadcrumbs" aria-label="breadcrumb">
        <ol>
          <li><Link to="/hr/dashboard">Dashboard</Link></li>
          <li><Link to="/hr/dashboard/performance">Performance</Link></li>
          <li aria-current="page">Form Progress Tracker</li>
        </ol>
      </nav>
      <div className="fld-header-row">
        <h2 className="fld-page-title">Form Progress Tracker</h2>
        <button className="fld-btn-export" onClick={handleExportCSV}>
          <i className="bi bi-download"></i> Export CSV
        </button>
      </div>

      {loading && <div className="fld-loading"><div>Loading...</div></div>}
      {error && <div className="fld-error">{error}</div>}
      {!loading && !error && trackers.length === 0 &&
        <div className="fld-empty-state"><p>No progress tracker data available.</p></div>
      }

      {trackers.length > 0 &&
        <div className="fld-card">
          {/* Table */}
          <div className="fld-table-wrapper">
            <table className="fld-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Assign</th>
                  <th>Employee</th>
                  <th>L1</th>
                  <th>L2</th>
                  <th>Init</th>
                  <th>Sent Emp</th>
                  <th>Emp Done</th>
                  <th>Sent Mgr</th>
                  <th>Mgr Done</th>
                  <th>Dept Head</th>
                  <th>Emp Ack</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {currentTrackers.map(tracker => (
                  <tr key={tracker.trackerId}>
                    <td><span className="fld-badge fld-badge-id">{tracker.trackerId}</span></td>
                    <td><span className="fld-badge fld-badge-assign">{tracker.assignmentId}</span></td>
                    <td style={{ textAlign: "left" }}>{tracker.employeeName}</td>
                    <td>{tracker.l1Name}</td>
                    <td>{tracker.l2Name}</td>
                    <td><BoolIcon value={tracker.initiated} /></td>
                    <td><BoolIcon value={tracker.sentToEmployee} /></td>
                    <td><BoolIcon value={tracker.employeeCompleted} /></td>
                    <td><BoolIcon value={tracker.sentToManager} /></td>
                    <td><BoolIcon value={tracker.managerCompleted} /></td>
                    <td><BoolIcon value={tracker.deptHeadApproved} /></td>
                    <td><BoolIcon value={tracker.empAcknowledged} /></td>
                    <td style={{ fontSize: '0.98em', color: '#27235c', fontWeight: 500 }}>
                      {tracker.lastUpdated ? new Date(tracker.lastUpdated).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="fld-pagination-container">
              <div className="fld-pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, trackers.length)} of {trackers.length} entries
              </div>
              <div className="fld-pagination-controls">
                <button onClick={goToPrev} disabled={currentPage === 1} className="fld-pagination-btn" aria-label="Previous page">{'‹'}</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i+1}
                    onClick={() => goToPage(i+1)}
                    className={`fld-pagination-btn${currentPage === i+1 ? " fld-pagination-btn-active" : ""}`}
                  >{i + 1}</button>
                ))}
                <button onClick={goToNext} disabled={currentPage === totalPages} className="fld-pagination-btn" aria-label="Next page">{'›'}</button>
              </div>
            </div>
          )}
        </div>
      }
    </div>
  );
}
