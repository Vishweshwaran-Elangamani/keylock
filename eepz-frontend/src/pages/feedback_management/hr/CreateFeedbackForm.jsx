import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  Loader,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import CustomCalendar from "../../../components/project_management_components/common/CustomCalendar";
import "../../../styles/feedback/components/CreateFeedbackForm.css";

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

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

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
      if (!e.target.closest(".cff-custom-select")) setOpenDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

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

    return (
      <div className="cff-custom-select" ref={selectRef}>
        <button
          type="button"
          className={`cff-select-trigger ${
            disabled ? "cff-select-disabled" : ""
          } ${isHovered && !disabled ? "cff-select-hovered" : ""} ${
            openDropdown ? "cff-select-open" : ""
          }`}
          onClick={() => !disabled && setOpenDropdown(!openDropdown)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
        >
          <span
            className={`cff-select-value ${
              !value ? "cff-select-placeholder" : ""
            }`}
          >
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown size={18} className="cff-select-icon" strokeWidth={2} />
        </button>

        {openDropdown && !disabled && (
          <div
            ref={dropdownRef}
            className="cff-select-dropdown"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                className={`cff-select-option ${
                  value === option.value ? "cff-select-option-selected" : ""
                } ${
                  hoveredOption === option.value
                    ? "cff-select-option-hovered"
                    : ""
                } ${index === 0 ? "cff-select-option-first" : ""} ${
                  index === options.length - 1 ? "cff-select-option-last" : ""
                }`}
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

  const handleDeadlineChange = (value) => {
    setForm((prev) => ({ ...prev, deadline: value }));
    setCalendarOpen(false);
  };

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
    <div className="cff-page">
      <div className="cff-breadcrumb">
        <FeedbackBreadcrumb
          items={[
            { label: "Feedback Management", path: "/hr/dashboard/feedback" },
            { label: "Create Feedback Form" },
          ]}
        />

        {error && (
          <div className="cff-alert cff-alert-error">
            <AlertTriangle size={18} className="cff-alert-icon" />
            <div className="cff-alert-content">
              <strong>Error:</strong> {error}
            </div>
            <button
              type="button"
              className="cff-alert-close"
              onClick={() => setError("")}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="cff-alert cff-alert-success">
          <CheckCircle size={18} className="cff-alert-icon" />
          <div className="cff-alert-content">
            <strong>Success!</strong>
            <p className="cff-alert-message">{success}</p>
          </div>
        </div>
      )}

      <div className="cff-card">
        <div className="cff-card-body">
          <form onSubmit={handleSubmit} className="cff-form">
            <div className="cff-form-group">
              <label htmlFor="formName" className="cff-label">
                Form Name <span className="cff-required">*</span>
              </label>
              <input
                id="formName"
                type="text"
                className="cff-input"
                value={form.formName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, formName: e.target.value }))
                }
                placeholder="e.g., Q4 Performance Review"
                disabled={loading}
              />
              <small className="cff-hint">
                Give your form a clear, descriptive name
              </small>
            </div>

            <div className="cff-form-group">
              <label htmlFor="formDescription" className="cff-label">
                Description <span className="cff-required">*</span>
              </label>
              <textarea
                id="formDescription"
                className="cff-textarea"
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
              />
              <small className="cff-hint">
                Employees will see this description ({form.formDescription.length}
                /500 characters)
              </small>
            </div>

            <div className="cff-form-group">
              <label htmlFor="formType" className="cff-label">
                Form Type <span className="cff-required">*</span>
              </label>
              <CustomSelect
                value={form.formType}
                onChange={(value) => setForm((prev) => ({ ...prev, formType: value }))}
                options={FORM_TYPES}
                placeholder="-- Select Form Type --"
                disabled={loading}
              />
              <small className="cff-hint">
                Choose what type of feedback this form collects
              </small>
            </div>

            <div className="cff-form-group">
              <label htmlFor="deadline" className="cff-label">
                Response Deadline <span className="cff-required">*</span>
              </label>

              <div ref={calendarRef} className="cff-date-wrapper">
                <input
                  type="text"
                  readOnly
                  id="deadline"
                  value={formatDisplayDate(form.deadline)}
                  onClick={() => !loading && setCalendarOpen((o) => !o)}
                  placeholder="Select deadline date"
                  className="cff-input cff-date-input"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => !loading && setCalendarOpen((o) => !o)}
                  className={`cff-calendar-icon-btn ${
                    loading ? "cff-calendar-icon-btn--disabled" : ""
                  }`}
                  disabled={loading}
                >
                  <CalendarIcon size={18} />
                </button>
              </div>

             <CustomCalendar
  isOpen={calendarOpen}
  onClose={() => setCalendarOpen(false)}
  value={form.deadline}
  onChange={handleDeadlineChange}
  anchorRef={calendarRef}
  position="above-icon"
  align="right"
  offset={{ x: 0, y: -2 }}
/>



              <small className="cff-hint">
                When employees need to complete this form by
              </small>
            </div>

            <div className="cff-submit-wrapper">
              <button type="submit" className="cff-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="cff-submit-icon cff-spinner" />
                    Creating Form...
                  </>
                ) : (
                  <>
                    <Send size={18} className="cff-submit-icon" />
                    Create Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
