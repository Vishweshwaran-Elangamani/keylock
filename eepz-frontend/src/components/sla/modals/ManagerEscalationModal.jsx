import React, { useState, useEffect } from "react";
import { X, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

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
    // eslint-disable-next-line
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
    } catch (error) {
      /* silent */
    }
  };

  const fetchDepartmentHead = async () => {
    setFetchingDeptHead(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user.departmentName) {
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
    } catch (error) {
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
      toast.warning("Validation Error", {
        description: "Please select a reason for escalation",
      });
      return;
    }
    if (comments.trim().length < 10) {
      setError("Comments must be at least 10 characters");
      toast.warning("Validation Error", {
        description: "Comments must be at least 10 characters",
      });
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

      toast.success("Escalation Successful!", {
        description: `SLA escalated to ${deptHead.firstName} ${deptHead.lastName} (Department Head).`,
        duration: 3000,
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Error escalating");
      toast.error("Escalation Failed", {
        description:
          err.message ||
          "An error occurred while escalating. Please try again.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (
      e.ctrlKey &&
      e.key === "Enter" &&
      reason &&
      comments.trim().length >= 10 &&
      !loading
    ) {
      handleSubmit(e);
    }
  };

  if (!review) return null;

  // ========== LOADING STATE ==========
  if (fetchingDeptHead) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1055,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="text-muted mb-0">Loading escalation details...</p>
        </div>
      </div>
    );
  }

  // ========== ALREADY ESCALATED ERROR ==========
  if (alreadyEscalated) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1055,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
            maxWidth: "500px",
            width: "90%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ background: "#3E3A64", padding: "1rem 1.5rem" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} color="#FCD34D" />
                <h6 className="mb-0 fw-bold" style={{ color: "#fff" }}>
                  Already Escalated
                </h6>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} color="#fff" />
              </button>
            </div>
          </div>

          <div style={{ padding: "2rem", textAlign: "center" }}>
            <AlertTriangle size={48} className="text-warning mb-3" />
            <h5 className="fw-bold mb-2">Escalation Already Pending</h5>
            <p className="text-muted mb-0">
              This SLA has already been escalated to the Department Head and is
              awaiting response.
            </p>
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #DEE2E6",
              background: "#F8F9FA",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                borderRadius: "6px",
                padding: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                background: "#6C757D",
                color: "#fff",
                border: "none",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== NO DEPT HEAD ERROR ==========
  if (!deptHead) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1055,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
            maxWidth: "500px",
            width: "90%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ background: "#3E3A64", padding: "1rem 1.5rem" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} color="#DC3545" />
                <h6 className="mb-0 fw-bold" style={{ color: "#fff" }}>
                  Error
                </h6>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} color="#fff" />
              </button>
            </div>
          </div>

          <div style={{ padding: "2rem", textAlign: "center" }}>
            <AlertTriangle size={48} className="text-danger mb-3" />
            <h5 className="fw-bold mb-2">No Department Head Available</h5>
            <p className="text-muted mb-0">
              Cannot escalate: No department head found for your department.
            </p>
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #DEE2E6",
              background: "#F8F9FA",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                borderRadius: "6px",
                padding: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                background: "#6C757D",
                color: "#fff",
                border: "none",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isValid = reason && comments.trim().length >= 10;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1055,
        padding: "1rem",
      }}
      onClick={!loading ? onClose : undefined}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          overflow: "hidden",
          maxWidth: "1100px",
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#3E3A64",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "#fff" }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h6 className="mb-0 fw-bold" style={{ color: "#fff", fontSize: "1rem" }}>
              Escalate to Department Head
            </h6>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              opacity: 0.9,
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "2rem 3rem" }}>
            {error && (
              <div
                className="alert alert-danger d-flex align-items-start gap-2 mb-4"
                style={{ borderRadius: "8px" }}
              >
                <AlertTriangle size={18} className="flex-shrink-0 mt-1" />
                <span>{error}</span>
              </div>
            )}

            {/* SLA Details Section */}
            <div
              style={{
                background: "#F8F9FA",
                padding: "1.25rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid #E9ECEF",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  color: "#6C757D",
                  marginBottom: "0.5rem",
                }}
              >
                SLA Details:
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  color: "#212529",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                {review.employeeName} - {review.slatype}
              </div>
              <small style={{ color: "#6C757D", fontSize: "0.813rem" }}>
                SLA #{review.slaid}
              </small>
            </div>

            {/* Escalating To Section */}
            <div
              style={{
                background: "#E8F4F8",
                padding: "1.25rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid #BFDBFE",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  color: "#1E40AF",
                  marginBottom: "0.5rem",
                }}
              >
                Escalating To:
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  color: "#1E40AF",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                }}
              >
                {deptHead.firstName} {deptHead.lastName}
              </div>
              <small style={{ color: "#2563EB", fontSize: "0.813rem" }}>
                {deptHead.departmentName} - Department Head
              </small>
            </div>

            {/* Reason Dropdown */}
            <div className="mb-4">
              <label
                htmlFor="reason"
                style={{
                  fontSize: "0.938rem",
                  fontWeight: 600,
                  color: "#212529",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Reason <span style={{ color: "#DC3545" }}>*</span>
              </label>
              <select
                id="reason"
                className="form-select form-select-lg"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                required
                style={{
                  borderRadius: "8px",
                  border: "2px solid #0D6EFD",
                  padding: "0.75rem 1rem",
                  fontSize: "0.938rem",
                }}
              >
                <option value="">-- Select Reason --</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Comment Textarea */}
            <div className="mb-3">
              <label
                htmlFor="comments"
                style={{
                  fontSize: "0.938rem",
                  fontWeight: 600,
                  color: "#212529",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Your Comment <span style={{ color: "#DC3545" }}>*</span>
              </label>
              <textarea
                id="comments"
                className="form-control"
                rows={5}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Explain why you're escalating..."
                disabled={loading}
                maxLength={250}
                required
                style={{
                  borderRadius: "8px",
                  border: "2px solid #0D6EFD",
                  padding: "0.875rem 1rem",
                  fontSize: "0.938rem",
                  resize: "none",
                }}
              />
              <div
                className="d-flex justify-content-between align-items-center"
                style={{ marginTop: "0.5rem" }}
              >
                <small
                  style={{
                    color: "#6C757D",
                    fontSize: "0.813rem",
                    fontStyle: "italic",
                  }}
                >
                  ⓘ Press Ctrl+Enter to submit quickly
                </small>
                <small style={{ color: "#6C757D", fontSize: "0.813rem" }}>
                  {comments.length}/250
                </small>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "1.25rem 3rem",
              borderTop: "1px solid #DEE2E6",
              background: "#F8F9FA",
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              className="btn btn-lg"
              onClick={onClose}
              disabled={loading}
              style={{
                borderRadius: "6px",
                padding: "0.625rem 2rem",
                fontSize: "0.938rem",
                fontWeight: 500,
                border: "1px solid #6C757D",
                background: "transparent",
                color: "#6C757D",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-lg d-flex align-items-center gap-2"
              disabled={loading || !isValid}
              style={{
                borderRadius: "6px",
                padding: "0.625rem 2.5rem",
                fontSize: "0.938rem",
                fontWeight: 500,
                background: "#C2185B",
                color: "#fff",
                border: "none",
                opacity: loading || !isValid ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  <span>Escalating...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Escalate to DH</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerEscalationModal;
