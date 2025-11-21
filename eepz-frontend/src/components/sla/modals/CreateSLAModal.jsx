import React, { useState, useEffect } from "react";
import { Plus, Loader, AlertCircle, X, CheckCircle } from "lucide-react";
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
          console.log(`${uniqueEmployees.size} employees found`);
        } else {
          setError("Failed to load employee count");
        }
      } catch (err) {
        console.error("Error:", err);
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

      console.log(`Creating SLA for ${uniqueEmployees.size} employees...`);

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
            console.log(`SLA created for ${empData.name}`);
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      console.log(`Summary: ${successCount} created, ${failedCount} failed`);

      if (successCount > 0) {
        onSuccess?.();
        onClose?.();
      }
    } catch (err) {
      console.error("Error:", err);
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
        {/* ✅ UPDATED HEADER - Dark Purple Theme */}
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
              textAlign: "left"
            }}
          >
            Create SLA
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
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.8"}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* ✅ UPDATED BODY - Light Gray Background */}
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
              <p style={{ color: "#666", fontSize: "0.95rem" }}>Loading employee count...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ✅ UPDATED ERROR ALERT */}
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
                  <p style={{ margin: 0, color: "#991b1b", fontSize: "0.95rem" }}>{error}</p>
                </div>
              )}

              {/* ✅ UPDATED REVIEW TYPE INPUT */}
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
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                    textAlign: "left",
                  }}
                />
                <small
                  style={{
                    color: "#6b7280",
                    display: "block",
                    marginTop: "0.375rem",
                    fontSize: "0.85rem",
                    textAlign: "left",
                  }}
                >
                  Type any review type name
                </small>
              </div>

              {/* ✅ UPDATED DEADLINE INPUT */}
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
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                    textAlign: "left",
                  }}
                />
              </div>

              {/* ✅ UPDATED REASON INPUT */}
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
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                    textAlign: "left",
                  }}
                />
              </div>

              {/* ✅ UPDATED EMPLOYEE COUNT INFO */}
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

        {/* ✅ UPDATED FOOTER */}
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
          
          {/* ✅ UPDATED CREATE BUTTON - Gradient Theme */}
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
