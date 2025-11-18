import React, { useState, useEffect } from "react";
import { Plus, Loader, AlertCircle, X } from "lucide-react";
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
        // const res = await slaService.getAllSLAs();
        const res = await slaService.getAllEmployees();

        if (res?.success && Array.isArray(res.data)) {
          const uniqueEmployees = new Set();

          res.data.forEach((item) => {
            if (item.employeeId) {
              uniqueEmployees.add(item.employeeId);
            }
          });

          setEmployeeCount(uniqueEmployees.size);
          console.log(` ${uniqueEmployees.size} employees found`);
        } else {
          setError("Failed to load employee count");
        }
      } catch (err) {
        console.error(" Error:", err);
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

  // ========== SUBMIT ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.reviewType.trim()) {
      setError("Please enter a review type");
      return;
    }
    if (!formData.deadline) {
      setError("Please select a deadline");
      return;
    }

    // Validate deadline
    const deadline = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      setError("Deadline must be in the future");
      return;
    }

    setLoading(true);

    try {
      const deadlineIso = new Date(formData.deadline).toISOString();

      // Fetch all employees
      const res = await slaService.getAllEmployees();

      if (!res?.success || !Array.isArray(res.data)) {
        setError("Failed to fetch employees");
        setLoading(false);
        return;
      }

      const uniqueEmployees = new Map();
      res.data.forEach((item) => {
        if (item.employeeId && !uniqueEmployees.has(item.employeeId)) {
          uniqueEmployees.set(item.employeeId, {
            id: item.employeeId,
            name: item.employeeName,
          });
        }
      });

      let successCount = 0;
      let failedCount = 0;

      console.log(` Creating SLA for ${uniqueEmployees.size} employees...`);

      // Create SLA for each employee
      for (const [empId, empData] of uniqueEmployees) {
        try {
          const requestData = {
            slatype: formData.reviewType,
            employeeId: empId,
            assignedToEmployeeId: user?.empId || 1,
            departmentId: 2,
            deadline: deadlineIso,
            creationReason:
              formData.reason || `${formData.reviewType} assigned`,
            createdByEmployeeId: user?.empId || 1,
          };

          const response = await slaService.createSLA(requestData);

          if (response?.success) {
            successCount++;
            console.log(` SLA created for ${empData.name}`);
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      console.log(` Summary: ${successCount} created, ${failedCount} failed`);

      if (successCount > 0) {
        onSuccess?.();
        onClose?.();
      } else {
      }
    } catch (err) {
      console.error(" Error:", err);
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem",
            borderBottom: "1px solid #e0e0e0",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px 12px 0 0",
          }}
        >
          <h5 style={{ margin: 0, fontWeight: "bold", fontSize: "1.25rem" }}>
            Create SLA
          </h5>
          <button
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            <X size={24} color="#999" />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "2rem" }}>
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
                  color: "#0F62FE",
                  marginBottom: "1rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "#666" }}>Loading employee count...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ERROR */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "1rem",
                    backgroundColor: "#fde7e7",
                    border: "1px solid #e01950",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <AlertCircle
                    size={20}
                    style={{ color: "#e01950", flexShrink: 0 }}
                  />
                  <p style={{ margin: 0, color: "#666" }}>{error}</p>
                </div>
              )}

              {/* REVIEW TYPE (TEXT INPUT) */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Review Type <span style={{ color: "#e01950" }}>*</span>
                </label>
                <input
                  type="text"
                  name="reviewType"
                  value={formData.reviewType}
                  onChange={handleChange}
                  placeholder="E.g., Performance Form, Quarterly Review, Annual Review"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <small
                  style={{
                    color: "#999",
                    display: "block",
                    marginTop: "0.25rem",
                  }}
                >
                  Type any review type name
                </small>
              </div>

              {/* DEADLINE */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Deadline <span style={{ color: "#e01950" }}>*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* REASON */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    color: "#333",
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
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* EMPLOYEE COUNT INFO */}
              <div
                style={{
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #0F62FE",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#0F62FE",
                    fontWeight: "600",
                    fontSize: "1.25rem",
                  }}
                >
                  {employeeCount} Employees
                </p>
                <small style={{ color: "#666" }}>
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
            gap: "1rem",
            padding: "1.5rem",
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#f8f9fa",
            borderRadius: "0 0 12px 12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              border: "1px solid #e0e0e0",
              backgroundColor: "white",
              color: "#333",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fetchLoading || employeeCount === 0}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0F62FE",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                loading || fetchLoading || employeeCount === 0
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: loading || fetchLoading || employeeCount === 0 ? 0.6 : 1,
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
                <Plus size={16} />
                Create
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
