import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/performancemanagement/api/api";
import "bootstrap-icons/font/bootstrap-icons.css";
import AppraisalDetailsModal from "../../../components/performance_management/modals/HRViewAssessment/AppraisalDetailsModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
import styles from "../../../styles/performancemanagement/hr/HRViewAssessment.module.css";

/* Custom Dropdown Component */
const CustomDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value) || { label: placeholder || "Select", value: "" };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className={styles.customDropdown}
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className={`${styles.customSelected} ${disabled ? styles.customDisabled : ''}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className={styles.customArrow} />
      </div>

      {open && !disabled && (
        <div className={styles.customMenu}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`${styles.customOption} ${opt.value === value ? styles.customOptionActive : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
      <span className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgeCompleted}`}>
        <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
        Completed
      </span>
    );
  if (s.startsWith("pending"))
    return (
      <span className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgePending}`}>
        Pending
      </span>
    );
  return (
    <span className={`${styles.hrViewAssessmentBadge} ${styles.hrViewAssessmentBadgeDefault}`}>
      Completed
    </span>
  );
}

function HRViewAppraisals() {
  const [loading, setLoading] = useState(true);
  const [appraisals, setAppraisals] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
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
    const projects = [{ label: "All Projects", value: "all" }];
    const projectSet = new Set();
    allSummaryRows.forEach((row) => {
      if (row.projectName && !projectSet.has(row.projectName)) {
        projectSet.add(row.projectName);
        projects.push({ label: row.projectName, value: row.projectName });
      }
    });
    return projects;
  }, [allSummaryRows]);

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" }
  ];

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

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setFilterStatus("all");
    setFilterProject("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== "" || filterStatus !== "all" || filterProject !== "all";

  if (loading)
    return (
      <div className={styles.hrViewAssessmentLoading}>
        <div className={styles.hrViewAssessmentSpinner}></div>
        <p>Loading appraisals...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.hrViewAssessmentError}>
        <i className="bi bi-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );

  if (!appraisals.length)
    return (
      <div className={styles.hrViewAssessmentContainer}>
        <h2 className={styles.hrViewAssessmentPageTitle}>Appraisal Details</h2>
        <div className={styles.hrViewAssessmentAlert}>
          <i className="bi bi-info-circle"></i>
          No initiated appraisal forms found. Please initiate forms from the "Initiate Form" page.
        </div>
      </div>
    );

  return (
    <div className={styles.hrViewAssessmentPage}>
      <Breadcrumb
        items={[
          { label: "Performance", path: "/hr/dashboard/performance" },
          { label: "Form Progress", path: null }
        ]}
      />

      <div className={styles.hrViewAssessmentContainer}>
        <div className={styles.hrViewAssessmentFilters}>
          <div className={styles.hrViewAssessmentSearchGroup}>
            <input
              type="search"
              placeholder="Search by employee name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className={styles.hrViewAssessmentSearchInput}
            />
            <button
              onClick={handleSearch}
              className={styles.hrViewAssessmentSearchBtn}
            >
              Search
            </button>
          </div>

          <div className={styles.hrViewAssessmentFilterGroup}>
            <CustomDropdown
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setCurrentPage(1);
              }}
              options={statusOptions}
              placeholder="All Statuses"
            />
          </div>

          <div className={styles.hrViewAssessmentFilterGroup}>
            <CustomDropdown
              value={filterProject}
              onChange={(val) => {
                setFilterProject(val);
                setCurrentPage(1);
              }}
              options={uniqueProjects}
              placeholder="All Projects"
            />
          </div>

          <div className={styles.hrViewAssessmentFilterGroup}>
            <button
              className={styles.hrViewAssessmentBtnClearFilters}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          </div>

          <div className={styles.hrViewAssessmentFilterGroup}>
            <button
              className={styles.hrViewAssessmentBtnExport}
              onClick={() => exportToCsv("appraisals.csv", csvData)}
            >
              <i className="bi bi-download"></i> Export CSV
            </button>
          </div>
        </div>

        <div className={styles.hrViewAssessmentTableCard}>
          <div className={styles.hrViewAssessmentTableWrapper}>
            <table className={styles.hrViewAssessmentTable}>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Project Name</th>
                  <th style={{ textAlign: "center" }}>Emp Avg</th>
                  <th>L1 Reviewer</th>
                  <th style={{ textAlign: "center" }}>L1 Avg</th>
                  <th>L2 Reviewer</th>
                  <th style={{ textAlign: "center" }}>L2 Avg</th>
                  <th>Status</th>
                  <th className={styles.textCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.hrViewAssessmentEmptyState}>
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
                        <div className={styles.hrViewAssessmentActionButtons}>
                          <button
                            className={`${styles.hrViewAssessmentActionBtn} ${styles.hrViewAssessmentBtnView}`}
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

          <div className={styles.hrViewAssessmentPaginationContainer}>
            <div className={styles.hrViewAssessmentPaginationInfo}>
              <span className={styles.hrViewAssessmentPaginationLabel}>Show</span>
              <select
                className={styles.hrViewAssessmentPaginationSelect}
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
              <span className={styles.hrViewAssessmentPaginationLabel}>entries</span>
            </div>
            <div className={styles.hrViewAssessmentPaginationStatus}>
              Showing {summaryRows.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, summaryRows.length)} of{" "}
              {summaryRows.length} entries
            </div>
            <nav className={styles.hrViewAssessmentPaginationNav}>
              <ul className={styles.hrViewAssessmentPagination}>
                <li className={`${styles.hrViewAssessmentPageItem}${currentPage === 1 ? ` ${styles.hrViewAssessmentDisabled}` : ""}`}>
                  <button
                    className={styles.hrViewAssessmentPageLink}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, idx) => (
                  <li
                    key={idx}
                    className={`${styles.hrViewAssessmentPageItem}${page === currentPage ? ` ${styles.hrViewAssessmentActive}` : ""} ${typeof page !== "number" ? ` ${styles.hrViewAssessmentDisabled}` : ""
                      }`}
                  >
                    <button
                      className={styles.hrViewAssessmentPageLink}
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`${styles.hrViewAssessmentPageItem}${currentPage === totalPages ? ` ${styles.hrViewAssessmentDisabled}` : ""}`}>
                  <button
                    className={styles.hrViewAssessmentPageLink}
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
