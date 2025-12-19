import React, { useState, useEffect } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const ViewBudgetDetailsModal = ({ show, budget, onHide }) => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && budget) {
      fetchAllocations();
    }
  }, [show, budget]);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await budgetAllocationService.getBudgetAllocationsByBudget(
        budget.budgetId
      );
      setAllocations(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching allocations:", err);
      setError(err.message || "Failed to fetch allocations");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAllocationsByType = () => {
    const types = {};
    allocations.forEach((alloc) => {
      if (!types[alloc.allocationType]) {
        types[alloc.allocationType] = [];
      }
      types[alloc.allocationType].push(alloc);
    });
    return types;
  };

  const getTotalByType = (type) => {
    return allocations
      .filter((a) => a.allocationType === type)
      .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  };

  const allocationsByType = getAllocationsByType();
  const allocationTypes = Object.keys(allocationsByType).sort();
  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (parseFloat(a.amount) || 0),
    0
  );

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
        onClick={onHide}
      />

      {/* Modal Container - SCROLL IS HERE */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "87%",
          maxWidth: "900px",
          maxHeight: "80vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Inner Container with Scroll */}
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "80vh",
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
              <i className="bi bi-eye"></i>
              Budget Details & Allocation Breakdown
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div
            style={{
              padding: "20px",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  marginBottom: "16px",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "0.375rem",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "8px" }}></i>
                {error}
              </div>
            )}

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
                  Headcount:
                </label>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                  {budget?.headcount || 0}
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
                  Avg Cost/Employee:
                </label>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                  {formatCurrency(budget?.avgCostPerEmployee)}
                </span>
              </div>
            </div>

            {/* BUDGET SUMMARY */}
            <div
              style={{
                backgroundColor: "#f0fdf4",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h6
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#166534",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="bi bi-graph-up"></i>
                Budget Summary
              </h6>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#065f46",
                      marginBottom: "4px",
                    }}
                  >
                    Total Budget:
                  </label>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>
                    {formatCurrency(budget?.totalBudget)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#065f46",
                      marginBottom: "4px",
                    }}
                  >
                    Allocated Amount:
                  </label>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#166534" }}>
                    {formatCurrency(budget?.allocatedAmount)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#065f46",
                      marginBottom: "4px",
                    }}
                  >
                    Utilized Amount:
                  </label>
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>
                    {formatCurrency(budget?.utilizedAmount)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#065f46",
                      marginBottom: "4px",
                    }}
                  >
                    Utilization %:
                  </label>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: budget?.utilizationPercentage >= 90 ? "#ef4444" : "#10b981",
                    }}
                  >
                    {budget?.utilizationPercentage || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* ALLOCATION BY TYPE BREAKDOWN */}
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <h6
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="bi bi-diagram-3"></i>
                Allocation by Type
              </h6>

              {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}>
                      Loading...
                    </span>
                  </div>
                </div>
              ) : allocationTypes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                  <p style={{ margin: 0 }}>No allocations created yet by HR/DeptHead</p>
                </div>
              ) : (
                <>
                  {allocationTypes.map((type) => (
                    <div key={type} style={{ marginBottom: "20px" }}>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#27235C",
                          marginBottom: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {type}
                      </h6>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginBottom: "0px",
                            fontSize: "12px",
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: "#f8fafc" }}>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  fontWeight: "600",
                                  color: "#475569",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                Amount
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  fontWeight: "600",
                                  color: "#475569",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                Status
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  fontWeight: "600",
                                  color: "#475569",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                Name
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  fontWeight: "600",
                                  color: "#475569",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                Created By
                              </th>
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  fontWeight: "600",
                                  color: "#475569",
                                  borderBottom: "2px solid #cbd5e1",
                                }}
                              >
                                Created On
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allocationsByType[type].map((alloc) => (
                              <tr
                                key={alloc.allocationId}
                                style={{ borderBottom: "1px solid #e2e8f0" }}
                              >
                                <td style={{ padding: "10px" }}>
                                  <strong>{formatCurrency(alloc.amount)}</strong>
                                </td>
                                <td style={{ padding: "10px" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      backgroundColor:
                                        alloc.goalStatus === "Approved" ? "#dcfce7" : "#fef3c7",
                                      color: alloc.goalStatus === "Approved" ? "#166534" : "#92400e",
                                    }}
                                  >
                                    {alloc.goalStatus || "Pending"}
                                  </span>
                                </td>
                                <td style={{ padding: "10px" }}>{alloc.notes || "-"}</td>
                                <td style={{ padding: "10px" }}>
                                  {alloc.allocatedByName || "N/A"}
                                </td>
                                <td style={{ padding: "10px" }}>
                                  {formatDate(alloc.allocatedAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Subtotal for type */}
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#f8fafc",
                          borderLeft: "4px solid #27235C",
                          marginTop: "8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        <strong>{type} Subtotal:</strong> {formatCurrency(getTotalByType(type))}
                      </div>
                    </div>
                  ))}

                  {/* TOTAL ALLOCATIONS */}
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f0fdf4",
                      border: "2px solid #10b981",
                      borderRadius: "6px",
                      marginTop: "16px",
                    }}
                  >
                    <strong style={{ color: "#166534" }}>Total Allocated by HR/DeptHead:</strong>
                    <span
                      style={{
                        float: "right",
                        color: "#166534",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* REMAINING BUDGET */}
            <div
              style={{
                backgroundColor:
                  (budget?.allocatedAmount || 0) - totalAllocated >= 0 ? "#f0fdf4" : "#fee2e2",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              <h6
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color:
                    (budget?.allocatedAmount || 0) - totalAllocated >= 0 ? "#166534" : "#991b1b",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="bi bi-wallet2"></i>
                Budget Status
              </h6>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#065f46"
                          : "#7f1d1d",
                      marginBottom: "4px",
                    }}
                  >
                    Total Allocated (Leadership):
                  </label>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {formatCurrency(budget?.allocatedAmount)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#065f46"
                          : "#7f1d1d",
                      marginBottom: "4px",
                    }}
                  >
                    Total Used (HR/DeptHead):
                  </label>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#166534"
                          : "#991b1b",
                    }}
                  >
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#065f46"
                          : "#7f1d1d",
                      marginBottom: "4px",
                    }}
                  >
                    Remaining:
                  </label>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0 ? "#166534" : "#991b1b",
                    }}
                  >
                    {formatCurrency((budget?.allocatedAmount || 0) - totalAllocated)}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        (budget?.allocatedAmount || 0) - totalAllocated >= 0
                          ? "#065f46"
                          : "#7f1d1d",
                      marginBottom: "4px",
                    }}
                  >
                    Usage %:
                  </label>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color:
                        (totalAllocated / (budget?.allocatedAmount || 1)) * 100 >= 90
                          ? "#991b1b"
                          : "#166534",
                    }}
                  >
                    {((totalAllocated / (budget?.allocatedAmount || 1)) * 100 || 0).toFixed(2)}%
                  </span>
                </div>
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
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onHide}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#6c757d";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewBudgetDetailsModal;
