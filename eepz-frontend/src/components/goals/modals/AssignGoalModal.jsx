import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";

const AssignGoalModal = ({ isOpen, onClose, goalId, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [checklist, setChecklist] = useState([
    { description: "", assignedTo: null },
  ]);
  const [subordinates, setSubordinates] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setAlert(null);
      setAssignees([]);
      setChecklist([{ description: "", assignedTo: null }]);
    }
  }, [isOpen]);

  const handleChecklistChange = (index, value) => {
    const newChecklist = [...checklist];
    newChecklist[index].description = value;
    setChecklist(newChecklist);
  };

  const handleChecklistAssignment = (index, assignedTo) => {
    const newChecklist = [...checklist];
    newChecklist[index].assignedTo = parseInt(assignedTo);
    setChecklist(newChecklist);
  };

  const addChecklistItem = () => {
    setChecklist((prev) => [
      ...prev,
      { description: "", assignedTo: assignees[0] || null },
    ]);
  };

  const removeChecklistItem = (index) => {
    if (checklist.length <= 1) {
      setAlert({
        type: "warning",
        message: "At least 1 checklist item required",
      });
      return;
    }
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Validate
    if (assignees.length === 0) {
      setAlert({
        type: "danger",
        message: "Please select at least one team member",
      });
      return;
    }

    if (checklist.some((item) => !item.description.trim())) {
      setAlert({
        type: "danger",
        message: "All checklist items must have descriptions",
      });
      return;
    }

    if (checklist.some((item) => !item.assignedTo)) {
      setAlert({
        type: "danger",
        message: "All checklist items must be assigned",
      });
      return;
    }

    setLoading(true);

    try {
      await goalService.assignGoal(goalId, {
        assignees,
        checklist,
      });

      setAlert({ type: "success", message: "Goal assigned successfully!" });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to assign goal",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAssignees([]);
      setChecklist([{ description: "", assignedTo: null }]);
      setAlert(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #dee2e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h5 style={{ margin: 0, fontWeight: 600 }}>
              <i className="bi bi-person-plus me-2"></i>
              Assign Goal to Team
            </h5>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: 0,
                color: "#6c757d",
              }}
            >
              &times;
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
            {alert && (
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              {/* Select Team Members */}
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Select Team Members{" "}
                  <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <select
                  className="form-select"
                  multiple
                  value={assignees.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (option) => parseInt(option.value)
                    );
                    setAssignees(selected);
                  }}
                  disabled={loading}
                  size="5"
                >
                  {subordinates.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} - {sub.role}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Hold Ctrl/Cmd to select multiple
                </small>
              </div>

              {/* Checklist Items */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label
                    className="form-label mb-0"
                    style={{ fontWeight: 600 }}
                  >
                    Assign Tasks <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addChecklistItem}
                    disabled={loading || assignees.length === 0}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Add Task
                  </button>
                </div>

                {assignees.length === 0 && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Please select team members first
                  </div>
                )}

                {checklist.map((item, index) => (
                  <div key={index} className="input-group mb-2">
                    <span
                      className="input-group-text"
                      style={{ minWidth: "40px" }}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter task description"
                      value={item.description}
                      onChange={(e) =>
                        handleChecklistChange(index, e.target.value)
                      }
                      disabled={loading}
                      required
                    />
                    <select
                      className="form-select"
                      style={{ maxWidth: "200px" }}
                      value={item.assignedTo || ""}
                      onChange={(e) =>
                        handleChecklistAssignment(index, e.target.value)
                      }
                      disabled={loading || assignees.length === 0}
                      required
                    >
                      <option value="">Assign to...</option>
                      {assignees.map((assigneeId) => {
                        const assignee = subordinates.find(
                          (s) => s.id === assigneeId
                        );
                        return assignee ? (
                          <option key={assignee.id} value={assignee.id}>
                            {assignee.name}
                          </option>
                        ) : null;
                      })}
                    </select>
                    {checklist.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeChecklistItem(index)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Note:</strong> This assignment will create a delegation
                approval request.
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #dee2e6",
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || assignees.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Assigning...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Assign Goal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignGoalModal;
