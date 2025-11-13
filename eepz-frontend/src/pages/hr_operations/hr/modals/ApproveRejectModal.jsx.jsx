import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import careerProgressionService from "../../../../services/hr_operations/hr/careerProgressionService";

const ApproveRejectModal = ({
  show,
  promotion,
  onHide,
  onPromotionApproved,
}) => {
  const [actionType, setActionType] = useState("approve"); // "approve" or "reject"
  const [formData, setFormData] = useState({
    notes: "",
    rejectionReason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = parseInt(localStorage.getItem("userId"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (actionType === "approve") {
        //  APPROVE
        if (!formData.notes.trim()) {
          setError("Please add approval notes");
          setLoading(false);
          return;
        }

        console.log(" Approving promotion...");
        await careerProgressionService.approvePromotion({
          promotionId: promotion.promotionId,
          approvedByUserId: currentUserId,
          notes: formData.notes,
        });

        console.log(" Promotion approved successfully");
      } else {
        //  REJECT
        if (!formData.rejectionReason.trim()) {
          setError("Please provide reason for rejection");
          setLoading(false);
          return;
        }

        console.log(" Rejecting promotion...");
        await careerProgressionService.rejectPromotion({
          promotionId: promotion.promotionId,
          rejectedByUserId: currentUserId,
          rejectionReason: formData.rejectionReason,
        });

        console.log(" Promotion rejected successfully");
      }

      onPromotionApproved();
    } catch (err) {
      console.error(" Error:", err);
      setError(err.message || "Failed to process promotion");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      notes: "",
      rejectionReason: "",
    });
    setActionType("approve");
    setError(null);
    onHide();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          {actionType === "approve" ? (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Approve Promotion
            </>
          ) : (
            <>
              <i className="bi bi-x-circle me-2"></i>
              Reject Promotion
            </>
          )}
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

          {/*  PROMOTION DETAILS */}
          <div className="promo-approval-info">
            <div className="promo-info-card">
              <label>Employee:</label>
              <span>{promotion.employeeEmail || "Unknown"}</span>
            </div>
            <div className="promo-info-card">
              <label>Department:</label>
              <span>{promotion.departmentName || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Current Role:</label>
              <span>{promotion.oldRole || "N/A"}</span>
            </div>
            <div className="promo-info-card">
              <label>Promoted To:</label>
              <span className="promo-new-role-highlight">
                {promotion.newRole || "N/A"}
              </span>
            </div>
          </div>

          {/*  ACTION SELECTION TABS */}
          <div style={{ marginBottom: "20px" }}>
            <div className="promo-filters" style={{ gap: "8px" }}>
              <button
                type="button"
                className={`promo-filter-btn ${
                  actionType === "approve" ? "active" : ""
                }`}
                onClick={() => {
                  setActionType("approve");
                  setFormData({ notes: "", rejectionReason: "" });
                  setError(null);
                }}
                style={{
                  flex: 1,
                  background: actionType === "approve" ? "#10b981" : "#ffffff",
                  color: actionType === "approve" ? "#ffffff" : "#475569",
                  borderColor: actionType === "approve" ? "#10b981" : "#cbd5e1",
                }}
              >
                <i className="bi bi-check-circle me-2"></i>
                Approve
              </button>
              <button
                type="button"
                className={`promo-filter-btn ${
                  actionType === "reject" ? "active" : ""
                }`}
                onClick={() => {
                  setActionType("reject");
                  setFormData({ notes: "", rejectionReason: "" });
                  setError(null);
                }}
                style={{
                  flex: 1,
                  background: actionType === "reject" ? "#ef4444" : "#ffffff",
                  color: actionType === "reject" ? "#ffffff" : "#475569",
                  borderColor: actionType === "reject" ? "#ef4444" : "#cbd5e1",
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Reject
              </button>
            </div>
          </div>

          {/*  PROMOTION DETAILS SECTION */}
          <div className="promo-details-section">
            <h6 className="promo-details-heading">Promotion Information</h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Created On:</label>
                <span>{formatDate(promotion.createdAt)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Effective Date:</label>
                <span>{formatDate(promotion.promotionDate)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Status:</label>
                <span className="promo-status-badge promo-status-pending">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/*  JUSTIFICATION SECTION */}
          {promotion.justification && (
            <div className="promo-details-section">
              <h6 className="promo-details-heading">Manager's Justification</h6>
              <div className="promo-justification-box">
                <p>{promotion.justification}</p>
              </div>
            </div>
          )}

          {/*  APPROVE FORM */}
          {actionType === "approve" && (
            <div className="mb-3">
              <label htmlFor="notes" className="form-label">
                Approval Notes <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control promo-textarea-full"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add approval notes... (e.g., Fairness verified, employee deserves promotion)"
                rows="5"
                required={actionType === "approve"}
              />
              <small className="form-text text-muted">
                Document your fairness review decision and approval rationale.
              </small>
            </div>
          )}

          {/*  REJECT FORM */}
          {actionType === "reject" && (
            <div className="mb-3">
              <label htmlFor="rejectionReason" className="form-label">
                Reason for Rejection <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control promo-textarea-full"
                id="rejectionReason"
                name="rejectionReason"
                value={formData.rejectionReason}
                onChange={handleChange}
                placeholder="Provide clear reason for rejection... (e.g., Favoritism pattern detected, not ready for promotion, etc.)"
                rows="5"
                required={actionType === "reject"}
              />
              <small className="form-text text-muted">
                The employee and manager will see this reason.
              </small>
            </div>
          )}

          {/*  INFO ALERT */}
          <div
            className="alert alert-info"
            role="alert"
            style={{ marginTop: "16px" }}
          >
            <i className="bi bi-info-circle me-2"></i>
            {actionType === "approve" ? (
              <>
                <strong> Approval Process:</strong>
                <br />
                Once approved, HR will update salary details and submit to
                Leadership.
              </>
            ) : (
              <>
                <strong> Rejection Process:</strong>
                <br />
                The rejection reason will be sent to Manager and Employee. They
                can resubmit with improvements.
              </>
            )}
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
            style={{
              background:
                actionType === "approve"
                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Processing...
              </>
            ) : actionType === "approve" ? (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Approve Promotion
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Reject Promotion
              </>
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ApproveRejectModal;
