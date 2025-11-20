import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  RefreshCw,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  FileText,
  Send,
  Download,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import slaService, { escalationHelpers } from "../../services/sla/slaService";
import ManagerEscalationModal from "../../components/sla/modals/ManagerEscalationModal";
import ResolveEscalationModal from "../../components/sla/modals/ResolveEscalationModal";
import { formatDate } from "../../utils/sla/dateFormatter";
import Breadcrumb from "../../components/sla/common/Breadcrumbs";

const ManagerSLADashboard = () => {
  const navigate = useNavigate();

  const [allSLAs, setAllSLAs] = useState([]);
  const [managerSLAs, setManagerSLAs] = useState([]);
  const [managerEscalations, setManagerEscalations] = useState([]);
  const [filteredSlas, setFilteredSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceFilter, setComplianceFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("all");

  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedSLAForEscalation, setSelectedSLAForEscalation] =
    useState(null);
  const [selectedEscalationForResolve, setSelectedEscalationForResolve] =
    useState(null);
  const [deptHeads, setDeptHeads] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    managerSLAs,
    managerEscalations,
    searchTerm,
    statusFilter,
    complianceFilter,
    activeTab,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, complianceFilter, activeTab, itemsPerPage]);

  const fetchDeptHeads = async (departmentId) => {
    try {
      const res = await slaService.getDepartmentHeads(departmentId);

      if (res?.success && Array.isArray(res.data)) {
        setDeptHeads(res.data);
      } else {
        setDeptHeads([]);
      }
    } catch (err) {
      console.error("Error fetching dept heads:", err.message);
      setDeptHeads([]);
    }
  };

  const fetchManagerEscalations = async (managerId) => {
    try {
      const res = await slaService.getManagerEscalations(managerId);

      if (res?.success && Array.isArray(res.data)) {
        setManagerEscalations(res.data);
      } else {
        setManagerEscalations([]);
      }
    } catch (err) {
      console.error("Error fetching escalations:", err.message);
      setManagerEscalations([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem("user"));

      if (!userData?.empId) {
        setError("User not found in session");
        setLoading(false);
        return;
      }

      if (userData.departmentId) {
        fetchDeptHeads(userData.departmentId);
      }

      fetchManagerEscalations(userData.empId);

      const response = await slaService.getAllSLAs();

      if (response?.success && Array.isArray(response.data)) {
        setAllSLAs(response.data);

        const filtered = response.data.filter(
          (sla) => sla.assignedToEmployeeId === userData.empId
        );
        setManagerSLAs(filtered);
      } else {
        setAllSLAs([]);
        setManagerSLAs([]);
        setError("No data received from server");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load SLAs");
      setAllSLAs([]);
      setManagerSLAs([]);
    } finally {
      setLoading(false);
    }
  };

  const getTabData = () => {
    switch (activeTab) {
      case "open":
        return managerSLAs.filter(
          (s) => s.status === "Open" || s.status === "InProgress"
        );
      case "closed":
        return managerSLAs.filter((s) => s.status === "Closed");
      case "escalations":
        return managerEscalations;
      default:
        return managerSLAs;
    }
  };

  const applyFilters = () => {
    let result = getTabData();

    if (activeTab !== "escalations") {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (sla) =>
            sla.employeeName?.toLowerCase().includes(term) ||
            sla.departmentName?.toLowerCase().includes(term) ||
            sla.relatedEntityType?.toLowerCase().includes(term) ||
            sla.slaid?.toString().includes(term)
        );
      }

      if (statusFilter !== "All") {
        result = result.filter((sla) => sla.status === statusFilter);
      }

      if (complianceFilter !== "All") {
        result = result.filter(
          (sla) => sla.complianceStatus === complianceFilter
        );
      }
    } else {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (esc) =>
            esc.reason?.toLowerCase().includes(term) ||
            esc.employeeName?.toLowerCase().includes(term) ||
            esc.description?.toLowerCase().includes(term)
        );
      }

      if (statusFilter !== "All") {
        result = result.filter((esc) => esc.escalationStatus === statusFilter);
      }
    }

    setFilteredSlas(result);
  };

  const calculateStats = () => {
    return {
      total: managerSLAs.length,
      open: managerSLAs.filter(
        (s) => s.status === "Open" || s.status === "InProgress"
      ).length,
      escalated: managerSLAs.filter((s) => s.status === "Escalated").length,
      closed: managerSLAs.filter((s) => s.status === "Closed").length,
      escalations: managerEscalations.length,
      pending: managerEscalations.filter(
        (e) => e.escalationStatus === "Pending"
      ).length,
    };
  };

  const handleEscalateClick = (sla) => {
    if (!escalationHelpers.canEscalateToL2(sla, [sla])) {
      const reason = escalationHelpers.getEscalationBlockReason(
        sla,
        [sla],
        "L2"
      );
      toast.warning("Cannot Escalate", {
        description: reason || "This SLA cannot be escalated at this time.",
      });
      return;
    }

    setSelectedSLAForEscalation(sla);
    setShowEscalationModal(true);
  };

  const handleEscalateToDeptHead = async (payload) => {
    try {
      const res = await slaService.escalateToDeptHead(payload);

      if (res.success) {
        setShowEscalationModal(false);
        setSelectedSLAForEscalation(null);
        loadData();
      } else {
        throw new Error(res.message || "Failed to escalate");
      }
    } catch (err) {
      console.error("Escalation Error:", err);
      throw err;
    }
  };

  const handleResolveClick = (escalation) => {
    setSelectedEscalationForResolve(escalation);
    setShowResolveModal(true);
  };

  const handleResolveEscalation = async (payload) => {
    try {
      const res = await slaService.resolveEscalation(payload);

      if (res.success) {
        toast.success("Escalation Resolved!", {
          description: "The escalation has been resolved successfully.",
        });

        setShowResolveModal(false);
        setSelectedEscalationForResolve(null);
        loadData();
      } else {
        toast.error("Resolution Failed", {
          description: res.message || "Failed to resolve escalation.",
        });
      }
    } catch (err) {
      console.error("Resolve Error:", err);
      toast.error("Resolution Error", {
        description: err.message || "An error occurred while resolving.",
      });
    }
  };

  const handleExport = () => {
    if (filteredSlas.length === 0) {
      toast.warning("No Data to Export", {
        description: "There are no records to export.",
      });
      return;
    }

    let csvData, filename;

    if (activeTab === "escalations") {
      csvData = filteredSlas.map((esc) => ({
        ID: esc.escalationId,
        Employee: esc.employeeName,
        Reason: esc.reason,
        Level: esc.escalationLevel,
        Status: esc.escalationStatus,
        SubmittedAt: formatDate(esc.submittedAt),
        Description: esc.description,
      }));
      filename = `manager-escalations-${
        new Date().toISOString().split("T")[0]
      }.csv`;
    } else {
      csvData = filteredSlas.map((sla) => ({
        ID: sla.slaid,
        Employee: sla.employeeName,
        Department: sla.departmentName,
        Type: sla.relatedEntityType,
        Status: sla.status,
        Compliance: sla.complianceStatus,
        Deadline: formatDate(sla.deadline),
      }));
      filename = `manager-slas-${new Date().toISOString().split("T")[0]}.csv`;
    }

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
    a.download = filename;
    a.click();

    toast.success("Export Successful", {
      description: `${csvData.length} records exported to ${filename}`,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setComplianceFilter("All");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Open: "bg-primary",
      Pending: "bg-warning text-dark",
      Submitted: "bg-success",
      InProgress: "bg-info",
      Closed: "bg-success",
      Escalated: "bg-danger",
    };
    return statusMap[status] || "bg-secondary";
  };

  const getComplianceBadge = (compliance) => {
    const complianceMap = {
      OnTime: "bg-success",
      Breached: "bg-danger",
      Extended: "bg-warning text-dark",
      NotStarted: "bg-secondary",
    };
    return complianceMap[compliance] || "bg-secondary";
  };

  const getEscalationLevelColor = (level) => {
    switch (level) {
      case "L1":
        return "badge bg-info";
      case "L2":
        return "badge bg-warning text-dark";
      case "L3":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const stats = calculateStats();
  const totalPages = Math.ceil(filteredSlas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredSlas.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "600px" }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
        <Breadcrumb
  items={[
    { label: "SLA Management", path: "/hr/dashboard/sla" },
    { label: "Manager" }
  ]}
/>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
      
        <div>

          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            Track and manage all assigned SLAs
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={loadData}
            style={{
              backgroundColor: "transparent",
              border: "1.5px solid #0F62FE",
              color: "#0F62FE",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={handleExport}
            disabled={filteredSlas.length === 0}
            style={{
              backgroundColor: "transparent",
              border: "1.5px solid #24A148",
              color: "#24A148",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-3"
          role="alert"
          style={{ borderRadius: "8px", padding: "0.75rem 1rem" }}
        >
          <div className="d-flex align-items-start gap-2">
            <AlertTriangle size={18} style={{ marginTop: "2px" }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      {/* STATS CARDS */}
      <div className="row g-3 mb-3">
        {[
          {
            label: "Total SLAs",
            value: stats.total,
            icon: Users,
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
            label: "Escalated",
            value: stats.escalated,
            icon: AlertTriangle,
            bgColor: "#fee2e2",
            iconColor: "#E01950",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle,
            bgColor: "#dcfce7",
            iconColor: "#24A148",
          },
          {
            label: "Total Escalations",
            value: stats.escalations,
            icon: TrendingUp,
            bgColor: "#fef3c7",
            iconColor: "#E2B93B",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            bgColor: "#fef3c7",
            iconColor: "#D4941E",
          },
        ].map(({ label, value, icon: Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-2 col-md-4 col-6">
            <div
              className="card border-0 h-100"
              style={{
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div
                className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                style={{ padding: "1rem 0.75rem" }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: bgColor,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Icon size={24} color={iconColor} strokeWidth={2.5} />
                </div>
                <h3
                  className="fw-bold mb-1"
                  style={{
                    fontSize: "1.75rem",
                    color: "#0f172a",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "0.813rem",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div
        style={{
          backgroundColor: "#27235c",
          borderRadius: "10px 10px 0 0",
          padding: "0 1rem",
          marginBottom: 0,
        }}
      >
        <ul className="nav nav-tabs border-0 m-0" role="tablist">
          {[
            {
              key: "all",
              label: "All",
              icon: Users,
              count: managerSLAs.length,
            },
            { key: "open", label: "Open", icon: Clock, count: stats.open },
            {
              key: "closed",
              label: "Closed",
              icon: CheckCircle,
              count: stats.closed,
            },
            {
              key: "escalations",
              label: "Escalations",
              icon: TrendingUp,
              count: stats.escalations,
            },
          ].map(({ key, label, icon: Icon, count }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link border-0 d-flex align-items-center gap-2 ${
                  activeTab === key ? "active" : ""
                }`}
                onClick={() => setActiveTab(key)}
                style={{
                  color: activeTab === key ? "#fff" : "rgba(255,255,255,0.7)",
                  backgroundColor:
                    activeTab === key ? "rgba(255,255,255,0.1)" : "transparent",
                  borderBottom:
                    activeTab === key
                      ? "3px solid #fff"
                      : "3px solid transparent",
                  padding: "1rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
              >
                <Icon size={16} />
                {label} <span style={{ marginLeft: "4px" }}>({count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* FILTERS */}
      <div
        className="card border-0 shadow-sm mb-3"
        style={{ borderRadius: "0 0 10px 10px" }}
      >
        <div className="card-body" style={{ padding: "1rem" }}>
          <div className="row g-3">
            <div className="col-md-5">
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
                  className="form-control border-start-0"
                  placeholder={
                    activeTab === "escalations"
                      ? "Search by employee, reason, or description..."
                      : "Search by employee, department, type, or SLA ID..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    borderColor: "#e2e8f0",
                    fontSize: "0.875rem",
                  }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  borderRadius: "8px",
                  borderColor: "#e2e8f0",
                  fontSize: "0.875rem",
                }}
              >
                <option value="All">All Status</option>
                {activeTab === "escalations" ? (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </>
                ) : (
                  <>
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </>
                )}
              </select>
            </div>

            {activeTab !== "escalations" && (
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#e2e8f0",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="All">All Compliance</option>
                  <option value="OnTime">On Time</option>
                  <option value="Breached">Breached</option>
                  <option value="Extended">Extended</option>
                </select>
              </div>
            )}

            <div
              className={activeTab === "escalations" ? "col-md-4" : "col-md-1"}
            >
              <button
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                onClick={clearFilters}
                style={{
                  borderRadius: "8px",
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

      {/* DATA TABLE - FIXED (NO SCROLL) */}
      <div style={{ flex: 1 }}>
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "10px" }}
        >
          <div className="table-responsive">
            <table
              className="table table-hover align-middle mb-0"
              style={{ fontSize: "0.875rem" }}
            >
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  {activeTab === "escalations" ? (
                    <>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Employee
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Reason
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Level
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Submitted At
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          textAlign: "center",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Actions
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Employee
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        SLA's Department
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Deadline
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Compliance
                      </th>
                      <th
                        style={{
                          padding: "1rem",
                          fontSize: "0.813rem",
                          color: "#64748b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "2px solid #e2e8f0",
                          textAlign: "center",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        Actions
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center"
                      style={{ padding: "3rem" }}
                    >
                      {activeTab === "escalations" ? (
                        <>
                          <TrendingUp
                            size={56}
                            style={{ color: "#cbd5e1", opacity: 0.5 }}
                            className="mb-3"
                          />
                          <p
                            className="text-muted mb-0"
                            style={{ fontSize: "0.938rem" }}
                          >
                            No escalations yet
                          </p>
                        </>
                      ) : (
                        <>
                          <FileText
                            size={56}
                            style={{ color: "#cbd5e1", opacity: 0.5 }}
                            className="mb-3"
                          />
                          <h6
                            className="fw-bold mb-2"
                            style={{ color: "#64748b", fontSize: "1.125rem" }}
                          >
                            {managerSLAs.length === 0
                              ? "No SLAs assigned to you"
                              : "No SLAs match your filters"}
                          </h6>
                          {managerSLAs.length > 0 &&
                            filteredSlas.length === 0 && (
                              <button
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={clearFilters}
                                style={{ borderRadius: "6px" }}
                              >
                                Clear Filters
                              </button>
                            )}
                        </>
                      )}
                    </td>
                  </tr>
                ) : activeTab === "escalations" ? (
                  paginatedData.map((esc) => (
                    <tr
                      key={esc.escalationId}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <strong
                          style={{ fontSize: "0.875rem", color: "#0f172a" }}
                        >
                          {esc.employeeName || "—"}
                        </strong>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <strong
                          style={{ fontSize: "0.875rem", color: "#0f172a" }}
                        >
                          {esc.reason || "—"}
                        </strong>
                        <br />
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.813rem" }}
                        >
                          {esc.description || "—"}
                        </small>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <span
                          className={getEscalationLevelColor(
                            esc.escalationLevel
                          )}
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          {esc.escalationLevel}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <span
                          className={`badge ${
                            esc.escalationStatus === "Resolved"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          {esc.escalationStatus}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <small
                          style={{ fontSize: "0.813rem", color: "#475569" }}
                        >
                          {formatDate(esc.submittedAt)}
                        </small>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                            onClick={() =>
                              navigate(`/sla/manager/details/${esc.slaid}`)
                            }
                            title="View SLA details"
                            style={{
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "6px",
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {esc.escalationStatus === "Pending" && (
                            <button
                              className="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center"
                              onClick={() => handleResolveClick(esc)}
                              title="Resolve escalation"
                              style={{
                                width: "32px",
                                height: "32px",
                                padding: 0,
                                borderRadius: "6px",
                              }}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedData.map((sla) => (
                    <tr
                      key={`${sla.slaid}-${sla.employeeId}`}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <strong
                          style={{ fontSize: "0.875rem", color: "#0f172a" }}
                        >
                          {sla.employeeName || "—"}
                        </strong>
                        <br />
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.813rem" }}
                        >
                          {sla.employeeEmail || "—"}
                        </small>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <span
                          className="badge bg-light text-dark"
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontWeight: 600,
                          }}
                        >
                          {sla.departmentName || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <small
                          style={{ fontSize: "0.813rem", color: "#475569" }}
                        >
                          {sla.deadline ? formatDate(sla.deadline) : "—"}
                        </small>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <span
                          className={`badge ${getStatusBadge(sla.status)}`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          {sla.status || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <span
                          className={`badge ${getComplianceBadge(
                            sla.complianceStatus
                          )}`}
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          {sla.complianceStatus || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                            onClick={() =>
                              navigate(`/sla/manager/details/${sla.slaid}`)
                            }
                            title="View details"
                            style={{
                              width: "32px",
                              height: "32px",
                              padding: 0,
                              borderRadius: "6px",
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {sla.status !== "Closed" && (
                            <button
                              className="btn btn-sm btn-outline-warning d-inline-flex align-items-center justify-content-center"
                              onClick={() => handleEscalateClick(sla)}
                              title="Escalate to Department Head"
                              style={{
                                width: "32px",
                                height: "32px",
                                padding: 0,
                                borderRadius: "6px",
                              }}
                            >
                              <Send size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredSlas.length > 0 && (
            <div
              className="card-footer bg-white border-top"
              style={{ padding: "1rem 1.5rem" }}
            >
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* Left: Rows per page selector */}
                <div className="d-flex align-items-center gap-2">
                  <small
                    className="text-muted"
                    style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}
                  >
                    Rows per page:
                  </small>
                  <select
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    style={{
                      width: "80px",
                      borderRadius: "6px",
                      borderColor: "#e2e8f0",
                      fontSize: "0.875rem",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Center: Showing info */}
                <div>
                  <small
                    className="text-muted"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Showing <strong>{startIndex + 1}</strong> to{" "}
                    <strong>{Math.min(endIndex, filteredSlas.length)}</strong>{" "}
                    of <strong>{filteredSlas.length}</strong> entries
                  </small>
                </div>

                {/* Right: Pagination controls */}
                {totalPages > 1 && (
                  <nav aria-label="Page navigation">
                    <ul
                      className="pagination pagination-sm mb-0"
                      style={{ gap: "4px" }}
                    >
                      {/* Previous button */}
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link d-flex align-items-center justify-content-center"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            color: currentPage === 1 ? "#cbd5e1" : "#0F62FE",
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </li>

                      {/* Page numbers */}
                      {getPageNumbers().map((pageNum, index) =>
                        pageNum === "..." ? (
                          <li
                            key={`ellipsis-${index}`}
                            className="page-item disabled"
                          >
                            <span
                              className="page-link"
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#64748b",
                              }}
                            >
                              ...
                            </span>
                          </li>
                        ) : (
                          <li
                            key={pageNum}
                            className={`page-item ${
                              currentPage === pageNum ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(pageNum)}
                              style={{
                                width: "32px",
                                height: "32px",
                                padding: 0,
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                backgroundColor:
                                  currentPage === pageNum
                                    ? "#0F62FE"
                                    : "transparent",
                                color:
                                  currentPage === pageNum ? "#fff" : "#64748b",
                                fontWeight: currentPage === pageNum ? 600 : 400,
                                fontSize: "0.875rem",
                              }}
                            >
                              {pageNum}
                            </button>
                          </li>
                        )
                      )}

                      {/* Next button */}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link d-flex align-items-center justify-content-center"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            color:
                              currentPage === totalPages
                                ? "#cbd5e1"
                                : "#0F62FE",
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showEscalationModal && selectedSLAForEscalation && (
        <ManagerEscalationModal
          review={selectedSLAForEscalation}
          onClose={() => setShowEscalationModal(false)}
          onEscalate={handleEscalateToDeptHead}
          deptHeads={deptHeads}
        />
      )}

      {showResolveModal && selectedEscalationForResolve && (
        <ResolveEscalationModal
          escalation={selectedEscalationForResolve}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveEscalation}
        />
      )}

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ManagerSLADashboard;
