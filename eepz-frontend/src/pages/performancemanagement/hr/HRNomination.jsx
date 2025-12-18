import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../../services/performancemanagement/api/nominationapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ViewDetailsModal from "../../../components/performance_management/modals/Hrnomination/ViewDetailsModal";
import ActionModal from "../../../components/performance_management/modals/Hrnomination/ActionModal";
import "../../../styles/performancemanagement/hr/Hrnomination.css";
import Breadcrumb from "../../../components/common/Breadcrumb";

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
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState({
    totalNominations: 0,
    pendingNominations: 0,
    approvedNominations: 0,
    rejectedNominations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);






  const THEME = {
    primary: "#27235c",
    secondary: "#2D5B8C",
    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#1A202C",
    textLight: "#718096",
    border: "#27235c",
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

  const statIcons = {
    "Total Nominations": "bi-bar-chart-fill",
    "Pending": "bi-hourglass-split",
    "Approved": "bi-check2-circle",
    "Rejected": "bi-x-circle",
  };

  const statColors = {
    "Total Nominations": "stat-icon-primary",
    "Pending": "stat-icon-warning",
    "Approved": "stat-icon-success",
    "Rejected": "stat-icon-danger",
  };

  const StatCard = ({ title, value }) => (
    <div className="ad-stat-card">
      <div className={`stat-icon ${statColors[title]}`}>
        <i className={`bi ${statIcons[title]}`}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-label">{title}</p>
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
    <div style={{ background: THEME.background, minHeight: "100vh", paddingTop: "16px", paddingBottom: "32px" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .status-tabs {
          background: #27235c;
          border-radius: 999px;
          display: flex;
          padding: 5px;
          border: 2px solid #27235c;
          width: fit-content;
        }
        .status-tab {
          background: transparent;
          color: #fff;
          font-weight: 700;
          border: none;
          outline: none;
          font-size: 0.95rem;
          border-radius: 999px;
          padding: 10px 28px;
          cursor: pointer;
          margin: 0;
          transition: background 0.15s, color 0.15s;
        }
        .status-tab.active {
          background: #fff;
          color: #27235c;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(39,35,92,0.08);
        }
      `}</style>

      <div className="container-fluid">
      <Breadcrumb
  items={[
    { label: "Dashboard", path: "/hr/dashboard" },
    { label: "Performance", path: "/hr/dashboard/performance" },
    { label: "Nominations", path: null }
  ]}
/>
 


        {statsLoading ? (
          <div className="text-center mb-3">
            <div className="spinner-border spinner-border-sm" role="status"></div>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-4 g-4 mb-3">
            <div className="col">
              <StatCard title="Total Nominations" value={statistics.totalNominations} />
            </div>
            <div className="col">
              <StatCard title="Pending" value={statistics.pendingNominations} />
            </div>
            <div className="col">
              <StatCard title="Approved" value={statistics.approvedNominations} />
            </div>
            <div className="col">
              <StatCard title="Rejected" value={statistics.rejectedNominations} />
            </div>
          </div>



        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.2rem 0 1rem 0",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div className="status-tabs">
            <button
              className={`status-tab${activeTab === "Pending" ? " active" : ""}`}
              onClick={() => setActiveTab("Pending")}
            >
              Pending
            </button>
            <button
              className={`status-tab${activeTab === "Approved" ? " active" : ""}`}
              onClick={() => setActiveTab("Approved")}
            >
              Approved
            </button>
            <button
              className={`status-tab${activeTab === "Rejected" ? " active" : ""}`}
              onClick={() => setActiveTab("Rejected")}
            >
              Rejected
            </button>
          </div>

          <div
            style={{
              display: "flex",
              border: "2px solid #27235c",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#fff",
              height: "36px",
            }}
          >

            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Grid View"
              style={{
                background: viewMode === "grid" ? "#27235c" : "#fff",
                color: viewMode === "grid" ? "#fff" : "#27235c",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                padding: "6px 20px",
                minWidth: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.12s",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: 18 }} />
            </button>

            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              aria-label="Table View"
              style={{
                background: viewMode === "table" ? "#27235c" : "#fff",
                color: viewMode === "table" ? "#fff" : "#27235c",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                padding: "6px 20px",
                minWidth: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.12s",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <i className="bi bi-table" style={{ fontSize: 18 }} />
            </button>

          </div>
        </div>

        {filteredNominations.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "2px solid #27235c",
              borderRadius: "10px",
              padding: "48px 20px",
              textAlign: "center",
            }}
          >
            <h5 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px", color: "#1A202C" }}>
              No {activeTab.toLowerCase()} nominations
            </h5>
            <p style={{ fontSize: "13px", marginBottom: 0, color: "#718096" }}>
              Check back later or switch to another tab
            </p>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div
              style={{
                background: "#fff",
                border: "2px solid #27235c",
                borderRadius: "10px",
                overflow: "hidden",
                marginBottom: "1.5rem",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
                <thead style={{ background: "#27235c" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "700",
                        color: "#fff",
                        padding: "12px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "left",
                      }}
                    >
                      Nominee
                    </th>
                    <th
                      style={{
                        fontWeight: "700",
                        color: "#fff",
                        padding: "12px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "left",
                      }}
                    >
                      Department
                    </th>
                    <th
                      style={{
                        fontWeight: "700",
                        color: "#fff",
                        padding: "12px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "left",
                      }}
                    >
                      Submitted Date
                    </th>
                    {activeTab === "Pending" && (
                      <th
                        style={{
                          fontWeight: "700",
                          color: "#fff",
                          padding: "12px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          textAlign: "center",
                        }}
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedNominations.map((nomination, index) => (
                    <tr
                      key={nomination.nominationId}
                      style={{
                        borderBottom: index < paginatedNominations.length - 1 ? "1px solid #e5e7eb" : "none",
                      }}
                    >
                      <td style={{ padding: "12px", verticalAlign: "middle", textAlign: "left" }}>
                        <div style={{ fontWeight: "600", color: "#1A202C", fontSize: "13px" }}>
                          {nomination.nomineeName}
                        </div>
                        <div style={{ color: "#718096", fontSize: "11px", marginTop: "2px" }}>
                          {nomination.nomineeEmail}
                        </div>
                      </td>
                      <td
                        style={{
                          color: "#1A202C",
                          fontSize: "13px",
                          verticalAlign: "middle",
                          padding: "12px",
                          fontWeight: "500",
                          textAlign: "left",
                        }}
                      >
                        {nomination.nomineeDepartmentName}
                      </td>
                      <td style={{ color: "#718096", fontSize: "13px", verticalAlign: "middle", padding: "12px", textAlign: "left" }}>
                        {new Date(nomination.submittedAt).toLocaleDateString()}
                      </td>
                      {activeTab === "Pending" && (
                        <td style={{ verticalAlign: "middle", padding: "12px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => viewDetails(nomination.nominationId)}
                              title="View"
                              style={{
                                padding: "6px 8px",
                                background: "#fff",
                                color: "#4a73e8",
                                border: "1.3px solid #4a73e8",
                                borderRadius: "6px",
                                fontSize: "15px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <i className="bi bi-eye" />
                            </button>
                            <button
                              onClick={() => openApproveModal(nomination.nominationId)}
                              title="Approve"
                              style={{
                                padding: "6px 8px",
                                background: "#fff",
                                color: "#10B981",
                                border: "1.3px solid #10B981",
                                borderRadius: "6px",
                                fontSize: "15px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                            <button
                              onClick={() => openRejectModal(nomination.nominationId)}
                              title="Reject"
                              style={{
                                padding: "6px 8px",
                                background: "#fff",
                                color: "#EF4444",
                                border: "1.3px solid #EF4444",
                                borderRadius: "6px",
                                fontSize: "15px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <i className="bi bi-x-circle" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{ color: "#27235c", fontWeight: "600", fontSize: "13px", padding: "6px 12px" }}
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
                            background: currentPage === pageNum ? "#27235c" : "transparent",
                            color: currentPage === pageNum ? "#fff" : "#27235c",
                            border: "1px solid #27235c",
                            fontWeight: "600",
                            fontSize: "13px",
                            padding: "6px 12px",
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
                      style={{ color: "#27235c", fontWeight: "600", fontSize: "13px", padding: "6px 12px" }}
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
            <div className="row g-2 mb-3">
              {paginatedNominations.map((nomination) => (
                <div key={nomination.nominationId} className="col-md-6 col-lg-4 col-xl-3">
                  <div
                    style={{
                      background: "#fff",
                      border: "1.5px solid #27235c",
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(39,35,92,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(39,35,92,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(39,35,92,0.06)";
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <h6 style={{ color: "#27235c", fontWeight: "700", fontSize: "13.5px", marginBottom: "2px" }}>
                        {nomination.nomineeName}
                      </h6>
                    </div>
                    <div style={{ background: "#f8f9fc", padding: "8px", borderRadius: "5px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "11px", marginBottom: "5px" }}>
                        <span style={{ color: "#718096", fontWeight: "600" }}>Dept:</span>
                        <br />
                        <span style={{ color: "#1A202C", fontWeight: "600", fontSize: "12px" }}>
                          {nomination.nomineeDepartmentName}
                        </span>
                      </p>
                      <p style={{ fontSize: "11px", margin: 0 }}>
                        <span style={{ color: "#718096", fontWeight: "600" }}>Submitted:</span>
                        <br />
                        <span style={{ color: "#1A202C", fontWeight: "500", fontSize: "11px" }}>
                          {new Date(nomination.submittedAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        style={{
                          flex: 1,
                          background: "#27235c",
                          color: "#fff",
                          border: "none",
                          fontWeight: "700",
                          fontSize: "11px",
                          padding: "7px",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                        onClick={() => viewDetails(nomination.nominationId)}
                      >
                        View
                      </button>
                      {activeTab === "Pending" && (
                        <>
                          <button
                            style={{
                              background: "#10B981",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              padding: "7px 10px",
                              fontSize: "13px",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                            onClick={() => openApproveModal(nomination.nominationId)}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            style={{
                              background: "#EF4444",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              padding: "7px 10px",
                              fontSize: "13px",
                              borderRadius: "5px",
                              cursor: "pointer",
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
                      style={{ color: "#27235c", fontWeight: "600", fontSize: "13px", padding: "6px 12px" }}
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
                            background: currentPage === pageNum ? "#27235c" : "transparent",
                            color: currentPage === pageNum ? "#fff" : "#27235c",
                            border: "1px solid #27235c",
                            fontWeight: "600",
                            fontSize: "13px",
                            padding: "6px 12px",
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
                      style={{ color: "#27235c", fontWeight: "600", fontSize: "13px", padding: "6px 12px" }}
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

      <ViewDetailsModal
        showModal={showModal}
        setShowModal={setShowModal}
        detailsLoading={detailsLoading}
        selectedNominationDetails={selectedNominationDetails}
        THEME={THEME}
      />

      <ActionModal
        show={showActionModal}
        onClose={() => setShowActionModal(false)}
        actionType={actionType}
        actionRemarks={actionRemarks}
        setActionRemarks={setActionRemarks}
        onSubmit={submitAction}
        THEME={THEME}
      />
    </div>
  );
}

export default HRNominations;
