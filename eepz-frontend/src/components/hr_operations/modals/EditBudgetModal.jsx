import React, { useState, useEffect } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import { toast } from "sonner";

const EditBudgetModal = ({ show, budget, onHide, onBudgetUpdated }) => {
  const [formData, setFormData] = useState({
    budgetId: "",
    departmentId: "",
    fiscalYear: "",
    totalBudget: "",
    allocatedAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && budget) {
      setFormData({
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        fiscalYear: budget.fiscalYear,
        totalBudget: budget.totalBudget,
        allocatedAmount: budget.allocatedAmount,
      });
      setErrors({});
    }
  }, [show, budget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "fiscalYear"
          ? parseInt(value)
          : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
      newErrors.totalBudget = "Total budget must be greater than zero";
    }

    const allocatedAmount = formData.allocatedAmount
      ? parseFloat(formData.allocatedAmount)
      : parseFloat(formData.totalBudget);

    if (allocatedAmount > parseFloat(formData.totalBudget)) {
      newErrors.allocatedAmount = "Allocated amount cannot exceed total budget";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const allocatedAmount = formData.allocatedAmount
        ? parseFloat(formData.allocatedAmount)
        : parseFloat(formData.totalBudget);

      await budgetAllocationService.updateDepartmentBudget({
        budgetId: formData.budgetId,
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: allocatedAmount,
      });
      toast.success("Budget updated successfully!");
      onBudgetUpdated();
      handleClose();
    } catch (err) {
      console.error("❌ Error updating budget:", err);
      toast.error(err.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "97%",
          maxWidth: "800px",
          maxHeight: "100vh",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-pencil"></i>
              Edit Department Budget
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <div
              style={{
                padding: "14px 15px 6px 15px",
                background: "#fff",
                textAlign: "left",
              }}
            >
              {/* BUDGET INFO */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Department:
                  </label>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    {budget?.departmentName || "Unknown"}
                  </span>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Fiscal Year:
                  </label>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    {budget?.fiscalYear}
                  </span>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Created On:
                  </label>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    {budget?.createdAt
                      ? new Date(budget.createdAt).toLocaleDateString("en-IN")
                      : "N/A"}
                  </span>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    Headcount:
                  </label>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                    {budget?.headcount || 0}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {/* Total Budget */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Total Budget (₹){" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="totalBudget"
                    placeholder="Enter total budget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      border: errors.totalBudget
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.totalBudget && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.totalBudget}
                    </div>
                  )}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Total budget for this department and fiscal year
                  </small>
                </div>

                {/* Allocated Amount */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#334155",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Allocated Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="allocatedAmount"
                    placeholder="Enter allocated amount"
                    value={formData.allocatedAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      border: errors.allocatedAmount
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.allocatedAmount && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.allocatedAmount}
                    </div>
                  )}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Amount available for allocation by HR/DeptHead
                  </small>
                </div>
              </div>

              {/* BUDGET COMPARISON */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  border: "2px solid #10b981",
                  borderRadius: 8,
                  padding: 14,
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#065f46",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  <i className="bi bi-arrow-left-right" style={{ fontSize: 18 }}></i>
                  <span>Budget Comparison</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {/* Current */}
                  <div>
                    <h6
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      CURRENT
                    </h6>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#ffffff",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <p style={{ fontSize: "12px", marginBottom: "6px", color: "#334155" }}>
                        <strong>Total:</strong> {formatCurrency(budget?.totalBudget)}
                      </p>
                      <p style={{ fontSize: "12px", marginBottom: "0px", color: "#334155" }}>
                        <strong>Allocated:</strong>{" "}
                        {formatCurrency(budget?.allocatedAmount)}
                      </p>
                    </div>
                  </div>

                  {/* New */}
                  <div>
                    <h6
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      NEW
                    </h6>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#ffffff",
                        borderRadius: "6px",
                        border: "2px solid #10b981",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          marginBottom: "6px",
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        <strong>Total:</strong> {formatCurrency(formData.totalBudget)}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          marginBottom: "0px",
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        <strong>Allocated:</strong>{" "}
                        {formatCurrency(
                          formData.allocatedAmount || formData.totalBudget
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENT UTILIZATION */}
              {budget?.utilizedAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1e40af",
                    borderRadius: 6,
                    fontSize: 12,
                    padding: "10px 12px",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <i className="bi bi-info-circle" style={{ fontSize: 16, marginTop: 2 }}></i>
                  <div>
                    <strong style={{ display: "block", marginBottom: 6 }}>
                      Current Utilization:
                    </strong>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      <strong>Utilized Amount:</strong>{" "}
                      {formatCurrency(budget?.utilizedAmount)}
                      <br />
                      <strong>Utilization %:</strong>{" "}
                      {budget?.utilizationPercentage || 0}%
                      <br />
                      <span style={{ color: "#64748b" }}>
                        Ensure new allocated amount is sufficient for current
                        utilization.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#6c757d";
                }}
              >
                <i className="bi bi-x-circle"></i> Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.opacity = 1;
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Updating...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Update Budget
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditBudgetModal;
