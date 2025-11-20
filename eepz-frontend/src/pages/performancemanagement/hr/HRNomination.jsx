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
  const [actionType, setActionType] = useState("");
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
    primary: "#4C3F8F",
    secondary: "#2D5B8C",
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
      const { data } = await api.getStatistics();
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

  const openRejectModal = (nominationId) => {
    setActionType("reject");
    setActionNominationId(nominationId);
    setActionRemarks("");
    setShowActionModal(true);
  };

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
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container-fluid">
        <div className="mb-4">
          <h1 className="display-5 fw-bold" style={{ color: THEME.primary, marginBottom: "8px" }}>
            Nomination Management
          </h1>
          <p style={{ color: THEME.textLight, marginBottom: 0 }}>
            Review and manage all nomination submissions
          </p>
        </div>

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

      {/* ACTION MODAL - THEMED */}
      {showActionModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(39, 35, 92, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 1040,
              textAlign:"left",
            }}
            onClick={() => setShowActionModal(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1050,
              width: "95vw",
              maxWidth: 420,
              textAlign:"left",
            }}
          >
            <div
              style={{
                borderRadius: "0.75rem",
                overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.26)",
                border: "none",
                background: "#fff",
                textAlign:"left",
              }}
            >
              <div
                style={{
                  background: "#27235C",
                  color: "#fff",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign:"left",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 17 }}>
                  {actionType === "approve" ? "Approval Remarks" : "Rejection Reason"}
                </div>
                <button
                  onClick={() => setShowActionModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: 24,
                    padding: "0 6px",
                    cursor: "pointer",
                    textAlign:"left",
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div style={{ padding: 20, background: "#FFF" }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "block",
                    textAlign:"left",
                  }}
                >
                  {actionType === "approve" ? "Enter approval justification:" : "Enter rejection reason:"}
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Why are you approving this nomination?"
                      : "Why are you rejecting this nomination?"
                  }
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "10px",
                    fontSize: 13,
                    marginBottom: 4,
                    minHeight: 90,
                    resize: "vertical",
                    textAlign:"left",
                  }}
                />
              </div>
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  background: "#FFF",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  padding: "14px 20px",
                  textAlign:"left",
                }}
              >
                <button
                  onClick={() => setShowActionModal(false)}
                  style={{
                    background: "#6c757d",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    padding: "8px 20px",
                    fontSize: 13,
                    borderRadius: 6,
                    marginRight: 2,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  style={{
                    background:
                      actionType === "approve"
                        ? "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
                        : "linear-gradient(90deg, #E01950 0%, #97247E 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "8px 20px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.18)",
                    textAlign:"left",
                  }}
                >
                  {actionType === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DETAILS MODAL - THEMED */}
      {showModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(39, 35, 92, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 1040,
              textAlign:"left",
            }}
            onClick={() => setShowModal(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1050,
              width: "97vw",
              maxWidth: 760,
              textAlign:"left",
            }}

          >
            <div
              style={{
                borderRadius: "0.85rem",
                overflow: "hidden",
                boxShadow: "0 10px 42px rgba(39,35,92,0.20)",
                border: "none",
                background: "#fff",
                textAlign:"left",
              }}
            >
              <div
                style={{
                  background: "#27235C",
                  color: "#fff",
                  padding: "20px 28px 16px 28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign:"left",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 19 }}>Nomination Details</div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: 25,
                    padding: "0 6px",
                    cursor: "pointer",
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  background: "#fff",
                  padding: "26px 28px 18px 28px",
                  overflowY: "auto",
                  maxHeight: "calc(92vh - 140px)",
                }}
              >
                {detailsLoading ? (
                  <div style={{ textAlign: "left", padding: "38px 0", color: "#6b7280" }}>
                    <div
                      style={{
                        border: "3px solid #f3f4f6",
                        borderTop: "3px solid #27235C",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        margin: "0 auto 16px",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Loading details...
                  </div>
                ) : selectedNominationDetails ? (
                  <div>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textLight, marginBottom: 8 }}>
                          NOMINEE NAME
                        </label>
                        <p style={{ fontSize: 14, color: THEME.text, fontWeight: 500, margin: 0 }}>
                          {selectedNominationDetails.nomineeName ||
                            (selectedNominationDetails.nominee?.firstName
                              ? `${selectedNominationDetails.nominee.firstName} ${selectedNominationDetails.nominee.lastName}`
                              : "N/A")}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textLight, marginBottom: 8 }}>
                          EMPLOYEE ID
                        </label>
                        <p style={{ fontSize: 14, color: THEME.text, fontWeight: 500, margin: 0 }}>
                          {selectedNominationDetails.nomineeEmployeeId ||
                            selectedNominationDetails.nominee?.employeeId ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textLight, marginBottom: 8 }}>
                          OPPORTUNITY
                        </label>
                        <p style={{ fontSize: 14, color: THEME.text, fontWeight: 500, margin: 0 }}>
                          {selectedNominationDetails.opportunityName ||
                            selectedNominationDetails.opportunity?.opportunityName ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: THEME.textLight,
                          marginBottom: 8,
                          display: "block",
                        }}
                      >
                        JUSTIFICATION
                      </label>
                      <div
                        style={{
                          background: THEME.background,
                          padding: 12,
                          borderRadius: 6,
                          fontSize: 14,
                          color: THEME.text,
                          minHeight: 80,
                        }}
                      >
                        {selectedNominationDetails.justification || "No justification provided"}
                      </div>
                    </div>

                    {selectedNominationDetails.parameterValues &&
                      selectedNominationDetails.parameterValues.length > 0 && (
                        <div className="mb-4">
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: THEME.textLight,
                              marginBottom: 12,
                              display: "block",
                            }}
                          >
                            NOMINATION PARAMETERS
                          </label>
                          <div
                            style={{
                              background: THEME.background,
                              padding: 16,
                              borderRadius: 6,
                              border: `1px solid ${THEME.border}`,
                            }}
                          >
                            {selectedNominationDetails.parameterValues.map((param, index) => (
                              <div
                                key={param.parameterId || index}
                                style={{
                                  marginBottom:
                                    index < selectedNominationDetails.parameterValues.length - 1 ? 16 : 0,
                                  paddingBottom:
                                    index < selectedNominationDetails.parameterValues.length - 1 ? 16 : 0,
                                  borderBottom:
                                    index < selectedNominationDetails.parameterValues.length - 1
                                      ? `1px solid ${THEME.border}`
                                      : "none",
                                }}
                              >
                                <div className="row">
                                  <div className="col-md-5">
                                    <p style={{ fontSize: 13, fontWeight: 600, color: THEME.text, margin: 0 }}>
                                      {param.parameterName}
                                      {param.isRequired && (
                                        <span style={{ color: THEME.danger, marginLeft: 4 }}>*</span>
                                      )}
                                    </p>
                                    <p style={{ fontSize: 11, color: THEME.textLight, margin: "4px 0 0 0" }}>
                                      Type: {param.parameterType}
                                    </p>
                                  </div>
                                  <div className="col-md-7">
                                    <div
                                      style={{
                                        background: THEME.card,
                                        padding: "8px 12px",
                                        borderRadius: 4,
                                        border: `1px solid ${THEME.border}`,
                                      }}
                                    >
                                      <p style={{ fontSize: 14, color: THEME.text, margin: 0, fontWeight: 500 }}>
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

                    <div className="row">
                      <div className="col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textLight, marginBottom: 8 }}>
                          SUBMITTED DATE
                        </label>
                        <p style={{ fontSize: 14, color: THEME.text, fontWeight: 500, margin: 0 }}>
                          {selectedNominationDetails.submittedAt
                            ? new Date(selectedNominationDetails.submittedAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ textAlign: "left", color: "#9ca3af", fontSize: 15, padding: "40px 0" }}>
                    No details available
                  </p>
                )}
              </div>
              <div
                style={{
                  background: "#F5F5F7",
                  borderTop: "1px solid #e5e7eb",
                  padding: "18px 28px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    border: "none",
                    fontSize: 15,
                    borderRadius: 8,
                    padding: "9px 34px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
                    textAlign:"left",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default HRNominations;
