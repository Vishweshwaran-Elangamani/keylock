import React from "react";

const EditDraftModal = ({
  show,
  onClose,
  editData,
  setEditData,
  forms,
  users,
  onSave,
}) => {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h5 style={styles.modalTitle}>Edit Draft Assignment</h5>
            <button style={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Form</label>
              <select
                style={styles.formSelect}
                value={editData.formId}
                onChange={(e) =>
                  setEditData({ ...editData, formId: parseInt(e.target.value) })
                }
              >
                {forms.map((form) => (
                  <option key={form.formId} value={form.formId}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Employee</label>
              <select
                style={styles.formSelect}
                value={editData.employeeId}
                onChange={(e) =>
                  setEditData({ ...editData, employeeId: parseInt(e.target.value) })
                }
              >
                {users.map((user) => (
                  <option key={user.profileId} value={user.profileId}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Action</label>
              <select
                style={styles.formSelect}
                value={editData.action}
                onChange={(e) =>
                  setEditData({ ...editData, action: e.target.value })
                }
              >
                <option value="Save as Draft">Save as Draft</option>
                <option value="Send">Send</option>
              </select>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button style={styles.btnModalSuccess} onClick={onSave}>
              Save Changes
            </button>
            <button style={styles.btnModalSecondary} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
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
    maxWidth: 500,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    padding: 24,
    backgroundColor: "#27235C",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 32,
    color: "#fff",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#27235C",
  },
  formSelect: {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "1px solid #C1C7C8",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  modalFooter: {
    padding: 16,
    borderTop: "1px solid #EEE",
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    backgroundColor: "#F9F9F9",
  },
  btnModalSuccess: {
    padding: "10px 20px",
    backgroundColor: "#24A148",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnModalSecondary: {
    padding: "10px 20px",
    backgroundColor: "#7D7B90",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};

export default EditDraftModal;
