import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Loader,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../../services/sla/slaService";
import "../../../styles/sla/modals/CreateSLAModal.css";

const CreateSLAModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);

  const [formData, setFormData] = useState({ reviewType: "",deadline: "",reason: "",});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const calendarRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  useEffect(() => {
    const handler = (e) => {
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
  }, [calendarOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

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
        slatype: formData.reviewType,employeeId: emp.employeeId,assignedToEmployeeId: null,
        departmentId: emp.departmentId,deadline: deadlineIso,relatedEntityType: null,relatedEntityId: null,
        createdByEmployeeId: user?.empId || 1,creationReason: formData.reason || `${formData.reviewType} assigned`,
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
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December",];
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
    <>
      <div className="csla-overlay" onClick={onClose}>
        <div className="csla-modal" onClick={(e) => e.stopPropagation()}>
          <div className="csla-header">
            <h5 className="csla-title">Create SLA</h5>
            <button className={`csla-close-btn ${ loading ? "csla-close-btn--disabled" : ""}`}
              onClick={onClose} disabled={loading}>
              <X size={24} />
            </button>
          </div>

          <div className="csla-body">
            {fetchLoading ? (
              <div className="csla-loading-container">
                <Loader className="csla-loading-spinner" size={32} />
                <p className="csla-loading-text">Loading employee count...</p>
              </div>
            ) : (
              <form className="csla-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="csla-error-alert">
                    <AlertCircle className="csla-error-icon" size={20} /> <p className="csla-error-text">{error}</p>
                  </div>
                )}

                <div className="csla-field">
                  <label className="csla-label">
                    Review Type <span className="csla-required">*</span>
                  </label>

                <input type="text"
                  name="reviewType" value={formData.reviewType} onChange={handleChange}
                  placeholder="E.g., Performance Form, Quarterly Review" required disabled={loading}
                className={`csla-input ${  loading ? "csla-input--disabled" : "" }`} />
                </div>

                <div className="csla-field">
                  <label className="csla-label"> Deadline <span className="csla-required">*</span></label>

                  <div ref={calendarRef} className="csla-calendar-container">
                    <input type="text" readOnly value={formatDisplayDate(formData.deadline)}
                      onClick={() => {  ensureCalendarMonthYear();
                        setCalendarOpen((o) => !o);}}
                      disabled={loading} placeholder="Select date" 
                      className={`csla-input csla-deadline-input ${ loading ? "csla-input--disabled" : "" }`}/>
                    <button type="button"
                      className={`csla-calendar-trigger ${ loading ? "csla-calendar-trigger--disabled" : ""}`}
                      onClick={() => { ensureCalendarMonthYear(); setCalendarOpen((o) => !o); }}
                      disabled={loading}>
                      
                      <svg  className="csla-calendar-svg"
                        width="18" height="18" viewBox="0 0 24 24"fill="none">
                        
                      <rect x="4" y="5"
                          width="16" height="15" rx="2" ry="2" stroke="currentColor"
                          strokeWidth="1.8" fill="none" />
                        
                      <line x1="4"  y1="9" x2="20" y2="9"
                        stroke="currentColor" strokeWidth="1.8" />
                    
                      <line
                          x1="9" y1="3" x2="9"y2="7"
                          stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" />
                        
                      <line
                          x1="15" y1="3"x2="15"y2="7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    {calendarOpen && (
                      <div className="csla-calendar-dropdown">
                        <div className="csla-calendar-header">
                          <button type="button"
                            className="csla-calendar-nav-btn"onClick={goPrevMonth}>
                            <ChevronLeft size={16} />
                          </button>
                          <span className="csla-calendar-title">
                            {monthNames[month]} {year}
                          </span>
                          <button type="button"  className="csla-calendar-nav-btn" onClick={goNextMonth}>
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="csla-calendar-weekdays">
                          {weekdays.map((w) => (
                            <div key={w} className="csla-weekday">
                              {w}
                            </div>
                          ))}
                        </div>

                        <div className="csla-calendar-grid">
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
                              cellDate.getFullYear() ===
                                selectedDate.getFullYear();

                            return (
                              <div key={idx} className={`csla-calendar-day    ${
                                c.current  ? "csla-calendar-day--current" : ""} 
                                ${isToday ? "csla-calendar-day--today" : ""} 
                                  ${
                                    isSelected ? "csla-calendar-day--selected" : "" }`}
                                onClick={() => handleSelectCalendarDay(c.day, c.current) }> {c.day}
                              </div>
                            );
                          })}
                        </div>

                        <div className="csla-calendar-footer">
                          <button type="button" className="csla-today-btn"  onClick={goToday} >  Today
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="csla-field">
                  <label className="csla-label">Reason (Optional)</label>
                  <input
                    type="text" name="reason" value={formData.reason}
                    onChange={handleChange} placeholder="Why assign this SLA?"
                    disabled={loading} className={`csla-input ${
                      loading ? "csla-input--disabled" : ""
                    }`}/>
                </div>

                <div className="csla-employee-info">
                  <p className="csla-employee-count">
                    {employeeCount} Employees
                  </p>
                  <small className="csla-employee-note">
                    SLA will be displayed to all employees
                  </small>
                </div>
              </form>
            )}
          </div>

          <div className="csla-footer">
            <button className={`csla-btn csla-btn--cancel ${
                loading ? "csla-btn--disabled" : ""}`} onClick={onClose}  disabled={loading}>
              Cancel
            </button>

            <button
              className={`csla-btn csla-btn--create ${
                loading || fetchLoading || employeeCount === 0
                  ? "csla-btn--disabled": ""}`}
              onClick={handleSubmit} disabled={loading || fetchLoading || employeeCount === 0}>
              {loading ? (
                <>
                  <span className="csla-btn-spinner" />
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
      </div>
    </>
  );
};

export default CreateSLAModal;
