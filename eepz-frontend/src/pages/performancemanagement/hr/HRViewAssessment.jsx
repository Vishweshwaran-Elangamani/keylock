import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/api/api";
import "bootstrap-icons/font/bootstrap-icons.css";
import AppraisalDetailsModal from "../../../components/performance_management/modals/HRViewAssessment/AppraisalDetailsModal";
import "../../../styles/performancemanagement/hr/HRViewAssessment.css";


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
  if (!arr.length) return "N/A";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}


function statusBadge(status) {
  if (typeof status !== "string") return "";
  const s = status.toLowerCase();
  if (s === "completed")
    return (
      <span className="hrvasspm-badge hrvasspm-badge-completed">
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  if (s.startsWith("pending"))
    return (
      <span className="hrvasspm-badge hrvasspm-badge-pending">
        <i className="bi bi-hourglass-split" style={{ marginRight: 6 }}></i>
        Pending
      </span>
    );
  return (
    <span className="hrvasspm-badge hrvasspm-badge-default">
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
  const [modalAttachments, setModalAttachments] = useState([]);
  const navigate = useNavigate();


  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  useEffect(() => {
    async function fetchAppraisals() {
      try {
        const response = await api.get("/AssessmentDetails/all-details");
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
    return appraisals.map((a, idx) => {
      const empRatings = a.competencies
        .map((c) => c.employeeRating)
        .filter((r) => typeof r === "number");
      const l1Name = a.competencies[0]?.l1ReviewerName || "N/A";
      const l1Ratings = a.competencies
        .map((c) => c.l1Rating)
        .filter((r) => typeof r === "number");
      const l2Name = a.competencies[0]?.l2ReviewerName || "N/A";
      const l2Ratings = a.competencies
        .map((c) => c.l2Rating)
        .filter((r) => typeof r === "number");
      let status = a.competencies[0]?.status ?? "N/A";
      if (a.competencies.some((c) => c.status !== status)) status = "Mixed";
      return {
        key: `${a.employeeId}-${a.projectName}-${idx}`,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        projectName: a.projectName,
        empAvg: average(empRatings),
        l1ReviewerName: l1Name,
        l1Avg: average(l1Ratings),
        l2ReviewerName: l2Name,
        l2Avg: average(l2Ratings),
        status,
        competencies: a.competencies,
        attachments: a.attachments || [],
      };
    });
  }, [appraisals]);


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
        const status = (row.status || "").toLowerCase();
        if (filterStatus === "completed") return status === "completed";
        if (filterStatus === "pending") return status.startsWith("pending");
        return false;
      });
    }


    if (filterProject !== "all") {
      filtered = filtered.filter((row) => row.projectName === filterProject);
    }


    if (searchTerm.trim() !== "") {
      const search = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((row) =>
        (row.employeeName || "").toLowerCase().includes(search)
      );
    }


    return filtered;
  }, [allSummaryRows, filterStatus, filterProject, searchTerm]);


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
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
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


  const handleViewDetails = (row) => {
    setModalRow(row);
    setModalAttachments(row.attachments || []);
  };


  if (loading)
    return (
      <div className="hrvasspm-loading">
        <div className="hrvasspm-spinner"></div>
        <p>Loading appraisals...</p>
      </div>
    );
  if (error)
    return (
      <div className="hrvasspm-error">
        <i className="bi bi-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );
  if (!appraisals.length)
    return (
      <div className="hrvasspm-container">
        <h2 className="hrvasspm-page-title">Appraisal Details</h2>
        <div className="hrvasspm-alert">
          <i className="bi bi-info-circle"></i>
          No initiated appraisal forms found. Please initiate forms from the "Initiate Form" page.
        </div>
      </div>
    );


  return (
    <div className="hrvasspm-page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <nav
          className="cg-breadcrumbs"
          aria-label="breadcrumb"
          style={{ marginBottom: "16px", background: "transparent" }}
        >
          <style>
            {`
      .cg-breadcrumb {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        align-items: center;
      }
      .cg-breadcrumb-item + .cg-breadcrumb-item::before {
        content: "/";
        margin: 0 0.25rem;   /* smaller spacing */
        color: #888;         /* lighter gray separator */
        font-weight: normal; /* prevents thick/bold look */
        font-size: 0.9em;    /* slightly smaller than text */
      }
      .cg-breadcrumb-item {
        cursor: pointer;
      }
      .cg-breadcrumb-item.active {
        color: #97247E
 ;      /* highlight active item (purple) */
        cursor: default;
      }
    `}
          </style>

          <ol className="cg-breadcrumb">
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard")}
            >
              <i className="bi bi-house-door"></i>
            </li>
            <li
              className="cg-breadcrumb-item"
              onClick={() => navigate("/hr/dashboard/performance")}
            >
              Performance
            </li>
            <li className="cg-breadcrumb-item active" aria-current="page">
              Form Progress
            </li>
          </ol>
        </nav>

      </div>

      <div className="hrvasspm-container">
        <div
          className="hrvasspm-filters"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <div className="hrvasspm-filter-group">
            <input
              type="search"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="hrvasspm-filter-group">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="hrvasspm-filter-group">
            <select
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                setCurrentPage(1);
              }}
            >
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All Projects" : p}
                </option>
              ))}
            </select>
          </div>

          <div className="hrvasspm-filter-group" style={{ display: "flex", alignItems: "center" }}>
            <button
              className="hrvasspm-btn-export"
              onClick={() => exportToCsv("appraisals.csv", csvData)}
            >
              <i className="bi bi-download"></i> Export CSV
            </button>
          </div>

        </div>
        <div className="hrvasspm-table-card">
          <div className="hrvasspm-table-wrapper">
            <table className="hrvasspm-table">
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
                    <td colSpan={9} className="hrvasspm-empty-state">
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
                        <div className="hrvasspm-action-buttons">
                          <button
                            className="hrvasspm-action-btn hrvasspm-btn-view"
                            title="View Details"
                            onClick={() => handleViewDetails(row)}
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


          <div className="hrvasspm-pagination-container">
            <div className="hrvasspm-pagination-info">
              <span className="hrvasspm-pagination-label">Show</span>
              <select
                className="hrvasspm-pagination-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="hrvasspm-pagination-label">entries</span>
            </div>
            <div className="hrvasspm-pagination-status">
              Showing {summaryRows.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, summaryRows.length)} of{" "}
              {summaryRows.length} entries
            </div>
            <nav className="hrvasspm-pagination-nav">
              <ul className="hrvasspm-pagination">
                <li className={`hrvasspm-page-item${currentPage === 1 ? " hrvasspm-disabled" : ""}`}>
                  <button className="hrvasspm-page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, idx) => (
                  <li
                    key={idx}
                    className={`hrvasspm-page-item${page === currentPage ? " hrvasspm-active" : ""} ${typeof page !== "number" ? " hrvasspm-disabled" : ""
                      }`}
                  >
                    <button className="hrvasspm-page-link" onClick={() => typeof page === "number" && setCurrentPage(page)} disabled={typeof page !== "number"}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`hrvasspm-page-item${currentPage === totalPages ? " hrvasspm-disabled" : ""}`}>
                  <button
                    className="hrvasspm-page-link"
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
          onClose={() => {
            setModalRow(null);
            setModalAttachments([]);
          }}
          employeeId={modalRow.employeeId}
          employeeName={modalRow.employeeName}
          projectName={modalRow.projectName}
          competencies={modalRow.competencies}
          attachments={modalAttachments}
        />
      )}
    </div>
  );
}


export default HRViewAppraisals;
