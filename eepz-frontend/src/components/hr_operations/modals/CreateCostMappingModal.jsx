import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import costMappingService from "../../../services/hr_operations/hr/costMappingService";
import { formatCurrency } from "../../../utils/auth/currencyFormatter";

import "react-datepicker/dist/react-datepicker.css";

const CreateCostMappingModal = ({ show, onHide, onMappingCreated }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    fiscalYear: new Date(),
    totalBudget: "",
    headcount: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHeadcount, setFetchingHeadcount] = useState(false);
  const [error, setError] = useState("");
  const [loadingDepts, setLoadingDepts] = useState(false);

  //  FETCH DEPARTMENTS on modal open
  useEffect(() => {
    if (show) {
      fetchDepartments();
    }
  }, [show]);

  //  AUTO-FETCH HEADCOUNT when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchHeadcountForDepartment(formData.departmentId);
    }
  }, [formData.departmentId]);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    setError("");
    try {
      console.log(" Fetching departments...");
      const response = await costMappingService.getAllDepartments();
      console.log(" Departments response:", response);
      setDepartments(response.data || []);
    } catch (err) {
      console.error(" Error fetching departments:", err);
      setError(err.message || "Failed to load departments");
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchHeadcountForDepartment = async (departmentId) => {
    setFetchingHeadcount(true);
    try {
      console.log(" Fetching headcount for dept:", departmentId);
      const response = await costMappingService.getDepartmentHeadcount(
        departmentId
      );
      console.log(" Headcount response:", response);

      if (response.success && response.data) {
        const headcount =
          response.data.currentHeadcount || response.data.headcount || 1;
        console.log(" Headcount auto-fetched:", headcount);
        setFormData((prev) => ({
          ...prev,
          headcount: headcount,
        }));
      } else {
        console.log(" Using default headcount: 1");
        setFormData((prev) => ({
          ...prev,
          headcount: 1,
        }));
      }
    } catch (err) {
      console.error(" Error fetching headcount:", err);
      setFormData((prev) => ({
        ...prev,
        headcount: 1,
      }));
    } finally {
      setFetchingHeadcount(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  //  Handle date change (year only)
  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      fiscalYear: date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (
        !formData.departmentId ||
        !formData.fiscalYear ||
        !formData.totalBudget
      ) {
        setError("Please fill all required fields");
        setLoading(false);
        return;
      }

      const year = new Date(formData.fiscalYear).getFullYear();

      console.log("Creating cost mapping:", {
        departmentId: formData.departmentId,
        fiscalYear: year,
        totalBudget: formData.totalBudget,
        headcount: formData.headcount,
      });

      await costMappingService.createCostMapping({
        departmentId: parseInt(formData.departmentId),
        fiscalYear: year,
        totalBudget: parseFloat(formData.totalBudget),
        headcount: formData.headcount ? parseInt(formData.headcount) : 1,
      });

      setFormData({
        departmentId: "",
        fiscalYear: new Date(),
        totalBudget: "",
        headcount: "",
      });
      setError("");
      onMappingCreated();
      onHide();
    } catch (err) {
      console.error("Error creating cost mapping:", err);
      setError(err.message || "Failed to create cost mapping");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Add Department Budget
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
            <div className="col-md-6">
              <label className="form-label fw-600">
                Department <span className="text-danger">*</span>
              </label>
              {loadingDepts ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <select
                  className="form-select"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              )}
              <small className="text-muted">Select from list</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-600">
                Fiscal Year <span className="text-danger">*</span>
              </label>
              <DatePicker
                selected={formData.fiscalYear}
                onChange={handleDateChange}
                showYearPicker
                dateFormat="yyyy"
                className="form-control"
                placeholderText="Select Year"
              />
              <small className="text-muted">Click to open year calendar</small>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-600">
                Total Budget <span className="text-danger">*</span>
              </label>
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
                  required
                />
                {formData.totalBudget && (
                  <span className="input-group-text">
                    {formatCurrency(formData.totalBudget)}
                  </span>
                )}
              </div>
              <small className="text-muted">Enter any amount</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-600">
                Headcount
                {fetchingHeadcount && (
                  <i className="bi bi-hourglass-split ms-2 text-primary"></i>
                )}
              </label>
              <input
                type="number"
                className="form-control"
                name="headcount"
                value={formData.headcount}
                disabled={true}
                placeholder="Auto-fetched"
              />
              <small className="text-muted">
                {fetchingHeadcount
                  ? " Fetching from database..."
                  : " Auto-calculated (Read-only)"}
              </small>
            </div>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onHide}
          disabled={loading || fetchingHeadcount || loadingDepts}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || fetchingHeadcount || loadingDepts}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Creating...
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle me-2"></i>
              Create
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateCostMappingModal;
