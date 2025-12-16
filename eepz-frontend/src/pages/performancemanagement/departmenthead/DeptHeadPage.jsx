import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees,
} from "../../../services/performancemanagement/api/rolesapi";
import { getEmployeeIdForFilter } from "../../../utils/PerformanceManagement/jwtDecoder";
import { toast } from "sonner";
import "../../../styles/performancemanagement/hr/DeptHeadPage.css";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { apiPort5113 } from "../../../services/performancemanagement/api/rolesapi";


const getExtensionFromContentType = (contentType) => {
  if (!contentType) return null;

  const mimeToExt = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
  };

  return mimeToExt[contentType.toLowerCase()] || null;
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

  useEffect(() => {
    fetchData();

    const refreshInterval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pendingRequests, approvedRequests, activeTab, searchTerm, filterProject]);

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
      const response = await apiPort5113.get(`/DeptHeadApprovals/${departmentHeadId}/assessment/${assessmentId}/attachments`);

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
      console.log(`Downloading attachment ${attachmentId}`);

      const departmentHeadId = getEmployeeIdForFilter();
      const response = await apiPort5113.get(
        `/DeptHeadApprovals/${departmentHeadId}/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );

      console.log('Full Response:', response);
      console.log('Response headers object:', response.headers);

      let filename = 'attachment';

      const contentDisposition = response.headers['content-disposition'];
      console.log('Content-Disposition header:', contentDisposition);

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename\s*=\s*"([^"]+)"/);
        if (matches && matches[1]) {
          filename = matches[1].trim();
          console.log('✅ Extracted filename from header:', filename);
        } else {
          const matches2 = contentDisposition.match(/filename\s*=\s*([^;,\n]+)/);
          if (matches2 && matches2[1]) {
            filename = matches2[1].trim();
            console.log('✅ Extracted filename from header (no quotes):', filename);
          }
        }
      }

      const contentType = response.headers['content-type'];
      console.log('Content-Type:', contentType);

      if (!filename.includes('.') && contentType) {
        const extension = getExtensionFromContentType(contentType);
        if (extension) {
          filename = `${filename}${extension}`;
          console.log('Added extension based on content-type:', filename);
        }
      }

      console.log('Final filename for download:', filename);

      const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);

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
    let filtered = activeTab === "pending" ? [...pendingRequests] : [...approvedRequests];

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

  const handleViewDetails = async (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);

    if (employee.assessmentId) {
      await fetchAttachments(employee.assessmentId);
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
        toast.success(`${selectedEmployee.employeeName} approved successfully!`);

        setShowApproveModal(false);
        setSelectedEmployee(null);

        fetchData(true);
      }
    } catch (err) {
      console.error("Error approving employee:", err);
      const errorMsg = err.response?.data?.message || "Failed to approve employee";
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
    const vals = competencies.filter((c) => c[key] != null && c[key] !== -1).map((c) => c[key]);
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
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUniqueProjects = () => {
    const projects =
      activeTab === "pending" ? pendingRequests.map((emp) => emp.projectName) : approvedRequests.map((emp) => emp.projectName);
    return [...new Set(projects)].filter(Boolean);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "bi-file-earmark";
    if (fileType.includes("pdf")) return "bi-file-earmark-pdf";
    if (fileType.includes("word") || fileType.includes("document")) return "bi-file-earmark-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "bi-file-earmark-excel";
    if (fileType.includes("image")) return "bi-file-earmark-image";
    if (fileType.includes("zip") || fileType.includes("compressed")) return "bi-file-earmark-zip";
    return "bi-file-earmark";
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getPaginatedData = (tab) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const data = tab === "pending" ? pendingRequests : approvedRequests;

    const filtered = filteredData
      ? filteredData.filter(item =>
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
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const renderApproveModal = () => {
    if (!showApproveModal || !selectedEmployee) return null;

    return (
      <>
        <div className="dp-modal-backdrop"></div>
        <div className="dp-modal-wrapper">
          <div className="dp-modal-dialog" style={{
            border: "2px solid #27235c",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            <div style={{
              background: '#27235C',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 28px',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              borderBottom: '1px solid #e5e7eb',
              textAlign: "left",
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: '700',
                fontSize: '1.18rem',
                gap: '10px',
                textAlign: "left",
              }}>
                <i className="bi bi-check-circle-fill"></i>
                Approve Employee Assessment
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                disabled={approvingEmployeeId}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  textAlign: "left",
                }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div style={{
              background: '#fff',
              padding: '24px 28px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              textAlign: "left",
            }}>
              <div className="dp-details-box">
                <h6 className="dp-details-title">
                  <i className="bi bi-person-badge me-2"></i>
                  Employee Information
                </h6>
                <div className="dp-details-grid">
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Employee Name:</div>
                    <div className="dp-detail-value">
                      <strong>{selectedEmployee.employeeName}</strong>
                    </div>
                  </div>
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Project:</div>
                    <div className="dp-detail-value">{selectedEmployee.projectName}</div>
                  </div>
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg Employee Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge emp-rating">
                        {getAvgRating(selectedEmployee.competencies, "employeeRating")}
                      </span>
                    </div>
                  </div>
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg L1 Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge l1-rating">
                        {getAvgRating(selectedEmployee.competencies, "l1Rating")}
                      </span>
                    </div>
                  </div>
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Avg L2 Rating:</div>
                    <div className="dp-detail-value">
                      <span className="dp-rating-badge l2-rating">
                        {getAvgRating(selectedEmployee.competencies, "l2Rating")}
                      </span>
                    </div>
                  </div>
                  <div className="dp-detail-row">
                    <div className="dp-detail-label">Goals Assigned:</div>
                    <div className="dp-detail-value">
                      <span className="dp-goals-badge">
                        <i className="bi bi-bullseye"></i>
                        {selectedEmployee.goals?.length || 0} Goals
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dp-info-alert">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Note:</strong> Approving this assessment will finalize the performance review process.
                  The employee will be notified via system notification.
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8f9fa',
                borderTop: '1px solid #e5e7eb',
                margin: '24px -28px -28px -28px',
                padding: '20px 28px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                textAlign: "left"
              }}>
                <button
                  type="button"
                  className="dp-btn-cancel"
                  onClick={handleModalClose}
                  disabled={approvingEmployeeId}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    padding: '0.75rem 2rem',
                    textAlign: "left"
                  }}>
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button
                  type="button"
                  className="dp-btn-submit"
                  onClick={handleApproveSubmit}
                  disabled={approvingEmployeeId}
                  style={{
                    background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    padding: '0.75rem 2rem',
                    boxShadow: '0 2px 8px rgba(151, 36, 126, 0.15)',
                    textAlign: "left"
                  }}>
                  {approvingEmployeeId ? (
                    <>
                      <span className="dp-spinner"></span> Approving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i> Approve Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedEmployee) return null;

    return (
      <>
        <div
          className="dp-modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(39, 35, 92, 0.35)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1040,
          }}
        ></div>
        <div className="dp-modal-wrapper"
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1050,
            padding: '30px 10px'
          }}>
          <div className="dp-modal-dialog"
            style={{
              maxWidth: '780px',
              width: '100%',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: "2px solid #27235c"
            }}
          >
            <div style={{
              background: '#27235C',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 32px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              borderBottom: '1.5px solid #e5e7eb',
              fontWeight: 700,
              fontSize: '1.18rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="bi bi-file-text-fill"></i>
                Employee Assessment Details
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '7px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.20rem'
                }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div style={{
              background: '#f7f8fc',
              padding: '0 0 0 0',
              flex: 1,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              textAlign: "left"
            }}>
              <div style={{
                display: 'flex',
                gap: '2rem',
                padding: '32px 32px 0 32px',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  flex: '1 1 240px',
                  background: '#fff',
                  borderRadius: '14px',
                  boxShadow: '0 2px 7px #c1b6dd26',
                  marginBottom: '20px',
                  padding: '18px 24px',
                  minWidth: '240px',
                  minHeight: "170px",
                  border: "1px solid #27235c"
                }}>
                  <h5 style={{
                    margin: 0,
                    fontWeight: 700,
                    color: '#27235c',
                    fontSize: "1.09rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}>
                    <i className="bi bi-person-badge"></i>
                    Employee Info
                  </h5>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      {selectedEmployee.employeeName}
                    </div>
                    <div style={{ fontSize: "1.02rem", color: "#666" }}>
                      {selectedEmployee.projectName}
                    </div>
                    <div style={{ fontSize: "0.99rem", color: "#9c8dbb" }}>
                      <i className="bi bi-bullseye"></i>&nbsp;Goals:&nbsp;
                      <b>{selectedEmployee.goals?.length || 0}</b>
                    </div>
                  </div>
                </div>

                <div style={{
                  flex: '1 1 240px',
                  background: '#fff',
                  borderRadius: '14px',
                  boxShadow: '0 2px 7px #c1b6dd26',
                  marginBottom: '20px',
                  padding: '18px 24px',
                  minWidth: '240px',
                  minHeight: "170px",
                  border: "1px solid #27235c"
                }}>
                  <h5 style={{
                    margin: 0,
                    fontWeight: 700,
                    color: '#27235c',
                    fontSize: "1.09rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}>
                    <i className="bi bi-star-half"></i>
                    Average Ratings
                  </h5>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>
                        <i className="bi bi-person"></i>&nbsp;Employee
                      </span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#97247e"
                      }}>{getAvgRating(selectedEmployee.competencies, "employeeRating")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>
                        <i className="bi bi-1-circle"></i>&nbsp;L1
                      </span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#6666B2"
                      }}>{getAvgRating(selectedEmployee.competencies, "l1Rating")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>
                        <i className="bi bi-2-circle"></i>&nbsp;L2
                      </span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#3CA36E"
                      }}>{getAvgRating(selectedEmployee.competencies, "l2Rating")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: "#fff",
                margin: "0 32px 22px 32px",
                borderRadius: '13px',
                boxShadow: '0 2px 8px #c1b6dd1c',
                padding: '24px 20px',
                border: "1px solid #27235c"
              }}>
                <div style={{
                  fontWeight: 700,
                  color: "#27235c",
                  fontSize: "1.03rem",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}>
                  <i className="bi bi-grid"></i>
                  Competencies Breakdown
                </div>
                <div className="dp-inner-table-wrapper">
                  <table className="dp-inner-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#27235c' }}>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>Competency</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>Employee Rating</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>Employee Comments</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L1 Reviewer</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L1 Rating</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L1 Comments</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L2 Reviewer</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L2 Rating</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>L2 Comments</th>
                        <th style={{ color: '#ffffff', padding: '8px', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.competencies && selectedEmployee.competencies.length > 0 ? (
                        selectedEmployee.competencies.map((c, idx) => (
                          <tr key={idx}>
                            <td>{c.competencyName}</td>
                            <td><strong className="emp-rating">{c.employeeRating || "-"}</strong></td>
                            <td>{c.employeeComments || "-"}</td>
                            <td>{c.l1ReviewerName || "No L1"}</td>
                            <td><strong className="l1-rating">{c.l1Rating || "-"}</strong></td>
                            <td>{c.l1Comments || "-"}</td>
                            <td>{c.l2ReviewerName || "No L2"}</td>
                            <td><strong className="l2-rating">{c.l2Rating || "-"}</strong></td>
                            <td>{c.l2Comments || "-"}</td>
                            <td>
                              <span className={`dp-status-badge status-${c.status?.toLowerCase()}`}>{c.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="dp-no-data">No competencies found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{
                background: "#fff",
                margin: "0 32px 22px 32px",
                borderRadius: '13px',
                boxShadow: '0 2px 8px #c1b6dd1c',
                padding: '22px 20px 18px 20px',
                border: "1px solid #27235c"
              }}>
                <div style={{
                  fontWeight: 700,
                  color: "#27235c",
                  fontSize: "1.03rem",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 7
                }}>
                  <i className="bi bi-paperclip"></i>
                  Attachments
                </div>
                {loadingAttachments ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '10px', marginBottom: 0 }}>Loading attachments...</p>
                  </div>
                ) : attachments.length === 0 ? (
                  <p className="dp-no-data">No attachments found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {attachments.map((attachment) => (
                      <div key={attachment.attachmentId} style={{
                        border: '1.2px solid #ece6fa',
                        borderRadius: '9px',
                        padding: '12px 15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8f7fc'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {attachment.fileName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              {formatFileSize(attachment.fileSize)} • Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                            </div>
                            {attachment.attachmentNote && (
                              <div style={{ fontSize: '0.85rem', color: '#9c8dbb', marginTop: '4px' }}>
                                {attachment.attachmentNote}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(attachment.attachmentId)}
                          style={{
                            background: " #27235c",
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="bi bi-download"></i> Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                background: "#fff",
                margin: "0 32px 28px 32px",
                borderRadius: '13px',
                boxShadow: '0 2px 8px #c1b6dd1c',
                padding: '22px 20px 18px 20px',
                border: "1px solid #27235c"
              }}>
                <div style={{
                  fontWeight: 700,
                  color: "#27235c",
                  fontSize: "1.03rem",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 7
                }}>
                  <i className="bi bi-bullseye"></i>
                  Goals
                </div>
                {selectedEmployee.goals && selectedEmployee.goals.length === 0 ? (
                  <p className="dp-no-data">No goals assigned.</p>
                ) : (
                  selectedEmployee.goals?.map((goal) => {
                    const latestProgressLog = goal.goalProgressLogs?.length
                      ? goal.goalProgressLogs.sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))[0]
                      : null;

                    const latestProgress = latestProgressLog ? latestProgressLog.progressPercent : 0;
                    const checklistProgress = getAvgChecklistProgress(goal.goalChecklists);
                    const overallProgress = latestProgress || checklistProgress;

                    return (
                      <div key={goal.goalId} className="dp-goal-card" style={{
                        border: '1.2px solid #ece6fa',
                        borderRadius: '9px',
                        marginBottom: '13px',
                        padding: '10px 13px'
                      }}>
                        <div className="dp-goal-header" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <h5 className="dp-goal-title" style={{ fontWeight: 600, fontSize: '1.01rem', margin: 0 }}>
                              {goal.goalTitle}
                            </h5>
                            <p className="dp-goal-description" style={{
                              fontSize: '0.96rem',
                              margin: 0,
                              opacity: 0.82
                            }}>{goal.goalDescription}</p>
                          </div>
                          <span className={`dp-goal-status-badge status-${goal.goalstatus?.toLowerCase()}`}>
                            {goal.goalstatus}
                          </span>
                        </div>
                        <div className="dp-progress-container" style={{ marginTop: 8 }}>
                          <div className="dp-progress-label" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.97rem'
                          }}>
                            <span>Progress</span>
                            <span className="dp-progress-value">{overallProgress}%</span>
                          </div>
                          <div className="dp-progress-bar-bg" style={{
                            background: '#efe2f1',
                            borderRadius: '5px',
                            height: 6,
                            width: '96%',
                            marginTop: 4
                          }}>
                            <div className="dp-progress-bar-fill" style={{
                              background: 'linear-gradient(90deg, #af295c 0%, #d1297b 100%)',
                              height: 6,
                              borderRadius: '4px',
                              width: `${overallProgress}%`
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              background: '#f8f9fa',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              borderTop: '1px solid #e5e7eb',
              padding: '20px 32px 16px 32px'
            }}>
              <button
                type="button"
                className="dp-btn-cancel"
                onClick={handleModalClose}
                style={{
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  padding: '0.75rem 2.25rem'
                }}>
                <i className="bi bi-x-circle"></i> Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
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

  return (
    <div className="dp-page">
      {/* REDUCED TOP PADDING */}
      <div style={{ padding: '0.5rem 0 0.25rem 0' }}>
        <nav className="hrfcper-breadcrumb-nav" aria-label="breadcrumb">
          <Breadcrumb
            items={[{ label: 'Department Head Dashboard' }]}
          />
        </nav>
      </div>

      {/* TABS */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            background: "#27235C",
            borderRadius: 30,
            padding: "4px 8px",
            gap: 6,
            border: "3px solid #27235C",
            width: "fit-content",
            boxShadow: "0 1.5px 8px 0 rgba(39,35,92,0.03)",
          }}
        >
          <button
            style={{
              padding: "10px 28px",
              background: activeTab === "pending" ? "#fff" : "transparent",
              color: activeTab === "pending" ? "#27235C" : "#fff",
              border: "none",
              borderRadius: 30,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              minWidth: 140,
              transition: "all 0.18s cubic-bezier(.82,.75,.11,1.36)",
              outline: "none",
              boxShadow:
                activeTab === "pending"
                  ? "0 2px 8px 0 rgb(39 35 92 / 7%)"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingRequests.length})
          </button>

          <button
            style={{
              padding: "10px 28px",
              background: activeTab === "approved" ? "#fff" : "transparent",
              color: activeTab === "approved" ? "#27235C" : "#fff",
              border: "none",
              borderRadius: 30,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              minWidth: 140,
              transition: "all 0.18s cubic-bezier(.82,.75,.11,1.36)",
              outline: "none",
              boxShadow:
                activeTab === "approved"
                  ? "0 2px 8px 0 rgb(39 35 92 / 7%)"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={() => setActiveTab("approved")}
          >
            Approved ({approvedRequests.length})
          </button>
        </div>
      </div>

      {/* FILTERS - IMPROVED UI */}
      <div className="dp-filters-card" style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* COMBINED SEARCH BAR + BUTTON */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            border: '2px solid #27235C',
            borderRadius: '8px',
            overflow: 'hidden',
            flex: '1 1 300px',
            minWidth: '250px'
          }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-search" style={{
                position: 'absolute',
                left: '12px',
                color: '#6c757d',
                fontSize: '14px',
                pointerEvents: 'none'
              }}></i>
              <input
                type="text"
                placeholder="Search employee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedSearch(searchTerm);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px 10px 36px',
                  border: 'none',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'transparent'
                }}
              />
            </div>
            <button
              onClick={() => setAppliedSearch(searchTerm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#27235C',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Search
            </button>
          </div>
            {/* CLEAR FILTERS BUTTON */}
            <button
            onClick={handleClearFilters}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: '14px',
              cursor: "pointer",
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Clear Filters
          </button>

          {/* PROJECT FILTER */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #27235C',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px'
            }}
          >
            <option value="">All Projects</option>
            {getUniqueProjects().map((project, idx) => (
              <option key={idx} value={project}>
                {project}
              </option>
            ))}
          </select>

        
        </div>
      </div>

      {/* TABLE */}
      <div
        className="dp-table-card"
        style={{ border: "2px solid #27235C", borderRadius: "8px", overflow: "hidden" }}
      >
        <div className="dp-table-wrapper">
          {activeTab === "pending" ? (
            <table className="dp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    <td
                      colSpan={7}
                      className="dp-empty-state"
                      style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <i className="bi bi-inbox" style={{ fontSize: "1.5rem" }}></i>
                        <p style={{ margin: 0 }}>No pending approvals found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getPaginatedData("pending").map((emp) => (
                    <React.Fragment key={emp.assessmentId || emp.employeeId}>
                      <tr>
                        <td>
                          <div className="dp-user-info">
                            <div className="dp-user-avatar">{getInitials(emp.employeeName)}</div>
                            <div>
                              <span className="dp-user-name">{emp.employeeName}</span>
                              {emp.employeeCompanyId && (
                                <small className="dp-user-id">@{emp.employeeCompanyId}</small>
                              )}
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
            <table className="dp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project</th>
                  <th>Approved At</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedData("approved").length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dp-empty-state" style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <i className="bi bi-inbox" style={{ fontSize: "1.5rem" }}></i>
                        <p style={{ margin: 0 }}>No approved employees found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getPaginatedData("approved").map((emp) => (
                    <React.Fragment key={emp.assessmentId || emp.employeeId}>
                      <tr>
                        <td>
                          <div className="dp-user-info">
                            <div className="dp-user-avatar">{getInitials(emp.employeeName)}</div>
                            <div>
                              <span className="dp-user-name">{emp.employeeName}</span>
                              {emp.employeeCompanyId && (
                                <small className="dp-user-id">@{emp.employeeCompanyId}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{emp.projectName}</td>
                        <td className="text-muted">{formatDate(emp.approvedAt)}</td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {filteredData.length > 0 && (
          <div
            className="dp-pagination-container"
            style={{ borderTop: "2px solid #27235C", paddingTop: "10px", marginTop: "10px" }}
          >
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
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
            </div>
            <nav className="dp-pagination-nav">
              <ul className="dp-pagination">
                <li className={`dp-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="dp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {getPageNumbers().map((page, index) => (
                  <li
                    key={index}
                    className={`dp-page-item ${page === currentPage ? "active" : ""} ${typeof page !== "number" ? "disabled" : ""
                      }`}
                  >
                    <button
                      className="dp-page-link"
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={typeof page !== "number"}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`dp-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="dp-page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {renderApproveModal()}
      {renderDetailsModal()}
    </div>
  );
}
