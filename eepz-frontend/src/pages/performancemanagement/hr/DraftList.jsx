import React, { useEffect, useState } from "react";
import api from "../../../services/performancemanagement/hr/api";
import EditDraftModal from "../../../components/performance_management/modals/DraftList/EditDraftModal";
import DeleteConfirmModal from "../../../components/performance_management/modals/DraftList/DeleteConfirmModal";

function DraftsList() {
  const [draftRows, setDraftRows] = useState([]);
  const [forms, setForms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [deleteGroupMode, setDeleteGroupMode] = useState(false);


  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editData, setEditData] = useState({
    formId: "",
    employeeId: "",
    assignedBy: 1,
    action: "Save as Draft"
  });

  const [selectedAssignments, setSelectedAssignments] = useState([]);

  useEffect(() => {
    fetchDrafts();
    fetchForms();
    fetchUsers();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.get("/AppraisalProcess/drafts");
      const payload = data?.data ?? [];
      setDraftRows(Array.isArray(payload) ? payload : [payload]);
      setMsg(payload.length ? null : "No drafts found.");
    } catch (error) {
      setMsg("Failed to load drafts.");
      setDraftRows([]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const { data } = await api.get("/FormManagement/all");
      setForms(data?.data ?? []);
    } catch (error) {
      console.error("Failed to load forms");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/UserProfiles/all");
      setUsers(data?.data ?? []);
    } catch (error) {
      console.error("Failed to load users");
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditData({
      formId: assignment.formId,
      employeeId: assignment.employeeId,
      assignedBy: 1,
      action: assignment.action || "Save as Draft"
    });
    setShowModal(true);
  };

  const handleUpdateDraft = async () => {
    try {
      await api.put(`/AppraisalProcess/draft/${editingAssignment.assignmentId}`, editData);
      setMsg("Draft updated successfully.");
      setShowModal(false);
      fetchDrafts();
    } catch (error) {
      console.error(error);
      setMsg("Failed to update draft.");
    }
  };

  // const handleDeleteAssignment = async (assignmentId) => {
  //   const confirmDelete = window.confirm("Are you sure you want to delete this draft?");
  //   if (!confirmDelete) return;

  //   try {
  //     await api.delete(`/FormManagement/draft/${assignmentId}`);
  //     setDraftRows(prev => prev.filter(d => d.assignmentId !== assignmentId));
  //     setSelectedAssignments(prev => prev.filter(id => id !== assignmentId));
  //     setMsg("Draft deleted successfully.");
  //   } catch (error) {
  //     console.error(error);
  //     setMsg("Failed to delete draft.");
  //   }
  // };

  // const handleDeleteGroup = async (formId) => {
  //   const confirmDelete = window.confirm("Are you sure you want to delete all drafts for this form?");
  //   if (!confirmDelete) return;

  //   try {
  //     const assignmentsToDelete = draftRows.filter(d => d.formId === formId);
  //     for (const assignment of assignmentsToDelete) {
  //       await api.delete(`/FormManagement/draft/${assignment.assignmentId}`);
  //     }
  //     setDraftRows(prev => prev.filter(d => d.formId !== formId));
  //     setMsg("All drafts for this form deleted successfully.");
  //   } catch (error) {
  //     console.error(error);
  //     setMsg("Failed to delete drafts.");
  //   }
  // };

  const confirmDeleteSingle = (assignmentId) => {
  setToDeleteId(assignmentId);
  setDeleteGroupMode(false);
  setShowDeleteModal(true);
};

const confirmDeleteGroup = (formId) => {
  setToDeleteId(formId);
  setDeleteGroupMode(true);
  setShowDeleteModal(true);
};

const handleConfirmDelete = async () => {
  if (deleteGroupMode && toDeleteId !== null) {
    try {
      const assignmentsToDelete = draftRows.filter(d => d.formId === toDeleteId);
      for (const assignment of assignmentsToDelete) {
        await api.delete(`/FormManagement/draft/${assignment.assignmentId}`);
      }
      setDraftRows(prev => prev.filter(d => d.formId !== toDeleteId));
      setMsg("All drafts for this form deleted successfully.");
    } catch (error) {
      setMsg("Failed to delete drafts."); console.error(error);
    }
  } else if (toDeleteId !== null) {
    try {
      await api.delete(`/FormManagement/draft/${toDeleteId}`);
      setDraftRows(prev => prev.filter(d => d.assignmentId !== toDeleteId));
      setSelectedAssignments(prev => prev.filter(id => id !== toDeleteId));
      setMsg("Draft deleted successfully.");
    } catch (error) {
      setMsg("Failed to delete draft."); console.error(error);
    }
  }
  setShowDeleteModal(false); setToDeleteId(null);
};

  const handleSelectAssignment = (assignmentId) => {
    setSelectedAssignments(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleSendSelected = async () => {
    if (selectedAssignments.length === 0) {
      setMsg("Please select at least one assignment to send.");
      return;
    }

    try {
      const updates = selectedAssignments.map(id => {
        const assignment = draftRows.find(a => a.assignmentId === id);
        if (!assignment) return null;

        return api.put(`/AppraisalProcess/draft/${id}`, {
          formId: assignment.formId,
          employeeId: assignment.employeeId,
          assignedBy: 1,
          action: "Send"
        });
      }).filter(Boolean);

      await Promise.all(updates);
      setMsg(`${selectedAssignments.length} draft(s) sent successfully.`);
      setSelectedAssignments([]);
      fetchDrafts();
    } catch (error) {
      console.error("Send error:", error.response?.data || error.message);
      setMsg("Failed to send selected drafts.");
    }
  };

  const groupedDrafts = draftRows.reduce((acc, draft) => {
    const key = draft.formId;
    if (!acc[key]) {
      acc[key] = {
        formId: draft.formId,
        formName: draft.formName || `Form #${draft.formId}`,
        assignments: []
      };
    }
    acc[key].assignments.push(draft);
    return acc;
  }, {});

  const groupedList = Object.values(groupedDrafts);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Saved Drafts</h2>
        <button
          style={selectedAssignments.length === 0 ? styles.btnDisabled : styles.btnSuccess}
          disabled={selectedAssignments.length === 0}
          onClick={handleSendSelected}
        >
          Send Selected ({selectedAssignments.length})
        </button>
      </div>

      {msg && <div style={styles.alertInfo}>{msg}</div>}

      {loading ? (
        <div style={styles.loadingContainer}>
          <div className="spinner-border" style={styles.spinner}></div>
        </div>
      ) : (
        <>
          {groupedList.map((group) => (
            <div key={group.formId} style={styles.card}>
              <div style={styles.cardHeader}>
                <h5 style={styles.cardHeaderTitle}>{group.formName}</h5>
                <button
  style={styles.btnDanger}
  onClick={() => confirmDeleteGroup(group.formId)}
>
  Delete All ({group.assignments.length})
</button>

              </div>
              <div style={styles.cardBody}>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={{ ...styles.th, width: "50px" }}>Select</th>
                        <th style={styles.th}>Assignment ID</th>
                        <th style={styles.th}>Employee Name</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Assigned At</th>
                        <th style={{ ...styles.th, width: "200px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.assignments.map((assignment) => (
                        <tr key={assignment.assignmentId} style={styles.tableRow}>
                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedAssignments.includes(assignment.assignmentId)}
                              onChange={() => handleSelectAssignment(assignment.assignmentId)}
                              style={styles.checkbox}
                            />
                          </td>
                          <td style={styles.td}>
                            <span style={styles.badgePrimary}>{assignment.assignmentId}</span>
                          </td>
                          <td style={styles.td}>
                            <strong>{assignment.employeeName || `Employee #${assignment.employeeId}`}</strong>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.badgeWarning}>
                              {assignment.action || "Draft"}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <small>
                              {assignment.assignedAt
                                ? new Date(assignment.assignedAt).toLocaleString()
                                : "-"}
                            </small>
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{ ...styles.btnSmall, ...styles.btnEdit }}
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              Edit
                            </button>
                            <button
  style={{ ...styles.btnSmall, ...styles.btnDelete, marginLeft: "8px" }}
  onClick={() => confirmDeleteSingle(assignment.assignmentId)}
>
  Delete
</button>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          {groupedList.length === 0 && (
            <div style={styles.emptyState}>
              <p>No drafts to display.</p>
            </div>
          )}
        </>
      )}

      <EditDraftModal
        show={showModal}
        onClose={() => setShowModal(false)}
        editData={editData}
        setEditData={setEditData}
        forms={forms}
        users={users}
        onSave={handleUpdateDraft}
      />
      <DeleteConfirmModal
  show={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleConfirmDelete}
  message={
    deleteGroupMode
      ? "Are you sure you want to delete all drafts for this form?"
      : "Are you sure you want to delete this draft?"
  }
/>

    </div>
  );
}

// Professional Styles - Dark Blue & Purple Theme
const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#FFFFFF",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#27235C",
    margin: "0",
  },
  alertInfo: {
    padding: "16px",
    marginBottom: "24px",
    backgroundColor: "#FCFCF9",
    border: "1px solid #C1C7C8",
    borderRadius: "8px",
    color: "#27235C",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "48px",
  },
  // spinner: {
  //   color: "#27235C",
  // },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "24px",
    border: "1px solid #EEEEEE",
  },
  cardHeader: {
    backgroundColor: "#27235C",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderTitle: {
    margin: "0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardBody: {
    padding: "0",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHead: {
    backgroundColor: "#F9F9F9",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#27235C",
    borderBottom: "2px solid #EEEEEE",
  },
  tableRow: {
    borderBottom: "1px solid #F5F5F5",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#000000",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#27235C",
  },
  badgePrimary: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#27235C",
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  badgeWarning: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#97247E",
    color: "#FFFFFF",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnSuccess: {
    padding: "12px 24px",
    backgroundColor: "#24A148",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnDisabled: {
    padding: "12px 24px",
    backgroundColor: "#C1C7C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
    opacity: "0.6",
  },
  btnDanger: {
    padding: "8px 16px",
    backgroundColor: "#97247E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnSmall: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnEdit: {
    backgroundColor: "#27235C",
    color: "#FFFFFF",
  },
  btnDelete: {
    backgroundColor: "#97247E",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalDialog: {
    width: "90%",
    maxWidth: "500px",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    padding: "24px",
    backgroundColor: "#27235C",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
  },
  modalTitle: {
    margin: "0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "32px",
    color: "#FFFFFF",
    cursor: "pointer",
    padding: "0",
    lineHeight: "1",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#27235C",
  },
  formSelect: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #C1C7C8",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #EEEEEE",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    backgroundColor: "#F9F9F9",
  },
  btnModalSuccess: {
    padding: "10px 20px",
    backgroundColor: "#24A148",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnModalSecondary: {
    padding: "10px 20px",
    backgroundColor: "#7D7B90",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};

export default DraftsList;