import { useState, useEffect } from "react";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import { toast } from "sonner";
import "../../../styles/auth/common/MyChangeRequests.css";
const MyChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    fetchMyRequests();
  }, []);
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      toast.loading("Loading change requests...");
      const response = await ChangeRequestService.getMyChangeRequests();
      if (response.success) {
        setRequests(response.data);
        toast.dismiss();
        toast.success(`Loaded ${response.data.length} change requests`);
      } else {
        toast.dismiss();
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.dismiss();
      toast.error("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = async (requestId) => {
    if (
      !window.confirm("Are you sure you want to cancel this change request?")
    ) {
      return;
    }
    try {
      toast.loading("Cancelling request...");
      const response = await ChangeRequestService.cancelChangeRequest(
        requestId
      );
      if (response.success) {
        toast.dismiss();
        toast.success(response.message || "Request cancelled successfully");
        fetchMyRequests();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.dismiss();
      toast.error("Failed to cancel request");
    }
  };
  const getStatusBadge = (status) => {
    const badges = {
      Pending: "badge bg-warning text-dark",
      Approved: "badge bg-success",
      Rejected: "badge bg-danger",
    };
    return badges[status] || "badge bg-secondary";
  };
  const getChangeTypeLabel = (changeType) => {
    const labels = {
      EmployeeCompanyId: "Employee Company ID",
      Email: "Email Address",
    };
    return labels[changeType] || changeType;
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status.toLowerCase() === filter.toLowerCase();
  });
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="change-request-container">
      <div className="change-request-header">
        <h2>
          <i className="bi bi-clock-history me-2"></i>
          My Change Requests
        </h2>
        <p className="text-muted">
          Track the status of your account change requests
        </p>
      </div>
      <div className="filter-tabs mb-4">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({requests.length})
        </button>
        <button
          className={`filter-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({requests.filter((r) => r.status === "Pending").length})
        </button>
        <button
          className={`filter-tab ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved ({requests.filter((r) => r.status === "Approved").length})
        </button>
        <button
          className={`filter-tab ${filter === "rejected" ? "active" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          Rejected ({requests.filter((r) => r.status === "Rejected").length})
        </button>
      </div>
      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <h4>No {filter !== "all" ? filter : ""} requests found</h4>
          <p>
            You haven't submitted any{" "}
            {filter !== "all" ? filter.toLowerCase() : ""} change requests yet.
          </p>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map((request) => (
            <div key={request.requestId} className="request-card">
              <div className="request-card-header">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="request-field-name mb-0">
                    <i
                      className={`bi ${
                        request.changeType === "Email"
                          ? "bi-envelope"
                          : "bi-person-badge"
                      } me-2`}
                    ></i>
                    {getChangeTypeLabel(request.changeType)}
                  </h5>
                  <span className={getStatusBadge(request.status)}>
                    {request.status}
                  </span>
                </div>
                {request.status === "Pending" && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleCancel(request.requestId)}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Cancel
                  </button>
                )}
              </div>
              <div className="request-card-body">
                <div className="row align-items-center mb-3">
                  <div className="col-md-5">
                    <label className="request-label">Current Value</label>
                    <p className="request-value">
                      {request.currentValue || "Not set"}
                    </p>
                  </div>
                  <div className="col-md-2 text-center">
                    <i className="bi bi-arrow-right request-arrow"></i>
                  </div>
                  <div className="col-md-5">
                    <label className="request-label">Requested Value</label>
                    <p className="request-value text-primary fw-bold">
                      {request.newValue}
                    </p>
                  </div>
                </div>
                <div className="request-reason mb-3">
                  <label className="request-label">
                    <i className="bi bi-chat-left-quote me-1"></i>
                    Reason
                  </label>
                  <p className="mb-0">{request.reason}</p>
                </div>
                <div className="request-meta">
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    Requested: {formatDate(request.requestedAt)}
                  </span>
                  {request.processedAt && (
                    <span>
                      <i className="bi bi-check-circle me-1"></i>
                      Processed: {formatDate(request.processedAt)}
                    </span>
                  )}
                </div>
                {request.adminRemarks && (
                  <div className="admin-remarks mt-3">
                    <label className="request-label">
                      <i className="bi bi-shield-check me-1"></i>
                      Admin Remarks
                    </label>
                    <p className="mb-0">{request.adminRemarks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyChangeRequests;
