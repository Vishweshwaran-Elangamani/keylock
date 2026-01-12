import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Send, AlertTriangle } from "lucide-react";
import "../../../styles/feedback/components/SubmitOrgGoalFeedback.css";

export default function SubmitOrgGoalFeedback() {
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        name: "Dave Dev",
      },
    []
  );

  const [form, setForm] = useState({
    objectiveId: null,
    objectiveTitle: "",
    rating: 4,
    feedbackComments: "",
    isAnonymous: false,
  });

  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [objectivesLoading, setObjectivesLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const resetAlerts = () => {
    setSuccessMsg("");
    setError("");
  };

  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        setObjectivesLoading(true);
        const response = await fetch(
          "http://localhost:5333/api/orgwideobjectives"
        );
        const data = await response.json();

        if (data.isSuccess && Array.isArray(data.data)) {
          setObjectives(data.data);
        } else {
          setError("Failed to load organization objectives");
        }
      } catch (err) {
        console.error("Error fetching objectives:", err);
        setError(
          "Error loading objectives: " + (err?.message || "Unknown error")
        );
      } finally {
        setObjectivesLoading(false);
      }
    };

    fetchObjectives();
  }, []);

  const handleObjectiveChange = (e) => {
    const selectedObjectiveId = Number(e.target.value);
    const selectedObjective = objectives.find(
      (obj) => obj.objectiveId === selectedObjectiveId
    );

    setForm({
      ...form,
      objectiveId: selectedObjectiveId,
      objectiveTitle: selectedObjective?.title || "",
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!form.objectiveId || !form.feedbackComments?.trim()) {
      setError("Please select an objective and provide feedback comments.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        organizationObjectiveId: form.objectiveId,
        submittedByEmployeeId: Number(user?.empId),
        managerEmployeeId: null,
        rating: Number(form.rating || 0),
        feedbackComments: form.feedbackComments,
        feedbackFrom: "Employee",
        isAnonymous: !!form.isAnonymous,
      };

      const response = await fetch(
        "http://localhost:5333/api/orggoalfeedback/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.isSuccess || response.ok) {
        setSuccessMsg(
          "Organization objective feedback submitted successfully."
        );
        setForm({
          objectiveId: null,
          objectiveTitle: "",
          rating: 4,
          feedbackComments: "",
          isAnonymous: false,
        });
      } else {
        setError(data.message || "Failed to submit feedback");
      }
    } catch (err) {
      console.error(" Error:", err);
      setError(err?.message || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  const selectedObjective = objectives.find(
    (obj) => obj.objectiveId === form.objectiveId
  );

  return (
    <div className="sogf-container">
      <div className="sogf-header">
        <div className="sogf-header-content">
          <h2 className="sogf-title">Submit Organization Objective Feedback</h2>
          <p className="sogf-subtitle">
            Provide your feedback on organization-wide objectives
          </p>
        </div>
      </div>

      {error && (
        <div className="sogf-alert sogf-alert-error">
          <AlertTriangle size={18} className="sogf-alert-icon" />
          <div className="sogf-alert-content">
            <strong>Error</strong>
            <p className="sogf-alert-message">{error}</p>
          </div>
          <button className="sogf-alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="sogf-alert sogf-alert-success">
          <CheckCircle size={18} className="sogf-alert-icon" />
          <div className="sogf-alert-content">{successMsg}</div>
          <button
            className="sogf-alert-close"
            onClick={() => setSuccessMsg("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="sogf-card">
        <div className="sogf-card-body">
          {objectivesLoading ? (
            <div className="sogf-loading-state">
              <div className="sogf-spinner" role="status">
                <span className="sogf-visually-hidden">Loading...</span>
              </div>
              <span className="sogf-loading-text">
                Loading organization objectives...
              </span>
            </div>
          ) : objectives.length === 0 ? (
            <div className="sogf-alert sogf-alert-warning">
              <p className="sogf-empty-message">
                No organization objectives available at the moment.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="sogf-form">
              <div className="sogf-form-group">
                <label className="sogf-label">
                  Select Organization Objective{" "}
                  <span className="sogf-required">*</span>
                </label>
                <select
                  className="sogf-select"
                  value={form.objectiveId || ""}
                  onChange={handleObjectiveChange}
                  required
                >
                  <option value="">-- Choose an objective --</option>
                  {objectives.map((objective) => (
                    <option
                      key={objective.objectiveId}
                      value={objective.objectiveId}
                    >
                      {objective.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedObjective && (
                <div className="sogf-form-group">
                  <div className="sogf-objective-description">
                    <strong>Objective Description:</strong>
                    <p className="sogf-description-text">
                      {selectedObjective.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="sogf-form-row">
                <div className="sogf-form-col">
                  <label className="sogf-label">
                    Rating <span className="sogf-required">*</span>
                  </label>
                  <div className="sogf-rating-wrapper">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      className="sogf-range"
                      value={form.rating}
                      onChange={(e) =>
                        setForm({ ...form, rating: Number(e.target.value) })
                      }
                    />
                    <span className="sogf-rating-badge">{form.rating} ⭐</span>
                  </div>
                </div>

                <div className="sogf-form-col">
                  <label className="sogf-label sogf-label-spacer">&nbsp;</label>
                  <div className="sogf-checkbox-wrapper">
                    <input
                      className="sogf-checkbox-input"
                      type="checkbox"
                      id="anonymousCheckbox"
                      checked={form.isAnonymous}
                      onChange={(e) =>
                        setForm({ ...form, isAnonymous: e.target.checked })
                      }
                    />
                    <label
                      className="sogf-checkbox-label"
                      htmlFor="anonymousCheckbox"
                    >
                      {" "}
                      Submit anonymously{" "}
                    </label>
                  </div>
                </div>
              </div>

              <div className="sogf-form-group">
                <label className="sogf-label">
                  Your Feedback <span className="sogf-required">*</span>
                </label>
                <textarea
                  className="sogf-textarea"
                  rows={5}
                  value={form.feedbackComments}
                  onChange={(e) =>
                    setForm({ ...form, feedbackComments: e.target.value })
                  }
                  placeholder="Share your detailed feedback on this organization objective. What's working well? What could be improved?"
                  required
                  disabled={!form.objectiveId}
                  maxLength={1000}
                />
                <small className="sogf-char-count">
                  {" "}
                  {form.feedbackComments.length} / 1000 characters{" "}
                </small>
              </div>

              <div className="sogf-form-group">
                <button
                  className="sogf-submit-button"
                  disabled={
                    loading ||
                    !form.objectiveId ||
                    !form.feedbackComments.trim()
                  }
                  type="submit"
                >
                  {loading ? (
                    <>
                      <span
                        className="sogf-button-spinner"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="sogf-button-icon" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
