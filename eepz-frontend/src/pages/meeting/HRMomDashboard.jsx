import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/HRMomDashboard.css";
import Breadcrumb from "../../components/feedback_management/common/FeedbackBreadcrumb";
import PaginationFooter from "../../components/project-management/common/PaginationFooter";

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

        setMoms(momsData);
        setTotalMoms(total);
      } else {
        setMoms([]);
        setTotalMoms(0);
      }
    } catch (err) {
      console.error("Fetch MOMs error:", err);
      toastr.error("Failed to load MOMs");
      setMoms([]);
      setTotalMoms(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const handlePageSizeChange = (size) => {
    setFilters((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }));
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
      return sum + (Array.isArray(mom.actionItems) ? mom.actionItems.length : 0);
    }, 0);
  };

  const getOverdueActionItems = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.reduce((sum, mom) => {
      if (!Array.isArray(mom.actionItems)) return sum;
      return sum + mom.actionItems.filter((ai) => ai.isOverdue).length;
    }, 0);
  };

  const totalPages = Math.ceil(totalMoms / filters.pageSize) || 1;

  useEffect(() => {
    if (filters.pageNumber > totalPages) {
      setFilters((prev) => ({ ...prev, pageNumber: 1 }));
    }
  }, [totalPages, filters.pageNumber]);

  return (
    <div className="hrmom-dashboard-container">
      <div className="hrmom-dashboard-wrapper">
        <div className="hrmom-header">
          <Breadcrumb items={[{ label: "Meetings and MoM", href: "/hr/dashboard/mom" }]} />
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
                  <div className="hrmom-top-count">{getOverdueActionItems()}</div>
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
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0 small">Loading MOMs...</p>
                    </td>
                  </tr>
                ) : !Array.isArray(moms) || moms.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="hrmom-empty-state">
                      <FileText size={40} className="hrmom-empty-icon" />
                      <h6 className="hrmom-empty-title">No MOMs Found</h6>
                      <p className="hrmom-empty-text">No meeting minutes yet</p>
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
                            <div className="hrmom-meeting-title">{mom.meetingTitle}</div>
                            <div className="mt-1">{getMeetingTypeBadge(mom.meetingType)}</div>
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
                          <Calendar size={14} className="hrmom-date-icon text-muted" />
                          <span className="hrmom-meeting-date">{formatDateTime(mom.meetingDate)}</span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <Users className="hrmom-count-icon hrmom-count-icon-participants" />
                          <span>{Array.isArray(mom.attendees) ? mom.attendees.length : 0}</span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <MessageSquare className="hrmom-count-icon hrmom-count-icon-topics" />
                          <span>
                            {Array.isArray(mom.discussionPoints) ? mom.discussionPoints.length : 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="hrmom-count-badge">
                          <CheckCircle className="hrmom-count-icon hrmom-count-icon-actions" />
                          <span>{Array.isArray(mom.actionItems) ? mom.actionItems.length : 0}</span>
                        </div>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm hrmom-view-btn"
                          onClick={() => navigate(`/hr/dasboard/meetmom/${mom.momId}`)}
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

          {!loading && Array.isArray(moms) && moms.length > 0 && totalPages > 0 && (
            <PaginationFooter
              currentPage={filters.pageNumber}
              totalItems={totalMoms}
              itemsPerPage={filters.pageSize}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 25, 50]}
              showPageSizeDropdown={true}
              showStatusText={true}
              pageNumberMode="compact"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HRMomDashboard;
