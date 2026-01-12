import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Save, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/EditFeedback.css";

export default function EditFeedback() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const type = params.get("type");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rating: 4,
    feedbackComments: "",
    feedbackContent: "",
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
      <div className="fm-editfb-loading-container">
        <div className="fm-editfb-spinner" role="status">
          <span className="fm-editfb-spinner-text">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fm-editfb-page-wrapper">
      <div className="fm-editfb-header">
        <div className="fm-editfb-header-content">
          <h2 className="fm-editfb-title">Edit Feedback</h2>
          <p className="fm-editfb-subtitle">Update your submitted feedback</p>
        </div>
        <button className="fm-editfb-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div className="fm-editfb-alert fm-editfb-alert--error">
          <AlertTriangle size={18} className="fm-editfb-alert-icon" />
          <div className="fm-editfb-alert-content">
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button
            className="fm-editfb-alert-close"
            onClick={() => setError("")}
          >
            {" "}
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="fm-editfb-alert fm-editfb-alert--success">
          <CheckCircle size={18} className="fm-editfb-alert-icon" />
          <div className="fm-editfb-alert-message">{successMsg}</div>
        </div>
      )}

      <div className="fm-editfb-card">
        <div className="fm-editfb-card-body">
          <form onSubmit={submit} className="fm-editfb-form">
            {type === "mentor" && (
              <>
                <div className="fm-editfb-form-group fm-editfb-form-group--half">
                  <label className="fm-editfb-label">Rating (1-5) *</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="fm-editfb-range"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: e.target.value })
                    }
                  />
                  <div className="fm-editfb-rating-display">
                    Selected: {form.rating} ⭐
                  </div>
                </div>
                <div className="fm-editfb-form-group fm-editfb-form-group--full">
                  <label className="fm-editfb-label">Feedback Comments *</label>
                  <textarea
                    className="fm-editfb-textarea"
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
              <div className="fm-editfb-form-group fm-editfb-form-group--full">
                <label className="fm-editfb-label">Feedback Content *</label>
                <textarea
                  className="fm-editfb-textarea"
                  rows={4}
                  value={form.feedbackContent}
                  onChange={(e) =>
                    setForm({ ...form, feedbackContent: e.target.value })
                  }
                  placeholder="Update your feedback…"
                  disabled
                />
                <small className="fm-editfb-help-text">
                  Peer feedback cannot be edited after submission (API
                  limitation).
                </small>
              </div>
            )}
            <div className="fm-editfb-form-actions">
              <button
                className="fm-editfb-submit-btn"
                disabled={loading || type === "peer"}
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
