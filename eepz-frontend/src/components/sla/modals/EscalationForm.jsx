import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import "../../../styles/sla/modals/EscalationForm.css";

const EscalationForm = ({ sla, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managerId, setManagerId] = useState(null);
  const [managerName, setManagerName] = useState("");
  const [loadingManager, setLoadingManager] = useState(true);
  const [managerError, setManagerError] = useState(null);

  const reasonOptions = [
    { value: "", label: "-- Select Reason --" },
    { value: "Performance Issues", label: "Performance Issues" },
    { value: "Resource Constraints", label: "Resource Constraints" },
    { value: "Technical Challenges", label: "Technical Challenges" },
    { value: "Priority Change", label: "Priority Change" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    const fetchManagerId = async () => {
      try {
        setLoadingManager(true);
        setManagerError(null);

        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!user.empId) {
          throw new Error("User employee ID not found in localStorage");
        }
        const employeeResponse = await slaService.getEmployeeById(user.empId);

        if (!employeeResponse?.success || !employeeResponse.data) {
          throw new Error("Failed to fetch employee details");
        }

        const employee = employeeResponse.data;

        const reportingManagerId =
          employee.reportsTo ||
          employee.reportingToId ||
          employee.managerId ||
          employee.managerEmployeeId;

        if (!reportingManagerId) {
          throw new Error(
            "No reporting manager found. Please contact HR to assign a manager."
          );
        }

        try {
          const managerResponse = await slaService.getEmployeeById(
            reportingManagerId
          );
          if (managerResponse?.success && managerResponse.data) {
            const manager = managerResponse.data;
            const fullName = `${manager.firstName || ""} ${
              manager.lastName || ""
            }`.trim();
            setManagerName(fullName || "Manager");
          }
        } catch {
          setManagerName(`Manager (ID: ${reportingManagerId})`);
        }

        setManagerId(reportingManagerId);
      } catch (error) {
        setManagerError(error.message || "Failed to load escalation target");
        toast.error("Manager Not Found", {
          description:
            error.message ||
            "Unable to find your reporting manager. Please contact HR.",
          duration: 6000,
        });
      } finally {
        setLoadingManager(false);
      }
    };

    fetchManagerId();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Details must be at least 10 characters");
      return;
    }

    if (!managerId) {
      toast.error("No manager available for escalation");
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await slaService.submitEscalation({
        slaid: sla.slaid,
        reason: selectedReason,
        description: description.trim(),
        escalatedToEmployeeId: managerId,
        submittedByEmployeeId: user.empId,
      });

      if (response?.success) {
        toast.success("SLA Escalated Successfully", {
          description: `Escalated to ${managerName} for review`,
          duration: 4000,
        });
        onSuccess();
      } else {
        toast.error("Escalation Failed", {
          description: response?.message || "Unable to escalate SLA",
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Error Escalating SLA", {
        description: error.message || "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (
      e.ctrlKey &&
      e.key === "Enter" &&
      selectedReason &&
      description.trim().length >= 10 &&
      !submitting &&
      managerId
    ) {
      handleSubmit(e);
    }
  };

  return (
    <div className="esc-overlay modal show d-block" onClick={onClose}>
      <div
        className="esc-dialog modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="esc-modal modal-content">
          <div className="esc-header">
            <div className="esc-header-main">
              <div className="esc-header-icon-wrapper">
                <AlertCircle size={16} className="esc-header-icon" />
              </div>
              <h5 className="esc-header-title">Add Escalation</h5>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="esc-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          <div className="esc-body">
            {loadingManager ? (
              <div className="esc-loading">
                <div
                  className="spinner-border text-primary esc-loading-spinner"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="esc-loading-text">
                  Loading escalation details...
                </p>
              </div>
            ) : managerError ? (
              <div>
                <div className="esc-manager-error alert alert-danger d-flex align-items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="flex-shrink-0 esc-manager-error-icon"
                  />

                  <div>
                    <strong className="d-block mb-1">Manager Not Found</strong>
                    <small>{managerError}</small>
                  </div>
                </div>
                <div className="esc-manager-error-footer text-center mt-3">
                  <button
                    type="button"
                    className="esc-btn esc-btn-secondary btn btn-secondary"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="esc-goal">
                  <label className="esc-goal-label">Goal:</label>
                  <div className="esc-goal-value">{sla.slatype}</div>
                </div>

                <div className="esc-deadline">
                  <small className="esc-deadline-text">
                    Deadline:{" "}
                    {new Date(sla.deadline).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </div>

                {managerName && (
                  <div className="esc-manager-info alert d-flex align-items-start gap-2 mb-3">
                    <AlertCircle size={16} className="esc-manager-info-icon" />
                    <small className="esc-manager-info-text">
                      This will be escalated to <strong>{managerName}</strong>
                    </small>
                  </div>
                )}

                <div className="esc-field">
                  <label htmlFor="reason" className="esc-label">
                    Reason <span className="esc-required">*</span>
                  </label>
                  <div className="esc-select-wrapper">
                    <select
                      id="reason"
                      className="esc-select"
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      disabled={submitting}
                    >
                      {reasonOptions.map((option, index) => (
                        <option
                          key={option.value || "placeholder"}
                          value={option.value}
                          disabled={index === 0}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="esc-field esc-comment-field">
                  <label htmlFor="details" className="esc-label">
                    Your Comment <span className="esc-required">*</span>
                  </label>
                  <textarea
                    id="details"
                    className="esc-textarea form-control"
                    placeholder="Write your comment here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    rows={3}
                    disabled={submitting}
                    maxLength={500}
                  />
                  <div className="esc-comment-meta d-flex justify-content-between align-items-center mt-1">
                    <small className="esc-comment-hint">
                      {" "}
                      Press Ctrl+Enter to submit quickly
                    </small>
                    <small className="esc-comment-count">
                      {description.length}/500
                    </small>
                  </div>
                </div>

                <div className="esc-level-info">
                  <AlertCircle size={16} className="esc-level-info-icon" />
                  <small className="esc-level-info-text">
                    <strong>Level 1 (L1)</strong> escalation to your manager for
                    immediate review.
                  </small>
                </div>

                <div className="esc-footer">
                  <button
                    type="button"
                    className="esc-btn esc-btn-cancel btn"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="esc-btn esc-btn-submit btn d-flex align-items-center gap-2"
                    disabled={
                      submitting ||
                      loadingManager ||
                      !managerId ||
                      !selectedReason ||
                      description.trim().length < 10
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm esc-submit-spinner" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="esc-submit-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        <span>Post Escalation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationForm;
