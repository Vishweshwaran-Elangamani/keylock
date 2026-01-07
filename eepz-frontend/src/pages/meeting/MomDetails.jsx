import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import "../../styles/mom/components/MomDetails.css";

const PRIMARY = "#27235C";
const RSVP_STATUS = {};

const MomDetails = () => {
  const { momId } = useParams();
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMomDetails(momId);
  }, [momId]);

  const fetchMomDetails = async (id) => {
    setLoading(true);
    try {
      const response = await momService.getMomById(id);
      setMom(response.data);
    } catch (err) {
      toastr.error("Failed to fetch MOM details");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="momd-page momd-center">
        <p className="momd-loading-text">Loading MOM details...</p>
      </div>
    );
  }

  if (!mom) {
    return (
      <div className="momd-page momd-center">
        <p className="momd-loading-text">No MOM information available.</p>
      </div>
    );
  }

  return (
    <div className="momd-page">
      <div className="momd-card">
        <div className="momd-header" style={{ backgroundColor: PRIMARY }}>
          <div className="momd-header-text">
            <h2 className="momd-title">{mom.meetingTitle}</h2>
            <span className="momd-type-badge">{mom.meetingType}</span>
          </div>
        </div>

        <div className="momd-body">
          <div className="momd-section momd-section-top">
            <p className="momd-field">
              <span className="momd-field-label">Meeting Type:</span>
              <span className="momd-field-value">{mom.meetingType}</span>
            </p>
            <p className="momd-field">
              <span className="momd-field-label">Date/Time:</span>
              <span className="momd-field-value">
                {new Date(mom.meetingDate).toLocaleString()}
              </span>
            </p>

            {mom.meetingLink && (
              <p className="momd-field">
                <span className="momd-field-label">Meeting Link:</span>
                <a
                  href={mom.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="momd-link"
                >
                  Join Meeting
                </a>
              </p>
            )}

            <p className="momd-field">
              <span className="momd-field-label">Attendees:</span>
              <span className="momd-field-value">
                {Array.isArray(mom.attendees)
                  ? mom.attendees.join(", ")
                  : mom.attendees || "N/A"}
              </span>
            </p>
          </div>

          <section className="momd-section">
            <h5 className="momd-section-title">Comments / Observations</h5>
            <div className="momd-comments-box">
              {mom.commentsObservations || "No comments recorded."}
            </div>
          </section>

          <section className="momd-section">
            <h5 className="momd-section-title">Discussion Points</h5>
            {mom.discussionPoints && mom.discussionPoints.length > 0 ? (
              <ul className="momd-list">
                {mom.discussionPoints.map((dp, i) => (
                  <li key={i} className="momd-list-item">
                    {dp.point || dp.pointText || ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="momd-muted-text">No discussion points recorded.</p>
            )}
          </section>

          <section className="momd-section">
            <h5 className="momd-section-title">Action Items</h5>
            {mom.actionItems && mom.actionItems.length > 0 ? (
              <ul className="momd-list">
                {mom.actionItems.map((ai) => (
                  <li key={ai.actionItemId} className="momd-list-item">
                    <strong>{ai.task || ai.taskDescription}</strong> - Assigned
                    to: {ai.assignTo || ai.assignedToEmployeeName || "N/A"} -
                    Due:{" "}
                    {ai.dueDate
                      ? new Date(ai.dueDate).toLocaleDateString()
                      : "N/A"}{" "}
                    - Status: {ai.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="momd-muted-text">No action items recorded.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MomDetails;
