import React from "react";

const RewardTypeModal = ({
  show,
  onClose,
  rewardTypeForm,
  setRewardTypeForm,
  onSubmit,
  isEditMode,
}) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>{isEditMode ? "Edit Recognition" : "Create Recognition"}</h3>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>Recognition Name</label>
          <input
            type="text"
            value={rewardTypeForm.rewardName}
            onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, rewardName: e.target.value })}
            placeholder="Type recognition name"
            required
            style={styles.input}
          />
          <label style={styles.label}>Description</label>
          <textarea
            value={rewardTypeForm.description}
            onChange={(e) => setRewardTypeForm({ ...rewardTypeForm, description: e.target.value })}
            placeholder="Type description (optional)"
            style={styles.textarea}
          />
          <div style={styles.actionRow}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button type="submit" style={styles.submitButton}>{isEditMode ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 500,
    boxShadow: "0 8px 32px rgba(172,80,152,0.16)",
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
    color: "#27235C",
  },
  label: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
    color: "#27235C",
    display: "block",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 20,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: 10,
    minHeight: 80,
    resize: "vertical",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    marginBottom: 20,
    boxSizing: "border-box",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    padding: "10px 20px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600,
  },
  submitButton: {
    padding: "10px 20px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "#27235C",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default RewardTypeModal;
