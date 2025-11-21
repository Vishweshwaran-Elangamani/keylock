import React, { useState, useEffect } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import { toast } from "sonner";

const CreateBudgetModal = ({ show, onHide, onBudgetCreated }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    fiscalYear: new Date().getFullYear(),
    totalBudget: "",
    allocatedAmount: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      fetchDepartments();
    }
  }, [show]);

  const fetchDepartments = async () => {
    try {
      console.log("Fetching departments...");
      const response = await budgetAllocationService.getAllDepartments();
      console.log("Departments fetched:", response.data);
      setDepartments(response.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments");
    }
  };

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

    if (!formData.departmentId) {
      newErrors.departmentId = "Please select a department";
    }

    if (!formData.fiscalYear) {
      newErrors.fiscalYear = "Please select a fiscal year";
    }

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

      console.log("Creating budget...");

      await budgetAllocationService.createDepartmentBudget({
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: allocatedAmount,
      });

      console.log("Budget created successfully");
      toast.success("Budget created successfully!");
      onBudgetCreated();
      handleClose();
    } catch (err) {
      console.error("Error creating budget:", err);
      toast.error(err.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      departmentId: "",
      fiscalYear: new Date().getFullYear(),
      totalBudget: "",
      allocatedAmount: "",
    });
    setErrors({});
    onHide();
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

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
              <i className="bi bi-plus-circle"></i>
              Add Department Budget
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {/* Department */}
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
                    Department{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.departmentId
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.departmentId}
                    </div>
                  )}
                </div>

                {/* Fiscal Year */}
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
                    Fiscal Year{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="fiscalYear"
                    value={formData.fiscalYear}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.fiscalYear
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.fiscalYear && (
                    <div style={{ color: "#dc3545", fontSize: 11 }}>
                      {errors.fiscalYear}
                    </div>
                  )}
                </div>

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
                    Total budget allocated to this department
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
                    placeholder="Leave empty to allocate full budget"
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
                    Defaults to total budget if left empty
                  </small>
                </div>
              </div>

              {/* Budget Summary */}
              {formData.totalBudget && (
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
                      marginBottom: 10,
                    }}
                  >
                    <i className="bi bi-cash-stack" style={{ fontSize: 18 }}></i>
                    <span>Budget Summary</span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#047857",
                      }}
                    >
                      <label style={{ fontWeight: 600 }}>Total Budget:</label>
                      <span style={{ fontWeight: 700 }}>
                        {formatCurrency(formData.totalBudget)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#047857",
                      }}
                    >
                      <label style={{ fontWeight: 600 }}>Allocated Amount:</label>
                      <span style={{ fontWeight: 700 }}>
                        {formatCurrency(
                          formData.allocatedAmount || formData.totalBudget
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#047857",
                      }}
                    >
                      <label style={{ fontWeight: 600 }}>Remaining:</label>
                      <span style={{ fontWeight: 700 }}>
                        {formatCurrency(
                          (formData.totalBudget || 0) -
                            (formData.allocatedAmount || formData.totalBudget || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Alert */}
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
                <div>
                  <i className="bi bi-info-circle" style={{ fontSize: 16 }}>
                  </i>
                  <strong style={{margin: 6, marginBottom: 25, fontSize: 17, gap: 3 }}>
                          Budget Creation:
                  </strong>
                  <ul style={{ margin: 5, paddingLeft: 18, lineHeight: 1.6 }}>
                    <li>Set the total budget for the department</li>
                    <li>Optionally set allocated amount for initial spending limit</li>
                    <li>HR/DeptHead will break this down by allocation type</li>
                    <li>This cannot be edited after creation</li>
                  </ul>
                </div>
              </div>
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
                    Creating...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle"></i> Create Budget
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

export default CreateBudgetModal;
