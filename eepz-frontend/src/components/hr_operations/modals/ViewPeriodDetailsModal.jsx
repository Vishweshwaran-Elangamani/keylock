import { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";
import "../../../styles/hr_operations/hr/ViewPeriodDetailsModal.css";

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

  const getStatusClass = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "critical";
    if (utilizationPercentage >= 75) return "high";
    if (utilizationPercentage >= 50) return "medium";
    return "low";
  };

  const getStatusText = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "Critical";
    if (utilizationPercentage >= 75) return "High";
    if (utilizationPercentage >= 50) return "Medium";
    return "Low";
  };

  return (
    <>
      <div className="vpdm-backdrop" onClick={onClose} />

      <div className="vpdm-modal-container">
        <div className="vpdm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="vpdm-modal-header">
            <div className="vpdm-header-title">
              <i className="bi bi-eye"></i>
              {period.period} {period.periodYear} - Detailed View
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="vpdm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <div className="vpdm-modal-body">
            {/* Period Summary */}
            <div className="vpdm-period-summary">
              <h6 className="vpdm-period-dept">{period.departmentName}</h6>
              <div className="vpdm-summary-grid">
                <div className="vpdm-summary-item">
                  <label>Period</label>
                  <span>
                    {period.period} {period.periodYear}
                  </span>
                </div>
                <div className="vpdm-summary-item allocated">
                  <label>Allocated Amount</label>
                  <span>{formatCurrency(period.allocatedAmount)}</span>
                </div>
                <div className="vpdm-summary-item utilized">
                  <label>Utilized</label>
                  <span>{formatCurrency(period.utilizedAmount || 0)}</span>
                </div>
                <div className="vpdm-summary-item remaining">
                  <label>Remaining</label>
                  <span>{formatCurrency(period.remainingAmount || 0)}</span>
                </div>
              </div>

              {period.notes && (
                <div className="vpdm-period-notes">
                  <strong>Notes:</strong> {period.notes}
                </div>
              )}
            </div>

            {/* Sub-Allocations */}
            <h6 className="vpdm-suballoc-heading">
              <i className="bi bi-list-task vpdm-suballoc-icon"></i>
              Sub-Allocations ({subAllocations.length})
            </h6>

            {loading ? (
              <div className="vpdm-loading">
                <span className="vpdm-spinner" />
                <p className="vpdm-loading-text">Loading sub-allocations...</p>
              </div>
            ) : subAllocations.length === 0 ? (
              <div className="vpdm-empty-state">
                <i className="bi bi-inbox vpdm-empty-icon"></i>
                <p className="vpdm-empty-text">
                  No sub-allocations created yet for this period
                </p>
              </div>
            ) : (
              <div className="vpdm-table-container">
                <table className="vpdm-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Utilized</th>
                      <th>Remaining</th>
                      <th>Utilization %</th>
                      <th>Status</th>
                      <th>Allocated Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAllocations.map((alloc) => {
                      const remaining =
                        alloc.amount - (alloc.utilizedAmount || 0);
                      const utilization = alloc.utilizationPercentage || 0;
                      const statusClass = getStatusClass(utilization);
                      const statusText = getStatusText(utilization);

                      return (
                        <tr key={alloc.allocationId}>
                          <td>
                            <span className="vpdm-type-badge">
                              {alloc.allocationType}
                            </span>
                          </td>
                          <td className="vpdm-amount">
                            {formatCurrency(alloc.amount)}
                          </td>
                          <td className="vpdm-utilized">
                            {formatCurrency(alloc.utilizedAmount || 0)}
                          </td>
                          <td className="vpdm-remaining">
                            {formatCurrency(remaining)}
                          </td>
                          <td>
                            <div className="vpdm-progress-container">
                              <div className="vpdm-progress-bar">
                                <div
                                  className={`vpdm-progress-fill ${statusClass}`}
                                  style={{ width: `${utilization}%` }}
                                ></div>
                              </div>
                              <span className="vpdm-progress-text">
                                {Math.round(utilization)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`vpdm-status-badge ${statusClass}`}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="vpdm-date">
                            {new Date(alloc.allocatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>
                        {formatCurrency(
                          subAllocations.reduce((sum, a) => sum + a.amount, 0)
                        )}
                      </td>
                      <td className="utilized">
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) => sum + (a.utilizedAmount || 0),
                            0
                          )
                        )}
                      </td>
                      <td className="remaining">
                        {formatCurrency(
                          subAllocations.reduce(
                            (sum, a) =>
                              sum + (a.amount - (a.utilizedAmount || 0)),
                            0
                          )
                        )}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER - Fixed */}
          <div className="vpdm-modal-footer">
            <button type="button" onClick={onClose} className="vpdm-btn-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPeriodDetailsModal;
