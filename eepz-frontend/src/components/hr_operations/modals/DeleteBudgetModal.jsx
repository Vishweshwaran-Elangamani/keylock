import { useState } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../services/hr_operations/hr/budgetAllocationService";
import "../../../styles/hr_operations/hr/deleteBudgetModal.css";

const DeleteBudgetModal = ({ show, onHide, onBudgetDeleted, budget }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmValid = confirmText.toLowerCase() === "confirm";

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast.error("Please type 'confirm' to proceed with deletion");
      return;
    }

    try {
      setLoading(true);
      await budgetAllocationService.deleteDepartmentBudget(budget.budgetId);
      toast.success("Department budget deleted successfully!");
      onBudgetDeleted();
      setTimeout(() => {
        onHide();
      }, 500);
    } catch (error) {
      toast.error(error.message || "Failed to delete budget");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        className="delete-budget-backdrop"
        onClick={onHide}
      />

      {/* Modal Container */}
      <div className="delete-budget-modal-wrapper">
        <div className="delete-budget-modal-container">
          {/* MODAL HEADER */}
          <div className="delete-budget-modal-header">
            <div className="delete-budget-header-title">
              <i className="bi bi-trash-fill"></i>
              Delete Department Budget
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              className="delete-budget-close-btn"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="delete-budget-modal-body">
            {/* Confirmation Question */}
            <p className="delete-budget-confirmation-text">
              Are you sure you want to permanently delete the budget for{" "}
              <strong className="delete-budget-highlight">
                {budget?.departmentName}
              </strong>{" "}
              (Fiscal Year: <strong>{budget?.fiscalYear}</strong>)?
            </p>

            {/* Critical Warning Box */}
            <div className="delete-budget-warning-box">
              {/* Warning Header with Icon */}
              <div className="delete-budget-warning-header">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Critical Warning</span>
              </div>

              {/* Warning Text */}
              <p className="delete-budget-warning-text">
                <strong>This action is PERMANENT and CANNOT be reversed!</strong>
                <br />
              </p>

              {/* Warning List */}
              <ul className="delete-budget-warning-list">
                <strong>Once deleted, this budget will:</strong>
                <li>Be permanently removed from the system</li>
                <li>Lose all allocation and utilization data</li>
                <li>Cannot be recovered or restored</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="delete-budget-input-section">
              <label className="delete-budget-input-label">
                Type <strong className="delete-budget-confirm-keyword">confirm</strong> to proceed:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type 'confirm' here"
                disabled={loading}
                className="delete-budget-input"
              />
            </div>

            {/* Info Alert */}
            <div className="delete-budget-info-alert">
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong> Please ensure this is the correct action
                before proceeding.
              </small>
            </div>
          </div>

          {/* MODAL FOOTER - ACTION BUTTONS */}
          <div className="delete-budget-modal-footer">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              className="delete-budget-btn-cancel"
            >
              <i className="bi bi-arrow-left"></i> Cancel
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || !isConfirmValid}
              className={`delete-budget-btn-delete ${!isConfirmValid ? 'disabled' : ''}`}
            >
              {loading ? (
                <>
                  <span className="delete-budget-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash-fill"></i>
                  Yes, Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteBudgetModal;
