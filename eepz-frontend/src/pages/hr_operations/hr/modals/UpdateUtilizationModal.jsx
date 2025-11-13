import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

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

      console.log("Updating utilization...");

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

      console.log("Utilization updated successfully");
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

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Update Utilization
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="promo-modal-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <div className="promo-approval-info">
            <div className="promo-info-card">
              <label>Allocation Name:</label>
              <span>
                <strong>{allocation?.allocationName}</strong>
              </span>
            </div>
            <div className="promo-info-card">
              <label>Type:</label>
              <span>{allocation?.allocationType}</span>
            </div>
            <div className="promo-info-card">
              <label>Allocated Amount:</label>
              <span>{formatCurrency(allocation?.amount)}</span>
            </div>
            <div className="promo-info-card">
              <label>Current Utilization:</label>
              <span style={{ color: "#ef4444" }}>
                {formatCurrency(allocation?.utilizedAmount || 0)} (
                {allocation?.utilizationPercentage || 0}%)
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="utilizedAmount" className="form-label">
              Utilized Amount (Rs.) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              id="utilizedAmount"
              name="utilizedAmount"
              value={formData.utilizedAmount}
              onChange={handleChange}
              placeholder="Enter utilized amount"
              step="0.01"
              min="0"
              max={allocation?.amount || 0}
              required
            />
            <small className="form-text text-muted">
              Maximum: {formatCurrency(allocation?.amount)} (100%)
            </small>
          </div>

          <div className="mb-3">
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              className="form-control promo-textarea-full"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add notes about this utilization update"
              rows="3"
            />
          </div>

          <div
            className="promo-details-section"
            style={{
              backgroundColor:
                currentUtilizationPercentage >= 100
                  ? "#fef2f2"
                  : currentUtilizationPercentage >= 75
                  ? "#fef3c7"
                  : "#f0fdf4",
            }}
          >
            <h6 className="promo-details-heading">Utilization Summary</h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Allocated Amount:</label>
                <span>{formatCurrency(allocation?.amount)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Utilized Amount:</label>
                <span style={{ fontWeight: "600", color: "#ef4444" }}>
                  {formatCurrency(currentUtilizedAmount)}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Utilization %:</label>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "18px",
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
              <div className="promo-detail-item">
                <label>Remaining:</label>
                <span
                  style={{
                    fontWeight: "600",
                    color: remainingAmount >= 0 ? "#166534" : "#991b1b",
                  }}
                >
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  position: "relative",
                  height: "24px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
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
                    fontWeight: "700",
                    fontSize: "12px",
                    color: "#1e293b",
                  }}
                >
                  {currentUtilizationPercentage}%
                </span>
              </div>
            </div>
          </div>

          {currentUtilizedAmount > (allocation?.amount || 0) && (
            <div
              className="alert alert-danger"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>UTILIZED AMOUNT EXCEEDS ALLOCATION!</strong>
              <p
                style={{ marginTop: "4px", marginBottom: 0, fontSize: "12px" }}
              >
                Utilized amount (Rs.
                {currentUtilizedAmount.toLocaleString("en-IN")}) exceeds
                allocated amount (Rs.
                {(allocation?.amount || 0).toLocaleString("en-IN")})
              </p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="promo-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn promo-btn-submit"
            disabled={
              loading || currentUtilizedAmount > (allocation?.amount || 0)
            }
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Update Utilization
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default UpdateUtilizationModal;
