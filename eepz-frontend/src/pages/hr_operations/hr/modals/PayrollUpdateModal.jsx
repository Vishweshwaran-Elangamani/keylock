import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";
import "../../../../styles/hr_operations/hr/payrollUpdateModal.css";

const PayrollUpdateModal = ({ show, promotion, onHide, onPayrollUpdated }) => {
  const [formData, setFormData] = useState({
    payrollId: "",
    oldSalary: "",
    newSalary: "",
    effectiveDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [incrementPercentage, setIncrementPercentage] = useState(null);

  useEffect(() => {
    if (show && promotion) {
      setFormData((prev) => ({
        ...prev,
        oldSalary: promotion.oldSalary || "",
        newSalary: "",
        effectiveDate: promotion.promotionDate || "",
        notes: "",
      }));
      setError(null);
    }
  }, [show, promotion]);

  useEffect(() => {
    if (formData.oldSalary && formData.newSalary) {
      const oldSal = parseFloat(formData.oldSalary);
      const newSal = parseFloat(formData.newSalary);

      if (oldSal > 0 && newSal > 0) {
        const increment = ((newSal - oldSal) / oldSal) * 100;
        setIncrementPercentage(increment.toFixed(2));
      } else {
        setIncrementPercentage(null);
      }
    } else {
      setIncrementPercentage(null);
    }
  }, [formData.oldSalary, formData.newSalary]);

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
      const oldSal = parseFloat(formData.oldSalary);
      const newSal = parseFloat(formData.newSalary);

      if (oldSal <= 0) {
        setError("Old salary must be greater than zero");
        setLoading(false);
        return;
      }

      if (newSal <= 0) {
        setError("New salary must be greater than zero");
        setLoading(false);
        return;
      }

      if (newSal <= oldSal) {
        setError("New salary must be greater than old salary");
        setLoading(false);
        return;
      }

      if (!formData.effectiveDate) {
        setError("Effective date is required");
        setLoading(false);
        return;
      }

      console.log("Updating payroll...");
      await careerProgressionService.updatePayroll({
        payrollId: promotion.promotionId,
        employeeUserId: promotion.employeeUserId,
        newSalary: newSal,
        effectiveDate: formData.effectiveDate,
        notes: formData.notes || `Promotion to ${promotion.newRole}`,
      });

      console.log("Payroll updated successfully");
      onPayrollUpdated();
    } catch (err) {
      console.error("Error updating payroll:", err);
      setError(err.message || "Failed to update payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      payrollId: "",
      oldSalary: "",
      newSalary: "",
      effectiveDate: "",
      notes: "",
    });
    setIncrementPercentage(null);
    setError(null);
    onHide();
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-cash-coin"></i>
          Update Payroll - Add Salary Details
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
              <label>Employee:</label>
              <span>
                {promotion?.employeeFullName ||
                  promotion?.employeeEmail ||
                  "Unknown"}
              </span>
            </div>
            <div className="promo-info-card">
              <label>Department:</label>
              <span>{promotion?.departmentName || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Current Role:</label>
              <span>{promotion?.oldRole || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Promoted To:</label>
              <span className="promo-new-role-highlight">
                {promotion?.newRole || "N/A"}
              </span>
            </div>
          </div>

          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-info-circle"></i>
              Promotion Details
            </h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Created On:</label>
                <span>{formatDate(promotion?.createdAt)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Approved On:</label>
                <span>{formatDate(promotion?.approvedAt)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Status:</label>
                <span className="promo-status-badge promo-status-approved">
                  Approved
                </span>
              </div>
            </div>
          </div>

          <div className="promo-form-grid">
            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="oldSalary" className="form-label">
                  Current Salary (INR)
                  <span className="text-danger">*</span>
                </label>
                <div className="promo-salary-display">
                  {formatCurrency(formData.oldSalary)}
                </div>
                <small className="form-text">
                  Auto-filled from employee CTC
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="newSalary" className="form-label">
                  New Salary (INR)
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="newSalary"
                  name="newSalary"
                  value={formData.newSalary}
                  onChange={handleChange}
                  placeholder="Enter new salary"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              {incrementPercentage && (
                <div className="promo-increment-display">
                  <label>Calculated Increment:</label>
                  <span className="promo-increment-value">
                    {incrementPercentage}%
                  </span>
                </div>
              )}
            </div>

            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="effectiveDate" className="form-label">
                  Effective Date
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  required
                />
                <small className="form-text">
                  When will the new salary become effective?
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  className="form-control promo-textarea-full"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes (optional)"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {formData.oldSalary && formData.newSalary && (
            <div
              className="promo-details-section"
              style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}
            >
              <h6 className="promo-details-heading">
                <i className="bi bi-graph-up"></i>
                Salary Summary
              </h6>
              <div className="promo-details-grid">
                <div className="promo-detail-item">
                  <label>Current Salary:</label>
                  <span>{formatCurrency(formData.oldSalary)}</span>
                </div>
                <div className="promo-detail-item">
                  <label>New Salary:</label>
                  <span className="promo-new-salary-highlight">
                    {formatCurrency(formData.newSalary)}
                  </span>
                </div>
                <div className="promo-detail-item">
                  <label>Salary Increase:</label>
                  <span style={{ color: "#166534", fontWeight: "600" }}>
                    Rs
                    {(
                      parseFloat(formData.newSalary) -
                      parseFloat(formData.oldSalary)
                    ).toFixed(0)}
                  </span>
                </div>
                <div className="promo-detail-item">
                  <label>Increment %:</label>
                  <span className="promo-increment-badge">
                    +{incrementPercentage || "0.00"}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="promo-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn promo-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                Update Payroll
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default PayrollUpdateModal;
