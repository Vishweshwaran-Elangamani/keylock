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
} from "lucide-react";
import slaService from "../../services/sla/slaService";
import Pagination from "../../components/project_management_components/common/Pagination";
import EditSLAModal from "../../components/sla/modals/EditSLAModal";
import CreateSLAModal from "../../components/sla/modals/CreateSLAModal";
import ConfirmationModal from "../../components/goals/modals/ConfirmationModal";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";
import './../../styles/sla/HRSLADashboard.css';

const cardBorder = "1.5px solid #a21caf";
const cardRadius = "14px";

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
      console.error('Update error:', err);
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
      }
    } catch (err) {
      console.error('Delete error:', err);
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
        return "bg-primary";
      case "Closed":
        return "bg-success";
      case "InProgress":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getComplianceBadgeClass = (compliance) => {
    switch (compliance) {
      case "OnTime":
        return "bg-success";
      case "Breached":
        return "bg-danger";
      case "Extended":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "600px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: "1.5rem 1.5rem" }}>
      <Breadcrumb
        items={[
          { label: "SLA Management", path: "/hr/dashboard/sla" },
          { label: "HR" }
        ]}
      />

      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{ paddingBottom: "0.5rem" }}
      >
        <div>
          <p
            className="text-muted mb-0"
            style={{ fontSize: "0.938rem", color: "#64748b" }}
          >
            Manage all SLAs across the organization
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={fetchSLAs}
            style={{
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "1.5px solid #0F62FE",
              color: "#0F62FE",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0F62FE";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#0F62FE";
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="btn btn-outline-success d-flex align-items-center gap-2"
            onClick={handleExport}
            disabled={filteredSlas.length === 0}
            style={{
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "1.5px solid #24A148",
              color: "#24A148",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "#24A148";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#24A148";
              }
            }}
          >
            <Download size={16} />
            Export
          </button>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => setShowCreateModal(true)}
            style={{
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "0.875rem",
              fontWeight: 600,
              backgroundColor: "#27235c",
              color: "#fff",
              border: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1e1b4d";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#27235c";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={16} />
            Create SLA
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-4 d-flex align-items-center"
          role="alert"
          style={{
            borderRadius: cardRadius,
            border: "1px solid #fee2e2",
            backgroundColor: "#fef2f2",
          }}
        >
          <AlertTriangle
            size={20}
            className="me-2"
            style={{ flexShrink: 0, color: "#dc2626" }}
          />
          <span style={{ color: "#991b1b" }}>{error}</span>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: FileText,
            bgColor: "#dbeafe",
            iconColor: "#0F62FE",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Clock,
            bgColor: "#e0e7ff",
            iconColor: "#4f46e5",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            bgColor: "#dcfce7",
            iconColor: "#24A148",
          },
          {
            label: "On Time",
            value: stats.onTime,
            icon: TrendingUp,
            bgColor: "#d1fae5",
            iconColor: "#059669",
          },
          {
            label: "Extended",
            value: stats.extended,
            icon: AlertTriangle,
            bgColor: "#fef3c7",
            iconColor: "#E2B93B",
          },
          {
            label: "Breached",
            value: stats.breached,
            icon: AlertTriangle,
            bgColor: "#fee2e2",
            iconColor: "#E01950",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-md-2">
            <div className="card sla-stat-card">
              <div
                className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                style={{ padding: "1.5rem 1rem" }}
              >
                <div
                  className="d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: bgColor,
                    borderRadius: "12px",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={28} color={iconColor} strokeWidth={2.5} />
                </div>
                <h2
                  className="fw-bold mb-2"
                  style={{
                    fontSize: "2.25rem",
                    color: "#0f172a",
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {value}
                </h2>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: "0.01em",
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card sla-filter-card mb-4">
        <div className="card-body" style={{ padding: "1.25rem" }}>
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span
                  className="input-group-text bg-white border-end-0"
                  style={{
                    borderRadius: "8px 0 0 8px",
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 sla-filter-input"
                  placeholder="Search by employee, type, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderRadius: "0 8px 8px 0",
                  }}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select sla-filter-select"
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
                className="form-select sla-filter-select"
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
                className="form-select sla-filter-select"
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
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                onClick={clearFilters}
                style={{
                  borderRadius: "8px",
                  padding: "0.5rem",
                  height: "38px",
                  borderColor: "#e2e8f0",
                }}
                title="Clear all filters"
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Table */}
      <div className="card sla-table-card">
        <div className="card-body p-0">
          <div className="table-responsive sla-table-responsive">
            <table className="table table-hover align-middle mb-0 sla-table">
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
                    <td colSpan="7" className="sla-empty-state">
                      <FileText size={56} className="sla-empty-icon" />
                      <p className="sla-empty-text">
                        {filteredSlas.length === 0 && slas.length > 0
                          ? "No SLAs match your filters"
                          : "No SLAs found"}
                      </p>
                      {filteredSlas.length === 0 && slas.length > 0 && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={clearFilters}
                          style={{ borderRadius: "6px", padding: "8px 20px" }}
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
                        <div>
                          <strong className="sla-employee-name">
                            {sla.employeeName}
                          </strong>
                          <small className="sla-employee-email">
                            {sla.employeeEmail}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info sla-badge">
                          {sla.slatype}
                        </span>
                      </td>
                      <td>
                        {sla.assignedToName ? (
                          <small className="sla-assigned-name">
                            {sla.assignedToName}
                          </small>
                        ) : (
                          <small className="sla-not-assigned">
                            Not assigned
                          </small>
                        )}
                      </td>
                      <td>
                        <div>
                          <small className="sla-deadline-date">
                            {formatDate(sla.deadline)}
                          </small>
                          {sla.closedAt && (
                            <small className="sla-closed-date">
                              Closed: {formatDate(sla.closedAt)}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(sla.status)} sla-badge`}>
                          {sla.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getComplianceBadgeClass(sla.complianceStatus)} sla-badge`}>
                          {sla.complianceStatus}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary sla-action-btn"
                            onClick={() => handleViewDetails(sla.slaid)}
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning sla-action-btn"
                            onClick={() => handleEdit(sla)}
                            title="Edit SLA"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger sla-action-btn"
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
            <div className="sla-pagination-container">
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
      </div>

      {/* Confirmation Modal for Delete */}
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

      {/* Edit SLA Modal */}
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

      {/* Create SLA Modal */}
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
