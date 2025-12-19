import React, { useState } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const UpdateUtilizationModal = ({
  show,
  allocation,
  onHide,
  onUtilizationUpdated,
}) => {
  const [formData, setFormData] = useState({
    utilizedAmount: allocation?.utilizedAmount || 0,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = parseInt(localStorage.getItem("userId"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const utilizedAmount = parseFloat(formData.utilizedAmount);

      if (isNaN(utilizedAmount) || utilizedAmount < 0) {
        setError("Utilized amount must be zero or greater");
        setLoading(false);
        return;
      }

      if (utilizedAmount > (allocation.amount || 0)) {
        setError(
          `Utilized amount (Rs.${utilizedAmount.toLocaleString(
            "en-IN"
          )}) cannot exceed allocated amount (Rs.${(
            allocation.amount || 0
          ).toLocaleString("en-IN")})`
        );
        setLoading(false);
        return;
      }

      const utilizationPercentage = Math.round(
        (utilizedAmount / (allocation.amount || 1)) * 100
      );

      await budgetAllocationService.updateUtilization({
        allocationId: allocation.allocationId,
        utilizedAmount: utilizedAmount,
        utilizationPercentage: utilizationPercentage,
        notes: formData.notes,
        updatedByUserId: currentUserId,
      });
      onUtilizationUpdated({
        ...allocation,
        utilizedAmount: utilizedAmount,
        utilizationPercentage: utilizationPercentage,
      });
      handleClose();
    } catch (err) {
      console.error("Error updating utilization:", err);
      setError(err.message || "Failed to update utilization");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      utilizedAmount: allocation?.utilizedAmount || 0,
      notes: "",
    });
    setError(null);
    onHide();
  };

  const currentUtilizedAmount = parseFloat(formData.utilizedAmount) || 0;
  const currentUtilizationPercentage = Math.round(
    (currentUtilizedAmount / (allocation?.amount || 1)) * 100
  );
  const remainingAmount = (allocation?.amount || 0) - currentUtilizedAmount;

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
              Update Utilization
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
              {error && (
                <div
                  style={{
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #ef4444",
                    color: "#991b1b",
                  }}
                >
                  <i
                    className="bi bi-exclamation-triangle-fill"
                    style={{ marginRight: 8, color: "#ef4444" }}
                  ></i>
                  {error}
                </div>
              )}

              {/* Allocation Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Allocation Name:
                  </label>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      fontWeight: 700,
                    }}
                  >
                    {allocation?.allocationName}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Type:
                  </label>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    {allocation?.allocationType}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Allocated Amount:
                  </label>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(allocation?.amount)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Current Utilization:
                  </label>
                  <span
                    style={{
                      fontSize: 14,
                      color: "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(allocation?.utilizedAmount || 0)} (
                    {allocation?.utilizationPercentage || 0}%)
                  </span>
                </div>
              </div>

              {/* Utilized Amount Input */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="utilizedAmount"
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
                  Utilized Amount (Rs.){" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <input
                  type="number"
                  id="utilizedAmount"
                  name="utilizedAmount"
                  value={formData.utilizedAmount}
                  onChange={handleChange}
                  placeholder="Enter utilized amount"
                  step="0.01"
                  min="0"
                  max={allocation?.amount || 0}
                  required
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                  }}
                />
                <small
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginTop: 4,
                    fontStyle: "italic",
                    display: "block",
                  }}
                >
                  Maximum: {formatCurrency(allocation?.amount)} (100%)
                </small>
              </div>

              {/* Notes Textarea */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="notes"
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes about this utilization update"
                  rows="3"
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

              {/* Utilization Summary Section */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background:
                    currentUtilizationPercentage >= 100
                      ? "#fef2f2"
                      : currentUtilizationPercentage >= 75
                      ? "#fef3c7"
                      : "#f0fdf4",
                  padding: "16px",
                }}
              >
                <h6
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1e293b",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Utilization Summary
                </h6>

                {/* Summary Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Allocated Amount:
                    </label>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(allocation?.amount)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Utilized Amount:
                    </label>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(currentUtilizedAmount)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Utilization %:
                    </label>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color:
                          currentUtilizationPercentage >= 100
                            ? "#991b1b"
                            : currentUtilizationPercentage >= 75
                            ? "#f59e0b"
                            : currentUtilizationPercentage >= 50
                            ? "#10b981"
                            : "#3b82f6",
                      }}
                    >
                      {currentUtilizationPercentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Remaining:
                    </label>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: remainingAmount >= 0 ? "#166534" : "#991b1b",
                      }}
                    >
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      position: "relative",
                      height: 24,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${Math.min(currentUtilizationPercentage, 100)}%`,
                        backgroundColor:
                          currentUtilizationPercentage >= 100
                            ? "#ef4444"
                            : currentUtilizationPercentage >= 75
                            ? "#f59e0b"
                            : currentUtilizationPercentage >= 50
                            ? "#10b981"
                            : "#3b82f6",
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                    <span
                      style={{
                        position: "relative",
                        display: "block",
                        textAlign: "center",
                        lineHeight: "24px",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#1e293b",
                      }}
                    >
                      {currentUtilizationPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Exceeded Warning */}
              {currentUtilizedAmount > (allocation?.amount || 0) && (
                <div
                  style={{
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 13,
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #ef4444",
                    color: "#991b1b",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <i
                      className="bi bi-exclamation-triangle-fill"
                      style={{ marginRight: 8, color: "#ef4444" }}
                    ></i>
                    <strong>UTILIZED AMOUNT EXCEEDS ALLOCATION!</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 12 }}>
                    Utilized amount (Rs.
                    {currentUtilizedAmount.toLocaleString("en-IN")}) exceeds allocated
                    amount (Rs.{(allocation?.amount || 0).toLocaleString("en-IN")})
                  </p>
                </div>
              )}
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
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || currentUtilizedAmount > (allocation?.amount || 0)}
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
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
                  cursor:
                    loading || currentUtilizedAmount > (allocation?.amount || 0)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading || currentUtilizedAmount > (allocation?.amount || 0)
                      ? 0.85
                      : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (
                    !loading &&
                    !(currentUtilizedAmount > (allocation?.amount || 0))
                  )
                    e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (
                    !loading &&
                    !(currentUtilizedAmount > (allocation?.amount || 0))
                  )
                    e.target.style.opacity = 1;
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
                    Update Utilization
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

export default UpdateUtilizationModal;
