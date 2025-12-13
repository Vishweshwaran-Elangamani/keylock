import { useState } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const AllocateFromPeriodModal = ({ period, budget, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    allocationType: "Training",
    amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const allocationTypes = [
    "Training",
    "Promotion",
    "Bonus",
    "Other",
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (parseFloat(formData.amount) > period.remainingAmount) {
      newErrors.amount = `Amount exceeds remaining period allocation`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const payload = {
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        allocationType: formData.allocationType,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        allocatedByUserId: parseInt(userId),
        period: period.period,
        periodYear: period.periodYear,
      };

      const response =
        await budgetAllocationService.createFundAllocationFromPeriod(payload);

      if (response.success) {
        toast.success("Sub-allocation created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create sub-allocation");
      }
    } catch (error) {
      console.error("Error creating sub-allocation:", error);
      toast.error(error.message || "Failed to create sub-allocation");
    } finally {
      setLoading(false);
    }
  };

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
        onClick={onClose}
      />

      {/* Modal Container with Scroll */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "800px",
          maxHeight: "75vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
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
              flexShrink: 0,
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
              Sub-Allocate from {period.period} {period.periodYear}
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {/* BODY - Scrollable */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                background: "#fff",
                textAlign: "left",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* Period Summary Card */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background: "#f9fafb",
                  padding: "1rem",
                  marginBottom: 20,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <h6
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    {budget.departmentName}
                  </h6>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Period
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {period.period} {period.periodYear}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Period Allocation
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {formatCurrency(period.allocatedAmount)}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Already Sub-Allocated
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#dc3545",
                      }}
                    >
                      {formatCurrency(
                        period.allocatedAmount - period.remainingAmount
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#dcfce7",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #86efac",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#166534",
                        display: "block",
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      Available for Sub-Allocation
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#166534",
                      }}
                    >
                      {formatCurrency(period.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <small style={{ fontSize: 11, color: "#64748b" }}>
                      Sub-Allocation Progress
                    </small>
                    <small style={{ fontSize: 11, color: "#64748b" }}>
                      {period.subAllocationCount || 0} sub-allocations
                    </small>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${
                          ((period.allocatedAmount - period.remainingAmount) /
                            period.allocatedAmount) *
                          100
                        }%`,
                        height: "100%",
                        background: "#0d6efd",
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Allocation Type */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Allocation Type{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <select
                  name="allocationType"
                  value={formData.allocationType}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                    cursor: "pointer",
                  }}
                >
                  {allocationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <small
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Select the purpose of this allocation
                </small>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Amount (₹){" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={period.remainingAmount}
                  required
                  style={{
                    width: "100%",
                    border: errors.amount
                      ? "1px solid #ef4444"
                      : "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                  }}
                />
                {errors.amount && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {errors.amount}
                  </div>
                )}
                {formData.amount && !errors.amount && (
                  <small
                    style={{
                      fontSize: 11,
                      color: "#22c55e",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    ✓ {formatCurrency(parseFloat(formData.amount))} • Remaining:{" "}
                    {formatCurrency(
                      period.remainingAmount - parseFloat(formData.amount)
                    )}
                  </small>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes about this sub-allocation (optional)"
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                    resize: "vertical",
                    minHeight: 80,
                    maxHeight: 120,
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                />
              </div>

              {/* Info Alert */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "#d1ecf1",
                  border: "1px solid #bee5eb",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 13,
                  color: "#0c5460",
                  marginBottom: 16,
                }}
              >
                <i
                  className="bi bi-info-circle-fill"
                  style={{
                    fontSize: 16,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                ></i>
                <div>
                  <strong style={{ display: "block", marginBottom: 4 }}>
                    Sub-Allocation from Period
                  </strong>
                  <p style={{ margin: 0 }}>
                    This will create a fund allocation linked to{" "}
                    <strong>
                      {period.period} {period.periodYear}
                    </strong>
                    . The department head can then update utilization for this
                    allocation.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER - Fixed */}
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
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onClose}
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
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#6c757d";
                }}
              >
                Cancel
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
                    <i className="bi bi-check-circle"></i>
                    Create Sub-Allocation
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

export default AllocateFromPeriodModal;
