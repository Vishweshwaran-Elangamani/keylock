import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";

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
    return <p>Loading MOM details...</p>;
  }
  if (!mom) {
    return <p>No MOM information available.</p>;
  }

  return (
    <div className="mom-details">
      <h2>{mom.meetingTitle}</h2>
      <p>
        <strong>Meeting Type:</strong> {mom.meetingType}
      </p>
      <p>
        <strong>Date/Time:</strong> {new Date(mom.meetingDate).toLocaleString()}
      </p>

      {mom.meetingLink && (
        <p>
          Meeting Link:{" "}
          <a href={mom.meetingLink} target="_blank" rel="noopener noreferrer">
            Join Meeting
          </a>
        </p>
      )}

      <p>
        <strong>Attendees:</strong> {mom.attendees?.join(", ")}
      </p>

      <section>
        <h3>Comments/Observations</h3>
        <p>{mom.commentsObservations}</p>
      </section>

      <section>
        <h3>Discussion Points</h3>
        <ul>
          {mom.discussionPoints?.map((dp, i) => (
            <li key={i}>{dp.point}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Action Items</h3>
        <ul>
          {mom.actionItems?.map((ai) => (
            <li key={ai.actionItemId}>
              <strong>{ai.task}</strong> - Assigned to: {ai.assignTo} - Due:{" "}
              {new Date(ai.dueDate).toLocaleDateString()} - Status: {ai.status}
            </li>
          ))}
        </ul>
      </section>

      
    </div>
  );
};

export default MomDetails;
