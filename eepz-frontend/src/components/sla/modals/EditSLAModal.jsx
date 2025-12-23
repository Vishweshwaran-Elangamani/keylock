import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PRIMARY = "#27235C";

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

  // Close dropdowns on outside click
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

  // calendar helpers
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
    "January", "February", "March", "April", "May", "June", "July",   "August","September","October","November","December",
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          width: "90%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            backgroundColor: PRIMARY,
          }}
        >
          <h5
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
            }}
          >
            Edit SLA - {sla?.employeeName}
          </h5>
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            style={{
              border: "none",
              background: "transparent",
              cursor: updating ? "not-allowed" : "pointer",
              padding: 8,
            }}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {error && (
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: 16,
                backgroundColor: "rgba(224,25,80,0.1)",
                border: "1px solid rgba(224,25,80,0.3)",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <AlertCircle
                size={20}
                style={{ color: "#E01950", flexShrink: 0, marginTop: 2 }}
              />
              <p
                style={{
                  margin: 0,
                  color: "#991b1b",
                  fontSize: "0.95rem",
                  textAlign: "left",
                }}
              >
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* SLA info */}
            <div
              style={{
                backgroundColor: "white",
                padding: 14,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                marginBottom: 24,
              }}
            >
              <small
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                Current SLA
              </small>
              <strong
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: "0.94rem",
                  color: "#374151",
                  textAlign: "left",
                }}
              >
                {sla?.slatype}
              </strong>
              <small
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                Employee: {sla?.employeeName}
              </small>
            </div>

            {/* Deadline + calendar */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Deadline <span style={{ color: "#E01950" }}>*</span>
              </label>

              <div
                ref={calendarRef}
                style={{ position: "relative", width: "100%" }}
              >
                <input
                  type="text"
                  readOnly
                  value={formatDisplayDate(deadline)}
                  onClick={() => setCalendarOpen((o) => !o)}
                  disabled={updating}
                  placeholder="Select date"
                  style={{
                    width: "100%",
                    padding: "0.6rem 2.5rem 0.6rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    cursor: updating ? "not-allowed" : "pointer",
                  }}
                />
                <button
  type="button"
  onClick={() => setCalendarOpen((o) => !o)}
  disabled={updating}
  style={{
    position: "absolute",
    top: "50%",
    right: 10,
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: updating ? "not-allowed" : "pointer",
    padding: 0,
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4"
      y="5"
      width="16"
      height="15"
      rx="2"
      ry="2"
      stroke={PRIMARY}
      strokeWidth="1.8"
      fill="none"
    />
    <line
      x1="4"
      y1="9"
      x2="20"
      y2="9"
      stroke={PRIMARY}
      strokeWidth="1.8"
    />
    <line
      x1="9"
      y1="3"
      x2="9"
      y2="7"
      stroke={PRIMARY}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <line
      x1="15"
      y1="3"
      x2="15"
      y2="7"
      stroke={PRIMARY}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
</button>


                {calendarOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 4,
                      backgroundColor: "white",
                      borderRadius: 8,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                      zIndex: 9999,
                      width: 260,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <button
                        type="button"
                        onClick={goPrevMonth}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "#111827",
                        }}
                      >
                        {monthNames[month]} {year}
                      </span>
                      <button
                        type="button"
                        onClick={goNextMonth}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        padding: "0.25rem 0.5rem",
                        gap: 2,
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      {weekdays.map((w) => (
                        <div
                          key={w}
                          style={{
                            textAlign: "center",
                            padding: "0.25rem 0",
                          }}
                        >
                          {w}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        padding: "0.25rem 0.5rem 0.5rem",
                        gap: 2,
                      }}
                    >
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

                        const baseStyle = {
                          textAlign: "center",
                          padding: "0.35rem 0",
                          borderRadius: 6,
                          cursor: c.current ? "pointer" : "default",
                          fontSize: "0.8rem",
                        };

                        let bg = "transparent";
                        let color = c.current ? "#111827" : "#d1d5db";

                        if (isToday) {
                          bg = "rgba(39,35,92,0.08)";
                        }
                        if (isSelected) {
                          bg = PRIMARY;
                          color = "#ffffff";
                        }

                        return (
                          <div
                            key={idx}
                            style={{ ...baseStyle, backgroundColor: bg, color }}
                            onClick={() =>
                              handleSelectCalendarDay(c.day, c.current)
                            }
                          >
                            {c.day}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        padding: "0.4rem 0.75rem 0.6rem",
                        borderTop: "1px solid #e5e7eb",
                        textAlign: "right",
                      }}
                    >
                      <button
                        type="button"
                        onClick={goToday}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: PRIMARY,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status dropdown */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Status <span style={{ color: "#E01950" }}>*</span>
              </label>

              <div
                ref={statusRef}
                style={{ position: "relative", width: "100%" }}
              >
                <button
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  disabled={updating}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    cursor: updating ? "not-allowed" : "pointer",
                    fontSize: "0.95rem",
                  }}
                >
                  <span
                    style={{
                      opacity: status ? 1 : 0.6,
                    }}
                  >
                    {status || "Select Status"}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: statusOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </button>

                {statusOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 0,
                      backgroundColor: "white",
                      borderRadius: "0 0 8px 8px",
                      border: "1px solid #d1d5db",
                      borderTop: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      overflow: "hidden",
                      zIndex: 9999,
                    }}
                  >
                    {["Open", "Closed"].map((opt) => {
                      const selected = status === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setStatus(opt);
                            setStatusOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "0.6rem 0.75rem",
                            textAlign: "left",
                            border: "none",
                            backgroundColor: selected ? PRIMARY : "white",
                            color: selected ? "white" : "#374151",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected)
                              e.currentTarget.style.backgroundColor = PRIMARY;
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = selected
                              ? PRIMARY
                              : "white";
                            e.currentTarget.style.color = selected
                              ? "white"
                              : "#374151";
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Update reason */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                Update Reason <span style={{ color: "#E01950" }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Why are you updating this SLA?"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
                maxLength={250}
                disabled={updating}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  lineHeight: 1.6,
                  resize: "none",
                  opacity: updating ? 0.6 : 1,
                  cursor: updating ? "not-allowed" : "text",
                }}
              />
              <small
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  textAlign: "left",
                }}
              >
                {updateReason.length}/250 characters
              </small>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              cursor: updating ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              opacity: updating ? 0.5 : 1,
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={updating || !deadline || !updateReason.trim()}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: 8,
              border: "none",
              background:
                "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              cursor:
                updating || !deadline || !updateReason.trim()
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity:
                updating || !deadline || !updateReason.trim() ? 0.6 : 1,
            }}
          >
            {updating ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditSLAModal;
