import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDeptHeadSubmittedRatings,
  approveDeptHeadEmployee,
  getApprovedEmployees,
} from "../../../services/performancemanagement/hr/api";
import { getEmployeeIdForFilter } from "../../../utils/PerformanceManagement/jwtDecoder";
import { toast } from "sonner";
import "../../../styles/performancemanagement/hr/DeptHeadPage.css";

export default function DeptHeadPage() {
  // ========================
  // STATE MANAGEMENT
  // ========================

  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeTab, setActiveTab] = useState("pending");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState(new Set());
  const [approvingEmployeeId, setApprovingEmployeeId] = useState(null);

  // ========================
// EFFECTS
// ========================
// ========================
// EFFECTS
// ========================

useEffect(() => {
  fetchData();  // Initial load

  const refreshInterval = setInterval(() => {
    fetchData(true);  // Silent background refresh
  }, 30000);

  return () => clearInterval(refreshInterval);
}, []);  // ← Empty dependency array - only runs on mount

useEffect(() => {
  applyFilters();
}, [pendingRequests, approvedRequests, activeTab, searchTerm, filterProject]);

// ========================
// API FUNCTIONS
// ========================

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

  // ========================
  // FILTER FUNCTIONS
  // ========================

  const applyFilters = () => {
    let filtered = activeTab === "pending" ? [...pendingRequests] : [...approvedRequests];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
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

  // ========================
  // APPROVE HANDLERS
  // ========================

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
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
  };

  // ========================
  // TABLE EXPAND/COLLAPSE
  // ========================

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

  // ========================
  // UI HELPERS
  // ========================

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

  // ========================
  // PAGINATION FUNCTIONS
  // ========================

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
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

  // ========================
  // RENDER MODALS
  // ========================

  const renderApproveModal = () => {
    if (!showApproveModal || !selectedEmployee) return null;
  
    return (
      <>
        <div className="dp-modal-backdrop"></div>
        <div className="dp-modal-wrapper">
          <div className="dp-modal-dialog" style={{
            border: "2px solid #27235c",  // ← Border added to modal
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {/* Modal Header (Deep Purple, white, contemporary) */}
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
  
            {/* Modal Body */}
            <div style={{
              background: '#fff',
              padding: '24px 28px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
              textAlign: "left",
            }}>
              {/* Employee Details Box */}
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
              {/* Info Alert */}
              <div className="dp-info-alert">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Note:</strong> Approving this assessment will finalize the performance review process.
                  The employee will be notified via system notification.
                </div>
              </div>
              {/* Modal Footer */}
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
        {/* Blurred, semi-dark backdrop */}
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
            {/* Modal Header */}
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
  
            {/* Modal Body */}
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
                {/* Employee Card */}
                <div style={{
                  flex: '1 1 260px',
                  background: '#fff',
                  borderRadius: '14px',
                  boxShadow: '0 2px 7px #c1b6dd26',
                  marginBottom: '20px',
                  padding: '18px 24px',
                  
                  minWidth: '250px',
                  minHeight: "170px", 
                  border: "1px solid #27235c"
                   // or use height: "170px" if you want them strictly equal

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
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{selectedEmployee.employeeName}</div>
                    <div style={{ fontSize: "1.02rem", color: "#666" }}>{selectedEmployee.projectName}</div>
                    <div style={{ fontSize: "0.99rem", color: "#9c8dbb" }}>
                      Goals:&nbsp;
                      <b>{selectedEmployee.goals?.length || 0}</b>
                    </div>
                  </div>
                </div>
                {/* Ratings Card */}
                <div style={{
                  flex: '1 1 220px',
                  background: '#fff',
                  borderRadius: '14px',
                  boxShadow: '0 2px 7px #c1b6dd26',
                  marginBottom: '20px',
                  padding: '18px 24px',
                   border: "1px solid #27235c",
                  minWidth: '180px',
                  minHeight: "170px",  // or use height: "170px" if you want them strictly equal

                }}>
                  <h5 style={{
                    margin: 0,
                    fontWeight: 700,
                    color: '#27235c',
                    fontSize: "1.09rem"
                  }}>
                    Average Ratings
                  </h5>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>Employee</span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#97247e",
                        marginLeft: 9
                      }}>{getAvgRating(selectedEmployee.competencies, "employeeRating")}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>L1</span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#6666B2",
                        marginLeft: 27
                      }}>{getAvgRating(selectedEmployee.competencies, "l1Rating")}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 13, color: "#a1a2c0" }}>L2</span>
                      <span style={{
                        fontSize: 19,
                        fontWeight: 700,
                        color: "#3CA36E",
                        marginLeft: 26
                      }}>{getAvgRating(selectedEmployee.competencies, "l2Rating")}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Competencies Section */}
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
                  <table className="dp-inner-table" style={{ width: '100%', borderCollapse: 'collapse', }}>
                    <thead >
                      <tr style={{
                        background: '#f7f8fc',
                        color: '#4c426a'
                      }}>
                        <th>Competency</th>
                        <th>Emp Rating</th>
                        <th>Emp Comments</th>
                        <th>L1 Reviewer</th>
                        <th>L1 Rating</th>
                        <th>L1 Comments</th>
                        <th>L2 Reviewer</th>
                        <th>L2 Rating</th>
                        <th>L2 Comments</th>
                        <th>Status</th>
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
              {/* Goals Section */}
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
                    const avgProgress = getAvgChecklistProgress(goal.goalChecklists);
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
                            <h5 className="dp-goal-title" style={{ fontWeight: 600, fontSize: '1.01rem', margin: 0 }}>{goal.goalTitle}</h5>
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
                            <span className="dp-progress-value">{avgProgress}%</span>
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
                              width: `${avgProgress}%`
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* Modal Footer */}
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
  

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="dp-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="dp-page">
      {/* Top bar with Breadcrumbs */}
      <div className="hrfcper-top-bar">
        <nav className="hrfcper-breadcrumb-nav" aria-label="breadcrumb">
          <ol className="hrfcper-breadcrumb">
            <li className="hrfcper-breadcrumb-item">
             
              <Link to="/hr/dashboard"> <i className="bi bi-house-door"></i></Link>
            </li>
            
            <li className="hrfcper-breadcrumb-item active" aria-current="page">
              Department Head Dashboard
            </li>
          </ol>
        </nav>
        <div />
      </div>

      {/* Page Header */}
      <div className="dp-page-header">
        <div className="dp-header-content">
          <div className="dp-header-text"></div>
        </div>
      </div>

         {/* Stats Cards */}
 {/* Stats Cards - Matching reference design */}
