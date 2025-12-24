// src/pages/feedback_management/forms/CreateFeedbackForm.jsx

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  Loader,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

const PRIMARY = "#27235C";

export default function CreateFeedbackForm() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1001,
        firstName: "Alice",
        lastName: "HR",
      },
    []
  );

  const [form, setForm] = useState({
    formName: "",
    formDescription: "",
    formType: "PerformanceReview",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);

  const FORM_TYPES = [
    { value: "PerformanceReview", label: "Performance Review" },
    { value: "GeneralFeedback", label: "General Feedback" },
    { value: "BiasReview", label: "Bias Review" },
    { value: "ProfessionalismReview", label: "Professionalism Review" },
    { value: "SurveyForm", label: "Survey" },
    { value: "EvaluationForm", label: "Evaluation" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".feedback-custom-select")) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


 // inside CreateFeedbackForm.jsx, keep everything else the same

const CustomSelect = ({ value, onChange, options, placeholder, disabled }) => {
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((opt) => opt.value === value);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);

  useEffect(() => {
    if (openDropdown && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [openDropdown]);

  const triggerStyles = {
    width: "100%",
    padding: "0.75rem 2.75rem 0.75rem 1rem",
    background: disabled
      ? "#F3F4F6"
      : isHovered && !disabled
      ? "#F9FAFB"
      : "white",
    border: "1.5px solid",
    borderColor: openDropdown
      ? PRIMARY
      : isHovered && !disabled
      ? "#9CA3AF"
      : "#E5E7EB",
    borderRadius: "8px",
    fontSize: "1rem",
    color: disabled ? "#9CA3AF" : "#6B7280",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.2s ease",
    textAlign: "left", // keep button content left
    fontWeight: 400,
    lineHeight: 1.5,
    minHeight: "48px",
    position: "relative",
    boxShadow: openDropdown ? "0 0 0 3px rgba(39, 35, 92, 0.1)" : "none",
    fontFamily:
      "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const valueStyles = {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: value ? "#374151" : "#9CA3AF",
    textAlign: "left",              // NEW: left align selected text
  };

  const iconStyles = {
    position: "absolute",
    right: "1rem",
    transition: "transform 0.2s ease",
    color: openDropdown ? PRIMARY : "#6B7280",
    flexShrink: 0,
    pointerEvents: "none",
    transform: openDropdown ? "rotate(180deg)" : "rotate(0deg)",
  };

  const dropdownStyles = {
    position: "fixed",
    top: `${dropdownPosition.top}px`,
    left: `${dropdownPosition.left}px`,
    width: `${dropdownPosition.width}px`,
    background: "white",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    boxShadow:
      "0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
    zIndex: 9999,
    maxHeight: "280px",
    overflowY: "auto",
    animation: "feedbackDropdownFadeIn 0.15s ease",
    marginTop: "4px",
    fontFamily:
      "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const getOptionStyles = (optionValue) => ({
    padding: "0.75rem 1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    color:
      value === optionValue || hoveredOption === optionValue
        ? "#FFFFFF"
        : "#374151",
    transition: "all 0.12s ease",
    borderBottom: "1px solid #F3F4F6",
    background:
      value === optionValue || hoveredOption === optionValue
        ? PRIMARY
        : "white",
    fontWeight: value === optionValue ? 600 : 400,
    lineHeight: 1.5,
    textAlign: "left",              // NEW: left align each option
  });

  return (
    <div
      className="feedback-custom-select"
      ref={selectRef}
      style={{ position: "relative", width: "100%" }}
    >
      <button
        type="button"
        style={triggerStyles}
        onClick={() => !disabled && setOpenDropdown(!openDropdown)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
      >
        <span style={valueStyles}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={18} style={iconStyles} strokeWidth={2} />
      </button>

      {openDropdown && !disabled && (
        <div ref={dropdownRef} style={dropdownStyles}>
          {options.map((option, index) => (
            <div
              key={option.value}
              style={{
                ...getOptionStyles(option.value),
                borderTopLeftRadius: index === 0 ? "6px" : "0",
                borderTopRightRadius: index === 0 ? "6px" : "0",
                borderBottomLeftRadius:
                  index === options.length - 1 ? "6px" : "0",
                borderBottomRightRadius:
                  index === options.length - 1 ? "6px" : "0",
                borderBottom:
                  index === options.length - 1
                    ? "none"
                    : "1px solid #F3F4F6",
              }}
              onClick={() => {
                onChange(option.value);
                setOpenDropdown(false);
              }}
              onMouseEnter={() => setHoveredOption(option.value)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);


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
      const base = form.deadline ? new Date(form.deadline) : new Date();
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
  const selectedDate = form.deadline ? new Date(form.deadline) : null;

  const monthNames = [
    "January","February","March","April","May","June", "July", "August", "September","October", "November", "December",
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelectCalendarDay = (day, current) => {
    if (!current) return;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    const value = `${yyyy}-${mm}-${dd}`;
    setForm((prev) => ({ ...prev, deadline: value }));
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
    setForm((prev) => ({ ...prev, deadline: `${yyyy}-${mm}-${dd}` }));
    setCalendarMonth(now.getMonth());
    setCalendarYear(now.getFullYear());
    setCalendarOpen(false);
  };

  // ========= Submit =========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.formName?.trim()) {
      setError("Form name is required");
      return;
    }
    if (!form.formDescription?.trim()) {
      setError("Form description is required");
      return;
    }
    if (!form.formType) {
      setError("Form type is required");
      return;
    }
    if (!form.deadline) {
      setError("Deadline is required");
      return;
    }

    setLoading(true);

    try {
      const createPayload = {
        formName: form.formName.trim(),
        formDescription: form.formDescription.trim(),
        formType: form.formType,
        createdByHRId: Number(user?.empId),
        deadline: new Date(form.deadline).toISOString(),
      };

      const response = await hrFormApi.createForm(createPayload);

      if (response?.success || response?.data?.success) {
        setSuccess(
          `Form created successfully!\n\n` +
            `Form: ${form.formName}\n` +
            `Type: ${
              FORM_TYPES.find((t) => t.value === form.formType)?.label
            }\n` +
            `Visible to: All Employees`
        );

        setTimeout(() => {
          setForm({
            formName: "",
            formDescription: "",
            formType: "PerformanceReview",
            deadline: "",
          });
          navigate("/hr/dashboard/feedback");
        }, 2500);
      } else {
        setError(response?.message || "Failed to create form");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 create-feedback-form-page" style={{ maxWidth: "900px" }}>
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: "/hr/dashboard/feedback" },
          { label: "Create Feedback Form" },
        ]}
      />

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <AlertTriangle
            size={18}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <CheckCircle
            size={18}
            className="me-2"
            style={{ display: "inline" }}
          />
          <strong>Success!</strong>
          <p className="mb-0 small mt-1" style={{ whiteSpace: "pre-wrap" }}>
            {success}
          </p>
        </div>
      )}

      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* FORM NAME */}
            <div className="mb-4">
              <label
                htmlFor="formName"
                className="form-label fw-bold"
                style={{ textAlign: "left", display: "block" }}
              >
                Form Name <span className="text-danger">*</span>
              </label>

              <input
                id="formName"
                type="text"
                className="form-control form-control-lg"
                value={form.formName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, formName: e.target.value }))
                }
                placeholder="e.g., Q4 Performance Review"
                disabled={loading}
                style={{ borderRadius: "var(--radius-md)" }}
              />
              <small className="text-muted">
                Give your form a clear, descriptive name
              </small>
            </div>

            {/* FORM DESCRIPTION */}
            <div className="mb-4">
              <label
                htmlFor="formDescription"
                className="form-label fw-bold"
                style={{ textAlign: "left", display: "block" }}
              >
                Description <span className="text-danger">*</span>
              </label>

              <textarea
                id="formDescription"
                className="form-control"
                rows={4}
                value={form.formDescription}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    formDescription: e.target.value,
                  }))
                }
                placeholder="Describe the purpose and goals of this form..."
                disabled={loading}
                maxLength={500}
                style={{ borderRadius: "var(--radius-md)", resize: "vertical" }}
              />
              <small className="text-muted">
                Employees will see this description (
                {form.formDescription.length}/500 characters)
              </small>
            </div>

            {/* FORM TYPE */}
            <div className="mb-4">
              <label
                htmlFor="formType"
                className="form-label fw-bold"
                style={{ textAlign: "left", display: "block" }}
              >
                Form Type <span className="text-danger">*</span>
              </label>

              <CustomSelect
                value={form.formType}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, formType: value }))
                }
                options={FORM_TYPES}
                placeholder="-- Select Form Type --"
                disabled={loading}
              />
              <small className="text-muted">
                Choose what type of feedback this form collects
              </small>
            </div>

            {/* DEADLINE */}
            <div className="mb-4">
              <label
                htmlFor="deadline"
                className="form-label fw-bold"
                style={{ textAlign: "left", display: "block" }}
              >
                Response Deadline <span className="text-danger">*</span>
              </label>

              <div
                ref={calendarRef}
                style={{ position: "relative", width: "100%" }}
              >
                <input
                  type="text"
                  readOnly
                  id="deadline"
                  value={formatDisplayDate(form.deadline)}
                  onClick={() => {
                    if (!loading) {
                      ensureCalendarMonthYear();
                      setCalendarOpen(true);
                    }
                  }}
                  placeholder="Select deadline date"
                  className="form-control form-control-lg"
                  style={{
                    borderRadius: "var(--radius-md)",
                    padding: "0.6rem 2.5rem 0.6rem 0.75rem",
                    cursor: "pointer",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      ensureCalendarMonthYear();
                      setCalendarOpen(true);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 10,
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: PRIMARY,
                  }}
                >
                  <CalendarIcon size={18} />
                </button>

                {calendarOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      right: 0,
                      marginBottom: 4,
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
                        <ChevronLeftIcon size={16} />
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

                        const isDisabled = !c.current;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              !isDisabled &&
                              handleSelectCalendarDay(c.day, c.current)
                            }
                            disabled={isDisabled}
                            style={{
                              border: "none",
                              backgroundColor: isSelected
                                ? PRIMARY
                                : isToday
                                ? "#e5e7eb"
                                : "transparent",
                              color: isSelected
                                ? "#ffffff"
                                : isDisabled
                                ? "#d1d5db"
                                : "#111827",
                              borderRadius: 6,
                              padding: "0.35rem 0",
                              fontSize: "0.8rem",
                              cursor: isDisabled ? "default" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {c.day}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        padding: "0.4rem 0.6rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <button
                        type="button"
                        onClick={goToday}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: PRIMARY,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(false)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#6b7280",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <small className="text-muted">
                When employees need to complete this form by
              </small>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-lg fw-bold"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
                  fontFamily:
                    "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(151, 36, 126, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(151, 36, 126, 0.2)";
                }}
              >
                {loading ? (
                  <>
                    <Loader
                      size={18}
                      className="me-2"
                      style={{
                        display: "inline",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Creating Form...
                  </>
                ) : (
                  <>
                    <Send
                      size={18}
                      className="me-1"
                      style={{ display: "inline" }}
                    />
                    Create Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .create-feedback-form-page,
        .create-feedback-form-page * {
          font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .create-feedback-form-page input,
        .create-feedback-form-page textarea,
        .create-feedback-form-page select,
        .create-feedback-form-page button {
          font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .create-feedback-form-page input::placeholder,
        .create-feedback-form-page textarea::placeholder {
          font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes feedbackDropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
