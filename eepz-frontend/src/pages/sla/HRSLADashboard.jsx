import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  X,
} from "lucide-react";
import slaService from "../../services/sla/slaService";
import Pagination from "../../components/project_management_components/common/Pagination";
import EditSLAModal from "../../components/sla/modals/EditSLAModal";
import CreateSLAModal from "../../components/sla/modals/CreateSLAModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import "./../../styles/sla/HRSLADashboard.css";

const HRSLADashboard = () => {
  const navigate = useNavigate();
  const [slas, setSlas] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [complianceFilter, setComplianceFilter] = useState("All");

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [slaToDelete, setSlaToDelete] = useState(null);

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchSLAs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [slas, searchTerm, statusFilter, typeFilter, complianceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, complianceFilter]);

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
      }
    } catch (err) {
      setError(err.message || "Failed to load SLAs");
      setSlas([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...slas];
    if (searchTerm) {
      filtered = filtered.filter(
        (sla) =>
          sla.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sla.slatype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sla.slaid.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== "All")
      filtered = filtered.filter((sla) => sla.status === statusFilter);
    if (typeFilter !== "All")
      filtered = filtered.filter((sla) => sla.slatype === typeFilter);
    if (complianceFilter !== "All")
      filtered = filtered.filter(
        (sla) => sla.complianceStatus === complianceFilter
      );
    setFilteredSlas(filtered);
  };

  const handleEdit = (sla) => {
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
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDelete = (sla) => {
    setSlaToDelete(sla);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!slaToDelete) return;
    try {
      const response = await slaService.deleteSLA(slaToDelete.slaid);
      if (response.success) {
        fetchSLAs();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setShowConfirmModal(false);
      setSlaToDelete(null);
    }
  };

  const handleViewDetails = (slaid) => {
    navigate(`/hr/dashboard/sla/details/${slaid}`);
  };

  const handleExport = () => {
    if (filteredSlas.length === 0) return;
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
  };

  const calculateStats = () => ({
    total: slas.length,
    open: slas.filter((s) => s.status === "Open").length,
    closed: slas.filter((s) => s.status === "Closed").length,
    breached: slas.filter((s) => s.complianceStatus === "Breached").length,
    onTime: slas.filter((s) => s.complianceStatus === "OnTime").length,
    extended: slas.filter((s) => s.complianceStatus === "Extended").length,
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
        return "sla-badge-open";
      case "Closed":
        return "sla-badge-closed";
      case "InProgress":
        return "sla-badge-progress";
      default:
        return "sla-badge-default";
    }
  };

  const getComplianceBadgeClass = (compliance) => {
    switch (compliance) {
      case "OnTime":
        return "sla-badge-ontime";
      case "Breached":
        return "sla-badge-breached";
      case "Extended":
        return "sla-badge-extended";
      default:
        return "sla-badge-default";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
    setComplianceFilter("All");
  };

  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSLAs = filteredSlas.slice(startIndex, endIndex);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="sla-loading-wrapper">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sla-dashboard-container">
      {/* Toast */}
      {showToast && (
        <div className="sla-toast">
          SLA deleted successfully!
          <button
            className="sla-toast-close"
            onClick={() => setShowToast(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <Breadcrumb
        items={[
          { label: "SLA Management", path: "/hr/dashboard/sla" },
          { label: "HR" },
        ]}
      />

      {/* Header */}
      <div className="sla-header">
        <p className="sla-header-subtitle">
          Manage all SLAs across the organization
        </p>
        <div className="sla-header-actions">
          <button className="sla-btn sla-btn-refresh" onClick={fetchSLAs}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="sla-btn sla-btn-export"
            onClick={handleExport}
            disabled={filteredSlas.length === 0}
          >
            <Download size={16} />
            Export
          </button>
          <button
            className="sla-btn sla-btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create SLA
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="sla-alert-error">
          <AlertTriangle size={20} className="sla-alert-icon" />
          <span>{error}</span>
          <button
            type="button"
            className="sla-alert-close"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
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
          {
            label: "Extended",
            value: stats.extended,
            icon: AlertTriangle,
            bgColor: "#FEF3C7",
            iconColor: "#D97706",
          },
          {
            label: "Breached",
            value: stats.breached,
            icon: AlertTriangle,
            bgColor: "#FEE2E2",
            iconColor: "#DC2626",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-md-2">
            <div className="sla-stat-card">
              <div
                className="sla-stat-icon"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <h2 className="sla-stat-value">{value}</h2>
              <p className="sla-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sla-filters-card">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="sla-search-wrapper">
              <Search size={16} className="sla-search-icon" />
              <input
                type="text"
                className="sla-search-input"
                placeholder="Search by employee, type, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <select
              className="sla-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="InProgress">In Progress</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="sla-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Timesheet Approvals">Timesheet Approvals</option>
              <option value="PerformanceForm">Performance Form</option>
              <option value="Review">Review</option>
              <option value="Goal">Goal</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="sla-select"
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
            >
              <option value="All">All Compliance</option>
              <option value="OnTime">On Time</option>
              <option value="Breached">Breached</option>
              <option value="Extended">Extended</option>
            </select>
          </div>
          <div className="col-md-1">
            <button
              className="sla-btn sla-btn-filter"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SLA Table */}
      <div className="sla-table-wrapper">
        <div className="table-responsive">
          <table className="sla-table">
            <thead>
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
              {currentSLAs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sla-table-empty">
                    <FileText size={48} className="sla-empty-icon" />
                    <p className="sla-empty-text">
                      {filteredSlas.length === 0 && slas.length > 0
                        ? "No SLAs match your filters"
                        : "No SLAs found"}
                    </p>
                    {filteredSlas.length === 0 && slas.length > 0 && (
                      <button
                        className="sla-btn sla-btn-clear-filters"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                currentSLAs.map((sla) => (
                  <tr key={sla.slaid}>
                    <td>
                      <div className="sla-employee-name">
                        {sla.employeeName}
                      </div>
                      <div className="sla-employee-email">
                        {sla.employeeEmail}
                      </div>
                    </td>
                    <td className="sla-cell-center">
                      <span className="sla-badge sla-badge-type">
                        {sla.slatype}
                      </span>
                    </td>
                    <td>
                      {sla.assignedToName ? (
                        <span className="sla-assigned-name">
                          {sla.assignedToName}
                        </span>
                      ) : (
                        <span className="sla-not-assigned">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div className="sla-deadline-date">
                        {formatDate(sla.deadline)}
                      </div>
                      {sla.closedAt && (
                        <div className="sla-closed-date">
                          Closed: {formatDate(sla.closedAt)}
                        </div>
                      )}
                    </td>
                    <td className="sla-cell-center">
                      <span
                        className={`sla-badge ${getStatusBadgeClass(
                          sla.status
                        )}`}
                      >
                        {sla.status}
                      </span>
                    </td>
                    <td className="sla-cell-center">
                      <span
                        className={`sla-badge ${getComplianceBadgeClass(
                          sla.complianceStatus
                        )}`}
                      >
                        {sla.complianceStatus}
                      </span>
                    </td>
                    <td className="sla-cell-center">
                      <div className="sla-actions">
                        <button
                          className="sla-action-btn sla-action-view"
                          onClick={() => handleViewDetails(sla.slaid)}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="sla-action-btn sla-action-edit"
                          onClick={() => handleEdit(sla)}
                          title="Edit SLA"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="sla-action-btn sla-action-delete"
                          onClick={() => handleDelete(sla)}
                          title="Delete SLA"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredSlas.length > itemsPerPage && (
          <div className="sla-pagination-wrapper">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredSlas.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
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
