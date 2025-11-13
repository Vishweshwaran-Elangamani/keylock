import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import costMappingService from "../../../../services/hr_operations/hr/costMappingService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const EditCostMappingModal = ({ show, mapping, onHide, onMappingUpdated }) => {
  const [formData, setFormData] = useState({
    budgetId: "",
    totalBudget: "",
    allocatedAmount: "",
    utilizedAmount: "",
    headcount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mapping && show) {
      setFormData({
        budgetId: mapping.budgetId || "",
        totalBudget: mapping.totalBudget || "",
        allocatedAmount: mapping.allocatedAmount || "",
        utilizedAmount: mapping.utilizedAmount || "",
        headcount: mapping.headcount || "",
      });
      setError("");
    }
  }, [mapping, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.budgetId) {
        setError("Invalid budget");
        setLoading(false);
        return;
      }

      console.log("Updating cost mapping:", formData);

      await costMappingService.updateCostMapping({
        budgetId: parseInt(formData.budgetId),
        totalBudget: formData.totalBudget
          ? parseFloat(formData.totalBudget)
          : null,
        allocatedAmount: formData.allocatedAmount
          ? parseFloat(formData.allocatedAmount)
          : null,
        utilizedAmount: formData.utilizedAmount
          ? parseFloat(formData.utilizedAmount)
          : null,
        headcount: formData.headcount ? parseInt(formData.headcount) : null,
      });

      setError("");
      onMappingUpdated();
      onHide();
    } catch (err) {
      console.error("Error updating cost mapping:", err);
      setError(err.message || "Failed to update cost mapping");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Edit Department Budget
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label fw-600">
                Department: <strong>{mapping?.departmentName}</strong> | Fiscal
                Year: <strong>{mapping?.fiscalYear}</strong>
              </label>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-600">Total Budget</label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  name="totalBudget"
                  value={formData.totalBudget}
                  onChange={handleInputChange}
                  placeholder="e.g., 100000"
                  step="1"
                />
                {formData.totalBudget && (
                  <span className="input-group-text">
                    {formatCurrency(formData.totalBudget)}
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-600">Headcount (Read-only)</label>
              <input
                type="number"
                className="form-control"
                name="headcount"
                value={formData.headcount}
                disabled={true}
                placeholder="Auto-fetched"
              />
              <small className="text-muted">
                {" "}
                Auto-calculated (cannot edit)
              </small>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-600">Allocated Amount</label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleInputChange}
                  placeholder="e.g., 80000"
                  step="1"
                />
                {formData.allocatedAmount && (
                  <span className="input-group-text">
                    {formatCurrency(formData.allocatedAmount)}
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-600">Utilized Amount</label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  className="form-control"
                  name="utilizedAmount"
                  value={formData.utilizedAmount}
                  onChange={handleInputChange}
                  placeholder="e.g., 75000"
                  step="1"
                />
                {formData.utilizedAmount && (
                  <span className="input-group-text">
                    {formatCurrency(formData.utilizedAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Updating...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Update
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditCostMappingModal;
