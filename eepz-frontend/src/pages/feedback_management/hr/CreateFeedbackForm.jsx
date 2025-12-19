// src/pages/feedback_management/forms/CreateFeedbackForm.jsx

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  ArrowLeft,
  Loader,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";

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

  // State
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

  // Form types
  const FORM_TYPES = [
    { value: "PerformanceReview", label: "Performance Review" },
    { value: "GeneralFeedback", label: "General Feedback" },
    { value: "BiasReview", label: "Bias Review" },
    { value: "ProfessionalismReview", label: "Professionalism Review" },
    { value: "SurveyForm", label: "Survey" },
    { value: "EvaluationForm", label: "Evaluation" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.feedback-custom-select')) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Custom Select Component
  const CustomSelect = ({ value, onChange, options, placeholder, disabled }) => {
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
    const selectedOption = options.find(opt => opt.value === value);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(() => {
      if (openDropdown && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [openDropdown]);

    const triggerStyles = {
      width: '100%',
      padding: '0.75rem 2.75rem 0.75rem 1rem',
      background: disabled ? '#F3F4F6' : (isHovered && !disabled ? '#F9FAFB' : 'white'),
      border: '1.5px solid',
      borderColor: openDropdown ? '#27235C' : (isHovered && !disabled ? '#9CA3AF' : '#E5E7EB'),
      borderRadius: '8px',
      fontSize: '1rem',
      color: disabled ? '#9CA3AF' : '#6B7280',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      fontWeight: 400,
      lineHeight: 1.5,
      minHeight: '48px',
      position: 'relative',
      boxShadow: openDropdown ? '0 0 0 3px rgba(39, 35, 92, 0.1)' : 'none',
    };

    const valueStyles = {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: value ? '#374151' : '#9CA3AF',
    };

    const iconStyles = {
      position: 'absolute',
      right: '1rem',
      transition: 'transform 0.2s ease',
      color: openDropdown ? '#27235C' : '#6B7280',
      flexShrink: 0,
      pointerEvents: 'none',
      transform: openDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
    };

    const dropdownStyles = {
      position: 'fixed',
      top: `${dropdownPosition.top}px`,
      left: `${dropdownPosition.left}px`,
      width: `${dropdownPosition.width}px`,
      background: 'white',
      border: '1.5px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
      zIndex: 9999,
      maxHeight: '280px',
      overflowY: 'auto',
      animation: 'feedbackDropdownFadeIn 0.15s ease',
      marginTop: '4px',
    };

    const getOptionStyles = (optionValue) => ({
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: (value === optionValue || hoveredOption === optionValue) ? '#FFFFFF' : '#374151',
      transition: 'all 0.12s ease',
      borderBottom: '1px solid #F3F4F6',
      background: (value === optionValue || hoveredOption === optionValue) ? '#27235C' : 'white',
      fontWeight: value === optionValue ? 600 : 400,
      lineHeight: 1.5,
    });

    return (
      <div className="feedback-custom-select" ref={selectRef} style={{ position: 'relative', width: '100%' }}>
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
          <ChevronDown 
            size={18} 
            style={iconStyles}
            strokeWidth={2}
          />
        </button>
        {openDropdown && !disabled && (
          <div 
            ref={dropdownRef}
            style={dropdownStyles}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                style={{
                  ...getOptionStyles(option.value),
                  borderTopLeftRadius: index === 0 ? '6px' : '0',
                  borderTopRightRadius: index === 0 ? '6px' : '0',
                  borderBottomLeftRadius: index === options.length - 1 ? '6px' : '0',
                  borderBottomRightRadius: index === options.length - 1 ? '6px' : '0',
                  borderBottom: index === options.length - 1 ? 'none' : '1px solid #F3F4F6',
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

  // Handle form submission using service
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
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

        // Reset form and navigate
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
    <div className="container-fluid py-4" style={{ maxWidth: "900px" }}>
      {/* ========== BREADCRUMB ========== */}
      <FeedbackBreadcrumb
        items={[
          { label: "Feedback Management", path: "/hr/dashboard/feedback" },
          { label: "Create Feedback Form" },
        ]}
      />

      {/* ERROR ALERT */}
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

      {/* SUCCESS ALERT */}
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

      {/* FORM CARD */}
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
            
         <label htmlFor="formName" className="form-label fw-bold"style={{ textAlign: 'left', display: 'block' }}>
            Form Name <span className="text-danger">*</span>
          </label>

              <input
                id="formName"
                type="text"
                className="form-control form-control-lg"
                value={form.formName}
                onChange={(e) => setForm({ ...form, formName: e.target.value })}
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
              
            <label htmlFor="formDescription" className="form-label fw-bold" style={{ textAlign: 'left', display: 'block' }}>
              Description <span className="text-danger">*</span>
            </label>

              <textarea
                id="formDescription"
                className="form-control"
                rows={4}
                value={form.formDescription}
                onChange={(e) =>
                  setForm({ ...form, formDescription: e.target.value })
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

            {/* FORM TYPE - CUSTOM DROPDOWN */}
            <div className="mb-4">
            
            <label htmlFor="formType" className="form-label fw-bold" style={{ textAlign: 'left', display: 'block' }}>
              Form Type <span className="text-danger">*</span>
           </label>
``

              <CustomSelect
                value={form.formType}
                onChange={(value) => setForm({ ...form, formType: value })}
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
             
           <label  htmlFor="deadline" className="form-label fw-bold" style={{ textAlign: 'left', display: 'block' }}>
              Response Deadline <span className="text-danger">*</span>
            </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  }}
                >
                  <Calendar size={16} />
                </span>
                <input
                  id="deadline"
                  type="datetime-local"
                  className="form-control form-control-lg"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  disabled={loading}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  }}
                />
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
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes feedbackDropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
