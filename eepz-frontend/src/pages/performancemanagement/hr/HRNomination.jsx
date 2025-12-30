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
  
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [selectedRewardEmployees, setSelectedRewardEmployees] = useState([]);
  const [selectedRewardName, setSelectedRewardName] = useState("");
  
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
    setShowEmployeeList(false);
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

  const groupByRewardType = (nominations) => {
    const grouped = {};
    
    nominations.forEach((opp) => {
      const rewardName = opp.rewardType?.rewardName || "Unknown Reward";
      
      if (!grouped[rewardName]) {
        grouped[rewardName] = {
          rewardName: rewardName,
          rewardCategory: opp.rewardType?.rewardCategory || "",
          employees: [],
          totalCount: 0,
        };
      }
      
      opp.nominations.forEach((nom) => {
        if (nom.status === activeTab) {
          grouped[rewardName].employees.push(nom);
          grouped[rewardName].totalCount++;
        }
      });
    });
    
    return Object.values(grouped).filter(group => group.totalCount > 0);
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
  const groupedRewards = groupByRewardType(filteredNominations);
  
  const totalPages = Math.ceil(groupedRewards.length / itemsPerPage);
  const paginatedRewards = groupedRewards.slice(
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
  
        if (data.success || data.Success) {
          toast.success(` Nomination approved successfully!`);
          setShowActionModal(false);
          setActionRemarks("");
          
          setSelectedRewardEmployees(prev => 
            prev.filter(emp => emp.nominationId !== actionNominationId)
          );
          
          fetchNominations();
          fetchStatistics();
        }
      } else {
        const { data } = await api.rejectNominations({
          selectedNominationIds: [actionNominationId],
          hrUserId: 1,
          rejectionRemarks: actionRemarks,
        });
  
        if (data.success || data.Success) {
          toast.success(` Nomination rejected successfully!`);
          setShowActionModal(false);
          setActionRemarks("");
          
          setSelectedRewardEmployees(prev => 
            prev.filter(emp => emp.nominationId !== actionNominationId)
          );
          
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

  const viewEmployeeList = (rewardGroup) => {
    setSelectedRewardName(rewardGroup.rewardName);
    setSelectedRewardEmployees(rewardGroup.employees);
    setShowEmployeeList(true);
  };

  const goBackToNominations = () => {
    setShowEmployeeList(false);
    setSelectedRewardName("");
    setSelectedRewardEmployees([]);
  };

  const handleNominationsClick = (e) => {
    if (e) e.preventDefault();
    goBackToNominations();
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

  if (showEmployeeList) {
    return (
      <div style={{ background: THEME.background, minHeight: "100vh", paddingTop: "16px", paddingBottom: "32px" }}>
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="container-fluid">
          <div onClick={(e) => {
            const target = e.target;
            if (target.textContent === "Nominations" || target.closest('[data-breadcrumb="nominations"]')) {
              handleNominationsClick(e);
            }
          }}>
            <Breadcrumb
              items={[
                { label: "Dashboard", path: "/hr/dashboard" },
                { label: "Performance", path: "/hr/dashboard/performance" },
                { label: "Nominations", path: "/hr/dashboard/performance/nominations", isClickable: true, onClick: handleNominationsClick },
                { label: selectedRewardName, path: null }
              ]}
            />
          </div>

          <div style={{
            background: "#fff",
            border: "2px solid #27235c",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h4 style={{ margin: 0, color: THEME.primary, fontSize: "18px", fontWeight: "700" }}>
                {selectedRewardName}
              </h4>
              <p style={{ margin: 0, color: THEME.textLight, fontSize: "13px" }}>
                {selectedRewardEmployees.length} employee(s) nominated
              </p>
            </div>
            <div style={{
              background: THEME.primary,
              color: "#fff",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "16px",
              fontWeight: "700"
            }}>
              {selectedRewardEmployees.length}
            </div>
          </div>

          <div className="row g-3">
            {selectedRewardEmployees.map((employee) => (
              <div key={employee.nominationId} className="col-md-6">
                <div
                  style={{
                    background: "#fff",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    transition: "all 0.2s",
                    height: "100%"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = THEME.primary;
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(39,35,92,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "700"
                    }}>
                      {employee.nomineeName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <h6 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: THEME.text }}>
                        {employee.nomineeName}
                      </h6>
                      <p style={{ margin: 0, fontSize: "12px", color: THEME.textLight }}>
                        {employee.nomineeEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ background: "#f8f9fc", padding: "8px 10px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "10px", color: THEME.textLight, fontWeight: "600", textTransform: "uppercase", display: "block" }}>
                        Department
                      </span>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: THEME.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {employee.nomineeDepartmentName}
                      </p>
                    </div>
                    <div style={{ background: "#f8f9fc", padding: "8px 10px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "10px", color: THEME.textLight, fontWeight: "600", textTransform: "uppercase", display: "block" }}>
                        Submitted
                      </span>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: THEME.text }}>
                        {new Date(employee.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {employee.justification && (
                    <div style={{
                      background: "#f8f9fc",
                      padding: "10px",
                      borderRadius: "6px",
                      borderLeft: `3px solid ${THEME.primary}`,
                      marginBottom: "12px"
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: "12px", 
                        color: THEME.text, 
                        lineHeight: "1.5",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {employee.justification}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <button
                      onClick={() => viewDetails(employee.nominationId)}
                      title="View Details"
                      style={{
                        padding: "6px 8px",
                        background: "#fff",
                        color: THEME.primary,
                        border: `1.3px solid ${THEME.primary}`,
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
                    {activeTab === "Pending" && (
                      <>
                        <button
                          onClick={() => openApproveModal(employee.nominationId)}
                          title="Approve"
                          style={{
                            padding: "6px 8px",
                            background: "#fff",
                            color: THEME.success,
                            border: `1.3px solid ${THEME.success}`,
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
                          onClick={() => openRejectModal(employee.nominationId)}
                          title="Reject"
                          style={{
                            padding: "6px 8px",
                            background: "#fff",
                            color: THEME.danger,
                            border: `1.3px solid ${THEME.danger}`,
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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

  return (
    <div style={{ background: THEME.background, minHeight: "100vh", paddingTop: "16px", paddingBottom: "32px" }}>
      <ToastContainer position="top-right" autoClose={3000} />

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

        {groupedRewards.length === 0 ? (
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
                        padding: "12px 20px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "left",
                      }}
                    >
                      Reward Type
                    </th>
                    <th
                      style={{
                        fontWeight: "700",
                        color: "#fff",
                        padding: "12px 20px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "center",
                      }}
                    >
                      Nominated Employees
                    </th>
                    <th
                      style={{
                        fontWeight: "700",
                        color: "#fff",
                        padding: "12px 20px",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        textAlign: "center",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRewards.map((reward, index) => (
                    <tr
                      key={reward.rewardName}
                      style={{
                        borderBottom: index < paginatedRewards.length - 1 ? "1px solid #e5e7eb" : "none",
                      }}
                    >
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: "700"
                          }}>
                            <i className="bi bi-award-fill" />
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: THEME.text, fontSize: "15px" }}>
                              {reward.rewardName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle", textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: THEME.primary,
                          color: "#fff",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "700"
                        }}>
                          <i className="bi bi-people-fill" />
                          {reward.totalCount}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => viewEmployeeList(reward)}
                            title="View Employees"
                            style={{
                              padding: "8px 16px",
                              background: THEME.primary,
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(39,35,92,0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            View Nominations
                          </button>
                        </div>
                      </td>
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
            <div className="row g-3 mb-3">
              {paginatedRewards.map((reward) => (
                <div key={reward.rewardName} className="col-md-6 col-lg-4">
                  <div
                    style={{
                      background: "#fff",
                      border: "2px solid #27235c",
                      borderRadius: "12px",
                      padding: "20px",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(39,35,92,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      marginBottom: "16px"
                    }}>
                      <i className="bi bi-award-fill" />
                    </div>
                    
                    <h5 style={{
                      color: THEME.primary,
                      fontSize: "17px",
                      fontWeight: "700",
                      marginBottom: "8px"
                    }}>
                      {reward.rewardName}
                    </h5>
                    
                    {reward.rewardCategory && (
                      <p style={{
                        color: THEME.textLight,
                        fontSize: "12px",
                        marginBottom: "12px"
                      }}>
                        {reward.rewardCategory}
                      </p>
                    )}

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      background: "#f8f9fc",
                      borderRadius: "8px",
                      marginBottom: "16px"
                    }}>
                      <i className="bi bi-people-fill" style={{ fontSize: "20px", color: THEME.primary }} />
                      <div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: THEME.primary }}>
                          {reward.totalCount}
                        </div>
                        <div style={{ fontSize: "11px", color: THEME.textLight, fontWeight: "600" }}>
                          Nominated Employees
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => viewEmployeeList(reward)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: THEME.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginTop: "auto"
                      }}
                    >
                      <i className="bi bi-eye" /> View Details
                    </button>
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
