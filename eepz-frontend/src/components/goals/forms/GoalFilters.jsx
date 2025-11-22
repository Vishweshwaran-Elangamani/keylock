import { useState } from "react";
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
      className="form-label"
      style={{ fontWeight: 600, fontSize: "0.875rem" }}
    >
      <i className={`bi ${config.icon} me-1`} />
      {config.text}
    </label>
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

  const statusOptions = Object.entries(GOAL_STATUS).map(([key, value]) => ({
    value,
    label: STATUS_LABELS[value] || value,
  }));

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
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: "12px" }}>
            {/* Header */}
            <div
              className="modal-header"
              style={{ borderBottom: "2px solid #dee2e6", backgroundColor: "rgb(39, 35, 92)" }}
            >
              <h5 className="modal-title" style={{ fontWeight: 600 }}>
                <i className="bi bi-funnel me-2" />
                Filter Goals
                {activeFilterCount > 0 && (
                  <span
                    className="badge bg-primary ms-2"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {activeFilterCount} active
                  </span>
                )}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: "1.5rem" }}>
              <div className="row g-3">
                {/* Status Filter */}
                <div className="col-md-6">
                  <FilterLabel field="status" />
                  <select
                    className="form-select"
                    value={localFilters.status || ""}
                    onChange={(e) => handleChange("status", e.target.value)}
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="">All Statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div className="col-md-6">
                  <FilterLabel field="projectId" />
                  <select
                    className="form-select"
                    value={localFilters.projectId || ""}
                    onChange={(e) => handleChange("projectId", e.target.value)}
                    style={{ borderRadius: "8px" }}
                    disabled={projects.length === 0}
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="col-12">
                  <FilterLabel field="dateRange" />
                  <select
                    className="form-select"
                    value={localFilters.dateRange || ""}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    style={{ borderRadius: "8px" }}
                  >
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                {localFilters.dateRange === "custom" && (
                  <>
                    <div className="col-md-6">
                      <FilterLabel field="dateFrom" />
                      <input
                        type="date"
                        className="form-control"
                        value={localFilters.dateFrom || ""}
                        onChange={(e) =>
                          handleChange("dateFrom", e.target.value)
                        }
                        max={localFilters.dateTo || undefined}
                        style={{ borderRadius: "8px" }}
                      />
                    </div>
                    <div className="col-md-6">
                      <FilterLabel field="dateTo" />
                      <input
                        type="date"
                        className="form-control"
                        value={localFilters.dateTo || ""}
                        onChange={(e) => handleChange("dateTo", e.target.value)}
                        min={localFilters.dateFrom || undefined}
                        style={{ borderRadius: "8px" }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{ borderTop: "2px solid #dee2e6" }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleClear}
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
                  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)"
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
