import { useEffect, useState } from "react";
import momService from "../../services/meeting/momService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  Users,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Plus,
  AlertTriangle,
  Share2,
  Search,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/MyMomsLists.css";

const MyMomsList = () => {
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const [momSearchTerm, setMomSearchTerm] = useState("");
  const [momSearchInput, setMomSearchInput] = useState("");
  const [selectedMeetingType, setSelectedMeetingType] = useState("");
  
  const [selectedMom, setSelectedMom] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalMom, setShareModalMom] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyMoms();
  }, [pageNumber, momSearchTerm, selectedMeetingType]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadMyMoms = async () => {
    setLoading(true);
    try {
      const response = await momService.getMyMoms({
        pageNumber,
        pageSize,
        searchTerm: momSearchTerm,
        meetingType: selectedMeetingType,
      });

      let momsArray = [];
      let pagination = {
        totalCount: 0,
        totalPages: 0,
        pageNumber: 1,
        pageSize: pageSize,
        hasPreviousPage: false,
        hasNextPage: false
      };

      if (response?.Data?.Data && Array.isArray(response.Data.Data)) {
        momsArray = response.Data.Data;
        pagination = {
          totalCount: response.Data.TotalCount || 0,
          totalPages: response.Data.TotalPages || 0,
          pageNumber: response.Data.PageNumber || 1,
          pageSize: response.Data.PageSize || pageSize,
          hasPreviousPage: response.Data.HasPreviousPage || false,
          hasNextPage: response.Data.HasNextPage || false
        };
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        momsArray = response.data.data;
        pagination = {
          totalCount: response.data.totalCount || 0,
          totalPages: response.data.totalPages || 0,
          pageNumber: response.data.pageNumber || 1,
          pageSize: response.data.pageSize || pageSize,
          hasPreviousPage: response.data.hasPreviousPage || false,
          hasNextPage: response.data.hasNextPage || false
        };
      }

      setMoms(momsArray);
      setTotalPages(pagination.totalPages);
      setTotalCount(pagination.totalCount);
      setHasPreviousPage(pagination.hasPreviousPage);
      setHasNextPage(pagination.hasNextPage);
    } catch (err) {
      if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else {
        toastr.error("Failed to load MOMs.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.success || response.Success) {
        setEmployees(response.data || response.Data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const openMomDetails = (mom) => setSelectedMom(mom);
  const closeMomDetails = () => setSelectedMom(null);

  const openShareModal = (mom) => {
    setShareModalMom(mom);
    setShowShareModal(true);
    setSelectedEmployees([]);
    setSearchInput("");
    setSearchTerm("");
    setSearchMode(false);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareModalMom(null);
    setSelectedEmployees([]);
    setSearchInput("");
    setSearchTerm("");
    setSearchMode(false);
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleShareMom = async () => {
    if (selectedEmployees.length === 0) {
      toastr.warning("Please select at least one employee");
      return;
    }

    setSharingLoading(true);
    try {
      const momId = shareModalMom.MomId || shareModalMom.momId;
      const response = await momService.shareMom(momId, selectedEmployees);
      if (response.success || response.Success) {
        toastr.success(`MOM shared with ${selectedEmployees.length} employee(s)`);
        closeShareModal();
      }
    } catch (err) {
      toastr.error("Failed to share MOM");
      console.error(err);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleDelete = async (momId, meetingTitle) => {
    try {
      const result = await momService.deleteMomWithConfirmation(momId, meetingTitle);
      
      if (result.success) {
        toastr.success("MOM deleted successfully");
        if (moms.length === 1 && pageNumber > 1) {
          setPageNumber(pageNumber - 1);
        } else {
          loadMyMoms();
        }
      } else if (!result.cancelled) {
        toastr.error("Failed to delete MOM");
      }
    } catch (err) {
      if (err.message?.includes('confirmation')) {
        toastr.error('Deletion requires confirmation');
      } else if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else {
        toastr.error("Failed to delete MOM");
      }
      console.error(err);
    }
  };

  const handleSearch = () => {
    setMomSearchTerm(momSearchInput.trim());
    setPageNumber(1);
  };

  const handleClearSearch = () => {
    setMomSearchInput("");
    setMomSearchTerm("");
    setPageNumber(1);
  };

  const handleMeetingTypeChange = (type) => {
    setSelectedMeetingType(type);
    setPageNumber(1);
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
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const firstName = emp.firstName || emp.FirstName || '';
    const lastName = emp.lastName || emp.LastName || '';
    const email = emp.email || emp.Email || '';
    const departmentName = emp.departmentName || emp.DepartmentName || '';
    const haystack = `${firstName} ${lastName} ${email} ${departmentName}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="mm2-loading">
        <div className="spinner-border text-primary mm2-loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mm2-page">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          <nav aria-label="breadcrumb" className="mm2-breadcrumb-nav">
            <ol className="breadcrumb mb-0 d-flex align-items-center mm2-breadcrumb">
              <li className="breadcrumb-item mm2-breadcrumb-item">
                <button
                  onClick={() => navigate("/employee/dashboard")}
                  className="mm2-breadcrumb-link"
                  type="button"
                >
                  <Home size={20} className="mm2-breadcrumb-home" />
                </button>
              </li>
              <li className="mm2-breadcrumb-separator">/</li>
              <li className="breadcrumb-item mm2-breadcrumb-item">
                <button
                  onClick={() =>
                    navigate("/employee/dashboard/meetmom", {
                      state: { fromPage: "myMoms" },
                    })
                  }
                  className="mm2-breadcrumb-link"
                  type="button"
                >
                  Meetings and MoM
                </button>
              </li>
              <li className="mm2-breadcrumb-separator">/</li>
              <li className="breadcrumb-item active mm2-breadcrumb-item">
                <span className="mm2-breadcrumb-current">My MoMs</span>
              </li>
            </ol>
          </nav>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by meeting title or attendees..."
                      value={momSearchInput}
                      onChange={(e) => setMomSearchInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {momSearchTerm ? (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={handleClearSearch}
                      >
                        <X size={16} /> Clear
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={handleSearch}
                      >
                        <Search size={16} /> Search
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={selectedMeetingType}
                    onChange={(e) => handleMeetingTypeChange(e.target.value)}
                  >
                    <option value="">All Meeting Types</option>
                    <option value="One-on-One">One-on-One</option>
                    <option value="Team Meeting">Team Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="alert alert-info d-flex align-items-center justify-content-between gap-2 mb-4">
              <div className="d-flex align-items-center gap-2">
                <FileText size={20} />
                <span>
                  Showing <strong>{moms.length}</strong> of <strong>{totalCount}</strong> MOM
                  {totalCount !== 1 ? "s" : ""}
                  {momSearchTerm && ` (filtered by "${momSearchTerm}")`}
                  {selectedMeetingType && ` (${selectedMeetingType})`}
                </span>
              </div>
              <span className="badge bg-primary">
                Page {pageNumber} of {totalPages}
              </span>
            </div>
          )}

          {totalCount === 0 && !momSearchTerm && !selectedMeetingType ? (
            <div className="card border-0 shadow-sm mm2-empty-card">
              <div className="card-body text-center">
                <div className="mm2-empty-icon">
                  <FileText size={40} className="mm2-empty-icon-svg" />
                </div>
                <h5 className="fw-semibold mb-2">No MOMs Yet</h5>
                <p className="text-muted mb-4">
                  You haven't submitted any meeting minutes yet.
                </p>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
                  onClick={() => navigate("/mom/create")}
                  type="button"
                >
                  <Plus size={18} />
                  Create Your First MOM
                </button>
              </div>
            </div>
          ) : totalCount === 0 ? (
            <div className="card border-0 shadow-sm mm2-empty-card">
              <div className="card-body text-center">
                <div className="mm2-empty-icon">
                  <Search size={40} className="mm2-empty-icon-svg" />
                </div>
                <h5 className="fw-semibold mb-2">No Results Found</h5>
                <p className="text-muted mb-4">
                  No MOMs match your search criteria. Try adjusting your filters.
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleClearSearch}
                  type="button"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {moms.map((mom) => {
                  const momId = mom.MomId || mom.momId;
                  const meetingTitle = mom.MeetingTitle || mom.meetingTitle || 'Untitled';
                  const meetingType = mom.MeetingType || mom.meetingType || 'Other';
                  const meetingDate = mom.MeetingDate || mom.meetingDate;
                  const attendees = mom.Attendees || mom.attendees;
                  const submittedByName = mom.SubmittedByEmployeeName || mom.submittedByEmployeeName || 'Unknown';
                  const submittedByRole = mom.SubmittedByRole || mom.submittedByRole || 'Employee';
                  const isEditable = mom.IsEditable ?? mom.isEditable ?? false;

                  return (
                    <div key={momId} className="col-12">
                      <div className="card border-0 shadow-sm h-100 mm2-mom-card">
                        <div className="card-body mm2-mom-body">
                          <div className="row align-items-start">
                            <div className="col-auto d-none d-md-block">
                              <div className="mm2-mom-icon">
                                <FileText size={28} className="mm2-mom-icon-svg" />
                              </div>
                            </div>

                            <div className="col">
                              <div className="mm2-mom-header">
                                <h5 className="mm2-mom-title">{meetingTitle}</h5>
                                {getMeetingTypeBadge(meetingType)}
                              </div>

                              <div className="row g-3 mb-3">
                                <div className="col-md-4">
                                  <div className="mm2-info-row">
                                    <Calendar size={18} className="mm2-info-icon text-primary" />
                                    <div className="mm2-info-text">
                                      <div className="mm2-info-label">Meeting Date</div>
                                      <div className="mm2-info-value">{formatDateTime(meetingDate)}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mm2-info-row">
                                    <Users size={18} className="mm2-info-icon text-primary" />
                                    <div className="mm2-info-text">
                                      <div className="mm2-info-label">Attendees</div>
                                      <div className="mm2-info-value">{attendees || "N/A"}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mm2-info-row">
                                    <Users size={18} className="mm2-info-icon text-primary" />
                                    <div className="mm2-info-text">
                                      <div className="mm2-info-label">Submitted by</div>
                                      <div className="mm2-info-value">
                                        {submittedByName} ({submittedByRole})
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mm2-actions-row">
                                <button
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                                  onClick={() => openMomDetails(mom)}
                                  type="button"
                                >
                                  <Eye size={16} />
                                  View Details
                                </button>

                                <button
                                  className="btn btn-sm btn-info d-flex align-items-center gap-2"
                                  onClick={() => openShareModal(mom)}
                                  type="button"
                                >
                                  <Share2 size={16} />
                                  Share
                                </button>

                                {isEditable && (
                                  <>
                                    <button
                                      className="btn btn-sm btn-warning d-flex align-items-center gap-2"
                                      onClick={() => navigate(`/mom/edit/${momId}`)}
                                      type="button"
                                    >
                                      <Edit size={16} />
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger d-flex align-items-center gap-2"
                                      onClick={() => handleDelete(momId, meetingTitle)}
                                      type="button"
                                    >
                                      <Trash2 size={16} />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                        onClick={() => setPageNumber((prev) => prev - 1)}
                        disabled={!hasPreviousPage}
                        type="button"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>

                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted">
                          Page {pageNumber} of {totalPages}
                        </span>
                        <span className="badge bg-primary">
                          {totalCount} total MOMs
                        </span>
                      </div>

                      <button
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                        onClick={() => setPageNumber((prev) => prev + 1)}
                        disabled={!hasNextPage}
                        type="button"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="mt-3 text-center">
                      <div className="d-inline-flex align-items-center gap-2">
                        <span className="text-muted small">Go to page:</span>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '80px' }}
                          min="1"
                          max={totalPages}
                          value={pageNumber}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= totalPages) {
                              setPageNumber(page);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {showShareModal && shareModalMom && (
            <div
              className="modal fade show d-block mm2-modal-backdrop"
              tabIndex="-1"
              onClick={closeShareModal}
            >
              <div
                className="modal-dialog modal-dialog-scrollable modal-xl modal-dialog-centered mm2-modal-dialog mm2-share-dialog"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow mm2-modal-content">
                  <div className="mm2-modal-header">
                    <div className="mm2-modal-header-left">
                      <h5 className="mm2-modal-title">Share MOM</h5>
                      <p className="mm2-modal-subtitle">
                        {shareModalMom.MeetingTitle || shareModalMom.meetingTitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeShareModal}
                    ></button>
                  </div>

                  <div className="modal-body mm2-modal-body">
                    <div className="mb-3">
                      <div className="mm2-search-shell">
                        <div className="mm2-search-icon">
                          <Search size={18} />
                        </div>

                        <input
                          type="text"
                          className="form-control mm2-search-input"
                          placeholder="Search by employee name"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />

                        {!searchMode ? (
                          <button
                            type="button"
                            className="mm2-search-action mm2-search-btn"
                            onClick={() => {
                              setSearchTerm(searchInput.trim());
                              setSearchMode(true);
                            }}
                          >
                            <Search size={16} />
                            Search
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="mm2-search-action mm2-cancel-btn"
                            onClick={() => {
                              setSearchInput("");
                              setSearchTerm("");
                              setSearchMode(false);
                            }}
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedEmployees.length > 0 && (
                      <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                        <Users size={18} />
                        <span>
                          <strong>{selectedEmployees.length}</strong> employee(s) selected
                        </span>
                      </div>
                    )}

                    <div className="mm2-employee-list-wrap">
                      {filteredEmployees.length === 0 ? (
                        <div className="text-center py-4 text-muted">No employees found</div>
                      ) : (
                        <div className="list-group">
                          {filteredEmployees.map((employee) => {
                            const employeeId = employee.employeeId || employee.EmployeeId;
                            const firstName = employee.firstName || employee.FirstName || '';
                            const lastName = employee.lastName || employee.LastName || '';
                            const email = employee.email || employee.Email || '';
                            const departmentName = employee.departmentName || employee.DepartmentName || '';
                            const roleName = employee.roleName || employee.RoleName || '';

                            return (
                              <label
                                key={employeeId}
                                className="list-group-item list-group-item-action mm2-employee-item"
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input mm2-employee-check"
                                  checked={selectedEmployees.includes(employeeId)}
                                  onChange={() => toggleEmployeeSelection(employeeId)}
                                />

                                <div className="mm2-employee-text">
                                  <div className="fw-semibold">
                                    {firstName} {lastName}
                                  </div>
                                  <div className="small text-muted">
                                    {email} • {departmentName} • {roleName}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer mm2-modal-footer">
                    <button
                      className="btn btn-danger px-4"
                      onClick={closeShareModal}
                      type="button"
                    >
                      <X size={16} className="me-2" />
                      Cancel
                    </button>
                    <button
                      className="btn px-4 d-flex align-items-center gap-2 mm2-share-btn"
                      onClick={handleShareMom}
                      disabled={selectedEmployees.length === 0 || sharingLoading}
                      type="button"
                    >
                      <Share2 size={16} />
                      {sharingLoading
                        ? "Sharing..."
                        : `Share with ${selectedEmployees.length} employee(s)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMom && (
            <div
              className="modal fade show d-block mm2-modal-backdrop"
              tabIndex="-1"
              onClick={closeMomDetails}
            >
              <div
                className="modal-dialog modal-dialog-scrollable modal-xl modal-dialog-centered mm2-modal-dialog"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow mm2-modal-content">
                  <div className="mm2-detail-header">
                    <div className="mm2-modal-header-left flex-grow-1">
                      <h5 className="mm2-detail-title">
                        {selectedMom.MeetingTitle || selectedMom.meetingTitle}
                      </h5>
                      <p className="mm2-detail-subtitle">
                        {getMeetingTypeBadge(selectedMom.MeetingType || selectedMom.meetingType)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeMomDetails}
                    ></button>
                  </div>

                  <div className="modal-body mm2-detail-body">
                    <div className="card bg-light border-0 mb-4">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Meeting Information</h6>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="mm2-detail-row">
                              <Calendar size={16} className="text-primary" />
                              <small className="text-muted">Meeting Date:</small>
                            </div>
                            <div className="fw-semibold">
                              {formatDateTime(selectedMom.MeetingDate || selectedMom.meetingDate)}
                            </div>
                          </div>

                          {(selectedMom.MeetingLink || selectedMom.meetingLink) && (
                            <div className="col-md-6">
                              <div className="mm2-detail-row">
                                <LinkIcon size={16} className="text-primary" />
                                <small className="text-muted">Meeting Link:</small>
                              </div>
                              <a
                                href={selectedMom.MeetingLink || selectedMom.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary text-decoration-none d-flex align-items-center gap-1"
                              >
                                Join Meeting <LinkIcon size={14} />
                              </a>
                            </div>
                          )}

                          <div className="col-md-6">
                            <div className="mm2-detail-row">
                              <Users size={16} className="text-primary" />
                              <small className="text-muted">Attendees:</small>
                            </div>
                            <div className="fw-semibold">
                              {selectedMom.Attendees || selectedMom.attendees || "N/A"}
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="mm2-detail-row">
                              <Users size={16} className="text-primary" />
                              <small className="text-muted">Submitted by:</small>
                            </div>
                            <div className="fw-semibold">
                              {selectedMom.SubmittedByEmployeeName || selectedMom.submittedByEmployeeName} (
                              {selectedMom.SubmittedByRole || selectedMom.submittedByRole})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(selectedMom.CommentsObservations || selectedMom.commentsObservations) && (
                      <div className="mb-4">
                        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                          Comments &amp; Observations
                        </h6>
                        <div className="alert alert-secondary mb-0">
                          {selectedMom.CommentsObservations || selectedMom.commentsObservations}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                        Discussion Points
                      </h6>
                      {(selectedMom.DiscussionPoints || selectedMom.discussionPoints)?.length > 0 ? (
                        <div className="list-group">
                          {(selectedMom.DiscussionPoints || selectedMom.discussionPoints).map((dp) => (
                            <div
                              key={dp.PointId || dp.pointId}
                              className="list-group-item border-0 bg-light mb-2 rounded"
                            >
                              <div className="d-flex gap-2">
                                <span className="flex-grow-1">
                                  {dp.PointText || dp.pointText}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert-info mb-0">No discussion points recorded</div>
                      )}
                    </div>

                    <div className="mb-4">
                      <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                        <CheckCircle size={18} />
                        Action Items
                      </h6>
                      {(selectedMom.ActionItems || selectedMom.actionItems)?.length > 0 ? (
                        <div className="list-group">
                          {(selectedMom.ActionItems || selectedMom.actionItems).map((ai) => (
                            <div
                              key={ai.ActionItemId || ai.actionItemId}
                              className="list-group-item border-0 bg-light mb-2 rounded"
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0 fw-semibold">
                                  {ai.TaskDescription || ai.taskDescription}
                                </h6>
                              </div>
                              <div className="row g-2 mt-2">
                                <div className="col-md-6">
                                  <small className="text-muted">Assigned to:</small>
                                  <div className="fw-semibold">
                                    {ai.AssignedToEmployeeName || ai.assignedToEmployeeName}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">Due Date:</small>
                                  <div className="fw-semibold">
                                    {ai.DueDate || ai.dueDate || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert-info mb-0">No action items recorded</div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer border-0 mm2-modal-footer">
                    <button
                      className="btn btn-danger px-4"
                      onClick={closeMomDetails}
                      type="button"
                    >
                      <X size={16} className="me-2" />
                      Close
                    </button>

                    {(selectedMom.IsEditable ?? selectedMom.isEditable) && (
                      <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => {
                          closeMomDetails();
                          navigate(`/mom/edit/${selectedMom.MomId || selectedMom.momId}`);
                        }}
                        type="button"
                      >
                        <Edit size={16} />
                        Edit MOM
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMomsList;
