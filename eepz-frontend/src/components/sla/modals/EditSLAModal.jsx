import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "../../../styles/sla/modals/EditSLAModal.css";

const EditSLAModal = ({ sla, onClose, onUpdate }) => {
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const statusRef = useRef(null);
  const calendarRef = useRef(null);

  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        statusOpen &&
        statusRef.current &&
        !statusRef.current.contains(e.target)
      ) {
        setStatusOpen(false);
      }
      if (
        calendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target)
      ) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen, calendarOpen]);

  useEffect(() => {
    if (sla) {
      const date = new Date(sla.deadline);
      const formattedDate = date.toISOString().split("T")[0];
      setDeadline(formattedDate);
      setStatus(sla.status || "Open");
      setUpdateReason("");
      setCalendarMonth(date.getMonth());
      setCalendarYear(date.getFullYear());
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
        status: status,
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

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarMonth ?? today.getMonth();
    const year = calendarYear ?? today.getFullYear();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length, current: false });
    }
    return { cells, month, year };
  };

  const handleSelectCalendarDay = (day, current) => {
    if (!current) return;
    const month = calendarMonth;
    const year = calendarYear;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    setDeadline(`${yyyy}-${mm}-${dd}`);
    setCalendarOpen(false);
  };

  const goPrevMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goNextMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goToday = () => {
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDeadline(`${yyyy}-${mm}-${dd}`);
    setCalendarOpen(false);
  };

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = deadline ? new Date(deadline) : null;

  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December", ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="esla-overlay" onClick={onClose}>
      <div className="esla-modal" onClick={(e) => e.stopPropagation()}>
        <div className="esla-header">
          <h5 className="esla-title">Edit SLA - {sla?.employeeName}</h5>
          <button  type="button"  className={`esla-close-btn ${  updating ? "esla-close-btn--disabled" : ""}`}
            onClick={onClose} disabled={updating}>  <X size={24} />
          </button>
        </div>

        <div className="esla-body">
          {error && (
            <div className="esla-error-alert">
              <AlertCircle className="esla-error-icon" size={20} /> <p className="esla-error-text">{error}</p>
            </div>
          )}

          <form className="esla-form" onSubmit={handleSubmit}>
            <div className="esla-sla-info">
              <small className="esla-sla-label">Current SLA</small>
              <strong className="esla-sla-type">{sla?.slatype}</strong>
              <small className="esla-sla-employee">
                Employee: {sla?.employeeName}
              </small>
            </div>

            <div className="esla-field">
              <label className="esla-label">
                Deadline <span className="esla-required">*</span>
              </label>

              <div ref={calendarRef} className="esla-calendar-container">
                <input  type="text"  readOnly  value={formatDisplayDate(deadline)}
                  onClick={() => setCalendarOpen((o) => !o)}  disabled={updating}  placeholder="Select date"  
                  className={`esla-input esla-deadline-input ${ updating ? "esla-input--disabled" : ""}`} />
                <button type="button"  className={`esla-calendar-trigger ${ updating ? "esla-calendar-trigger--disabled" : ""}`}
                  onClick={() => setCalendarOpen((o) => !o)} disabled={updating} >
                  
                  <svg className="esla-calendar-svg"
                    width="18" height="18"
                    viewBox="0 0 24 24" fill="none">
                    
                  <rect  x="4"  y="5"
                    width="16"  height="15" rx="2" ry="2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      fill="none"/>

                    <line x1="4" y1="9" x2="20" y2="9"
                      stroke="currentColor"
                      strokeWidth="1.8"/>
                    
                    <line  x1="9" y1="3" x2="9" y2="7"
                      stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <line
                      x1="15"  y1="3"  x2="15" y2="7"
                      stroke="currentColor"   strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {calendarOpen && (
                  <div className="esla-calendar-dropdown">
                    <div className="esla-calendar-header">
                      <button type="button" className="esla-calendar-nav-btn"onClick={goPrevMonth}>
                        <ChevronLeft size={16} />
                      </button>
                      <span className="esla-calendar-title">
                        {monthNames[month]} {year}
                      </span>
                      <button type="button" className="esla-calendar-nav-btn"onClick={goNextMonth}>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="esla-calendar-weekdays">
                      {weekdays.map((w) => (
                        <div key={w} className="esla-weekday">
                          {w}
                        </div>
                      ))}
                    </div>

                    <div className="esla-calendar-grid">
                      {cells.map((c, idx) => {
                        const cellDate = new Date(year, month, c.day);
                        const isToday =
                          c.current &&
                          cellDate.getDate() === today.getDate() &&
                          cellDate.getMonth() === today.getMonth() &&
                          cellDate.getFullYear() === today.getFullYear();

                        const isSelected =
                          selectedDate &&
                          c.current &&
                          cellDate.getDate() === selectedDate.getDate() &&
                          cellDate.getMonth() === selectedDate.getMonth() &&
                          cellDate.getFullYear() === selectedDate.getFullYear();

                        return (
                          <div
                            key={idx}
                            className={`esla-calendar-day 
                              ${c.current ? "esla-calendar-day--current" : ""} 
                              ${isToday ? "esla-calendar-day--today" : ""} 
                              ${
                                isSelected ? "esla-calendar-day--selected" : ""
                              }`}
                            onClick={() =>
                              handleSelectCalendarDay(c.day, c.current)
                            }
                          >
                            {c.day}
                          </div>
                        );
                      })}
                    </div>

                    <div className="esla-calendar-footer">
                      <button type="button" className="esla-today-btn" onClick={goToday}> Today</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="esla-field">
              <label className="esla-label">
                Status <span className="esla-required">*</span>
              </label>

              <div ref={statusRef} className="esla-status-container">
                <button
                  type="button" className={`esla-status-trigger ${
                    updating ? "esla-status-trigger--disabled" : ""}`}
                  onClick={() => setStatusOpen((o) => !o)}
                  disabled={updating}>
                  <span className={`esla-status-value ${ status ? "" : "esla-status-value--placeholder" }`}>
                    {status || "Select Status"}
                  </span>
                  <ChevronDown className={`esla-chevron ${ statusOpen ? "esla-chevron--open" : ""}`}
                    size={18}/>
                </button>

                {statusOpen && (
                  <div className="esla-status-dropdown">
                    {["Open", "Closed"].map((opt) => {
                      const selected = status === opt;
                      return (
                        <button key={opt} type="button" className={`esla-status-option ${
                            selected ? "esla-status-option--selected" : ""
                        }`} onClick={() => { setStatus(opt); setStatusOpen(false); }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="esla-field esla-reason-field">
              <label className="esla-label">
                Update Reason <span className="esla-required">*</span>
              </label>
              <textarea  rows={3}  placeholder="Why are you updating this SLA?"
                value={updateReason} onChange={(e) => setUpdateReason(e.target.value)}
                maxLength={250} disabled={updating} className={`esla-textarea ${
                  updating ? "esla-textarea--disabled" : ""}`}/>

              <small className="esla-char-count">
                {updateReason.length}/250 characters
              </small>
            </div>
          </form>
        </div>

        <div className="esla-footer">
          <button  type="button"className={`esla-btn esla-btn--cancel ${updating ? "esla-btn--disabled" : ""}`}
            onClick={onClose} disabled={updating}> Cancel
          </button>

          <button type="submit"
            className={`esla-btn esla-btn--update ${ updating || !deadline || !updateReason.trim()
           ? "esla-btn--disabled": "" }`}
            onClick={handleSubmit} disabled={updating || !deadline || !updateReason.trim()}>
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
