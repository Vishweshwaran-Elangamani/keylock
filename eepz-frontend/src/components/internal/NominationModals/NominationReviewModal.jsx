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
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39, 35, 92, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
          transition: "all 0.3s ease",
        }}
        onClick={onHide}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "800px",
          maxHeight: "75vh",
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER - Fixed */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-clipboard-check"></i>
              Review Nomination - {isDepartmentHead ? "Department Head" : "Manager"}
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY - Scrollable */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                background: "#fff",
                textAlign: "left",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* Info Section - Rearranged Layout */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "#f9fafb",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: nomination.justification ? "16px" : 0,
                  }}
                >
                  {/* LEFT COLUMN */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Opportunity */}
                    <div style={{ textAlign: "left" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          fontWeight: 600,
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Opportunity:
                      </label>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {nomination.opportunityName}
                      </p>
                    </div>

                    {/* Nominated By */}
                    <div style={{ textAlign: "left" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          fontWeight: 600,
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Nominated By:
                      </label>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {nomination.nominatedByName}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Nominee */}
                    <div style={{ textAlign: "left" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          fontWeight: 600,
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Nominee:
                      </label>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {nomination.nomineeName}
                      </p>
                    </div>

                    {/* Type */}
                    <div style={{ textAlign: "left" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          fontWeight: 600,
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Type:
                      </label>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {nomination.nominationType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Justification - Full Width */}
                {nomination.justification && (
                  <div style={{ textAlign: "left" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Justification:
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "8px 12px",
                        backgroundColor: "#ffffff",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                        lineHeight: "1.5",
                        fontSize: "13px",
                        color: "#374151",
                        textAlign: "center",
                      }}
                    >
                      {nomination.justification}
                    </p>
                  </div>
                )}
              </div>

              {/* Decision Field with Blue Color */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Decision <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    border: errors.action ? "1px solid #ef4444" : "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: formData.action ? "#27235C" : "#6c757d",
                    fontWeight: formData.action ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  <option value="">-- Select Action --</option>
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
                {errors.action && (
                  <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                    {errors.action}
                  </div>
                )}
              </div>

              {/* Department Head Approval Fields */}
              {isDepartmentHead && formData.action === "Approved" && (
                <>
                  {/* Merit and Diversity Scores Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 20,
                      marginBottom: 16,
                    }}
                  >
                    {/* Merit Score */}
                    <div>
                      <label
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Merit Score (0-100){" "}
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
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
                          width: "100%",
                          border: errors.meritScore
                            ? "1px solid #ef4444"
                            : "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "8px 10px",
                          fontSize: 13,
                          background: "#fff",
                          color: "#22223b",
                        }}
                      />
                      {errors.meritScore && (
                        <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                          {errors.meritScore}
                        </div>
                      )}
                    </div>

                    {/* Diversity Score */}
                    <div>
                      <label
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Diversity Score (0-100){" "}
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
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
                          width: "100%",
                          border: errors.diversityScore
                            ? "1px solid #ef4444"
                            : "1px solid #cbd5e1",
                          borderRadius: 6,
                          padding: "8px 10px",
                          fontSize: 13,
                          background: "#fff",
                          color: "#22223b",
                        }}
                      />
                      {errors.diversityScore && (
                        <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                          {errors.diversityScore}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conflict of Interest */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Conflict of Interest{" "}
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <select
                      name="conflictOfInterest"
                      value={formData.conflictOfInterest}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        border: errors.conflictOfInterest
                          ? "1px solid #ef4444"
                          : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: formData.conflictOfInterest ? "#27235C" : "#6c757d",
                        fontWeight: formData.conflictOfInterest ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      <option value="">-- Select --</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                    {errors.conflictOfInterest && (
                      <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
                        {errors.conflictOfInterest}
                      </div>
                    )}
                  </div>

                  {/* Review Notes */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 6,
                        display: "block",
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
                        width: "100%",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        resize: "vertical",
                        minHeight: 80,
                        maxHeight: 120,
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                      }}
                    />
                  </div>
                </>
              )}

              {/* Remarks */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#334155",
                    marginBottom: 6,
                    display: "block",
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
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#fff",
                    color: "#22223b",
                    resize: "vertical",
                    minHeight: 100,
                    maxHeight: 150,
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                />
              </div>
            </div>

            {/* FOOTER - Fixed */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                borderBottomLeftRadius: "0.5rem",
                borderBottomRightRadius: "0.5rem",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                style={{
                  background: "#6c757d",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#6c757d";
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 12px",
                  fontSize: 12,
                  borderRadius: 5,
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.opacity = 0.93;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.opacity = 1;
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Submitting...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
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
