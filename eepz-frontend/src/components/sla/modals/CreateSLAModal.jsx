import React, { useState, useEffect } from "react";
import { Plus, Loader, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

const CreateSLAModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);

  const [formData, setFormData] = useState({
    reviewType: "",
    deadline: "",
    reason: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ========== FETCH EMPLOYEE COUNT ==========
  useEffect(() => {
    const fetchCount = async () => {
      try {
        setFetchLoading(true);
        const res = await slaService.getAllEmployees();

        if (res?.success && Array.isArray(res.data)) {
          const uniqueEmployees = new Set();

          res.data.forEach((item) => {
            if (item.employeeId) {
              uniqueEmployees.add(item.employeeId);
            }
          });

          setEmployeeCount(uniqueEmployees.size);
        } else {
          toast.error("Failed to load employee count");
          setError("Failed to load employee count");
        }
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load employee count");
        setError("Failed to load employee count");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchCount();
  }, []);

  // ========== HANDLE FORM CHANGE ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // ========== SUBMIT (BULK CREATE WITH TOAST) ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.reviewType.trim()) {
      toast.error("Please enter a review type");
      setError("Please enter a review type");
      return;
    }
    if (!formData.deadline) {
      toast.error("Please select a deadline");
      setError("Please select a deadline");
      return;
    }

    // Validate deadline
    const deadline = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      toast.error("Deadline must be in the future");
      setError("Deadline must be in the future");
      return;
    }

    setLoading(true);

    // Show loading toast
    const loadingToast = toast.loading("Creating SLAs...");

    try {
      const deadlineIso = new Date(formData.deadline).toISOString();

      // Step 1: Fetch all employees
      const res = await slaService.getAllEmployees();

      if (!res?.success || !Array.isArray(res.data)) {
        toast.dismiss(loadingToast);
        toast.error("Failed to fetch employees");
        setError("Failed to fetch employees");
        setLoading(false);
        return;
      }

      // Step 2: Build unique employees map
      const uniqueEmployees = new Map();
      res.data.forEach((item) => {
        if (item.employeeId && !uniqueEmployees.has(item.employeeId)) {
          uniqueEmployees.set(item.employeeId, {
            employeeId: item.employeeId,
            employeeName:
              item.employeeName ||
              (item.firstName && item.lastName
                ? `${item.firstName} ${item.lastName}`
                : "Unknown"),
            departmentId: item.departmentId || 2,
          });
        }
      });

      // Step 3: Build bulk SLA requests array
      const bulkRequests = Array.from(uniqueEmployees.values()).map((emp) => ({
        slatype: formData.reviewType,
        employeeId: emp.employeeId,
        assignedToEmployeeId: null,
        departmentId: emp.departmentId,
        deadline: deadlineIso,
        relatedEntityType: null,
        relatedEntityId: null,
        createdByEmployeeId: user?.empId || 1,
        creationReason: formData.reason || `${formData.reviewType} assigned`,
      }));

      // Step 4: Call bulk create endpoint
      const response = await slaService.createBulkSLA(bulkRequests);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response?.success) {
        const resultData = response.data;

        // Show success toast with count only
        toast.success(
          `SLA Created Successfully`,
          {
            duration: 3000,
          }
        );

        // Close modal after short delay
        setTimeout(() => {
          if (resultData.successfulInserts > 0) {
            onSuccess?.();
            onClose?.();
          }
        }, 1500);
      } else {
        toast.error("Failed to create SLAs");
        setError(response?.message || "Failed to create SLAs");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to create SLAs");
      setError(err?.message || "Error creating SLAs");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "500px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
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
            Create SLA
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
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.opacity = "1")
            }
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {fetchLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Loader
                size={32}
                style={{
                  color: "#97247E",
                  marginBottom: "1rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "#666", fontSize: "0.95rem" }}>
                Loading employee count...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ERROR ALERT */}
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
                    style={{
                      color: "#E01950",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      color: "#991b1b",
                      fontSize: "0.95rem",
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* REVIEW TYPE INPUT */}
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
                  Review Type <span style={{ color: "#E01950" }}>*</span>
                </label>
                <input
                  type="text"
                  name="reviewType"
                  value={formData.reviewType}
                  onChange={handleChange}
                  placeholder="E.g., Performance Form, Quarterly Review"
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f3f4f6" : "white",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "text",
                  }}
                />
              </div>

              {/* DEADLINE INPUT */}
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
                  Deadline <span style={{ color: "#E01950" }}>*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f3f4f6" : "white",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "text",
                  }}
                />
              </div>

              {/* REASON INPUT */}
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
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Why assign this SLA?"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f3f4f6" : "white",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "text",
                  }}
                />
              </div>

              {/* EMPLOYEE COUNT INFO */}
              <div
                style={{
                  backgroundColor: "rgba(13, 110, 253, 0.1)",
                  border: "1px solid rgba(13, 110, 253, 0.3)",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#0F62FE",
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    lineHeight: 1.2,
                    textAlign: "left",
                  }}
                >
                  {employeeCount} Employees
                </p>
                <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                  SLA will be displayed to all employees
                </small>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER */}
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
              padding: "0.6rem 1.25rem",
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
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
            disabled={loading || fetchLoading || employeeCount === 0}
            style={{
              padding: "0.6rem 1.5rem",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                loading || fetchLoading || employeeCount === 0
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: loading || fetchLoading || employeeCount === 0 ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(loading || fetchLoading || employeeCount === 0)) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(151, 36, 126, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(151, 36, 126, 0.3)";
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
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create SLA
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

export default CreateSLAModal;
