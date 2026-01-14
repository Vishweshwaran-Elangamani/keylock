import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees,
  getAssessmentAttachments,
  downloadAttachment,
  getApprovedEmployeeDetails,
} from "../../../services/performancemanagement/api/rolesapi";
import { getEmployeeIdForFilter } from "../../../utils/PerformanceManagement/jwtDecoder";
import { toast } from "sonner";
import "../../../styles/performancemanagement/depthead/DeptHeadPage.css";
import {
  ApproveModal,
  DetailsModal,
} from "../../../components/performance_management/modals/DeptHeadPage/DeptHeadModals";

import Breadcrumb from "../../../components/common/Breadcrumb";

const getExtensionFromContentType = (contentType) => {
  if (!contentType) return null;

  const mimeToExt = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
  };

  return mimeToExt[contentType.toLowerCase()] || null;
};

/* Custom Project Dropdown Component */
const ProjectFilterDropdown = ({ value, onChange, projects }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "All Projects", value: "" },
    ...projects.map((project) => ({ label: project, value: project })),
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="dp-project-filter-dropdown custom-dp-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-dp-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="custom-dp-arrow" />
      </div>

      {open && (
        <div className="custom-dp-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all"}
              className={
                "custom-dp-option" +
                (opt.value === value ? " custom-dp-option-active" : "")
              }
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

export default function DeptHeadPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [filterProject, setFilterProject] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
  const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);

  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [approvedDetails, setApprovedDetails] = useState(null);
  const [approvedLoading, setApprovedLoading] = useState(false);

  useEffect(() => {
    fetchData();

    const refreshInterval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    pendingRequests,
    approvedRequests,
    activeTab,
    appliedSearch,
    filterProject,
  ]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const departmentHeadId = getEmployeeIdForFilter();

      if (!departmentHeadId) {
        toast.error("Unable to identify department head. Please login again.");
        console.error("Department Head ID not found");
        return;
      }

      const pendingRes = await getDeptHeadSubmittedRatings(departmentHeadId);
      const approvedRes = await getApprovedEmployees(1, 1000, departmentHeadId);

      if (pendingRes.data.success) {
        setPendingRequests(pendingRes.data.data || []);
      }

      if (approvedRes.data.success) {
        setApprovedRequests(approvedRes.data.data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.dismiss();
      toast.error("Failed to load employee assessments");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchAttachments = async (assessmentId) => {
    setLoadingAttachments(true);
    try {
      const departmentHeadId = getEmployeeIdForFilter();
      const response = await getAssessmentAttachments(
        departmentHeadId,
        assessmentId
      );

      if (response.data.success) {
        setAttachments(response.data.data || []);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId) => {
    try {
      const departmentHeadId = getEmployeeIdForFilter();
      const response = await downloadAttachment(departmentHeadId, attachmentId);

      let filename = "attachment";

      const contentDisposition = response.headers["content-disposition"];

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename\s*=\s*"([^"]+)"/);
        if (matches && matches[1]) {
          filename = matches[1].trim();
        } else {
          const matches2 = contentDisposition.match(
            /filename\s*=\s*([^;,\n]+)/
          );
          if (matches2 && matches2[1]) {
            filename = matches2[1].trim();
          }
        }
      }

      const contentType = response.headers["content-type"];

      if (!filename.includes(".") && contentType) {
        const extension = getExtensionFromContentType(contentType);
        if (extension) {
          filename = `${filename}${extension}`;
        }
      }

      const blob = new Blob([response.data], {
        type: contentType || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment.");
    }
  };

  const applyFilters = () => {
    let filtered =
      activeTab === "pending" ? [...pendingRequests] : [...approvedRequests];

    if (appliedSearch) {
      const search = appliedSearch.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeName?.toLowerCase().includes(search) ||
          emp.projectName?.toLowerCase().includes(search) ||
          emp.employeeCompanyId?.toLowerCase().includes(search)
      );
    }

    if (filterProject) {
      filtered = filtered.filter((emp) => emp.projectName === filterProject);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setFilterProject("");
  };

  const handleSearchClick = () => {
    setAppliedSearch(searchTerm);
  };

  const handleViewDetails = async (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);

    const assessmentId = employee.assessmentId || employee.AssessmentId;

    if (assessmentId) {
      await fetchAttachments(assessmentId);
    }
  };

  // ← NEW: Handle approved details with attachments
  const handleViewApprovedDetails = async (approvalId) => {
    setApprovedLoading(true);
    try {
      const response = await getApprovedEmployeeDetails(approvalId);
      if (response.data.success) {
        const data = response.data.data;
        setApprovedDetails(data);
        setShowDetailsModal(true);

        // Try ALL possible assessment ID field names
        const assessmentId =
          data.assessmentId ||
          data.AssessmentId ||
          data.id ||
          data.Id ||
          data.assessment_id ||
          data.Assessment_id;

        if (assessmentId) {
          await fetchAttachments(assessmentId);
        } else {
          console.error(" NO assessmentId found in ANY field!");
        }
      }
    } catch (error) {
      console.error("Error fetching approved details:", error);
      toast.error("Failed to load approved assessment details");
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleApproveClick = (employee) => {
    setSelectedEmployee(employee);
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedEmployee) return;

    setApprovingEmployeeId(selectedEmployee.employeeId);
    try {
      toast.loading("Approving employee...");

      const res = await approveDeptHeadEmployee({
        employeeId: selectedEmployee.employeeId,
        projectId: selectedEmployee.projectId,
        assessmentId: selectedEmployee.assessmentId,
      });

      if (res.data.success) {
        toast.dismiss();
        toast.success(
          `${selectedEmployee.employeeName} approved successfully!`
        );

        setShowApproveModal(false);
        setSelectedEmployee(null);

        fetchData(true);
      }
    } catch (err) {
      console.error("Error approving employee:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to approve employee";
      toast.dismiss();
      toast.error(errorMsg);
    } finally {
      setApprovingEmployeeId(null);
    }
  };

  const handleModalClose = () => {
    setShowApproveModal(false);
    setShowDetailsModal(false);
    setSelectedEmployee(null);
    setApprovedDetails(null);
    setAttachments([]);
  };

  const toggleDetails = (employeeId) => {
    setExpandedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const getAvgRating = (competencies, key) => {
    if (!competencies || competencies.length === 0) return "-";
    const vals = competencies
      .filter((c) => c[key] != null && c[key] !== -1)
      .map((c) => c[key]);
    if (vals.length === 0) return "-";
    const total = vals.reduce((a, b) => a + b, 0);
    return (total / vals.length).toFixed(2);
  };

  const getAvgChecklistProgress = (checklists) => {
    if (!checklists || checklists.length === 0) return 0;
    let totalProgress = 0;
    let count = 0;

    checklists.forEach((cl) => {
      if (cl.progresses && cl.progresses.length) {
        cl.progresses.forEach((p) => {
          count++;
          totalProgress += p.isCompleted ? 100 : 0;
        });
      }
    });

    if (count === 0) return 0;
    return Math.round(totalProgress / count);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (
        parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
      );
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUniqueProjects = () => {
    const projects =
      activeTab === "pending"
        ? pendingRequests.map((emp) => emp.projectName)
        : approvedRequests.map((emp) => emp.projectName);
    return [...new Set(projects)].filter(Boolean);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "bi-file-earmark";
    if (fileType.includes("pdf")) return "bi-file-earmark-pdf";
    if (fileType.includes("word") || fileType.includes("document"))
      return "bi-file-earmark-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "bi-file-earmark-excel";
    if (fileType.includes("image")) return "bi-file-earmark-image";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "bi-file-earmark-zip";
    return "bi-file-earmark";
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getPaginatedData = (tab) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const data = tab === "pending" ? pendingRequests : approvedRequests;

    const filtered = filteredData
      ? filteredData.filter((item) =>
          tab === "pending"
            ? pendingRequests.includes(item)
            : approvedRequests.includes(item)
        )
      : data;

    return filtered.slice(startIndex, endIndex);
  };

  const getPageNumbers = () => {
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
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="dp-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const hasActiveFilters = appliedSearch || filterProject;

  return (
    <div className="dp-page">
      <div className="dp-breadcrumb-wrapper">
        <nav className="hrfcper-breadcrumb-nav" aria-label="breadcrumb">
          <Breadcrumb items={[{ label: "Department Head Dashboard" }]} />
        </nav>
      </div>

      <div className="dp-tab-toggle-wrapper">
        <div className="dp-tab-toggle">
          <button
            className={`dp-tab-toggle-btn ${
              activeTab === "pending" ? "active" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>

          <button
            className={`dp-tab-toggle-btn ${
              activeTab === "approved" ? "active" : ""
            }`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </button>
        </div>
      </div>

      <div className="dp-filters-card">
        <div className="dp-filter-controls">
          <div className="dp-search-wrapper">
            <div className="dp-search-input-container">
              <i className="bi bi-search dp-search-icon-input"></i>
              <input
                type="text"
                placeholder="Search employee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchClick();
                  }
                }}
                className="dp-search-input-field"
              />
            </div>

            <button
              onClick={handleSearchClick}
              className="dp-search-submit-btn"
            >
              Search
            </button>
          </div>

          <button onClick={handleClearFilters} className="dp-clear-filters-btn">
            Clear Filters
          </button>

          <ProjectFilterDropdown
            value={filterProject}
            onChange={(val) => setFilterProject(val)}
            projects={getUniqueProjects()}
          />
        </div>
      </div>

      <div className="dp-table-card dp-table-card-bordered">
        <div className="dp-table-wrapper">
          {activeTab === "pending" ? (
            <table className="dp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Avg Employee Rating</th>
                  <th>Avg L1 Rating</th>
                  <th>Avg L2 Rating</th>
                  <th>Goals</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedData("pending").length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dp-empty-state">
                      <div className="dp-empty-content">
                        <i className="bi bi-inbox"></i>
                        <p>No pending approvals found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getPaginatedData("pending").map((emp) => (
                    <React.Fragment key={emp.assessmentId || emp.employeeId}>
                      <tr>
                        <td>
                          <div className="dp-user-info">
                            <div className="dp-user-avatar">
                              {getInitials(emp.employeeName)}
                            </div>
                            <div>
                              <span className="dp-user-name">
                                {emp.employeeName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{emp.projectName}</td>
                        <td>
                          <span className="dp-rating-badge emp-rating">
                            {getAvgRating(emp.competencies, "employeeRating")}
                          </span>
                        </td>
                        <td>
                          <span className="dp-rating-badge l1-rating">
                            {getAvgRating(emp.competencies, "l1Rating")}
                          </span>
                        </td>
                        <td>
                          <span className="dp-rating-badge l2-rating">
                            {getAvgRating(emp.competencies, "l2Rating")}
                          </span>
                        </td>
                        <td>
                          <span className="dp-goals-badge">
                            <i className="bi bi-bullseye"></i>
                            {emp.goals?.length || 0}
                          </span>
                        </td>
                        <td>
                          <div className="dp-action-buttons">
                            <button
                              className="dp-action-btn dp-action-btn-view"
                              onClick={() => handleViewDetails(emp)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="dp-action-btn dp-action-btn-approve"
                              onClick={() => handleApproveClick(emp)}
                              title="Approve"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="dp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Avg Employee Rating</th>
                  <th>Avg L1 Rating</th>
                  <th>Avg L2 Rating</th>
                  <th>Approved At</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedData("approved").length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dp-empty-state">
                      <div className="dp-empty-content">
                        <i className="bi bi-inbox"></i>
                        <p>No approved employees found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getPaginatedData("approved").map((emp) => (
                    <React.Fragment key={emp.approvalId || emp.employeeId}>
                      <tr>
                        <td>
                          <div className="dp-user-info">
                            <div className="dp-user-avatar">
                              {getInitials(emp.employeeName)}
                            </div>
                            <div>
                              <span className="dp-user-name">
                                {emp.employeeName}
                              </span>
                              {emp.employeeCompanyId && (
                                <small className="dp-user-id">
                                  @{emp.employeeCompanyId}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{emp.projectName}</td>
                        <td>
                          <span className="dp-rating-badge emp-rating">
                            {emp.employeeAvgRating || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="dp-rating-badge l1-rating">
                            {emp.l1AvgRating || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="dp-rating-badge l2-rating">
                            {emp.l2AvgRating || "-"}
                          </span>
                        </td>
                        <td className="text-muted">
                          {formatDate(emp.approvedAt)}
                        </td>
                        <td>
                          <div className="dp-action-buttons">
                            <button
                              className="dp-action-btn dp-action-btn-view"
                              onClick={() =>
                                handleViewApprovedDetails(emp.approvalId)
                              }
                              title="View Details"
                              disabled={approvedLoading}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="dp-pagination-container dp-pagination-bordered">
            <div className="dp-pagination-info">
              <span className="dp-pagination-label">Show</span>
              <select
                className="dp-pagination-select"
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
              <span className="dp-pagination-label">entries</span>
            </div>
            <div className="dp-pagination-status">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>
            <nav className="dp-pagination-nav">
              <ul className="dp-pagination">
                <li
                  className={`dp-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="dp-page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`dp-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="dp-page-link"
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li
                  className={`dp-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="dp-page-link"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <ApproveModal
        showApproveModal={showApproveModal}
        selectedEmployee={selectedEmployee}
        approvingEmployeeId={approvingEmployeeId}
        handleModalClose={handleModalClose}
        handleApproveSubmit={handleApproveSubmit}
        getAvgRating={getAvgRating}
      />

      <DetailsModal
        showDetailsModal={showDetailsModal}
        approvedDetails={approvedDetails}
        selectedEmployee={selectedEmployee}
        attachments={attachments}
        loadingAttachments={loadingAttachments}
        handleModalClose={handleModalClose}
        handleDownloadAttachment={handleDownloadAttachment}
        getAvgRating={getAvgRating}
        formatFileSize={formatFileSize}
        getAvgChecklistProgress={getAvgChecklistProgress}
      />
    </div>
  );
}
