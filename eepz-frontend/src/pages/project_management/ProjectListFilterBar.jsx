import React, { useRef, useEffect } from "react";
import { Search, Filter, Plus, Users, X } from "lucide-react";
import "../../styles/projectmanagement/components/ProjectListFilterBar.css";

const ProjectListFilterBar = ({
  searchTerm,setSearchTerm,activeSearchTerm,
  filterStatus,setFilterStatus,onSearch,
  onCancelSearch,onSearchKeyPress,onNavigateResourcePool,
  onNavigateCreateProject,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        dropdownRef.current.classList.remove("prj-list-dropdown-open");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    dropdownRef.current?.classList.toggle("prj-list-dropdown-open");
  };

  const handleStatusSelect = (status) => {
    setFilterStatus(status);
    dropdownRef.current?.classList.remove("prj-list-dropdown-open");
  };

  return (
    <div className="prj-list-filter-bar">
      <div className="prj-list-filter-bar-content">
        <div className="prj-list-search-wrapper">
          <Search size={18} className="prj-list-search-icon" />
          <input type="text" className="prj-list-search-input" placeholder="Search projects..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={onSearchKeyPress}/>

          {activeSearchTerm ? (
            <button className="prj-list-search-btn prj-list-search-btn-cancel" type="button" onClick={onCancelSearch}>
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
          <div className="prj-list-custom-dropdown" ref={dropdownRef}>
            <div className="prj-list-custom-dropdown-selected" onClick={toggleDropdown}>
              <span>
                {filterStatus === "All" ? "All Status" : filterStatus}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                className="prj-list-dropdown-arrow">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2 5l6 6 6-6"/>
              </svg>
            </div>
            <div className="prj-list-custom-dropdown-options">
              {["All", "Active", "On Hold", "Completed", "Cancelled"].map(
                (status) => (
                  <div
                    key={status}
                    className={`prj-list-custom-option ${
                      filterStatus === status
                        ? "prj-list-option-selected"
                        : ""
                    }`}
                    onClick={() => handleStatusSelect(status)}>
                    {status === "All" ? "All Status" : status}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="prj-list-actions-group">
          <button
            className="prj-list-btn prj-list-btn-resource"
            type="button"
            onClick={onNavigateResourcePool} >
            <Users size={20} />
            <span>Resource Pool</span>
          </button>
          <button className="prj-list-btn prj-list-btn-create" type="button" onClick={onNavigateCreateProject} >
            <Plus size={20} />
            <span>Create Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectListFilterBar;
