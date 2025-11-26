import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import slaService from "../../services/sla/slaService";
import Pagination from "../../components/project_management_components/common/Pagination";
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
  const [itemsPerPage] = useState(5);

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
    onTime: slas.filter((s) => s.complianceStatus === "On Time").length,
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
    setStatusFilter("All");
    setTypeFilter("All");
    setComplianceFilter("All");
    toast.info("Filters cleared");
  };

  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSLAs = filteredSlas.slice(startIndex, endIndex);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="hr-sla-wrapper h-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
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
              <Home size={14} />Dashboard
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <span className="hr-sla-breadcrumb-active">HR</span>
          </li>
        </ol>
      </nav>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger hr-sla-alert-error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchSLAs}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards - Only 4 */}
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
              <div className="hr-sla-stat-icon" style={{ backgroundColor: bgColor }}>
                <Icon size={28} color={iconColor} strokeWidth={2.5} />
              </div>
              <h3 className="hr-sla-stat-value">{value}</h3>
              <p className="hr-sla-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters with Buttons */}
      <div className="hr-sla-filters-card">
        <div className="row g-3 align-items-center">
          <div className="col-lg-3 col-md-6">
            <div className="hr-sla-search-wrapper">
              <Search size={16} className="hr-sla-search-icon" />
              <input
                type="text"
                className="form-control hr-sla-search-input"
                placeholder="Search by employee, type, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select hr-sla-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="InProgress">In Progress</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select hr-sla-select"
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
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select hr-sla-select"
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
            >
              <option value="All">All Compliance</option>
              <option value="OnTime">On Time</option>
              <option value="Breached">Breached</option>
              <option value="Extended">Extended</option>
            </select>
          </div>
          <div className="col-lg-3 col-md-12">
            <div className="hr-sla-filter-actions">
              <button className="btn btn-outline-secondary hr-sla-btn-clear" onClick={clearFilters}>
                <Filter size={16} />
                Clear
              </button>
              <button className="btn btn-outline-success hr-sla-btn-export" onClick={handleExport} disabled={filteredSlas.length === 0}>
                <Download size={16} />
                Export
              </button>
              <button className="btn btn-primary hr-sla-btn-create" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Create SLA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Table */}
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
              {currentSLAs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="hr-sla-table-empty">
                    <FileText size={48} className="hr-sla-empty-icon" />
                    <p className="hr-sla-empty-text">
                      {filteredSlas.length === 0 && slas.length > 0
                        ? "No SLAs match your filters"
                        : "No SLAs found"}
                    </p>
                    {filteredSlas.length === 0 && slas.length > 0 && (
                      <button className="btn btn-outline-primary" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                currentSLAs.map((sla) => (
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
                      <span className={`hr-sla-badge ${getComplianceBadgeClass(sla.complianceStatus)}`}>
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
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredSlas.length > itemsPerPage && (
          <div className="hr-sla-pagination-wrapper">
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
        <div>
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
      </div>

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
