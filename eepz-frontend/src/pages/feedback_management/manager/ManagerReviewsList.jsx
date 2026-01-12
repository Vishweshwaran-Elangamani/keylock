import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Star,
  User,
  Save,
  Loader,
  X,
  Plus,
  Calendar,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  employeeApi,
  managerReviewApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import FeedbackBreadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/ManagerReviewsList.css";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ManagerReviewsList() {
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});
  const [employees, setEmployees] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    targetEmployeeId: "",
    rating: 3,
    reviewComment: "",
    projectContext: "",
    goalContext: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const enrichReviews = (reviewsList, empMap) => {
    return reviewsList.map((review) => ({
      ...review,
      managerName:
        empMap[review.managerEmployeeId] ||
        `Manager ${review.managerEmployeeId}`,
      targetEmployeeName:
        empMap[review.targetEmployeeId] ||
        review.targetEmployeeName ||
        `Employee ${review.targetEmployeeId}`,
    }));
  };

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      let empMap = {};
      let empList = [];
      try {
        const empRes = await employeeApi.getAll();
        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          empList = empRes.data.data;
          setEmployeeMap(empMap);
          setEmployees(empList);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      const managerId = user?.empId || 1002;
      const res = await managerReviewApi.getByManager(managerId);

      if (res.data?.success && Array.isArray(res.data.data)) {
        const enriched = enrichReviews(res.data.data, empMap);
        setReviews(enriched);
      } else {
        setReviews([]);
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to fetch reviews";
      setError(errorMsg);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.empId]);

  const handleView = (id) => {
    navigate(`/manager/dashboard/feedback/review/${id}`);
  };

  const handleEdit = async (review) => {
    setEditingReview(review);
    setEditForm({
      targetEmployeeId: review.targetEmployeeId || "",
      rating: review.rating || 3,
      reviewComment: review.reviewComment || "",
      projectContext: review.projectContext || "",
      goalContext: review.goalContext || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editForm.targetEmployeeId || !editForm.reviewComment?.trim()) {
      toast.error("Please select employee and enter review comment");
      return;
    }

    setEditLoading(true);

    try {
      toast.success("Review updated successfully!");
      setShowEditModal(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to update review";
      toast.error(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingReview(null);
    setEditForm({
      targetEmployeeId: "",
      rating: 3,
      reviewComment: "",
      projectContext: "",
      goalContext: "",
    });
  };

  const selectedEmployee = useMemo(() => {
    return employees.find(
      (e) => e.employeeId === Number(editForm.targetEmployeeId)
    );
  }, [editForm.targetEmployeeId, employees]);

  return (
    <>
      {showEditModal && (
        <>
          <div
            className="fm-mgrrev-modal-backdrop"
            onClick={handleCloseEditModal}
          />
          <div className="fm-mgrrev-modal-wrapper">
            <div className="fm-mgrrev-modal">
              <div className="fm-mgrrev-modal__header">
                <h5 className="fm-mgrrev-modal__title">Edit Review</h5>
                <button
                  className="fm-mgrrev-modal__close-btn"
                  onClick={handleCloseEditModal}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="fm-mgrrev-modal__body">
                <form onSubmit={handleSaveEdit} className="row g-3">
                  <div className="col-12">
                    <label className="fm-mgrrev-form-label">
                      Select Employee <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select fm-mgrrev-form-control"
                      value={editForm.targetEmployeeId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          targetEmployeeId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">-- Choose an employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEmployee && (
                    <div className="col-12">
                      <div className="fm-mgrrev-employee-info">
                        <strong>Reviewing:</strong> {selectedEmployee.firstName}{" "}
                        {selectedEmployee.lastName}
                        <br />
                        <small>
                          {selectedEmployee.email} • {selectedEmployee.roleName}
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="fm-mgrrev-form-label">
                      Rating <span className="text-danger">*</span>
                    </label>
                    <div className="fm-mgrrev-rating-buttons">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, rating })}
                          className={`fm-mgrrev-rating-btn ${
                            editForm.rating === rating
                              ? "fm-mgrrev-rating-btn--active"
                              : ""
                          }`}
                        >
                          <div className="fm-mgrrev-rating-btn__number">
                            {rating}
                          </div>
                          <div className="fm-mgrrev-rating-btn__label">
                            {RATING_LABELS[rating]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="fm-mgrrev-form-label">
                      Review Comment <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control fm-mgrrev-form-control"
                      rows={4}
                      value={editForm.reviewComment}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          reviewComment: e.target.value,
                        })
                      }
                      placeholder="Provide detailed feedback..."
                      required
                    />
                    <small className="text-muted">
                      {editForm.reviewComment.length} / 2000
                    </small>
                  </div>

                  <div className="col-12">
                    <label className="fm-mgrrev-form-label">
                      Project Context{" "}
                      <span className="text-muted">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control fm-mgrrev-form-control"
                      rows={2}
                      value={editForm.projectContext}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          projectContext: e.target.value,
                        })
                      }
                      placeholder="Mention any relevant projects..."
                    />
                  </div>

                  <div className="col-12">
                    <label className="fm-mgrrev-form-label">
                      Goal Context{" "}
                      <span className="text-muted">(Optional)</span>
                    </label>
                    <textarea
                      className="form-control fm-mgrrev-form-control"
                      rows={2}
                      value={editForm.goalContext}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          goalContext: e.target.value,
                        })
                      }
                      placeholder="Mention any relevant goals..."
                    />
                  </div>
                </form>
              </div>
              <div className="fm-mgrrev-modal__footer">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="fm-mgrrev-btn fm-mgrrev-btn--secondary"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="fm-mgrrev-btn fm-mgrrev-btn--primary"
                >
                  {editLoading ? (
                    <>
                      <Loader size={16} className="fm-mgrrev-icon-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="fm-mgrrev-page-wrapper">
        <div className="fm-mgrrev-container">
          <div className="fm-mgrrev-header">
            <FeedbackBreadcrumb
              items={[
                {
                  label: "Feedback Management",
                  path: "/manager/dashboard/feedback",
                },
                { label: "My Reviews" },
              ]}
            />
          </div>

          {error && (
            <div className="fm-mgrrev-error-alert alert alert-danger alert-dismissible fade show">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <div className="flex-grow-1">
                <strong>Error</strong>
                <p className="mb-0 mt-1">{error}</p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
              />
            </div>
          )}

          {loading ? (
            <div className="fm-mgrrev-loading">
              <div
                className="spinner-border fm-mgrrev-loading__spinner"
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="fm-mgrrev-loading__text">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="fm-mgrrev-empty">
              <User size={48} className="fm-mgrrev-empty__icon" />
              <p className="fm-mgrrev-empty__text">No reviews created yet</p>
            </div>
          ) : (
            <div className="fm-mgrrev-cards-grid">
              {reviews.map((review) => {
                const isSubmitted =
                  review.status === "Submitted" ||
                  review.submitted === true ||
                  review.isSubmitted === true;
                const isFinalized = review.status === "Finalized";

                let statusClass = "fm-mgrrev-status--success";
                let statusText = "Submitted";

                if (isFinalized) {
                  statusClass = "fm-mgrrev-status--info";
                  statusText = "Finalized";
                }

                return (
                  <div key={review.reviewcommentId} className="fm-mgrrev-card">
                    <div className="fm-mgrrev-card__header">
                      <div className="fm-mgrrev-card__label">Employee</div>
                      <div className="fm-mgrrev-card__rating-badge">
                        {review.rating || 0}/5
                      </div>
                    </div>

                    <div className="fm-mgrrev-card__body">
                      <div className="fm-mgrrev-card__employee">
                        <User size={16} className="fm-mgrrev-card__user-icon" />
                        <span className="fm-mgrrev-card__employee-name">
                          {review.targetEmployeeName}
                        </span>
                      </div>

                      <div className="fm-mgrrev-card__date">
                        <Calendar
                          size={14}
                          className="fm-mgrrev-card__calendar-icon"
                        />
                        <span className="fm-mgrrev-card__date-text">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString(
                                "en-GB"
                              )
                            : "—"}
                        </span>
                      </div>

                      <div className="fm-mgrrev-card__comment">
                        <p className="fm-mgrrev-card__comment-text">
                          {review.reviewComment || "No comment"}
                        </p>
                      </div>
                    </div>

                    <div className="fm-mgrrev-card__footer">
                      <div className="fm-mgrrev-card__stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`fm-mgrrev-star ${
                              i < (review.rating || 0)
                                ? "fm-mgrrev-star--filled"
                                : "fm-mgrrev-star--empty"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleView(review.reviewcommentId)}
                        className="fm-mgrrev-card__view-btn"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
