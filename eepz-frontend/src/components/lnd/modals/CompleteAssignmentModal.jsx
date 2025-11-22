import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { lndService } from "../../../services/lnd/lndService";
import { RATING } from "../../../constants/lnd/lndConstants";
import { toast } from "sonner";

const CompleteAssignmentModal = ({ assignment, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!notes.trim()) {
      toast.error("Please provide completion notes");
      return;
    }

    try {
      setLoading(true);

      const data = {
        assignmentId: assignment.assignmentId,
        newRating: rating,
        notes: notes,
      };

      const response = await lndService.completeAssignment(data);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || "Failed to complete assignment");
      }
    } catch (error) {
      console.error("Failed to complete assignment:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "Needs Improvement";
    if (rating < RATING.MIN_SME) return "Competent";
    return "Expert (SME Eligible)";
  };

  const getRatingColor = (rating) => {
    if (rating < RATING.MIN_REQUEST_SME) return "#dc3545";
    if (rating < RATING.MIN_SME) return "#0d6efd";
    return "#198754";
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflow: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              background: "rgb(39, 35, 92)",
              alignItems: "center",
            }}
          >
            <h5 style={{ margin: 0, fontWeight: "600", color: "white" }}>
              Complete Assignment
            </h5>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "red";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "white";
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem" }}>
              {/* Assignment Info */}
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  border: "1px solid rgba(39, 35, 92, 0.66)",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6c757d",
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  Employee
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#212529",
                    margin: 0,
                    marginBottom: "0.75rem",
                  }}
                >
                  {assignment.menteeName}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6c757d",
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  Skill
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#212529",
                    margin: 0,
                    marginBottom: "0.75rem",
                  }}
                >
                  {assignment.skillName}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6c757d",
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  SME
                </p>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: "500",
                    color: "#212529",
                    margin: 0,
                  }}
                >
                  {assignment.smeName}
                </p>
              </div>

              {/* Info Alert */}
              <div
                style={{
                  padding: "1rem",
                  background: "#d1fae5",
                  border: "1px solid #198754",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                <CheckCircle
                  size={20}
                  color="#198754"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#065f46",
                      margin: 0,
                      marginBottom: "0.25rem",
                      fontWeight: "600",
                    }}
                  >
                    SME Acknowledged
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "#065f46",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    The SME has reviewed and acknowledged the completion. Set
                    the new skill rating and complete the assignment.
                  </p>
                </div>
              </div>

              {/* SME's Completion Notes */}
              {assignment.completionNotes && (
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#212529",
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    SME's Notes
                  </label>
                  <div
                    style={{
                      padding: "0.75rem",
                      border: "1px solid rgba(39, 35, 92, 0.66)",
                      borderRadius: "8px",
                      background: "#f8f9fa",
                      fontSize: "0.875rem",
                      color: "#212529",
                    }}
                  >
                    {assignment.completionNotes}
                  </div>
                </div>
              )}

              {/* New Rating Buttons */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#212529",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  New Skill Rating <span style={{ color: "#dc3545" }}>*</span>:{" "}
                  <span
                    style={{ color: getRatingColor(rating), fontWeight: "700" }}
                  >
                    {rating}/10
                  </span>
                </label>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {[...Array(10)].map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setRating(value)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border:
                            rating === value
                              ? `2px solid ${getRatingColor(value)}`
                              : "1px solid #ccc",
                          backgroundColor:
                            rating === value
                              ? getRatingColor(value)
                              : "#f8f9fa",
                          color: rating === value ? "#fff" : "#212529",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: "0.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    color: getRatingColor(rating),
                  }}
                >
                  {getRatingLabel(rating)}
                </div>
              </div>

              {/* Manager's Completion Notes */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#212529",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Your Notes <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your feedback and comments on the employee's progress..."
                  rows={4}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid rgba(39, 35, 92, 0.66)",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#97247E";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(151, 36, 126, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "0.625rem 1.25rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!notes.trim() || loading}
                style={{
                  padding: "0.625rem 1.25rem",
                  border: "none",
                  borderRadius: "8px",
                  background: notes.trim() && !loading ? "#198754" : "#e5e7eb",
                  color: notes.trim() && !loading ? "#fff" : "#6c757d",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: notes.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Complete Assignment
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

export default CompleteAssignmentModal;
