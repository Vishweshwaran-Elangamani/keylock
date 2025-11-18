import React, { useState, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";

const EditSLAModal = ({ sla, onClose, onUpdate }) => {
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sla) {
      // Format date for input (YYYY-MM-DD)
      const date = new Date(sla.deadline);
      const formattedDate = date.toISOString().split("T")[0];
      setDeadline(formattedDate);
      setStatus(sla.status || "Open");
      setUpdateReason("");
    }
  }, [sla]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!deadline) {
      setError("Deadline is required");
      return;
    }

    if (!updateReason.trim()) {
      setError("Update reason is required");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updateData = {
        deadline: new Date(deadline).toISOString(),
        status: status,
        complianceStatus: status === "Closed" ? "OnTime" : sla.complianceStatus,
      };

      console.log("📝 Updating SLA with:", updateData);
      await onUpdate(sla.slaid, updateData);
    } catch (err) {
      setError(err.message || "Failed to update SLA");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "12px" }}>
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Edit SLA #{sla?.slaid}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={updating}
            />
          </div>

          {/* Body */}
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-3">
                <AlertTriangle size={16} className="me-2" />
                {error}
                <button
                  type="button"
                  className="btn-close btn-sm"
                  onClick={() => setError(null)}
                />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* SLA Info */}
              <div
                className="mb-3 p-3"
                style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
              >
                <small className="text-muted d-block mb-2">Current SLA</small>
                <strong className="d-block mb-1">{sla?.slatype}</strong>
                <small className="text-muted">
                  Employee: {sla?.employeeName}
                </small>
              </div>

              {/* Deadline */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={updating}
                  style={{ borderRadius: "8px" }}
                />
              </div>

              {/* Status */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={updating}
                  style={{ borderRadius: "8px" }}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Update Reason */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Update Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Why are you updating this SLA?"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  disabled={updating}
                  style={{ borderRadius: "8px" }}
                />
                <small className="text-muted d-block mt-1">
                  {updateReason.length}/250
                </small>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleSubmit}
              disabled={updating || !deadline || !updateReason.trim()}
            >
              <Check size={16} />
              {updating ? "Updating..." : "Update SLA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSLAModal;
