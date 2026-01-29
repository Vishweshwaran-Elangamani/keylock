import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/AllocateByCategoryModal.css";
const AllocateByCategoryModal = ({
  show,
  budget,
  onHide,
  onAllocationCreated,
}) => {
  const [formData, setFormData] = useState({
    allocationType: "Promotion",
    allocationName: "",
    amount: "",
    goalStatus: "Approved",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = parseInt(localStorage.getItem("userId"));
  const ALLOCATION_TYPES = ["Promotion", "Training", "Bonus", "Other"];
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
      if (!formData.allocationType) {
        toast.error("Please select allocation type");
        setLoading(false);
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error("Amount must be greater than zero");
        setLoading(false);
        return;
      }
      const allocationAmount = parseFloat(formData.amount);
      const totalAlreadyAllocated = budget.totalAlreadyAllocated || 0;
      const remainingBudget =
        (budget.allocatedAmount || 0) - totalAlreadyAllocated;
      if (allocationAmount > remainingBudget) {
        toast.error(
          `Cannot allocate Rs.${allocationAmount.toLocaleString(
            "en-IN"
          )}. Only Rs.${remainingBudget.toLocaleString(
            "en-IN"
          )} remaining (Already allocated: Rs.${totalAlreadyAllocated.toLocaleString(
            "en-IN"
          )} out of Rs.${(budget.allocatedAmount || 0).toLocaleString(
            "en-IN"
          )})`
        );
        setLoading(false);
        return;
      }
      const allocationName = formData.allocationName.trim()
        ? formData.allocationName
        : `${
            formData.allocationType
          } Allocation - ${new Date().toLocaleDateString()}`;
      const allocationData = {
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        allocationType: formData.allocationType,
        allocationName: allocationName,
        amount: allocationAmount,
        goalStatus: "Approved",
        notes: formData.notes,
        allocatedByUserId: currentUserId,
      };
      const response = await budgetAllocationService.createBudgetAllocation(
        allocationData
      );
      if (!response.success) {
        toast.error(response.message || "Failed to create allocation");
        setLoading(false);
        return;
      }
      const newAllocation = {
        allocationId:
          response.data?.allocationId ||
          response.data?.data?.allocationId ||
          Date.now(),
        budgetId: budget.budgetId,
        departmentId: budget.departmentId,
        allocationType: formData.allocationType,
        allocationName: allocationName,
        amount: allocationAmount,
        goalStatus: "Approved",
        notes: formData.notes,
        utilizationPercentage: 0,
        utilizedAmount: 0,
        allocatedAt: new Date().toISOString(),
      };
      onAllocationCreated(newAllocation);
      handleClose();
      toast.success("Budget allocation created successfully");
    } catch (err) {
      console.error("Error creating allocation:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to create allocation";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      allocationType: "Promotion",
      allocationName: "",
      amount: "",
      goalStatus: "Approved",
      notes: "",
    });
    setError(null);
    onHide();
  };
  const totalAlreadyAllocated = budget.totalAlreadyAllocated || 0;
  const remainingBudget = (budget.allocatedAmount || 0) - totalAlreadyAllocated;
  return (
    <Modal show={show} onHide={handleClose} size="lg" className="abcm-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Allocate Budget by Category
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Show old-style error alert for form validation fallback */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}
          {/* Budget info display */}
          <div className="abcm-approval-info">
            <div className="abcm-info-card">
              <label>Department:</label>
              <span>{budget?.departmentName || "Unknown"}</span>
            </div>
            <div className="abcm-info-card">
              <label>Fiscal Year:</label>
              <span>{budget?.fiscalYear}</span>
            </div>
            <div className="abcm-info-card">
              <label>Allocated Budget:</label>
              <span>{formatCurrency(budget?.allocatedAmount)}</span>
            </div>
            <div className="abcm-info-card">
              <label>Utilized:</label>
              <span className="abcm-info-utilized">
                {formatCurrency(budget?.utilizedAmount)}
              </span>
            </div>
          </div>
          {/* Form inputs grid */}
          <div className="abcm-form-grid">
            <div className="abcm-form-column">
              <div className="mb-3">
                <label
                  htmlFor="allocationType"
                  className="form-label abcm-form-label"
                >
                  Allocation Type{" "}
                  <span className="text-danger abcm-required">*</span>
                </label>
                <select
                  className="form-select abcm-form-control abcm-form-select"
                  id="allocationType"
                  name="allocationType"
                  value={formData.allocationType}
                  onChange={handleChange}
                  required
                >
                  {ALLOCATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="abcm-form-column">
              <div className="mb-3">
                <label htmlFor="amount" className="form-label abcm-form-label">
                  Amount (Rs.){" "}
                  <span className="text-danger abcm-required">*</span>
                </label>
                <input
                  type="number"
                  className="form-control abcm-form-control"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter allocation amount"
                  step="0.01"
                  min="0"
                  required
                />
                <small className="form-text text-muted abcm-form-hint">
                  Remaining budget: {formatCurrency(remainingBudget)}
                  {totalAlreadyAllocated > 0 &&
                    ` (Already allocated: ${formatCurrency(
                      totalAlreadyAllocated
                    )})`}
                </small>
              </div>
            </div>
          </div>
          {/* Allocation name input with placeholder */}
          <div className="mb-3">
            <label
              htmlFor="allocationName"
              className="form-label abcm-form-label"
            >
              Allocation Name (optional)
            </label>
            <input
              type="text"
              className="form-control abcm-form-control"
              id="allocationName"
              name="allocationName"
              value={formData.allocationName}
              onChange={handleChange}
              placeholder="Enter allocation name or leave blank for default"
            />
          </div>
          {/* Notes textarea */}
          <div className="mb-3">
            <label htmlFor="notes" className="form-label abcm-form-label">
              Notes
            </label>
            <textarea
              className="form-control abcm-form-control abcm-textarea-full"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes (optional)"
              rows="3"
            />
          </div>
          {/* Budget Summary display */}
          <div className="abcm-details-section">
            <h6 className="abcm-details-heading">Budget Summary</h6>
            <div className="abcm-details-grid">
              <div className="abcm-detail-item">
                <label>Allocated Budget:</label>
                <span>{formatCurrency(budget?.allocatedAmount)}</span>
              </div>
              <div className="abcm-detail-item">
                <label>Already Allocated:</label>
                <span className="abcm-detail-allocated">
                  {formatCurrency(totalAlreadyAllocated)}
                </span>
              </div>
              <div className="abcm-detail-item">
                <label>This Allocation:</label>
                <span className="abcm-detail-this-allocation">
                  {formatCurrency(formData.amount)}
                </span>
              </div>
              <div className="abcm-detail-item">
                <label>Remaining after:</label>
                <span
                  className={
                    remainingBudget - (parseFloat(formData.amount) || 0) >= 0
                      ? "abcm-detail-remaining-positive"
                      : "abcm-detail-remaining-negative"
                  }
                >
                  {formatCurrency(
                    remainingBudget - (parseFloat(formData.amount) || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
          {/* Warning if amount exceeds remaining budget */}
          {parseFloat(formData.amount) > remainingBudget && (
            <div className="abcm-alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill abcm-alert-icon"></i>
              <strong className="abcm-alert-strong">
                AMOUNT EXCEEDS REMAINING BUDGET!
              </strong>
              <p className="abcm-alert-text">
                Allocation amount (Rs.{" "}
                {parseFloat(formData.amount).toLocaleString("en-IN")}) exceeds
                remaining budget (Rs.{remainingBudget.toLocaleString("en-IN")})
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn abcm-btn-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn abcm-btn-submit"
            disabled={loading || parseFloat(formData.amount) > remainingBudget}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm abcm-spinner"
                  role="status"
                ></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Create Allocation
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
export default AllocateByCategoryModal;
