import React, { useState, useEffect } from "react";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/ViewBudgetDetailsModal.css";

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
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );
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

  const remainingBudget = (budget?.allocatedAmount || 0) - totalAllocated;
  const isPositive = remainingBudget >= 0;
  const usagePercentage = (
    (totalAllocated / (budget?.allocatedAmount || 1)) * 100 || 0
  ).toFixed(2);

  if (!show) return null;

  return (
    <>
      <div className="vbdm-backdrop" onClick={onHide} />

      <div className="vbdm-modal-container">
        <div className="vbdm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="vbdm-modal-header">
            <div className="vbdm-header-title">
              <i className="bi bi-eye"></i>
              Budget Details & Allocation Breakdown
            </div>
            <button
              type="button"
              onClick={onHide}
              aria-label="Close"
              className="vbdm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div className="vbdm-modal-body">
            {error && (
              <div className="vbdm-error-alert" role="alert">
                <i className="bi bi-exclamation-triangle-fill vbdm-error-icon"></i>
                {error}
              </div>
            )}

            {/* BUDGET INFO */}
            <div className="vbdm-budget-info">
              <div className="vbdm-info-card">
                <label className="vbdm-info-label">Department:</label>
                <span className="vbdm-info-value">
                  {budget?.departmentName || "Unknown"}
                </span>
              </div>

              <div className="vbdm-info-card">
                <label className="vbdm-info-label">Fiscal Year:</label>
                <span className="vbdm-info-value">{budget?.fiscalYear}</span>
              </div>
            </div>

            {/* BUDGET SUMMARY */}
            <div className="vbdm-budget-summary">
              <h6 className="vbdm-summary-heading">
                <i className="bi bi-graph-up"></i>
                Budget Summary
              </h6>
              <div className="vbdm-summary-grid">
                <div className="vbdm-summary-item">
                  <label>Total Budget:</label>
                  <span>{formatCurrency(budget?.totalBudget)}</span>
                </div>

                <div className="vbdm-summary-item">
                  <label>Allocated Amount:</label>
                  <span>{formatCurrency(budget?.allocatedAmount)}</span>
                </div>

                <div className="vbdm-summary-item">
                  <label>Utilized Amount:</label>
                  <span className="utilized">
                    {formatCurrency(budget?.utilizedAmount)}
                  </span>
                </div>

                <div className="vbdm-summary-item">
                  <label>Utilization %:</label>
                  <span
                    className={
                      budget?.utilizationPercentage >= 90
                        ? "percentage-high"
                        : "percentage-normal"
                    }
                  >
                    {budget?.utilizationPercentage || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* ALLOCATION BY TYPE BREAKDOWN */}
            <div className="vbdm-allocation-section">
              <h6 className="vbdm-allocation-heading">
                <i className="bi bi-diagram-3"></i>
                Allocation by Type
              </h6>

              {loading ? (
                <div className="vbdm-loading">
                  <div
                    className="spinner-border text-primary vbdm-spinner"
                    role="status"
                  >
                    <span className="vbdm-spinner-label">Loading...</span>
                  </div>
                </div>
              ) : allocationTypes.length === 0 ? (
                <div className="vbdm-empty-state">
                  <p>No allocations created yet by HR/DeptHead</p>
                </div>
              ) : (
                <>
                  {allocationTypes.map((type) => (
                    <div key={type} className="vbdm-type-section">
                      <h6 className="vbdm-type-heading">{type}</h6>

                      <div className="vbdm-table-container">
                        <table className="vbdm-table">
                          <thead>
                            <tr>
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
                                <td>
                                  <strong>
                                    {formatCurrency(alloc.amount)}
                                  </strong>
                                </td>
                                <td>
                                  <span
                                    className={`vbdm-status-badge ${
                                      alloc.goalStatus === "Approved"
                                        ? "approved"
                                        : "pending"
                                    }`}
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
                      <div className="vbdm-subtotal-bar">
                        <strong>{type} Subtotal:</strong>{" "}
                        {formatCurrency(getTotalByType(type))}
                      </div>
                    </div>
                  ))}

                  {/* TOTAL ALLOCATIONS */}
                  <div className="vbdm-total-bar">
                    <strong className="vbdm-total-label">
                      Total Allocated by HR/DeptHead:
                    </strong>
                    <span className="vbdm-total-value">
                      {formatCurrency(totalAllocated)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* REMAINING BUDGET */}
            <div
              className={`vbdm-budget-status ${
                isPositive ? "positive" : "negative"
              }`}
            >
              <h6
                className={`vbdm-status-heading ${
                  isPositive ? "positive" : "negative"
                }`}
              >
                <i className="bi bi-wallet2"></i>
                Budget Status
              </h6>
              <div className="vbdm-status-grid">
                <div
                  className={`vbdm-status-item ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  <label>Total Allocated (Leadership):</label>
                  <span>{formatCurrency(budget?.allocatedAmount)}</span>
                </div>

                <div
                  className={`vbdm-status-item ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  <label>Total Used (HR/DeptHead):</label>
                  <span>{formatCurrency(totalAllocated)}</span>
                </div>

                <div
                  className={`vbdm-status-item ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  <label>Remaining:</label>
                  <span>{formatCurrency(remainingBudget)}</span>
                </div>

                <div
                  className={`vbdm-status-item ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  <label>Usage %:</label>
                  <span
                    className={
                      usagePercentage >= 90 ? "usage-high" : "usage-normal"
                    }
                  >
                    {usagePercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER - Fixed */}
          <div className="vbdm-modal-footer">
            <button type="button" onClick={onHide} className="vbdm-btn-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewBudgetDetailsModal;
