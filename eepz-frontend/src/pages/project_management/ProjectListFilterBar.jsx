import React, { useMemo } from "react";
import { Search, Filter, Plus, Users, X } from "lucide-react";
import CustomDropdown from "../../components/project-management/common/CustomDropdown";
import "../../styles/projectmanagement/components/ProjectListFilterBar.css";

const ProjectListFilterBar = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  filterStatus,
  setFilterStatus,
  onSearch,
  onCancelSearch,
  onSearchKeyPress,
  onNavigateResourcePool,
  onNavigateCreateProject,
}) => {
  const statusOptions = useMemo(
    () => [
      { value: "All", label: "All Status" },
      { value: "Active", label: "Active" },
      { value: "On Hold", label: "On Hold" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    []
  );

  return (
    <div className="prj-list-filter-bar">
      <div className="prj-list-filter-bar-content">
        <div className="prj-list-search-wrapper">
          <Search size={18} className="prj-list-search-icon" />

          <input
            type="text"
            className="prj-list-search-input"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={onSearchKeyPress}
          />

          {activeSearchTerm ? (
            <button
              className="prj-list-search-btn prj-list-search-btn-cancel"
              type="button"
              onClick={onCancelSearch}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          ) : (
            <button className="prj-list-search-btn" type="button" onClick={onSearch}>
              <Search size={16} />
              <span>Search</span>
            </button>
          )}
        </div>

        <div className="prj-list-status-filter-wrapper">
          <Filter size={18} className="prj-list-filter-icon" />

          <div className="prj-list-status-dropdown">
            <CustomDropdown
              name="status"
              value={filterStatus}
              options={statusOptions}
              placeholder="All Status"
              onChange={(name, val) => setFilterStatus(val)}
              className="prj-list-status-dropdown-comp"
              align="left"
              offset={{ x: 0, y: 6 }}
            />
          </div>
        </div>

        <div className="prj-list-actions-group">
         

          <button
            className="prj-list-btn prj-list-btn-create"
            type="button"
            onClick={onNavigateCreateProject}
          >
            <Plus size={20} />
            <span>Create Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectListFilterBar;
