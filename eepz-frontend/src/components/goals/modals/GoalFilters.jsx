// GoalFilters.jsx
import { useState, useRef, useEffect } from "react";
import {
  GOAL_STATUS,
  STATUS_LABELS,
} from "../../../constants/goals/goalConstants";
import styles from "../../../styles/goals/components/GoalFilters.module.css";

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

const FilterLabel = ({ field }) => {
  const config = LABEL_CONFIG[field];
  if (!config) return null;

  return (
    <label className={`${styles.filterLabel}`}>
      <i className={`bi ${config.icon} ${styles.labelIcon}`} />
      {config.text}
    </label>
  );
};

const CustomDropdown = ({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}) => {
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
    <div
      className={`${styles.dropdownContainer} ${
        disabled ? styles.disabled : ""
      }`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`${styles.dropdownButton} ${isOpen ? styles.open : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className={styles.dropdownText} title={displayText}>
          {displayText}
        </span>
        <i
          className={`bi bi-chevron-${isOpen ? "up" : "down"} ${
            styles.dropdownIcon
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`${styles.dropdownItem} ${
                value === option.value ? styles.active : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
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
      <div
        className={`${styles.backdrop} ${styles.fadeIn}`}
        onClick={onClose}
      />

      <div className={`${styles.modal} ${styles.show}`}>
        <div className={`${styles.dialog} ${styles.centered}`}>
          <div className={`${styles.content} ${styles.slideUp}`}>
            {/* Header */}
            <div className={styles.header}>
              <h5 className={styles.title}>
                <i className="bi bi-funnel" />
                Filter Goals
                {activeFilterCount > 0 && (
                  <span className={`${styles.activeCount}`}>
                    {activeFilterCount}
                  </span>
                )}
              </h5>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close filters"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Body */}
            <div className={styles.body}>
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
                <div className="col-md-6 mb-4">
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
                        className={`${styles.dateInput}`}
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
                        className={`${styles.dateInput}`}
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
            <div className={styles.footer}>
              <button
                type="button"
                className={`${styles.cancelButton} btn btn-outline-secondary`}
                onClick={onClose}
              >
                Cancel
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className={`${styles.clearButton} btn btn-outline-danger`}
                  onClick={handleClear}
                >
                  <i className="bi bi-x-circle" />
                  <span style={{ paddingLeft: "5px" }}>Clear All</span>
                </button>
              )}
              <button
                type="button"
                className={`${styles.applyButton} btn btn-primary`}
                onClick={handleApply}
              >
                <i className="bi bi-check-circle" />
                <span style={{ paddingLeft: "5px" }}>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalFilters;
