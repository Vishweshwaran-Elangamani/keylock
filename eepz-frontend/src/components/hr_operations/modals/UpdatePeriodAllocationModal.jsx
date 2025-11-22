import { useState } from "react";
import { toast } from "sonner";
import periodAllocationService from "../../../services/hr_operations/hr/periodAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const UpdatePeriodAllocationModal = ({
  period,
  budget,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    allocatedAmount: period.allocatedAmount,
    notes: period.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const otherPeriodsTotal = budget.allocatedAmount - period.allocatedAmount;
  const availableBudget = budget.totalBudget - otherPeriodsTotal;

  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.allocatedAmount ||
      parseFloat(formData.allocatedAmount) <= 0
    ) {
      newErrors.allocatedAmount = "Please enter a valid amount";
    }

    if (parseFloat(formData.allocatedAmount) > availableBudget) {
      newErrors.allocatedAmount = `Amount exceeds available budget`;
    }

    if (parseFloat(formData.allocatedAmount) < period.utilizedAmount) {
      newErrors.allocatedAmount = `Cannot reduce below utilized amount`;
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
      const payload = {
        periodAllocationId: period.periodAllocationId,
        allocatedAmount: parseFloat(formData.allocatedAmount),
        notes: formData.notes,
      };

      const response = await periodAllocationService.updatePeriodAllocation(
        payload
      );

      if (response.success) {
        toast.success("Period allocation updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to update period allocation");
      }
    } catch (error) {
      console.error("Error updating period allocation:", error);
      toast.error(error.message || "Failed to update period allocation");
    } finally {
      setLoading(false);
    }
  };

  const amountChange =
    parseFloat(formData.allocatedAmount) - period.allocatedAmount;

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
              <i className="bi bi-pencil-square"></i>
              Update {period.period} {period.periodYear} Allocation
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
              {/* Current Status Card */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background: "#f9fafb",
                  padding: "1rem",
                  marginBottom: 16,
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
                    Current Status
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
                      Current Allocation
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
                      Utilized
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#dc3545",
                      }}
                    >
                      {formatCurrency(period.utilizedAmount || 0)}
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
                      Sub-Allocations
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {period.subAllocationCount || 0}
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
                      Available Budget
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#166534",
                      }}
                    >
                      {formatCurrency(availableBudget)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              {period.subAllocationCount > 0 && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#fff3cd",
                    border: "1px solid #ffecb5",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 13,
                    color: "#664d03",
                    marginBottom: 16,
                  }}
                >
                  <i
                    className="bi bi-exclamation-triangle-fill"
                    style={{
                      fontSize: 16,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  ></i>
                  <div>
                    <strong style={{ display: "block", marginBottom: 4 }}>
                      Warning
                    </strong>
                    <p style={{ margin: 0 }}>
                      This period has {period.subAllocationCount}{" "}
                      sub-allocations. Ensure the new amount is sufficient to
                      cover existing sub-allocations.
                    </p>
                  </div>
                </div>
              )}

              {/* New Allocated Amount */}
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
                  New Allocated Amount (₹){" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="number"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Enter new amount"
                  step="0.01"
                  min={period.utilizedAmount}
                  max={availableBudget}
                  required
                  style={{
                    width: "100%",
                    border: errors.allocatedAmount
                      ? "1px solid #ef4444"
                      : "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                  }}
                />
                {errors.allocatedAmount && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {errors.allocatedAmount}
                  </div>
                )}
                {formData.allocatedAmount && !errors.allocatedAmount && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <small style={{ fontSize: 11, color: "#22c55e" }}>
                      ✓ {formatCurrency(parseFloat(formData.allocatedAmount))}
                    </small>
                    {amountChange !== 0 && (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            amountChange > 0 ? "#198754" : "#dc3545",
                          color: "#fff",
                        }}
                      >
                        {amountChange > 0 ? "+" : ""}
                        {formatCurrency(amountChange)}
                      </span>
                    )}
                  </div>
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
                  placeholder="Update notes (optional)"
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
                    <i className="bi bi-check-circle"></i>
                    Update Allocation
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

export default UpdatePeriodAllocationModal;
