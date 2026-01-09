import React from "react";
import { Modal } from "react-bootstrap";
import "../../../styles/hr_operations/hr/PromotionDetailsModal.css";
const PromotionDetailsModal = ({ show, promotion, onHide }) => {
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Not Set";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "promo-status-approved";
      case "pending":
        return "promo-status-pending";
      case "rejected":
        return "promo-status-rejected";
      default:
        return "promo-status-pending";
    }
  };
  return (
    <Modal show={show} onHide={onHide} size="lg" className="promo-modal">
      <Modal.Header closeButton className="promo-modal-header">
        <Modal.Title>
          <i className="bi bi-eye"></i>
          Promotion Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="promo-modal-body">
        <div className="promo-details-container">
          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-person"></i>
              Employee Information
            </h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Employee:</label>
                <span>
                  {promotion?.employeeFullName ||
                    promotion?.employeeEmail ||
                    "Unknown"}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Department:</label>
                <span>{promotion?.departmentName || "N/A"}</span>
              </div>
            </div>
          </div>
          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-briefcase"></i>
              Role Change
            </h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Current Role:</label>
                <span>{promotion?.oldRole || "N/A"}</span>
              </div>
              <div className="promo-detail-item">
                <label>Promoted To:</label>
                <span className="promo-new-role-highlight">
                  {promotion?.newRole || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-cash-coin"></i>
              Salary Information
            </h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Current Salary:</label>
                <span>{formatCurrency(promotion?.oldSalary)}</span>
              </div>
              <div className="promo-detail-item">
                <label>New Salary:</label>
                <span className="promo-new-salary-highlight">
                  {formatCurrency(promotion?.newSalary)}
                </span>
              </div>
              {promotion?.incrementPercentage &&
                promotion?.incrementPercentage > 0 && (
                  <div className="promo-detail-item">
                    <label>Increment:</label>
                    <span className="promo-increment-badge">
                      +{promotion?.incrementPercentage?.toFixed(2)}%
                    </span>
                  </div>
                )}
            </div>
          </div>
          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-calendar"></i>
              Promotion Details
            </h6>
            <div className="promo-details-grid">
              <div className="promo-detail-item">
                <label>Effective Date:</label>
                <span>{formatDate(promotion?.promotionDate)}</span>
              </div>
              <div className="promo-detail-item">
                <label>Status:</label>
                <span
                  className={`promo-status-badge ${getStatusBadgeClass(
                    promotion?.status
                  )}`}
                >
                  {promotion?.status || "Unknown"}
                </span>
              </div>
              <div className="promo-detail-item">
                <label>Created On:</label>
                <span>{formatDate(promotion?.createdAt)}</span>
              </div>
              {promotion?.approvedAt && (
                <div className="promo-detail-item">
                  <label>Approved On:</label>
                  <span>{formatDate(promotion?.approvedAt)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="promo-details-section">
            <h6 className="promo-details-heading">
              <i className="bi bi-file-text"></i>
              Justification
            </h6>
            <div className="promo-justification-box">
              <p>{promotion?.justification || "No justification provided"}</p>
            </div>
          </div>
          {promotion?.approvedByEmail && (
            <div className="promo-details-section">
              <h6 className="promo-details-heading">
                <i className="bi bi-check-circle"></i>
                Approval Information
              </h6>
              <div className="promo-details-grid">
                <div className="promo-detail-item">
                  <label>Approved By:</label>
                  <span>{promotion?.approvedByEmail}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="promo-modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};
export default PromotionDetailsModal;