<div style={{ 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
  gap: "1rem", 
  marginBottom: "1.5rem" 
}}>
  <div style={{
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #27235c", 
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
  }}
  >
    <div style={{
      width: "60px",
      height: "60px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.5rem",
      color: "white",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}>
      <i className="bi bi-hourglass-split"></i>
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{
        margin: 0,
        fontSize: "2rem",
        fontWeight: 700,
        color: "#212529",
        lineHeight: 1,
        marginBottom: "0.25rem"
      }}>{pendingRequests.length}</h3>
      <p style={{
        margin: 0,
        color: "#6c757d",
        fontSize: "0.875rem"
      }}>Pending Approvals</p>
    </div>
  </div>

  {/* Add more stat cards here with different gradient colors */}
  <div style={{
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid #27235c", 
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
  }}
  >
    <div style={{
      width: "60px",
      height: "60px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.5rem",
      color: "white",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    }}>
      <i className="bi bi-check-circle"></i>
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{
        margin: 0,
        fontSize: "2rem",
        fontWeight: 700,
        color: "#212529",
        lineHeight: 1,
        marginBottom: "0.25rem"
      }}>24</h3>
      <p style={{
        margin: 0,
        color: "#6c757d",
        fontSize: "0.875rem"
      }}>Approved</p>
    </div>
  </div>
</div>



<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    background: "#27235C",
    borderRadius: 30,
    padding: "3px 6px",
    gap: 3,
    border: "3px solid #27235C",
    width: "fit-content",
    margin: "16px 0 20px 0",
    boxShadow: "0 1.5px 8px 0 rgba(39,35,92,0.03)",
  }}
