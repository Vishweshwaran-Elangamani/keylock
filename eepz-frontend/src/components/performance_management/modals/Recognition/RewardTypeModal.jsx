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
        <div style={styles.header}>
          <span style={styles.headerTitle}>{isEditMode ? "Edit Recognition" : "Create Recognition"}</span>
        </div>
        <div style={styles.body}>
          <form onSubmit={onSubmit} autoComplete="off">
            <label style={styles.label}>
              Recognition Name <span style={styles.required}>*</span>
            </label>
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
              <button
                type="button"
                onClick={onClose}
                style={styles.cancelButton}
                onMouseEnter={e => (e.currentTarget.style.background = '#5a6268')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6c757d')}
              >
                Cancel
              </button>
              <button type="submit" style={styles.createButton}>
                {isEditMode ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
        <style>{`
          div[style*="overflow-y: auto"]::-webkit-scrollbar {display:none;}
        `}</style>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(39, 35, 92, 0.13)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxWidth: "410px",
    width: "94vw",
    minWidth: 320,
    boxShadow: "0 5px 32px rgba(39,35,92,0.13)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    background: "#27235C",
    color: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: "19px 24px 12px 24px",
    marginBottom: 0,
    textAlign: "left"
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: "1.24rem",
    letterSpacing: ".01em",
    color: "#fff"
  },
  body: {
    padding: "12px 20px 20px 20px",
    background: "#fff"
  },
  label: {
    display: "block",
    fontWeight: 700,
    fontSize: 15,
    margin: "18px 0 4px 0",
    color: "#27235C",
    textAlign: "left"
  },
  required: {
    color: "#E01950",
    fontWeight: 700,
    fontSize: 15,
    marginLeft: 2
  },
  input: {
    width: "100%",
    padding: "10px 10px",
    marginBottom: 0,
    fontSize: 15,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#27235C",
    outline: "none",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    padding: "10px 10px",
    minHeight: 64,
    resize: "vertical",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    marginBottom: 0,
    color: "#27235C",
    background: "#fff",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box"
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
    paddingRight: 0,
  },
  cancelButton: {
    padding: "9px 28px",
    borderRadius: 8,
    border: "none",
    background: "#6C757D",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: ".01em",
    transition: "background .15s"
  },
  createButton: {
    padding: "9px 28px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.07)",
    letterSpacing: ".01em",
    transition: "background .16s"
  }
};

export default RewardTypeModal;
