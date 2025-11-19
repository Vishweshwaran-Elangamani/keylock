import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../../../services/performancemanagement/hr/api";
import "../../../styles/performancemanagement/hr/FormList.css";
 
// Import modals
import ViewFormDetailsModal from "../../../components/performance_management/modals/FormsList/ViewFormDetailsModal";
import DeadlineModal from "../../../components/performance_management/modals/FormsList/DeadlineModal";
 
function FormsList() {
  const location = useLocation();
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
 
  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [userSearchQuery, setUserSearchQuery] = useState("");
 
  const formTypes = ["All", ...new Set(rows.map(f => f.type).filter(Boolean))];
 
  // Load current user on mount
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
 
  // Load all forms
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
 
  // Fetch assigned users for selected form
  const fetchAssignedUsers = useCallback(async (formId) => {
    try {
      const response = await api.get(`/AppraisalProcess/form/${formId}`);
      const apiData = response.data?.data || response.data || [];
      const ids = apiData
        .filter(a => (a.action || a.Action) === "Send")
        .map(a => a.employeeId || a.EmployeeId || a.userId || a.UserId)
        .filter(id => id !== undefined && id !== null);
      return ids;
    } catch {
      return [];
    }
  }, []);
 
  // Load users based on form type and filter
  useEffect(() => {
    if (!selectedFormId) {
      setUsers([]);
      setAssignedUserIds([]);
      return;
    }
    const fetchUsersBasedOnFormType = async () => {
      try {
        const selectedForm = rows.find(f => f.formId === selectedFormId);
        if (!selectedForm) return;
        const creatorId = selectedForm?.createdBy;
       
        // Fetch assigned users from backend
        const assignedIds = await fetchAssignedUsers(selectedFormId);
        setAssignedUserIds(assignedIds);
 
        let filteredUsers = [];
        if (selectedForm.type === "Manager") {
          const managersRes = await api.get("/AppraisalProcess/all-managers");
          filteredUsers = Array.isArray(managersRes.data?.data)
            ? managersRes.data.data
            : [];
        } else {
          const usersRes = await api.get("/AppraisalProcess/upcoming-eligible");
          filteredUsers = Array.isArray(usersRes.data?.data)
            ? usersRes.data.data
            : [];
        }
 
        // Filter out HR/Admin roles
        filteredUsers = filteredUsers.filter(u => {
          const role = (u.role || u.Role || u.roleCode || u.RoleCode || "").toUpperCase();
          return role !== "HR" && role !== "ADMIN";
        });
 
        // Filter out creator and already assigned users
        filteredUsers = filteredUsers.filter(
          u =>
            u.userId !== creatorId &&
            !assignedIds.map(String).includes(String(u.userId))
        );
        setUsers(filteredUsers);
      } catch {
        toast.error("Failed to load eligible users");
      }
    };
    fetchUsersBasedOnFormType();
  }, [selectedFormId, rows, fetchAssignedUsers]);
 
  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    setSelectedUserIds([]);
  };
 
  const toggleUser = userId => {
    if (assignedUserIds.map(String).includes(String(userId))) {
      toast.error("This user has already been assigned this form!");
      return;
    }
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
 
  // Check if all eligible users are selected
  const eligibleUsers = users.filter(u => !assignedUserIds.includes(u.userId));
  const allEligibleSelected = eligibleUsers.length > 0 && 
    eligibleUsers.every(u => selectedUserIds.includes(u.userId));

  // Toggle Select All / Deselect All
  const handleSelectAll = () => {
    const eligibleUsers = users.filter(
      u => !assignedUserIds.includes(u.userId)
    );
    
    const allSelected = eligibleUsers.every(u => selectedUserIds.includes(u.userId));
    
    if (allSelected) {
      // Deselect all
      setSelectedUserIds([]);
      toast.success("All users deselected");
    } else {
      // Select all
      setSelectedUserIds(eligibleUsers.map(u => u.userId));
      toast.success(`Selected ${eligibleUsers.length} users`);
    }
  };
 
  const openDeadlineModal = action => {
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
      actionType === "Send"
        ? "Sharing form to users..."
        : "Saving as draft..."
    );
 
    try {
      const payload = {
        formId: selectedFormId,
        userIds: selectedUserIds,
        assignedBy: currentUserId,
        action: actionType,
        deadlineInDays: deadlineInDays || 7,
      };
 
      const { data } = await api.post("/AppraisalProcess/initiate", payload);
 
      // Handle successful response
      if (data?.success) {
        const appraisals = data.data || [];
        const skipped = data.skipped || [];
        const successfulUserIds = appraisals
          .map(a => a.userId || a.UserId || a.employeeId || a.EmployeeId)
          .filter(Boolean);
       
        const alreadyAssignedIds = Array.isArray(skipped)
          ? skipped
              .filter(s => s.Reason === "Already Assigned")
              .map(s => s.UserId || s.userId || s.EmployeeId || s.employeeId)
              .filter(Boolean)
          : [];
 
        const allProcessedUserIds = [
          ...successfulUserIds,
          ...alreadyAssignedIds,
        ];
 
        // Update assigned users permanently
        setAssignedUserIds(prev => [
          ...new Set([...prev, ...allProcessedUserIds]),
        ]);
 
        // Remove from available users list
        setUsers(prevUsers =>
          prevUsers.filter(
            u =>
              !allProcessedUserIds
                .map(String)
                .includes(String(u.userId))
          )
        );
 
        setSelectedUserIds([]);
 
        if (appraisals.length > 0) {
          toast.success(
            `Successfully ${
              actionType === "Send" ? "shared" : "saved"
            } form to ${appraisals.length} user(s)!`,
            { id: loadingToast }
          );
        }
        if (skipped.length > 0) {
          const skippedInfo = skipped
            .map(s => `User ${s.UserId || s.userId}: ${s.Reason}`)
            .join(", ");
          toast.info(`Some users were skipped: ${skippedInfo}`);
        }
        if (appraisals.length === 0 && skipped.length > 0) {
          toast.info(
            `Selected user(s) already have this form assigned.`,
            { id: loadingToast }
          );
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
        (actionType === "Send"
          ? "Failed to share form."
          : "Failed to save draft.");
      toast.error(errorMsg, { id: loadingToast });
      console.error("❌ Error details:", e.response?.data);
    } finally {
      setSharing(false);
    }
  };
 
  const handleView = form => {
    setViewFormDetails(form);
  };
 
  const filteredForms = rows.filter(form => {
    if (formSearchQuery) {
      const query = formSearchQuery.toLowerCase();
      if (
        !(
          form.name?.toLowerCase().includes(query) ||
          form.type?.toLowerCase().includes(query)
        )
      )
        return false;
    }
    if (formTypeFilter !== "All" && form.type !== formTypeFilter) return false;
    return true;
  });
 
  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });
 
  return (
    <>
      <div className="hrformlist-page-container">
        {/* View Form Details Modal */}
        <ViewFormDetailsModal
          formDetails={viewFormDetails}
          onClose={() => setViewFormDetails(null)}
        />
 
        {/* Deadline Modal */}
        <DeadlineModal
          isOpen={showDeadlineModal}
          onClose={() => setShowDeadlineModal(false)}
          deadlineInDays={deadlineInDays}
          onDeadlineChange={setDeadlineInDays}
          onConfirm={confirmShare}
          pendingAction={pendingAction}
        />
 
        {/* Main Content */}
        <div className="hrformlist-main-area">
          {/* Forms Section */}
          <div className="hrformlist-forms-section">
            <div className="hrformlist-section-header">
              <div className="hrformlist-header-left">
                <h3>
                  <i className="bi bi-list-ul"></i> Available Forms
                </h3>
                <span className="hrformlist-count-badge">
                  {filteredForms.length} forms
                </span>
              </div>
              <div className="hrformlist-header-right">
                <div className="hrformlist-search-box">
                  <i className="bi bi-search hrformlist-search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={formSearchQuery}
                    onChange={e => setFormSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={formTypeFilter}
                  onChange={e => setFormTypeFilter(e.target.value)}
                >
                  {formTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hrformlist-table-scroll">
              <table className="hrformlist-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>TYPE</th>
                    <th>DELIVERY/ENABLEMENT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map(f => (
                    <tr
                      key={f.formId}
                      className={
                        selectedFormId === f.formId ? "hrformlist-selected" : ""
                      }
                    >
                      <td>
                        <strong>{f.name}</strong>
                      </td>
                      <td>
                        <span className="hrformlist-type-pill">{f.type}</span>
                      </td>
                      <td>
                        {f.deliveryEnablement === "Delivery"
                          ? "Delivery"
                          : f.deliveryEnablement === "Enablement"
                            ? "Enablement"
                            : "Delivery and Enablement"}
                      </td>
                      <td className="hrformlist-actions-cell">
                        <button onClick={() => handleView(f)}>
                          <i className="bi bi-eye-fill"></i> View
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/hr/dashboard/performance/create/${f.formId}`
                            )
                          }
                        >
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        <button
                          onClick={() => handleFormSelect(f.formId)}
                          className={
                            selectedFormId === f.formId ? "hrformlist-active" : ""
                          }
                        >
                          <i className="bi bi-hand-index"></i> Choose
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
 
          {/* Users Panel */}
          <div className="hrformlist-users-panel">
            <div className="hrformlist-users-panel-header">
              <h3>
                <i className="bi bi-people-fill"></i> Select Users
                {selectedFormId ? ` #${selectedFormId}` : ""}
              </h3>
            </div>
            {selectedFormId && users.length > 0 && (
              <div className="hrformlist-user-search-container">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="hrformlist-user-search-input"
                />
               <button 
  onClick={handleSelectAll} 
  className="hrformlist-btn-select-all"
  style={{
    background: allEligibleSelected ? " #AC5098" : "#27235C",
    color: "#fff",
    border: "none",
    transition: "all 0.2s"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.opacity = "0.9";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.opacity = "1";
  }}
>
  <i className={allEligibleSelected ? "bi bi-x-circle" : "bi bi-check2-all"}></i> 
  {allEligibleSelected ? "Deselect All" : "Select All"}
</button>

              </div>

            )}
            <div className="hrformlist-users-panel-body">
              {!selectedFormId ? (
                <div className="hrformlist-empty-box">
                  <i className="bi bi-hand-index"></i>
                  <p>Please choose a form to select users</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="hrformlist-empty-box">
                  <i className="bi bi-inbox"></i>
                  <p>No users available</p>
                </div>
              ) : (
                <>
                  <div className="hrformlist-selected-count">
                    <i className="bi bi-check-circle-fill"></i>
                    <strong>{selectedUserIds.length}</strong> user(s)
                    selected
                  </div>
                  {filteredUsers.map(user => {
                    const isAssigned = assignedUserIds.map(String).includes(String(user.userId));
                    const isSelected = selectedUserIds.includes(user.userId);
                    return (
                      <div
                        key={user.userId}
                        className={`hrformlist-user-card ${isSelected ? "hrformlist-selected" : ""} ${
                          isAssigned ? "hrformlist-disabled" : ""
                        }`}
                        onClick={() =>
                          !isAssigned && toggleUser(user.userId)
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          disabled={isAssigned}
                        />
                        <div className="hrformlist-user-info">
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          {isAssigned && (
                            <span className="hrformlist-assigned-tag">
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
            <div className="hrformlist-users-panel-footer">
              <button
                onClick={() => openDeadlineModal("Send")}
                disabled={
                  !selectedFormId ||
                  selectedUserIds.length === 0 ||
                  !currentUserId
                }
              >
                <i className="bi bi-send-fill"></i> Share
              </button>
              <button
                onClick={() => openDeadlineModal("Save as Draft")}
                disabled={
                  !selectedFormId ||
                  selectedUserIds.length === 0 ||
                  !currentUserId
                }
              >
                <i className="bi bi-save-fill"></i> Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
 
export default FormsList;
