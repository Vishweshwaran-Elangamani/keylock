import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

const EscalationForm = ({ sla, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managerId, setManagerId] = useState(null);
  const [managerName, setManagerName] = useState("");
  const [loadingManager, setLoadingManager] = useState(true);
  const [managerError, setManagerError] = useState(null);

  const reasonOptions = [
    { value: "", label: "-- Select --" },
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
        console.log("📋 Current User:", {
          empId: user.empId,
          name: user.name,
          role: user.roleName,
        });

        if (!user.empId) {
          throw new Error("User employee ID not found in localStorage");
        }

        console.log(`🔍 Fetching employee details for ID: ${user.empId}`);
        const employeeResponse = await slaService.getEmployeeById(user.empId);

        if (!employeeResponse?.success || !employeeResponse.data) {
          throw new Error("Failed to fetch employee details");
        }

        const employee = employeeResponse.data;
        console.log("👤 Employee Details:", {
          id: employee.employeeId || employee.empId,
          name: `${employee.firstName} ${employee.lastName}`,
          reportsTo: employee.reportsTo,
          reportingToId: employee.reportingToId,
          managerId: employee.managerId,
        });

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

        console.log(`✅ Manager ID found: ${reportingManagerId}`);

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
            console.log(
              `👔 Manager Details: ${fullName} (ID: ${reportingManagerId})`
            );
          }
        } catch (err) {
          console.warn("⚠️ Could not fetch manager name, using ID only");
          setManagerName(`Manager (ID: ${reportingManagerId})`);
        }

        setManagerId(reportingManagerId);
        console.log("✅ Escalation target set successfully");
      } catch (error) {
        console.error("❌ Error fetching manager:", error);
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

      console.log("🚀 Submitting L1 Escalation:", {
        slaid: sla.slaid,
        reason: selectedReason,
        escalatedTo: managerId,
        escalatedToName: managerName,
        submittedBy: user.empId,
      });

      const response = await slaService.submitEscalation({
        slaid: sla.slaid,
        reason: selectedReason,
        description: description.trim(),
        escalatedToEmployeeId: managerId,
        submittedByEmployeeId: user.empId,
      });

      if (response?.success) {
        console.log(" Escalation successful");
        toast.success("SLA Escalated Successfully", {
          description: `Escalated to ${managerName} for review`,
          duration: 4000,
        });
        onSuccess();
      } else {
        console.error("Escalation failed:", response?.message);
        toast.error("Escalation Failed", {
          description: response?.message || "Unable to escalate SLA",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(" Escalation error:", error);
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
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1055,
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content"
          style={{
            borderRadius: "16px",
            border: "none",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header - Dark Purple Theme */}
          <div
            style={{
              background: "#3E3A64",
              padding: "1.25rem 1.5rem",
              borderBottom: "none",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={16} color="#FCD34D" />
                </div>
                <h5
                  className="mb-0 fw-bold"
                  style={{
                    color: "#fff",
                    fontSize: "1rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Add Escalation
                </h5>
              </div>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={20} color="#fff" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "1.5rem" }}>
            {loadingManager ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border text-primary"
                  role="status"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p
                  className="text-muted mt-3 mb-0"
                  style={{ fontSize: "0.875rem" }}
                >
                  Loading escalation details...
                </p>
              </div>
            ) : managerError ? (
              <div>
                <div
                  className="alert alert-danger d-flex align-items-start gap-3"
                  style={{ borderRadius: "8px" }}
                >
                  <AlertCircle
                    size={20}
                    className="flex-shrink-0"
                    style={{ marginTop: "2px" }}
                  />
                  <div>
                    <strong className="d-block mb-1">Manager Not Found</strong>
                    <small>{managerError}</small>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    style={{ borderRadius: "8px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Goal Section */}
                <div
                  className="mb-3"
                  style={{
                    background: "#F3F4F6",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6B7280",
                      marginBottom: "0.25rem",
                      display: "block",
                    }}
                  >
                    Goal:
                  </label>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#1F2937",
                      fontWeight: 500,
                    }}
                  >
                    {sla.slatype}
                  </div>
                </div>

                {/* Deadline Info */}
                <div className="mb-3">
                  <small
                    style={{
                      fontSize: "0.813rem",
                      color: "#DC2626",
                      fontWeight: 500,
                    }}
                  >
                    Deadline:{" "}
                    {new Date(sla.deadline).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </div>

                {/* Manager Info */}
                {managerName && (
                  <div
                    className="alert d-flex align-items-start gap-2 mb-3"
                    style={{
                      borderRadius: "8px",
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      padding: "0.75rem",
                    }}
                  >
                    <AlertCircle
                      size={16}
                      color="#2563EB"
                      style={{ marginTop: "2px", flexShrink: 0 }}
                    />
                    <small style={{ color: "#1E40AF", fontSize: "0.813rem" }}>
                      This will be escalated to <strong>{managerName}</strong>
                    </small>
                  </div>
                )}

                {/* Reason Dropdown */}
                <div className="mb-3">
                  <label
                    htmlFor="reason"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    Reason <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    id="reason"
                    className="form-select"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    required
                    disabled={submitting}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.875rem",
                      color: selectedReason ? "#1F2937" : "#9CA3AF",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3B82F6";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(59,130,246,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {reasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Your Comment Textarea */}
                <div className="mb-2">
                  <label
                    htmlFor="details"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    Your Comment <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea
                    id="details"
                    className="form-control"
                    placeholder="Write your comment here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    rows={3}
                    disabled={submitting}
                    maxLength={500}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      padding: "0.625rem 0.875rem",
                      fontSize: "0.875rem",
                      resize: "none",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3B82F6";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(59,130,246,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small
                      style={{
                        color: "#9CA3AF",
                        fontSize: "0.75rem",
                        fontStyle: "italic",
                      }}
                    >
                      ⓘ Press Ctrl+Enter to submit quickly
                    </small>
                    <small
                      style={{
                        color: "#9CA3AF",
                        fontSize: "0.75rem",
                      }}
                    >
                      {description.length}/500
                    </small>
                  </div>
                </div>

                {/* Info Alert */}
                <div
                  style={{
                    background: "#DBEAFE",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginTop: "1rem",
                    display: "flex",
                    alignItems: "start",
                    gap: "0.5rem",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  <AlertCircle
                    size={16}
                    color="#2563EB"
                    style={{ marginTop: "2px", flexShrink: 0 }}
                  />
                  <small
                    style={{
                      color: "#1E40AF",
                      fontSize: "0.813rem",
                      lineHeight: "1.4",
                    }}
                  >
                    <strong>Level 1 (L1)</strong> escalation to your manager
                    for immediate review.
                  </small>
                </div>

                {/* Footer Buttons */}
                <div
                  style={{
                    marginTop: "1.25rem",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={onClose}
                    disabled={submitting}
                    style={{
                      borderRadius: "8px",
                      padding: "0.5rem 1.25rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      border: "1px solid #D1D5DB",
                      background: "#fff",
                      color: "#6B7280",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.borderColor = "#9CA3AF";
                        e.currentTarget.style.color = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.borderColor = "#D1D5DB";
                        e.currentTarget.style.color = "#6B7280";
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn d-flex align-items-center gap-2"
                    disabled={
                      submitting ||
                      loadingManager ||
                      !managerId ||
                      !selectedReason ||
                      description.trim().length < 10
                    }
                    style={{
                      borderRadius: "8px",
                      padding: "0.5rem 1.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      background: "#C2185B",
                      color: "#fff",
                      border: "none",
                      transition: "all 0.2s",
                      opacity:
                        submitting ||
                        loadingManager ||
                        !managerId ||
                        !selectedReason ||
                        description.trim().length < 10
                          ? 0.6
                          : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (
                        !submitting &&
                        !loadingManager &&
                        managerId &&
                        selectedReason &&
                        description.trim().length >= 10
                      ) {
                        e.currentTarget.style.background = "#AD1457";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(194,24,91,0.25)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (
                        !submitting &&
                        !loadingManager &&
                        managerId &&
                        selectedReason &&
                        description.trim().length >= 10
                      ) {
                        e.currentTarget.style.background = "#C2185B";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <svg
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
