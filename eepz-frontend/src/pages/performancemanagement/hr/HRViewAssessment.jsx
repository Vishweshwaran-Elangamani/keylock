import React, { useEffect, useState, useMemo } from "react";
import api from "../../../services/performancemanagement/hr/api";
import "bootstrap-icons/font/bootstrap-icons.css";

// CSV Export Utility
function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator)
      )
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function average(values) {
  const arr = values.filter((v) => typeof v === "number");
  if (!arr.length) return "-";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}

function statusBadge(status) {
  if (typeof status !== "string") return "";
  const s = status.toLowerCase();
  if (s === "completed")
    return (
      <span className="eepz-badge eepz-badge-completed">
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>Completed
      </span>
    );
  if (s.startsWith("pending"))
    return (
      <span className="eepz-badge eepz-badge-pending">
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>Pending
      </span>
    );
  return (
    <span className="eepz-badge eepz-badge-default">
      <i className="bi bi-dot" style={{ marginRight: 6 }}></i>{status}
    </span>
  );
}

function HRViewAppraisals() {
  const [loading, setLoading] = useState(true);
  const [appraisals, setAppraisals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [modalRow, setModalRow] = useState(null);

  useEffect(() => {
    async function fetchAppraisals() {
      try {
        const response = await api.get("/AppraisalProcess/all-details");
        if (response.data?.success) {
          const initiatedAppraisals = response.data.data.filter((appraisal) => {
            const hasInitiatedCompetency = appraisal.competencies.some((comp) => {
              const action = (comp.action || comp.Action || "").toLowerCase();
              return action === "send";
            });
            const hasValidStatus = appraisal.competencies.some((comp) => {
              const status = (comp.status || comp.Status || "").toLowerCase();
              return status !== "" && status !== "draft" && status !== "save as draft";
            });
            return hasInitiatedCompetency || hasValidStatus;
          });
          setAppraisals(initiatedAppraisals);
        } else {
          setError("Failed to load data");
        }
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchAppraisals();
  }, []);

  const allSummaryRows = useMemo(() => {
    return appraisals.map((a) => {
      const empRatings = a.competencies
        .map((c) => c.employeeRating)
        .filter((r) => typeof r === "number");
      const l1Name = a.competencies[0]?.l1ReviewerName || "-";
      const l1Ratings = a.competencies
        .map((c) => c.l1Rating)
        .filter((r) => typeof r === "number");
      const l2Name = a.competencies[0]?.l2ReviewerName || "-";
      const l2Ratings = a.competencies
        .map((c) => c.l2Rating)
        .filter((r) => typeof r === "number");
      let status = a.competencies[0]?.status ?? "-";
      if (a.competencies.some((c) => c.status !== status)) status = "Mixed";
      return {
        key: `${a.employeeId}-${a.projectName}`,
        employeeName: a.employeeName,
        projectName: a.projectName,
        empAvg: average(empRatings),
        l1ReviewerName: l1Name,
        l1Avg: average(l1Ratings),
        l2ReviewerName: l2Name,
        l2Avg: average(l2Ratings),
        status,
        competencies: a.competencies,
      };
    });
  }, [appraisals]);

  // Dropdown values
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    statuses.add("all");
    allSummaryRows.forEach((row) => {
      if (row.status && row.status !== "-" && row.status !== "Mixed") {
        statuses.add(row.status.toLowerCase());
      }
    });
    return Array.from(statuses);
  }, [allSummaryRows]);
  const uniqueProjects = useMemo(() => {
    const projects = new Set();
    projects.add("all");
    allSummaryRows.forEach((row) => {
      if (row.projectName) projects.add(row.projectName);
    });
    return Array.from(projects);
  }, [allSummaryRows]);

  // Actual filters - only search on employeeName
  const summaryRows = useMemo(() => {
    let filtered = [...allSummaryRows];

    if (filterStatus !== "all") {
      filtered = filtered.filter((row) => {
        return row.status && row.status.toLowerCase() === filterStatus;
      });
    }
    if (filterProject !== "all") {
      filtered = filtered.filter((row) => row.projectName === filterProject);
    }
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        row.employeeName.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [allSummaryRows, filterStatus, filterProject, searchTerm]);

  const csvData = useMemo(() => {
    return summaryRows.map((r) => ({
      "Employee Name": r.employeeName,
      "Project Name": r.projectName,
      "Employee Average": r.empAvg,
      "L1 Reviewer Name": r.l1ReviewerName,
      "L1 Average": r.l1Avg,
      "L2 Reviewer Name": r.l2ReviewerName,
      "L2 Average": r.l2Avg,
      Status: r.status,
    }));
  }, [summaryRows]);

  const { completedCount, pendingCount } = useMemo(() => {
    let completed = 0,
      pending = 0;
    allSummaryRows.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "completed") completed++;
      else if (s.startsWith("pending")) pending++;
    });
    return { completedCount: completed, pendingCount: pending };
  }, [allSummaryRows]);


  if (loading)
    return (
      <div className="eepz-loading">
        <div className="eepz-spinner"></div>
        <p>Loading appraisals...</p>
      </div>
    );
  if (error)
    return (
      <div className="eepz-error">
        <i className="bi bi-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );
  if (!appraisals.length)
    return (
      <div className="eepz-container">
        <h2 className="eepz-page-title">Appraisal Details</h2>
        <div className="eepz-alert">
          <i className="bi bi-info-circle"></i>
          No initiated appraisal forms found. Please initiate forms from the "Initiate Form" page.
        </div>
      </div>
    );

  return (
    <>
      <style>{`
        :root {
          --eepz-primary: #27235C;
          --eepz-secondary: #AC5098;
          --eepz-bg: #FCFCFD;
          --eepz-card: #FFFFFF;
          --eepz-text: #2C3E50;
          --eepz-border: #E0E0E0;
          --eepz-success: #10B981;
          --eepz-warning: #F59E0B;
        }
        body, html { background: var(--eepz-bg); }
        .eepz-page {
          min-height: 100vh;
          background: var(--eepz-bg);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .eepz-container {
          max-width: 1400px;
          margin: 2rem auto;
          background: var(--eepz-card);
          border-radius: 20px;
          box-shadow: 0 4px 30px 2px rgba(39, 35, 92, 0.11);
          padding: 2.2rem 2.2rem 2rem 2.2rem;
        }
        .eepz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.9rem;
          flex-wrap: wrap;
        }
        .eepz-page-title {
          font-size: 2rem;
          font-weight: 800;
          color: #231d4f;
          margin: 0 0 8px 0;
          display: flex;
        }
        .eepz-btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--eepz-secondary);
          color: white;
          border: none;
          border-radius: 13px;
          padding: 13px 27px;
          font-size: 1.11rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px 0 rgba(172,80,152,.11);
          transition: 0.13s;
        }
        .eepz-btn-export:hover { filter: brightness(1.09);}
        .eepz-stats-grid {
          display: flex;
          gap: 28px;
          margin-bottom: 18px;
        }
        .eepz-stat-card {
          background: #27235c;
          border-radius: 15px;
          min-width: 220px;
          padding: 26px 37px 20px 28px;
          color: #fff;
          box-shadow: 0 6px 24px 0 rgba(39, 35, 92, 0.18);
          display: flex;
          align-items: center;
          font-size: 1.23rem;
          font-weight: 900;
          gap: 17px;
        }
        .eepz-stat-icon {
          font-size: 2.7rem;
          opacity: 0.96;
        }
        .eepz-stat-card.pending {
          background: #e2c14b; color: #35331c;
        }
        .eepz-stat-card.completed { background: #5ca378; color: #fff; }
        .eepz-stat-texts { display: flex; flex-direction: column; font-weight: 800;}
        .eepz-stat-label {
          font-size: 1.27rem;
          color: inherit;
          font-weight: 700;
        }
        .eepz-stat-number {
          font-size: 2.55rem;
          letter-spacing: 0.03em;
          font-weight: 900;
        }
        .eepz-filters {
          display: flex;
          gap: 18px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .eepz-filter-group {
          flex: 1;
          min-width: 220px;
        }
        .eepz-filter-group label {
          display: block;
          font-weight: 700;
          color: var(--eepz-primary);
          margin-bottom: 7px;
          font-size: 1.05rem;
          margin-left: 2px;
        }
        .eepz-filter-group select,
        .eepz-filter-group input {
          width: 100%;
          padding: 12px 15px;
          font-size: 1.05rem;
          border-radius: 10px;
          border: 2px solid var(--eepz-secondary);
          transition: border-color 0.19s;
        }
        .eepz-filter-group input:focus, .eepz-filter-group select:focus {
          outline: 0;
          border-color: var(--eepz-primary);
        }
        .eepz-table-wrapper {
          overflow-x: auto;
          border-radius: 16px;
          box-shadow: 0 4px 14px rgba(39, 35, 92, 0.07);
          background: #fff;
        }
        .eepz-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1rem;
        }
        .eepz-table th {
          background: #27235c;
          border: none;
          color: #fff;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          padding: 15px 10px;
          text-align: left;
          font-size: 1.07rem;
        }
        .eepz-table tr { border-radius: 7px;}
        .eepz-table td {
          padding: 17px 10px;
          color: #29214d;
          border-top: 1.6px solid #ece7f8;
          vertical-align: middle;
          font-weight: 600;
          background: #fff;
        }
        .eepz-table td:first-child { font-weight: 800; }
        .eepz-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 7px;
          font-size: 0.98rem;
          font-weight: 800;
        }
        .eepz-badge-completed { background: #5ca378; color: #fff; }
        .eepz-badge-pending { background: #ffe5a0; color: #422300; }
        .eepz-badge-default { background: #ded1ef; color: #251543; }
        .eepz-btn-view {
          background: #fff;
          border: 2px solid #ac5098;
          border-radius: 11px;
          font-size: 1.02rem;
          font-weight: 800;
          color: #922672;
          padding: 10px 20px;
          cursor: pointer;
          box-shadow: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: 0.16s;
        }
        .eepz-btn-view:hover, .eepz-btn-view:focus {
          background: #ac5098;
          color: #fff;
        }
        .eepz-modal-bg {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(39,35,92,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          animation: fadeIn 0.15s;
        }
        .eepz-modal-content {
          background: #fff;
          width: 540px;
          max-width: 96vw;
          max-height: 87vh;
          border-radius: 18px;
          box-shadow: 0 11px 55px 0 rgba(39, 35, 92, 0.16);
          display: flex; flex-direction: column;
          position: relative;
          animation: popIn 0.19s;
        }
        .eepz-modal-header {
          padding: 23px 22px 7px 22px;
          border-bottom: 2px solid #ac5098;
          display: flex; flex-direction: column; align-items: center;
        }
        .eepz-modal-title {
          font-size: 1.13rem;
          font-weight: 900;
          color: #ac5098;
          margin-bottom: 2px;
        }
        .eepz-modal-subtitle {
          font-size: 0.93rem;
          color: #35325c;
          margin-bottom: 11px;
        }
        .eepz-modal-close {
          position: absolute; top:11px; right:14px;
          background: none; border:none; font-size: 22px;
          color: #ac5098; cursor: pointer;
        }
        .eepz-modal-close:hover { color: #27235C;}
        .eepz-modal-body {
          padding: 18px 20px 18px 20px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 0.55rem;
        }
        .eepz-modal-field {
          display: flex; align-items: flex-start; margin-bottom: 9px;
        }
        .eepz-modal-icon {
          margin-right: 10px; color: #ac5098; font-size: 1.12rem; margin-top:2px;
        }
        .eepz-modal-labelview {
          font-weight: 700; width:140px; color: #2c1459;
          margin-right:11px; flex-shrink: 0; font-size:0.97rem;
        }
        .eepz-modal-valueview {
          font-weight: 600; color: #29214d; font-size: 1.01rem;
          flex:1;
        }
        .eepz-modal-divider { border:none; height:1px; background:#e0d4f0; margin:8px 0;}
        .eepz-empty { text-align: center; padding: 60px 20px; color: #b4b7bb;}
        .eepz-empty i { font-size: 35px; color: #eceaed; margin-bottom: 12px;}
        @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
        @keyframes popIn { from { opacity:0; transform:scale(0.93);} to {opacity:1; transform:scale(1);} }
      `}</style>
      <div className="eepz-page">
        <div className="eepz-container">
          <div className="eepz-header">
            <h2 className="eepz-page-title">Appraisal Details</h2>
            <button className="eepz-btn-export" onClick={() => exportToCsv("appraisals.csv", csvData)}>
              <i className="bi bi-download"></i> Export CSV
            </button>
          </div>
          <div className="eepz-stats-grid">
            <div className="eepz-stat-card completed">
              <span className="eepz-stat-icon"><i className="bi bi-check2-circle"></i></span>
              <span className="eepz-stat-texts">
                <span className="eepz-stat-number">{completedCount}</span>
                <span className="eepz-stat-label">Completed</span>
              </span>
            </div>
            <div className="eepz-stat-card pending">
              <span className="eepz-stat-icon"><i className="bi bi-hourglass-top"></i></span>
              <span className="eepz-stat-texts">
                <span className="eepz-stat-number">{pendingCount}</span>
                <span className="eepz-stat-label">Pending</span>
              </span>
            </div>
          </div>
          <div className="eepz-filters">
            <div className="eepz-filter-group">
              <label>Filter by Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="eepz-filter-group">
              <label>Filter by Project</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Projects" : p}
                  </option>
                ))}
              </select>
            </div>
            <div className="eepz-filter-group">
              <label>Search Employee Name</label>
              <input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
              />
            </div>
          </div>
          <div className="eepz-table-wrapper">
            <table className="eepz-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Project Name</th>
                  <th>Emp Avg</th>
                  <th>L1 Reviewer</th>
                  <th>L1 Avg</th>
                  <th>L2 Reviewer</th>
                  <th>L2 Avg</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="eepz-empty">
                      <i className="bi bi-inbox"></i>
                      <div>No appraisals match your filters</div>
                    </td>
                  </tr>
                ) : (
                  summaryRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.employeeName}</td>
                      <td>{row.projectName}</td>
                      <td style={{ textAlign: "center" }}>{row.empAvg}</td>
                      <td>{row.l1ReviewerName}</td>
                      <td style={{ textAlign: "center" }}>{row.l1Avg}</td>
                      <td>{row.l2ReviewerName}</td>
                      <td style={{ textAlign: "center" }}>{row.l2Avg}</td>
                      <td>{statusBadge(row.status)}</td>
                      <td>
                        <button className="eepz-btn-view" onClick={() => setModalRow(row)}>
                          <i className="bi bi-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalRow && (
        <div className="eepz-modal-bg" onClick={() => setModalRow(null)}>
          <div className="eepz-modal-content" onClick={e => e.stopPropagation()}>
            <button className="eepz-modal-close" onClick={() => setModalRow(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="eepz-modal-header">
              <div className="eepz-modal-title">Appraisal Details</div>
              <div className="eepz-modal-subtitle">
                <i className="bi bi-person-circle" style={{fontSize:'1.1em', marginRight:4, color:'#AC5098'}}></i>
                {modalRow.employeeName}
                {' '}<span style={{color:'#bbb', fontWeight:600}}> | </span>
                <i className="bi bi-kanban" style={{fontSize:'1.08em', marginRight:6, color:'#AC5098'}}></i>
                {modalRow.projectName}
              </div>
            </div>
            <div className="eepz-modal-body">
              {modalRow.competencies.map((c, idx) => (
                <React.Fragment key={idx}>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-star-fill"></span>
                    <span className="eepz-modal-labelview">Competency</span>
                    <span className="eepz-modal-valueview">{c.competencyName}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-graph-up"></span>
                    <span className="eepz-modal-labelview">Employee Rating</span>
                    <span className="eepz-modal-valueview">{c.employeeRating ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-chat-left-text"></span>
                    <span className="eepz-modal-labelview">Employee Comments</span>
                    <span className="eepz-modal-valueview">{c.employeeComments ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-person-badge"></span>
                    <span className="eepz-modal-labelview">L1 Reviewer</span>
                    <span className="eepz-modal-valueview">{c.l1ReviewerName || "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-graph-up"></span>
                    <span className="eepz-modal-labelview">L1 Rating</span>
                    <span className="eepz-modal-valueview">{c.l1Rating ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-chat-dots"></span>
                    <span className="eepz-modal-labelview">L1 Comments</span>
                    <span className="eepz-modal-valueview">{c.l1Comments ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-person-badge-fill"></span>
                    <span className="eepz-modal-labelview">L2 Reviewer</span>
                    <span className="eepz-modal-valueview">{c.l2ReviewerName || "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-graph-up-arrow"></span>
                    <span className="eepz-modal-labelview">L2 Rating</span>
                    <span className="eepz-modal-valueview">{c.l2Rating ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-chat-left-dots"></span>
                    <span className="eepz-modal-labelview">L2 Comments</span>
                    <span className="eepz-modal-valueview">{c.l2Comments ?? "-"}</span>
                  </div>
                  <div className="eepz-modal-field">
                    <span className="eepz-modal-icon bi bi-info-circle"></span>
                    <span className="eepz-modal-labelview">Status</span>
                    <span className="eepz-modal-valueview">{statusBadge(c.status)}</span>
                  </div>
                  {idx < modalRow.competencies.length - 1 && <hr className="eepz-modal-divider" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HRViewAppraisals;
