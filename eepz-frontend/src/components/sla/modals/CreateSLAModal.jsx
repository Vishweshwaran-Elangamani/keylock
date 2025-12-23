import React, { useState, useEffect, useRef } from "react";
import { Plus, Loader, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";

const PRIMARY = "#27235C";

const CreateSLAModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);

  const [formData, setFormData] = useState({
    reviewType: "",
    deadline: "",
    reason: "",
  });

  // calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const calendarRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ===== FETCH EMPLOYEE COUNT =====
  useEffect(() => {
    const fetchCount = async () => {
      try {
        setFetchLoading(true);
        const res = await slaService.getAllEmployees();

        if (res?.success && Array.isArray(res.data)) {
          const uniqueEmployees = new Set();
          res.data.forEach((item) => {
            if (item.employeeId) {
              uniqueEmployees.add(item.employeeId);
            }
          });
          setEmployeeCount(uniqueEmployees.size);
        } else {
          toast.error("Failed to load employee count");
          setError("Failed to load employee count");
        }
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load employee count");
        setError("Failed to load employee count");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchCount();
  }, []);

  // ===== CLOSE CALENDAR ON OUTSIDE CLICK =====
  useEffect(() => {
    const handler = (e) => {
      if (calendarOpen && calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  // ===== FORM CHANGE =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.reviewType.trim()) {
      toast.error("Please enter a review type");
      setError("Please enter a review type");
      return;
    }
    if (!formData.deadline) {
      toast.error("Please select a deadline");
      setError("Please select a deadline");
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      toast.error("Deadline must be in the future");
      setError("Deadline must be in the future");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating SLAs...");

    try {
      const deadlineIso = new Date(formData.deadline).toISOString();

      const res = await slaService.getAllEmployees();
      if (!res?.success || !Array.isArray(res.data)) {
        toast.dismiss(loadingToast);
        toast.error("Failed to fetch employees");
        setError("Failed to fetch employees");
        setLoading(false);
        return;
      }

      const uniqueEmployees = new Map();
      res.data.forEach((item) => {
        if (item.employeeId && !uniqueEmployees.has(item.employeeId)) {
          uniqueEmployees.set(item.employeeId, {
            employeeId: item.employeeId,
            employeeName:
              item.employeeName ||
              (item.firstName && item.lastName
                ? `${item.firstName} ${item.lastName}`
                : "Unknown"),
            departmentId: item.departmentId || 2,
          });
        }
      });

      const bulkRequests = Array.from(uniqueEmployees.values()).map((emp) => ({
        slatype: formData.reviewType,
        employeeId: emp.employeeId,
        assignedToEmployeeId: null,
        departmentId: emp.departmentId,
        deadline: deadlineIso,
        relatedEntityType: null,
        relatedEntityId: null,
        createdByEmployeeId: user?.empId || 1,
        creationReason: formData.reason || `${formData.reviewType} assigned`,
      }));

      const response = await slaService.createBulkSLA(bulkRequests);
      toast.dismiss(loadingToast);

      if (response?.success) {
        const resultData = response.data;

        toast.success("SLA Created Successfully", { duration: 3000 });

        setTimeout(() => {
          if (resultData.successfulInserts > 0) {
            onSuccess?.();
            onClose?.();
          }
        }, 1500);
      } else {
        toast.error("Failed to create SLAs");
        setError(response?.message || "Failed to create SLAs");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.dismiss(loadingToast);
      toast.error("Failed to create SLAs");
      setError(err?.message || "Error creating SLAs");
    } finally {
      setLoading(false);
    }
  };

  // ===== CALENDAR HELPERS =====
  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const ensureCalendarMonthYear = () => {
    if (calendarMonth === null || calendarYear === null) {
      const base = formData.deadline ? new Date(formData.deadline) : new Date();
      setCalendarMonth(base.getMonth());
      setCalendarYear(base.getFullYear());
    }
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

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = formData.deadline ? new Date(formData.deadline) : null;

  const monthNames = [
    "January","February",  "March",  "April", "May", "June", "July", "August", "September", "October", "November", "December",
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelectCalendarDay = (day, current) => {
    if (!current) return;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    const value = `${yyyy}-${mm}-${dd}`;
    setFormData((prev) => ({ ...prev, deadline: value }));
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
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setFormData((prev) => ({ ...prev, deadline: `${yyyy}-${mm}-${dd}` }));
    setCalendarMonth(now.getMonth());
    setCalendarYear(now.getFullYear());
    setCalendarOpen(false);
  };

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
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          width: "90%",
          maxWidth: 500,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.5rem",
            backgroundColor: "#3c3862",
          }}
        >
          <h5
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "white",
              textAlign: "left",
            }}
          >
            Create SLA
          </h5>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 0.8,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "1.75rem", backgroundColor: "#f8f9fa" }}>
          {fetchLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <Loader
                size={32}
                style={{
                  color: "#97247E",
                  marginBottom: "1rem",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "#666", fontSize: "0.95rem" }}>
                Loading employee count...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ERROR ALERT */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "1rem",
                    backgroundColor: "rgba(224, 25, 80, 0.1)",
                    border: "1px solid rgba(224, 25, 80, 0.3)",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <AlertCircle
                    size={20}
                    style={{
                      color: "#E01950",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      color: "#991b1b",
                      fontSize: "0.95rem",
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* REVIEW TYPE */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
                  Review Type <span style={{ color: "#E01950" }}>*</span>
                </label>
                <input
                  type="text"
                  name="reviewType"
                  value={formData.reviewType}
                  onChange={handleChange}
                  placeholder="E.g., Performance Form, Quarterly Review"
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f3f4f6" : "white",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "text",
                  }}
                />
              </div>

              {/* DEADLINE with same calendar icon as EditSLAModal */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
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
                    value={formatDisplayDate(formData.deadline)}
                    onClick={() => {
                      ensureCalendarMonthYear();
                      setCalendarOpen((o) => !o);
                    }}
                    disabled={loading}
                    placeholder="Select date"
                    style={{
                      width: "100%",
                      padding: "0.6rem 2.5rem 0.6rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      cursor: loading ? "not-allowed" : "pointer",
                      backgroundColor: loading ? "#f3f4f6" : "white",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      ensureCalendarMonthYear();
                      setCalendarOpen((o) => !o);
                    }}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 10,
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: loading ? "not-allowed" : "pointer",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 16,          // smaller width
                         height: 16,         // smaller height
                          borderRadius: 3,
                            border: `1.6px solid ${PRIMARY}`, // slightly thinner border
                             position: "relative",
                      }}
                    >
                      {/* top bar */}
                      <div
                        style={{
                          position: "absolute",
                          top: -2,
                          left: 0,
                          right: 0,
                          height: 4,
                          backgroundColor: PRIMARY,
                          borderRadius: "4px 4px 0 0",
                        }}
                      />
                      {/* two pegs */}
                      <div
                        style={{
                          position: "absolute",
                          top: -4,
                          left: 4,
                          width: 2,
                          height: 4,
                          backgroundColor: PRIMARY,
                          borderRadius: 2,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: -4,
                          right: 4,
                          width: 2,
                          height: 4,
                          backgroundColor: PRIMARY,
                          borderRadius: 2,
                        }}
                      />
                    </div>
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

              {/* REASON */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                    textAlign: "left",
                  }}
                >
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Why assign this SLA?"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#f3f4f6" : "white",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "text",
                  }}
                />
              </div>

              {/* EMPLOYEE COUNT */}
              <div
                style={{
                  backgroundColor: "rgba(13, 110, 253, 0.1)",
                  border: "1px solid rgba(13, 110, 253, 0.3)",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#0F62FE",
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    lineHeight: 1.2,
                    textAlign: "left",
                  }}
                >
                  {employeeCount} Employees
                </p>
                <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                  SLA will be displayed to all employees
                </small>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "white",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.6rem 1.25rem",
              border: "none",
              backgroundColor: "#6b7280",
              color: "white",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || fetchLoading || employeeCount === 0}
            style={{
              padding: "0.6rem 1.5rem",
              background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                loading || fetchLoading || employeeCount === 0
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity:
                loading || fetchLoading || employeeCount === 0 ? 0.6 : 1,
              boxShadow: "0 4px 12px rgba(151, 36, 126, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!(loading || fetchLoading || employeeCount === 0)) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(151, 36, 126, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(151, 36, 126, 0.3)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create SLA
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

export default CreateSLAModal;
