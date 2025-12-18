import { useState, useRef, useEffect } from "react";
import {
  GOAL_STATUS,
  STATUS_LABELS,
} from "../../../constants/goals/goalConstants";

// Extracted config constants
const DATE_RANGE_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const LABEL_CONFIG = {
  status: { icon: "bi-flag", text: "Status" },
  projectId: { icon: "bi-folder", text: "Project" },
  dateRange: { icon: "bi-calendar-range", text: "Date Range" },
  dateFrom: { icon: "bi-calendar-event", text: "From Date" },
  dateTo: { icon: "bi-calendar-check", text: "To Date" },
};

// Utility function for date calculations
const getDateRange = (range) => {
  if (range === "custom" || range === "") {
    return { dateRange: range, dateFrom: "", dateTo: "" };
  }

  const today = new Date();
  const dateTo = today.toISOString().split("T")[0];
  let dateFrom = "";

  const dayDiffs = { today: 0, week: 7, month: 30 };
  if (dayDiffs[range] !== undefined) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayDiffs[range]);
    dateFrom = date.toISOString().split("T")[0];
  }

  return { dateRange: range, dateFrom, dateTo };
};

// Reusable label component
const FilterLabel = ({ field }) => {
  const config = LABEL_CONFIG[field];
  if (!config) return null;

  return (
    <label
      className="form-label mb-2"
      style={{ 
        fontWeight: 600, 
        fontSize: "0.875rem",
        color: "#374151"
      }}
    >
      <i className={`bi ${config.icon} me-1`} style={{ color: "rgb(39, 35, 92)" }} />
      {config.text}
    </label>
  );
};

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "0.875rem",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "#fff",
          color: "rgb(39, 35, 92)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "500",
          transition: "all 0.2s",
          opacity: disabled ? 0.6 : 1,
          textAlign: "left",
          height: "38px",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "rgb(39, 35, 92)";
            e.currentTarget.style.backgroundColor = "rgba(39, 35, 92, 0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.backgroundColor = "#fff";
          }
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayText}
        </span>
        <i
          className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
          style={{ fontSize: "0.7rem", marginLeft: "0.5rem", flexShrink: 0 }}
        ></i>
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: "fixed",  
            top: dropdownRef.current?.getBoundingClientRect().bottom + 4 || 0,
            left: dropdownRef.current?.getBoundingClientRect().left || 0,
            width: dropdownRef.current?.getBoundingClientRect().width || "auto",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            zIndex: 9999, 
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            overflow: "hidden",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                padding: "0.625rem 0.875rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "#212529",
                textAlign: "left",
                transition: "all 0.2s",
                background: value === option.value ? "#f3f4f6" : "#fff",
                fontWeight: value === option.value ? "600" : "500",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgb(39, 35, 92)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  value === option.value ? "#f3f4f6" : "#fff";
                e.currentTarget.style.color = "#212529";
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GoalFilters = ({ isOpen, onClose, filters, onApply, projects = [] }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    setLocalFilters({ ...localFilters, [field]: value });
  };

  const activeFilterCount = Object.values(localFilters).filter(
    (v) => v !== "" && v !== null
  ).length;

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...Object.entries(GOAL_STATUS).map(([key, value]) => ({
      value,
      label: STATUS_LABELS[value] || value,
    })),
  ];

  const projectOptions = [
    { value: "", label: "All Projects" },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const handleDateRangeChange = (range) => {
    setLocalFilters({
      ...localFilters,
      ...getDateRange(range),
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      status: "",
      projectId: "",
      dateRange: "",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(clearedFilters);
    onApply(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Custom Input Styling */
          .goal-filter-input {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: rgb(39, 35, 92);
            background-color: #fff;
            transition: all 0.2s ease;
            height: 38px;
          }

          .goal-filter-input:hover {
            border-color: rgb(39, 35, 92);
            background-color: rgba(39, 35, 92, 0.05);
          }

          .goal-filter-input:focus {
            border-color: rgb(39, 35, 92);
            box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.1);
            outline: none;
            background-color: #fff;
          }

          /* Custom Scrollbar for dropdown */
          .goal-filter-input::-webkit-scrollbar {
            width: 6px;
          }

          .goal-filter-input::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .goal-filter-input::-webkit-scrollbar-thumb {
            background: rgb(39, 35, 92);
            border-radius: 10px;
          }

          .goal-filter-input::-webkit-scrollbar-thumb:hover {
            background: rgb(30, 26, 71);
          }
        `}
      </style>

      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040, animation: "fadeIn 0.2s ease-in-out" }}
      />

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div
            className="modal-content"
            style={{
              borderRadius: "12px",
              animation: "slideUp 0.3s ease-out",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                borderBottom: "2px solid #e5e7eb",
                backgroundColor: "rgb(39, 35, 92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
              }}
            >
              <h5
                className="modal-title"
                style={{ fontWeight: 600, color: "white", margin: 0 }}
              >
                <i className="bi bi-funnel me-2" />
                Filter Goals
                {activeFilterCount > 0 && (
                  <span
                    className="badge bg-light text-dark ms-2"
                    style={{ 
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      fontWeight: 600
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </h5>
              <button
                type="button"
                className="btn-close-white"
                onClick={onClose}
                style={{
                  border: "none",
                  width: "36px",
                  backgroundColor: "transparent",
                  height: "36px",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ff4444";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: "1.5rem", overflow: "visible" }}>
              <div className="row g-3">
                {/* Status Filter */}
                <div className="col-md-6">
                  <FilterLabel field="status" />
                  <CustomDropdown
                    value={localFilters.status || ""}
                    onChange={(value) => handleChange("status", value)}
                    options={statusOptions}
                    placeholder="All Statuses"
                  />
                </div>

                {/* Project Filter */}
                <div className="col-md-6">
                  <FilterLabel field="projectId" />
                  <CustomDropdown
                    value={localFilters.projectId || ""}
                    onChange={(value) => handleChange("projectId", value)}
                    options={projectOptions}
                    disabled={projects.length === 0}
                    placeholder="All Projects"
                  />
                </div>

                {/* Date Range */}
                <div className="col-12">
                  <FilterLabel field="dateRange" />
                  <CustomDropdown
                    value={localFilters.dateRange || ""}
                    onChange={handleDateRangeChange}
                    options={DATE_RANGE_OPTIONS}
                    placeholder="All Time"
                  />
                </div>

                {/* Custom Date Range */}
                {localFilters.dateRange === "custom" && (
                  <>
                    <div className="col-md-6">
                      <FilterLabel field="dateFrom" />
                      <input
                        type="date"
                        className="form-control goal-filter-input"
                        value={localFilters.dateFrom || ""}
                        onChange={(e) =>
                          handleChange("dateFrom", e.target.value)
                        }
                        max={localFilters.dateTo || undefined}
                      />
                    </div>
                    <div className="col-md-6">
                      <FilterLabel field="dateTo" />
                      <input
                        type="date"
                        className="form-control goal-filter-input"
                        value={localFilters.dateTo || ""}
                        onChange={(e) => handleChange("dateTo", e.target.value)}
                        min={localFilters.dateFrom || undefined}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{ 
                borderTop: "2px solid #e5e7eb",
                padding: "1rem 1.5rem"
              }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                style={{
                  fontWeight: 500,
                  padding: "0.5rem 1rem",
                }}
              >
                Cancel
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleClear}
                  style={{
                    fontWeight: 500,
                    padding: "0.5rem 1rem",
                  }}
                >
                  <i className="bi bi-x-circle me-2" />
                  Clear All
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                  fontWeight: 500,
                  padding: "0.5rem 1.25rem",
                }}
              >
                <i className="bi bi-check-circle me-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalFilters;
