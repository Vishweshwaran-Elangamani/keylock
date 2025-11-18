import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Save, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
} from "../../../services/feedbackmanagement/feedbackApi";

export default function EditFeedback() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const type = params.get("type"); // 'mentor' | 'peer'
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rating: 4,
    feedbackComments: "", // mentor
    feedbackContent: "", // peer
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      setLoadingData(true);
      try {
        if (type === "mentor") {
          const res = await mentorFeedbackApi.getById(id);
          const item = res.data?.data;
          setForm({
            rating: item.rating || 4,
            feedbackComments: item.feedbackComments || "",
            feedbackContent: "",
          });
        } else if (type === "peer") {
          const res = await peerQueueApi.getById(id);
          const item = res.data?.data;
          setForm({
            rating: 0,
            feedbackComments: "",
            feedbackContent: item.feedbackContent || "",
          });
        } else {
          setError("Invalid type parameter");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Failed to load item"
        );
      } finally {
        setLoadingData(false);
      }
    };
    if (id && type) fetchItem();
  }, [id, type]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (type === "mentor" && !form.feedbackComments?.trim()) {
      setError("Feedback comments are required.");
      return;
    }
    if (type === "peer" && !form.feedbackContent?.trim()) {
      setError("Feedback content is required.");
      return;
    }
    setLoading(true);
    try {
      if (type === "mentor") {
        await mentorFeedbackApi.update(id, {
          rating: Number(form.rating),
          feedbackComments: form.feedbackComments,
        });
      } else {
        // Peer queue doesn't have an update endpoint in your spec; skip or show error
        setError(
          "Peer feedback cannot be edited after submission (no API endpoint)."
        );
        setLoading(false);
        return;
      }
      setSuccessMsg("Feedback updated successfully.");
      setTimeout(() => navigate("/feedback/my-submissions"), 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "900px" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            Edit Feedback
          </h2>
          <p className="mb-0 small" style={{ color: "var(--muted)" }}>
            Update your submitted feedback
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="me-1" />
          Back
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError("")} />
        </div>
      )}
      {successMsg && (
        <div
          className="alert alert-success d-flex align-items-center gap-2"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <CheckCircle size={18} />
          <div className="small">{successMsg}</div>
        </div>
      )}

      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          <form onSubmit={submit} className="row g-3">
            {type === "mentor" && (
              <>
                <div className="col-md-6">
                  <label className="form-label small">Rating (1-5) *</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="form-range"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
                    }
                  />
                  <div className="small text-muted">
                    Selected: {form.rating} ⭐
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label small">
                    Feedback Comments *
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.feedbackComments}
                    onChange={(e) =>
                      setForm({ ...form, feedbackComments: e.target.value })
                    }
                    placeholder="Update your feedback…"
                  />
                </div>
              </>
            )}
            {type === "peer" && (
              <div className="col-12">
                <label className="form-label small">Feedback Content *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.feedbackContent}
                  onChange={(e) =>
                    setForm({ ...form, feedbackContent: e.target.value })
                  }
                  placeholder="Update your feedback…"
                  disabled
                />
                <small className="text-muted d-block mt-1">
                  Peer feedback cannot be edited after submission (API
                  limitation).
                </small>
              </div>
            )}
            <div className="col-12 d-grid">
              <button
                className="btn btn-primary"
                disabled={loading || type === "peer"}
              >
                <Save size={16} className="me-1" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
