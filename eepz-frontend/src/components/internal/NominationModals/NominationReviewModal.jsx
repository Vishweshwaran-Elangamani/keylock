import { useState, useEffect, useRef } from "react";
import nominationService from "../../../services/internal/nominationService";
import { toast } from "sonner";
import "../../../styles/internal/NominationReviewModal.css";


const CustomDropdown = ({ value, onChange, options, placeholder, name, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`nrm-custom-dropdown ${error ? "error" : ""}`}
    >
      <div
        className="nrm-custom-dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`nrm-custom-dropdown-text ${!selectedOption ? "placeholder" : ""}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`nrm-custom-dropdown-arrow ${isOpen ? "open" : ""}`}>
          <i className="bi bi-chevron-down"></i>
        </span>
      </div>

      {isOpen && (
        <div className="nrm-custom-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`nrm-custom-dropdown-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NominationReviewModal = ({
  show,
  onHide,
  nomination,
  userRole,
  onReviewSubmitted,
}) => {
  const [formData, setFormData] = useState({
    action: "",
    remarks: "",
    // Department Head specific fields
    meritScore: "",
    diversityScore: "",
    conflictOfInterest: "",
    reviewNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isDepartmentHead = userRole === "Department Head";

  
  const decisionOptions = [
    { label: "-- Select Action --", value: "" },
    { label: "Approve", value: "Approved" },
    { label: "Reject", value: "Rejected" },
  ];

  
  const conflictOptions = [
    { label: "-- Select --", value: "" },
    { label: "No", value: "false" },
    { label: "Yes", value: "true" },
  ];

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

    if (!formData.action) {
      newErrors.action = "Please select an action";
    }

    if (isDepartmentHead && formData.action === "Approved") {
      if (!formData.meritScore) {
        newErrors.meritScore = "Merit score is required for approval";
      } else if (
        isNaN(formData.meritScore) ||
        formData.meritScore < 0 ||
        formData.meritScore > 100
      ) {
        newErrors.meritScore = "Merit score must be between 0 and 100";
      }

      if (!formData.diversityScore) {
        newErrors.diversityScore = "Diversity score is required for approval";
      } else if (
        isNaN(formData.diversityScore) ||
        formData.diversityScore < 0 ||
        formData.diversityScore > 100
      ) {
        newErrors.diversityScore = "Diversity score must be between 0 and 100";
      }

      if (!formData.conflictOfInterest) {
        newErrors.conflictOfInterest = "Please specify conflict of interest";
      }
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

      let payload;

      if (isDepartmentHead) {
        payload = {
          action: formData.action,
          reviewRemarks: formData.remarks.trim(),
          ...(formData.action === "Approved" && {
            meritScore: parseFloat(formData.meritScore),
            diversityScore: parseFloat(formData.diversityScore),
            conflictOfInterest: formData.conflictOfInterest === "true",
            reviewNotes: formData.reviewNotes.trim(),
          }),
        };
      } else {
        payload = {
          actionTaken: formData.action,
          remarks: formData.remarks.trim(),
        };
      }

      const response = await nominationService.reviewNomination(
        nomination.nominationId,
        payload,
        userRole
      );

      if (response.success) {
        toast.success(
          `Nomination ${formData.action.toLowerCase()} successfully!`
        );
        onReviewSubmitted();
        onHide();
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="nrm-backdrop" onClick={onHide} />

      <div className="nrm-modal-wrapper">
        <div className="nrm-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="nrm-modal-header">
            <div className="nrm-header-title">
              <i className="bi bi-clipboard-check"></i>
              Review Nomination -{" "}
              {isDepartmentHead ? "Department Head" : "Manager"}
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              className="nrm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form onSubmit={handleSubmit} className="nrm-form">
            <div className="nrm-modal-body">
              {/* Info Section - Rearranged Layout */}
              <div className="nrm-info-section">
                <div
                  className={`nrm-info-grid ${
                    !nomination.justification ? "no-justification" : ""
                  }`}
                >
                  {/* LEFT COLUMN */}
                  <div className="nrm-info-column">
                    {/* Opportunity */}
                    <div className="nrm-info-item">
                      <label className="nrm-info-label">Opportunity:</label>
                      <p className="nrm-info-value">
                        {nomination.opportunityName}
                      </p>
                    </div>

                    {/* Nominated By */}
                    <div className="nrm-info-item">
                      <label className="nrm-info-label">Nominated By:</label>
                      <p className="nrm-info-value">
                        {nomination.nominatedByName}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="nrm-info-column">
                    {/* Nominee */}
                    <div className="nrm-info-item">
                      <label className="nrm-info-label">Nominee:</label>
                      <p className="nrm-info-value">{nomination.nomineeName}</p>
                    </div>

                    {/* Type */}
                    <div className="nrm-info-item">
                      <label className="nrm-info-label">Type:</label>
                      <p className="nrm-info-value">
                        {nomination.nominationType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Justification - Full Width */}
                {nomination.justification && (
                  <div className="nrm-justification">
                    <label className="nrm-info-label">Justification:</label>
                    <p className="nrm-justification-text">
                      {nomination.justification}
                    </p>
                  </div>
                )}
              </div>

              {/* Decision Field - Custom Dropdown */}
              <div className="nrm-form-group">
                <label className="nrm-form-label">
                  Decision <span className="nrm-required-asterisk">*</span>
                </label>
                <CustomDropdown
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  options={decisionOptions}
                  placeholder="-- Select Action --"
                  error={errors.action}
                />
                {errors.action && (
                  <div className="nrm-form-error">{errors.action}</div>
                )}
              </div>

              {/* Department Head Approval Fields */}
              {isDepartmentHead && formData.action === "Approved" && (
                <>
                  {/* Merit and Diversity Scores Row */}
                  <div className="nrm-two-column-grid">
                    {/* Merit Score */}
                    <div className="nrm-form-group">
                      <label className="nrm-form-label">
                        Merit Score (0-100){" "}
                        <span className="nrm-required-asterisk">*</span>
                      </label>
                      <input
                        type="number"
                        name="meritScore"
                        placeholder="Enter merit score"
                        value={formData.meritScore}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`nrm-form-input ${
                          errors.meritScore ? "error" : ""
                        }`}
                      />
                      {errors.meritScore && (
                        <div className="nrm-form-error">
                          {errors.meritScore}
                        </div>
                      )}
                    </div>

                    {/* Diversity Score */}
                    <div className="nrm-form-group">
                      <label className="nrm-form-label">
                        Diversity Score (0-100){" "}
                        <span className="nrm-required-asterisk">*</span>
                      </label>
                      <input
                        type="number"
                        name="diversityScore"
                        placeholder="Enter diversity score"
                        value={formData.diversityScore}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`nrm-form-input ${
                          errors.diversityScore ? "error" : ""
                        }`}
                      />
                      {errors.diversityScore && (
                        <div className="nrm-form-error">
                          {errors.diversityScore}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conflict of Interest - Custom Dropdown */}
                  <div className="nrm-form-group">
                    <label className="nrm-form-label">
                      Conflict of Interest{" "}
                      <span className="nrm-required-asterisk">*</span>
                    </label>
                    <CustomDropdown
                      name="conflictOfInterest"
                      value={formData.conflictOfInterest}
                      onChange={handleChange}
                      options={conflictOptions}
                      placeholder="-- Select --"
                      error={errors.conflictOfInterest}
                    />
                    {errors.conflictOfInterest && (
                      <div className="nrm-form-error">
                        {errors.conflictOfInterest}
                      </div>
                    )}
                  </div>

                  {/* Review Notes */}
                  <div className="nrm-form-group">
                    <label className="nrm-form-label block">Review Notes</label>
                    <textarea
                      name="reviewNotes"
                      placeholder="Additional notes about the review..."
                      value={formData.reviewNotes}
                      onChange={handleChange}
                      rows={3}
                      className="nrm-form-textarea small"
                    />
                  </div>
                </>
              )}

              {/* Remarks */}
              <div className="nrm-form-group">
                <label className="nrm-form-label block">
                  {formData.action === "Rejected" ? "Rejection " : ""}Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Enter your remarks..."
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={4}
                  className="nrm-form-textarea medium"
                />
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div className="nrm-modal-footer">
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                className="nrm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="nrm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="nrm-spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Submit Review
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

export default NominationReviewModal;
