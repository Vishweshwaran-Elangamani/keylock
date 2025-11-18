import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  CheckCircle,
  Eye,
  Users,
  Clock,
  BarChart3,
  UserCheck,
  TrendingUp,
  Award,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return "—";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function FeedbackDepartmentHeadDashboard() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1006,
        firstName: "Department",
        lastName: "Head",
      },
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [allReviews, setAllReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewsAboutMe, setReviewsAboutMe] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [activeTab, setActiveTab] = useState("overview");

  const enrichReviews = (reviews, empMap) => {
    return reviews.map((review) => ({
      ...review,
      targetEmployeeName:
        empMap[review.targetEmployeeId] ||
        review.targetEmployeeName ||
        `Employee ${review.targetEmployeeId}`,
      managerName:
        empMap[review.managerEmployeeId] ||
        `Manager ${review.managerEmployeeId}`,
      createdAtFormatted: formatDate(review.createdAt),
    }));
  };

  const fetchEmployeeMap = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (empRes.data?.success && Array.isArray(empRes.data.data)) {
        const map = {};
        empRes.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log(" Employee map loaded:", Object.keys(map).length);
        return map;
      }
    } catch (err) {
      console.warn(" Error fetching employee map:", err.message);
    }
    return {};
  };

  const fetchAllData = async (empMap = {}) => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      const deptHeadId = user?.empId || 1006;

      // Get all reviews
      try {
        const allRes = await axios.get(`${API_BASE}/ManagerReview/all`);
        if (allRes.data?.success && Array.isArray(allRes.data.data)) {
          const enriched = enrichReviews(allRes.data.data, empMap);
          setAllReviews(enriched);
        }
      } catch (err) {
        console.warn(" Error fetching all reviews:", err.message);
      }

      // Get pending reviews
      try {
        const pendingRes = await axios.get(
          `${API_BASE}/ManagerReview/status/Pending`
        );
        if (pendingRes.data?.success && Array.isArray(pendingRes.data.data)) {
          const enriched = enrichReviews(pendingRes.data.data, empMap);
          setPendingReviews(enriched);
        }
      } catch (err) {
        console.warn(" Error fetching pending reviews:", err.message);
      }

      // Get approved reviews
      try {
        const approvedRes = await axios.get(
          `${API_BASE}/ManagerReview/status/Approved`
        );
        if (approvedRes.data?.success && Array.isArray(approvedRes.data.data)) {
          const enriched = enrichReviews(approvedRes.data.data, empMap);
          setApprovedReviews(enriched);
        }
      } catch (err) {
        console.warn(" Error fetching approved reviews:", err.message);
      }

      // Get reviews about me
      try {
        const targetRes = await axios.get(
          `${API_BASE}/ManagerReview/target/${deptHeadId}`
        );
        if (targetRes.data?.success && Array.isArray(targetRes.data.data)) {
          const enriched = enrichReviews(targetRes.data.data, empMap);
          setReviewsAboutMe(enriched);
        }
      } catch (err) {
        console.warn(" Error fetching reviews about me:", err.message);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(" Critical error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const empMap = await fetchEmployeeMap();
      await fetchAllData(empMap);
    };
    loadData();
  }, [user?.empId]);

  const stats = useMemo(
    () => [
      {
        label: "Total Reviews",
        value: allReviews.length,
        Icon: FileText,
        bgColor: "#dbeafe",
        iconColor: "#0F62FE",
      },
      {
        label: "Pending Reviews",
        value: pendingReviews.length,
        Icon: Clock,
        bgColor: "#fef3c7",
        iconColor: "#E2B93B",
      },
      {
        label: "Approved Reviews",
        value: approvedReviews.length,
        Icon: CheckCircle,
        bgColor: "#dcfce7",
        iconColor: "#24A148",
      },
      {
        label: "About Me",
        value: reviewsAboutMe.length,
        Icon: UserCheck,
        bgColor: "#f8f0ff",
        iconColor: "#9D4EDD",
      },
    ],
    [allReviews, pendingReviews, approvedReviews, reviewsAboutMe]
  );

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* BACK BUTTON & HEADER */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn d-flex align-items-center justify-content-center"
          onClick={() => navigate(-1)}
          style={{
            width: "40px",
            height: "40px",
            padding: 0,
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <ArrowLeft size={18} style={{ color: "#64748b" }} />
        </button>
        <div className="flex-grow-1">
          <h2
            className="fw-bold mb-0"
            style={{
              color: "#27235c",
              fontSize: "1.5rem",
              letterSpacing: "-0.025em",
            }}
          >
            Department Head Dashboard
          </h2>
          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            {user?.firstName} {user?.lastName} • Department Overview
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={() => fetchAllData(employeeMap)}
          disabled={refreshing || loading}
          style={{
            backgroundColor: "transparent",
            border: "1.5px solid #0F62FE",
            color: "#0F62FE",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#fee2e2",
            padding: "0.75rem 1rem",
          }}
        >
          <AlertTriangle
            size={16}
            className="flex-shrink-0"
            style={{ marginTop: "2px", color: "#dc2626" }}
          />
          <div className="flex-grow-1">
            <p
              className="mb-0"
              style={{ fontSize: "0.875rem", color: "#991b1b" }}
            >
              {error}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* STATS CARDS */}
      <div className="row g-3 mb-3">
        {stats.map(({ label, value, Icon, bgColor, iconColor }) => (
          <div key={label} className="col-lg-3 col-md-6">
            <div
              className="card border-0 h-100"
              style={{
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
              }}
            >
              <div
                className="card-body d-flex flex-column align-items-center justify-content-center text-center"
                style={{ padding: "1.25rem 1rem" }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: bgColor,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.875rem",
                  }}
                >
                  <Icon size={28} color={iconColor} strokeWidth={2.5} />
                </div>
                <h2
                  className="fw-bold mb-2"
                  style={{ fontSize: "2rem", color: "#0f172a", lineHeight: 1 }}
                >
                  {value}
                </h2>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div
        style={{
          backgroundColor: "#27235c",
          borderRadius: "10px 10px 0 0",
          padding: "0 1rem",
          marginBottom: 0,
        }}
      >
        <ul className="nav nav-tabs border-0 m-0" role="tablist">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            {
              key: "pending",
              label: "Pending Reviews",
              icon: Clock,
              count: pendingReviews.length,
            },
            { key: "submissions", label: "Team Submissions", icon: Users },
          ].map(({ key, label, icon: Icon, count }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link border-0 d-flex align-items-center gap-2 ${
                  activeTab === key ? "active" : ""
                }`}
                onClick={() => setActiveTab(key)}
                style={{
                  color: activeTab === key ? "#fff" : "rgba(255,255,255,0.7)",
                  backgroundColor:
                    activeTab === key ? "rgba(255,255,255,0.1)" : "transparent",
                  borderBottom:
                    activeTab === key
                      ? "3px solid #fff"
                      : "3px solid transparent",
                  padding: "1rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
              >
                <Icon size={16} />
                {label}{" "}
                {count !== undefined && count > 0 && <span>({count})</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* CONTENT AREA */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0 0 10px 10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem",
          minHeight: "400px",
        }}
      >
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <h5
              className="fw-bold mb-4"
              style={{ color: "#0f172a", fontSize: "1.125rem" }}
            >
              Quick Actions
            </h5>

            <div className="row g-3">
              <div className="col-md-4">
                <Link
                  to="/department-head/dashboard/feedback/allreviews"
                  className="action-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1.5rem 1rem",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    minHeight: "120px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#0f62fe";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(15, 98, 254, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="mb-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#dbeafe",
                      borderRadius: "10px",
                    }}
                  >
                    <Eye size={24} style={{ color: "#0f62fe" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      textAlign: "center",
                    }}
                  >
                    View All Reviews
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    {allReviews.length} total
                  </span>
                </Link>
              </div>

              <div className="col-md-4">
                <Link
                  to="/department-head/dashboard/feedback/submissions"
                  className="action-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1.5rem 1rem",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    minHeight: "120px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#9d4edd";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(157, 78, 221, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="mb-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8f0ff",
                      borderRadius: "10px",
                    }}
                  >
                    <Users size={24} style={{ color: "#9d4edd" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      textAlign: "center",
                    }}
                  >
                    Team Submissions
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    Department overview
                  </span>
                </Link>
              </div>

              <div className="col-md-4">
                <div
                  className="action-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1.5rem 1rem",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    minHeight: "120px",
                    cursor: "default",
                  }}
                >
                  <div
                    className="mb-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#dcfce7",
                      borderRadius: "10px",
                    }}
                  >
                    <TrendingUp size={24} style={{ color: "#24A148" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      textAlign: "center",
                    }}
                  >
                    Performance Analytics
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    Coming soon
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            {allReviews.length > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6
                    className="fw-bold mb-0"
                    style={{ fontSize: "1rem", color: "#0f172a" }}
                  >
                    Recent Reviews
                  </h6>
                  <Link
                    to="/department-head/dashboard/feedback/allreviews"
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: "6px", fontSize: "0.813rem" }}
                  >
                    View All
                  </Link>
                </div>
                <div className="row g-3">
                  {allReviews.slice(0, 3).map((review) => (
                    <div key={review.reviewId} className="col-12">
                      <div
                        className="card border-0"
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      >
                        <div className="card-body" style={{ padding: "1rem" }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div style={{ flex: 1 }}>
                              <div
                                className="fw-bold"
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#0f172a",
                                }}
                              >
                                {review.targetEmployeeName}
                              </div>
                              <small
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Reviewed by: {review.managerName}
                              </small>
                            </div>
                            <div className="d-flex flex-column align-items-end gap-2">
                              <span
                                className="badge"
                                style={{
                                  backgroundColor:
                                    review.status === "Approved"
                                      ? "#dcfce7"
                                      : review.status === "Pending"
                                      ? "#fef3c7"
                                      : "#fee2e2",
                                  color:
                                    review.status === "Approved"
                                      ? "#24A148"
                                      : review.status === "Pending"
                                      ? "#d97706"
                                      : "#dc2626",
                                  padding: "4px 10px",
                                  fontSize: "0.75rem",
                                  borderRadius: "6px",
                                }}
                              >
                                {review.status || "Draft"}
                              </span>
                              <small
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#94a3b8",
                                }}
                              >
                                {review.createdAtFormatted}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PENDING REVIEWS TAB */}
        {activeTab === "pending" && (
          <div>
            <h5
              className="fw-bold mb-4"
              style={{ color: "#0f172a", fontSize: "1.125rem" }}
            >
              Pending Reviews ({pendingReviews.length})
            </h5>

            {pendingReviews.length === 0 ? (
              <div className="text-center py-5">
                <Inbox
                  size={56}
                  style={{ color: "#cbd5e1", opacity: 0.5 }}
                  className="mb-3"
                />
                <h6
                  className="fw-bold mb-2"
                  style={{ color: "#64748b", fontSize: "1.125rem" }}
                >
                  No pending reviews
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                  All reviews have been processed
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {pendingReviews.map((review) => (
                  <div key={review.reviewId} className="col-md-6 col-lg-4">
                    <div
                      className="card border-0 h-100"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderLeft: "4px solid #E2B93B",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="card-body" style={{ padding: "1rem" }}>
                        <div className="mb-2">
                          <small
                            style={{ fontSize: "0.75rem", color: "#64748b" }}
                          >
                            Employee
                          </small>
                          <h6
                            className="mb-0"
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {review.targetEmployeeName}
                          </h6>
                        </div>
                        <div className="mb-2">
                          <small
                            style={{ fontSize: "0.75rem", color: "#64748b" }}
                          >
                            Reviewed by
                          </small>
                          <div
                            style={{ fontSize: "0.813rem", color: "#64748b" }}
                          >
                            {review.managerName}
                          </div>
                        </div>
                        <div
                          className="mb-3"
                          style={{ fontSize: "0.75rem", color: "#64748b" }}
                        >
                          <Clock
                            size={12}
                            className="me-1"
                            style={{ display: "inline" }}
                          />
                          {review.createdAtFormatted}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-secondary w-100"
                          onClick={() =>
                            navigate(
                              `/department-head/dashboard/feedback/review/${review.reviewId}`
                            )
                          }
                          style={{
                            fontSize: "0.813rem",
                            borderRadius: "6px",
                            padding: "6px",
                          }}
                        >
                          <Eye
                            size={14}
                            className="me-1"
                            style={{ display: "inline" }}
                          />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAM SUBMISSIONS TAB */}
        {activeTab === "submissions" && (
          <div className="text-center py-5">
            <Users
              size={56}
              style={{ color: "#cbd5e1", opacity: 0.5 }}
              className="mb-3"
            />
            <h6
              className="fw-bold mb-2"
              style={{ color: "#64748b", fontSize: "1.125rem" }}
            >
              Team Submissions View
            </h6>
            <p className="text-muted mb-3" style={{ fontSize: "0.875rem" }}>
              Click the button below to view all team submissions
            </p>
            <Link
              to="/department-head/dashboard/feedback/submissions"
              className="btn btn-primary"
              style={{
                borderRadius: "8px",
                fontSize: "0.875rem",
                padding: "10px 20px",
              }}
            >
              <Users size={16} className="me-2" style={{ display: "inline" }} />
              View Team Submissions
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
