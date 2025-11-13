import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

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
      console.log(" Fetching allocations for budget:", budget.budgetId);
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );
      console.log(" Allocations fetched:", response.data);
      setAllocations(response.data || []);
    } catch (err) {
      console.error(" Error fetching allocations:", err);
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

  return (
    <Modal show={show} onHide={onHide} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-eye me-2"></i>
          Budget Details & Allocation Breakdown
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="promo-modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/*  BUDGET INFO */}
        <div className="promo-approval-info">
          <div className="promo-info-card">
            <label>Department:</label>
            <span>{budget?.departmentName || "Unknown"}</span>
          </div>
          <div className="promo-info-card">
            <label>Fiscal Year:</label>
            <span>{budget?.fiscalYear}</span>
          </div>
          <div className="promo-info-card">
            <label>Headcount:</label>
            <span>{budget?.headcount || 0}</span>
          </div>
          <div className="promo-info-card">
            <label>Avg Cost/Employee:</label>
            <span>{formatCurrency(budget?.avgCostPerEmployee)}</span>
          </div>
        </div>

        {/*  BUDGET SUMMARY */}
        <div
          className="promo-details-section"
          style={{ backgroundColor: "#f0fdf4" }}
        >
          <h6 className="promo-details-heading"> Budget Summary</h6>
          <div className="promo-details-grid">
            <div className="promo-detail-item">
              <label>Total Budget:</label>
              <span>{formatCurrency(budget?.totalBudget)}</span>
            </div>
            <div className="promo-detail-item">
              <label>Allocated Amount:</label>
              <span>{formatCurrency(budget?.allocatedAmount)}</span>
            </div>
            <div className="promo-detail-item">
              <label>Utilized Amount:</label>
              <span style={{ color: "#ef4444", fontWeight: "600" }}>
                {formatCurrency(budget?.utilizedAmount)}
              </span>
            </div>
            <div className="promo-detail-item">
              <label>Utilization %:</label>
              <span
                style={{
                  color:
                    budget?.utilizationPercentage >= 90 ? "#ef4444" : "#10b981",
                  fontWeight: "600",
                }}
              >
                {budget?.utilizationPercentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/*  ALLOCATION BY TYPE BREAKDOWN */}
        <div className="promo-details-section">
          <h6 className="promo-details-heading"> Allocation by Type</h6>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : allocationTypes.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}
            >
              <p>No allocations created yet by HR/DeptHead</p>
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
                      className="promo-table"
                      style={{
                        marginBottom: "0px",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr>
                          {/* <th>Name</th> */}
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Name</th>
                          <th>Created By</th>
                          <th>Created On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocationsByType[type].map((alloc) => (
                          <tr key={alloc.allocationId}>
                            {/* <td>{alloc.allocationName || "N/A"}</td> */}
                            <td>
                              <strong>{formatCurrency(alloc.amount)}</strong>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  backgroundColor:
                                    alloc.goalStatus === "Approved"
                                      ? "#dcfce7"
                                      : "#fef3c7",
                                  color:
                                    alloc.goalStatus === "Approved"
                                      ? "#166534"
                                      : "#92400e",
                                }}
                              >
                                {alloc.goalStatus || "Pending"}
                              </span>
                            </td>
                            <td>{alloc.notes || "-"}</td>
                            <td>{alloc.allocatedByName || "N/A"}</td>
                            <td>{formatDate(alloc.allocatedAt)}</td>
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
                    <strong>{type} Subtotal:</strong>{" "}
                    {formatCurrency(getTotalByType(type))}
                  </div>
                </div>
              ))}

              {/*  TOTAL ALLOCATIONS */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                  border: "2px solid #10b981",
                  borderRadius: "6px",
                  marginTop: "16px",
                }}
              >
                <strong style={{ color: "#166534" }}>
                  Total Allocated by HR/DeptHead:
                </strong>
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

        {/*  REMAINING BUDGET */}
        <div
          className="promo-details-section"
          style={{
            backgroundColor:
              (budget?.allocatedAmount || 0) - totalAllocated >= 0
                ? "#f0fdf4"
                : "#fee2e2",
          }}
        >
          <h6 className="promo-details-heading"> Budget Status</h6>
          <div className="promo-details-grid">
            <div className="promo-detail-item">
              <label>Total Allocated (Leadership):</label>
              <span>{formatCurrency(budget?.allocatedAmount)}</span>
            </div>
            <div className="promo-detail-item">
              <label>Total Used (HR/DeptHead):</label>
              <span>{formatCurrency(totalAllocated)}</span>
            </div>
            <div className="promo-detail-item">
              <label>Remaining:</label>
              <span
                style={{
                  fontWeight: "600",
                  color:
                    (budget?.allocatedAmount || 0) - totalAllocated >= 0
                      ? "#166534"
                      : "#991b1b",
                }}
              >
                {formatCurrency(
                  (budget?.allocatedAmount || 0) - totalAllocated
                )}
              </span>
            </div>
            <div className="promo-detail-item">
              <label>Usage %:</label>
              <span
                style={{
                  fontWeight: "600",
                  color:
                    (totalAllocated / (budget?.allocatedAmount || 1)) * 100 >=
                    90
                      ? "#991b1b"
                      : "#166534",
                }}
              >
                {(
                  (totalAllocated / (budget?.allocatedAmount || 1)) * 100 || 0
                ).toFixed(2)}
                %
              </span>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="promo-modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewBudgetDetailsModal;
