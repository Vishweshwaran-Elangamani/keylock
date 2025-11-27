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
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./../../styles/mom/HRMomDashboard.css";
import Breadcrumb from "../../components/feedback_management/common/FeedbackBreadcrumb";

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
  const [showFilters, setShowFilters] = useState(false);

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
      <span className={`badge bg-${badgeMap[type] || "secondary"} mom-badge`}>
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

  return (
    <div className="mom-dashboard-container">
      <div className="mom-dashboard-wrapper">
        {/* Header Section */}
        <div className="mom-header">
          <Breadcrumb
            items={[
              { label: "Meetings and MoM", href: "/hr/dashboard/mom" },
              { label: "HR" },
            ]}
          />
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-3">
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="card mom-stat-card">
              <div className="card-body">
                <div className="mom-stat-content">
                  <div
                    className="mom-stat-icon"
                    style={{ backgroundColor: "#e3f2fd" }}
                  >
                    <FileText size={24} className="text-primary" />
                  </div>
                  <div className="mom-stat-info">
                    <div className="mom-stat-value">{totalMoms}</div>
                    <div className="mom-stat-label">Total MOMs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="card mom-stat-card">
              <div className="card-body">
                <div className="mom-stat-content">
                  <div
                    className="mom-stat-icon"
                    style={{ backgroundColor: "#e8f5e9" }}
                  >
                    <Calendar size={24} className="text-success" />
                  </div>
                  <div className="mom-stat-info">
                    <div className="mom-stat-value">{getThisMonthCount()}</div>
                    <div className="mom-stat-label">This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="card mom-stat-card">
              <div className="card-body">
                <div className="mom-stat-content">
                  <div
                    className="mom-stat-icon"
                    style={{ backgroundColor: "#e8f5e9" }}
                  >
                    <CheckCircle size={24} className="text-success" />
                  </div>
                  <div className="mom-stat-info">
                    <div className="mom-stat-value">{getTotalActionItems()}</div>
                    <div className="mom-stat-label">Action Items</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="card mom-stat-card">
              <div className="card-body">
                <div className="mom-stat-content">
                  <div
                    className="mom-stat-icon"
                    style={{ backgroundColor: "#ffebee" }}
                  >
                    <AlertCircle size={24} className="text-danger" />
                  </div>
                  <div className="mom-stat-info">
                    <div className="mom-stat-value">{getOverdueActionItems()}</div>
                    <div className="mom-stat-label">Overdue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card mom-table-card mb-3">
          <div className="card-body p-0">
            <div className="mom-table-wrapper">
              <table className="table mom-table mb-0">
                <thead>
                  <tr>
                    <th>Meeting Details</th>
                    <th>Submitted By</th>
                    <th>Meeting Date</th>
                    <th>Participants</th>
                    <th>Topics</th>
                    <th>Actions</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0 small">
                          Loading MOMs...
                        </p>
                      </td>
                    </tr>
                  ) : !Array.isArray(moms) || moms.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="mom-empty-state">
                        <FileText
                          size={40}
                          className="mb-2 text-muted"
                          style={{ opacity: 0.3 }}
                        />
                        <h6 className="text-muted mb-1">No MOMs Found</h6>
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
                        {/* Meeting Details */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="mom-table-icon">
                              <FileText size={20} style={{ color: "#0284c7" }} />
                            </div>
                            <div>
                              <div className="mom-meeting-title">
                                {mom.meetingTitle}
                              </div>
                              <div className="mt-1">
                                {getMeetingTypeBadge(mom.meetingType)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Submitted By */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="mom-submitter-avatar">
                              <User size={16} style={{ color: "#4f46e5" }} />
                            </div>
                            <div>
                              <div className="mom-submitter-name">
                                {mom.submittedByEmployeeName || "Unknown"}
                              </div>
                              <small className="mom-submitter-role">
                                {mom.submittedByRole || "Employee"}
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* Meeting Date */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Calendar size={14} className="text-muted" />
                            <span className="mom-meeting-date">
                              {formatDateTime(mom.meetingDate)}
                            </span>
                          </div>
                        </td>

                        {/* Participants */}
                        <td>
                          <div className="mom-count-badge">
                            <Users size={14} style={{ color: "#0284c7" }} />
                            <span>
                              {Array.isArray(mom.attendees)
                                ? mom.attendees.length
                                : 0}
                            </span>
                          </div>
                        </td>

                        {/* Topics */}
                        <td>
                          <div className="mom-count-badge">
                            <MessageSquare size={14} style={{ color: "#06b6d4" }} />
                            <span>
                              {Array.isArray(mom.discussionPoints)
                                ? mom.discussionPoints.length
                                : 0}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="mom-count-badge">
                            <CheckCircle size={14} style={{ color: "#10b981" }} />
                            <span>
                              {Array.isArray(mom.actionItems)
                                ? mom.actionItems.length
                                : 0}
                            </span>
                          </div>
                        </td>

                        {/* View */}
                        <td>
                          <button
                            className="btn btn-sm mom-view-btn"
                            onClick={() =>
                              navigate(`/hr/dasboard/meetmom/${mom.momId}`)
                            }
                          >
                            <Eye size={14} />
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

        {/* Pagination */}
        {!loading &&
          Array.isArray(moms) &&
          moms.length > 0 &&
          totalPages > 1 && (
            <div className="card mom-pagination-card">
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="text-muted small">
                    Showing {(filters.pageNumber - 1) * filters.pageSize + 1} to{" "}
                    {Math.min(filters.pageNumber * filters.pageSize, totalMoms)}{" "}
                    of {totalMoms}
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li
                        className={`page-item ${
                          filters.pageNumber <= 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link mom-page-btn"
                          onClick={() => handlePageChange(filters.pageNumber - 1)}
                          disabled={filters.pageNumber <= 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft size={14} />
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
                              className="page-link mom-page-btn"
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
                          className="page-link mom-page-btn"
                          onClick={() => handlePageChange(filters.pageNumber + 1)}
                          disabled={filters.pageNumber >= totalPages}
                          aria-label="Next page"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                  <div className="text-muted small">
                    Page {filters.pageNumber} of {totalPages}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default HRMomDashboard;
