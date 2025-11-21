import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/performancemanagement/hr/api";
import "bootstrap-icons/font/bootstrap-icons.css";
import AppraisalDetailsModal from "../../../components/performance_management/modals/HRViewAssessment/AppraisalDetailsModal";
import "../../../styles/performancemanagement/hr/HRViewAssessment.css";

import { useNavigate } from "react-router-dom";

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
      <span className="hrview-badge hrview-badge-completed">
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  if (s.startsWith("pending"))
    return (
      <span className="hrview-badge hrview-badge-pending">
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>
        Pending
      </span>
    );
  return (
    <span className="hrview-badge hrview-badge-default">
      <i className="bi bi-dot" style={{ marginRight: 6 }}></i>
      {status}
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
  const navigate = useNavigate();

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Pagination calculations
  const totalPages = Math.ceil(summaryRows.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = summaryRows.slice(indexOfFirstItem, indexOfLastItem);

  function getPageNumbers() {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }
    return pages;
  }

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
      <div className="hrview-loading">
        <div className="hrview-spinner"></div>
        <p>Loading appraisals...</p>
      </div>
    );
  if (error)
    return (
      <div className="hrview-error">
        <i className="bi bi-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );
  if (!appraisals.length)
    return (
      <div className="hrview-container">
        <h2 className="hrview-page-title">Appraisal Details</h2>
        <div className="hrview-alert">
          <i className="bi bi-info-circle"></i>
          No initiated appraisal forms found. Please initiate forms from the "Initiate Form" page.
        </div>
      </div>
    );

  return (
    <div className="fld-root">
      {/* Breadcrumbs */}
      <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "2rem" // space below this whole bar
}}>
  <nav className="cg-breadcrumbs" style={{ background: "transparent" }} aria-label="breadcrumb">
    <ol className="cg-breadcrumb" style={{ margin: 0 }}>
      <li className="cg-breadcrumb-item" onClick={() => navigate("/hr/dashboard")}>
        <i className="bi bi-house-door"></i>
      </li>
      <li className="cg-breadcrumb-item" onClick={() => navigate("/hr/dashboard/performance")}>
        Performance
      </li>
      <li className="cg-breadcrumb-item active" aria-current="page">
        Form Status
      </li>
    </ol>
  </nav>
  <button
    className="hrview-btn-export"
    onClick={() => exportToCsv("appraisals.csv", csvData)}
  >
    <i className="bi bi-download"></i> Export CSV
  </button>
</div>



      <div className="hrview-container">
        {/* Analytics Cards */}
       

        {/* Export & Filters */}
       
        <div className="hrview-filters">
          <div className="hrview-filter-group">
            <label>Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="hrview-filter-group">
            <label>Filter by Project</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Projects" : p}
                </option>
              ))}
            </select>
          </div>
          <div className="hrview-filter-group">
            <label>Search Employee Name</label>
            <input
              type="search"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Table */}
        <div className="fld-table-card">
          <div className="fld-table-wrapper">
            <table className="fld-table">
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
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="fld-empty-state">
                      <i className="bi bi-inbox"></i>
                      <p>No appraisals match your filters</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((row) => (
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
                        <div className="fld-action-buttons">
                          <button
                            className="fld-action-btn fld-btn-view"
                            title="View Details"
                            onClick={() => setModalRow(row)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="fld-pagination-container">
            <div className="fld-pagination-info">
              <span className="fld-pagination-label">Show</span>
              <select
                className="fld-pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="fld-pagination-label">entries</span>
            </div>
            <div className="fld-pagination-status">
              Showing {summaryRows.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, summaryRows.length)} of {summaryRows.length} entries
            </div>
            <nav className="fld-pagination-nav">
              <ul className="fld-pagination">
                <li className={`fld-page-item${currentPage === 1 ? " fld-disabled" : ""}`}>
                  <button
                    className="fld-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, idx) => (
                  <li
                    key={idx}
                    className={`fld-page-item${
                      page === currentPage ? " fld-active" : ""
                    } ${typeof page !== "number" ? " fld-disabled" : ""}`}
                  >
                    <button
                      className="fld-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`fld-page-item${currentPage === totalPages ? " fld-disabled" : ""}`}>
                  <button
                    className="fld-page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      {modalRow && (
        <AppraisalDetailsModal
          show={!!modalRow}
          onClose={() => setModalRow(null)}
          employeeName={modalRow.employeeName}
          projectName={modalRow.projectName}
          competencies={modalRow.competencies}
        />
      )}
    </div>
  );
}

export default HRViewAppraisals;
