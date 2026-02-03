import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import rsvpService from "../../services/meeting/rsvpService";
import momService from "../../services/meeting/momService";
import toastr from "toastr";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/RSVPSummary.css";

const RSVPSummary = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  useEffect(() => {
    if (meetingId) {
      loadSummary();
    }
  }, [meetingId]);

  const loadSummary = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      setError(null);

      // Call 1: Get RSVP summary (counts only)
      const summaryResponse = await rsvpService.getMeetingRsvpSummary(
        meetingId
      );

      // Extract summary data
      let summaryData = null;
      if (summaryResponse?.success && summaryResponse?.data) {
        summaryData = summaryResponse.data;
      } else if (summaryResponse?.Success && summaryResponse?.Data) {
        summaryData = summaryResponse.Data;
      } else if (summaryResponse?.data) {
        summaryData = summaryResponse.data;
      } else if (summaryResponse?.Data) {
        summaryData = summaryResponse.Data;
      } else {
        summaryData = summaryResponse;
      }

      setSummary(summaryData);

      // Call 2: Get MOM details (which includes meeting info and participants)
      try {
        // Option A: Try to get all MOMs and find the one with this meeting ID
        const momsResponse = await momService.getMyMoms({
          pageSize: 1000,
          pageNumber: 1,
        });

        let allMoms = [];

        // Extract MOMs array from paginated response
        if (momsResponse?.data?.data) {
          allMoms = momsResponse.data.data;
        } else if (momsResponse?.Data?.Data) {
          allMoms = momsResponse.Data.Data;
        } else if (momsResponse?.data?.moms) {
          allMoms = momsResponse.data.moms;
        } else if (momsResponse?.Data?.Moms) {
          allMoms = momsResponse.Data.Moms;
        } else if (Array.isArray(momsResponse?.data)) {
          allMoms = momsResponse.data;
        } else if (Array.isArray(momsResponse?.Data)) {
          allMoms = momsResponse.Data;
        }

        // Find MOM with this meeting ID
        const mom = allMoms.find((m) => {
          const mId = getProperty(m, "meetingId", "MeetingId");
          return mId && parseInt(mId) === parseInt(meetingId);
        });

        if (mom) {
          setMeetingDetails(mom);

          // Get participants from MOM's meeting data
          const participantsList =
            getProperty(mom, "participants", "Participants") ||
            getProperty(mom, "meetingParticipants", "MeetingParticipants") ||
            getProperty(mom, "meetingparticipants", "Meetingparticipants") ||
            [];

          setParticipants(
            Array.isArray(participantsList) ? participantsList : []
          );
        } else {
          // If MOM not found in user's MOMs, try to get meeting from getMeetingById
          console.warn(
            "MOM not found in user's MOMs, trying getMeetingById fallback"
          );

          try {
            const meetingResponse = await momService.getMeetingById(meetingId);

            let meetingData = null;
            if (meetingResponse?.success && meetingResponse?.data) {
              meetingData = meetingResponse.data;
            } else if (meetingResponse?.Success && meetingResponse?.Data) {
              meetingData = meetingResponse.Data;
            } else if (meetingResponse?.data) {
              meetingData = meetingResponse.data;
            } else if (meetingResponse?.Data) {
              meetingData = meetingResponse.Data;
            } else {
              meetingData = meetingResponse;
            }

            setMeetingDetails(meetingData);

            const participantsList =
              getProperty(meetingData, "participants", "Participants") ||
              getProperty(
                meetingData,
                "meetingparticipants",
                "Meetingparticipants"
              ) ||
              [];

            setParticipants(
              Array.isArray(participantsList) ? participantsList : []
            );
          } catch (fallbackErr) {
            console.error("Fallback getMeetingById also failed:", fallbackErr);
            setMeetingDetails(null);
            setParticipants([]);
          }
        }
      } catch (err) {
        console.error("Failed to load meeting/MOM details:", err);

        // Don't fail the whole summary if meeting details fail
        // Just show summary without meeting title and participants
        setMeetingDetails(null);
        setParticipants([]);

        // Show a warning but don't block the page
        if (!silent) {
          toastr.warning("Meeting details unavailable, showing counts only");
        }
      }
    } catch (err) {
      console.error("Load summary error:", err);

      // Enhanced error handling
      if (err.retryAfter) {
        if (!silent) {
          setError(
            `Rate limit exceeded. Please wait ${err.retryAfter} seconds.`
          );
          toastr.error(
            `Rate limit exceeded. Please wait ${err.retryAfter} seconds.`
          );
        }
      } else if (err.response?.status === 403 || err.status === 403) {
        setError("You do not have permission to view this RSVP summary.");
        if (!silent) toastr.error("Access denied");
      } else if (err.response?.status === 404 || err.status === 404) {
        setError("Meeting not found or no RSVP data available.");
        if (!silent) toastr.error("Meeting not found");
      } else if (err.message) {
        setError(err.message);
        if (!silent) toastr.error(err.message);
      } else {
        setError("Failed to load RSVP summary");
        if (!silent) toastr.error("Failed to load RSVP summary");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    // Handle both string and enum values
    const statusStr =
      typeof status === "number"
        ? ["Pending", "Accepted", "Declined", "Tentative"][status]
        : status;

    switch (statusStr) {
      case "Accepted":
      case "1":
        return (
          <span className="badge bg-success d-inline-flex align-items-center gap-1">
            <CheckCircle size={14} /> Accepted
          </span>
        );
      case "Declined":
      case "2":
        return (
          <span className="badge bg-danger d-inline-flex align-items-center gap-1">
            <XCircle size={14} /> Declined
          </span>
        );
      case "Tentative":
      case "3":
        return (
          <span className="badge bg-info text-dark d-inline-flex align-items-center gap-1">
            <AlertCircle size={14} /> Tentative
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
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

  const toPercentInt = (value) => {
    const v = Math.round(value);
    return Math.max(0, Math.min(100, v));
  };

  if (loading) {
    return (
      <div className="rsvp-sum-loading">
        <div
          className="spinner-border text-primary rsvp-sum-spinner"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading RSVP summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid rsvp-sum-page">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container-fluid rsvp-sum-page">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="alert alert-warning d-flex align-items-center gap-2">
              <AlertCircle size={20} />
              <span>No RSVP data available for this meeting</span>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract properties from summary
  const totalInvitations =
    getProperty(summary, "totalInvitations", "TotalInvitations") || 0;
  const acceptedCount =
    getProperty(summary, "acceptedCount", "AcceptedCount") || 0;
  const declinedCount =
    getProperty(summary, "declinedCount", "DeclinedCount") || 0;
  const tentativeCount =
    getProperty(summary, "tentativeCount", "TentativeCount") || 0;
  const pendingCount =
    getProperty(summary, "pendingCount", "PendingCount") || 0;

  // Get meeting title from meeting details
  const meetingTitle = meetingDetails
    ? getProperty(meetingDetails, "meetingTitle", "MeetingTitle") ||
      "Meeting RSVP Summary"
    : "Meeting RSVP Summary";

  const responsePercentage =
    totalInvitations > 0
      ? Math.round(((totalInvitations - pendingCount) / totalInvitations) * 100)
      : 0;

  const acceptedPct =
    totalInvitations > 0 ? (acceptedCount / totalInvitations) * 100 : 0;
  const tentativePct =
    totalInvitations > 0 ? (tentativeCount / totalInvitations) * 100 : 0;
  const declinedPct =
    totalInvitations > 0 ? (declinedCount / totalInvitations) * 100 : 0;
  const pendingPct =
    totalInvitations > 0 ? (pendingCount / totalInvitations) * 100 : 0;

  const acceptedClass = `rsvp-sum-w-${toPercentInt(acceptedPct)}`;
  const tentativeClass = `rsvp-sum-w-${toPercentInt(tentativePct)}`;
  const declinedClass = `rsvp-sum-w-${toPercentInt(declinedPct)}`;
  const pendingClass = `rsvp-sum-w-${toPercentInt(pendingPct)}`;

  return (
    <div className="container-fluid rsvp-sum-page">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          <div className="rsvp-sum-header d-flex align-items-center gap-3 flex-wrap">
            <button
              className="btn btn-light rsvp-sum-back-btn d-flex align-items-center justify-content-center"
              onClick={() => navigate(-1)}
              type="button"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-grow-1">
              <h2 className="fw-bold mb-1 rsvp-sum-title">RSVP Summary</h2>
              <p className="text-muted mb-0 d-flex align-items-center gap-2 rsvp-sum-subtitle">
                <Calendar size={16} />
                {meetingTitle}
              </p>
            </div>

            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              type="button"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "spinner-icon" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <Users size={28} className="text-primary mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {totalInvitations}
                  </div>
                  <small className="text-muted">Total Invited</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <CheckCircle size={28} className="text-success mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {acceptedCount}
                  </div>
                  <small className="text-muted">Accepted</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <XCircle size={28} className="text-danger mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {declinedCount}
                  </div>
                  <small className="text-muted">Declined</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <AlertCircle size={28} className="text-info mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {tentativeCount}
                  </div>
                  <small className="text-muted">Tentative</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <Clock size={28} className="text-secondary mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {pendingCount}
                  </div>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4 col-6">
              <div className="card border-0 shadow-sm h-100 rsvp-sum-stat-card">
                <div className="card-body text-center p-3">
                  <TrendingUp size={28} className="text-primary mb-2" />
                  <div className="fw-bold fs-4 mb-1 rsvp-sum-stat-number">
                    {responsePercentage}%
                  </div>
                  <small className="text-muted">Response Rate</small>
                </div>
              </div>
            </div>
          </div>

          {/* Response Breakdown */}
          {totalInvitations > 0 && (
            <div className="card border-0 shadow-sm mb-4 rsvp-sum-breakdown-card">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Response Breakdown</h6>

                <div
                  className="progress mb-3 rsvp-sum-progress"
                  style={{ height: "32px" }}
                >
                  {acceptedCount > 0 && (
                    <div
                      className={`progress-bar bg-success d-flex align-items-center justify-content-center ${acceptedClass}`}
                      role="progressbar"
                      aria-valuenow={acceptedCount}
                      aria-valuemin="0"
                      aria-valuemax={totalInvitations}
                    >
                      <small className="fw-semibold">{acceptedCount}</small>
                    </div>
                  )}

                  {tentativeCount > 0 && (
                    <div
                      className={`progress-bar bg-info d-flex align-items-center justify-content-center ${tentativeClass}`}
                      role="progressbar"
                      aria-valuenow={tentativeCount}
                      aria-valuemin="0"
                      aria-valuemax={totalInvitations}
                    >
                      <small className="fw-semibold text-dark">
                        {tentativeCount}
                      </small>
                    </div>
                  )}

                  {declinedCount > 0 && (
                    <div
                      className={`progress-bar bg-danger d-flex align-items-center justify-content-center ${declinedClass}`}
                      role="progressbar"
                      aria-valuenow={declinedCount}
                      aria-valuemin="0"
                      aria-valuemax={totalInvitations}
                    >
                      <small className="fw-semibold">{declinedCount}</small>
                    </div>
                  )}

                  {pendingCount > 0 && (
                    <div
                      className={`progress-bar bg-secondary d-flex align-items-center justify-content-center ${pendingClass}`}
                      role="progressbar"
                      aria-valuenow={pendingCount}
                      aria-valuemin="0"
                      aria-valuemax={totalInvitations}
                    >
                      <small className="fw-semibold">{pendingCount}</small>
                    </div>
                  )}
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-success d-inline-flex align-items-center gap-1">
                    <CheckCircle size={12} /> Accepted ({acceptedCount})
                  </span>
                  <span className="badge bg-info text-dark d-inline-flex align-items-center gap-1">
                    <AlertCircle size={12} /> Tentative ({tentativeCount})
                  </span>
                  <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                    <XCircle size={12} /> Declined ({declinedCount})
                  </span>
                  <span className="badge bg-secondary d-inline-flex align-items-center gap-1">
                    <Clock size={12} /> Pending ({pendingCount})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Participants Table */}
          <div className="card border-0 shadow-sm rsvp-sum-participants-card">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-4 d-flex align-items-center gap-2">
                <Users size={22} />
                Participants{" "}
                {Array.isArray(participants) &&
                  participants.length > 0 &&
                  `(${participants.length})`}
              </h5>

              {!Array.isArray(participants) || participants.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Users
                    size={48}
                    className="mb-3 rsvp-sum-participants-icon"
                  />
                  <p className="mb-0">No participants data available</p>
                  <small className="text-muted">
                    Participant details may not be available for this meeting
                  </small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-semibold rsvp-sum-th">
                          Employee Name
                        </th>
                        <th className="fw-semibold rsvp-sum-th">Status</th>
                        <th className="fw-semibold rsvp-sum-th">
                          Response Date
                        </th>
                        <th className="fw-semibold rsvp-sum-th">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => {
                        const participantId = getProperty(
                          participant,
                          "participantId",
                          "ParticipantId"
                        );
                        const employeeId = getProperty(
                          participant,
                          "employeeId",
                          "EmployeeId"
                        );

                        // Get employee name from nested employee object
                        const employee = getProperty(
                          participant,
                          "employee",
                          "Employee"
                        );
                        const userProfile = employee
                          ? getProperty(employee, "userprofile", "Userprofile")
                          : null;

                        const firstName = userProfile
                          ? getProperty(userProfile, "firstName", "FirstName")
                          : "";
                        const lastName = userProfile
                          ? getProperty(userProfile, "lastName", "LastName")
                          : "";
                        const employeeName =
                          `${firstName} ${lastName}`.trim() || "Unknown";

                        const rsvpStatus =
                          getProperty(
                            participant,
                            "rsvpstatus",
                            "Rsvpstatus"
                          ) ||
                          getProperty(participant, "rsvpStatus", "RsvpStatus");
                        const rsvpResponseDate =
                          getProperty(
                            participant,
                            "rsvpresponseDate",
                            "RsvpresponseDate"
                          ) ||
                          getProperty(
                            participant,
                            "rsvpResponseDate",
                            "RsvpResponseDate"
                          );
                        const rsvpComments =
                          getProperty(
                            participant,
                            "rsvpcomments",
                            "Rsvpcomments"
                          ) ||
                          getProperty(
                            participant,
                            "rsvpComments",
                            "RsvpComments"
                          );

                        return (
                          <tr key={participantId || employeeId || index}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rsvp-sum-avatar">
                                  <Users
                                    size={18}
                                    className="rsvp-sum-avatar-icon"
                                  />
                                </div>
                                <span className="fw-semibold">
                                  {employeeName}
                                </span>
                              </div>
                            </td>
                            <td>{getStatusBadge(rsvpStatus)}</td>
                            <td>
                              <span className="text-muted">
                                {formatDateTime(rsvpResponseDate)}
                              </span>
                            </td>
                            <td>
                              {rsvpComments ? (
                                <div className="d-flex align-items-start gap-2">
                                  <MessageSquare
                                    size={16}
                                    className="text-muted rsvp-sum-comment-icon"
                                  />
                                  <small className="text-muted">
                                    {rsvpComments}
                                  </small>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPSummary;
