// src/components/sla/TeamReviewTable.jsx
import React from 'react';
import { Eye, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const TeamReviewTable = ({ reviews, onViewDetails }) => {
  //  Debug logging
  React.useEffect(() => {
    console.log(' TeamReviewTable received reviews:', reviews);
    console.log(' Total reviews in table:', reviews.length);
    if (reviews.length > 0) {
      console.log(' First review:', reviews[0]);
    }
  }, [reviews]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not submitted';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateUrgencyStatus = (deadline, status, submittedAt) => {
    if (submittedAt || status === 'Submitted') return { text: 'Submitted', color: 'success' };

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) return { text: 'Overdue', color: 'danger' };
    if (daysUntilDeadline <= 1) return { text: `${daysUntilDeadline} day(s) left`, color: 'warning' };
    return { text: `${daysUntilDeadline} day(s) left`, color: 'success' };
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-success';
      case 'InProgress': return 'bg-info';
      case 'Pending': return 'bg-primary';
      case 'Overdue': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="py-3">Review Type</th>
                <th className="py-3">Review Cycle</th>
                <th className="py-3">Deadline</th>
                <th className="py-3">Submitted</th>
                <th className="py-3">Status</th>
                <th className="py-3">Days Left</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <Clock size={48} className="text-muted mb-3" />
                    <p className="text-muted mb-0">No team reviews for this period</p>
                  </td>
                </tr>
              ) : (
                reviews.map(review => {
                  const urgency = calculateUrgencyStatus(
                    review.deadline,
                    review.status,
                    review.submittedAt
                  );

                  const daysUntil = review.daysUntilDeadline;

                  return (
                    <tr key={review.reviewTrackingId || review.slaid}>
                      <td className="px-4">
                        <div>
                          <strong>{review.employeeName}</strong><br />
                          <small className="text-muted">{review.employeeEmail}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {review.reviewType || 'Manager'}
                        </span>
                      </td>
                      <td>
                        <small className="fw-semibold">{review.reviewCycle}</small>
                      </td>
                      <td>
                        <div>
                          <small className="fw-semibold">
                            {formatDate(review.deadline).split(',')[0]}
                          </small>
                          {review.submittedAt && (
                            <>
                              <br />
                              <small className="text-success">
                                Submitted: {formatDate(review.submittedAt).split(',')[0]}
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {review.submittedAt ? (
                          <small className="text-success">
                            ✓ {formatDate(review.submittedAt)}
                          </small>
                        ) : (
                          <small className="text-muted">Not submitted</small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(review.status)}`}>
                          {review.status === 'Submitted' ? '✓ Submitted' : review.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          {urgency.color === 'danger' ? (
                            <AlertTriangle size={14} className="text-danger" />
                          ) : urgency.color === 'warning' ? (
                            <Clock size={14} className="text-warning" />
                          ) : (
                            <CheckCircle size={14} className="text-success" />
                          )}
                          <small className={`text-${urgency.color}`}>
                            {urgency.text}
                          </small>
                        </div>
                      </td>
                      <td className="px-4">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onViewDetails(review.slaid || review.slaId)}
                          title="View details"
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
  );
};

export default TeamReviewTable;
