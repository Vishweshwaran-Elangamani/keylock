import { useState } from "react";
import nominationService from "../../../services/internal/nominationService";
import toastr from "toastr";
import "../../../styles/internal/NominationModal.css";

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
    toastr.error("Please fix the errors");
    return;
  }

  try {
    setLoading(true);

    // Prepare payload based on user role
    let payload;
    
    if (isDepartmentHead) {
      // Department Head review payload
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
      // Manager review payload - FIXED
      payload = {
        actionTaken: formData.action,
        remarks: formData.remarks.trim(), // CHANGED: from 'reviewRemarks' to 'remarks'
      };
    }

    console.log("Submitting review:", payload);

    const response = await nominationService.reviewNomination(
      nomination.nominationId,
      payload,
      userRole
    );

    if (response.success) {
      toastr.success(
        `Nomination ${formData.action.toLowerCase()} successfully!`
      );
      onReviewSubmitted();
      onHide();
    } else {
      toastr.error(response.message || "Failed to submit review");
    }
  } catch (error) {
    console.error("Error:", error);
    toastr.error(error.message || "Failed to submit review");
  } finally {
    setLoading(false);
  }
};


  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom modal-dialog-large">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-clipboard-check"></i>
                Review Nomination - {isDepartmentHead ? "Department Head" : "Manager"}
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onHide}
                disabled={loading}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="info-section">
                  <div className="info-row">
                    <div className="info-item">
                      <strong>Opportunity:</strong> {nomination.opportunityName}
                    </div>
                    <div className="info-item">
                      <strong>Nominee:</strong> {nomination.nomineeName}
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <strong>Nominated By:</strong> {nomination.nominatedByName}
                    </div>
                    <div className="info-item">
                      <strong>Type:</strong> {nomination.nominationType}
                    </div>
                  </div>
                  {nomination.justification && (
                    <div className="info-item full-width">
                      <strong>Justification:</strong>
                      <p className="justification-text">{nomination.justification}</p>
                    </div>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      Decision <span className="required-mark">*</span>
                    </label>
                    <select
                      name="action"
                      className={`form-select-custom ${
                        errors.action ? "is-invalid" : ""
                      }`}
                      value={formData.action}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Action --</option>
                      <option value="Approved">Approve</option>
                      <option value="Rejected">Reject</option>
                    </select>
                    {errors.action && (
                      <div className="error-message">{errors.action}</div>
                    )}
                  </div>

                  {isDepartmentHead && formData.action === "Approved" && (
                    <>
                      <div className="form-group-custom">
                        <label className="form-label-custom">
                          Merit Score (0-100){" "}
                          <span className="required-mark">*</span>
                        </label>
                        <input
                          type="number"
                          name="meritScore"
                          className={`form-input-custom ${
                            errors.meritScore ? "is-invalid" : ""
                          }`}
                          placeholder="Enter merit score"
                          value={formData.meritScore}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        {errors.meritScore && (
                          <div className="error-message">{errors.meritScore}</div>
                        )}
                      </div>

                      <div className="form-group-custom">
                        <label className="form-label-custom">
                          Diversity Score (0-100){" "}
                          <span className="required-mark">*</span>
                        </label>
                        <input
                          type="number"
                          name="diversityScore"
                          className={`form-input-custom ${
                            errors.diversityScore ? "is-invalid" : ""
                          }`}
                          placeholder="Enter diversity score"
                          value={formData.diversityScore}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        {errors.diversityScore && (
                          <div className="error-message">
                            {errors.diversityScore}
                          </div>
                        )}
                      </div>

                      <div className="form-group-custom full-width">
                        <label className="form-label-custom">
                          Conflict of Interest{" "}
                          <span className="required-mark">*</span>
                        </label>
                        <select
                          name="conflictOfInterest"
                          className={`form-select-custom ${
                            errors.conflictOfInterest ? "is-invalid" : ""
                          }`}
                          value={formData.conflictOfInterest}
                          onChange={handleChange}
                        >
                          <option value="">-- Select --</option>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                        {errors.conflictOfInterest && (
                          <div className="error-message">
                            {errors.conflictOfInterest}
                          </div>
                        )}
                      </div>

                      <div className="form-group-custom full-width">
                        <label className="form-label-custom">Review Notes</label>
                        <textarea
                          name="reviewNotes"
                          className="form-textarea-custom"
                          placeholder="Additional notes about the review..."
                          value={formData.reviewNotes}
                          onChange={handleChange}
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group-custom full-width">
                    <label className="form-label-custom">
                      {formData.action === "Rejected" ? "Rejection" : ""} Remarks
                    </label>
                    <textarea
                      name="remarks"
                      className="form-textarea-custom"
                      placeholder="Enter your remarks..."
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={4}
                    />
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
      </div>
    </>
  );
};

export default NominationReviewModal;
