import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../../services/performancemanagement/api/nominationapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ViewDetailsModal from "../../../components/performance_management/modals/Hrnomination/ViewDetailsModal";
import ActionModal from "../../../components/performance_management/modals/Hrnomination/ActionModal";
import Breadcrumb from "../../../components/common/Breadcrumb";
import styles from "../../../styles/performancemanagement/hr/HrNomination.module.css";

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
          toast.success(`✓ Nomination approved successfully!`);
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
          toast.success(`✓ Nomination rejected successfully!`);
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
    "Total Nominations": styles.hrNominationStatIconPrimary,
    "Pending": styles.hrNominationStatIconWarning,
    "Approved": styles.hrNominationStatIconSuccess,
    "Rejected": styles.hrNominationStatIconDanger,
  };

  const StatCard = ({ title, value }) => (
    <div className={styles.hrNominationStatCard}>
      <div className={`${styles.hrNominationStatIcon} ${statColors[title]}`}>
        <i className={`bi ${statIcons[title]}`}></i>
      </div>
      <div className={styles.hrNominationStatContent}>
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.hrNominationLoadingWrapper}>
        <div className={styles.hrNominationLoadingContent}>
          <div className={`spinner-border mb-3 ${styles.hrNominationSpinner}`} role="status"></div>
          <p className="text-muted">Loading nominations...</p>
        </div>
      </div>
    );
  }

  if (showEmployeeList) {
    return (
      <div className={styles.hrNominationContainer}>
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
                { label: "Performance", path: "/hr/dashboard/performance" },
                { label: "Nominations", path: "/hr/dashboard/performance/nominations", isClickable: true, onClick: handleNominationsClick },
                { label: selectedRewardName, path: null }
              ]}
            />
          </div>

          <div className={styles.hrNominationEmployeeHeader}>
            <div>
              <h4 className={styles.hrNominationEmployeeHeaderTitle}>
                {selectedRewardName}
              </h4>
              <p className={styles.hrNominationEmployeeHeaderSubtitle}>
                {selectedRewardEmployees.length} employee(s) nominated
              </p>
            </div>
            <div className={styles.hrNominationEmployeeHeaderBadge}>
              {selectedRewardEmployees.length}
            </div>
          </div>

          <div className="row g-3">
            {selectedRewardEmployees.map((employee) => (
              <div key={employee.nominationId} className="col-md-6">
                <div className={styles.hrNominationEmployeeCard}>
                  <div className={styles.hrNominationEmployeeCardHeader}>
                    <div className={styles.hrNominationEmployeeAvatar}>
                      {employee.nomineeName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.hrNominationEmployeeInfo}>
                      <h6 className={styles.hrNominationEmployeeName}>
                        {employee.nomineeName}
                      </h6>
                      <p className={styles.hrNominationEmployeeEmail}>
                        {employee.nomineeEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.hrNominationEmployeeInfoGrid}>
                    <div className={styles.hrNominationEmployeeInfoBox}>
                      <span className={styles.hrNominationEmployeeInfoLabel}>
                        Department
                      </span>
                      <p className={styles.hrNominationEmployeeInfoValue}>
                        {employee.nomineeDepartmentName}
                      </p>
                    </div>
                    <div className={styles.hrNominationEmployeeInfoBox}>
                      <span className={styles.hrNominationEmployeeInfoLabel}>
                        Submitted
                      </span>
                      <p className={styles.hrNominationEmployeeInfoValue}>
                        {new Date(employee.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {employee.justification && (
                    <div className={styles.hrNominationEmployeeJustification}>
                      <p className={styles.hrNominationEmployeeJustificationText}>
                        {employee.justification}
                      </p>
                    </div>
                  )}

                  <div className={styles.hrNominationEmployeeActions}>
                    <button
                      onClick={() => viewDetails(employee.nominationId)}
                      title="View Details"
                      className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnView}`}
                    >
                      <i className="bi bi-eye" />
                    </button>
                    {activeTab === "Pending" && (
                      <>
                        <button
                          onClick={() => openApproveModal(employee.nominationId)}
                          title="Approve"
                          className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnApprove}`}
                        >
                          <i className="bi bi-check-circle" />
                        </button>
                        <button
                          onClick={() => openRejectModal(employee.nominationId)}
                          title="Reject"
                          className={`${styles.hrNominationEmployeeActionBtn} ${styles.hrNominationEmployeeActionBtnReject}`}
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
    <div className={styles.hrNominationContainer}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container-fluid">
        <Breadcrumb
          items={[
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

        <div className={styles.hrNominationHeader}>
          <div className={styles.hrNominationStatusTabs}>
            <button
              className={`${styles.hrNominationStatusTab} ${activeTab === "Pending" ? styles.hrNominationStatusTabActive : ""}`}
              onClick={() => setActiveTab("Pending")}
            >
              Pending
            </button>
            <button
              className={`${styles.hrNominationStatusTab} ${activeTab === "Approved" ? styles.hrNominationStatusTabActive : ""}`}
              onClick={() => setActiveTab("Approved")}
            >
              Approved
            </button>
            <button
              className={`${styles.hrNominationStatusTab} ${activeTab === "Rejected" ? styles.hrNominationStatusTabActive : ""}`}
              onClick={() => setActiveTab("Rejected")}
            >
              Rejected
            </button>
          </div>

          <div className={styles.hrNominationViewToggle}>
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Grid View"
              className={`${styles.hrNominationViewButton} ${viewMode === "grid" ? styles.hrNominationViewButtonActive : ""}`}
            >
              <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: 18 }} />
            </button>

            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              aria-label="Table View"
              className={`${styles.hrNominationViewButton} ${viewMode === "table" ? styles.hrNominationViewButtonActive : ""}`}
            >
              <i className="bi bi-table" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {groupedRewards.length === 0 ? (
          <div className={styles.hrNominationEmptyState}>
            <h5 className={styles.hrNominationEmptyTitle}>
              No {activeTab.toLowerCase()} nominations
            </h5>
            <p className={styles.hrNominationEmptyText}>
              Check back later or switch to another tab
            </p>
          </div>
        ) : viewMode === "table" ? (
          <>
            <div className={styles.hrNominationTableWrapper}>
              <table className={styles.hrNominationTable}>
                <thead className={styles.hrNominationTableHead}>
                  <tr>
                    <th className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThLeft}`}>
                      Reward Type
                    </th>
                    <th className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThCenter}`}>
                      Nominated Employees
                    </th>
                    <th className={`${styles.hrNominationTableTh} ${styles.hrNominationTableThCenter}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRewards.map((reward, index) => (
                    <tr
                      key={reward.rewardName}
                      className={styles.hrNominationTableRow}
                    >
                      <td className={styles.hrNominationTableTd}>
                        <div className={styles.hrNominationRewardInfo}>
                          <div className={styles.hrNominationRewardIcon}>
                            <i className="bi bi-award-fill" />
                          </div>
                          <div>
                            <div className={styles.hrNominationRewardName}>
                              {reward.rewardName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${styles.hrNominationTableTd} ${styles.hrNominationTableTdCenter}`}>
                        <div className={styles.hrNominationEmployeeCountBadge}>
                          <i className="bi bi-people-fill" />
                          {reward.totalCount}
                        </div>
                      </td>
                      <td className={styles.hrNominationTableTd}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => viewEmployeeList(reward)}
                            title="View Employees"
                            className={styles.hrNominationTableViewButton}
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
              <nav aria-label="Page navigation" className={styles.hrNominationPagination}>
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className={`page-link ${styles.hrNominationPaginationButton}`}
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
                          className={`page-link ${styles.hrNominationPaginationButton} ${currentPage === pageNum ? styles.hrNominationPaginationButtonActive : ""}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ) : null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className={`page-link ${styles.hrNominationPaginationButton}`}
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
                  <div className={styles.hrNominationGridCard}>
                    <div className={styles.hrNominationGridCardIcon}>
                      <i className="bi bi-award-fill" />
                    </div>
                    
                    <h5 className={styles.hrNominationGridCardTitle}>
                      {reward.rewardName}
                    </h5>
                    
                    {reward.rewardCategory && (
                      <p className={styles.hrNominationGridCardCategory}>
                        {reward.rewardCategory}
                      </p>
                    )}

                    <div className={styles.hrNominationGridCardCount}>
                      <i className={`bi bi-people-fill ${styles.hrNominationGridCardCountIcon}`} />
                      <div>
                        <div className={styles.hrNominationGridCardCountValue}>
                          {reward.totalCount}
                        </div>
                        <div className={styles.hrNominationGridCardCountLabel}>
                          Nominated Employees
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => viewEmployeeList(reward)}
                      className={styles.hrNominationGridCardButton}
                    >
                      <i className="bi bi-eye" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Page navigation" className={styles.hrNominationPagination}>
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className={`page-link ${styles.hrNominationPaginationButton}`}
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
                          className={`page-link ${styles.hrNominationPaginationButton} ${currentPage === pageNum ? styles.hrNominationPaginationButtonActive : ""}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ) : null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className={`page-link ${styles.hrNominationPaginationButton}`}
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
