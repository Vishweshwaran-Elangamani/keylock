import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";

const PRIMARY = "#27235C"; // primary blue

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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <p>Loading MOM details...</p>
      </div>
    );
  }

  if (!mom) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <p>No MOM information available.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          width: "100%",
          maxWidth: "900px",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        {/* HEADER in primary blue */}
        <div
          className="card-header border-0"
          style={{
            backgroundColor: PRIMARY,
            color: "#ffffff",
            padding: "1.5rem 2rem",
          }}
        >
          <div>
            <h2
              className="fw-bold mb-2"
              style={{ fontSize: "1.5rem", margin: 0 }}
            >
              {mom.meetingTitle}
            </h2>
            <span
              className="badge"
              style={{
                backgroundColor: "#ffffff",
                color: PRIMARY,
                borderRadius: "9999px",
                fontSize: "0.75rem",
                padding: "0.25rem 0.8rem",
              }}
            >
              {mom.meetingType}
            </span>
          </div>
        </div>

        {/* BODY */}
        <div className="card-body" style={{ padding: "1.75rem 2rem 2rem" }}>
          {/* Top info */}
          <div className="mb-4">
            <p className="mb-2">
              <strong>Meeting Type: </strong>
              {mom.meetingType}
            </p>
            <p className="mb-2">
              <strong>Date/Time: </strong>
              {new Date(mom.meetingDate).toLocaleString()}
            </p>

            {mom.meetingLink && (
              <p className="mb-2">
                <strong>Meeting Link: </strong>
                <a
                  href={mom.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Meeting
                </a>
              </p>
            )}

            <p className="mb-2">
              <strong>Attendees: </strong>
              {Array.isArray(mom.attendees)
                ? mom.attendees.join(", ")
                : mom.attendees || "N/A"}
            </p>
          </div>

          {/* Comments / Observations */}
          <section className="mb-4">
            <h5 className="fw-semibold mb-2">Comments / Observations</h5>
            <div className="border rounded p-3 bg-light">
              {mom.commentsObservations || "No comments recorded."}
            </div>
          </section>

          {/* Discussion Points */}
          <section className="mb-4">
            <h5 className="fw-semibold mb-2">Discussion Points</h5>
            {mom.discussionPoints && mom.discussionPoints.length > 0 ? (
              <ul className="mb-0">
                {mom.discussionPoints.map((dp, i) => (
                  <li key={i}>{dp.point || dp.pointText || ""}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mb-0">No discussion points recorded.</p>
            )}
          </section>

          {/* Action Items */}
          <section>
            <h5 className="fw-semibold mb-2">Action Items</h5>
            {mom.actionItems && mom.actionItems.length > 0 ? (
              <ul className="mb-0">
                {mom.actionItems.map((ai) => (
                  <li key={ai.actionItemId}>
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
              <p className="text-muted mb-0">No action items recorded.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MomDetails;
