import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";
import NominationModal from "../../../components/performance_management/modals/ManagerNomination/NominationModal";
import "../../../styles/performancemanagement/manager/ManagerNomination.css";
 
/* Uploaded fallback path (your environment will map this to a URL) */
const FALLBACK_HOME_ICON = "/mnt/data/72db97da-9426-4032-9c37-de8aaa35465e.png";
 
/* Helper: safe text fallback for fields returned differently by APIs */
const safeText = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = typeof v === "string" ? v.trim() : v;
      if (s !== "") return s;
    }
  }
  return "-";
};
 
/* Pagination hook */
const usePagination = (items = [], pageSize = 5) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [items, totalPages]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page, pageSize]);
  return { page, setPage, totalPages, paged, pageSize };
};
 
/* Breadcrumbs component using inline SVGs (no external images required) */
const Breadcrumbs = ({ items = [] }) => {
  const HomeSvg = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 10.5L12 4l9 6.5" stroke="#8f2b6b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 12.5v6a1 1 0 0 0 1 1h3v-5h6v5h3a1 1 0 0 0 1-1v-6" stroke="#8f2b6b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
 
  const Chevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="#bdb2c8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
 
  return (
    <nav className="managernomination-breadcrumbs" aria-label="Breadcrumb">
      <ol className="managernomination-breadcrumb-list">
        <li className="managernomination-crumb" aria-hidden>
          {/* inline svg home icon */}
          <span className="managernomination-home-icon">
            <HomeSvg />
          </span>
          {/* Fallback: reference to uploaded file (hidden). Keep for build mapping if needed */}
          <img src={FALLBACK_HOME_ICON} alt="" style={{ display: "none" }} />
        </li>
 
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li
              key={idx}
              className={`managernomination-crumb ${isLast ? "managernomination-crumb-active" : ""}`}
            >
              <span className="managernomination-crumb-sep" aria-hidden>
                <Chevron />
              </span>
 
              {isLast ? (
                <span className="managernomination-crumb-text" aria-current="page">
                  {it.label}
                </span>
              ) : (
                <a className="managernomination-crumb-link" href={it.to || "#"}>
                  {it.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // pending | approved | rejected
  const [loading, setLoading] = useState(false);
 
  useEffect(() => { fetchRewardTypes(); }, []);
  useEffect(() => { if (managerId) { fetchTeamMembers(); fetchMyNominations(); } }, [managerId]);
 
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
 
  /* Strict partitions by status */
  const pendingNominations = myNominations.filter((n) => n?.status === "Pending");
  const approvedNominations = myNominations.filter((n) => n?.status === "Approved");
  const rejectedNominations = myNominations.filter((n) => n?.status === "Rejected");
 
  /* Pagination hooks */
  const pendingPager = usePagination(pendingNominations, 5);
  const approvedPager = usePagination(approvedNominations, 5);
  const rejectedPager = usePagination(rejectedNominations, 5);
  const availableMembers = teamMembers.filter((m) => !myNominations.some((nom) => nom?.nominee?.employeeId === m?.employeeId));
  const availablePager = usePagination(availableMembers, 5);
 
  /* Only show "Nominate" buttons when Pending tab is active */
  const canNominate = activeTab === "pending";
 
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
 
  /* Simple Pagination UI */
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
            className={`managernomination-pg-btn ${p === page ? "active" : ""}`}
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
      <Toaster position="top-right" richColors />
 
      <Breadcrumbs items={[{ label: "Performance", to: "/performance" }, { label: "Performance Review", to: "/performance/review" }]} />
 
      <h1 className="managernomination-page-title">My Team Nominations</h1>
 
      <div className="managernomination-card">
        <div className="managernomination-tab-container" role="tablist" aria-label="Nomination tabs">
          <button
            className={`managernomination-tab ${activeTab === "pending" ? "managernomination-tab-active" : ""}`}
            onClick={() => setActiveTab("pending")}
            role="tab"
            aria-selected={activeTab === "pending"}
          >
            Pending ({pendingNominations.length})
          </button>
 
          <button
            className={`managernomination-tab ${activeTab === "approved" ? "managernomination-tab-active" : ""}`}
            onClick={() => setActiveTab("approved")}
            role="tab"
            aria-selected={activeTab === "approved"}
          >
            Approved ({approvedNominations.length})
          </button>
 
          <button
            className={`managernomination-tab ${activeTab === "rejected" ? "managernomination-tab-active" : ""}`}
            onClick={() => setActiveTab("rejected")}
            role="tab"
            aria-selected={activeTab === "rejected"}
          >
            Rejected ({rejectedNominations.length})
          </button>
        </div>
 
        {/* Nominations table for selected tab */}
        <div className="managernomination-table-wrapper">
          <table className="managernomination-table" role="table" aria-label="Nominations table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="col-name">Name</th>
                <th className="col-dept">Department</th>
                <th className="col-reward">Reward Type</th>
                <th className="col-status">Status</th>
              </tr>
            </thead>
 
            <tbody>
              {activeTab === "pending" &&
                pendingPager.paged.map((nom, i) => {
                  const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                  const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                  const reward = safeText(nom?.rewardType?.rewardName, nom?.rewardName, "-");
                  return (
                    <tr key={nom?.nominationId || i}>
                      <td className="col-index">{(pendingPager.page - 1) * pendingPager.pageSize + i + 1}</td>
                      <td className="col-name">{name}</td>
                      <td className="col-dept">{dept}</td>
                      <td className="col-reward">{reward}</td>
                      <td className="col-status">
                        <span className="managernomination-badge managernomination-badge-pending">Pending</span>
                      </td>
                    </tr>
                  );
                })}
 
              {activeTab === "approved" &&
                approvedPager.paged.map((nom, i) => {
                  const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                  const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                  const reward = safeText(nom?.rewardType?.rewardName, nom?.rewardName, "-");
                  return (
                    <tr key={nom?.nominationId || i}>
                      <td className="col-index">{(approvedPager.page - 1) * approvedPager.pageSize + i + 1}</td>
                      <td className="col-name">{name}</td>
                      <td className="col-dept">{dept}</td>
                      <td className="col-reward">{reward}</td>
                      <td className="col-status">
                        <span className="managernomination-badge managernomination-badge-approved">Approved</span>
                      </td>
                    </tr>
                  );
                })}
 
              {activeTab === "rejected" &&
                rejectedPager.paged.map((nom, i) => {
                  const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                  const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                  const reward = safeText(nom?.rewardType?.rewardName, nom?.rewardName, "-");
                  return (
                    <tr key={nom?.nominationId || i}>
                      <td className="col-index">{(rejectedPager.page - 1) * rejectedPager.pageSize + i + 1}</td>
                      <td className="col-name">{name}</td>
                      <td className="col-dept">{dept}</td>
                      <td className="col-reward">{reward}</td>
                      <td className="col-status">
                        <span className="managernomination-badge managernomination-badge-rejected">Rejected</span>
                      </td>
                    </tr>
                  );
                })}
 
              {/* Empty fallback */}
              {((activeTab === "pending" && pendingNominations.length === 0) ||
                (activeTab === "approved" && approvedNominations.length === 0) ||
                (activeTab === "rejected" && rejectedNominations.length === 0)) && (
                <tr>
                  <td colSpan={5} className="managernomination-empty-row">
                    No {activeTab} nominations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
 
        {/* Pagination area */}
        <div style={{ marginTop: 12 }}>
          {activeTab === "pending" && <Pagination pager={pendingPager} />}
          {activeTab === "approved" && <Pagination pager={approvedPager} />}
          {activeTab === "rejected" && <Pagination pager={rejectedPager} />}
        </div>
 
        {/* Available for nomination */}
        <div className="managernomination-available-section" style={{ marginTop: 28 }}>
          <h3 className="managernomination-subsection-title">Available for Nomination</h3>
 
          <table className="managernomination-table" role="table" aria-label="Available for nomination">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="col-name">Name</th>
                <th className="col-dept">Department</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
 
            <tbody>
              {availablePager.paged.map((member, i) => {
                const name = safeText(`${member?.firstName || ""} ${member?.lastName || ""}`, member?.name);
                const dept = safeText(member?.department?.departmentName, member?.departmentName, "-");
                return (
                  <tr key={member?.employeeId || i}>
                    <td className="col-index">{(availablePager.page - 1) * availablePager.pageSize + i + 1}</td>
                    <td className="col-name">{name}</td>
                    <td className="col-dept">{dept}</td>
                    <td className="col-action">
                      <button
                        className="managernomination-nominate-button"
                        onClick={() => handleOpenNominate(member)}
                        disabled={!canNominate}
                        title={canNominate ? "Nominate this employee" : "Switch to Pending tab to nominate"}
                        aria-disabled={!canNominate}
                      >
                        Nominate
                      </button>
                    </td>
                  </tr>
                );
              })}
 
              {availableMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="managernomination-empty-row">No available team members</td>
                </tr>
              )}
            </tbody>
          </table>
 
          <div style={{ marginTop: 12 }}>
            <Pagination pager={availablePager} />
          </div>
        </div>
      </div>
 
      {/* Nomination modal */}
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
 
 