import { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

const ViewPeriodDetailsModal = ({ period, onClose }) => {
  const [subAllocations, setSubAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubAllocations();
  }, []);

  const fetchSubAllocations = async () => {
    try {
      setLoading(true);
      const response =
        await budgetAllocationService.getFundAllocationsByDepartment(
          period.departmentId
        );

      if (response.success) {
        const periodAllocations = response.data.filter(
          (alloc) =>
            alloc.period === period.period &&
            alloc.periodYear === period.periodYear
        );
        setSubAllocations(periodAllocations);
      }
    } catch (error) {
      console.error("Error fetching sub-allocations:", error);
      toast.error("Failed to load sub-allocations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "#dc3545";
    if (utilizationPercentage >= 75) return "#ffc107";
    if (utilizationPercentage >= 50) return "#0dcaf0";
    return "#198754";
  };

  const getStatusBgColor = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "#dc3545";
    if (utilizationPercentage >= 75) return "#ffc107";
    if (utilizationPercentage >= 50) return "#0dcaf0";
    return "#198754";
  };

  const getStatusText = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "Critical";
    if (utilizationPercentage >= 75) return "High";
    if (utilizationPercentage >= 50) return "Medium";
    return "Low";
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
              <i className="bi bi-eye"></i>
              {period.period} {period.periodYear} - Detailed View
            </div>
            <button
              type="button"
              onClick={onClose}
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
              background: "#fff",
              textAlign: "left",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {/* Period Summary */}
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
                  {period.departmentName}
                </h6>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                  marginTop: 12,
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
                    Allocated Amount
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#0d6efd",
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
                    Remaining
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#198754",
                    }}
                  >
                    {formatCurrency(period.remainingAmount || 0)}
                  </span>
                </div>
              </div>

              {period.notes && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: "#d1ecf1",
                    border: "1px solid #bee5eb",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "#0c5460",
                    marginBottom: 0,
                  }}
                >
                  <strong>Notes:</strong> {period.notes}
                </div>
              )}
            </div>

            {/* Sub-Allocations */}
            <h6
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 16,
              }}
            >
              <i className="bi bi-list-task" style={{ marginRight: 8 }}></i>
              Sub-Allocations ({subAllocations.length})
            </h6>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #0d6efd",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                    marginBottom: 12,
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginTop: 8,
                  }}
                >
                  Loading sub-allocations...
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                  }
                `}</style>
              </div>
            ) : subAllocations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: 48, color: "#cbd5e1" }}
                ></i>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginTop: 16,
                  }}
                >
                  No sub-allocations created yet for this period
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Utilized
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Remaining
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Utilization %
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: 12,
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        Allocated Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAllocations.map((alloc) => {
                      const remaining = alloc.amount - (alloc.utilizedAmount || 0);
                      const utilization = alloc.utilizationPercentage || 0;
                      const statusColor = getStatusColor(utilization);
                      const statusBg = getStatusBgColor(utilization);
                      const statusText = getStatusText(utilization);

                      return (
                        <tr
                          key={alloc.allocationId}
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={{ padding: 12 }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: "#e0e7ff",
                                color: "#3730a3",
                              }}
                            >
                              {alloc.allocationType}
                            </span>
                          </td>
                          <td style={{ padding: 12, fontWeight: 600 }}>
                            {formatCurrency(alloc.amount)}
                          </td>
                          <td style={{ padding: 12, color: "#dc3545" }}>
                            {formatCurrency(alloc.utilizedAmount || 0)}
                          </td>
                          <td style={{ padding: 12, color: "#198754" }}>
                            {formatCurrency(remaining)}
                          </td>
                          <td style={{ padding: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 80,
                                  height: 8,
                                  background: "#e5e7eb",
                                  borderRadius: 4,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${utilization}%`,
                                    height: "100%",
                                    background: statusColor,
                                    borderRadius: 4,
                                    transition: "width 0.3s ease",
                                  }}
                                ></div>
                              </div>
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                {Math.round(utilization)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: 12 }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: statusBg,
                                color: "#fff",
                              }}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: 12,
                              fontSize: 11,
                              color: "#64748b",
                            }}
                          >
                            {new Date(alloc.allocatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderTop: "2px solid #e5e7eb",
                      }}
                    >
                      <td style={{ padding: 12, fontWeight: 700 }}>Total</td>
                      <td style={{ padding: 12, fontWeight: 700 }}>
                        {formatCurrency(
                          subAllocations.reduce((sum, a) => sum + a.amount, 0)
                        )}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          fontWeight: 700,
                          color: "#dc3545",
                        }}
                      >
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) => sum + (a.utilizedAmount || 0),
                            0
                          )
                        )}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          fontWeight: 700,
                          color: "#198754",
                        }}
                      >
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) =>
                              sum + (a.amount - (a.utilizedAmount || 0)),
                            0
                          )
                        )}
                      </td>
                      <td colSpan="3" style={{ padding: 12 }}></td>
                    </tr>
                  </tfoot>
                </table>
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
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
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

export default ViewPeriodDetailsModal;
