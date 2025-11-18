import { useEffect, useState } from "react";
import momService from "../../services/meeting/momService";
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
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Share2,
  Search,
  X,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const MyMomsList = () => {
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalMom, setShareModalMom] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyMoms();
    loadEmployees();
  }, []);

  const loadMyMoms = async () => {
    setLoading(true);
    try {
      const response = await momService.getMyMoms();
      setMoms(response.data || []);
    } catch (err) {
      toastr.error("Failed to load MOMs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await momService.getAllEmployees();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const openMomDetails = (mom) => {
    setSelectedMom(mom);
  };

  const closeMomDetails = () => {
    setSelectedMom(null);
  };

  const openShareModal = (mom) => {
    setShareModalMom(mom);
    setShowShareModal(true);
    setSelectedEmployees([]);
    setSearchTerm("");
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareModalMom(null);
    setSelectedEmployees([]);
    setSearchTerm("");
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleShareMom = async () => {
    if (selectedEmployees.length === 0) {
      toastr.warning("Please select at least one employee");
      return;
    }

    setSharingLoading(true);
    try {
      const response = await momService.shareMom(
        shareModalMom.momId,
        selectedEmployees
      );
      if (response.success) {
        toastr.success(
          `MOM shared with ${selectedEmployees.length} employee(s)`
        );
        closeShareModal();
      }
    } catch (err) {
      toastr.error("Failed to share MOM");
      console.error(err);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleDelete = async (momId) => {
    if (!window.confirm("Are you sure you want to delete this MOM?")) return;
    try {
      await momService.deleteMom(momId);
      toastr.success("MOM deleted successfully");
      loadMyMoms();
    } catch (err) {
      toastr.error("Failed to delete MOM");
      console.error(err);
    }
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

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="badge bg-danger d-inline-flex align-items-center gap-1">
          <AlertTriangle size={14} /> Overdue
        </span>
      );
    }
    switch (status) {
      case "Completed":
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={14} /> Completed
          </span>
        );
      case "Pending":
        return (
          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
            <Clock size={14} /> Pending
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
            {status}
          </span>
        );
    }
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

  // Filter employees based on search
  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.departmentName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
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
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          {/* Header */}
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
                  My MOMs
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                  View and manage your meeting minutes
                </p>
              </div>
            </div>
            <button
              className="btn btn-success d-flex align-items-center gap-2 px-4"
              onClick={() => navigate("/mom/create")}
            >
              <Plus size={18} />
              Create New MOM
            </button>
          </div>

          {/* MOMs Count Badge */}
          {moms.length > 0 && (
            <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
              <FileText size={20} />
              <span>
                You have <strong>{moms.length}</strong> MOM
                {moms.length !== 1 ? "s" : ""} in total
              </span>
            </div>
          )}

          {/* Empty State */}
          {moms.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#e3f2fd",
                  }}
                >
                  <FileText size={40} style={{ color: "#1976d2" }} />
                </div>
                <h5 className="fw-semibold mb-2">No MOMs Yet</h5>
                <p className="text-muted mb-4">
                  You haven't submitted any meeting minutes yet.
                </p>
                <button
                  className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
                  onClick={() => navigate("/mom/create")}
                >
                  <Plus size={18} />
                  Create Your First MOM
                </button>
              </div>
            </div>
          ) : (
            /* MOMs List */
            <div className="row g-3">
              {moms.map((mom) => (
                <div key={mom.momId} className="col-12">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="row align-items-start">
                        {/* MOM Icon */}
                        <div className="col-auto d-none d-md-block">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "60px",
                              height: "60px",
                              backgroundColor: "#e3f2fd",
                            }}
                          >
                            <FileText size={28} style={{ color: "#1976d2" }} />
                          </div>
                        </div>

                        {/* MOM Details */}
                        <div className="col">
                          <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                            <h5
                              className="fw-bold mb-0"
                              style={{ color: "#1e293b" }}
                            >
                              {mom.meetingTitle}
                            </h5>
                            {getMeetingTypeBadge(mom.meetingType)}
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-4">
                              <div className="d-flex align-items-start gap-2">
                                <Calendar
                                  size={18}
                                  className="text-primary mt-1"
                                  style={{ flexShrink: 0 }}
                                />
                                <div>
                                  <div
                                    className="text-muted fw-medium"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    Meeting Date
                                  </div>
                                  <div
                                    className="fw-semibold"
                                    style={{
                                      fontSize: "0.95rem",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {formatDateTime(mom.meetingDate)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-4">
                              <div className="d-flex align-items-start gap-2">
                                <Users
                                  size={18}
                                  className="text-primary mt-1"
                                  style={{ flexShrink: 0 }}
                                />
                                <div>
                                  <div
                                    className="text-muted fw-medium"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    Attendees
                                  </div>
                                  <div
                                    className="fw-semibold"
                                    style={{
                                      fontSize: "0.95rem",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {mom.attendees || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-4">
                              <div className="d-flex align-items-start gap-2">
                                <Users
                                  size={18}
                                  className="text-primary mt-1"
                                  style={{ flexShrink: 0 }}
                                />
                                <div>
                                  <div
                                    className="text-muted fw-medium"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    Submitted by
                                  </div>
                                  <div
                                    className="fw-semibold"
                                    style={{
                                      fontSize: "0.95rem",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {mom.submittedByEmployeeName} (
                                    {mom.submittedByRole})
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                              onClick={() => openMomDetails(mom)}
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button
                              className="btn btn-sm btn-info d-flex align-items-center gap-2"
                              onClick={() => openShareModal(mom)}
                            >
                              <Share2 size={16} />
                              Share
                            </button>
                            {mom.isEditable && (
                              <>
                                <button
                                  className="btn btn-sm btn-warning d-flex align-items-center gap-2"
                                  onClick={() =>
                                    navigate(`/mom/edit/${mom.momId}`)
                                  }
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger d-flex align-items-center gap-2"
                                  onClick={() => handleDelete(mom.momId)}
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
              ))}
            </div>
          )}

          {/* Share Modal */}
          {showShareModal && shareModalMom && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={closeShareModal}
            >
              <div
                className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow">
                  <div className="modal-header">
                    <div>
                      <h5 className="modal-title fw-bold mb-1">Share MOM</h5>
                      <p className="text-muted small mb-0">
                        {shareModalMom.meetingTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeShareModal}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Search Bar */}
                    <div className="mb-3">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Search size={18} />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search employees by name, email, or department..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button
                            className="btn btn-light border"
                            onClick={() => setSearchTerm("")}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Selected Count */}
                    {selectedEmployees.length > 0 && (
                      <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                        <Users size={18} />
                        <span>
                          <strong>{selectedEmployees.length}</strong>{" "}
                          employee(s) selected
                        </span>
                      </div>
                    )}

                    {/* Employee List */}
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {filteredEmployees.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          No employees found
                        </div>
                      ) : (
                        <div className="list-group">
                          {filteredEmployees.map((employee) => (
                            <label
                              key={employee.employeeId}
                              className="list-group-item list-group-item-action d-flex align-items-center gap-3"
                              style={{ cursor: "pointer" }}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input m-0"
                                checked={selectedEmployees.includes(
                                  employee.employeeId
                                )}
                                onChange={() =>
                                  toggleEmployeeSelection(employee.employeeId)
                                }
                              />
                              <div className="flex-grow-1">
                                <div className="fw-semibold">
                                  {employee.firstName} {employee.lastName}
                                </div>
                                <div className="small text-muted">
                                  {employee.email} • {employee.departmentName} •{" "}
                                  {employee.roleName}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={closeShareModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary d-flex align-items-center gap-2"
                      onClick={handleShareMom}
                      disabled={
                        selectedEmployees.length === 0 || sharingLoading
                      }
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

          {/* MOM Details Modal */}
          {selectedMom && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={closeMomDetails}
            >
              <div
                className="modal-dialog modal-dialog-scrollable modal-xl modal-dialog-centered"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow">
                  <div className="modal-header border-0 pb-0">
                    <div className="flex-grow-1">
                      <h5 className="modal-title fw-bold">
                        {selectedMom.meetingTitle}
                      </h5>
                      <p className="text-muted small mb-0">
                        {getMeetingTypeBadge(selectedMom.meetingType)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeMomDetails}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Meeting Info Card */}
                    <div className="card bg-light border-0 mb-4">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">
                          Meeting Information
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Calendar size={16} className="text-primary" />
                              <small className="text-muted">
                                Meeting Date:
                              </small>
                            </div>
                            <div className="fw-semibold">
                              {formatDateTime(selectedMom.meetingDate)}
                            </div>
                          </div>

                          {selectedMom.meetingLink && (
                            <div className="col-md-6">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <LinkIcon size={16} className="text-primary" />
                                <small className="text-muted">
                                  Meeting Link:
                                </small>
                              </div>
                              <a
                                href={selectedMom.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary text-decoration-none d-flex align-items-center gap-1"
                              >
                                Join Meeting <LinkIcon size={14} />
                              </a>
                            </div>
                          )}

                          <div className="col-md-6">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Users size={16} className="text-primary" />
                              <small className="text-muted">Attendees:</small>
                            </div>
                            <div className="fw-semibold">
                              {selectedMom.attendees || "N/A"}
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <Users size={16} className="text-primary" />
                              <small className="text-muted">
                                Submitted by:
                              </small>
                            </div>
                            <div className="fw-semibold">
                              {selectedMom.submittedByEmployeeName} (
                              {selectedMom.submittedByRole})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments/Observations */}
                    {selectedMom.commentsObservations && (
                      <div className="mb-4">
                        <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                          <MessageSquare size={18} />
                          Comments & Observations
                        </h6>
                        <div className="alert alert-secondary mb-0">
                          {selectedMom.commentsObservations}
                        </div>
                      </div>
                    )}

                    {/* Discussion Points */}
                    <div className="mb-4">
                      <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                        <MessageSquare size={18} />
                        Discussion Points
                      </h6>
                      {selectedMom.discussionPoints?.length > 0 ? (
                        <div className="list-group">
                          {selectedMom.discussionPoints.map((dp, index) => (
                            <div
                              key={dp.pointId}
                              className="list-group-item border-0 bg-light mb-2 rounded"
                            >
                              <div className="d-flex gap-2">
                                <span
                                  className="badge bg-primary rounded-circle"
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {index + 1}
                                </span>
                                <span className="flex-grow-1">
                                  {dp.pointText}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert-info mb-0">
                          No discussion points recorded
                        </div>
                      )}
                    </div>

                    {/* Action Items */}
                    <div className="mb-4">
                      <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                        <CheckCircle size={18} />
                        Action Items
                      </h6>
                      {selectedMom.actionItems?.length > 0 ? (
                        <div className="list-group">
                          {selectedMom.actionItems.map((ai) => (
                            <div
                              key={ai.actionItemId}
                              className="list-group-item border-0 bg-light mb-2 rounded"
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0 fw-semibold">
                                  {ai.taskDescription}
                                </h6>
                                {getStatusBadge(ai.status, ai.isOverdue)}
                              </div>
                              <div className="row g-2 mt-2">
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    Assigned to:
                                  </small>
                                  <div className="fw-semibold">
                                    {ai.assignedToEmployeeName}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <small className="text-muted">
                                    Due Date:
                                  </small>
                                  <div className="fw-semibold">
                                    {ai.dueDate || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert-info mb-0">
                          No action items recorded
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="border-top pt-3">
                      <small className="text-muted">
                        <strong>Created:</strong>{" "}
                        {formatDateTime(selectedMom.createdAt)}
                        {selectedMom.updatedAt && (
                          <>
                            {" "}
                            | <strong>Last Updated:</strong>{" "}
                            {formatDateTime(selectedMom.updatedAt)}
                          </>
                        )}
                      </small>
                    </div>
                  </div>

                  <div className="modal-footer border-0">
                    <button
                      className="btn btn-secondary"
                      onClick={closeMomDetails}
                    >
                      Close
                    </button>
                    {selectedMom.isEditable && (
                      <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => {
                          closeMomDetails();
                          navigate(`/mom/edit/${selectedMom.momId}`);
                        }}
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