>
  <button
    style={{
      padding: "8px 22px",
      background: activeTab === "pending" ? "#fff" : "transparent",
      color: activeTab === "pending" ? "#27235C" : "#fff",
      border: "none",
      borderRadius: 30,
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      minWidth: 80,
      transition: "all 0.18s cubic-bezier(.82,.75,.11,1.36)",
      outline: "none",
      boxShadow:
        activeTab === "pending"
          ? "0 2px 8px 0 rgb(39 35 92 / 7%)"
          : "none",
    }}
    onClick={() => setActiveTab("pending")}
  >
    Pending
  </button>
  <button
    style={{
      padding: "8px 22px",
      background: activeTab === "approved" ? "#fff" : "transparent",
      color: activeTab === "approved" ? "#27235C" : "#fff",
      border: "none",
      borderRadius: 30,
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      minWidth: 80,
      transition: "all 0.18s cubic-bezier(.82,.75,.11,1.36)",
      outline: "none",
      boxShadow:
        activeTab === "approved"
          ? "0 2px 8px 0 rgb(39 35 92 / 7%)"
          : "none",
    }}
    onClick={() => setActiveTab("approved")}
  >
    Approved
  </button>
</div>


      {/* Filters */}
      <div className="dp-filters-card">
        <div className="dp-filters-content">
          <div className="dp-filters-left">
            <div className="dp-search-box">
              <i className="bi bi-search dp-search-icon"></i>
              <input
                type="text"
                className="dp-search-input"
                placeholder="Search employee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select className="dp-filter-select" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {getUniqueProjects().map((project, idx) => (
                <option key={idx} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

   

      {/* Table */}
    {/* Table */}
<div className="dp-table-card">
  <div className="dp-table-wrapper">
    {activeTab === "pending" ? (
      <table className="dp-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Project</th>
            <th>Avg Emp Rating</th>
            <th>Avg L1 Rating</th>
            <th>Avg L2 Rating</th>
            <th>Goals</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {getPaginatedData().length === 0 ? (
            <tr>
              <td colSpan={7} className="dp-empty-state">
                <i className="bi bi-inbox"></i>
                <p>No pending approvals found</p>
              </td>
            </tr>
          ) : (
            getPaginatedData().map((emp) => (
              <React.Fragment key={emp.assessmentId || emp.employeeId}>
                <tr>
                  <td>
                    <div className="dp-user-info">
                      <div className="dp-user-avatar">{getInitials(emp.employeeName)}</div>
                      <div>
                        <span className="dp-user-name">{emp.employeeName}</span>
                        {emp.employeeCompanyId
                          ? <small className="dp-user-id">@{emp.employeeCompanyId}</small>
                          : null}
                      </div>
                    </div>
                  </td>
                  <td>{emp.projectName}</td>
                  <td>
                    <span className="dp-rating-badge emp-rating">{getAvgRating(emp.competencies, "employeeRating")}</span>
                  </td>
                  <td>
                    <span className="dp-rating-badge l1-rating">{getAvgRating(emp.competencies, "l1Rating")}</span>
                  </td>
                  <td>
                    <span className="dp-rating-badge l2-rating">{getAvgRating(emp.competencies, "l2Rating")}</span>
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
      // Leave your APPROVED tab table code as is, do not touch!
      <table className="dp-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Project</th>
            <th>Approved At</th>
          </tr>
        </thead>
        <tbody>
          {getPaginatedData().length === 0 ? (
            <tr>
              <td colSpan={5} className="dp-empty-state">
                <i className="bi bi-inbox"></i>
                <p>No approved employees found</p>
              </td>
            </tr>
          ) : (
            getPaginatedData().map((emp) => (
              <React.Fragment key={emp.assessmentId || emp.employeeId}>
                <tr>
                  <td>
                    <div className="dp-user-info">
                      <div className="dp-user-avatar">{getInitials(emp.employeeName)}</div>
                      <div>
                        <span className="dp-user-name">{emp.employeeName}</span>
                        {emp.employeeCompanyId
                          ? <small className="dp-user-id">@{emp.employeeCompanyId}</small>
                          : null}
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
  {/* Pagination - keep your existing pagination code */}
  {filteredData.length > 0 && (
    <div className="dp-pagination-container">
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
              className={`dp-page-item ${page === currentPage ? "active" : ""} ${
                typeof page !== "number" ? "disabled" : ""
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


      {/* Modals */}
      {renderApproveModal()}
      {renderDetailsModal()}
    </div>
  );
}













