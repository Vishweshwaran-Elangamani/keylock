import { Modal, Spinner } from "react-bootstrap";
import "../../../styles/hr_operations/hr/careerGoals.css";

const GoalSuggestionsModal = ({ 
  show, 
  onHide, 
  goalSuggestions, 
  loadingSuggestions 
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="cg-suggestions-modal"
    >
      <Modal.Header closeButton className="cg-modal-header">
        <Modal.Title className="cg-modal-title">
          Goal Suggestions for
          <br />
          <span className="cg-modal-email">{goalSuggestions?.email}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="cg-modal-body">
        {loadingSuggestions ? (
          <div className="cg-modal-loading">
            <Spinner animation="border" />
          </div>
        ) : (
          <ul className="cg-suggestion-list">
            {goalSuggestions &&
              goalSuggestions.suggestions.map((g, idx) => (
                <li key={idx} className="cg-suggestion-item">
                  <div className="cg-suggestion-header">
                    <span className="cg-suggestion-title">{g.goalTitle}</span>
                    <span className="cg-suggestion-type">({g.goalType})</span>
                  </div>
                  <div className="cg-suggestion-description">
                    {g.goalDescription}
                  </div>
                  <div className="cg-suggestion-meta">
                    <span className="cg-meta-priority">
                      Priority: <strong>{g.priority}</strong>
                    </span>
                    <span className="cg-meta-duration">
                      Duration: <strong>{g.estimatedDuration}</strong>
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default GoalSuggestionsModal;
