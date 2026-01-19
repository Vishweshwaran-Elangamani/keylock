import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import CustomCalendar from "../../../components/project-management/common/CustomCalendar";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import "../../../styles/sla/modals/EditSLAModal.css";


const EditSLAModal = ({ sla, onClose, onUpdate }) => {
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const statusRef = useRef(null);
  const calendarAnchorRef = useRef(null);

  useEffect(() => {
    if (sla) {
      const date = new Date(sla.deadline);
      const formattedDate = date.toISOString().split("T")[0];
      setDeadline(formattedDate);
      setStatus(sla.status || "Open");
      setUpdateReason("");
    }
  }, [sla]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        status,
        complianceStatus: status === "Closed" ? "OnTime" : sla.complianceStatus,
      };
      await onUpdate(sla.slaid, updateData);
    } catch (err) {
      setError(err.message || "Failed to update SLA");
    } finally {
      setUpdating(false);
    }
  };

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleDateChange = (value) => {
    setDeadline(value);
    setCalendarOpen(false);
  };

  const statusOptions = [
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
  ];

  return (
    <div className="esla-overlay" onClick={onClose}>
      <div className="esla-modal" onClick={(e) => e.stopPropagation()}>
        <div className="esla-header">
          <h5 className="esla-title">Edit SLA - {sla?.employeeName}</h5>
          <button
            type="button"
            className={`esla-close-btn ${updating ? "esla-close-btn--disabled" : ""}`}
            onClick={onClose}
            disabled={updating}
          >
            <X size={24} />
          </button>
        </div>

        <div className="esla-body">
          {error && (
            <div className="esla-error-alert">
              <AlertCircle className="esla-error-icon" size={20} />
              <p className="esla-error-text">{error}</p>
            </div>
          )}

          <form className="esla-form" onSubmit={handleSubmit}>
            <div className="esla-sla-info">
              <small className="esla-sla-label">Current SLA</small>
              <strong className="esla-sla-type">{sla?.slatype}</strong>
              <small className="esla-sla-employee">Employee: {sla?.employeeName}</small>
            </div>

            <div className="esla-field">
              <label className="esla-label">
                Deadline <span className="esla-required">*</span>
              </label>

              <div ref={calendarAnchorRef} className="esla-calendar-container">
                <input
                  type="text"
                  readOnly
                  value={formatDisplayDate(deadline)}
                  onClick={() => setCalendarOpen((o) => !o)}
                  disabled={updating}
                  placeholder="Select date"
                  className={`esla-input esla-deadline-input ${updating ? "esla-input--disabled" : ""}`}
                />

                <button
                  type="button"
                  className={`esla-calendar-trigger ${updating ? "esla-calendar-trigger--disabled" : ""}`}
                  onClick={() => setCalendarOpen((o) => !o)}
                  disabled={updating}
                >
                  <svg
                    className="esla-calendar-svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect
                      x="4"
                      y="5"
                      width="16"
                      height="15"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      fill="none"
                    />
                    <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.8" />
                    <line
                      x1="9"
                      y1="3"
                      x2="9"
                      y2="7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="15"
                      y1="3"
                      x2="15"
                      y2="7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <CustomCalendar
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              value={deadline}
              onChange={handleDateChange}
              anchorRef={calendarAnchorRef}
              position="below-icon"
              align="right"
              offset={{ x: 0, y: 0 }}
            />

            <div className="esla-field" ref={statusRef}>
              <CustomDropdown
                label="Status"
                required={true}
                name="status"
                value={status}
                onChange={(_, value) => setStatus(value)}
                options={statusOptions}
                placeholder="Select Status"
                disabled={updating}
                anchorRef={statusRef}
                align="left"
                className="esla-dropdown"
              />
            </div>

            <div className="esla-field esla-reason-field">
              <label className="esla-label">
                Update Reason <span className="esla-required">*</span>
              </label>

              <textarea
                rows={3}
                placeholder="Why are you updating this SLA?"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                maxLength={250}
                disabled={updating}
                className={`esla-textarea ${updating ? "esla-textarea--disabled" : ""}`}
              />

              <small className="esla-char-count">{updateReason.length}/250 characters</small>
            </div>
          </form>
        </div>

        <div className="esla-footer">
          <button
            type="button"
            className={`esla-btn esla-btn--cancel ${updating ? "esla-btn--disabled" : ""}`}
            onClick={onClose}
            disabled={updating}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`esla-btn esla-btn--update ${
              updating || !deadline || !updateReason.trim() ? "esla-btn--disabled" : ""
            }`}
            onClick={handleSubmit}
            disabled={updating || !deadline || !updateReason.trim()}
          >
            {updating ? (
              <>
                <span className="esla-btn-spinner" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Update SLA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSLAModal;
