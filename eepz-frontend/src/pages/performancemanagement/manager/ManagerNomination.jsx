import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";
import NominationModal from "../../../components/performance_management/modals/ManagerNomination/NominationModal";
import "../../../styles/performancemanagement/manager/ManagerNomination.css";
import Breadcrumb from "../../../components/common/Breadcrumb";

const safeText = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = typeof v === "string" ? v.trim() : v;
      if (s !== "") return s;
    }
  }
  return "-";
};

const usePagination = (items = [], pageSize = 5) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [items, totalPages, page]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page, pageSize]);
  return { page, setPage, totalPages, paged, pageSize };
};

const PaginationDropdown = ({ value, onChange, options = [5, 10, 15, 20] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="custom-mn-pagination-dropdown">
      <div
        className="custom-mn-selected"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        {value}
        <span className="custom-mn-arrow"></span>
      </div>
      {isOpen && (
        <div className="custom-mn-menu">
          {options.map((opt) => (
            <div
              key={opt}
              className={`custom-mn-option ${opt === value ? "custom-mn-option-active" : ""}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ManagerNomination() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const empId = user?.empId ?? null;
  const [managerId] = useState(() => empId);

  const [rewardTypes, setRewardTypes] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myNominations, setMyNominations] = useState([]);
  const [showNominationModal, setShowNominationModal] = useState(false);
  const [showNominationsView, setShowNominationsView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);

  const [teamPageSize, setTeamPageSize] = useState(5);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [approvedPageSize, setApprovedPageSize] = useState(5);
  const [rejectedPageSize, setRejectedPageSize] = useState(5);

  useEffect(() => {
    fetchRewardTypes();
  }, []);

  useEffect(() => {
    if (managerId) {
      fetchTeamMembers();
      fetchMyNominations();
    }
  }, [managerId]);

  const fetchRewardTypes = async () => {
    try {
      const { data } = await managerNominationApi.getRewardTypes();
      if (data?.success) setRewardTypes(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load reward types");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const { data } = await managerNominationApi.getTeamMembers(managerId);
      if (data?.success) setTeamMembers(data.data || []);
      else toast.error("Unable to load team members");
    } catch (e) {
      console.error(e);
      toast.error("Error loading team members");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNominations = async () => {
    try {
      const { data } = await managerNominationApi.getMyNominations(managerId);
      if (data?.success) setMyNominations(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load nominations");
    }
  };

  const pendingNominations = myNominations.filter((n) => n?.status === "Pending");
  const approvedNominations = myNominations.filter((n) => n?.status === "Approved");
  const rejectedNominations = myNominations.filter((n) => n?.status === "Rejected");

  const pendingPager = usePagination(pendingNominations, pendingPageSize);
  const approvedPager = usePagination(approvedNominations, approvedPageSize);
  const rejectedPager = usePagination(rejectedNominations, rejectedPageSize);
  const teamMembersPager = usePagination(teamMembers, teamPageSize);

  const handleOpenNominate = (member) => {
    setSelectedEmployee(member);
    setShowNominationModal(true);
  };

  const handleNominationSuccess = () => {
    fetchMyNominations();
    fetchTeamMembers();
    setShowNominationModal(false);
    toast.success("Nomination submitted successfully");
  };

  const Pagination = ({ pager, pageSize, setPageSize }) => {
    const { page, setPage, totalPages, paged } = pager;
    const totalItems = pager.pageSize ? Math.ceil(paged.length / pager.pageSize) * pager.pageSize + (page - 1) * pager.pageSize : 0;
    const startItem = totalPages > 0 ? (page - 1) * pager.pageSize + 1 : 0;
    const endItem = Math.min(page * pager.pageSize, totalItems);

    if (totalPages <= 0) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    return (
      <div className="mn-pagination-container">
        <div className="mn-pagination-info">
          <span className="mn-pagination-label">Show</span>
          <PaginationDropdown value={pageSize} onChange={setPageSize} />
          <span className="mn-pagination-label">entries</span>
        </div>

        <div className="mn-pagination-status">
         Showing {startItem}-{endItem} of {totalItems}
        </div>

        <div className="mn-pagination-nav">
          <ul className="mn-pagination">
            <li className={`mn-page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="mn-page-link"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>

            {pages.map((p) => (
              <li key={p} className={`mn-page-item ${p === page ? "active" : ""}`}>
                <button
                  className="mn-page-link"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              </li>
            ))}

            <li className={`mn-page-item ${page === totalPages ? "disabled" : ""}`}>
              <button
                className="mn-page-link"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const StatCard = ({ icon, label, count, colorClass }) => (
    <div className={`mn-stat-card ${colorClass}`}>
      <div className="mn-stat-icon">
        <i className={`bi bi-${icon}`}></i>
      </div>
      <div className="mn-stat-content">
        <div className="mn-stat-value">{count}</div>
        <div className="mn-stat-label">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="mn-page">
      <Toaster position="top-right" richColors closeButton />

      <Breadcrumb
        items={[
          { label: "Performance", path: "/manager/dashboard/performance" },
          { label: "Nominations", path: null },
        ]}
      />

      <div className="mn-stats-grid">
        <StatCard icon="people-fill" label="Team Members" count={teamMembers.length} colorClass="mn-stat-total" />
        <StatCard icon="clock-history" label="Pending" count={pendingNominations.length} colorClass="mn-stat-pending" />
        <StatCard icon="check-circle-fill" label="Approved" count={approvedNominations.length} colorClass="mn-stat-submitted" />
        <StatCard icon="x-circle-fill" label="Rejected" count={rejectedNominations.length} colorClass="mn-stat-rejected" />
      </div>

      <div className="mn-content">
        <div className="mn-section-header">
          <div className="mn-section-header-left">
            <div className="mn-section-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <h3 className="mn-section-title">Team Members</h3>
              <p className="mn-section-subtitle">Nominate your team members for rewards and recognition</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowNominationsView(!showNominationsView);
              if (!showNominationsView) {
                setTimeout(() => {
                  document.getElementById("nominations-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 100);
              }
            }}
            className="mn-view-btn"
          >
            <i className={`bi bi-${showNominationsView ? "eye-slash" : "list-check"}`}></i>
            {showNominationsView ? "Hide Nominations" : "View Nominations"}
          </button>
        </div>

        <div className="mn-table-wrapper">
          <table className="mn-employee-table" role="table" aria-label="Team members">
            <thead>
              <tr>
                <th className="col-index">
                  SNO
                </th>
                <th className="col-name">
                  <i className="bi bi-person"></i> Name
                </th>
                <th className="col-dept">
                  <i className="bi bi-building"></i> Department
                </th>
                <th className="col-action">
                  <i className="bi bi-lightning"></i> Action
                </th>
              </tr>
            </thead>
            <tbody>
              {teamMembersPager.paged.map((member, i) => {
                const name = safeText(
                  `${member?.firstName || ""} ${member?.lastName || ""}`.trim(),
                  member?.name
                );
                const dept = safeText(
                  member?.department?.departmentName,
                  member?.departmentName,
                  "-"
                );
                return (
                  <tr key={member?.employeeId || i}>
                    <td className="col-index">
                      {(teamMembersPager.page - 1) * teamMembersPager.pageSize + i + 1}
                    </td>
                    <td className="col-name">
                      <div className="mn-employee-cell">
                        <div className="mn-employee-avatar">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="mn-employee-name">{name}</span>
                      </div>
                    </td>
                    <td className="col-dept">{dept}</td>
                    <td className="col-action">
                      <button
                        className="mn-bulk-btn"
                        onClick={() => handleOpenNominate(member)}
                        title="Nominate this employee"
                      >
                        <i className="bi bi-award"></i> Nominate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {teamMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="mn-empty-row">
                    <div className="mn-empty">
                      <div className="mn-empty-icon">
                        <i className="bi bi-inbox"></i>
                      </div>
                      <div className="mn-empty-title">
                        {loading ? "Loading team members..." : "No team members found"}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {teamMembers.length > 0 && (
          <Pagination pager={teamMembersPager} pageSize={teamPageSize} setPageSize={setTeamPageSize} />
        )}
      </div>

      {showNominationsView && (
        <div id="nominations-section" className="mn-content mn-nominations-section">
          <div className="mn-section-header">
            <div className="mn-section-header-left">
              <div className="mn-section-icon">
                <i className="bi bi-list-check"></i>
              </div>
              <div>
                <h3 className="mn-section-title">My Nominations</h3>
                <p className="mn-section-subtitle">Track and manage all your nomination submissions</p>
              </div>
            </div>
            <button onClick={() => setShowNominationsView(false)} className="mn-close-btn">
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>

          <div className="mn-tabs-bar" role="tablist" aria-label="Nomination tabs">
            <button
              className={`mn-tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
              role="tab"
              aria-selected={activeTab === "pending"}
            >
              <i className="bi bi-clock-history"></i>
              Pending
              <span className="mn-count">{pendingNominations.length}</span>
            </button>

            <button
              className={`mn-tab ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
              role="tab"
              aria-selected={activeTab === "approved"}
            >
              <i className="bi bi-check-circle-fill"></i>
              Approved
              <span className="mn-count">{approvedNominations.length}</span>
            </button>

            <button
              className={`mn-tab ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
              role="tab"
              aria-selected={activeTab === "rejected"}
            >
              <i className="bi bi-x-circle-fill"></i>
              Rejected
              <span className="mn-count">{rejectedNominations.length}</span>
            </button>
          </div>

          <div className="mn-table-wrapper">
            <table className="mn-employee-table" role="table" aria-label="Nominations table">
              <thead>
                <tr>
                  <th className="col-index">
                    <i className="bi bi-hash"></i> SNO
                  </th>
                  <th className="col-name">
                    <i className="bi bi-person"></i> Name
                  </th>
                  <th className="col-dept">
                    <i className="bi bi-building"></i> Department
                  </th>
                  <th className="col-reward">
                    <i className="bi bi-gift"></i> Reward Type
                  </th>
                </tr>
              </thead>

              <tbody>
                {activeTab === "pending" &&
                  pendingPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find((rt) => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(pendingPager.page - 1) * pendingPager.pageSize + i + 1}
                        </td>
                        <td className="col-name">
                          <div className="mn-employee-cell">
                            <div className="mn-employee-avatar">{name.charAt(0).toUpperCase()}</div>
                            <span className="mn-employee-name">{name}</span>
                          </div>
                        </td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">
                          <span className="mn-days-badge badge-info">
                            <i className="bi bi-gift"></i> {reward}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === "approved" &&
                  approvedPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find((rt) => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(approvedPager.page - 1) * approvedPager.pageSize + i + 1}
                        </td>
                        <td className="col-name">
                          <div className="mn-employee-cell">
                            <div className="mn-employee-avatar">{name.charAt(0).toUpperCase()}</div>
                            <span className="mn-employee-name">{name}</span>
                          </div>
                        </td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">
                          <span className="mn-days-badge badge-success">
                            <i className="bi bi-gift"></i> {reward}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === "rejected" &&
                  rejectedPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find((rt) => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(rejectedPager.page - 1) * rejectedPager.pageSize + i + 1}
                        </td>
                        <td className="col-name">
                          <div className="mn-employee-cell">
                            <div className="mn-employee-avatar">{name.charAt(0).toUpperCase()}</div>
                            <span className="mn-employee-name">{name}</span>
                          </div>
                        </td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">
                          <span className="mn-days-badge badge-danger">
                            <i className="bi bi-gift"></i> {reward}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {((activeTab === "pending" && pendingNominations.length === 0) ||
                  (activeTab === "approved" && approvedNominations.length === 0) ||
                  (activeTab === "rejected" && rejectedNominations.length === 0)) && (
                  <tr>
                    <td colSpan={4} className="mn-empty-row">
                      <div className="mn-empty">
                        <div className="mn-empty-icon">
                          <i className="bi bi-inbox"></i>
                        </div>
                        <div className="mn-empty-title">No {activeTab} nominations found</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {activeTab === "pending" && pendingNominations.length > 0 && (
            <Pagination pager={pendingPager} pageSize={pendingPageSize} setPageSize={setPendingPageSize} />
          )}
          {activeTab === "approved" && approvedNominations.length > 0 && (
            <Pagination pager={approvedPager} pageSize={approvedPageSize} setPageSize={setApprovedPageSize} />
          )}
          {activeTab === "rejected" && rejectedNominations.length > 0 && (
            <Pagination pager={rejectedPager} pageSize={rejectedPageSize} setPageSize={setRejectedPageSize} />
          )}
        </div>
      )}

      <NominationModal
        show={showNominationModal}
        onHide={() => setShowNominationModal(false)}
        onNominationSuccess={handleNominationSuccess}
        selectedEmployee={selectedEmployee}
        rewardTypes={rewardTypes}
        managerId={managerId}
      />
    </div>
  );
}
