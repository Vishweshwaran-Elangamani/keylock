import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../../../services/performancemanagement/api/api";
import { apiPort5113 } from "../../../services/performancemanagement/api/rolesapi";

import ViewFormDetailsModal from "../../../components/performance_management/modals/FormsList/ViewFormDetailsModal";
import DeadlineModal from "../../../components/performance_management/modals/FormsList/DeadlineModal";
import "../../../styles/performancemanagement/hr/FormList.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Breadcrumb from "../../../components/common/Breadcrumb";

function FormsList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineInDays, setDeadlineInDays] = useState(7);
  const [pendingAction, setPendingAction] = useState(null);
  const [viewFormDetails, setViewFormDetails] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [formsPage, setFormsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [formsPerPage, setFormsPerPage] = useState(8);
  const [usersPerPage, setUsersPerPage] = useState(9);

  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [formDeliveryFilter, setFormDeliveryFilter] = useState("All");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [formSearchInput, setFormSearchInput] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");

  const formTypes = useMemo(() => [
    "All",
    ...new Set(rows.map((f) => f.type).filter(Boolean)),
  ], [rows]);
  const formDeliveryOptions = ["All", "Delivery", "Enablement"];

  const analyticsIcons = {
    "Total Forms": "bi-journal-text",
    "Manager Forms": "bi-person-badge",
    "Delivery Forms": "bi-folder",
    "Enablement Forms": "bi-lightbulb",
    "Assigned Users": "bi-people",
  };

  const analyticsIconBg = {
    "Total Forms": "#e2ebfd",
    "Manager Forms": "#d2fbe7",
    "Delivery Forms": "#fbe7d2",
    "Enablement Forms": "#f9eaff",
    "Assigned Users": "#e2e7fa",
  };


  function AnalyticsStatCard({ title, value }) {
    return (
      <div className="ad-stat-card">
        <div
          className="stat-icon"
          style={{
            background: analyticsIconBg[title] || "#f0f0f0",
            width: 50,
            height: 50,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "8px"

          }}
        >
          <i
            className={`bi ${analyticsIcons[title]}`}
            style={{ fontSize: "26px", color: "#27235C" }}
          />
        </div>
        <div className="stat-content">
          <h3 className="stat-value">{value}</h3>
          <p className="stat-label">{title}</p>
        </div>
      </div>
    );
  }


  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
          setCurrentUserId(parseInt(storedUserId));
          return;
        }
        const res = await api.get("/Auth/current-user");
        const userId = res.data?.data?.userId || res.data?.userId;
        if (userId) {
          setCurrentUserId(userId);
          localStorage.setItem("userId", userId.toString());
        } else {
          toast.error("Unable to retrieve user information. Please login again.");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .get("/FormManagement/all")
      .then(({ data }) => {
        if (!mounted) return;
        const payload = data?.data ?? [];
        setRows(Array.isArray(payload) ? payload : [payload]);
      })
      .catch(() => toast.error("Failed to load forms."))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const fetchAssignedUsers = useCallback(async (formId) => {
    try {
      const response = await api.get(`/Assignments/form/${formId}`);
      const apiData = response.data?.data || response.data || [];
      const ids = apiData
        .filter((a) => (a.action || a.Action) === "Send")
        .map((a) => a.employeeId || a.EmployeeId || a.userId || a.UserId)
        .filter((id) => id !== undefined && id !== null);
      return ids;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!selectedFormId) {
      setUsers([]);
      setAssignedUserIds([]);
      return;
    }
    const fetchUsersBasedOnFormType = async () => {
      try {
        const selectedForm = rows.find((f) => f.formId === selectedFormId);
        if (!selectedForm) return;
        const creatorId = selectedForm?.createdBy;

        const assignedIds = await fetchAssignedUsers(selectedFormId);
        setAssignedUserIds(assignedIds);

        let filteredUsersData = [];
        if (selectedForm.type === "Manager") {
          const managersRes = await apiPort5113.get("/Employees/all-managers");
          filteredUsersData = Array.isArray(managersRes.data?.data)
            ? managersRes.data.data
            : [];
        } else {
          const usersRes = await api.get("/Assignments/upcoming-eligible");
          filteredUsersData = Array.isArray(usersRes.data?.data)
            ? usersRes.data.data
            : [];
        }

        filteredUsersData = filteredUsersData.filter((u) => {
          const role = (
            u.role ||
            u.Role ||
            u.roleCode ||
            u.RoleCode ||
            ""
          ).toUpperCase();
          if (userRoleFilter !== "All") {
            return role === userRoleFilter.toUpperCase();
          }
          return role !== "HR" && role !== "ADMIN";
        });

        filteredUsersData = filteredUsersData.filter(
          (u) =>
            u.userId !== creatorId &&
            !assignedIds.map(String).includes(String(u.userId))
        );

        if (userSearchQuery.trim() !== "") {
          const query = userSearchQuery.toLowerCase();
          filteredUsersData = filteredUsersData.filter(
            (u) =>
              u.firstName?.toLowerCase().includes(query) ||
              u.lastName?.toLowerCase().includes(query)
          );
        }

        setUsers(filteredUsersData);
        setUsersPage(1);
      } catch {
        toast.error("Failed to load eligible users");
      }
    };
    fetchUsersBasedOnFormType();
  }, [selectedFormId, rows, fetchAssignedUsers, userSearchQuery, userRoleFilter]);

  const filteredForms = useMemo(() => {
    return rows.filter((form) => {
      if (formSearchQuery.trim() !== "") {
        const query = formSearchQuery.toLowerCase();
        if (
          !(
            form.name?.toLowerCase().includes(query) ||
            form.type?.toLowerCase().includes(query)
          )
        )
          return false;
      }
      if (formTypeFilter !== "All" && form.type !== formTypeFilter)
        return false;
      if (formDeliveryFilter !== "All") {
        if (formDeliveryFilter === "Delivery and Enablement") {
          if (form.deliveryEnablement !== undefined) {
            const val = form.deliveryEnablement.toLowerCase();
            if (
              !(
                val === "deliveryandenablement" ||
                val === "both" ||
                (val.includes("delivery") && val.includes("enablement"))
              )
            ) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          if (form.deliveryEnablement !== formDeliveryFilter) return false;
        }
      }
      return true;
    });
  }, [rows, formSearchQuery, formTypeFilter, formDeliveryFilter]);

  const formsCount = filteredForms.length;
  const formsTotalPages = Math.ceil(formsCount / formsPerPage);
  const pagedForms = filteredForms.slice(
    (formsPage - 1) * formsPerPage,
    formsPage * formsPerPage
  );

  const usersCount = users.length;
  const usersTotalPages = Math.ceil(usersCount / usersPerPage);
  const pagedUsers = users.slice(
    (usersPage - 1) * usersPerPage,
    usersPage * usersPerPage
  );

  const eligibleUsers = users.filter((u) => !assignedUserIds.includes(u.userId));
  const allEligibleSelected =
    eligibleUsers.length > 0 &&
    eligibleUsers.every((u) => selectedUserIds.includes(u.userId));

  const onFormsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= formsTotalPages) {
      setFormsPage(newPage);
    }
  };

  const onUsersPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= usersTotalPages) {
      setUsersPage(newPage);
    }
  };

  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    setSelectedUserIds([]);
    setUsersPage(1);
  };

  const toggleUser = (userId) => {
    if (assignedUserIds.map(String).includes(String(userId))) {
      toast.error("This user has already been assigned this form!");
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const eligibleUsers = users.filter((u) => !assignedUserIds.includes(u.userId));
    const allSelected = eligibleUsers.every((u) =>
      selectedUserIds.includes(u.userId)
    );
    if (allSelected) {
      setSelectedUserIds([]);
      toast.success("All users deselected");
    } else {
      setSelectedUserIds(eligibleUsers.map((u) => u.userId));
      toast.success(`Selected ${eligibleUsers.length} users`);
    }
  };

  const openDeadlineModal = (action) => {
    if (!selectedFormId) {
      toast.error("Please select a form first.");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    if (!currentUserId) {
      toast.error(
        "User information not available. Please refresh the page or login again."
      );
      return;
    }
    setPendingAction(action);
    setShowDeadlineModal(true);
  };

  const confirmShare = async () => {
    setShowDeadlineModal(false);
    await shareFormToUsers(pendingAction);
  };

  const shareFormToUsers = async (actionType = "Send") => {
    if (!currentUserId) {
      toast.error(
        "User information not available. Please refresh the page or login again."
      );
      return;
    }
    setSharing(true);
    const loadingToast = toast.loading(
      actionType === "Send" ? "Sharing form to users..." : "Saving as draft..."
    );
    try {
      const payload = {
        formId: selectedFormId,
        userIds: selectedUserIds,
        assignedBy: currentUserId,
        action: actionType,
        deadlineInDays: deadlineInDays || 7,
      };

      const { data } = await api.post("/Assignments/initiate", payload);

      if (data?.success) {
        const appraisals = data.data || [];
        const skipped = data.skipped || [];
        const successfulUserIds = appraisals
          .map((a) => a.userId || a.UserId || a.employeeId || a.EmployeeId)
          .filter(Boolean);

        const alreadyAssignedIds = Array.isArray(skipped)
          ? skipped
            .filter((s) => s.Reason === "Already Assigned")
            .map((s) => s.UserId || s.userId || s.EmployeeId || s.employeeId)
            .filter(Boolean)
          : [];

        const allProcessedUserIds = [...successfulUserIds, ...alreadyAssignedIds];

        setAssignedUserIds((prev) => [...new Set([...prev, ...allProcessedUserIds])]);

        setUsers((prevUsers) =>
          prevUsers.filter(
            (u) => !allProcessedUserIds.map(String).includes(String(u.userId))
          )
        );

        setSelectedUserIds([]);

        if (appraisals.length > 0) {
          toast.success(
            `Successfully ${actionType === "Send" ? "shared" : "saved"} form to ${appraisals.length} user(s)!`,
            { id: loadingToast }
          );
        }
        if (skipped.length > 0) {
          const skippedInfo = skipped
            .map((s) => `User ${s.UserId || s.userId}: ${s.Reason}`)
            .join(", ");
          toast.info(`Some users were skipped: ${skippedInfo}`);
        }
        if (appraisals.length === 0 && skipped.length > 0) {
          toast.info(`Selected user(s) already have this form assigned.`, {
            id: loadingToast,
          });
        }
        if (appraisals.length === 0 && skipped.length === 0) {
          toast.error("No appraisals were assigned.", { id: loadingToast });
        }
      } else {
        toast.error("Failed to share form. (Unexpected API result)", {
          id: loadingToast,
        });
      }
    } catch (e) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.title ||
        (actionType === "Send" ? "Failed to share form." : "Failed to save draft.");
      toast.error(errorMsg, { id: loadingToast });
      console.error(" Error details:", e.response?.data);
    } finally {
      setSharing(false);
    }
  };

  const handleView = (form) => {
    setViewFormDetails(form);
  };
  

  const analytics = useMemo(() => {
    const totalForms = rows.length;
    const managerForms = rows.filter((f) => f.type === "Manager").length;
    const deliveryForms = rows.filter(
      (f) => f.deliveryEnablement === "Delivery"
    ).length;
    const enablementForms = rows.filter(
      (f) => f.deliveryEnablement === "Enablement"
    ).length;
    const assignedUsersCount = assignedUserIds.length;
    return {
      totalForms,
      managerForms,
      deliveryForms,
      enablementForms,
      assignedUsersCount,
    };
  }, [rows, assignedUserIds]);

  return (
    <div className="formlistperf">
      <div className="flp-root">
        <Breadcrumb
          items={[
            { label: 'Dashboard', path: '/hr/dashboard' },
            { label: 'Performance', path: '/hr/dashboard/performance' },
            { label: 'Initiate Form', path: null }
          ]}
        />

        <div className="row row-cols-2 row-cols-lg-3 row-cols-xl-5 g-4 mb-3">
          <div className="col">
            <AnalyticsStatCard title="Total Forms" value={analytics.totalForms} />
          </div>
          <div className="col">
            <AnalyticsStatCard title="Manager Forms" value={analytics.managerForms} />
          </div>
          <div className="col">
            <AnalyticsStatCard title="Delivery Forms" value={analytics.deliveryForms} />
          </div>
          <div className="col">
            <AnalyticsStatCard title="Enablement Forms" value={analytics.enablementForms} />
          </div>
          <div className="col">
            <AnalyticsStatCard title="Assigned Users" value={analytics.assignedUsersCount} />
          </div>
        </div>

        <ViewFormDetailsModal
          formDetails={viewFormDetails}
          onClose={() => setViewFormDetails(null)}
        />

        <DeadlineModal
          isOpen={showDeadlineModal}
          onClose={() => setShowDeadlineModal(false)}
          deadlineInDays={deadlineInDays}
          onDeadlineChange={setDeadlineInDays}
          onConfirm={confirmShare}
          pendingAction={pendingAction}
        />

        <div className="flp-main-area">
          {/* Forms Section */}
          <div className="flp-forms-section">
            <div className="flp-section-header">
              <div className="flp-header-left">
                <h3>Available Forms</h3>
                <span className="flp-count-badge">{filteredForms.length}</span>
              </div>
              <div className="flp-header-right">
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  overflow: "hidden"
                }}>
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={formSearchInput}
                    onChange={(e) => setFormSearchInput(e.target.value)}
                    style={{
                      border: "none",
                      padding: "8px 12px",
                      outline: "none",
                      flex: 1
                    }}
                  />
                  {formSearchQuery ? (
                    <button
                      onClick={() => {
                        setFormSearchQuery("");
                        setFormSearchInput("");
                        setFormsPage(1);
                      }}
                      style={{
                        backgroundColor: "#27235c",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        cursor: "pointer"
                      }}
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setFormSearchQuery(formSearchInput);
                        setFormsPage(1);
                      }}
                      style={{
                        backgroundColor: "#27235c",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        cursor: "pointer"
                      }}
                    >
                      Search
                    </button>
                  )}
                </div>

                <select
                  className="flp-filter-select"
                  value={formTypeFilter}
                  onChange={(e) => {
                    setFormTypeFilter(e.target.value);
                    setFormsPage(1);
                  }}
                >
                  {formTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  className="flp-filter-select"
                  value={formDeliveryFilter}
                  onChange={(e) => {
                    setFormDeliveryFilter(e.target.value);
                    setFormsPage(1);
                  }}
                >
                  {formDeliveryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flp-table-card">
              <div className="flp-table-wrapper">
                <table className="flp-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>TYPE</th>
                      <th>DELIVERY/ENABLEMENT</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="flp-empty-state">
                          <i className="bi bi-hourglass-split"></i>
                          <p>Loading forms...</p>
                        </td>
                      </tr>
                    ) : pagedForms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="flp-empty-state">
                          <i className="bi bi-inbox"></i>
                          <p>No forms found matching the criteria!</p>
                        </td>
                      </tr>
                    ) : (
                      pagedForms.map((f) => (
                        <tr
                          key={f.formId}
                          className={selectedFormId === f.formId ? "flp-selected-row" : ""}
                        >
                          <td><strong>{f.name}</strong></td>
                          <td><span className="flp-type-badge">{f.type}</span></td>
                          <td>
                            {f.deliveryEnablement === "Delivery"
                              ? "Delivery"
                              : f.deliveryEnablement === "Enablement"
                                ? "Enablement"
                                : "Delivery and Enablement"}
                          </td>
                          <td>
                            <div className="flp-action-buttons">
                              <button
                                className="themed-action-btn btn-view"
                                onClick={() => handleView(f)}
                                title="View Form"
                              >
                                <i className="bi bi-eye" />
                              </button>
                              <button
                                className="themed-action-btn btn-edit"
                                onClick={() => navigate(`/hr/dashboard/performance/create/${f.formId}`)}
                                title="Edit Form"
                              >
                                <i className="bi bi-pencil" />
                              </button>
                              <button
                                className={`themed-action-btn btn-choose${selectedFormId === f.formId ? " btn-active" : ""}`}
                                onClick={() => handleFormSelect(f.formId)}
                                title="Choose Form"
                              >
                                <i className="bi bi-hand-index" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flp-pagination-container">
                <div className="flp-pagination-info">
                  <span className="flp-pagination-label">Rows per page:</span>
                  <select
                    className="flp-pagination-select"
                    value={formsPerPage}
                    onChange={(e) => {
                      setFormsPerPage(Number(e.target.value));
                      setFormsPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <nav className="flp-pagination-nav">
                  <ul className="flp-pagination">
                    <li className={`flp-page-item ${formsPage === 1 ? "flp-disabled" : ""}`}>
                      <button className="flp-page-link" onClick={() => onFormsPageChange(formsPage - 1)}>&laquo;</button>
                    </li>
                    {Array.from({ length: formsTotalPages }, (_, i) => (
                      <li key={i + 1} className={`flp-page-item ${formsPage === i + 1 ? "flp-active" : ""}`}>
                        <button className="flp-page-link" onClick={() => onFormsPageChange(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`flp-page-item ${formsPage === formsTotalPages ? "flp-disabled" : ""}`}>
                      <button className="flp-page-link" onClick={() => onFormsPageChange(formsPage + 1)}>&raquo;</button>
                    </li>
                  </ul>
                </nav>

                <div className="flp-pagination-status">
                  {formsCount === 0
                    ? "No forms to display"
                    : `Showing ${Math.min((formsPage - 1) * formsPerPage + 1, formsCount)}-${Math.min(formsPage * formsPerPage, formsCount)} of ${formsCount} forms`}
                </div>
              </div>
            </div>
          </div>

          {/* Users Panel */}
          <div className="flp-users-panel">
            <div className="flp-panel-header">
              <h3><i className="bi bi-people-fill"></i> Select Users</h3>
              {selectedFormId && (
                <div className="flp-users-filters">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flex: 1
                  }}>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchInput}
                      onChange={(e) => setUserSearchInput(e.target.value)}
                      style={{
                        border: "none",
                        padding: "8px 12px",
                        outline: "none",
                        flex: 1
                      }}
                    />
                    {userSearchQuery ? (
                      <button
                        onClick={() => {
                          setUserSearchQuery("");
                          setUserSearchInput("");
                          setUsersPage(1);
                        }}
                        style={{
                          backgroundColor: "#27235c",
                          color: "#fff",
                          border: "none",
                          padding: "8px 12px",
                          cursor: "pointer"
                        }}
                      >
                        Clear
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setUserSearchQuery(userSearchInput);
                          setUsersPage(1);
                        }}
                        style={{
                          backgroundColor: "#27235c",
                          color: "#fff",
                          border: "none",
                          padding: "8px 12px",
                          cursor: "pointer"
                        }}
                      >
                        Search
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleSelectAll}
                    className="flp-btn-select-all"
                    style={{
                      background: allEligibleSelected ? "#AC5098" : "#27235C",
                      color: "#fff"
                    }}
                    title={allEligibleSelected ? "Deselect All" : "Select All"}
                  >
                    {allEligibleSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
              )}
            </div>

            <div className="flp-panel-body">
              {!selectedFormId ? (
                <div className="flp-empty-box">
                  <i className="bi bi-hand-index"></i>
                  <p>Please choose a form to select users</p>
                </div>
              ) : pagedUsers.length === 0 ? (
                <div className="flp-empty-box">
                  <i className="bi bi-inbox"></i>
                  <p>No users available</p>
                </div>
              ) : (
                <>
                  <div className="flp-selected-count">
                    <i className="bi bi-check-circle-fill"></i>
                    <strong>{selectedUserIds.length}</strong> user(s) selected
                  </div>
                  {pagedUsers.map((user) => {
                    const isAssigned = assignedUserIds.map(String).includes(String(user.userId));
                    const isSelected = selectedUserIds.includes(user.userId);
                    return (
                      <div
                        key={user.userId}
                        className={`flp-user-card ${isSelected ? "flp-selected" : ""} ${isAssigned ? "flp-disabled" : ""}`}
                        onClick={() => !isAssigned && toggleUser(user.userId)}
                      >
                        <input type="checkbox" checked={isSelected} readOnly disabled={isAssigned} />
                        <div className="flp-user-info">
                          <strong>{user.firstName} {user.lastName}</strong>
                          {isAssigned && (
                            <span className="flp-assigned-tag">
                              <i className="bi bi-lock-fill"></i> Assigned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {usersTotalPages > 0 && (
              <div className="flp-pagination-container">
                <div className="flp-pagination-info">
                  <span className="flp-pagination-label">Rows per page:</span>
                  <select
                    className="flp-pagination-select"
                    value={usersPerPage}
                    onChange={(e) => {
                      setUsersPerPage(Number(e.target.value));
                      setUsersPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <nav className="flp-pagination-nav">
                  <ul className="flp-pagination">
                    <li className={`flp-page-item ${usersPage === 1 ? "flp-disabled" : ""}`}>
                      <button className="flp-page-link" onClick={() => onUsersPageChange(usersPage - 1)}>&laquo;</button>
                    </li>
                    {Array.from({ length: usersTotalPages }, (_, i) => (
                      <li key={i + 1} className={`flp-page-item ${usersPage === i + 1 ? "flp-active" : ""}`}>
                        <button className="flp-page-link" onClick={() => onUsersPageChange(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`flp-page-item ${usersPage === usersTotalPages ? "flp-disabled" : ""}`}>
                      <button className="flp-page-link" onClick={() => onUsersPageChange(usersPage + 1)}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

            <div className="flp-panel-footer">
              <button
                className="flp-btn-share"
                onClick={() => openDeadlineModal("Send")}
                disabled={!selectedFormId || selectedUserIds.length === 0 || !currentUserId}
              >
                <i className="bi bi-send-fill"></i> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default FormsList;