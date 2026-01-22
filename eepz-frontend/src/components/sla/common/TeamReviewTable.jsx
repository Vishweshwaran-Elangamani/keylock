import React from "react";
import { Eye, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import "../../styles/sla/components/TeamReviewTable.css";

const TeamReviewTable = ({ reviews, onViewDetails }) => {
  React.useEffect(() => {
    if (reviews.length > 0) {
    }
  }, [reviews]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not submitted";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateUrgencyStatus = (deadline, status, submittedAt) => {
    if (submittedAt || status === "Submitted")
      return { text: "Submitted", color: "success" };

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = Math.ceil(
      (deadlineDate - now) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline < 0) return { text: "Overdue", color: "danger" };
    if (daysUntilDeadline <= 1)
      return { text: `${daysUntilDeadline} day(s) left`, color: "warning" };
    return { text: `${daysUntilDeadline} day(s) left`, color: "success" };
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Submitted":
        return "bg-success";
      case "InProgress":
        return "bg-info";
      case "Pending":
        return "bg-primary";
      case "Overdue":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="trt-scope">
      <div className="trt-card card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 trt-table">
              <thead className="trt-thead">
                <tr>
                  <th className="trt-th trt-th-employee">Employee</th>
                  <th className="trt-th">Review Type</th>
                  <th className="trt-th">Review Cycle</th>
                  <th className="trt-th">Deadline</th>
                  <th className="trt-th">Submitted</th>
                  <th className="trt-th">Status</th>
                  <th className="trt-th">Days Left</th>
                  <th className="trt-th trt-th-actions">Actions</th>
                </tr>
              </thead>

              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="trt-empty text-center py-5">
                      <Clock size={48} className="text-muted mb-3" />
                      <p className="text-muted mb-0">
                        No team reviews for this period
                      </p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => {
                    const urgency = calculateUrgencyStatus(
                      review.deadline,
                      review.status,
                      review.submittedAt
                    );

                    return (
                      <tr
                        key={review.reviewTrackingId || review.slaid}
                        className="trt-row"
                      >
                        <td className="trt-td trt-td-employee">
                          <div className="trt-employee">
                            <strong className="trt-employee-name">
                              {review.employeeName}
                            </strong>
                            <small className="trt-employee-email text-muted">
                              {review.employeeEmail}
                            </small>
                          </div>
                        </td>

                        <td className="trt-td">
                          <span className="badge bg-info">
                            {review.reviewType || "Manager"}
                          </span>
                        </td>

                        <td className="trt-td">
                          <small className="fw-semibold">
                            {review.reviewCycle}
                          </small>
                        </td>

                        <td className="trt-td">
                          <div className="trt-deadline">
                            <small className="fw-semibold">
                              {formatDate(review.deadline).split(",")[0]}
                            </small>

                            {review.submittedAt && (
                              <small className="trt-submitted-inline text-success">
                                Submitted:{" "}
                                {formatDate(review.submittedAt).split(",")[0]}
                              </small>
                            )}
                          </div>
                        </td>

                        <td className="trt-td">
                          {review.submittedAt ? (
                            <small className="text-success">
                              ✓ {formatDate(review.submittedAt)}
                            </small>
                          ) : (
                            <small className="text-muted">Not submitted</small>
                          )}
                        </td>

                        <td className="trt-td">
                          <span
                            className={`badge ${getStatusBadgeClass(
                              review.status
                            )}`}
                          >
                            {review.status === "Submitted"
                              ? "✓ Submitted"
                              : review.status}
                          </span>
                        </td>

                        <td className="trt-td">
                          <div className="trt-urgency d-flex align-items-center gap-1">
                            {urgency.color === "danger" ? (
                              <AlertTriangle
                                size={14}
                                className="text-danger"
                              />
                            ) : urgency.color === "warning" ? (
                              <Clock size={14} className="text-warning" />
                            ) : (
                              <CheckCircle size={14} className="text-success" />
                            )}
                            <small className={`text-${urgency.color}`}>
                              {urgency.text}
                            </small>
                          </div>
                        </td>

                        <td className="trt-td trt-td-actions">
                          <button
                            className="btn btn-sm btn-outline-primary trt-action-btn"
                            onClick={() =>
                              onViewDetails(review.slaid || review.slaId)
                            }
                            title="View details"
                            type="button"
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
        </div>
      </div>
    </div>
  );
};

export default TeamReviewTable;
