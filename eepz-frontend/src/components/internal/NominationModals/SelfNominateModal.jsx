import { useState } from "react";
import nominationService from "../../../services/internal/nominationService";
import { toast } from "sonner";
import "../../../styles/internal/SelfNominateModal.css";
const SelfNominateModal = ({
  show,
  onHide,
  opportunity,
  onNominationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    justification: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    } else if (formData.justification.trim().length < 50) {
      newErrors.justification = "Justification must be at least 50 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        opportunityId: opportunity.opportunityId,
        justification: formData.justification.trim(),
        nominationType: "Self",
      };
      const response = await nominationService.selfNominate(payload);
      if (response.success) {
        toast.success("Self-nomination submitted successfully!");
        onNominationSubmitted();
        onHide();
      } else {
        toast.error(response.message || "Failed to submit nomination");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to submit nomination");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="snm-backdrop" onClick={onHide} />
      <div className="snm-modal-wrapper">
        <div className="snm-modal-dialog">
          {/* Modal Header */}
          <div className="snm-modal-header">
            <div className="snm-header-title">
              <i className="bi bi-hand-thumbs-up"></i>
              Self Nominate for Opportunity
            </div>
            <button
              onClick={onHide}
              disabled={loading}
              className="snm-close-button"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="snm-form">
            {/* Modal Body */}
            <div className="snm-modal-body">
              {/* Info Section */}
              <div className="snm-info-section">
                <p className="snm-info-item">
                  <span className="snm-info-label">Opportunity:</span>{" "}
                  {opportunity.opportunityName}
                </p>
                <p className="snm-info-item">
                  <span className="snm-info-label">Department:</span>{" "}
                  {opportunity.departmentName}
                </p>
                <p className="snm-info-item">
                  <span className="snm-info-label">Deadline:</span>{" "}
                  {new Date(opportunity.deadline).toLocaleDateString()}
                </p>
              </div>
              {/* Justification Field */}
              <div className="snm-form-group">
                <label className="snm-form-label">
                  Why are you interested in this role?{" "}
                  <span className="snm-required-asterisk">*</span>
                </label>
                <textarea
                  name="justification"
                  placeholder="Tell us why you're a great fit for this opportunity..."
                  value={formData.justification}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  className={`snm-form-textarea ${
                    errors.justification ? "error" : ""
                  }`}
                />
                {errors.justification && (
                  <div className="snm-form-error">{errors.justification}</div>
                )}
                <small className="snm-form-hint">
                  {formData.justification.length}/1000 characters
                  {formData.justification.length >= 50 &&
                    !errors.justification && (
                      <span className="snm-char-success">
                        ✓ Minimum length met
                      </span>
                    )}
                </small>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="snm-modal-footer">
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="snm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="snm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="snm-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Submit Nomination
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default SelfNominateModal;
