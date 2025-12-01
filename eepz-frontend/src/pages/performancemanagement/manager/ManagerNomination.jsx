import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import * as managerNominationApi from "../../../services/performancemanagement/manager/managernominationapi";
import NominationModal from "../../../components/performance_management/modals/ManagerNomination/NominationModal";
import "../../../styles/performancemanagement/manager/ManagerNomination.css";

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
  }, [items, totalPages]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page, pageSize]);
  return { page, setPage, totalPages, paged, pageSize };
};

const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="managernomination-breadcrumbs" aria-label="breadcrumb">
      <ol
        className="managernomination-breadcrumb-list"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: 0,
          margin: "0 0 12px 0",
          listStyle: "none",
          fontSize: "13px",
          color: "#9B287B",
        }}
      >
        {/* Home */}
        <li
  className="managernomination-crumb"
  style={{ display: "flex", alignItems: "center" }}
>
  <Link
    to="/manager/dashboard"
    aria-label="Home"
    style={{
      color: "#9B287B",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
    }}
  >
    <i className="bi bi-house" style={{ fontSize: "14px" }} />
  </Link>
</li>


        {/* Dynamic items */}
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <span style={{ color: "#9B287B" }}>/</span>

              <li
                className={`managernomination-crumb ${
                  isLast ? "managernomination-crumb-active" : ""
                }`}
                style={{ display: "flex", alignItems: "center" }}
              >
                {it.to && !isLast ? (
                  <Link
                    to={it.to}
                    style={{
                      color: "#9B287B",
                      textDecoration: "none",
                      fontWeight: 400,
                    }}
                  >
                    {it.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: "#9B287B",
                      fontWeight: 700,
                    }}
                  >
                    {it.label}
                  </span>
                )}
              </li>
            </React.Fragment>
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
  const [showNominationsView, setShowNominationsView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
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

  const pendingNominations = myNominations.filter((n) => n?.status === "Pending");
  const approvedNominations = myNominations.filter((n) => n?.status === "Approved");
  const rejectedNominations = myNominations.filter((n) => n?.status === "Rejected");

  const pendingPager = usePagination(pendingNominations, 5);
  const approvedPager = usePagination(approvedNominations, 5);
  const rejectedPager = usePagination(rejectedNominations, 5);
  const availableMembers = teamMembers.filter((m) => !myNominations.some((nom) => nom?.nominee?.employeeId === m?.employeeId));
  const availablePager = usePagination(availableMembers, 5);

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
      <Toaster position="top-right"/>

      <Breadcrumbs items={[{ label: "Performance", to: "/manager/dashboard/performance" }, { label: "Nominations" }]} />

      <div
        className="managernomination-card managernomination-available-section"
        style={{
          border: "1px solid #26225A",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 24px rgba(38, 34, 90, 0.15)"
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          background: "linear-gradient(135deg, #26225A 0%, #1a1740 100%)",
          padding: "16px 20px",
          margin: "-20px -20px 12px -20px",
          borderRadius: "8px 8px 0 0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <i className="bi bi-people-fill" style={{ fontSize: "20px", color: "#fff" }}></i>
            </div>
            <h3 style={{
              margin: 0,
              color: "#fff",
              fontSize: 18,
              fontWeight: 700
            }}>
              Team Members
            </h3>
          </div>
          <button
            onClick={() => {
              setShowNominationsView(!showNominationsView);
              if (!showNominationsView) {
                setTimeout(() => {
                  document.getElementById('nominations-section')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }, 100);
              }
            }}
            style={{
              background: "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
              boxShadow: "0 10px 28px rgba(224, 25, 80, 0.18)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(224, 25, 80, 0.28)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(224, 25, 80, 0.18)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {showNominationsView ? "Hide Nominations" : "View Nominations"}
          </button>
        </div>

        <div className="managernomination-table-wrapper">
          <table
            className="managernomination-table"
            role="table"
            aria-label="Team members"
            style={{
              border: "2px solid #26225A",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <thead>
              <tr>
                <th className="col-index">SNO</th>
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
                        title="Nominate this employee"
                      >
                        <i className="bi bi-award"></i> Nominate
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
        </div>
        <div style={{ marginTop: 12 }}>
          <Pagination pager={availablePager} />
        </div>
      </div>

      {showNominationsView && (
        <div
          id="nominations-section"
          className="managernomination-card"
          style={{
            marginTop: 20,
            animation: "slideDown 0.3s ease-out",
            border: "1px solid #26225A",
            boxShadow: "0 8px 24px rgba(38, 34, 90, 0.15)"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            background: "linear-gradient(135deg, #26225A 0%, #1a1740 100%)",
            padding: "16px 20px",
            margin: "-20px -20px 12px -20px",
            borderRadius: "8px 8px 0 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <i className="bi bi-list-check" style={{ fontSize: "20px", color: "#fff" }}></i>
              </div>
              <h3 style={{
                margin: 0,
                color: "#fff",
                fontSize: 18,
                fontWeight: 700
              }}>
                My Nominations
              </h3>
            </div>
            <button
              onClick={() => setShowNominationsView(false)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
            >
              <i className="bi bi-x-lg"></i> Close
            </button>
          </div>

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

          <div className="managernomination-table-wrapper" style={{ marginTop: 12 }}>
            <table
              className="managernomination-table"
              role="table"
              aria-label="Nominations table"
              style={{
                border: "2px solid #26225A",
                borderRadius: "8px",
                overflow: "hidden"
              }}
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
                    const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                    const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(rt => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">{(pendingPager.page - 1) * pendingPager.pageSize + i + 1}</td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {activeTab === "approved" &&
                  approvedPager.paged.map((nom, i) => {
                    const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                    const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(rt => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">{(approvedPager.page - 1) * approvedPager.pageSize + i + 1}</td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {activeTab === "rejected" &&
                  rejectedPager.paged.map((nom, i) => {
                    const name = safeText(`${nom?.nominee?.firstName || ""} ${nom?.nominee?.lastName || ""}`, nom?.nominee?.name);
                    const dept = safeText(nom?.nominee?.department?.departmentName, nom?.nominee?.departmentName, "-");
                    let reward = "-";
                    if (nom?.rewardTypeId && Array.isArray(rewardTypes)) {
                      const foundType = rewardTypes.find(rt => rt.rewardTypeId === nom.rewardTypeId);
                      if (foundType && foundType.rewardName) reward = foundType.rewardName;
                    }
                    return (
                      <tr key={nom?.nominationId || i}>
                        <td className="col-index">{(rejectedPager.page - 1) * rejectedPager.pageSize + i + 1}</td>
                        <td className="col-name">{name}</td>
                        <td className="col-dept">{dept}</td>
                        <td className="col-reward">{reward}</td>
                      </tr>
                    );
                  })}

                {((activeTab === "pending" && pendingNominations.length === 0) ||
                  (activeTab === "approved" && approvedNominations.length === 0) ||
                  (activeTab === "rejected" && rejectedNominations.length === 0)) && (
                    <tr>
                      <td colSpan={4} className="managernomination-empty-row">
                        No {activeTab} nominations found
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
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

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .managernomination-table {
          border-collapse: collapse;
        }
        
        .managernomination-table thead th {
          background: #26225A;
          color: white;
        }
      `}</style>
    </div>
  );
}
