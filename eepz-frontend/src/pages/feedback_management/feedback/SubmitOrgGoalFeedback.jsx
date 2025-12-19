import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Send, AlertTriangle } from "lucide-react";

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

  // Fetch organization-wide objectives
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

  // Handle objective selection
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
    <div className="container-fluid py-3" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            Submit Organization Objective Feedback
          </h2>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            Provide your feedback on organization-wide objectives
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div
          className="alert alert-success d-flex align-items-center gap-2 mb-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <CheckCircle size={18} className="flex-shrink-0" />
          <div className="small flex-grow-1">{successMsg}</div>
          <button
            className="btn-close ms-auto"
            onClick={() => setSuccessMsg("")}
          />
        </div>
      )}

      {/* Main Card */}
      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          {objectivesLoading ? (
            <div
              className="d-flex align-items-center justify-content-center gap-2"
              style={{ minHeight: "300px" }}
            >
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="small">Loading organization objectives...</span>
            </div>
          ) : objectives.length === 0 ? (
            <div
              className="alert alert-warning"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <p className="mb-0 small">
                No organization objectives available at the moment.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="row g-4">
              {/* Objective Selection */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Select Organization Objective{" "}
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
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

              {/* Objective Description Display */}
              {selectedObjective && (
                <div className="col-12">
                  <div
                    className="alert alert-info small"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <strong>Objective Description:</strong>
                    <p className="mb-0 mt-2">{selectedObjective.description}</p>
                  </div>
                </div>
              )}

              {/* Rating Slider */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Rating <span className="text-danger">*</span>
                </label>
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="form-range"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: Number(e.target.value) })
                    }
                    style={{ flex: 1 }}
                  />
                  <span
                    className="badge bg-primary px-3 py-2"
                    style={{ minWidth: "60px", textAlign: "center" }}
                  >
                    {form.rating} ⭐
                  </span>
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">&nbsp;</label>
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="anonymousCheckbox"
                    checked={form.isAnonymous}
                    onChange={(e) =>
                      setForm({ ...form, isAnonymous: e.target.checked })
                    }
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="anonymousCheckbox"
                  >
                    Submit anonymously
                  </label>
                </div>
              </div>

              {/* Comments Textarea */}
              <div className="col-12">
                <label className="form-label small fw-bold">
                  Your Feedback <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
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
                <small className="text-muted d-block mt-1">
                  {form.feedbackComments.length} / 1000 characters
                </small>
              </div>

              {/* Submit Button */}
              <div className="col-12 d-grid">
                <button
                  className="btn btn-primary"
                  disabled={
                    loading ||
                    !form.objectiveId ||
                    !form.feedbackComments.trim()
                  }
                  type="submit"
                >
                  <Send size={16} className="me-2" />
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
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
