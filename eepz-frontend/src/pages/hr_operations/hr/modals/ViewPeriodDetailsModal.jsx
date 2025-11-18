import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

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
    if (utilizationPercentage >= 90) return "danger";
    if (utilizationPercentage >= 75) return "warning";
    if (utilizationPercentage >= 50) return "info";
    return "success";
  };

  const getStatusText = (utilizationPercentage) => {
    if (utilizationPercentage >= 90) return "Critical";
    if (utilizationPercentage >= 75) return "High";
    if (utilizationPercentage >= 50) return "Medium";
    return "Low";
  };

  return (
    <Modal
      show={true}
      onHide={onClose}
      centered
      size="xl"
      backdrop="static"
      className="period-modal"
    >
      <div className="modal-header-gradient">
        <Modal.Title className="modal-title-custom">
          <i className="bi bi-eye me-2"></i>
          {period.period} {period.periodYear} - Detailed View
        </Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
        ></button>
      </div>

      <Modal.Body className="modal-body-custom">
        {/* Period Summary */}
        <div className="budget-info-card mb-4">
          <div className="budget-info-header">
            <h6 className="mb-0">{period.departmentName}</h6>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-3 col-6">
              <div className="detail-item">
                <span className="detail-label">Period</span>
                <span className="detail-value">
                  {period.period} {period.periodYear}
                </span>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="detail-item">
                <span className="detail-label">Allocated Amount</span>
                <span className="detail-value text-primary">
                  {formatCurrency(period.allocatedAmount)}
                </span>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="detail-item">
                <span className="detail-label">Utilized</span>
                <span className="detail-value text-danger">
                  {formatCurrency(period.utilizedAmount || 0)}
                </span>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="detail-item">
                <span className="detail-label">Remaining</span>
                <span className="detail-value text-success">
                  {formatCurrency(period.remainingAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {period.notes && (
            <div className="alert alert-info-custom mt-3 mb-0">
              <strong>Notes:</strong> {period.notes}
            </div>
          )}
        </div>

        {/* Sub-Allocations */}
        <h6 className="mb-3">
          <i className="bi bi-list-task me-2"></i>
          Sub-Allocations ({subAllocations.length})
        </h6>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading sub-allocations...</p>
          </div>
        ) : subAllocations.length === 0 ? (
          <div className="text-center py-5">
            <i
              className="bi bi-inbox"
              style={{ fontSize: "48px", color: "#cbd5e1" }}
            ></i>
            <p className="mt-3 text-muted">
              No sub-allocations created yet for this period
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom">
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
                  const remaining = alloc.amount - (alloc.utilizedAmount || 0);
                  const utilization = alloc.utilizationPercentage || 0;
                  const statusColor = getStatusColor(utilization);
                  const statusText = getStatusText(utilization);

                  return (
                    <tr key={alloc.allocationId}>
                      <td>
                        <span className="badge-type-custom">
                          {alloc.allocationType}
                        </span>
                      </td>
                      <td className="fw-bold">
                        {formatCurrency(alloc.amount)}
                      </td>
                      <td className="text-danger">
                        {formatCurrency(alloc.utilizedAmount || 0)}
                      </td>
                      <td className="text-success">
                        {formatCurrency(remaining)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress-mini">
                            <div
                              className={`progress-mini-bar bg-${statusColor}`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-muted small">
                            {Math.round(utilization)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(alloc.allocatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="table-active">
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td className="fw-bold">
                    {formatCurrency(
                      subAllocations.reduce((sum, a) => sum + a.amount, 0)
                    )}
                  </td>
                  <td className="fw-bold text-danger">
                    {formatCurrency(
                      subAllocations.reduce(
                        (sum, a) => sum + (a.utilizedAmount || 0),
                        0
                      )
                    )}
                  </td>
                  <td className="fw-bold text-success">
                    {formatCurrency(
                      subAllocations.reduce(
                        (sum, a) => sum + (a.amount - (a.utilizedAmount || 0)),
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

        <div className="modal-actions-custom">
          <button className="btn btn-secondary-custom" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ViewPeriodDetailsModal;
