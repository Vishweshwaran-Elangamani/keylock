import { useState } from "react";
import nominationService from "../../../services/internal/nominationService";
import { toast } from "sonner";

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

      console.log("Submitting review:", payload);

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
      {/* Custom Backdrop with Blur Effect */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onHide}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog - Large Size */}
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Navy Blue Theme */}
          <div
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-clipboard-check"></i>
              Review Nomination - {isDepartmentHead ? "Department Head" : "Manager"}
            </div>
            <button
              onClick={onHide}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Form - Scrollable Body */}
          <form 
            onSubmit={handleSubmit}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1,
              overflow: 'hidden'
            }}
          >
            {/* Modal Body */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff',
                maxHeight: 'calc(90vh - 140px)'
              }}
            >
              {/* Info Section */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  padding: '1rem',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    <strong style={{ fontWeight: '600' }}>Opportunity:</strong> {nomination.opportunityName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    <strong style={{ fontWeight: '600' }}>Nominee:</strong> {nomination.nomineeName}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: nomination.justification ? '12px' : 0 }}>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    <strong style={{ fontWeight: '600' }}>Nominated By:</strong> {nomination.nominatedByName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    <strong style={{ fontWeight: '600' }}>Type:</strong> {nomination.nominationType}
                  </div>
                </div>
                {nomination.justification && (
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    <strong style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Justification:</strong>
                    <p style={{ 
                      margin: 0, 
                      padding: '8px 12px', 
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      lineHeight: '1.5'
                    }}>
                      {nomination.justification}
                    </p>
                  </div>
                )}
              </div>

              {/* Decision Field */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Decision <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    border: errors.action ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">-- Select Action --</option>
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
                {errors.action && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.action}
                  </div>
                )}
              </div>

              {/* Department Head Approval Fields */}
              {isDepartmentHead && formData.action === "Approved" && (
                <>
                  {/* Merit and Diversity Scores Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                    {/* Merit Score */}
                    <div>
                      <label
                        style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#334155',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Merit Score (0-100) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
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
                        style={{
                          width: '100%',
                          border: errors.meritScore ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      {errors.meritScore && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors.meritScore}
                        </div>
                      )}
                    </div>

                    {/* Diversity Score */}
                    <div>
                      <label
                        style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#334155',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Diversity Score (0-100) <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
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
                        style={{
                          width: '100%',
                          border: errors.diversityScore ? '1px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      {errors.diversityScore && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {errors.diversityScore}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conflict of Interest */}
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Conflict of Interest <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                    </label>
                    <select
                      name="conflictOfInterest"
                      value={formData.conflictOfInterest}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        border: errors.conflictOfInterest ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">-- Select --</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                    {errors.conflictOfInterest && (
                      <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {errors.conflictOfInterest}
                      </div>
                    )}
                  </div>

                  {/* Review Notes */}
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#334155',
                        marginBottom: '6px',
                        display: 'block'
                      }}
                    >
                      Review Notes
                    </label>
                    <textarea
                      name="reviewNotes"
                      placeholder="Additional notes about the review..."
                      value={formData.reviewNotes}
                      onChange={handleChange}
                      rows={3}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        resize: 'vertical',
                        minHeight: '80px',
                        maxHeight: '120px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Remarks */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  {formData.action === "Rejected" ? "Rejection " : ""}Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Enter your remarks..."
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={4}
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    resize: 'vertical',
                    minHeight: '100px',
                    maxHeight: '150px',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              }}
            >
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                style={{
                  background: '#6c757d',
                  borderColor: '#6c757d',
                  color: '#ffffff',
                  fontWeight: '600',
                  padding: '8px 16px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#5a6268';
                    e.target.style.borderColor = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#6c757d';
                    e.target.style.borderColor = '#6c757d';
                  }
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  fontWeight: '600',
                  fontSize: '13px',
                  borderRadius: '6px',
                  transition: 'all 0.12s ease',
                  boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        display: 'inline-block'
                      }}
                    />
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

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default NominationReviewModal;
