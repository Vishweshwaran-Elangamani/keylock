import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import careerProgressionService from "../../../services/hr_operations/hr/careerProgressionService";

const FairnessCheckModal = ({
  show,
  promotion,
  onHide,
  onFairnessReviewed,
}) => {
  const [fairnessData, setFairnessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && promotion) {
      checkFairness();
    }
  }, [show, promotion]);

  const checkFairness = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(" Checking fairness for PromotionId:", promotion.promotionId);
      const response = await careerProgressionService.checkFavoritismHistory(
        promotion.promotionId
      );
      console.log(" Fairness check response:", response.data);
      setFairnessData(response.data);
    } catch (err) {
      console.error(" Error checking fairness:", err);
      setError(err.message || "Failed to check fairness");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFairnessData(null);
    setError(null);
    onHide();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "promo-status-approved";
      case "rejected":
        return "promo-status-rejected";
      case "pending":
        return "promo-status-pending";
      default:
        return "promo-status-pending";
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-shield-check me-2"></i>
          Fairness Review - Check for Favoritism Pattern
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="promo-modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Analyzing fairness pattern...</p>
          </div>
        ) : fairnessData ? (
          <div className="promo-details-container">
            {/*  ALERT: Favoritism Detection */}
            {fairnessData.isFavoritism ? (
              <div
                className="alert alert-warning"
                role="alert"
                style={{ borderLeft: "4px solid #f59e0b" }}
              >
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>
                  {" "}
                  FAIRNESS ALERT - POTENTIAL FAVORITISM PATTERN DETECTED!
                </strong>
                <br />
                This manager has nominated the same employee{" "}
                <strong>
                  {fairnessData.previousNominationCount} times before
                </strong>
                .
              </div>
            ) : (
              <div
                className="alert alert-success"
                role="alert"
                style={{ borderLeft: "4px solid #10b981" }}
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                <strong> FAIR - No favoritism pattern detected!</strong>
                <br />
                This is the first nomination from this manager to this employee.
              </div>
            )}

            {/* Current Promotion Details */}
            <div className="promo-details-section">
              <h6 className="promo-details-heading">Current Nomination</h6>
              <div className="promo-details-grid">
                <div className="promo-detail-item">
                  <label>PromotionId:</label>
                  <span>{fairnessData.promotionId}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Position:</label>
                  <span className="promo-new-role-highlight">
                    {promotion.newRole || "N/A"}
                  </span>
                </div>
                <div className="promo-detail-item">
                  <label>Employee:</label>
                  <span>{fairnessData.employeeName}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Manager:</label>
                  <span>{fairnessData.managerName}</span>
                </div>
              </div>
            </div>

            {/* Manager & Employee Info */}
            <div className="promo-details-section">
              <h6 className="promo-details-heading">People Involved</h6>
              <div className="promo-details-grid">
                <div className="promo-detail-item">
                  <label>Manager Name:</label>
                  <span>{fairnessData.managerName}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Manager Email:</label>
                  <span>{fairnessData.managerEmail}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Employee Name:</label>
                  <span>{fairnessData.employeeName}</span>
                </div>
                <div className="promo-detail-item">
                  <label>Employee Email:</label>
                  <span>{fairnessData.employeeEmail}</span>
                </div>
              </div>
            </div>

            {/* Previous Nominations History */}
            {fairnessData.previousNominationCount > 0 && (
              <div className="promo-details-section">
                <h6 className="promo-details-heading">
                  Previous Nomination History (
                  {fairnessData.previousNominationCount})
                </h6>
                <div style={{ overflowX: "auto" }}>
                  <table
                    className="promo-table"
                    style={{ marginBottom: 0, fontSize: "13px" }}
                  >
                    <thead>
                      <tr>
                        <th>PromotionId</th>
                        <th>Nominated On</th>
                        <th>Status</th>
                        <th>Approved By</th>
                        <th>Reason (if rejected)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fairnessData.previousNominations.map(
                        (nomination, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{nomination.previousPromotionId}</strong>
                            </td>
                            <td>{formatDate(nomination.nominationDate)}</td>
                            <td>
                              <span
                                className={`promo-status-badge ${getStatusBadgeClass(
                                  nomination.status
                                )}`}
                              >
                                {nomination.status}
                              </span>
                            </td>
                            <td>{nomination.approvedByEmail || "Pending"}</td>
                            <td style={{ color: "#991b1b", fontSize: "12px" }}>
                              {nomination.rejectionReason || "-"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fairness Analysis Summary */}
            <div className="promo-details-section">
              <h6 className="promo-details-heading"> Fairness Analysis</h6>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc" }}>
                <p style={{ marginBottom: "12px", fontSize: "13px" }}>
                  <strong>Total Previous Nominations:</strong>{" "}
                  {fairnessData.previousNominationCount}
                </p>
                {fairnessData.previousNominations.length > 0 && (
                  <>
                    <p style={{ marginBottom: "12px", fontSize: "13px" }}>
                      <strong>Approved Count:</strong>{" "}
                      {
                        fairnessData.previousNominations.filter(
                          (n) => n.status === "Approved"
                        ).length
                      }
                    </p>
                    <p style={{ marginBottom: "12px", fontSize: "13px" }}>
                      <strong>Rejected Count:</strong>{" "}
                      {
                        fairnessData.previousNominations.filter(
                          (n) => n.status === "Rejected"
                        ).length
                      }
                    </p>
                  </>
                )}

                <hr style={{ margin: "12px 0" }} />

                {fairnessData.isFavoritism ? (
                  <div style={{ color: "#991b1b" }}>
                    <strong> Pattern Analysis:</strong>
                    <p style={{ marginTop: "8px", fontSize: "12px" }}>
                      Manager {fairnessData.managerName} has nominated employee{" "}
                      {fairnessData.employeeName} multiple times. Review the
                      pattern above to ensure fairness. Consider if this is
                      justified development path or potential favoritism.
                    </p>
                  </div>
                ) : (
                  <div style={{ color: "#166534" }}>
                    <strong> First Nomination:</strong>
                    <p style={{ marginTop: "8px", fontSize: "12px" }}>
                      This is the first time manager {fairnessData.managerName}{" "}
                      has nominated employee {fairnessData.employeeName}. No
                      fairness concerns detected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Decision Guide */}
            <div
              className="alert alert-info"
              role="alert"
              style={{ marginTop: "16px" }}
            >
              <i className="bi bi-info-circle me-2"></i>
              <strong>Decision Guide:</strong>
              <ul
                style={{ marginTop: "8px", marginBottom: 0, fontSize: "12px" }}
              >
                <li>Review the nomination details and previous history</li>
                <li>
                  {fairnessData.isFavoritism
                    ? "Consider if repeated nominations are justified or indicate favoritism"
                    : "No previous nominations - proceed with standard approval process"}
                </li>
                <li>
                  Make fair decision: Approve if qualified, Reject if concerns
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </Modal.Body>

      <Modal.Footer className="promo-modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
        >
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onFairnessReviewed();
            handleClose();
          }}
        >
          <i className="bi bi-check-circle me-2"></i>
          Understood - Proceed with Decision
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default FairnessCheckModal;
