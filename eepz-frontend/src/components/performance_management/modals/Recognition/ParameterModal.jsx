import React from "react";

const ParameterModal = ({
  show, onClose, parameterForm, setParameterForm, onSubmit
}) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>Add Parameter</h3>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>Parameter Name</label>
          <input
            type="text"
            placeholder="e.g. Goal Achievement Rating"
            value={parameterForm.parameterName}
            onChange={e =>
              setParameterForm({ ...parameterForm, parameterName: e.target.value })
            }
            required
            style={styles.input}
          />
          <label style={styles.label}>Type</label>
          <select
            value={parameterForm.parameterType}
            onChange={e =>
              setParameterForm({ ...parameterForm, parameterType: e.target.value })
            }
            required
            style={styles.select}
          >
            <option value="Text">Text</option>
            <option value="TextArea">Text Area</option>
            <option value="Number">Number</option>
            <option value="Rating">Rating</option>
            <option value="Date">Date</option>
          </select>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={parameterForm.isRequired}
              onChange={e =>
                setParameterForm({ ...parameterForm, isRequired: e.target.checked })
              }
            /> Required Field
          </label>

          <label style={styles.label}>Placeholder Text</label>
          <input
            type="text"
            placeholder="Hint text for the field..."
            value={parameterForm.placeholderText}
            onChange={e =>
              setParameterForm({ ...parameterForm, placeholderText: e.target.value })
            }
            style={styles.input}
          />

          {(parameterForm.parameterType === "Number" || parameterForm.parameterType === "Rating") && (
            <>
              <label style={styles.label}>Min Value</label>
              <input
                type="number"
                value={parameterForm.minimumValue}
                onChange={e =>
                  setParameterForm({ ...parameterForm, minimumValue: e.target.value })
                }
                style={styles.input}
              />
              <label style={styles.label}>Max Value</label>
              <input
                type="number"
                value={parameterForm.maximumValue}
                onChange={e =>
                  setParameterForm({ ...parameterForm, maximumValue: e.target.value })
                }
                style={styles.input}
              />
            </>
          )}

          <label style={styles.label}>Sort Order</label>
          <input
            type="number"
            min="1"
            value={parameterForm.sortOrder}
            onChange={e =>
              setParameterForm({ ...parameterForm, sortOrder: parseInt(e.target.value) })
            }
            required
            style={styles.input}
          />

          <div style={styles.actionRow}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" style={styles.submitBtn}>Add Parameter</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: 24,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto"
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "#27235C",
    marginBottom: 20,
  },
  label: { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#27235C" },
  input: {
    width: "100%", padding: 10, fontSize: 14,
    marginBottom: 20, border: "1px solid #d1d5db", borderRadius: 6, boxSizing: "border-box"
  },
  checkboxLabel: {
    display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontWeight: 600, color: "#27235C"
  },
  select: {
    width: "100%", padding: 10, fontSize: 14,
    marginBottom: 20, border: "1px solid #d1d5db", borderRadius: 6, boxSizing: "border-box"
  },
  actionRow: {
    display: "flex", justifyContent: "flex-end", gap: 12,
  },
  cancelBtn: {
    background: "#fff", color: "#374151", border: "1px solid #d1d5db",
    borderRadius: 6, padding: "10px 20px", cursor: "pointer",
    fontWeight: 600,
  },
  submitBtn: {
    background: "#10b981", color: "#fff", border: "none",
    borderRadius: 6, padding: "10px 20px", cursor: "pointer",
    fontWeight: 600,
  }
};

export default ParameterModal;
