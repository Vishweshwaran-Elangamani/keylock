import React, { useEffect, useState, useMemo } from "react";
import api from "../../../services/performancemanagement/hr/api";
 
// Inline app theme styles: dark purple, magenta, lavender, badges, etc.
const tableStyles = `
:root {
  --eepz-dark-purple: #27235c;
  --eepz-magenta: #ac5098;
  --eepz-lavender: #f6f3fa;
  --badge-green: #5ca378;
  --badge-yellow: #e2c14b;
}
.eepz-table th {
  background: var(--eepz-dark-purple) !important;
  color: #fff !important;
  font-weight: 600;
  border-color: var(--eepz-magenta) !important;
}
.eepz-table td {
  border-color: var(--eepz-lavender);
}
.table-heading {
  color: var(--eepz-dark-purple) !important;
  font-weight: 700;
}
.btn-outline-primary {
  border-color: var(--eepz-magenta);
  color: var(--eepz-magenta);
}
.btn-outline-primary:hover,
.btn-outline-primary:focus {
  background: var(--eepz-magenta);
  color: #fff;
}
.badge-completed {
  background: var(--badge-green);
  color: #fff;
  font-weight: 500;
  border-radius: 6px;
  font-size: 0.95em;
  padding: 0.36em 1em;
}
.badge-pending {
  background: var(--badge-yellow);
  color: #404040;
  font-weight: 500;
  border-radius: 6px;
  font-size: 0.95em;
  padding: 0.36em 1em;
}
.card {
  border: 1px solid var(--eepz-magenta);
  background: var(--eepz-lavender);
}
.card h6,
.card .fw-semibold {
  color: var(--eepz-dark-purple);
}
tr[id^="collapse-"] .card {
  box-shadow: 0px 4px 38px 0px rgba(172,80,152,0.16);
}
`;
 
