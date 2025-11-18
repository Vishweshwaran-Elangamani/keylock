import React, { useState, useEffect } from "react";
import * as api from "../../../services/performancemanagement/hr/api"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

function HRNominations() {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [selectedNominationDetails, setSelectedNominationDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);


  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "approve" or "reject"
  const [actionNominationId, setActionNominationId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");

  const [statistics, setStatistics] = useState({
    totalNominations: 0,
    pendingNominations: 0,
    approvedNominations: 0,
    rejectedNominations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);


  const THEME = {
    primary: "#4C3F8F", // Dark Purple
    secondary: "#2D5B8C", // Dark Blue
    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#1A202C",
    textLight: "#718096",
    border: "#E2E8F0",
    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
  };

  const itemsPerPage = 10;

  useEffect(() => {
    fetchNominations();
    fetchStatistics();
    setCurrentPage(1);
  }, [activeTab]);

const fetchStatistics = async () => {
  try {
    setStatsLoading(true);
    const { data } = await api.getStatistics();  // Use 'api' instead of 'hrNominationApi'
    if (data.success) {
      setStatistics(data.data);
    }
  } catch (error) {
    console.error("Error fetching statistics:", error);
  } finally {
    setStatsLoading(false);
  }
};


  const groupApprovedProfiles = (profiles) => {
    const grouped = {};
    profiles.forEach((profile) => {
      const key = `${profile.opportunity.opportunityName}-${profile.opportunity.rewardType}`;
      if (!grouped[key]) {
        grouped[key] = {
          opportunityId: profile.nominationId,
          opportunityName: profile.opportunity.opportunityName,
          opportunityDeadline: profile.submittedAt,
          rewardType: {
            rewardTypeId: 0,
            rewardName: profile.opportunity.rewardType,
            rewardCategory: profile.opportunity.rewardCategory,
          },
          nominationCount: 0,
          nominations: [],
        };
      }
      grouped[key].nominations.push({
        nominationId: profile.nominationId,
        nomineeName: `${profile.nominee.firstName} ${profile.nominee.lastName}`,
        nomineeEmail: profile.nominee.employeeId,
        nomineeDepartmentName: profile.nominee.departmentName,
        managerName: "HR Review",
        justification: profile.justification,
        submittedAt: profile.submittedAt,
        reviewedAt: profile.reviewedAt,
        status: activeTab,
      });
      grouped[key].nominationCount = grouped[key].nominations.length;
    });
    return Object.values(grouped);
  };

  const fetchNominations = async () => {
    try {
      setLoading(true);
      let data = null;

      if (activeTab === "Pending") {
        const res = await api.getAllManagerNominations();
        data = res.data;
      } else if (activeTab === "Approved") {
        const res = await api.getApprovedProfiles();
        data = {
          success: res.data.success,
          data: groupApprovedProfiles(res.data.data),
          message: res.data.message,
        };
      } else {
        const res = await api.getRejectedProfiles();
        data = {
          success: res.data.success,
          data: groupApprovedProfiles(res.data.data),
          message: res.data.message,
        };
      }

      if (data.success) {
        setNominations(data.data);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
      toast.error("Failed to load nominations");
    } finally {
      setLoading(false);
    }
  };

  const filterNominationsByStatus = (status) => {
    return nominations
      .map((opp) => ({
        ...opp,
        nominations: opp.nominations.filter((nom) => nom.status === status),
      }))
      .filter((opp) => opp.nominations.length > 0);
  };

  const filteredNominations = filterNominationsByStatus(activeTab);
  const allNominations = filteredNominations.flatMap((opp) => opp.nominations);
  const totalPages = Math.ceil(allNominations.length / itemsPerPage);
  const paginatedNominations = allNominations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

 
  const openApproveModal = (nominationId) => {
    setActionType("approve");
    setActionNominationId(nominationId);
    setActionRemarks("");
    setShowActionModal(true);
  };

  //  Open Modal for Reject
  const openRejectModal = (nominationId) => {
    setActionType("reject");
    setActionNominationId(nominationId);
    setActionRemarks("");
    setShowActionModal(true);
  };

  //  Submit Action

  const submitAction = async () => {
  if (!actionRemarks.trim()) {
    toast.warning("Please enter remarks");
    return;
  }

  try {
    if (actionType === "approve") {
      const payload = {
        selectedNominationIds: [actionNominationId],
        hrUserId: 1,
        approvalRemarks: actionRemarks,
        rejectionRemarks: "Not selected in final round",
      };

      const { data } = await api.approveNominations(payload);

      if (data.success) {
        toast.success(`✓ Nomination approved successfully!`);
        setShowActionModal(false);
        setActionRemarks("");
        fetchNominations();
        fetchStatistics();
      }
    } else {
      // ✅ FIXED: Changed from rejectNominationsOnly to rejectNominations
      const { data } = await api.rejectNominations({
        selectedNominationIds: [actionNominationId],
        hrUserId: 1,
        rejectionRemarks: actionRemarks,
      });

      if (data.success) {
        toast.success(`✓ Nomination rejected successfully!`);
        setShowActionModal(false);
        setActionRemarks("");
        fetchNominations();
        fetchStatistics();
      }
    }
  } catch (error) {
    console.error("Error submitting action:", error);
    toast.error("Error: " + (error.response?.data?.message || error.message));
  }
};


  const viewDetails = async (nominationId) => {
    try {
      setDetailsLoading(true);
      const { data } = await api.getNominationDetails(nominationId);
      if (data.success) {
        setSelectedNominationDetails(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error viewing details:", error);
      toast.error("Failed to load nomination details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const StatCard = ({ title, value }) => (
    <div className="col-md-3 mb-4">
      <div
        className="card border-0 shadow-sm"
        style={{
          height: "100%",
          background: THEME.card,
          borderTop: `4px solid ${THEME.primary}`,
        }}
      >
        <div className="card-body text-center">
          <h3 className="mb-2" style={{ fontSize: "32px", fontWeight: "700", color: THEME.primary }}>
            {value}
          </h3>
          <p className="mb-0" style={{ fontSize: "14px", color: THEME.textLight, fontWeight: "500" }}>
            {title}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", background: THEME.background }}
      >
        <div className="text-center">
          <div className="spinner-border mb-3" role="status" style={{ color: THEME.primary }}></div>
          <p className="text-muted">Loading nominations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: THEME.background, minHeight: "100vh", paddingTop: "20px", paddingBottom: "40px" }}>
      {/*  Toastr Container */}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <h1 className="display-5 fw-bold" style={{ color: THEME.primary, marginBottom: "8px" }}>
            Nomination Management
          </h1>
          <p style={{ color: THEME.textLight, marginBottom: 0 }}>
            Review and manage all nomination submissions
          </p>
        </div>

        {/* Statistics */}
        {statsLoading ? (
          <div className="text-center mb-4">
            <div className="spinner-border spinner-border-sm" role="status"></div>
          </div>
        ) : (
          <div className="row mb-4">
            <StatCard title="Total Nominations" value={statistics.totalNominations} />
            <StatCard title="Pending" value={statistics.pendingNominations} />
            <StatCard title="Approved" value={statistics.approvedNominations} />
            <StatCard title="Rejected" value={statistics.rejectedNominations} />
          </div>
        )}

        {/* Tabs & Controls */}
        <div className="card border-0 shadow-sm mb-4" style={{ background: THEME.card }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <ul className="nav nav-pills" role="tablist">
                {["Pending", "Approved", "Rejected"].map((tab) => (
                  <li className="nav-item" key={tab}>
                    <button
                      className={`nav-link ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: activeTab === tab ? THEME.primary : "transparent",
                        color: activeTab === tab ? "#fff" : THEME.textLight,
                        border: "none",
                        fontWeight: "600",
                      }}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="btn-group" role="group">
                <button
                  className="btn btn-sm"
                  onClick={() => setViewMode("table")}
                  style={{
                    background: viewMode === "table" ? THEME.primary : THEME.background,
                    color: viewMode === "table" ? "#fff" : THEME.text,
                    border: `1px solid ${THEME.border}`,
                    fontWeight: "600",
                  }}
                >
                  Table
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setViewMode("grid")}
                  style={{
                    background: viewMode === "grid" ? THEME.primary : THEME.background,
                    color: viewMode === "grid" ? "#fff" : THEME.text,
                    border: `1px solid ${THEME.border}`,
                    fontWeight: "600",
                  }}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredNominations.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5" style={{ background: THEME.card }}>
            <div className="card-body">
              <h5 className="text-dark" style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                No {activeTab.toLowerCase()} nominations
              </h5>
              <p style={{ fontSize: "14px", marginBottom: 0, color: THEME.textLight }}>
                Check back later or switch to another tab
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div className="card border-0 shadow-sm mb-4" style={{ background: THEME.card }}>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: THEME.background, borderBottom: `2px solid ${THEME.border}` }}>
                    <tr>
                      <th style={{ fontWeight: "600", color: THEME.primary }}>Nominee</th>
                      <th style={{ fontWeight: "600", color: THEME.primary }}>Department</th>
                      <th style={{ fontWeight: "600", color: THEME.primary }}>Submitted Date</th>
                      <th
                        width={activeTab === "Pending" ? "200" : "100"}
                        className="text-center"
                        style={{ fontWeight: "600", color: THEME.primary }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNominations.map((nomination) => (
                      <tr
                        key={nomination.nominationId}
                        style={{
                          borderBottom: `1px solid ${THEME.border}`,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: "600", color: THEME.text, fontSize: "14px" }}>
                            {nomination.nomineeName}
                          </div>
                          <div style={{ color: THEME.textLight, fontSize: "12px", marginTop: "4px" }}>
                            {nomination.nomineeEmail}
                          </div>
                        </td>
                        <td style={{ color: THEME.text, fontSize: "14px", verticalAlign: "middle" }}>
                          {nomination.nomineeDepartmentName}
                        </td>
                        <td style={{ color: THEME.textLight, fontSize: "14px", verticalAlign: "middle" }}>
                          {new Date(nomination.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="text-center" style={{ verticalAlign: "middle" }}>
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              className="btn btn-sm"
                              style={{
                                background: THEME.primary,
                                color: "#fff",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "11px",
                                padding: "4px 8px",
                              }}
                              onClick={() => viewDetails(nomination.nominationId)}
                              title="View Details"
                            >
                              View
                            </button>
                            {activeTab === "Pending" && (
                              <>
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    background: THEME.success,
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                  }}
                                  onClick={() => openApproveModal(nomination.nominationId)}
                                  title="Approve Nomination"
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    background: THEME.danger,
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                  }}
                                  onClick={() => openRejectModal(nomination.nominationId)}
                                  title="Reject Nomination"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{ color: THEME.primary }}
                    >
                      First
                    </button>
                  </li>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage - 2 + i > 0 ? currentPage - 2 + i : 1;
                    return pageNum <= totalPages ? (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            background: currentPage === pageNum ? THEME.primary : "transparent",
                            color: currentPage === pageNum ? "#fff" : THEME.primary,
                            border: `1px solid ${THEME.border}`,
                          }}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ) : null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{ color: THEME.primary }}
                    >
                      Last
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        ) : (
          <>
            {/* Grid View */}
            <div className="row g-4 mb-4">
              {paginatedNominations.map((nomination) => (
                <div key={nomination.nominationId} className="col-md-6 col-lg-4">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{
                      background: THEME.card,
                      borderTop: `3px solid ${THEME.primary}`,
                    }}
                  >
                    <div className="card-body">
                      <div className="mb-3">
                        <h6 className="card-title mb-1" style={{ color: THEME.text, fontWeight: "600" }}>
                          {nomination.nomineeName}
                        </h6>
                        <small style={{ fontSize: "12px", color: THEME.textLight }}>
                          ID: {nomination.nomineeEmail}
                        </small>
                      </div>
                      <p className="mb-2" style={{ fontSize: "13px" }}>
                        <span style={{ color: THEME.textLight }}>Department:</span>
                        <br />
                        <span style={{ color: THEME.text, fontWeight: "500" }}>
                          {nomination.nomineeDepartmentName}
                        </span>
                      </p>
                      <p className="mb-3" style={{ fontSize: "13px" }}>
                        <span style={{ color: THEME.textLight }}>Submitted:</span>
                        <br />
                        <span style={{ color: THEME.text }}>
                          {new Date(nomination.submittedAt).toLocaleDateString()}
                        </span>
                      </p>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm flex-grow-1"
                          style={{
                            background: THEME.primary,
                            color: "#fff",
                            border: "none",
                            fontWeight: "600",
                          }}
                          onClick={() => viewDetails(nomination.nominationId)}
                        >
                          View
                        </button>
                        {activeTab === "Pending" && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: THEME.success,
                                color: "#fff",
                                border: "none",
                                fontWeight: "600",
                                padding: "6px 10px",
                              }}
                              onClick={() => openApproveModal(nomination.nominationId)}
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: THEME.danger,
                                color: "#fff",
                                border: "none",
                                fontWeight: "600",
                                padding: "6px 10px",
                              }}
                              onClick={() => openRejectModal(nomination.nominationId)}
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{ color: THEME.primary }}
                    >
                      First
                    </button>
                  </li>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage - 2 + i > 0 ? currentPage - 2 + i : 1;
                    return pageNum <= totalPages ? (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            background: currentPage === pageNum ? THEME.primary : "transparent",
                            color: currentPage === pageNum ? "#fff" : THEME.primary,
                          }}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ) : null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{ color: THEME.primary }}
                    >
                      Last
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

      {/*  Modal for Approve/Reject Action */}
      {showActionModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
            }}
            onClick={() => setShowActionModal(false)}
          ></div>

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1050,
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <div className="card border-0 shadow-lg" style={{ background: THEME.card }}>
              <div
                className="card-header"
                style={{
                  background: THEME.primary,
                  color: "#fff",
                  borderBottom: "none",
                  padding: "16px 20px",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0" style={{ fontWeight: "600" }}>
                    {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowActionModal(false)}
                  ></button>
                </div>
              </div>
              <div className="card-body" style={{ padding: "20px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  {actionType === "approve"
                    ? "Enter approval justification:"
                    : "Enter rejection reason:"}
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Why are you approving this nomination?"
                      : "Why are you rejecting this nomination?"
                  }
                  style={{ fontSize: "14px", borderColor: THEME.border }}
                ></textarea>
              </div>
              <div
                className="card-footer"
                style={{
                  background: THEME.background,
                  borderTop: `1px solid ${THEME.border}`,
                  padding: "12px 20px",
                }}
              >
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowActionModal(false)}
                    style={{
                      background: "transparent",
                      color: THEME.text,
                      border: `1px solid ${THEME.border}`,
                      fontWeight: "600",
                      padding: "6px 16px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={submitAction}
                    style={{
                      background: actionType === "approve" ? THEME.success : THEME.danger,
                      color: "#fff",
                      border: "none",
                      fontWeight: "600",
                      padding: "6px 16px",
                    }}
                  >
                    {actionType === "approve" ? "✓ Approve" : "✗ Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for Details */}
     {/*  UPDATED: Modal for Details with Parameters */}
<div
  className={`modal fade ${showModal ? "show" : ""}`}
  style={{
    display: showModal ? "block" : "none",
    backgroundColor: "rgba(0,0,0,0.5)",
  }}
  tabIndex="-1"
>
  <div className="modal-dialog modal-lg">
    <div className="modal-content border-0 shadow-lg" style={{ background: THEME.card }}>
      <div
        className="modal-header"
        style={{
          background: THEME.primary,
          color: "#fff",
          borderBottom: "none",
          paddingBottom: "24px",
        }}
      >
        <h5 className="modal-title" style={{ fontWeight: "600", fontSize: "18px" }}>
          Nomination Details
        </h5>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={() => setShowModal(false)}
        ></button>
      </div>
      <div className="modal-body" style={{ paddingTop: "24px" }}>
        {detailsLoading ? (
          <div className="text-center">
            <div className="spinner-border" role="status" style={{ color: THEME.primary }}></div>
            <p className="text-muted mt-2">Loading details...</p>
          </div>
        ) : selectedNominationDetails ? (
          <div>
            {/* Basic Details */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px",
                  }}
                >
                  NOMINEE NAME
                </label>
                <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                  {selectedNominationDetails.nomineeName ||
                    (selectedNominationDetails.nominee?.firstName
                      ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                      : "N/A")}
                </p>
              </div>
              <div className="col-md-6">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px",
                  }}
                >
                  EMPLOYEE ID
                </label>
                <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                  {selectedNominationDetails.nomineeEmployeeId ||
                    selectedNominationDetails.nominee?.employeeId ||
                    "N/A"}
                </p>
              </div>
            </div>

            <div className="row mb-4">

              <div className="col-md-6">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px",
                  }}
                >
                  OPPORTUNITY
                </label>
                <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                  {selectedNominationDetails.opportunityName ||
                    selectedNominationDetails.opportunity?.opportunityName ||
                    "N/A"}
                </p>
              </div>
            </div>

            {/* Justification */}
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: THEME.textLight,
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                JUSTIFICATION
              </label>
              <div
                style={{
                  background: THEME.background,
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: THEME.text,
                  minHeight: "80px",
                }}
              >
                {selectedNominationDetails.justification || "No justification provided"}
              </div>
            </div>

            {/*  NEW: Parameter Values Section */}
            {selectedNominationDetails.parameterValues &&
              selectedNominationDetails.parameterValues.length > 0 && (
                <div className="mb-4">
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: THEME.textLight,
                      marginBottom: "12px",
                      display: "block",
                    }}
                  >
                    NOMINATION PARAMETERS
                  </label>
                  <div
                    style={{
                      background: THEME.background,
                      padding: "16px",
                      borderRadius: "6px",
                      border: `1px solid ${THEME.border}`,
                    }}
                  >
                    {selectedNominationDetails.parameterValues.map((param, index) => (
                      <div
                        key={param.parameterId || index}
                        style={{
                          marginBottom:
                            index < selectedNominationDetails.parameterValues.length - 1 ? "16px" : "0",
                          paddingBottom:
                            index < selectedNominationDetails.parameterValues.length - 1 ? "16px" : "0",
                          borderBottom:
                            index < selectedNominationDetails.parameterValues.length - 1
                              ? `1px solid ${THEME.border}`
                              : "none",
                        }}
                      >
                        <div className="row">
                          <div className="col-md-5">
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: THEME.text,
                                margin: 0,
                              }}
                            >
                              {param.parameterName}
                              {param.isRequired && (
                                <span style={{ color: THEME.danger, marginLeft: "4px" }}>*</span>
                              )}
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                color: THEME.textLight,
                                margin: "4px 0 0 0",
                              }}
                            >
                              Type: {param.parameterType}
                            </p>
                          </div>
                          <div className="col-md-7">
                            <div
                              style={{
                                background: THEME.card,
                                padding: "8px 12px",
                                borderRadius: "4px",
                                border: `1px solid ${THEME.border}`,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: THEME.text,
                                  margin: 0,
                                  fontWeight: "500",
                                }}
                              >
                                {param.parameterType === "Rating" && (
                                  <span>
                                    {"⭐".repeat(parseInt(param.parameterValue) || 0)}{" "}
                                    <span style={{ color: THEME.textLight }}>
                                      ({param.parameterValue}/5)
                                    </span>
                                  </span>
                                )}
                                {param.parameterType !== "Rating" && param.parameterValue}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Submission Details */}
            <div className="row">
              <div className="col-md-6">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: THEME.textLight,
                    marginBottom: "8px",
                  }}
                >
                  SUBMITTED DATE
                </label>
                <p style={{ fontSize: "14px", color: THEME.text, fontWeight: "500", margin: 0 }}>
                  {selectedNominationDetails.submittedAt
                    ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

            </div>
          </div>
        ) : (
          <p className="text-center text-muted">No details available</p>
        )}
      </div>
      <div className="modal-footer" style={{ borderTop: `1px solid ${THEME.border}` }}>
        <button
          type="button"
          className="btn"
          onClick={() => setShowModal(false)}
          style={{
            background: THEME.primary,
            color: "#fff",
            fontWeight: "600",
            border: "none",
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>

    </div>
  );
}

export default HRNominations;
