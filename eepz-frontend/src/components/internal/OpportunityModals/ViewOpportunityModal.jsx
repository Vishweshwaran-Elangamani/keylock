import "../../../styles/internal/ViewOpportunityModal.css";
const ViewOpportunityModal = ({ show, opportunity, onClose }) => {
  if (!show || !opportunity) return null;
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
      case "closed":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
      case "pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
    }
  };
  const statusColors = getStatusColor(opportunity.status);
  return (
    <>
      <div className="vom-backdrop" onClick={onClose} />
      <div className="vom-modal-wrapper">
        <div className="vom-modal-dialog">
          {/* HEADER - Fixed */}
          <div className="vom-modal-header">
            <div className="vom-header-title">
              <i className="bi bi-eye"></i>
              Opportunity Details
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="vom-close-btn"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {/* BODY - Scrollable */}
          <div className="vom-modal-body">
            {/* Opportunity Name & Status */}
            <div className="vom-title-section">
              <div className="vom-title-content">
                <h4 className="vom-title">{opportunity.opportunityName}</h4>
                <div className="vom-department">
                  <i className="bi bi-building"></i>
                  {opportunity.departmentName || "N/A"}
                </div>
              </div>
              <span
                className="vom-status-badge"
                style={{
                  background: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                }}
              >
                {opportunity.status || "Pending"}
              </span>
            </div>
            {/* Key Info Grid */}
            <div className="vom-info-box">
              <div className="vom-info-grid">
                <div>
                  <span className="vom-info-item-label">Posted By</span>
                  <div className="vom-info-item-value">
                    <i className="bi bi-person-circle"></i>
                    {opportunity.postedByName || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="vom-info-item-label">Deadline</span>
                  <div className="vom-info-item-value">
                    <i className="bi bi-calendar-event"></i>
                    {formatDate(opportunity.deadline)}
                  </div>
                </div>
                <div>
                  <span className="vom-info-item-label">Created Date</span>
                  <div className="vom-info-item-value">
                    <i className="bi bi-clock-history"></i>
                    {formatDate(opportunity.createdAt)}
                  </div>
                </div>
                {opportunity.updatedAt && (
                  <div>
                    <span className="vom-info-item-label">Last Updated</span>
                    <div className="vom-info-item-value">
                      <i className="bi bi-arrow-clockwise"></i>
                      {formatDate(opportunity.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Description */}
            <div className="vom-section">
              <h6 className="vom-section-title">
                <i className="bi bi-file-text"></i>
                Description
              </h6>
              <div className="vom-section-content">
                {opportunity.description || "No description provided."}
              </div>
            </div>
            {/* Requirements */}
            <div className="vom-section">
              <h6 className="vom-section-title">
                <i className="bi bi-list-check"></i>
                Requirements
              </h6>
              <div className="vom-section-content">
                {opportunity.requirements || "No specific requirements listed."}
              </div>
            </div>
            {/* Info Box */}
            <div className="vom-info-alert">
              <i className="bi bi-info-circle-fill vom-info-alert-icon"></i>
              <div>
                <strong className="vom-info-alert-title">Note</strong>
                <p className="vom-info-alert-text">
                  Interested candidates can submit their nominations before the
                  deadline. Please ensure you meet all the requirements before
                  applying.
                </p>
              </div>
            </div>
          </div>
          {/* FOOTER - Fixed */}
          <div className="vom-modal-footer">
            <button type="button" onClick={onClose} className="vom-btn-close">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default ViewOpportunityModal;
