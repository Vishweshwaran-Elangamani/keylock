import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../../../services/performancemanagement/hr/api";

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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewFormDetails, setViewFormDetails] = useState(null);
  
  // ✅ NEW: State for current logged-in user
  const [currentUserId, setCurrentUserId] = useState(null);

  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const editMode = location.state?.editMode || false;
  const draftData = location.state || {};

  const formTypes = ["All", ...new Set(rows.map(f => f.type).filter(Boolean))];

  // ✅ NEW: Fetch current logged-in user ID on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Option 1: If you store userId in localStorage after login
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setCurrentUserId(parseInt(storedUserId));
          return;
        }

        // Option 2: If you have an API endpoint to get current user
        const response = await api.get('/Auth/current-user'); // Adjust endpoint as needed
        const userId = response.data?.data?.userId || response.data?.userId;
        if (userId) {
          setCurrentUserId(userId);
          localStorage.setItem('userId', userId.toString());
        } else {
          toast.error("Unable to retrieve user information. Please login again.");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        toast.error("Failed to get user information. Please login again.");
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let mounted = true;
    api.get("/FormManagement/all")
      .then(({ data }) => {
        if (!mounted) return;
        const payload = data?.data ?? [];
        setRows(Array.isArray(payload) ? payload : [payload]);
        if (payload.length === 0) toast.info("No forms found.");
      })
      .catch(() => toast.error("Failed to load forms."))
      .finally(() => mounted && setLoading(false));
    return () => mounted = false;
  }, []);

  const fetchAssignedUsers = useCallback(async (formId) => {
    try {
      const response = await api.get(`/AppraisalProcess/form/${formId}`);
      const apiData = response.data?.data || response.data || [];
      const ids = apiData.filter(a => (a.action || a.Action) === "Send")
        .map(a => a.employeeId || a.EmployeeId || a.userId || a.UserId || a.employee_id || a.user_id)
        .filter(id => id !== undefined && id !== null);
      if (ids.length > 0) toast.info(`${ids.length} user(s) already assigned to this form.`);
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
        const selectedForm = rows.find(f => f.formId === selectedFormId);
        if (!selectedForm) return;
        const creatorId = selectedForm?.createdBy;
        const assignedIds = await fetchAssignedUsers(selectedFormId);
        setAssignedUserIds(assignedIds);
        let filteredUsers = [];
        
        if (selectedForm.type === "Manager") {
          const managersRes = await api.get("/AppraisalProcess/all-managers");
          filteredUsers = Array.isArray(managersRes.data?.data) ? managersRes.data.data : [];
        } else {
          const usersRes = await api.get("/AppraisalProcess/upcoming-eligible");
          filteredUsers = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
        }
        
        filteredUsers = filteredUsers.filter(u => {
          const role = (u.role || u.Role || u.roleCode || u.RoleCode || '').toUpperCase();
          return role !== 'HR' && role !== 'ADMIN';
        });
        filteredUsers = filteredUsers.filter(u =>
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

  useEffect(() => {
    if (editMode && draftData.formId && draftData.employeeIds) {
      setSelectedFormId(draftData.formId);
      setSelectedUserIds(draftData.employeeIds);
    }
  }, [editMode, draftData.formId, draftData.employeeIds]);

  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    setSelectedUserIds([]);
  };

  const toggleUser = (userId) => {
    if (assignedUserIds.map(String).includes(String(userId))) {
      toast.error("This user has already been assigned this form!");
      return;
    }
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
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
    // ✅ NEW: Check if current user ID is available
    if (!currentUserId) {
      toast.error("User information not available. Please refresh the page or login again.");
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
    // ✅ NEW: Validate current user ID before making API call
    if (!currentUserId) {
      toast.error("User information not available. Please refresh the page or login again.");
      return;
    }

    setSharing(true);
    const loadingToast = toast.loading(actionType === "Send" ? "Sharing form to users..." : "Saving as draft...");
    try {
      if (editMode && draftData.assignmentIds) {
        const updates = draftData.assignmentIds.map(id =>
          api.put(`/AppraisalProcess/${id}`, { action: actionType })
        );
        await Promise.all(updates);
        toast.success(actionType === "Send" ? "Draft sent successfully!" : "Draft updated successfully!", { id: loadingToast });
        setTimeout(() => navigate("/drafts"), 1500);
      } else {
        // ✅ UPDATED: Use dynamic currentUserId instead of hardcoded value
        const payload = {
          formId: selectedFormId,
          userIds: selectedUserIds,
          assignedBy: currentUserId, // ✅ Dynamic user ID
          action: actionType,
          deadlineInDays: deadlineInDays || 7
        };

        console.log("📤 Sending payload:", payload); // For debugging

        const { data } = await api.post("/AppraisalProcess/initiate", payload);
        const appraisals = data?.data || [];
        const skipped = data?.skipped || [];
        const successfulUserIds = appraisals.map(a => a.userId || a.UserId).filter(Boolean);
        const alreadyAssignedIds = skipped.filter(s => s.Reason === "Already Assigned").map(s => s.UserId || s.userId).filter(Boolean);
        const allProcessedUserIds = [...successfulUserIds, ...alreadyAssignedIds];
        setAssignedUserIds(prev => [...new Set([...prev, ...allProcessedUserIds])]);
        setUsers(prevUsers => prevUsers.filter(u => !allProcessedUserIds.map(String).includes(String(u.userId))));
        setSelectedUserIds([]);
        if (appraisals.length > 0) {
          toast.success(`Successfully ${actionType === "Send" ? "shared" : "saved"} form to ${appraisals.length} user(s)!`, { id: loadingToast });
          if (skipped.length > 0) {
            const skippedReasons = skipped.map(s => `User ${s.UserId}: ${s.Reason}`).join(', ');
            toast.info(`Note: ${skippedReasons}`);
          }
        } else if (skipped.length > 0) {
          toast.info(`Selected user(s) already have this form assigned.`, { id: loadingToast });
        } else {
          toast.error("No appraisals were created.", { id: loadingToast });
        }
      }
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e?.response?.data?.title || (actionType === "Send" ? "Failed to share form." : "Failed to save draft.");
      toast.error(errorMsg, { id: loadingToast });
      console.error("❌ Error details:", e.response?.data); // For debugging
    } finally {
      setSharing(false);
    }
  };

  const handleView = (form) => {
    setViewFormDetails(form);
  };

  const handleEdit = (formId) => {
  navigate(`/hr/dashboard/performance/create/${formId}`);
};

  const handleDelete = (formId) => {
    setDeleteConfirmId(formId);
  };

 
const confirmDeleteForm = async () => {

  const formId = deleteConfirmId;

  setDeleteConfirmId(null);

  const loadingToast = toast.loading("Checking form assignments...");

  try {

    // First, check if form has been initiated/assigned

    const checkResponse = await api.get(`/AppraisalProcess/form/${formId}`);

    const assignments = checkResponse.data?.data || checkResponse.data || [];

    if (assignments.length > 0) {

      // Form has assignments - ask for confirmation

      toast.dismiss(loadingToast);

      const confirmed = window.confirm(

        `⚠️ WARNING: This form has been assigned to ${assignments.length} user(s).\n\n` +

        `Deleting it will remove ALL appraisal assignments.\n\n` +

        `Are you absolutely sure you want to proceed?`

      );

      if (!confirmed) {

        toast.info("Form deletion cancelled.");

        return;

      }

      const deleteLoadingToast = toast.loading("Deleting form and all assignments...");

      // Delete all assignments first

      try {

        const deletePromises = assignments.map(assignment => 

          api.delete(`/AppraisalProcess/${assignment.appraisalProcessId || assignment.id}`)

        );

        await Promise.all(deletePromises);

        // Now delete the form

        await api.delete(`/FormManagement/${formId}`);

        setRows(rows.filter(f => f.formId !== formId));

        toast.success(

          `Form and ${assignments.length} assignment(s) deleted successfully!`,

          { id: deleteLoadingToast }

        );

      } catch (deleteError) {

        console.error("Error deleting assignments:", deleteError);

        toast.error(

          "Failed to delete all assignments. Please try again or contact support.",

          { id: deleteLoadingToast }

        );

      }

    } else {

      // No assignments - safe to delete

      toast.update(loadingToast, {

        render: "Deleting form...",

        isLoading: true

      });

      await api.delete(`/FormManagement/${formId}`);

      setRows(rows.filter(f => f.formId !== formId));

      toast.success("Form deleted successfully!", { id: loadingToast });

    }

  } catch (error) {

    console.error("Delete error:", error);

    if (error.response?.status === 400) {

      toast.error(

        "Cannot delete this form. Database constraints prevent deletion. Please contact your system administrator.",

        { id: loadingToast, duration: 6000 }

      );

    } else if (error.response?.status === 404) {

      toast.error("Form not found. It may have already been deleted.", { id: loadingToast });

      setRows(rows.filter(f => f.formId !== formId));

    } else if (error.response?.status === 403) {

      toast.error("You don't have permission to delete this form.", { id: loadingToast });

    } else {

      const errorMsg = error.response?.data?.message || 

                      error.response?.data?.title || 

                      "Failed to delete form. Please try again.";

      toast.error(errorMsg, { id: loadingToast });

    }

  }

};

 
  const cancelDeleteForm = () => {
    setDeleteConfirmId(null);
  };

  const filteredForms = rows.filter(form => {
    if (formSearchQuery) {
      const query = formSearchQuery.toLowerCase();
      if (!(
        form.name?.toLowerCase().includes(query) ||
        form.type?.toLowerCase().includes(query) ||
        form.deliveryEnablement?.toLowerCase().includes(query) ||
        String(form.formId).includes(query)
      )) return false;
    }
    if (formTypeFilter !== "All" && form.type !== formTypeFilter) return false;
    return true;
  });

  const filteredUsers = users.filter(user => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .slide-in { animation: slideIn 0.5s ease-out; }
        .slide-in-right { animation: slideInRight 0.5s ease-out; }
        .scale-in { animation: scaleIn 0.3s ease-out; }
        
        .btn-hover:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(39, 35, 92, 0.35) !important;
          background-position: 100% 0;
        }
        
        .btn-hover:active {
          transform: translateY(-1px) scale(0.98);
        }
      `}</style>

      <div style={styles.pageContainer}>
        <ToastContainer position="top-right" />

        {/* View Form Details Modal */}
        {viewFormDetails && (
          <div style={styles.modalOverlay} onClick={() => setViewFormDetails(null)} className="fade-in">
            <div style={styles.viewModal} onClick={e => e.stopPropagation()} className="scale-in">
              <div style={styles.viewModalHeader}>
                <h3 style={styles.viewModalTitle}>
                  <i className="bi bi-eye-fill"></i> Form Details
                </h3>
                <button style={styles.closeBtn} onClick={() => setViewFormDetails(null)} className="btn-hover">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div style={styles.viewModalBody}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-hash"></i> Form ID:</span>
                  <span style={styles.detailValue}>#{viewFormDetails.formId}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-file-text"></i> Form Name:</span>
                  <span style={styles.detailValue}>{viewFormDetails.name}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-tag"></i> Type:</span>
                  <span style={styles.typeBadge}>{viewFormDetails.type}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-briefcase"></i> Delivery/Enablement:</span>
                  <span style={styles.detailValue}>{viewFormDetails.deliveryEnablement || "N/A"}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-person"></i> Created By:</span>
                  <span style={styles.detailValue}>{viewFormDetails.createdByName || viewFormDetails.createdBy}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}><i className="bi bi-calendar"></i> Created At:</span>
                  <span style={styles.detailValue}>
                    {viewFormDetails.createdAt ? new Date(viewFormDetails.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>
                <div style={styles.detailRowFull}>
                  <span style={styles.detailLabel}><i className="bi bi-list-check"></i> Competencies:</span>
                  {viewFormDetails.competencies && viewFormDetails.competencies.length > 0 ? (
                    <div style={styles.competenciesList}>
                      {viewFormDetails.competencies.map((comp, idx) => (
                        <div key={comp.competencyId || idx} style={styles.competencyCard}>
                          <div style={styles.competencyHeader}>
                            <span style={styles.competencyName}>{comp.name}</span>
                            <span style={styles.competencyId}>ID: {comp.competencyId}</span>
                          </div>
                          <p style={styles.competencyDesc}>{comp.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={styles.noData}>No competencies defined</span>
                  )}
                </div>
              </div>
              <div style={styles.viewModalFooter}>
                <button style={styles.btnCloseModal} onClick={() => setViewFormDetails(null)} className="btn-hover">
                  <i className="bi bi-x-circle"></i> Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirmId && (
          <div style={styles.modalOverlay} onClick={cancelDeleteForm} className="fade-in">
            <div style={styles.deleteModal} onClick={e => e.stopPropagation()} className="scale-in">
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "56px", color: "#DC3545", marginBottom: "20px" }}></i>
              <h3 style={styles.modalTitle}>Delete Form?</h3>
              <p style={styles.modalText}>Are you sure you want to delete this form? This action cannot be undone.</p>
              <div style={styles.modalButtons}>
                <button style={styles.btnCancelModal} onClick={cancelDeleteForm} className="btn-hover">
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button style={styles.btnDeleteModal} onClick={confirmDeleteForm} className="btn-hover">
                  <i className="bi bi-trash-fill"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Modal */}
        {showDeadlineModal && (
          <div style={styles.modalOverlay} onClick={() => setShowDeadlineModal(false)} className="fade-in">
            <div style={styles.deadlineModal} onClick={e => e.stopPropagation()} className="scale-in">
              <i className="bi bi-calendar-check" style={{ fontSize: "56px", color: "#27235C", marginBottom: "20px" }}></i>
              <h3 style={styles.modalTitle}>Set Deadline</h3>
              <p style={styles.modalText}>How many days should employees have to complete this form?</p>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel} htmlFor="deadlineInput">
                  <i className="bi bi-clock-history"></i> Deadline (in days):
                </label>
                <input
                  id="deadlineInput"
                  type="number"
                  min="1"
                  max="365"
                  value={deadlineInDays}
                  onChange={e => setDeadlineInDays(parseInt(e.target.value) || 7)}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalButtons}>
                <button style={styles.btnCancelModal} onClick={() => setShowDeadlineModal(false)} className="btn-hover">
                  <i className="bi bi-x-lg"></i> Cancel
                </button>
                <button style={styles.btnConfirmModal} onClick={confirmShare} className="btn-hover">
                  <i className="bi bi-check-lg"></i> {pendingAction === "Send" ? "Share Form" : "Save Draft"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={styles.mainArea}>
          {/* Forms Section */}
          <div style={styles.formsSection} className="slide-in">
            {/* Fixed Header */}
            <div style={styles.sectionHeader}>
              <div style={styles.headerLeft}>
                <h3 style={styles.sectionTitle}><i className="bi bi-list-ul"></i> Available Forms</h3>
                <span style={styles.countBadge}>{filteredForms.length} forms</span>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.searchBox}>
                  <i className="bi bi-search" style={styles.searchIcon}></i>
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={formSearchQuery}
                    onChange={e => setFormSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <div style={styles.filterGroup}>
                  <i className="bi bi-funnel-fill" style={{ color: "#6B7280", marginRight: "8px", fontSize: "16px" }}></i>
                  <select value={formTypeFilter} onChange={e => setFormTypeFilter(e.target.value)} style={styles.filterSelect}>
                    {formTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Scrollable Table */}
            {loading ? (
              <div style={styles.loadingBox}>
                <div style={styles.spinner}></div>
                <p style={{ marginTop: "16px", color: "#6B7280", fontWeight: "500" }}>Loading forms...</p>
              </div>
            ) : (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}><i className="bi bi-file-text"></i> NAME</th>
                      <th style={{ ...styles.th, width: "130px" }}><i className="bi bi-tag"></i> TYPE</th>
                      <th style={{ ...styles.th, width: "160px" }}><i className="bi bi-briefcase"></i> DELIVERY</th>
                      <th style={{ ...styles.th, width: "400px", textAlign: "center" }}><i className="bi bi-gear"></i> ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredForms.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "80px 20px", border: "none" }}>
                          <i className="bi bi-inbox" style={{ fontSize: "56px", color: "#D1D5DB", display: "block", marginBottom: "16px" }}></i>
                          <span style={{ color: "#9CA3AF", fontSize: "15px" }}>No forms found.</span>
                        </td>
                      </tr>
                    ) : filteredForms.map(f => (
                      <tr key={f.formId} style={{
                        ...styles.tr,
                        ...(selectedFormId === f.formId ? styles.trSelected : {})
                      }}>
                        <td style={styles.td}><strong style={{ color: "#1F2937", fontSize: "14px" }}>{f.name}</strong></td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.typePill,
                            background: f.type === "Manager" ? "linear-gradient(135deg, #AC5098, #97247E)" : "linear-gradient(135deg, #3B82F6, #2563EB)"
                          }}>
                            {f.type}
                          </span>
                        </td>
                        <td style={styles.td}><span style={{ fontSize: "13px", color: "#6B7280" }}>{f.deliveryEnablement}</span></td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <div style={styles.actionBtns}>
                            <button style={styles.btnAction} onClick={() => handleView(f)} title="View Details" className="btn-hover">
                              <i className="bi bi-eye-fill"></i> View
                            </button>
                            <button style={styles.btnAction} onClick={() => handleEdit(f.formId)} title="Edit Form" className="btn-hover">
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button 
                              style={selectedFormId === f.formId ? styles.btnChooseActive : styles.btnAction} 
                              onClick={() => handleFormSelect(f.formId)} 
                              title="Choose to Share"
                              className="btn-hover"
                            >
                              <i className="bi bi-hand-index"></i> Choose
                            </button>
                            <button style={styles.btnAction} onClick={() => handleDelete(f.formId)} title="Delete Form" className="btn-hover">
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Panel - Always Visible */}
          <div style={styles.usersPanel} className="slide-in-right">
            {/* Fixed Header */}
            <div style={styles.usersPanelHeader}>
              <h3 style={styles.usersPanelTitle}>
                <i className="bi bi-people-fill"></i> Select Users for Form {selectedFormId ? `#${selectedFormId}` : ''}
              </h3>
              {selectedFormId && (
                <button style={styles.closePanelBtn} onClick={() => setSelectedFormId(null)} title="Clear Selection" className="btn-hover">
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>

            {/* User Search Box */}
            {selectedFormId && users.length > 0 && (
              <div style={styles.userSearchContainer}>
                <div style={styles.searchBox}>
                  <i className="bi bi-search" style={styles.searchIcon}></i>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    style={styles.userSearchInput}
                  />
                </div>
              </div>
            )}

            {/* Scrollable User List */}
            <div style={styles.usersPanelBody}>
              {!selectedFormId ? (
                <div style={styles.emptyBox} className="fade-in">
                  <i className="bi bi-hand-index" style={{ fontSize: "56px", color: "#D1D5DB", marginBottom: "16px" }}></i>
                  <p style={{ color: "#6B7280", fontSize: "14px", margin: 0, fontWeight: "500" }}>Please choose a form to select users</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={styles.emptyBox} className="fade-in">
                  <i className="bi bi-inbox" style={{ fontSize: "56px", color: "#D1D5DB", marginBottom: "16px" }}></i>
                  <p style={{ color: "#6B7280", fontSize: "14px", margin: 0, fontWeight: "500" }}>
                    {users.length === 0 ? "No users available" : "No users match your search"}
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.selectedCount}>
                    <i className="bi bi-check-circle-fill" style={{ color: "#10B981" }}></i> 
                    <strong>{selectedUserIds.length}</strong> user(s) selected
                  </div>
                  {filteredUsers.map((user, index) => {
                    const userIdStr = String(user.userId);
                    const isAssigned = assignedUserIds.map(String).includes(userIdStr);
                    const isSelected = selectedUserIds.map(String).includes(userIdStr);
                    return (
                      <div
                        key={user.userId}
                        style={{
                          ...styles.userCard,
                          ...(isSelected ? styles.userCardSelected : {}),
                          ...(isAssigned ? styles.userCardDisabled : {}),
                          animationDelay: `${index * 0.05}s`,
                        }}
                        className="slide-in"
                        onClick={() => !isAssigned && toggleUser(user.userId)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          style={styles.checkbox}
                          disabled={isAssigned}
                        />
                        <div style={styles.userInfo}>
                          <div style={styles.userHeader}>
                            <strong style={styles.userName}>{user.firstName} {user.lastName}</strong>
                            {isAssigned && (
                              <span style={styles.assignedTag}>
                                <i className="bi bi-lock-fill"></i> Assigned
                              </span>
                            )}
                          </div>
                          <div style={styles.userMeta}>
                            {user.department && <span><i className="bi bi-building"></i> {user.department}</span>}
                            {user.role && <span><i className="bi bi-person-badge"></i> {user.role}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Fixed Footer with Buttons */}
            <div style={styles.usersPanelFooter}>
              <div style={styles.buttonRow}>
                <button 
                  style={!selectedFormId || selectedUserIds.length === 0 ? styles.btnDisabledSmall : styles.btnShareSmall} 
                  onClick={() => openDeadlineModal("Send")}
                  disabled={!selectedFormId || selectedUserIds.length === 0}
                  className="btn-hover"
                >
                  <i className="bi bi-send-fill"></i> Share
                </button>
                <button 
                  style={!selectedFormId || selectedUserIds.length === 0 ? styles.btnDisabledSmall : styles.btnDraftSmall} 
                  onClick={() => openDeadlineModal("Save as Draft")}
                  disabled={!selectedFormId || selectedUserIds.length === 0}
                  className="btn-hover"
                >
                  <i className="bi bi-save-fill"></i> Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  pageContainer: {
    height: "calc(100vh - 60px)",
    background: "linear-gradient(135deg, #F0F2F5 0%, #E5E7EB 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  mainArea: {
    flex: "1",
    padding: "20px",
    display: "flex",
    gap: "20px",
    overflow: "hidden",
    minHeight: 0,
  },

  formsSection: {
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    flex: "1",
    overflow: "hidden",
    border: "1px solid #E5E7EB",
    minHeight: 0,
  },

  usersPanel: {
    width: "400px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid #E5E7EB",
    minHeight: 0,
  },

  sectionHeader: {
    padding: "20px 24px",
    borderBottom: "3px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #FAFBFC 0%, #F9FAFB 100%)",
    flexShrink: 0,
  },

  usersPanelHeader: {
    padding: "16px 20px",
    borderBottom: "3px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
    flexShrink: 0,
    color: "#FFFFFF",
  },

  userSearchContainer: {
    padding: "12px 20px",
    borderBottom: "2px solid #E5E7EB",
    backgroundColor: "#FAFBFC",
    flexShrink: 0,
  },

  usersPanelFooter: {
    padding: "14px 20px",
    borderTop: "3px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },

  buttonRow: {
    display: "flex",
    gap: "10px",
    width: "100%",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1F2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  countBadge: {
    fontSize: "13px",
    padding: "6px 14px",
    background: "linear-gradient(135deg, #27235C, #3B4B8C)",
    color: "#FFFFFF",
    borderRadius: "20px",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(39, 35, 92, 0.25)",
  },

  usersPanelTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#FFFFFF",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  closePanelBtn: {
    padding: "8px 12px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
    color: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },

  searchBox: {
    position: "relative",
  },

  searchInput: {
    padding: "10px 14px 10px 40px",
    fontSize: "13px",
    border: "2px solid #E5E7EB",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
    outline: "none",
    fontWeight: "500",
    width: "220px",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  userSearchInput: {
    padding: "10px 14px 10px 40px",
    fontSize: "13px",
    border: "2px solid #E5E7EB",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
    outline: "none",
    fontWeight: "500",
    width: "100%",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    boxSizing: "border-box",
  },

  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
    fontSize: "14px",
  },

  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  filterSelect: {
    padding: "10px 14px",
    fontSize: "13px",
    border: "2px solid #E5E7EB",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
    cursor: "pointer",
    outline: "none",
    fontWeight: "600",
    minWidth: "130px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  tableScroll: {
    flex: "1",
    overflowY: "auto",
    overflowX: "auto",
    minHeight: 0,
  },

  usersPanelBody: {
    flex: "1",
    overflowY: "auto",
    padding: "14px 20px",
    background: "linear-gradient(180deg, #FAFBFC 0%, #F9FAFB 100%)",
    minHeight: 0,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  thead: {
    background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  th: {
    padding: "16px 18px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "800",
    color: "#6B7280",
    borderBottom: "2px solid #E5E7EB",
    textTransform: "uppercase",
    letterSpacing: "1px",
    whiteSpace: "nowrap",
    background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
  },

  tr: {
    backgroundColor: "#FFFFFF",
    transition: "all 0.2s ease",
    borderBottom: "1px solid #F3F4F6",
  },

  trSelected: {
    background: "linear-gradient(135deg, #FDF4FF 0%, #FEF3F8 100%)",
    borderLeft: "4px solid #AC5098",
    boxShadow: "inset 0 0 0 1px rgba(172, 80, 152, 0.1)",
  },

  td: {
    padding: "16px 18px",
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "middle",
  },

  typePill: {
    display: "inline-block",
    padding: "6px 16px",
    color: "#FFFFFF",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
  },

  actionBtns: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
    flexWrap: "nowrap",
  },

  btnAction: {
    padding: "9px 16px",
    background: "linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)",
    color: "#27235C",
    border: "2px solid #27235C",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(39, 35, 92, 0.15)",
    whiteSpace: "nowrap",
  },

  btnChooseActive: {
    padding: "9px 16px",
    background: "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
    color: "#FFFFFF",
    border: "2px solid #AC5098",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(172, 80, 152, 0.4), 0 0 0 3px rgba(172, 80, 152, 0.1)",
    transform: "translateY(-2px)",
    whiteSpace: "nowrap",
  },

  btnShareSmall: {
    flex: 1,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #27235C 0%, #3B4B8C 50%, #27235C 100%)",
    backgroundSize: "200% 100%",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(39, 35, 92, 0.3)",
    whiteSpace: "nowrap",
  },

  btnDraftSmall: {
    flex: 1,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #6366F1 100%)",
    backgroundSize: "200% 100%",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    whiteSpace: "nowrap",
  },

  btnDisabledSmall: {
    flex: 1,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)",
    color: "#9CA3AF",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    opacity: 0.6,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    whiteSpace: "nowrap",
  },

  loadingBox: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  spinner: {
    width: "48px",
    height: "48px",
    border: "5px solid #E5E7EB",
    borderTop: "5px solid #27235C",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },

  selectedCount: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1F2937",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
    padding: "10px 14px",
    background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    borderRadius: "10px",
    border: "2px solid #A7F3D0",
  },

  userCard: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "2px solid #E5E7EB",
    marginBottom: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  userCardSelected: {
    background: "linear-gradient(135deg, #FDF4FF 0%, #FEF3F8 100%)",
    borderColor: "#AC5098",
    boxShadow: "0 4px 12px rgba(172, 80, 152, 0.25)",
    transform: "translateX(4px)",
  },

  userCardDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    backgroundColor: "#F9FAFB",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    marginRight: "12px",
    cursor: "pointer",
    accentColor: "#AC5098",
    flexShrink: 0,
    marginTop: "2px",
  },

  userInfo: {
    flex: "1",
  },

  userHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },

  userName: {
    fontSize: "13px",
    color: "#1F2937",
    fontWeight: "600",
  },

  userMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "11px",
    color: "#6B7280",
    fontWeight: "500",
  },

  assignedTag: {
    fontSize: "10px",
    padding: "3px 8px",
    background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
    color: "#059669",
    borderRadius: "10px",
    fontWeight: "700",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    backdropFilter: "blur(6px)",
  },

  viewModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    maxWidth: "700px",
    width: "90%",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
  },

  viewModalHeader: {
    padding: "24px 28px",
    borderBottom: "2px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #27235C, #3B4B8C)",
    borderRadius: "20px 20px 0 0",
  },

  viewModalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#FFFFFF",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  closeBtn: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
    color: "#FFFFFF",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "10px",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },

  viewModalBody: {
    padding: "28px",
    overflowY: "auto",
    flex: "1",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
  },

  detailRowFull: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
  },

  detailLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#6B7280",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1F2937",
  },

  typeBadge: {
    display: "inline-block",
    padding: "6px 16px",
    background: "linear-gradient(135deg, #AC5098, #97247E)",
    color: "#FFFFFF",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 2px 6px rgba(172, 80, 152, 0.25)",
  },

  competenciesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  competencyCard: {
    padding: "16px",
    background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  competencyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  competencyName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#27235C",
  },

  competencyId: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#9CA3AF",
    backgroundColor: "#E5E7EB",
    padding: "4px 10px",
    borderRadius: "12px",
  },

  competencyDesc: {
    fontSize: "13px",
    color: "#6B7280",
    lineHeight: "1.6",
    margin: 0,
  },

  noData: {
    fontSize: "14px",
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  viewModalFooter: {
    padding: "20px 28px",
    borderTop: "2px solid #E5E7EB",
    display: "flex",
    justifyContent: "flex-end",
    flexShrink: 0,
  },

  btnCloseModal: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
    color: "#374151",
    border: "2px solid #D1D5DB",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },

  deleteModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "450px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
  },

  deadlineModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "36px",
    maxWidth: "500px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.25)",
  },

  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: "12px",
    margin: 0,
  },

  modalText: {
    fontSize: "15px",
    color: "#6B7280",
    marginBottom: "28px",
    lineHeight: "1.6",
  },

  inputGroup: {
    marginBottom: "28px",
    textAlign: "left",
  },

  inputLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "12px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    border: "2px solid #E5E7EB",
    borderRadius: "10px",
    outline: "none",
    fontWeight: "600",
    color: "#1F2937",
    boxSizing: "border-box",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },

  btnCancelModal: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
    color: "#374151",
    border: "2px solid #D1D5DB",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },

  btnConfirmModal: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #27235C 0%, #3B4B8C 50%, #27235C 100%)",
    backgroundSize: "200% 100%",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(39, 35, 92, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },

  btnDeleteModal: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #DC3545 0%, #C82333 50%, #DC3545 100%)",
    backgroundSize: "200% 100%",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(220, 53, 69, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },
};

export default FormsList;
