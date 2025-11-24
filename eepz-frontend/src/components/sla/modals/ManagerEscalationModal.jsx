import React, { useState, useEffect } from "react";
import { X, Send, AlertTriangle, AlertCircle } from "lucide-react";
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

  // Loading State
  if (fetchingDeptHead) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050,
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            maxWidth: "320px",
          }}
        >
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "2.5rem", height: "2.5rem" }}
          />
          <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem" }}>
            Loading escalation details...
          </p>
        </div>
      </div>
    );
  }

  // Already Escalated Error
  if (alreadyEscalated) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "420px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.25rem 1.5rem",
              backgroundColor: "#3c3862",
              borderBottom: "none",
            }}
          >
            <h5
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "white",
                textAlign: "left",
              }}
            >
              Already Escalated
            </h5>
            <button
              onClick={onClose}
              style={{
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.8,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
            >
              <X size={24} color="white" />
            </button>
          </div>

          <div style={{ padding: "2rem", backgroundColor: "#f8f9fa", textAlign: "center" }}>
            <AlertTriangle size={48} style={{ color: "#F59E0B", marginBottom: "1rem" }} />
            <h6 style={{ fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>
              Escalation Already Pending
            </h6>
            <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem", textAlign: "center" }}>
              This SLA has already been escalated to the Department Head and is awaiting response.
            </p>
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.625rem 1.25rem",
                border: "none",
                backgroundColor: "#6b7280",
                color: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#6b7280";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No Department Head Error
  if (!deptHead) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1050,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "420px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.25rem 1.5rem",
              backgroundColor: "#3c3862",
              borderBottom: "none",
            }}
          >
            <h5
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "white",
                textAlign: "left",
              }}
            >
              Error
            </h5>
            <button
              onClick={onClose}
              style={{
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.8,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
            >
              <X size={24} color="white" />
            </button>
          </div>

          <div style={{ padding: "2rem", backgroundColor: "#f8f9fa", textAlign: "center" }}>
            <AlertTriangle size={48} style={{ color: "#EF4444", marginBottom: "1rem" }} />
            <h6 style={{ fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>
              No Department Head Available
            </h6>
            <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem", textAlign: "center" }}>
              Cannot escalate: No department head found for your department.
            </p>
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "white",
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.625rem 1.25rem",
                border: "none",
                backgroundColor: "#6b7280",
                color: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#6b7280";
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        backdropFilter: "blur(4px)",
      }}
      onClick={!loading ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "540px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            backgroundColor: "#3c3862",
            borderBottom: "none",
          }}
        >
          <h5
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              textAlign: "left",
            }}
          >
            Escalate to Department Head
          </h5>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 0.8,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "1";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = "0.8";
              }
            }}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {/* Error Alert */}
          {error && (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "rgba(224, 25, 80, 0.1)",
                border: "1px solid rgba(224, 25, 80, 0.3)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle
                size={20}
                style={{ color: "#E01950", flexShrink: 0, marginTop: "2px" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: "#991b1b", fontSize: "0.875rem", textAlign: "left" }}>
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  color: "#E01950",
                  opacity: 0.7,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* SLA Details Box */}
            <div
              style={{
                backgroundColor: "white",
                padding: "0.875rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                marginBottom: "1.5rem",
              }}
            >
              <small
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                SLA Details
              </small>
              <strong
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.9375rem",
                  color: "#374151",
                  textAlign: "left",
                }}
              >
                {review.employeeName} - {review.slatype}
              </strong>
              <small
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                SLA #{review.slaid}
              </small>
            </div>

            {/* Escalating To Box */}
            <div
              style={{
                backgroundColor: "#E0E7FF",
                padding: "0.875rem",
                borderRadius: "8px",
                border: "1px solid #C7D2FE",
                marginBottom: "1.5rem",
              }}
            >
              <small
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#4338CA",
                  textAlign: "left",
                }}
              >
                Escalating To
              </small>
              <strong
                style={{
                  display: "block",
                  marginBottom: "0.25rem",
                  fontSize: "0.9375rem",
                  color: "#3730A3",
                  textAlign: "left",
                }}
              >
                {deptHead.firstName} {deptHead.lastName}
              </strong>
              <small
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  color: "#4338CA",
                  textAlign: "left",
                }}
              >
                {deptHead.departmentName} - Department Head
              </small>
            </div>

            {/* Reason Dropdown */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Reason <span style={{ color: "#E01950" }}>*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  textAlign: "left",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
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

            {/* Comments Textarea */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Your Comment <span style={{ color: "#E01950" }}>*</span>
              </label>
              <textarea
                rows="4"
                placeholder="Explain why you're escalating..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={250}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  lineHeight: "1.6",
                  textAlign: "left",
                  resize: "none",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "text",
                }}
              />
              <small
                style={{
                  display: "block",
                  marginTop: "0.375rem",
                  fontSize: "0.8125rem",
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                {comments.length}/250 characters
              </small>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "white",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.625rem 1.25rem",
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            style={{
              padding: "0.625rem 1.5rem",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading || !isValid ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: loading || !isValid ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(loading || !isValid)) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(151, 36, 126, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(151, 36, 126, 0.3)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Escalating...
              </>
            ) : (
              <>
                <Send size={18} />
                Escalate to DH
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ManagerEscalationModal;
