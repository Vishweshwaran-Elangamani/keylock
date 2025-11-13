import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const CreateBudgetModal = ({ show, onHide, onBudgetCreated }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    fiscalYear: new Date().getFullYear(),
    totalBudget: "",
    allocatedAmount: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      fetchDepartments();
    }
  }, [show]);

  const fetchDepartments = async () => {
    try {
      console.log(" Fetching departments...");
      const response = await budgetAllocationService.getAllDepartments();
      console.log(" Departments fetched:", response.data);
      setDepartments(response.data || []);
    } catch (err) {
      console.error(" Error fetching departments:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "departmentId" || name === "fiscalYear"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //  VALIDATIONS
      if (!formData.departmentId) {
        setError("Please select a department");
        setLoading(false);
        return;
      }

      if (!formData.fiscalYear) {
        setError("Please select a fiscal year");
        setLoading(false);
        return;
      }

      if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
        setError("Total budget must be greater than zero");
        setLoading(false);
        return;
      }

      const allocatedAmount = formData.allocatedAmount
        ? parseFloat(formData.allocatedAmount)
        : parseFloat(formData.totalBudget);

      if (allocatedAmount > parseFloat(formData.totalBudget)) {
        setError("Allocated amount cannot exceed total budget");
        setLoading(false);
        return;
      }

      console.log(" Creating budget...");

      await budgetAllocationService.createDepartmentBudget({
        departmentId: formData.departmentId,
        fiscalYear: formData.fiscalYear,
        totalBudget: parseFloat(formData.totalBudget),
        allocatedAmount: allocatedAmount,
      });

      console.log(" Budget created successfully");
      onBudgetCreated();
      handleClose();
    } catch (err) {
      console.error(" Error creating budget:", err);
      setError(err.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      departmentId: "",
      fiscalYear: new Date().getFullYear(),
      totalBudget: "",
      allocatedAmount: "",
    });
    setError(null);
    onHide();
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Add Department Budget
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

          <div className="promo-form-grid">
            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="departmentId" className="form-label">
                  Department <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="fiscalYear" className="form-label">
                  Fiscal Year <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="fiscalYear"
                  name="fiscalYear"
                  value={formData.fiscalYear}
                  onChange={handleChange}
                  required
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="promo-form-column">
              <div className="mb-3">
                <label htmlFor="totalBudget" className="form-label">
                  Total Budget (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="totalBudget"
                  name="totalBudget"
                  value={formData.totalBudget}
                  onChange={handleChange}
                  placeholder="Enter total budget"
                  step="0.01"
                  min="0"
                  required
                />
                <small className="form-text text-muted">
                  Total budget allocated to this department
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="allocatedAmount" className="form-label">
                  Allocated Amount (₹)
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="allocatedAmount"
                  name="allocatedAmount"
                  value={formData.allocatedAmount}
                  onChange={handleChange}
                  placeholder="Leave empty to allocate full budget"
                  step="0.01"
                  min="0"
                />
                <small className="form-text text-muted">
                  Amount to be allocated for spending (defaults to total budget)
                </small>
              </div>
            </div>
          </div>

          {/*  SUMMARY */}
          {formData.totalBudget && (
            <div
              className="promo-details-section"
              style={{
                backgroundColor: "#f0fdf4",
                borderLeft: "4px solid #10b981",
              }}
            >
              <h6 className="promo-details-heading"> Budget Summary</h6>
              <div className="promo-details-grid">
                <div className="promo-detail-item">
                  <label>Total Budget:</label>
                  <span>{formatCurrency(formData.totalBudget)}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Allocated Amount:</label>
                  <span>
                    {formatCurrency(
                      formData.allocatedAmount || formData.totalBudget
                    )}
                  </span>
                </div>
                <div className="promo-detail-item">
                  <label>Remaining:</label>
                  <span>
                    {formatCurrency(
                      (formData.totalBudget || 0) -
                        (formData.allocatedAmount || formData.totalBudget || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/*  INFO ALERT */}
          <div
            className="alert alert-info"
            role="alert"
            style={{ marginTop: "16px" }}
          >
            <i className="bi bi-info-circle me-2"></i>
            <strong>Budget Creation:</strong>
            <ul style={{ marginTop: "8px", marginBottom: 0, fontSize: "12px" }}>
              <li>Set the total budget for the department</li>
              <li>
                Optionally set allocated amount for initial spending limit
              </li>
              <li>HR/DeptHead will break this down by allocation type</li>
              <li>This cannot be edited after creation</li>
            </ul>
          </div>
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Create Budget
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreateBudgetModal;
