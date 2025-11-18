import { useState, useMemo } from "react";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";
import "../../../styles/internal/OpportunityModal.css";

const CreateOpportunityModal = ({
  show,
  onHide,
  onOpportunityCreated,
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

  //  Calculate min and max dates (no blocking, just calendar restrictions)
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Min date: today
    const min = today.toISOString().split("T")[0];

    // Max date: April 30th of current year (or next year if we're past April)
    const currentMonth = today.getMonth();
    const aprilDeadlineYear = currentMonth >= 3 ? currentYear + 1 : currentYear;
    const max = `${aprilDeadlineYear}-04-30`;

    return {
      minDate: min,
      maxDate: max,
    };
  }, []);

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
    } else if (formData.opportunityName.trim().length < 5) {
      newErrors.opportunityName =
        "Opportunity name must be at least 5 characters";
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
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if deadline is in the past
      if (deadlineDate < today) {
        newErrors.deadline = "Deadline cannot be in the past";
      }

      // Check if deadline is after April 30th
      const maxDeadline = new Date(maxDate);
      if (deadlineDate > maxDeadline) {
        newErrors.deadline = `Deadline cannot be after April 30th, ${maxDeadline.getFullYear()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        opportunityName: formData.opportunityName.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim() || "",
        deadline: formData.deadline,
        status: formData.status,
      };

      console.log(" Full payload:", JSON.stringify(payload, null, 2));

      const response = await internalOpportunityService.createOpportunity(
        payload
      );

      if (response.success || response.data) {
        toast.success("Opportunity created successfully!");
        setFormData({
          opportunityName: "",
          departmentId: "",
          description: "",
          requirements: "",
          eligibilityCriteria: "",
          deadline: "",
          status: "Active",
        });
        setErrors({});
        onOpportunityCreated();
        onHide();
      } else {
        toast.error(response.message || "Failed to create opportunity");
      }
    } catch (error) {
      console.error(" Error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        "Failed to create opportunity";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      opportunityName: "",
      departmentId: "",
      description: "",
      requirements: "",
      eligibilityCriteria: "",
      deadline: "",
      status: "Active",
    });
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            {/* Modal Header */}
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-briefcase-fill"></i>
                Create Internal Opportunity
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleClose}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="form-grid">
                  {/* Opportunity Name */}
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
                      placeholder="e.g., Senior Java Developer - Project Phoenix"
                      value={formData.opportunityName}
                      onChange={handleChange}
                      maxLength={200}
                    />
                    {errors.opportunityName && (
                      <div className="error-message">
                        {errors.opportunityName}
                      </div>
                    )}
                  </div>

                  {/* Department */}
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
                        <option
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <div className="error-message">{errors.departmentId}</div>
                    )}
                  </div>

                  {/* Deadline - ONLY CALENDAR RESTRICTION */}
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Application Deadline{" "}
                      <span className="required-mark">*</span>
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      className={`form-input-custom ${
                        errors.deadline ? "is-invalid" : ""
                      }`}
                      value={formData.deadline}
                      onChange={handleChange}
                      min={minDate}
                      max={maxDate}
                    />
                    {errors.deadline && (
                      <div className="error-message">{errors.deadline}</div>
                    )}
                    <small className="form-text-helper">
                      Select a date between{" "}
                      {new Date(minDate).toLocaleDateString()} and{" "}
                      {new Date(maxDate).toLocaleDateString()}
                    </small>
                  </div>

                  {/* Description */}
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Description <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="description"
                      className={`form-textarea-custom ${
                        errors.description ? "is-invalid" : ""
                      }`}
                      placeholder="Provide detailed description of the opportunity..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      maxLength={1000}
                    />
                    {errors.description && (
                      <div className="error-message">{errors.description}</div>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Requirements <span className="required-mark">*</span>
                    </label>
                    <textarea
                      name="requirements"
                      className={`form-textarea-custom ${
                        errors.requirements ? "is-invalid" : ""
                      }`}
                      placeholder="List required skills and qualifications..."
                      value={formData.requirements}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                    />
                    {errors.requirements && (
                      <div className="error-message">{errors.requirements}</div>
                    )}
                  </div>

                  {/* Eligibility Criteria */}
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Eligibility Criteria
                    </label>
                    <textarea
                      name="eligibilityCriteria"
                      className="form-textarea-custom"
                      placeholder="Define eligibility criteria (optional)..."
                      value={formData.eligibilityCriteria}
                      onChange={handleChange}
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  {/* Status */}
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

                {/* Info Alert */}
                <div className="info-alert">
                  <i className="bi bi-info-circle"></i>
                  <small>
                    Employees will be able to view and apply for active
                    opportunities
                  </small>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClose}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-custom"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i>
                      Create Opportunity
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

export default CreateOpportunityModal;
