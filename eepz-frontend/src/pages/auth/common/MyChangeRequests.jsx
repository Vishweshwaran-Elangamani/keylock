/**
 * MyChangeRequests Component
 * 
 * Displays a list of the user's change requests with filtering and status tracking.
 * Features:
 * - Filter by status (All, Pending, Approved, Rejected)
 * - View request details including current and requested values
 * - Cancel pending requests
 * - Toast notifications using Sonner for user feedback
 * - Empty state handling
 * - Responsive design
 * 
 * @component
 */

import { useState, useEffect } from "react";
import ChangeRequestService from "../../../services/auth/changeRequestService";
import { toast } from "sonner";
import "../../../styles/auth/common/MyChangeRequests.css";

const MyChangeRequests = () => {
  // ========================
  // STATE MANAGEMENT
  // ========================

  /**
   * Requests state - stores array of change requests
   */
  const [requests, setRequests] = useState([]);

  /**
   * Loading state - tracks initial data fetch status
   */
  const [loading, setLoading] = useState(true);

  /**
   * Filter state - tracks selected status filter
   * Options: "all", "pending", "approved", "rejected"
   */
  const [filter, setFilter] = useState("all");

  // ========================
  // EFFECTS
  // ========================

  /**
   * Effect: Fetch user's change requests on component mount
   */
  useEffect(() => {
    fetchMyRequests();
  }, []);

  // ========================
  // API FUNCTIONS
  // ========================

  /**
   * Fetches all change requests for the current user
   * Shows Sonner toast notifications for user feedback
   */
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      toast.loading("Loading change requests...");

      // -------- API Call --------
      const response = await ChangeRequestService.getMyChangeRequests();

      // -------- Handle Success Response --------
      if (response.success) {
        setRequests(response.data);
        toast.dismiss();
        toast.success(`Loaded ${response.data.length} change requests`);
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message);
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error fetching requests:", error);
      toast.dismiss();
      toast.error("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handles cancellation of a pending change request
   * Shows confirmation dialog and makes API call
   * 
   * @param {string} requestId - ID of the request to cancel
   */
  const handleCancel = async (requestId) => {
    // Show confirmation dialog
    if (
      !window.confirm("Are you sure you want to cancel this change request?")
    ) {
      return;
    }

    try {
      toast.loading("Cancelling request...");

      // -------- API Call --------
      const response = await ChangeRequestService.cancelChangeRequest(requestId);

      // -------- Handle Success Response --------
      if (response.success) {
        toast.dismiss();
        toast.success(response.message || "Request cancelled successfully");
        // Refresh the requests list
        fetchMyRequests();
      } else {
        // -------- Handle Failure Response --------
        toast.dismiss();
        toast.error(response.message || "Failed to cancel request");
      }
    } catch (error) {
      // -------- Handle Exception --------
      console.error("Error cancelling request:", error);
      toast.dismiss();
      toast.error("Failed to cancel request");
    }
  };

  // ========================
  // HELPER FUNCTIONS
  // ========================

  /**
   * Returns CSS class for status badge
   * Different colors for different statuses
   * 
   * @param {string} status - Request status
   * @returns {string} CSS class name
   */
  const getStatusBadge = (status) => {
    const badges = {
      Pending: "badge bg-warning text-dark",
      Approved: "badge bg-success",
      Rejected: "badge bg-danger",
    };
    return badges[status] || "badge bg-secondary";
  };

  /**
   * Returns human-readable label for change type
   * 
   * @param {string} changeType - Type of change
   * @returns {string} Formatted label
   */
  const getChangeTypeLabel = (changeType) => {
    const labels = {
      EmployeeCompanyId: "Employee Company ID",
      Email: "Email Address",
    };
    return labels[changeType] || changeType;
  };

  /**
   * Formats date string to readable format
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
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

  // ========================
  // FILTER LOGIC
  // ========================

  /**
   * Filters requests based on selected filter
   * 
   * @returns {Array} Filtered requests
   */
  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status.toLowerCase() === filter.toLowerCase();
  });

  // ========================
  // LOADING STATE
  // ========================

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

  // ========================
  // RENDER LOGIC
  // ========================
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

      {/* ======================== */}
      {/* FILTER TABS */}
      {/* ======================== */}
      <div className="filter-tabs mb-4">
        {/* All Tab */}
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({requests.length})
        </button>

        {/* Pending Tab */}
        <button
          className={`filter-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({requests.filter((r) => r.status === "Pending").length})
        </button>

        {/* Approved Tab */}
        <button
          className={`filter-tab ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved ({requests.filter((r) => r.status === "Approved").length})
        </button>

        {/* Rejected Tab */}
        <button
          className={`filter-tab ${filter === "rejected" ? "active" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          Rejected ({requests.filter((r) => r.status === "Rejected").length})
        </button>
      </div>

      {/* ======================== */}
      {/* REQUESTS LIST OR EMPTY STATE */}
      {/* ======================== */}
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
              {/* -------- Card Header -------- */}
              <div className="request-card-header">
                <div className="d-flex align-items-center gap-3">
                  {/* Change Type Label */}
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
                  {/* Status Badge */}
                  <span className={getStatusBadge(request.status)}>
                    {request.status}
                  </span>
                </div>
                {/* Cancel Button - Only for Pending Requests */}
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

              {/* -------- Card Body -------- */}
              <div className="request-card-body">
                {/* Current vs Requested Value */}
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

                {/* Reason Section */}
                <div className="request-reason mb-3">
                  <label className="request-label">
                    <i className="bi bi-chat-left-quote me-1"></i>
                    Reason
                  </label>
                  <p className="mb-0">{request.reason}</p>
                </div>

                {/* Metadata - Dates */}
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

                {/* Admin Remarks - Only if exists */}
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

// Old
// import { useState, useEffect } from "react";
// import ChangeRequestService from "../../../services/auth/changeRequestService";
// import toastr from "toastr";
// import "toastr/build/toastr.min.css";
// import "../../../styles/auth/common/MyChangeRequests.css";

// const MyChangeRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("all");

//   toastr.options = {
//     closeButton: true,
//     progressBar: true,
//     positionClass: "toast-top-right",
//     timeOut: 3000,
//   };

//   useEffect(() => {
//     fetchMyRequests();
//   }, []);

//   const fetchMyRequests = async () => {
//     try {
//       setLoading(true);
//       const response = await ChangeRequestService.getMyChangeRequests();
//       if (response.success) {
//         setRequests(response.data);
//       } else {
//         toastr.error(response.message);
//       }
//     } catch (error) {
//       console.error("Error fetching requests:", error);
//       toastr.error("Failed to load change requests");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = async (requestId) => {
//     if (
//       !window.confirm("Are you sure you want to cancel this change request?")
//     ) {
//       return;
//     }

//     const response = await ChangeRequestService.cancelChangeRequest(requestId);
//     if (response.success) {
//       toastr.success(response.message);
//       fetchMyRequests();
//     } else {
//       toastr.error(response.message);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       Pending: "badge bg-warning text-dark",
//       Approved: "badge bg-success",
//       Rejected: "badge bg-danger",
//     };
//     return badges[status] || "badge bg-secondary";
//   };

//   const getChangeTypeLabel = (changeType) => {
//     const labels = {
//       EmployeeCompanyId: "Employee Company ID",
//       Email: "Email Address",
//     };
//     return labels[changeType] || changeType;
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const filteredRequests = requests.filter((req) => {
//     if (filter === "all") return true;
//     return req.status.toLowerCase() === filter.toLowerCase();
//   });

//   if (loading) {
//     return (
//       <div
//         className="d-flex justify-content-center align-items-center"
//         style={{ minHeight: "400px" }}
//       >
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="change-request-container">
//       <div className="change-request-header">
//         <h2>
//           <i className="bi bi-clock-history me-2"></i>
//           My Change Requests
//         </h2>
//         <p className="text-muted">
//           Track the status of your account change requests
//         </p>
//       </div>

//       {/* Filter Tabs */}
//       <div className="filter-tabs mb-4">
//         <button
//           className={`filter-tab ${filter === "all" ? "active" : ""}`}
//           onClick={() => setFilter("all")}
//         >
//           All ({requests.length})
//         </button>
//         <button
//           className={`filter-tab ${filter === "pending" ? "active" : ""}`}
//           onClick={() => setFilter("pending")}
//         >
//           Pending ({requests.filter((r) => r.status === "Pending").length})
//         </button>
//         <button
//           className={`filter-tab ${filter === "approved" ? "active" : ""}`}
//           onClick={() => setFilter("approved")}
//         >
//           Approved ({requests.filter((r) => r.status === "Approved").length})
//         </button>
//         <button
//           className={`filter-tab ${filter === "rejected" ? "active" : ""}`}
//           onClick={() => setFilter("rejected")}
//         >
//           Rejected ({requests.filter((r) => r.status === "Rejected").length})
//         </button>
//       </div>

//       {/* Requests List */}
//       {filteredRequests.length === 0 ? (
//         <div className="empty-state">
//           <i className="bi bi-inbox"></i>
//           <h4>No {filter !== "all" ? filter : ""} requests found</h4>
//           <p>
//             You haven't submitted any{" "}
//             {filter !== "all" ? filter.toLowerCase() : ""} change requests yet.
//           </p>
//         </div>
//       ) : (
//         <div className="requests-list">
//           {filteredRequests.map((request) => (
//             <div key={request.requestId} className="request-card">
//               <div className="request-card-header">
//                 <div className="d-flex align-items-center gap-3">
//                   <h5 className="request-field-name mb-0">
//                     <i
//                       className={`bi ${
//                         request.changeType === "Email"
//                           ? "bi-envelope"
//                           : "bi-person-badge"
//                       } me-2`}
//                     ></i>
//                     {getChangeTypeLabel(request.changeType)}
//                   </h5>
//                   <span className={getStatusBadge(request.status)}>
//                     {request.status}
//                   </span>
//                 </div>
//                 {request.status === "Pending" && (
//                   <button
//                     className="btn btn-sm btn-outline-danger"
//                     onClick={() => handleCancel(request.requestId)}
//                   >
//                     <i className="bi bi-x-circle me-1"></i>
//                     Cancel
//                   </button>
//                 )}
//               </div>

//               <div className="request-card-body">
//                 <div className="row align-items-center mb-3">
//                   <div className="col-md-5">
//                     <label className="request-label">Current Value</label>
//                     <p className="request-value">
//                       {request.currentValue || "Not set"}
//                     </p>
//                   </div>
//                   <div className="col-md-2 text-center">
//                     <i className="bi bi-arrow-right request-arrow"></i>
//                   </div>
//                   <div className="col-md-5">
//                     <label className="request-label">Requested Value</label>
//                     <p className="request-value text-primary fw-bold">
//                       {request.newValue}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="request-reason mb-3">
//                   <label className="request-label">
//                     <i className="bi bi-chat-left-quote me-1"></i>
//                     Reason
//                   </label>
//                   <p className="mb-0">{request.reason}</p>
//                 </div>

//                 <div className="request-meta">
//                   <span>
//                     <i className="bi bi-calendar me-1"></i>
//                     Requested: {formatDate(request.requestedAt)}
//                   </span>
//                   {request.processedAt && (
//                     <span>
//                       <i className="bi bi-check-circle me-1"></i>
//                       Processed: {formatDate(request.processedAt)}
//                     </span>
//                   )}
//                 </div>

//                 {request.adminRemarks && (
//                   <div className="admin-remarks mt-3">
//                     <label className="request-label">
//                       <i className="bi bi-shield-check me-1"></i>
//                       Admin Remarks
//                     </label>
//                     <p className="mb-0">{request.adminRemarks}</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyChangeRequests;
