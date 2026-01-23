import React, { useState, useEffect } from "react";
import { X, Send, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import "../../../styles/sla/modals/ManagerEscalationModal.css";

const MgrSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="mgr-select">
      <button
        type="button"
        className={`mgr-select-control ${
          open ? "mgr-select-control--open" : ""
        }`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="mgr-select-value">
          {selected ? selected.label : placeholder}
        </span>
        <span
          className={`mgr-select-icon ${open ? "mgr-select-icon--open" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <polyline
              points="6 9 12 15 18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="mgr-select-menu">
          <div
            className="mgr-select-option mgr-select-option--selected"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {" "}
            {placeholder}
          </div>

          {options.map((opt) => (
            <div
              key={opt.value}
              className="mgr-select-option"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManagerEscalationModal = ({ review, onClose, onEscalate }) => {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDeptHead, setFetchingDeptHead] = useState(true);
  const [deptHead, setDeptHead] = useState(null);
  const [error, setError] = useState(null);
  const [alreadyEscalated, setAlreadyEscalated] = useState(false);

  const reasons = [
    "SLA Breach Risk",
    "Performance Concern",
    "Process Violation",
    "Urgent Action Required",
    "Policy Clarification",
    "Other",
  ];

  useEffect(() => {
    checkEscalationStatus();
    fetchDepartmentHead();
  }, []);

  const checkEscalationStatus = async () => {
    try {
      const response = await slaService.getSLAEscalations(review.slaid);
      if (response?.success && response.data && response.data.length > 0) {
        const pendingL2Escalation = response.data.find(
          (esc) =>
            esc.escalationLevel === "L2" && esc.escalationStatus === "Pending"
        );
        if (pendingL2Escalation) setAlreadyEscalated(true);
      }
    } catch {}
  };

  const fetchDepartmentHead = async () => {
    setFetchingDeptHead(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.departmentName) {
        setDeptHead(null);
        setFetchingDeptHead(false);
        return;
      }
      const response = await slaService.getAllEmployees();
      if (response?.success && response.data) {
        const deptHeadInSameDepartment = response.data.find(
          (emp) =>
            emp.departmentName === user.departmentName &&
            (emp.roleName === "Department Head" ||
              emp.role === "Department Head")
        );
        setDeptHead(deptHeadInSameDepartment || null);
      } else {
        setDeptHead(null);
      }
    } catch {
      setDeptHead(null);
    } finally {
      setFetchingDeptHead(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!reason) {
      setError("Please select a reason");
      return;
    }
    if (comments.trim().length < 10) {
      setError("Comments must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        slaid: review.slaid,
        escalationLevel: "L2",
        submittedByEmployeeId: user.empId,
        escalatedToEmployeeId: deptHead.employeeId || deptHead.employeeMasterId,
        reason,
        description: comments.trim(),
      };

      await onEscalate(payload);
      toast.success("SLA escalated successfully");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || "Error escalating");
      toast.error("Escalation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  if (fetchingDeptHead) {
    return (
      <div className="mgr-overlay mgr-overlay--center-only">
        <div className="mgr-loading-card">
          <div
            className="spinner-border text-primary mgr-loading-spinner"
            role="status"
          />
          <p className="mgr-loading-text">Loading escalation details...</p>
        </div>
      </div>
    );
  }

  if (alreadyEscalated) {
    return (
      <div className="mgr-overlay" onClick={onClose}>
        <div
          className="mgr-modal mgr-modal--small"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mgr-modal-header mgr-modal-header--primary">
            <h5 className="mgr-modal-title">Already Escalated</h5>
            <button className="mgr-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="mgr-modal-body mgr-modal-body--center">
            <AlertTriangle size={48} className="mgr-icon-warning" />
            <h6 className="mgr-modal-subtitle">Escalation Already Pending</h6>
            <p className="mgr-modal-text">
              This SLA has already been escalated to the Department Head and is
              awaiting response.
            </p>
          </div>

          <div className="mgr-modal-footer mgr-modal-footer--single">
            <button className="mgr-btn mgr-btn--close-full" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deptHead) {
    return (
      <div className="mgr-overlay" onClick={onClose}>
        <div
          className="mgr-modal mgr-modal--small"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mgr-modal-header mgr-modal-header--primary">
            <h5 className="mgr-modal-title">Error</h5>
            <button className="mgr-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="mgr-modal-body mgr-modal-body--center">
            <AlertTriangle size={48} className="mgr-icon-error" />
            <h6 className="mgr-modal-subtitle">No Department Head Available</h6>
            <p className="mgr-modal-text">
              Cannot escalate: No department head found for your department.
            </p>
          </div>

          <div className="mgr-modal-footer mgr-modal-footer--single">
            <button className="mgr-btn mgr-btn--close-full" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isValid = reason && comments.trim().length >= 10;

  return (
    <div className="mgr-overlay" onClick={!loading ? onClose : undefined}>
      <div
        className="mgr-modal mgr-modal--main"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mgr-modal-header mgr-modal-header--primary">
          <h5 className="mgr-modal-title">Escalate to Department Head</h5>
          <button
            className={`mgr-close-btn ${
              loading ? "mgr-close-btn--disabled" : ""
            }`}
            onClick={onClose}
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mgr-modal-body mgr-modal-body--main">
          {error && (
            <div className="mgr-error-alert">
              <AlertCircle size={20} className="mgr-error-icon" />
              <div className="mgr-error-text-wrapper">
                <p className="mgr-error-text">{error}</p>
              </div>
              <button
                className="mgr-error-close"
                onClick={() => setError(null)}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mgr-card mgr-card--sla">
              <small className="mgr-card-label">SLA Details</small>
              <strong className="mgr-card-title">
                {review.employeeName} - {review.slatype}
              </strong>
              <small className="mgr-card-subtitle">SLA #{review.slaid}</small>
            </div>

            <div className="mgr-card mgr-card--target">
              <small className="mgr-card-label mgr-card-label--accent">
                Escalating To
              </small>
              <strong className="mgr-card-title mgr-card-title--accent">
                {deptHead.firstName} {deptHead.lastName}
              </strong>
              <small className="mgr-card-subtitle mgr-card-subtitle--accent">
                {deptHead.departmentName} - Department Head
              </small>
            </div>

            <div className="mgr-field">
              <label className="mgr-label">
                Reason <span className="mgr-required">*</span>
              </label>
              <div
                className={`mgr-select-container ${
                  loading ? "mgr-select-container--disabled" : ""
                }`}
              >
                <MgrSelect
                  value={reason}
                  onChange={setReason}
                  options={reasons.map((r) => ({ value: r, label: r }))}
                  placeholder="-- Select Reason --"
                />
              </div>
            </div>

            <div className="mgr-field mgr-field--comment">
              <label className="mgr-label">
                Your Comment <span className="mgr-required">*</span>
              </label>
              <textarea
                rows="4"
                className="mgr-textarea"
                placeholder="Explain why you're escalating..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={250}
                disabled={loading}
              />
              <small className="mgr-char-count">
                {comments.length}/250 characters
              </small>
            </div>
          </form>
        </div>

        <div className="mgr-modal-footer">
          <button
            className="mgr-btn mgr-btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={`mgr-btn mgr-btn--primary ${
              loading || !isValid ? "mgr-btn--disabled" : ""
            }`}
            onClick={handleSubmit}
            disabled={loading || !isValid}
          >
            {loading ? (
              <>
                <span className="mgr-btn-spinner" />
                Escalating...
              </>
            ) : (
              <>
                <Send size={18} /> Escalate to DH{" "}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ManagerEscalationModal;