function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map(row =>
        keys
          .map(k => {
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
  const arr = values.filter(v => typeof v === "number");
  if (!arr.length) return "-";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}
 
function statusBadge(status) {
  if (typeof status !== "string") return "";
  const s = status.toLowerCase();
  if (s === "completed")
    return <span className="badge badge-completed ms-1">Completed</span>;
  if (s.startsWith("pending"))
    return <span className="badge badge-pending ms-1">Pending</span>;
  return <span className="badge bg-secondary ms-1">{status}</span>;
}
 
function HRViewAppraisals() {
  const [loading, setLoading] = useState(true);
  const [appraisals, setAppraisals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
 
  useEffect(() => {
    async function fetchAppraisals() {
      try {
        const response = await api.get("/AppraisalProcess/all-details");
        console.log("Raw API Response:", response.data); // DEBUG: Check what API returns
       
        if (response.data?.success) {
          const raw = response.data.data || [];
          console.log("Raw appraisals count:", raw.length);

          // Helper to normalize values and check for any of the expected initiated markers
          const normalize = v => (v || "").toString().trim().toLowerCase();

          // Common action/status tokens that indicate initiation/submission
          const initiatedActions = new Set(["send", "sent", "initiate", "initiated", "submit", "submitted", "start"]);
          const nonDraftStatuses = new Set(["completed", "in review", "in-progress", "in progress", "submitted", "sent", "pending", "finalized"]);

          const normalizeAppraisal = appraisal => {
            const comps = appraisal.competencies || appraisal.Competencies || [];
            const normalizedComps = (Array.isArray(comps) ? comps : []).map(comp => ({
              competencyName: comp.competencyName || comp.CompetencyName || (comp.Competency && comp.Competency.Name) || "Unknown",
              employeeRating: comp.employeeRating ?? comp.EmployeeRating ?? null,
              employeeComments: comp.employeeComments ?? comp.EmployeeComments ?? "",
              l1ReviewerName: comp.l1ReviewerName || comp.L1ReviewerName || "-",
              l1Rating: comp.l1Rating ?? comp.L1Rating ?? null,
              l1Comments: comp.l1Comments ?? comp.L1Comments ?? "",
              l1ReviewStatus: comp.l1ReviewStatus || comp.L1ReviewStatus || "",
              l2ReviewerName: comp.l2ReviewerName || comp.L2ReviewerName || "-",
              l2Rating: comp.l2Rating ?? comp.L2Rating ?? null,
              l2Comments: comp.l2Comments ?? comp.L2Comments ?? "",
              l2ReviewStatus: comp.l2ReviewStatus || comp.L2ReviewStatus || "",
              status: comp.status || comp.Status || ""
            }));

            return {
              employeeId: appraisal.employeeId ?? appraisal.EmployeeId ?? null,
              employeeName: appraisal.employeeName || appraisal.EmployeeName || appraisal.Employee || "Unknown",
              projectName: appraisal.projectName || appraisal.ProjectName || "",
              competencies: normalizedComps,
              goals: appraisal.goals || appraisal.Goals || []
            };
          };

          const initiatedAppraisals = raw.filter(appraisal => {
            const comps = appraisal.competencies || appraisal.Competencies || [];

            // If competencies array is missing or empty, treat carefully (don't discard immediately)
            if (!Array.isArray(comps) || comps.length === 0) {
              console.log(`Employee: ${appraisal.employeeName || appraisal.EmployeeName || 'unknown'} - no competencies array`);
              return false; // keep strict here but log; fallback below will show all if none matched
            }

            let hasInitiated = false;
            let hasNonDraftStatus = false;

            for (const comp of comps) {
              const action = normalize(comp.action || comp.Action || comp.ActionType || comp.actionType);
              const status = normalize(comp.status || comp.Status || comp.currentStatus || comp.state);

              if (action && initiatedActions.has(action)) hasInitiated = true;
              if (status && (nonDraftStatuses.has(status) || (status !== "" && status !== "draft" && status !== "save as draft"))) hasNonDraftStatus = true;

              // quick exit if either is found
              if (hasInitiated || hasNonDraftStatus) break;
            }

            console.log(`Employee: ${appraisal.employeeName || appraisal.Employee || appraisal.EmployeeName || 'unknown'}, hasInitiated=${hasInitiated}, hasNonDraftStatus=${hasNonDraftStatus}`);

            return hasInitiated || hasNonDraftStatus;
          });

          console.log("Filtered Appraisals Count:", initiatedAppraisals.length); // DEBUG

          // Normalize results before setting state. If filter removed everything but raw had items, fall back to showing normalized raw list and log a warning.
          if (initiatedAppraisals.length === 0 && raw.length > 0) {
            console.warn("No appraisals passed the 'initiated' filter. Showing all fetched appraisals as a fallback.");
            setAppraisals(raw.map(normalizeAppraisal));
          } else {
            setAppraisals(initiatedAppraisals.map(normalizeAppraisal));
          }
        } else {
          setError("Failed to load data");
        }
      } catch (err) {
        setError("Error fetching data");
        console.error("Error fetching appraisals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAppraisals();
  }, []);
 
  // Prepare summary list for the table (one row per employee+project)
  const summaryRows = useMemo(() => {
    const filterFunc = a =>
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    return appraisals
      .filter(a => !searchTerm || filterFunc(a))
      .map(a => {
        const empRatings = a.competencies.map(c => c.employeeRating).filter(r => typeof r === "number");
        const l1Name = a.competencies[0]?.l1ReviewerName || "-";
        const l1Ratings = a.competencies.map(c => c.l1Rating).filter(r => typeof r === "number");
        const l2Name = a.competencies[0]?.l2ReviewerName || "-";
        const l2Ratings = a.competencies.map(c => c.l2Rating).filter(r => typeof r === "number");
        let status = a.competencies[0]?.status ?? "-";
        if (a.competencies.some(c => c.status !== status)) status = "Mixed";
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
  }, [appraisals, searchTerm]);
 
  const csvData = useMemo(() => {
    return summaryRows.map(r => ({
      "Employee Name": r.employeeName,
      "Project Name": r.projectName,
      "Employee Average": r.empAvg,
      "L1 Reviewer Name": r.l1ReviewerName,
      "L1 Average": r.l1Avg,
      "L2 Reviewer Name": r.l2ReviewerName,
      "L2 Average": r.l2Avg,
      "Status": r.status,
    }));
  }, [summaryRows]);
 
  // Pending and completed stats
  const { completedCount, pendingCount } = useMemo(() => {
    let completed = 0, pending = 0;
    summaryRows.forEach(r => {
      if (r.status.toLowerCase() === "completed") completed++;
      else if (r.status.toLowerCase().startsWith("pending")) pending++;
    });
    return { completedCount: completed, pendingCount: pending };
  }, [summaryRows]);
 
  if (loading) return <p>Loading appraisals...</p>;
  if (error) return <p>{error}</p>;
  if (!appraisals.length) return (
    <div className="container pt-4">
      <h2 className="table-heading">Appraisal Details</h2>
      <div className="alert alert-info mt-3">
        No initiated appraisal forms found. Please initiate forms from the "Initiate Form" page.
      </div>
    </div>
  );
 
  const toggleExpanded = rowKey => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };
 
  return (
    <>
      <style>{tableStyles}</style>
      <div style={{ background: "var(--eepz-lavender)", minHeight: "100vh", paddingBottom: 40 }}>
        <div className="container pt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-column flex-sm-row">
            <h2 className="table-heading">Appraisal Details</h2>
            <button
              className="btn btn-outline-primary mt-2 mt-sm-0"
              onClick={() => exportToCsv("appraisals.csv", csvData)}
            >
              Export CSV
            </button>
          </div>
 
          {/* Stats Card Row */}
          <div className="row mb-4">
            <div className="col-md-6 col-12 mb-2">
              <div className="card shadow-sm" style={{ background: "#f7faf8", borderLeft: "5px solid var(--badge-green)" }}>
                <div className="card-body d-flex align-items-center">
                  <span className="badge badge-completed me-3" style={{ fontSize: "1.3rem", minWidth: 52 }}>{completedCount}</span>
                  <span className="fw-bold" style={{ color: "var(--eepz-dark-purple)", fontSize: 17 }}>Completed</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-12 mb-2">
              <div className="card shadow-sm" style={{ background: "#fffbe6", borderLeft: "5px solid var(--badge-yellow)" }}>
                <div className="card-body d-flex align-items-center">
                  <span className="badge badge-pending me-3" style={{ fontSize: "1.3rem", minWidth: 52 }}>{pendingCount}</span>
                  <span className="fw-bold" style={{ color: "var(--eepz-dark-purple)", fontSize: 17 }}>Pending</span>
                </div>
              </div>
            </div>
          </div>
 
          <div className="mb-3">
            <input
              type="search"
              className="form-control"
              style={{ maxWidth: 380, borderColor: "var(--eepz-magenta)" }}
              placeholder="Search by Employee or Project"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <table className="table eepz-table table-bordered table-striped align-middle" style={{ borderRadius: 16, overflow: "hidden", minWidth: 850 }}>
            <thead className="text-center">
              <tr>
                <th>Employee Name</th>
                <th>Project Name</th>
                <th>Employee Avg Rating</th>
                <th>L1 Reviewer</th>
                <th>L1 Avg Rating</th>
                <th>L2 Reviewer</th>
                <th>L2 Avg Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#9CA3AF", display: "block", marginBottom: "12px" }}></i>
                    <span style={{ color: "#6B7280" }}>No initiated appraisals match your search</span>
                  </td>
                </tr>
              ) : summaryRows.map(row => (
                <React.Fragment key={row.key}>
                  <tr>
                    <td className="fw-bold">{row.employeeName}</td>
                    <td className="fw-bold">{row.projectName}</td>
                    <td className="text-center">{row.empAvg}</td>
                    <td>{row.l1ReviewerName}</td>
                    <td className="text-center">{row.l1Avg}</td>
                    <td>{row.l2ReviewerName}</td>
                    <td className="text-center">{row.l2Avg}</td>
                    <td className="text-center">{statusBadge(row.status)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ background: "var(--eepz-magenta)", border: "none" }}
                        type="button"
                        onClick={() => toggleExpanded(row.key)}
                        aria-expanded={!!expandedRows[row.key]}
                        aria-controls={`collapse-${row.key}`}
                      >
                        {expandedRows[row.key] ? "Hide Details" : "View Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedRows[row.key] && (
                    <tr id={`collapse-${row.key}`}>
                      <td colSpan={9}>
                        <div className="row g-3">
                          {row.competencies.map((c, idx) => (
                            <div className="col-md-4 col-12" key={idx}>
                              <div className="card h-100">
                                <div className="card-body p-3">
                                  <h6 className="fw-bold mb-2" style={{ color: "var(--eepz-magenta)" }}>
                                    Competency: {c.competencyName}
                                  </h6>
                                  <div>
                                    <span className="fw-semibold">Employee Rating:</span> <span>{c.employeeRating ?? "-"}</span>
                                    <br />
                                    <span className="fw-semibold">Employee Comments:</span> <span>{c.employeeComments ?? "-"}</span>
                                    <hr className="my-2" />
                                    <span className="fw-semibold">L1 Reviewer:</span> <span>{c.l1ReviewerName ?? "-"}</span>
                                    <br />
                                    <span className="fw-semibold">L1 Rating:</span> <span>{c.l1Rating ?? "-"}</span>
                                    <br />
                                    <span className="fw-semibold">L1 Comments:</span> <span>{c.l1Comments ?? "-"}</span>
                                    <hr className="my-2" />
                                    <span className="fw-semibold">L2 Reviewer:</span> <span>{c.l2ReviewerName ?? "-"}</span>
                                    <br />
                                    <span className="fw-semibold">L2 Rating:</span> <span>{c.l2Rating ?? "-"}</span>
                                    <br />
                                    <span className="fw-semibold">L2 Comments:</span> <span>{c.l2Comments ?? "-"}</span>
                                    <hr className="my-2" />
                                    <span className="fw-semibold">Status:</span> <span>{statusBadge(c.status)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
 
export default HRViewAppraisals;
