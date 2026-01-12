import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/HRMomDashboard.css";
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
    pageSize: 5,
  });
  const [loading, setLoading] = useState(false);
  const [totalMoms, setTotalMoms] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);

  useEffect(() => {
    fetchMoms();
  }, [filters.pageNumber, filters.pageSize]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target)) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const handlePageSizeSelect = (size) => {
    setFilters((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }));
    setIsPageSizeOpen(false);
  };

  const getMeetingTypeBadge = (type) => {
    const badgeMap = {
      "One-on-One": "primary",
      "Team Meeting": "success",
      Presentation: "info",
      Other: "secondary",
    };
    return (
      <span className={`badge hrmom-badge bg-${badgeMap[type] || "secondary"}`}>
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

  const fromIndex =
    totalMoms === 0 ? 0 : (filters.pageNumber - 1) * filters.pageSize + 1;
  const toIndex = Math.min(filters.pageNumber * filters.pageSize, totalMoms);

  const pageSizeOptions = [5, 10, 25, 50];

  return (
    <div className="hrmom-dashboard-container">
      <div className="hrmom-dashboard-wrapper">
        <div className="hrmom-header">
          <Breadcrumb
            items={[{ label: "Meetings and MoM", href: "/hr/dashboard/mom" }]}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="hrmom-top-card">
              <div className="hrmom-top-card-inner">
                <div className="hrmom-top-icon hrmom-top-icon-total">
                  <FileText className="hrmom-top-icon-svg" />
                </div>
                <div className="hrmom-top-center">
                  <div className="hrmom-top-count">{totalMoms}</div>
                  <div className="hrmom-top-label">TOTAL MOMs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="hrmom-top-card">
              <div className="hrmom-top-card-inner">
                <div className="hrmom-top-icon hrmom-top-icon-month">
                  <Calendar className="hrmom-top-icon-svg hrmom-top-icon-ok" />
                </div>
                <div className="hrmom-top-center">
                  <div className="hrmom-top-count">{getThisMonthCount()}</div>
                  <div className="hrmom-top-label">THIS MONTH</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="hrmom-top-card">
              <div className="hrmom-top-card-inner">
                <div className="hrmom-top-icon hrmom-top-icon-actions">
                  <CheckCircle className="hrmom-top-icon-svg hrmom-top-icon-ok" />
                </div>
                <div className="hrmom-top-center">
                  <div className="hrmom-top-count">{getTotalActionItems()}</div>
                  <div className="hrmom-top-label">ACTION ITEMS</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="hrmom-top-card">
              <div className="hrmom-top-card-inner">
                <div className="hrmom-top-icon hrmom-top-icon-overdue">
                  <AlertCircle className="hrmom-top-icon-svg hrmom-top-icon-alert" />
                </div>
                <div className="hrmom-top-center">
                  <div className="hrmom-top-count">
                    {getOverdueActionItems()}
                  </div>
                  <div className="hrmom-top-label">OVERDUE</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body hrmom-table-card-body">
          <div className="hrmom-table-wrapper">
            <table className="table hrmom-table mb-0">
              <thead>
                <tr>
                  <th>Meeting Title</th>
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
                    <td colSpan="7" className="hrmom-empty-state">
                      <FileText size={40} className="hrmom-empty-icon" />
                      <h6 className="hrmom-empty-title">No MOMs Found</h6>
                      <p className="hrmom-empty-text">
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
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="hrmom-table-icon">
                            <FileText className="hrmom-table-icon-svg" />
                          </div>
                          <div>
                            <div className="hrmom-meeting-title">
                              {mom.meetingTitle}
                            </div>
                            <div className="mt-1">
                              {getMeetingTypeBadge(mom.meetingType)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <div className="hrmom-submitter-name">
                              {mom.submittedByEmployeeName || "Unknown"}
                            </div>
                            <small className="hrmom-submitter-role">
                              {mom.submittedByRole || "Employee"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar
                            size={14}
                            className="hrmom-date-icon text-muted"
                          />
                          <span className="hrmom-meeting-date">
                            {formatDateTime(mom.meetingDate)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <Users className="hrmom-count-icon hrmom-count-icon-participants" />
                          <span>
                            {Array.isArray(mom.attendees)
                              ? mom.attendees.length
                              : 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <MessageSquare className="hrmom-count-icon hrmom-count-icon-topics" />
                          <span>
                            {Array.isArray(mom.discussionPoints)
                              ? mom.discussionPoints.length
                              : 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <CheckCircle className="hrmom-count-icon hrmom-count-icon-actions" />
                          <span>
                            {Array.isArray(mom.actionItems)
                              ? mom.actionItems.length
                              : 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm hrmom-view-btn"
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

          {!loading &&
            Array.isArray(moms) &&
            moms.length > 0 &&
            totalPages > 0 && (
              <div className="hrmom-pagination-footer">
                <div className="hrmom-page-size">
                  <span>Show</span>

                  <div className="hrmom-custom-select" ref={pageSizeRef}>
                    <div
                      className="hrmom-select-trigger"
                      onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    >
                      <span className="hrmom-trigger-text">
                        {filters.pageSize}
                      </span>
                      {isPageSizeOpen ? (
                        <ChevronUp size={14} className="hrmom-select-arrow" />
                      ) : (
                        <ChevronDown size={14} className="hrmom-select-arrow" />
                      )}
                    </div>

                    {isPageSizeOpen && (
                      <div className="hrmom-select-options">
                        {pageSizeOptions.map((size) => (
                          <div
                            key={size}
                            className={`hrmom-select-option ${
                              filters.pageSize === size ? "selected" : ""
                            }`}
                            onClick={() => handlePageSizeSelect(size)}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span>entries</span>
                </div>

                <div className="hrmom-page-info">
                  Showing {fromIndex} to {toIndex} of {totalMoms} entries
                </div>

                <div className="hrmom-page-nav">
                  <ul className="pagination pagination-sm mb-0 hrmom-pagination-list">
                    <li
                      className={`page-item ${
                        filters.pageNumber <= 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link hrmom-page-btn"
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
                            className="page-link hrmom-page-btn"
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
                        className="page-link hrmom-page-btn"
                        onClick={() => handlePageChange(filters.pageNumber + 1)}
                        disabled={filters.pageNumber >= totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HRMomDashboard;
