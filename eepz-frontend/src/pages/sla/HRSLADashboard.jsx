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
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import EditSLAModal from "../../components/sla/modals/EditSLAModal";
import CreateSLAModal from "../../components/sla/modals/CreateSLAModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import CustomDropdown from "../../components/project_management_components/common/CustomDropdown";
import "./../../styles/sla/components/HRSLADashboard.css";

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

  const statusFilterRef = useRef(null);
  const complianceFilterRef = useRef(null);
  const entriesRef = useRef(null);

  useEffect(() => {
    fetchSLAs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [slas, activeSearchTerm, statusFilter, typeFilter, complianceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, statusFilter, typeFilter, complianceFilter, itemsPerPage]);

  const fetchSLAs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await slaService.getAllSLAs();
      if (response?.success) {
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
      const q = activeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (sla) =>
          sla.employeeName?.toLowerCase().includes(q) ||
          sla.slatype?.toLowerCase().includes(q) ||
          String(sla.slaid).includes(activeSearchTerm)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((sla) => sla.status === statusFilter);
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter((sla) => sla.slatype === typeFilter);
    }

    if (complianceFilter !== "All") {
      filtered = filtered.filter((sla) => sla.complianceStatus === complianceFilter);
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

  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "InProgress", label: "In Progress" },
  ];

  const complianceOptions = [
    { value: "All", label: "All Compliance" },
    { value: "OnTime", label: "On Time" },
    { value: "Breached", label: "Breached" },
    { value: "Extended", label: "Extended" },
  ];

  const entriesOptions = [5, 10, 25, 50].map((n) => ({
    value: n,
    label: String(n),
  }));

  const safeTotal = filteredSlas.length;
  const totalPages = Math.max(1, Math.ceil(safeTotal / itemsPerPage));
  const startIndex = safeTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex =
    safeTotal === 0 ? 0 : Math.min(currentPage * itemsPerPage, safeTotal);
  const currentSLAs = filteredSlas.slice(startIndex, endIndex);

  const getVisiblePageNumbers = () => {
    const pages = [];
    const maxVisible = 2;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage === 1) pages.push(1, 2);
      else if (currentPage === totalPages) pages.push(totalPages - 1, totalPages);
      else pages.push(currentPage, currentPage + 1);
    }
    return pages;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="hr-sla-wrapper">
        <div className="hr-sla-loading-center">
          <div className="hr-sla-spinner" />
          <p className="hr-sla-loading-text">Loading SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-sla-wrapper">
      <nav aria-label="breadcrumb" className="hr-sla-breadcrumb-nav">
        <ol className="hr-sla-breadcrumb-list">
          <li className="hr-sla-breadcrumb-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/hr/dashboard");
              }}
              className="hr-sla-breadcrumb-link"
            >
              <Home size={18} />
            </a>
          </li>
          <li className="hr-sla-breadcrumb__separator">/</li>
          <li className="hr-sla-breadcrumb-item">
            <span className="hr-sla-breadcrumb-active">HR</span>
          </li>
        </ol>
      </nav>

      {error && (
        <div className="hr-sla-alert-error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button className="hr-sla-alert-retry-btn" onClick={fetchSLAs}>
            Retry
          </button>
        </div>
      )}

      <div className="hr-sla-stats-grid">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: FileText,
            iconClass: "hr-sla-stat-bg-total",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            iconClass: "hr-sla-stat-bg-open",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            iconClass: "hr-sla-stat-bg-closed",
          },
          {
            label: "On Time",
            value: stats.onTime,
            icon: TrendingUp,
            iconClass: "hr-sla-stat-bg-ontime",
          },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="hr-sla-stat-col">
            <div className="hr-sla-stat-card">
              <div className={`hr-sla-stat-icon ${iconClass}`}>
                <Icon size={28} strokeWidth={2.5} />
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
        <div className="hr-sla-filters-row">
          <div className="hr-sla-search-wrapper">
            <div className="hr-sla-search-icon">
              <Search size={16} />
            </div>

            <input
              type="text"
              className="hr-sla-search-input"
              placeholder="Search by employee name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />

            <div className="hr-sla-search-separator" />

            {activeSearchTerm ? (
              <button
                type="button"
                className="hr-sla-search-action-btn hr-sla-search-clear-btn"
                onClick={handleCancelSearch}
              >
                <X size={14} /> Cancel
              </button>
            ) : (
              <button
                type="button"
                className="hr-sla-search-action-btn hr-sla-search-btn"
                onClick={handleSearch}
              >
                <Search size={10} /> Search
              </button>
            )}
          </div>

          <div className="hr-sla-filter-status" ref={statusFilterRef}>
            <CustomDropdown
              label=""
              name="statusFilter"
              value={statusFilter}
              onChange={(_, v) => setStatusFilter(v)}
              options={statusOptions}
              placeholder="All Status"
              anchorRef={statusFilterRef}
              align="left"
              className="hr-sla-dd"
            />
          </div>

          <div className="hr-sla-filter-compliance" ref={complianceFilterRef}>
            <CustomDropdown
              label=""
              name="complianceFilter"
              value={complianceFilter}
              onChange={(_, v) => setComplianceFilter(v)}
              options={complianceOptions}
              placeholder="All Compliance"
              anchorRef={complianceFilterRef}
              align="left"
              className="hr-sla-dd"
            />
          </div>

          <div className="hr-sla-filter-actions">
            <button className="hr-sla-btn-clear" onClick={clearFilters}>
              <Filter size={16} /> Clear
            </button>

            <button className="hr-sla-btn-export" onClick={handleExport}>
              <Download size={16} /> Export
            </button>

            <button className="hr-sla-btn-create" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create SLA
            </button>
          </div>
        </div>
      </div>

      {currentSLAs.length === 0 ? (
        <div className="hr-sla-empty-state-wrapper">
          <div className="hr-sla-empty-state">
            <FileText size={64} className="hr-sla-empty-state-icon" />
            <h5 className="hr-sla-empty-state-title">
              {filteredSlas.length === 0 && slas.length > 0
                ? "No SLAs match your filters"
                : "No SLAs found"}
            </h5>
            <p className="hr-sla-empty-state-text">
              {filteredSlas.length === 0 && slas.length > 0
                ? "Try adjusting your search criteria or filters"
                : "Get started by creating your first SLA"}
            </p>
          </div>
        </div>
      ) : (
        <div className="hr-sla-table-wrapper">
          <div className="hr-sla-table-responsive">
            <table className="hr-sla-table">
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
                      <div className="hr-sla-employee-name">{sla.employeeName}</div>
                      <div className="hr-sla-employee-email">{sla.employeeEmail}</div>
                    </td>

                    <td>
                      <span className="hr-sla-badge hr-sla-badge-type">{sla.slatype}</span>
                    </td>

                    <td>
                      {sla.assignedToName ? (
                        <span className="hr-sla-assigned-name">{sla.assignedToName}</span>
                      ) : (
                        <span className="hr-sla-not-assigned">Not assigned</span>
                      )}
                    </td>

                    <td>
                      <div className="hr-sla-deadline-date">{formatDate(sla.deadline)}</div>
                      {sla.closedAt && (
                        <div className="hr-sla-closed-date">Closed: {formatDate(sla.closedAt)}</div>
                      )}
                    </td>

                    <td>
                      <span className={`hr-sla-badge ${getStatusBadgeClass(sla.status)}`}>
                        {sla.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`hr-sla-badge ${getComplianceBadgeClass(sla.complianceStatus)}`}
                      >
                        {sla.complianceStatus}
                      </span>
                    </td>

                    <td>
                      <div className="hr-sla-actions">
                        <button
                          className="hr-sla-action-btn hr-sla-action-edit"
                          onClick={(e) => handleEdit(e, sla)}
                          title="Edit SLA"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          className="hr-sla-action-btn hr-sla-action-delete"
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

                <div ref={entriesRef} className="hr-sla-entries-dd">
                  <CustomDropdown
                    label=""
                    name="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(_, v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                    options={entriesOptions}
                    placeholder="5"
                    anchorRef={entriesRef}
                    align="left"
                    className="hr-sla-dd-small"
                  />
                </div>

                <span className="hr-sla-pagination-text">entries</span>
              </div>

              <div className="hr-sla-pagination-center">
                <span className="hr-sla-pagination-status">
                  Showing {safeTotal === 0 ? 0 : startIndex + 1} to {endIndex} of {safeTotal}{" "}
                  entries
                </span>
              </div>

              <div className="hr-sla-pagination-right">
                <ul className="hr-sla-pagination-list">
                  <li className={`hr-sla-page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="hr-sla-page-link"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                  </li>

                  {getVisiblePageNumbers().map((page) => (
                    <li
                      key={page}
                      className={`hr-sla-page-item ${currentPage === page ? "active" : ""}`}
                    >
                      <button className="hr-sla-page-link" onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}

                  <li className={`hr-sla-page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="hr-sla-page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
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
