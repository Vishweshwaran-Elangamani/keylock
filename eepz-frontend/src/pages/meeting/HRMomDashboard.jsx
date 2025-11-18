import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Users,
  Search,
  Filter,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  TrendingUp,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const HRMomDashboard = () => {
  const navigate = useNavigate();
  const [moms, setMoms] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    meetingType: "",
    departmentId: "",
    startDate: "",
    endDate: "",
    pageNumber: 1,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(false);
  const [totalMoms, setTotalMoms] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchMoms();
  }, [filters.pageNumber, filters.pageSize]);

  const fetchMoms = async () => {
    setLoading(true);
    try {
      const response = await momService.getAllMomsForHR(filters);

      if (response.success && response.data) {
        const momsData = response.data.moms || [];
        const total = response.data.totalCount || 0;
        const pages = response.data.totalPages || 0;

        setMoms(momsData);
        setTotalMoms(total);
        setTotalPages(pages);
      } else {
        setMoms([]);
        setTotalMoms(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Fetch MOMs error:", err);
      toastr.error("Failed to load MOMs");
      setMoms([]);
      setTotalMoms(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, pageNumber: 1 }));
    setTimeout(() => fetchMoms(), 100);
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: "",
      meetingType: "",
      departmentId: "",
      startDate: "",
      endDate: "",
      pageNumber: 1,
      pageSize: 20,
    });
    setTimeout(() => fetchMoms(), 100);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const getMeetingTypeBadge = (type) => {
    const badgeMap = {
      "One-on-One": "primary",
      "Team Meeting": "success",
      Presentation: "info",
      Other: "secondary",
    };
    return (
      <span className={`badge bg-${badgeMap[type] || "secondary"}`}>
        {type}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getThisMonthCount = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.filter((m) => {
      try {
        const today = new Date();
        const momDate = new Date(m.meetingDate);
        return (
          momDate.getMonth() === today.getMonth() &&
          momDate.getFullYear() === today.getFullYear()
        );
      } catch {
        return false;
      }
    }).length;
  };

  const getTeamMeetingCount = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.filter((m) => m.meetingType === "Team Meeting").length;
  };

  const getOneOnOneCount = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.filter((m) => m.meetingType === "One-on-One").length;
  };

  const getTotalActionItems = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.reduce((sum, mom) => {
      return (
        sum + (Array.isArray(mom.actionItems) ? mom.actionItems.length : 0)
      );
    }, 0);
  };

  const getOverdueActionItems = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.reduce((sum, mom) => {
      if (!Array.isArray(mom.actionItems)) return sum;
      return sum + mom.actionItems.filter((ai) => ai.isOverdue).length;
    }, 0);
  };

  const getTotalDiscussionPoints = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.reduce((sum, mom) => {
      return (
        sum +
        (Array.isArray(mom.discussionPoints) ? mom.discussionPoints.length : 0)
      );
    }, 0);
  };

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
                onClick={() => navigate(-1)}
                style={{ width: "40px", height: "40px", flexShrink: 0 }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2
                  className="fw-bold mb-1"
                  style={{ color: "#1e293b", fontSize: "1.75rem" }}
                >
                  HR MOM Dashboard
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                  Comprehensive view of all meeting minutes
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={fetchMoms}
                disabled={loading}
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => navigate("/hr/mom/reports")}
              >
                <BarChart3 size={18} />
                Reports
              </button>
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => toastr.info("Export functionality coming soon")}
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#e3f2fd",
                      }}
                    >
                      <FileText size={28} className="text-primary" />
                    </div>
                    <TrendingUp size={20} className="text-success" />
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {totalMoms}
                  </div>
                  <small className="text-muted fw-medium">Total MOMs</small>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#e8f5e9",
                      }}
                    >
                      <Calendar size={28} className="text-success" />
                    </div>
                    <Clock size={20} className="text-muted" />
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getThisMonthCount()}
                  </div>
                  <small className="text-muted fw-medium">This Month</small>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#e1f5fe",
                      }}
                    >
                      <Users size={28} className="text-info" />
                    </div>
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getTeamMeetingCount()}
                  </div>
                  <small className="text-muted fw-medium">Team Meetings</small>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#fff3e0",
                      }}
                    >
                      <User size={28} className="text-warning" />
                    </div>
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getOneOnOneCount()}
                  </div>
                  <small className="text-muted fw-medium">One-on-Ones</small>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#f3e5f5",
                      }}
                    >
                      <MessageSquare size={28} style={{ color: "#9c27b0" }} />
                    </div>
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getTotalDiscussionPoints()}
                  </div>
                  <small className="text-muted fw-medium">
                    Discussion Points
                  </small>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#e8f5e9",
                      }}
                    >
                      <CheckCircle size={28} className="text-success" />
                    </div>
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getTotalActionItems()}
                  </div>
                  <small className="text-muted fw-medium">Action Items</small>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#ffebee",
                      }}
                    >
                      <AlertCircle size={28} className="text-danger" />
                    </div>
                  </div>
                  <div
                    className="fw-bold fs-3 mb-1"
                    style={{ color: "#1e293b" }}
                  >
                    {getOverdueActionItems()}
                  </div>
                  <small className="text-muted fw-medium">Overdue Items</small>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                  <Filter size={20} />
                  Filters & Search
                </h6>
                <button
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </button>
              </div>

              {showFilters && (
                <div className="row g-3">
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label fw-semibold small">
                      <Search size={16} className="me-1" />
                      Search
                    </label>
                    <input
                      type="text"
                      name="searchTerm"
                      className="form-control"
                      placeholder="Search by title..."
                      value={filters.searchTerm}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <label className="form-label fw-semibold small">
                      Meeting Type
                    </label>
                    <select
                      name="meetingType"
                      className="form-select"
                      value={filters.meetingType}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Types</option>
                      <option value="Team Meeting">Team Meeting</option>
                      <option value="One-on-One">One-on-One</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6 col-lg-2">
                    <label className="form-label fw-semibold small">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="col-md-6 col-lg-2">
                    <label className="form-label fw-semibold small">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="col-md-6 col-lg-2">
                    <label className="form-label fw-semibold small">
                      Per Page
                    </label>
                    <select
                      name="pageSize"
                      className="form-select"
                      value={filters.pageSize}
                      onChange={handleFilterChange}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={handleApplyFilters}
                        disabled={loading}
                      >
                        <Search size={16} />
                        Apply
                      </button>
                      <button
                        className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={handleResetFilters}
                        disabled={loading}
                      >
                        <RefreshCw size={16} />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th
                        className="fw-semibold ps-4 py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        MEETING DETAILS
                      </th>
                      <th
                        className="fw-semibold py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        SUBMITTED BY
                      </th>
                      <th
                        className="fw-semibold py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        MEETING DATE
                      </th>
                      <th
                        className="fw-semibold text-center py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        PARTICIPANTS
                      </th>
                      <th
                        className="fw-semibold text-center py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        TOPICS
                      </th>
                      <th
                        className="fw-semibold text-center py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        ACTIONS
                      </th>
                      <th
                        className="fw-semibold pe-4 py-3"
                        style={{
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        VIEW
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted mt-3 mb-0">
                            Loading MOMs...
                          </p>
                        </td>
                      </tr>
                    ) : !Array.isArray(moms) || moms.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <FileText
                            size={48}
                            className="mb-3 text-muted"
                            style={{ opacity: 0.3 }}
                          />
                          <h6 className="text-muted mb-2">No MOMs Found</h6>
                          <p className="text-muted small mb-0">
                            {filters.searchTerm ||
                            filters.meetingType ||
                            filters.startDate ||
                            filters.endDate
                              ? "Try adjusting your filters"
                              : "No meeting minutes yet"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      moms.map((mom) => (
                        <tr key={mom.momId}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded d-flex align-items-center justify-content-center"
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  backgroundColor: "#e0f2fe",
                                  flexShrink: 0,
                                }}
                              >
                                <FileText
                                  size={24}
                                  style={{ color: "#0284c7" }}
                                />
                              </div>
                              <div>
                                <div
                                  className="fw-semibold"
                                  style={{ color: "#1e293b" }}
                                >
                                  {mom.meetingTitle}
                                </div>
                                <div className="mt-1">
                                  {getMeetingTypeBadge(mom.meetingType)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: "#f1f5f9",
                                  flexShrink: 0,
                                }}
                              >
                                <User size={16} style={{ color: "#64748b" }} />
                              </div>
                              <div>
                                <div
                                  className="fw-medium small"
                                  style={{ color: "#1e293b" }}
                                >
                                  {mom.submittedByEmployeeName || "Unknown"}
                                </div>
                                <small className="text-muted">
                                  {mom.submittedByRole || "Employee"}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <Calendar size={16} className="text-muted" />
                              <span className="text-muted small">
                                {formatDateTime(mom.meetingDate)}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <div
                              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded"
                              style={{ backgroundColor: "#f1f5f9" }}
                            >
                              <Users size={18} style={{ color: "#0284c7" }} />
                              <span
                                className="fw-semibold"
                                style={{ color: "#1e293b" }}
                              >
                                {Array.isArray(mom.attendees)
                                  ? mom.attendees.length
                                  : 0}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <div
                              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded"
                              style={{ backgroundColor: "#f1f5f9" }}
                            >
                              <MessageSquare
                                size={18}
                                style={{ color: "#06b6d4" }}
                              />
                              <span
                                className="fw-semibold"
                                style={{ color: "#1e293b" }}
                              >
                                {Array.isArray(mom.discussionPoints)
                                  ? mom.discussionPoints.length
                                  : 0}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <div
                              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded"
                              style={{ backgroundColor: "#f1f5f9" }}
                            >
                              <CheckCircle
                                size={18}
                                style={{ color: "#10b981" }}
                              />
                              <span
                                className="fw-semibold"
                                style={{ color: "#1e293b" }}
                              >
                                {Array.isArray(mom.actionItems)
                                  ? mom.actionItems.length
                                  : 0}
                              </span>
                            </div>
                          </td>
                          <td className="pe-4 py-3">
                            <button
                              className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2"
                              style={{
                                backgroundColor: "#4f46e5",
                                color: "white",
                                borderRadius: "6px",
                              }}
                              onClick={() =>
                                navigate(`/hr/dasboard/meetmom/${mom.momId}`)
                              }
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {!loading &&
            Array.isArray(moms) &&
            moms.length > 0 &&
            totalPages > 1 && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="text-muted small">
                      Showing {(filters.pageNumber - 1) * filters.pageSize + 1}{" "}
                      to{" "}
                      {Math.min(
                        filters.pageNumber * filters.pageSize,
                        totalMoms
                      )}{" "}
                      of {totalMoms} MOMs
                    </div>
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${
                            filters.pageNumber <= 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link d-flex align-items-center gap-1"
                            onClick={() =>
                              handlePageChange(filters.pageNumber - 1)
                            }
                            disabled={filters.pageNumber <= 1}
                          >
                            <ChevronLeft size={16} />
                            Previous
                          </button>
                        </li>

                        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = idx + 1;
                          } else if (filters.pageNumber <= 3) {
                            pageNum = idx + 1;
                          } else if (filters.pageNumber >= totalPages - 2) {
                            pageNum = totalPages - 4 + idx;
                          } else {
                            pageNum = filters.pageNumber - 2 + idx;
                          }

                          return (
                            <li
                              key={pageNum}
                              className={`page-item ${
                                filters.pageNumber === pageNum ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}

                        <li
                          className={`page-item ${
                            filters.pageNumber >= totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link d-flex align-items-center gap-1"
                            onClick={() =>
                              handlePageChange(filters.pageNumber + 1)
                            }
                            disabled={filters.pageNumber >= totalPages}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HRMomDashboard;
