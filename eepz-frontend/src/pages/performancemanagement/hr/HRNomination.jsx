import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import * as api from "../../../services/performancemanagement/hr/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ViewDetailsModal from "../../../components/performance_management/modals/Hrnomination/ViewDetailsModal";
import ActionModal from "../../../components/performance_management/modals/Hrnomination/ActionModal";
import "../../../styles/performancemanagement/hr/Hrnomination.css"

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

  const StatCard = ({ title, value }) => (
    <div className="col mb-3">
      <div
        style={{
          height: "100%",
          background: "#fff",
          border: "2px solid #27235c",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
          {title}
        </div>
        <div style={{ fontSize: "36px", fontWeight: "700", color: "#97247E", margin: 0 }}>
          {value}
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
      <style>{`
        .status-tabs {
          background: #27235c;
          border-radius: 999px;
          display: flex;
          padding: 7px;
          border: 3px solid #27235c;
          width: fit-content;
        }
        .status-tab {
          background: transparent;
          color: #fff;
          font-weight: 700;
          border: none;
          outline: none;
          font-size: 1.13rem;
          border-radius: 999px;
          padding: 13px 36px;
          cursor: pointer;
          margin: 0;
          transition: background 0.18s, color 0.18s;
        }
        .status-tab.active {
          background: #fff;
          color: #27235c;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(39,35,92,0.07);
        }
      `}</style>

      <div className="container-fluid">
        {/* BREADCRUMB */}
         <nav className="cg-breadcrumbs" aria-label="breadcrumb">
  <ol className="cg-breadcrumb">
    <li
      className="cg-breadcrumb-item"
      onClick={() => navigate("/hr/dashboard")}
      style={{ cursor: "pointer" }}>
      <i className="bi bi-house-door"></i>
    </li>
    <li
      className="cg-breadcrumb-item"
      onClick={() => navigate("/hr/dashboard/performance")}
      style={{ cursor: "pointer" }}>
      Performance
    </li>
    <li className="cg-breadcrumb-item active" aria-current="page">
      Nominations
    </li>
  </ol>
</nav>

        {/* STAT CARDS - ONLY 4 CARDS */}
        {statsLoading ? (
          <div className="text-center mb-4">
            <div className="spinner-border spinner-border-sm" role="status"></div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3 mb-4">
            <StatCard title="Total Nominations" value={statistics.totalNominations} />
            <StatCard title="Pending" value={statistics.pendingNominations} />
            <StatCard title="Approved" value={statistics.approvedNominations} />
            <StatCard title="Rejected" value={statistics.rejectedNominations} />
          </div>
        )}

        {/* TABS (LEFT) + TABLE/GRID TOGGLE (RIGHT) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 0 1.5rem 0", flexWrap: "wrap", gap: "1rem" }}>
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

          <div className="btn-group" role="group">
           <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: "42px",
  }}
>
  <div
    style={{
      display: "flex",
      border: "2px solid #27235c",
      borderRadius: "10px",
      overflow: "hidden",
      background: "#fff",
      height: "38px"
    }}
  >
    <button
      onClick={() => setViewMode("table")}
      style={{
        background: viewMode === "table" ? "#27235c" : "#fff",
        color: viewMode === "table" ? "#fff" : "#27235c",
        border: "none",
        fontWeight: "700",
        fontSize: "15px",
        padding: "7px 26px",
        minWidth: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "38px",
        transition: "all 0.12s",
        outline: "none",
        cursor: "pointer"
      }}
    >
      Table View
    </button>
    <button
      onClick={() => setViewMode("grid")}
      style={{
        background: viewMode === "grid" ? "#27235c" : "#fff",
        color: viewMode === "grid" ? "#fff" : "#27235c",
        border: "none",
        fontWeight: "700",
        fontSize: "15px",
        padding: "7px 26px",
        minWidth: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "38px",
        transition: "all 0.12s",
        outline: "none",
        cursor: "pointer"
      }}
    >
      Grid View
    </button>
  </div>
</div>

          </div>
        </div>

        {filteredNominations.length === 0 ? (
          <div style={{ background: "#fff", border: "2px solid #27235c", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
            <h5 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#1A202C" }}>
              No {activeTab.toLowerCase()} nominations
            </h5>
            <p style={{ fontSize: "14px", marginBottom: 0, color: "#718096" }}>
              Check back later or switch to another tab
            </p>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div style={{ background: "#fff", border: "2px solid #27235c", borderRadius: "12px", overflow: "hidden", marginBottom: "2rem" }}>
             <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
  <thead style={{ background: "#27235c" }}>
    <tr>
      <th style={{ fontWeight: "700", color: "#fff", padding: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
        Nominee
      </th>
      <th style={{ fontWeight: "700", color: "#fff", padding: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
        Department
      </th>
      <th style={{ fontWeight: "700", color: "#fff", padding: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
        Submitted Date
      </th>
      {/* Actions column only in Pending */}
      {activeTab === "Pending" && (
        <th style={{ fontWeight: "700", color: "#fff", padding: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
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
        <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "left" }}>
          <div style={{ fontWeight: "600", color: "#1A202C", fontSize: "14px" }}>
            {nomination.nomineeName}
          </div>
          <div style={{ color: "#718096", fontSize: "12px", marginTop: "4px" }}>
            {nomination.nomineeEmail}
          </div>
        </td>
        <td style={{ color: "#1A202C", fontSize: "14px", verticalAlign: "middle", padding: "16px", fontWeight: "500", textAlign: "left" }}>
          {nomination.nomineeDepartmentName}
        </td>
        <td style={{ color: "#718096", fontSize: "14px", verticalAlign: "middle", padding: "16px", textAlign: "left" }}>
          {new Date(nomination.submittedAt).toLocaleDateString()}
        </td>
        {/* Actions cell only in Pending tab */}
        {activeTab === "Pending" && (
         <td style={{ verticalAlign: "middle", padding: "16px", textAlign: "left" }}>
  <div style={{ display: "flex", gap: "8px" }}>
    {/* View */}
    <button
      onClick={() => viewDetails(nomination.nominationId)}
      title="View"
      style={{
        padding: "7px 10px",
        background: "#fff",
        color: "#4a73e8",
        border: "1.4px solid #4a73e8",
        borderRadius: "8px",
        fontSize: "17px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <i className="bi bi-eye" />
    </button>
    {/* Approve */}
    <button
      onClick={() => openApproveModal(nomination.nominationId)}
      title="Approve"
      style={{
        padding: "7px 10px",
        background: "#fff",
        color: "#10B981",
        border: "1.4px solid #10B981",
        borderRadius: "8px",
        fontSize: "17px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <i className="bi bi-check-circle" />
    </button>
    {/* Reject */}
    <button
      onClick={() => openRejectModal(nomination.nominationId)}
      title="Reject"
      style={{
        padding: "7px 10px",
        background: "#fff",
        color: "#EF4444",
        border: "1.4px solid #EF4444",
        borderRadius: "8px",
        fontSize: "17px",
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
                      style={{ color: "#27235c", fontWeight: "600" }}
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
                      style={{ color: "#27235c", fontWeight: "600" }}
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
                    style={{
                      background: "#fff",
                      border: "2px solid #27235c",
                      borderRadius: "14px",
                      padding: "24px",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(39,35,92,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      <h6 style={{ color: "#27235c", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>
                        {nomination.nomineeName}
                      </h6>
                    </div>
                    <div style={{ background: "#f8f9fc", padding: "14px", borderRadius: "8px", marginBottom: "16px" }}>
                      <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                        <span style={{ color: "#718096", fontWeight: "600" }}>Department:</span>
                        <br />
                        <span style={{ color: "#1A202C", fontWeight: "600", fontSize: "14px" }}>
                          {nomination.nomineeDepartmentName}
                        </span>
                      </p>
                      <p style={{ fontSize: "13px", margin: 0 }}>
                        <span style={{ color: "#718096", fontWeight: "600" }}>Submitted:</span>
                        <br />
                        <span style={{ color: "#1A202C", fontWeight: "500" }}>
                          {new Date(nomination.submittedAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          flex: 1,
                          background: "#27235c",
                          color: "#fff",
                          border: "none",
                          fontWeight: "700",
                          fontSize: "13px",
                          padding: "10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                        onClick={() => viewDetails(nomination.nominationId)}
                      >
                        View Details
                      </button>
                      {activeTab === "Pending" && (
                        <>
                          <button
                            style={{
                              background: "#10B981",
                              color: "#fff",
                              border: "none",
                              fontWeight: "700",
                              padding: "10px 14px",
                              fontSize: "16px",
                              borderRadius: "8px",
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
                              padding: "10px 14px",
                              fontSize: "16px",
                              borderRadius: "8px",
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
                    <button className="page-link" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ color: "#27235c", fontWeight: "600" }}>
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
                            fontWeight: "600",
                          }}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ) : null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ color: "#27235c", fontWeight: "600" }}>
                      Last
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

      {/* USE YOUR EXISTING MODALS */}
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
