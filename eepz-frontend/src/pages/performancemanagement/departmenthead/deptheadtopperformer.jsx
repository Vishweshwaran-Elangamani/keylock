/**
 * TopPerformers Component
 * 
 * Department Head Dashboard for viewing approved top performer nominations.
 * Features:
 * - Grid view of all approved nominations
 * - Employee cards with nominee details
 * - Modal view for full nomination details
 * - Reward type and justification display
 * - Parameter values visualization
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDeptHeadApprovedNominations } from "../../../services/performancemanagement/hr/api";
import "../../../styles/performancemanagement/hr/TopPerformers.css";

export default function TopPerformers() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const deptHeadId = user ? user.empId : null;

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch nominations on mount
   * Redirects to login if deptHeadId is not found
   */
  useEffect(() => {
    if (!deptHeadId) {
      navigate("/depthead/login");
      return;
    }
    fetchNominations();
  }, [deptHeadId]);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches approved nominations for the department head
   */
  const fetchNominations = async () => {
    try {
      const response = await getDeptHeadApprovedNominations(deptHeadId);
      if (response.status === 200 && response.data.success) {
        // Flatten all nominations from grouped data
        const allNominations = response.data.data.flatMap(group => group.nominations);
        setNominations(allNominations);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // MODAL HANDLERS
  // ========================

  /**
   * Opens details modal for selected nomination
   * @param {Event} e - Click event
   * @param {Object} nomination - Selected nomination object
   */
  const handleViewDetails = (e, nomination) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedNomination(nomination);
    setShowModal(true);
  };

  /**
   * Closes the details modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNomination(null);
  };

  // ========================
  // UI HELPER FUNCTIONS
  // ========================

  /**
   * Generates initials from first and last name
   * @param {Object} nominee - Nominee object with firstName and lastName
   * @returns {string} Initials
   */
  const getInitials = (nominee) => {
    if (!nominee) return "NA";
    const first = nominee.firstName?.[0] || "";
    const last = nominee.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  /**
   * Formats parameter value based on type
   * @param {Object} param - Parameter object
   * @returns {string} Formatted value
   */
  const formatParameterValue = (param) => {
    if (param.parameterType === "Rating") {
      return `⭐ ${param.parameterValue}/5`;
    }
    return param.parameterValue;
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  /**
   * Renders the details modal
   */
  const renderDetailsModal = () => {
    if (!showModal || !selectedNomination) return null;

    return (
      <div className="dtp-modal-backdrop" onClick={handleCloseModal}>
        <div className="dtp-modal-dialog" onClick={(e) => e.stopPropagation()}>
          
          {/* Modal Header */}
          <div className="dtp-modal-header">
            <h2 className="dtp-modal-title">Nomination Details</h2>
          </div>

          {/* Modal Body */}
          <div className="dtp-modal-body">
            
            {/* Row 1: Name & Employee ID */}
            <div className="dtp-detail-row">
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">NOMINEE NAME</label>
                <p className="dtp-detail-value">{selectedNomination.nominee.fullName}</p>
              </div>
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">EMPLOYEE ID</label>
                <p className="dtp-detail-value">{selectedNomination.nominee.employeeId}</p>
              </div>
            </div>

            {/* Row 2: Department & Reward Type */}
            <div className="dtp-detail-row">
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">DEPARTMENT</label>
                <p className="dtp-detail-value">
                  {selectedNomination.nominee.department || "N/A"}
                </p>
              </div>
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">REWARD TYPE</label>
                <p className="dtp-detail-value">{selectedNomination.rewardType.rewardName}</p>
              </div>
            </div>

            {/* Justification */}
            <div className="dtp-detail-section">
              <label className="dtp-detail-label">JUSTIFICATION</label>
              <div className="dtp-justification-box">
                {selectedNomination.justification}
              </div>
            </div>

            {/* Parameters */}
            {selectedNomination.parameterValues && selectedNomination.parameterValues.length > 0 && (
              <div className="dtp-detail-section">
                <label className="dtp-detail-label">NOMINATION PARAMETERS</label>
                {selectedNomination.parameterValues.map((param, idx) => (
                  <div key={idx} className="dtp-parameter-card">
                    <div className="dtp-parameter-info">
                      <p className="dtp-parameter-name">{param.parameterName}</p>
                      <p className="dtp-parameter-type">{param.parameterType}</p>
                    </div>
                    <div className="dtp-parameter-value">
                      {formatParameterValue(param)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="dtp-modal-footer">
            <button className="dtp-btn-close" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================
  // MAIN RENDER - LOADING STATE
  // ========================

  if (loading) {
    return (
      <div className="dtp-loading-container">
        <div className="dtp-loading-content">
          <div className="spinner-border"></div>
          <p className="dtp-loading-text">Loading nominations...</p>
        </div>
      </div>
    );
  }

  // ========================
  // MAIN RENDER - PAGE CONTENT
  // ========================

  return (
    <div className="dtp-page">
      <div className="dtp-container">
        
        {/* Header Section */}
        <div className="dtp-header">
          {/* <button className="dtp-btn-back" onClick={() => navigate("/depthead/homes")}>
            <i className="bi bi-arrow-left"></i>
            Back to Home
          </button> */}
          <h1 className="dtp-page-title">Top Performers</h1>
          <p className="dtp-page-description">
            {nominations.length} Approved Nominations
          </p>
        </div>

        {/* Empty State */}
        {nominations.length === 0 ? (
          <div className="dtp-empty-state">
            <div className="dtp-empty-icon">📭</div>
            <h3 className="dtp-empty-title">No Approved Nominations</h3>
            <p className="dtp-empty-description">
              There are no approved nominations in your department yet.
            </p>
          </div>
        ) : (
          /* Nominations Grid */
          <div className="dtp-grid">
            {nominations.map((nomination) => (
              <div key={nomination.nominationId} className="dtp-nomination-card">
                
                {/* Employee Info */}
                <div className="dtp-employee-section">
                  <div className="dtp-avatar">
                    {getInitials(nomination.nominee)}
                  </div>
                  <h3 className="dtp-employee-name">
                    {nomination.nominee.fullName}
                  </h3>
                  <p className="dtp-employee-email">
                    {nomination.nominee.email}
                  </p>
                </div>

                {/* Opportunity Info */}
                <div className="dtp-opportunity-box">
                  <p className="dtp-reward-type">
                    {nomination.rewardType.rewardName}
                  </p>
                  <p className="dtp-opportunity-name">
                    {nomination.opportunityName}
                  </p>
                </div>

                {/* Justification Preview */}
                <p className="dtp-justification-preview">
                  {nomination.justification}
                </p>

                {/* View Details Button */}
                <button
                  className="dtp-btn-view"
                  onClick={(e) => handleViewDetails(e, nomination)}
                >
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {renderDetailsModal()}
    </div>
  );
}
