import React from "react";

const ParameterModal = ({
  show, onClose, parameterForm, setParameterForm, onSubmit
}) => {
  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>Add Parameter</span>
        </div>
        <div style={styles.body}>
          <form onSubmit={onSubmit} autoComplete="off">
            <label style={styles.label}>
              Parameter Name <span style={styles.required}>*</span>
            </label>
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

            <label style={styles.label}>
              Type <span style={styles.required}>*</span>
            </label>
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
                style={styles.checkbox}
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

            <label style={styles.label}>Sort Order <span style={styles.required}>*</span></label>
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
              <button
                type="button"
                onClick={onClose}
                style={styles.cancelBtn}
                onMouseEnter={e => (e.currentTarget.style.background = '#5a6268')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6c757d')}
              >Cancel</button>
              <button
                type="submit"
                style={styles.submitBtn}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >Add Parameter</button>
            </div>
          </form>
        </div>
        <style>{`
          div[style*="overflow-y: auto"]::-webkit-scrollbar {display:none;}
          input[type='checkbox'] { accent-color: #97247E; }
        `}</style>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(39, 35, 92, 0.21)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    boxShadow: "0 10px 38px rgba(39,35,92,0.19)",
    maxWidth: 440,
    width: "96vw",
    minWidth: 300,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: 0,
    maxHeight: "93vh"
  },
  header: {
    background: "#27235C",
    color: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "22px 28px 17px 28px",
    textAlign: "left"
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: "1.22rem",
    letterSpacing: ".01em"
  },
  body: {
    padding: "12px 24px 18px 24px",
    background: "#fff",
    overflowY: "auto"
  },
  label: {
    display: "block",
    fontWeight: 700,
    fontSize: 15.5,
    margin: "14px 0 5px 0",
    color: "#27235C",
    textAlign: "left"
  },
  required: {
    color: "#E01950",
    fontWeight: 800,
    fontSize: 15,
    marginLeft: 2
  },
  input: {
    width: "100%",
    padding: "9px 9px",
    marginBottom: 0,
    fontSize: 14.5,
    borderRadius: 7,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#27235C",
    outline: "none",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "9px 9px",
    fontSize: 14.5,
    borderRadius: 7,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#27235C",
    marginBottom: 0,
    outline: "none",
    boxSizing: "border-box"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    margin: "14px 0 0 0",
    fontWeight: 600,
    color: "#27235C",
    fontSize: 15
  },
  checkbox: {
    accentColor: "#97247E",
    width: 18,
    height: 18,
    marginRight: 6
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 13,
    marginTop: 25,
    marginBottom: 3
  },
  cancelBtn: {
    background: "#6C757D",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 26px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    transition: "background .13s"
  },
  submitBtn: {
    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 26px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.10)",
    letterSpacing: ".015em",
    transition: "filter 0.13s"
  }
};

export default ParameterModal;
