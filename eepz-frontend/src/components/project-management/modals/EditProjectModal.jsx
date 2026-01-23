import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  CheckCircle,
  AlertCircle,
  X,
  MessageSquare,
  Calendar,
} from "lucide-react";
import CustomCalendar from "../../../components/project-management/common/CustomCalendar";
import CustomDropdown from "../../../components/project-management/common/CustomDropdown";
import "../../../styles/projectmanagement/modals/EditProjectModal.css";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_ENGAGEMENT_MODEL_OPTIONS,
} from "../../../constants/project-management/projectConstants";

const DateInput = ({
  label,
  name,
  value,
  error,
  required,
  placeholder,
  onClick,
  inputRef,
}) => {
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  return (
    <div className="epm-date-wrapper">
      <label className="epm-label">
        {label} {required && <span className="epm-label-required">*</span>}
      </label>

      <div className="epm-date-input-wrapper" ref={inputRef}>
        <input
          type="text"
          name={name}
          value={value ? formatDateForInput(value) : ""}
          readOnly
          placeholder={placeholder || "mm/dd/yyyy"}
          onClick={onClick}
          required={required}
          className="epm-date-input"
        />
        <button type="button" className="epm-date-icon-btn" onClick={onClick}>
          <Calendar size={18} />
        </button>
      </div>

      {error && <div className="epm-field-error">{error}</div>}
    </div>
  );
};

const EditProjectModal = ({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  message,
  departments,
  businessUnits,
}) => {
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  const departmentOptions = useMemo(
    () =>
      departments?.map((dept) => ({
        value: dept.departmentName,
        label: dept.departmentName,
      })) || [],
    [departments]
  );

  const businessUnitOptions = useMemo(
    () => businessUnits?.map((bu) => bu) || [],
    [businessUnits]
  );

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "startDate") setStartCalendarOpen(false);
    else setEndCalendarOpen(false);
  };

  if (!show) return null;

  const modalContent = (
    <>
      <div className="epm-overlay" onClick={onClose} />

      <div className="epm-modal-shell" role="dialog" aria-modal="true">
        <div className="epm-modal-card">
          <div className="epm-modal-header">
            <h5 className="epm-modal-title">
              <MessageSquare size={22} />
              <span>Edit Project</span>
            </h5>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="epm-modal-close"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="epm-form">
            <div className="epm-body">
              {message && (
                <div
                  className={`epm-alert ${
                    message.type === "success"
                      ? "epm-alert--success"
                      : "epm-alert--error"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="epm-summary">
                <span className="epm-summary-text">
                  Project:{" "}
                  <span className="epm-summary-name">
                    {formData.projectName || "New Project"}
                  </span>
                </span>
              </div>

              <div className="epm-grid">
                <div className="epm-col">
                  <label className="epm-label">
                    Project Name
                    <span className="epm-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="epm-input"
                    value={formData.projectName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectName: e.target.value,
                      }))
                    }
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="epm-col">
                  <div className="epm-dd-slot">
                    <CustomDropdown
                      label="Status"
                      required
                      name="status"
                      value={formData.status}
                      onChange={(name, val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      options={PROJECT_STATUS_OPTIONS}
                      placeholder="Select Status"
                      align="left"
                    />
                  </div>
                </div>

                <div className="epm-col">
                  <label className="epm-label">Description</label>
                  <textarea
                    className="epm-textarea epm-textarea--half"
                    rows="3"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter project description"
                  />
                </div>

                <div className="epm-col">
                  <div className="epm-dd-slot">
                    <CustomDropdown
                      label="Business Unit"
                      required
                      name="businessUnit"
                      value={formData.businessUnit}
                      onChange={(name, val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      options={businessUnitOptions}
                      placeholder="Select Business Unit"
                      align="left"
                    />
                  </div>
                </div>

                <div className="epm-col">
                  <div className="epm-dd-slot">
                    <CustomDropdown
                      label="Department"
                      required
                      name="department"
                      value={formData.department}
                      onChange={(name, val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      options={departmentOptions}
                      placeholder="Select Department"
                      align="left"
                    />
                  </div>
                </div>

                <div className="epm-col">
                  <div className="epm-dd-slot">
                    <CustomDropdown
                      label="Engagement Model"
                      required
                      name="engagementModel"
                      value={formData.engagementModel}
                      onChange={(name, val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      options={PROJECT_ENGAGEMENT_MODEL_OPTIONS}
                      placeholder="Select Model"
                      align="left"
                    />
                  </div>
                </div>

                <div className="epm-col">
                  <DateInput
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    required
                    placeholder="Select start date"
                    onClick={() => setStartCalendarOpen((p) => !p)}
                    inputRef={startDateRef}
                  />
                </div>

                <div className="epm-col">
                  <DateInput
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    placeholder="Select end date"
                    onClick={() => setEndCalendarOpen((p) => !p)}
                    inputRef={endDateRef}
                  />
                </div>
              </div>
            </div>

            <div className="epm-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="epm-btn epm-btn--secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="epm-btn epm-btn--primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="epm-inline-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Update Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CustomCalendar
        isOpen={startCalendarOpen}
        onClose={() => setStartCalendarOpen(false)}
        value={formData.startDate}
        onChange={(value) => handleDateChange("startDate", value)}
        anchorRef={startDateRef}
        position="above-icon"
        align="right"
        offset={{ x: 0, y: 0 }}
      />

      <CustomCalendar
        isOpen={endCalendarOpen}
        onClose={() => setEndCalendarOpen(false)}
        value={formData.endDate}
        onChange={(value) => handleDateChange("endDate", value)}
        anchorRef={endDateRef}
        position="above-icon"
        align="right"
        offset={{ x: 0, y: -2 }}
        minDate={formData.startDate}
      />
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default EditProjectModal;
