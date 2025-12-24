import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Home,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import EditSLAModal from "../../components/sla/modals/EditSLAModal";
import CreateSLAModal from "../../components/sla/modals/CreateSLAModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import "./../../styles/sla/HRSLADashboard.css";

const HRSLADashboard = () => {
  const navigate = useNavigate();
  const [slas, setSlas] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [complianceFilter, setComplianceFilter] = useState("All");

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [slaToDelete, setSlaToDelete] = useState(null);

  // Custom dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchSLAs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [slas, activeSearchTerm, statusFilter, typeFilter, complianceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, statusFilter, typeFilter, complianceFilter, itemsPerPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".hr-sla-custom-select")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSLAs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await slaService.getAllSLAs();
      if (response && response.success) {
        const slaList = Array.isArray(response.data) ? response.data : [];
        setSlas(slaList);
      } else {
        setError("Failed to load SLAs");
        setSlas([]);
        toast.error("Failed to load SLAs");
      }
    } catch (err) {
      setError(err.message || "Failed to load SLAs");
      setSlas([]);
      toast.error(err.message || "Failed to load SLAs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...slas];

    if (activeSearchTerm) {
      filtered = filtered.filter(
        (sla) =>
          sla.employeeName
            ?.toLowerCase()
            .includes(activeSearchTerm.toLowerCase()) ||
          sla.slatype?.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          sla.slaid.toString().includes(activeSearchTerm)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((sla) => sla.status === statusFilter);
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter((sla) => sla.slatype === typeFilter);
    }

    if (complianceFilter !== "All") {
      filtered = filtered.filter(
        (sla) => sla.complianceStatus === complianceFilter
      );
    }

    setFilteredSlas(filtered);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setActiveSearchTerm(searchTerm.trim());
  };

  const handleCancelSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleEdit = (e, sla) => {
    e.stopPropagation();
    setSelectedSLA(sla);
    setShowEditModal(true);
  };

  const handleUpdate = async (slaid, updateData) => {
    try {
      const response = await slaService.updateSLA(slaid, updateData);
      if (response.success) {
        setShowEditModal(false);
        setSelectedSLA(null);
        fetchSLAs();
        toast.success("SLA updated successfully");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update SLA");
    }
  };

  const handleDelete = (e, sla) => {
    e.stopPropagation();
    setSlaToDelete(sla);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!slaToDelete) return;
    try {
      const response = await slaService.deleteSLA(slaToDelete.slaid);
      if (response.success) {
        fetchSLAs();
        toast.success("SLA deleted successfully");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete SLA");
    } finally {
      setShowConfirmModal(false);
      setSlaToDelete(null);
    }
  };

  const handleRowClick = (slaid) => {
    navigate(`/hr/dashboard/sla/details/${slaid}`);
  };

  const handleExport = () => {
    if (filteredSlas.length === 0) {
      toast.warning("No SLAs to export");
      return;
    }

    const csvData = filteredSlas.map((sla) => ({
      ID: sla.slaid,
      Employee: sla.employeeName,
      Department: sla.departmentName,
      Type: sla.slatype,
      Status: sla.status,
      Compliance: sla.complianceStatus,
      Deadline: formatDate(sla.deadline),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sla-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("SLAs exported successfully");
  };

  const calculateStats = () => ({
    total: slas.length,
    open: slas.filter((s) => s.status === "Open").length,
    closed: slas.filter((s) => s.status === "Closed").length,
    onTime: slas.filter((s) => s.complianceStatus === "OnTime").length,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "hr-sla-badge-open";
      case "Closed":
        return "hr-sla-badge-closed";
      case "In Progress":
      case "InProgress":
        return "hr-sla-badge-progress";
      default:
        return "hr-sla-badge-default";
    }
  };

  const getComplianceBadgeClass = (compliance) => {
    switch (compliance) {
      case "OnTime":
        return "hr-sla-badge-ontime";
      case "Breached":
        return "hr-sla-badge-breached";
      case "Extended":
        return "hr-sla-badge-extended";
      default:
        return "hr-sla-badge-default";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
    setComplianceFilter("All");
    toast.info("Filters cleared");
  };

  // Custom Select Component
const CustomSelect = ({ value, onChange, options, placeholder, name }) => {
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const isOpen = openDropdown === name;
  const selectedOption = options.find((opt) => opt.value === value);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  return (
    <div className="hr-sla-custom-select" ref={selectRef}>
      <button
        type="button"
        className={`hr-sla-custom-select-trigger ${
          selectedOption && selectedOption.value !== "All" ? "has-value" : ""
        }`}
        onClick={() => setOpenDropdown(isOpen ? null : name)}
      >
        <span
          className="hr-sla-custom-select-value"
          style={{ textAlign: "left", width: "100%" }} 
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`hr-sla-custom-select-icon ${isOpen ? "open" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="hr-sla-custom-select-dropdown"
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`hr-sla-custom-select-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpenDropdown(null);
              }}
              style={{ textAlign: "left" }}           
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "InProgress", label: "In Progress" },
  ];

  const typeOptions = [
    { value: "All", label: "All Types" },
    { value: "Timesheet Approvals", label: "Timesheet Approvals" },
    { value: "PerformanceForm", label: "Performance Form" },
    { value: "Review", label: "Review" },
    { value: "Goal", label: "Goal" },
  ];

  const complianceOptions = [
    { value: "All", label: "All Compliance" },
    { value: "OnTime", label: "On Time" },
    { value: "Breached", label: "Breached" },
    { value: "Extended", label: "Extended" },
  ];

  const safeTotal = filteredSlas.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));
  const startIndex = safeTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * itemsPerPage, safeTotal);
  const currentSLAs = filteredSlas.slice(startIndex, endIndex);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="hr-sla-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
          ></div>
          <p className="text-muted mt-3">Loading SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-sla-wrapper">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0 p-3 rounded hr-sla-breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard");
              }}
              className="hr-sla-breadcrumb-link"
            >
              <Home size={14} />
              Dashboard
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="hr-sla-breadcrumb-active">HR</span>
          </li>
        </ol>
      </nav>

     
      {error && (
        <div className="alert alert-danger hr-sla-alert-error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchSLAs}
            >
              Retry
            </button>
          </div>
        </div>
      )}

    
      <div className="row g-3 mb-3">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: FileText,
            bgColor: "#EEF2FF",
            iconColor: "#3B82F6",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            bgColor: "#E0E7FF",
            iconColor: "#4F46E5",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            bgColor: "#DCFCE7",
            iconColor: "#16A34A",
          },
          {
            label: "On Time",
            value: stats.onTime,
            icon: TrendingUp,
            bgColor: "#D1FAE5",
            iconColor: "#059669",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-3 col-md-6 col-sm-6">
            <div className="hr-sla-stat-card">
              <div
                className="hr-sla-stat-icon"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="hr-sla-stat-value">{value}</h3>
                <p className="hr-sla-stat-label">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

   
      <div className="hr-sla-filters-card">
        <div className="d-flex flex-wrap align-items-center gap-3">
         
          <div
            className="hr-sla-search-wrapper"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "280px",
              maxWidth: "100%",
            }}
          >
            <Search size={16} className="hr-sla-search-icon" />
            <input
              type="text"
              className="form-control hr-sla-search-input"
              placeholder="Search by employee name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              style={{
                paddingRight: "7.5rem",
              }}
            />

            {activeSearchTerm ? (
              <button
                type="button"
                onClick={handleCancelSearch}
                style={{
                  position: "absolute",
                  right: "3px",
                  top: "3px",
                  bottom: "3px",
                  background: "#6b7280",
                  border: "1px solid #6b7280",
                  color: "white",
                  borderRadius: "0 8px 8px 0",
                  padding: "0 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  zIndex: 1,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  fontFamily: "Poppins, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4b5563";
                  e.currentTarget.style.borderColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#6b7280";
                  e.currentTarget.style.borderColor = "#6b7280";
                }}
              >
                <X size={14} />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  position: "absolute",
                  right: "3px",
                  top: "3px",
                  bottom: "3px",
                  background: "#5a5486",
                  border: "none",
                  color: "white",
                  borderRadius: "0 8px 8px 0",
                  padding: "0 1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  zIndex: 1,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  fontFamily: "Poppins, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4a4076";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#5a5486";
                }}
              >
                <Search size={14} />
                Search
              </button>
            )}
          </div>

          {/* Status */}
          <div style={{ width: "170px", maxWidth: "100%" }}>
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="All Status"
              name="status"
            />
          </div>

          <div style={{ width: "200px", maxWidth: "100%" }}>
            <CustomSelect
              value={complianceFilter}
              onChange={setComplianceFilter}
              options={complianceOptions}
              placeholder="All Compliance"
              name="compliance"
            />
          </div>

          <div className="ms-auto d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-secondary hr-sla-btn-clear"
              onClick={clearFilters}
            >
              <Filter size={16} />
              Clear
            </button>
            <button
              className="btn btn-outline-success hr-sla-btn-export"
              onClick={handleExport}
            >
              <Download size={16} />
              Export
            </button>
            <button
              className="btn btn-primary hr-sla-btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Create SLA
            </button>
          </div>
        </div>
      </div>

  
      {currentSLAs.length === 0 ? (
        <div className="hr-sla-empty-state-wrapper">
          <div className="hr-sla-empty-state">
            <FileText size={64} className="hr-sla-empty-state__icon" />
            <h5 className="hr-sla-empty-state__title">
              {filteredSlas.length === 0 && slas.length > 0
                ? "No SLAs match your filters"
                : "No SLAs found"}
            </h5>
            <p className="hr-sla-empty-state__text">
              {filteredSlas.length === 0 && slas.length > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by creating your first SLA"}
            </p>
          </div>
        </div>
      ) : (
        <div className="hr-sla-table-wrapper">
          <div className="table-responsive">
            <table className="table table-hover mb-0 hr-sla-table">
              <thead className="hr-sla-table-header">
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Assigned To</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Compliance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSLAs.map((sla) => (
                  <tr
                    key={sla.slaid}
                    onClick={() => handleRowClick(sla.slaid)}
                    className="hr-sla-clickable-row"
                  >
                    <td>
                      <div className="hr-sla-employee-name">
                        {sla.employeeName}
                      </div>
                      <div className="hr-sla-employee-email">
                        {sla.employeeEmail}
                      </div>
                    </td>
                    <td>
                      <span className="hr-sla-badge hr-sla-badge-type">
                        {sla.slatype}
                      </span>
                    </td>
                    <td>
                      {sla.assignedToName ? (
                        <span className="hr-sla-assigned-name">
                          {sla.assignedToName}
                        </span>
                      ) : (
                        <span className="hr-sla-not-assigned">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div className="hr-sla-deadline-date">
                        {formatDate(sla.deadline)}
                      </div>
                      {sla.closedAt && (
                        <div className="hr-sla-closed-date">
                          Closed: {formatDate(sla.closedAt)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`hr-sla-badge ${getStatusBadgeClass(
                          sla.status
                        )}`}
                      >
                        {sla.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`hr-sla-badge ${getComplianceBadgeClass(
                          sla.complianceStatus
                        )}`}
                      >
                        {sla.complianceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="hr-sla-actions">
                        <button
                          className="btn btn-sm hr-sla-action-btn hr-sla-action-edit"
                          onClick={(e) => handleEdit(e, sla)}
                          title="Edit SLA"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-sm hr-sla-action-btn hr-sla-action-delete"
                          onClick={(e) => handleDelete(e, sla)}
                          title="Delete SLA"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

         
          {filteredSlas.length > 0 && (
            <div className="hr-sla-pagination-footer">
              <div className="hr-sla-pagination-left">
                <span className="hr-sla-pagination-text">Show</span>
                <select
                  className="hr-sla-pagination-dropdown"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="hr-sla-pagination-text">entries</span>
              </div>

              <div className="hr-sla-pagination-center">
                <span className="hr-sla-pagination-status">
                  Showing {safeTotal === 0 ? 0 : startIndex + 1} to {endIndex} of{" "}
                  {safeTotal} entries
                </span>
              </div>

              <div className="hr-sla-pagination-right">
                <ul className="hr-sla-pagination-list">
                  <li
                    className={`hr-sla-page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="hr-sla-page-link"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <li
                        key={page}
                        className={`hr-sla-page-item ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        <button
                          className="hr-sla-page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    )
                  )}
                  <li
                    className={`hr-sla-page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="hr-sla-page-link"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(totalPages, prev + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSlaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete SLA"
        message={
          slaToDelete
            ? `Are you sure you want to delete SLA #${slaToDelete.slaid} for ${slaToDelete.employeeName}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {showEditModal && selectedSLA && (
        <EditSLAModal
          sla={selectedSLA}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSLA(null);
          }}
          onUpdate={handleUpdate}
        />
      )}

      {showCreateModal && (
        <CreateSLAModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSLAs();
          }}
        />
      )}
    </div>
  );
};

export default HRSLADashboard;
