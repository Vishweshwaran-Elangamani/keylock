import { useState, useEffect } from "react";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import toastr from "toastr";
import "../../../styles/internal/OpportunityModal.css";

const EditOpportunityModal = ({
  show,
  onHide,
  onOpportunityUpdated,
  opportunity,
  departments,
}) => {
  const [formData, setFormData] = useState({
    opportunityName: "",
    departmentId: "",
    description: "",
    requirements: "",
    eligibilityCriteria: "",
    deadline: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (opportunity) {
      setFormData({
        opportunityName: opportunity.opportunityName || "",
        departmentId: opportunity.departmentId || "",
        description: opportunity.description || "",
        requirements: opportunity.requirements || "",
        eligibilityCriteria: opportunity.eligibilityCriteria || "",
        deadline: opportunity.deadline
          ? opportunity.deadline.split("T")[0]
          : "",
        status: opportunity.status || "Active",
      });
    }
  }, [opportunity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = "Requirements are required";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toastr.error("Please fix the form errors");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        opportunityName: formData.opportunityName.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim() || null,
        deadline: formData.deadline,
        status: formData.status,
      };

      const response = await internalOpportunityService.updateOpportunity(
        opportunity.opportunityId,
        payload
      );

      if (response.success) {
        toastr.success("Opportunity updated successfully!");
        onOpportunityUpdated();
        onHide();
      } else {
        toastr.error(response.message || "Failed to update opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      toastr.error(error.message || "Failed to update opportunity");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-pencil-fill"></i>
                Edit Opportunity
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="form-grid">
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Opportunity Name <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      name="opportunityName"
                      className={`form-input-custom ${
                        errors.opportunityName ? "is-invalid" : ""
                      }`}
                      placeholder="Opportunity name"
                      value={formData.opportunityName}
                      onChange={handleChange}
                      maxLength={200}
                    />
                    {errors.opportunityName && (
                      <div className="error-message">{errors.opportunityName}</div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Department <span className="required-mark">*</span>
                    </label>
                    <select
                      name="departmentId"
                      className={`form-select-custom ${
                        errors.departmentId ? "is-invalid" : ""
                      }`}
                      value={formData.departmentId}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <div className="error-message">{errors.departmentId}</div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Deadline <span className="required-mark">*</span>
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      className={`form-input-custom ${
                        errors.deadline ? "is-invalid" : ""
                      }`}
                      value={formData.deadline}
                      onChange={handleChange}
                    />
                    {errors.deadline && (
                      <div className="error-message">{errors.deadline}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Description <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="description"
                      className={`form-textarea-custom ${
                        errors.description ? "is-invalid" : ""
                      }`}
                      placeholder="Description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      maxLength={1000}
                    />
                    {errors.description && (
                      <div className="error-message">{errors.description}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Requirements <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="requirements"
                      className={`form-textarea-custom ${
                        errors.requirements ? "is-invalid" : ""
                      }`}
                      placeholder="Requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows={3}
                      maxLength={1000}
                    />
                    {errors.requirements && (
                      <div className="error-message">{errors.requirements}</div>
                    )}
                  </div>

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Eligibility Criteria
                    </label>
                    <textarea
                      name="eligibilityCriteria"
                      className="form-textarea-custom"
                      placeholder="Eligibility criteria"
                      value={formData.eligibilityCriteria}
                      onChange={handleChange}
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Status <span className="required-mark">*</span>
                    </label>
                    <select
                      name="status"
                      className="form-select-custom"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onHide}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-custom"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Update Opportunity
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditOpportunityModal;
