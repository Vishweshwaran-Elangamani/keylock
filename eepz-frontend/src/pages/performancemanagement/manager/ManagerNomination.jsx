import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";
import NominationModal from "../../../components/performance_management/modals/ManagerNomination/NominationModal";
import "../../../styles/performancemanagement/manager/ManagerNomination.module.css";
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

  const pendingNominations = myNominations.filter(
    (n) => n?.status === "Pending"
  );
  const approvedNominations = myNominations.filter(
    (n) => n?.status === "Approved"
  );
  const rejectedNominations = myNominations.filter(
    (n) => n?.status === "Rejected"
  );

  const pendingPager = usePagination(pendingNominations, 5);
  const approvedPager = usePagination(approvedNominations, 5);
  const rejectedPager = usePagination(rejectedNominations, 5);
  const teamMembersPager = usePagination(teamMembers, 5);

  const handleOpenNominate = (member) => {
    setSelectedEmployee(member);
    setShowNominationModal(true);
  };

  const handleNominationSuccess = () => {
    fetchMyNominations();
    fetchTeamMembers();
    setShowNominationModal(false);
    toast.success("Nomination submitted");
  };

  const Pagination = ({ pager }) => {
    const { page, setPage, totalPages } = pager;
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return (
      <div className="managernomination-pagination" aria-label="Pagination">
        <button
          className="managernomination-pg-btn"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        {pages.map((p) => (
          <button
            key={p}
            className={`managernomination-pg-btn ${
              p === page ? "active" : ""
            }`}
            onClick={() => setPage(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}

        <button
          className="managernomination-pg-btn"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="managernomination-container">
      <Toaster position="top-right" />

      <Breadcrumb
        items={[
          { label: "Performance", path: "/manager/dashboard/performance" },
          { label: "Nominations", path: null }
        ]}
      />

      <div className="managernomination-card managernomination-available-section managernomination-team-section">
        <div className="managernomination-section-header">
          <div className="managernomination-section-header-left">
            <div className="managernomination-section-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <h3 className="managernomination-section-title">Team Members</h3>
          </div>
          <button
            onClick={() => {
              setShowNominationsView(!showNominationsView);
              if (!showNominationsView) {
                setTimeout(() => {
                  document
                    .getElementById("nominations-section")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }, 100);
              }
            }}
            className="managernomination-view-nominations-btn"
          >
            {showNominationsView ? "Hide Nominations" : "View Nominations"}
          </button>
        </div>

        <div className="managernomination-table-wrapper managernomination-table-wrapper-transparent">
          <table className="managernomination-table" role="table" aria-label="Team members">
            <thead>
              <tr>
                <th className="col-index">SNO</th>
                <th className="col-name">Name</th>
                <th className="col-dept">Department</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {teamMembersPager.paged.map((member, i) => {
                const name = safeText(
                  `${member?.firstName || ""} ${
                    member?.lastName || ""
                  }`.trim(),
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
                      {(teamMembersPager.page - 1) * teamMembersPager.pageSize +
                        i +
                        1}
                    </td>
                    <td className="col-name">{name}</td>
                    <td className="col-dept">{dept}</td>
                    <td className="col-action">
                      <button
                        className="managernomination-nominate-button"
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
                  <td colSpan={4} className="managernomination-empty-row">
                    {loading ? "Loading team members..." : "No team members found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="managernomination-pagination-wrapper">
          <Pagination pager={teamMembersPager} />
        </div>
      </div>

      {showNominationsView && (
        <div
          id="nominations-section"
          className="managernomination-card managernomination-nominations-section"
        >
          <div className="managernomination-section-header">
            <div className="managernomination-section-header-left">
              <div className="managernomination-section-icon">
                <i className="bi bi-list-check"></i>
              </div>
              <h3 className="managernomination-section-title">My Nominations</h3>
            </div>
            <button
              onClick={() => setShowNominationsView(false)}
              className="managernomination-close-btn"
            >
              Close
            </button>
          </div>

          <div
            className="managernomination-tab-container"
            role="tablist"
            aria-label="Nomination tabs"
          >
            <button
              className={`managernomination-tab ${
                activeTab === "pending"
                  ? "managernomination-tab-active"
                  : ""
              }`}
              onClick={() => setActiveTab("pending")}
              role="tab"
              aria-selected={activeTab === "pending"}
            >
              Pending ({pendingNominations.length})
            </button>

            <button
              className={`managernomination-tab ${
                activeTab === "approved"
                  ? "managernomination-tab-active"
                  : ""
              }`}
              onClick={() => setActiveTab("approved")}
              role="tab"
              aria-selected={activeTab === "approved"}
            >
              Approved ({approvedNominations.length})
            </button>

            <button
              className={`managernomination-tab ${
                activeTab === "rejected"
                  ? "managernomination-tab-active"
                  : ""
              }`}
              onClick={() => setActiveTab("rejected")}
              role="tab"
              aria-selected={activeTab === "rejected"}
            >
              Rejected ({rejectedNominations.length})
            </button>
          </div>

          <div className="managernomination-table-wrapper managernomination-table-wrapper-transparent">
            <table
              className="managernomination-table"
              role="table"
              aria-label="Nominations table"
            >
              <thead>
                <tr>
                  <th className="col-index">SNO</th>
                  <th className="col-name">Name</th>
                  <th className="col-dept">Department</th>
                  <th className="col-reward">Reward Type</th>
                </tr>
              </thead>

              <tbody>
                {activeTab === "pending" &&
                  pendingPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${
                        nom?.nominee?.lastName || ""
                      }`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(
                        (rt) => rt.rewardTypeId === nom.rewardTypeId
                      );
                      if (foundType && foundType.rewardName)
                        reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(pendingPager.page - 1) *
                            pendingPager.pageSize +
                            i +
                            1}
                        </td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {activeTab === "approved" &&
                  approvedPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${
                        nom?.nominee?.lastName || ""
                      }`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(
                        (rt) => rt.rewardTypeId === nom.rewardTypeId
                      );
                      if (foundType && foundType.rewardName)
                        reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(approvedPager.page - 1) *
                            approvedPager.pageSize +
                            i +
                            1}
                        </td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {activeTab === "rejected" &&
                  rejectedPager.paged.map((nom, i) => {
                    const name = safeText(
                      `${nom?.nominee?.firstName || ""} ${
                        nom?.nominee?.lastName || ""
                      }`.trim(),
                      nom?.nominee?.name
                    );
                    const dept = safeText(
                      nom?.nominee?.department?.departmentName,
                      nom?.nominee?.departmentName,
                      "-"
                    );
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(
                        (rt) => rt.rewardTypeId === nom.rewardTypeId
                      );
                      if (foundType && foundType.rewardName)
                        reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">
                          {(rejectedPager.page - 1) *
                            rejectedPager.pageSize +
                            i +
                            1}
                        </td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {((activeTab === "pending" &&
                  pendingNominations.length === 0) ||
                  (activeTab === "approved" &&
                    approvedNominations.length === 0) ||
                  (activeTab === "rejected" &&
                    rejectedNominations.length === 0)) && (
                  <tr>
                    <td colSpan={4} className="managernomination-empty-row">
                      No {activeTab} nominations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="managernomination-pagination-wrapper">
            {activeTab === "pending" && <Pagination pager={pendingPager} />}
            {activeTab === "approved" && <Pagination pager={approvedPager} />}
            {activeTab === "rejected" && <Pagination pager={rejectedPager} />}
          </div>
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
