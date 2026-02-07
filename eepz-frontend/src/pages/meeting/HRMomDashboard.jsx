import { useState, useEffect, useRef } from "react";
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
  Search,
  X,
  Filter,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/HRMomDashboard.css";
import Breadcrumb from "../../components/feedback_management/common/FeedbackBreadcrumb";
import PaginationFooter from "../../components/project-management/common/PaginationFooter";
import CustomCalendar from "../../components/project-management/common/CustomCalendar";
 
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
 
  const handleClearAllFilters = () => {
    setSearchInput("");
    setActiveSearchTerm("");
 
    setFilters({
      searchTerm: "",
      meetingType: "",
      departmentId: "",
      startDate: "",
      endDate: "",
      pageNumber: 1,
      pageSize: 5,
    });
  };
 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarAnchorRef = useRef(null);
 
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [displayMoms, setDisplayMoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalMoms, setTotalMoms] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
 
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };
 
  useEffect(() => {
    fetchMoms();
  }, [filters]);
 
const fetchMoms = async () => {
  setLoading(true);
 
  try {
    const apiFilters = {
      ...filters,
      meetingDate: filters.startDate || "",
      startDate: "",
      endDate: "",
    };
 
    const response = await momService.getAllMomsForHR(apiFilters);
 
    const success = response?.success || response?.Success;
 
    if (success) {
      const responseData = response.data || response.Data;
      const momsData =
        responseData?.moms ||
        responseData?.Moms ||
        responseData?.data ||
        responseData?.Data ||
        [];
 
      const total = responseData?.totalCount || responseData?.TotalCount || 0;
      const pages = responseData?.totalPages || responseData?.TotalPages || 1;
 
      setMoms(Array.isArray(momsData) ? momsData : []);
      setTotalMoms(total);
      setTotalPages(pages);
    } else {
      setMoms([]);
      setTotalMoms(0);
      setTotalPages(1);
    }
  } catch (err) {
    console.error("Fetch MOMs error:", err);
    toastr.error("Failed to load MOMs");
    setMoms([]);
    setTotalMoms(0);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};
 
 
  useEffect(() => {
    if (!activeSearchTerm) {
      setDisplayMoms(moms);
      return;
    }
 
    const q = activeSearchTerm.toLowerCase();
 
    const filtered = moms.filter((m) => {
      const title =
        getProperty(m, "meetingTitle", "MeetingTitle")?.toLowerCase() || "";
      const employee =
        getProperty(
          m,
          "submittedByEmployeeName",
          "SubmittedByEmployeeName",
        )?.toLowerCase() || "";
 
      return title.includes(q) || employee.includes(q);
    });
 
    setDisplayMoms(filtered);
  }, [moms, activeSearchTerm]);
 
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };
 
  const handlePageSizeChange = (size) => {
    setFilters((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }));
  };
 
  const handleSearch = () => {
    const value = searchInput.trim();
    if (!value) return;
 
    setActiveSearchTerm(value);
 
    setFilters((prev) => ({
      ...prev,
      searchTerm: value,
      pageNumber: 1,
    }));
  };
 
  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchTerm("");
 
    setFilters((prev) => ({
      ...prev,
      searchTerm: "",
      pageNumber: 1,
    }));
  };
 
  const handleDateChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageNumber: 1,
    }));
  };
 
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageNumber: 1,
    }));
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
        {type || "Other"}
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
        const meetingDate = getProperty(m, "meetingDate", "MeetingDate");
        if (!meetingDate) return false;
 
        const momDate = new Date(meetingDate);
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
      const actionItems = getProperty(mom, "actionItems", "ActionItems");
      return sum + (Array.isArray(actionItems) ? actionItems.length : 0);
    }, 0);
  };
 
  const getOverdueActionItems = () => {
    if (!Array.isArray(moms)) return 0;
    return moms.reduce((sum, mom) => {
      const actionItems = getProperty(mom, "actionItems", "ActionItems");
      if (!Array.isArray(actionItems)) return sum;
 
      return (
        sum +
        actionItems.filter((ai) => {
          const isOverdue = getProperty(ai, "isOverdue", "IsOverdue");
          const status = getProperty(ai, "status", "Status");
          const dueDate = getProperty(ai, "dueDate", "DueDate");
 
          if (isOverdue) return true;
          if (status === "Pending" && dueDate) {
            return new Date(dueDate) < new Date();
          }
 
          return false;
        }).length
      );
    }, 0);
  };
 
  const hasActiveFilters = () => {
    return (
      filters.searchTerm ||
      filters.meetingType ||
      filters.departmentId ||
      filters.startDate ||
      filters.endDate
    );
  };
 
  useEffect(() => {
    if (filters.pageNumber > totalPages && totalPages > 0) {
      setFilters((prev) => ({ ...prev, pageNumber: 1 }));
    }
  }, [totalPages, filters.pageNumber]);
 
  return (
    <div className="hrmom-dashboard-container">
      <div className="hrmom-dashboard-wrapper">
        <div className="hrmom-header">
          <Breadcrumb
            items={[{ label: "Meetings and MoM", href: "/hr/dashboard/mom" }]}
          />
        </div>
 
        <div className="row g-3 mb-4">
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
 
        <div className="hrmom-filter-bar">
          <div className="hrmom-search-wrapper">
            <Search size={16} className="hrmom-search-icon" />
 
            <input
              type="text"
              placeholder="Search meeting title"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="hrmom-search-input"
            />
 
            {activeSearchTerm ? (
              <button
                className="hrmom-search-clear"
                onClick={handleClearSearch}
              >
                <X size={14} /> Cancel
              </button>
            ) : (
              <button className="hrmom-search-btn" onClick={handleSearch}>
                Search
              </button>
            )}
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
                ) : !Array.isArray(displayMoms) || displayMoms.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="hrmom-empty-state">
                      <FileText size={40} className="hrmom-empty-icon" />
                      <h6 className="hrmom-empty-title">No MOMs Found</h6>
                      <p className="hrmom-empty-text">
                        {hasActiveFilters()
                          ? "No meeting minutes match your filters"
                          : "No meeting minutes yet"}
                      </p>
                      {hasActiveFilters() && (
                        <button
                          className="btn btn-primary btn-sm mt-2"
                          onClick={handleClearAllFilters}
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayMoms.map((mom) => {
                    const momId = getProperty(mom, "momId", "MomId");
                    const meetingTitle = getProperty(
                      mom,
                      "meetingTitle",
                      "MeetingTitle",
                    );
                    const meetingType = getProperty(
                      mom,
                      "meetingType",
                      "MeetingType",
                    );
                    const meetingDate = getProperty(
                      mom,
                      "meetingDate",
                      "MeetingDate",
                    );
                    const submittedByName = getProperty(
                      mom,
                      "submittedByEmployeeName",
                      "SubmittedByEmployeeName",
                    );
                    const submittedByRole = getProperty(
                      mom,
                      "submittedByRole",
                      "SubmittedByRole",
                    );
                    const attendees = getProperty(
                      mom,
                      "attendees",
                      "Attendees",
                    );
                    const discussionPoints = getProperty(
                      mom,
                      "discussionPoints",
                      "DiscussionPoints",
                    );
                    const actionItems = getProperty(
                      mom,
                      "actionItems",
                      "ActionItems",
                    );
 
                    return (
                      <tr key={momId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="hrmom-table-icon">
                              <FileText className="hrmom-table-icon-svg" />
                            </div>
                            <div>
                              <div className="hrmom-meeting-title">
                                {meetingTitle || "Untitled Meeting"}
                              </div>
                              <div className="mt-1">
                                {getMeetingTypeBadge(meetingType)}
                              </div>
                            </div>
                          </div>
                        </td>
 
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div>
                              <div className="hrmom-submitter-name">
                                {submittedByName || "Unknown"}
                              </div>
                              <small className="hrmom-submitter-role">
                                {submittedByRole || "Employee"}
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
                              {formatDateTime(meetingDate)}
                            </span>
                          </div>
                        </td>
 
                        <td>
                          <div className="hrmom-count-badge">
                            <Users className="hrmom-count-icon hrmom-count-icon-participants" />
                            <span>
                              {Array.isArray(attendees)
                                ? attendees.length
                                : typeof attendees === "string"
                                  ? attendees.split(",").length
                                  : 0}
                            </span>
                          </div>
                        </td>
 
                        <td>
                          <div className="hrmom-count-badge">
                            <MessageSquare className="hrmom-count-icon hrmom-count-icon-topics" />
                            <span>
                              {Array.isArray(discussionPoints)
                                ? discussionPoints.length
                                : 0}
                            </span>
                          </div>
                        </td>
 
                        <td>
                          <div className="hrmom-count-badge">
                            <CheckCircle className="hrmom-count-icon hrmom-count-icon-actions" />
                            <span>
                              {Array.isArray(actionItems)
                                ? actionItems.length
                                : 0}
                            </span>
                          </div>
                        </td>
 
                        <td>
                          <button
                            className="btn btn-sm hrmom-view-btn"
                            onClick={() =>
                              navigate(`/hr/dashboard/meetmom/${momId}`)
                            }
                            title="View MOM details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
 
          {!loading &&
            Array.isArray(moms) &&
            moms.length > 0 &&
            totalPages > 0 && (
              <PaginationFooter
                 totalItems={totalMoms}
                currentPage={filters.pageNumber}
                setCurrentPage={handlePageChange}
                itemsPerPage={filters.pageSize}
                setItemsPerPage={handlePageSizeChange}
              />
            )}
        </div>
      </div>
    </div>
  );
};
 
export default HRMomDashboard;
 
 