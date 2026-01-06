import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDeptHeadApprovedNominations } from "../../../services/performancemanagement/api/nominationapi";
import Breadcrumb from "../../../components/common/Breadcrumb"; 
import "../../../styles/performancemanagement/hr/TopPerformers.css";

export default function TopPerformers() {
  const navigate = useNavigate();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const deptHeadId = user ? user.empId : null;

  
  const breadcrumbItems = [
    { label: "Top Performers" }
  ];

  useEffect(() => {
    if (!deptHeadId) {
      navigate("/depthead/login");
      return;
    }
    fetchNominations();
  }, [deptHeadId]);

  const fetchNominations = async () => {
    try {
      const response = await getDeptHeadApprovedNominations(deptHeadId);
      if (response.status === 200 && response.data.success) {
        const allNominations = response.data.data.flatMap(group => group.nominations);
        setNominations(allNominations);
      }
    } catch (error) {
      console.error("Error fetching nominations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (e, nomination) => {
    e.stopPropagation();
    setSelectedNomination(nomination);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNomination(null);
  };

  const getInitials = (nominee) => {
    if (!nominee) return "NA";
    const first = nominee.firstName?.[0] || "";
    const last = nominee.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const formatParameterValue = (param) => {
    if (param.parameterType === "Rating") {
      return `⭐ ${param.parameterValue}/5`;
    }
    return param.parameterValue;
  };

  const renderDetailsModal = () => {
    if (!showModal || !selectedNomination) return null;

    return (
      <div className="dtp-modal-backdrop" onClick={handleCloseModal}>
        <div className="dtp-modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dtp-modal-header">
            <h2 className="dtp-modal-title">Nomination Details</h2>
          </div>

          <div className="dtp-modal-body">
            <div className="dtp-detail-row">
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">NOMINEE NAME</label>
                <p className="dtp-detail-value">{selectedNomination.nominee.fullName}</p>
              </div>
              <div className="dtp-detail-col">
                <label className="dtp-detail-label">REWARD TYPE</label>
                <p className="dtp-detail-value">{selectedNomination.rewardType.rewardName}</p>
              </div>
            </div>

            <div className="dtp-detail-row">
            </div>

            <div className="dtp-detail-section">
              <label className="dtp-detail-label">JUSTIFICATION</label>
              <div className="dtp-justification-box">
                {selectedNomination.justification}
              </div>
            </div>

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

          <div className="dtp-modal-footer">
            <button className="dtp-btn-close" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="dtp-page">
      <div className="dtp-container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="dtp-header">
          <h1 className="dtp-page-title">Top Performers</h1>
          <p className="dtp-page-description">
            {nominations.length} Approved Nominations
          </p>
        </div>

        {nominations.length === 0 ? (
          <div className="dtp-empty-state">
            <h3 className="dtp-empty-title">No Approved Nominations</h3>
            <p className="dtp-empty-description">
              There are no approved nominations in your department yet.
            </p>
          </div>
        ) : (
          <div className="dtp-grid">
            {nominations.map((nomination) => (
              <div key={nomination.nominationId} className="dtp-nomination-card">
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

                <div className="dtp-opportunity-box">
                  <p className="dtp-reward-type">
                    {nomination.rewardType.rewardName}
                  </p>
                  <p className="dtp-opportunity-name">
                    {nomination.opportunityName}
                  </p>
                </div>

                <p className="dtp-justification-preview">
                  {nomination.justification}
                </p>

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

      {renderDetailsModal()}
    </div>
  );
}
