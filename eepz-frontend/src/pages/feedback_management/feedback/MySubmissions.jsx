// src/pages/feedback_management/feedback/MySubmissions.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  Trash2,
  Clock,
  FileText,
  Users,
  Send,
  Target,
  Star,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  mentorFeedbackApi,
  peerQueueApi,
  orgGoalFeedbackApi,
  employeeApi,
  goalsApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";

// Format date helper
const formatDate = (dateInput) => {
  if (!dateInput) return "—";

  try {
    let dateObj;

    if (typeof dateInput === "number") {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      const normalized =
        dateInput.includes(" ") && !dateInput.includes("T")
          ? dateInput.replace(" ", "T")
          : dateInput;
      dateObj = new Date(normalized);
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      return "—";
    }

    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    return "Invalid Date";
  }
};

// Calculate days ago helper
const getDaysAgo = (dateInput) => {
  try {
    const dateObj =
      typeof dateInput === "string"
        ? new Date(dateInput.replace(" ", "T"))
        : new Date(dateInput);

    if (isNaN(dateObj.getTime())) return null;

    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  } catch {
    return null;
  }
};

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function MySubmissions() {
  const navigate = useNavigate();
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1004,
        firstName: "Dave",
        lastName: "Dev",
      },
    []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("HR Forms");
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [goalFeedback, setGoalFeedback] = useState([]);
  const [objectives, setObjectives] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch employee map using service
  const fetchEmployeeMap = useCallback(async () => {
    try {
      const response = await employeeApi.getAll();
      
      if (response?.data) {
        const employees = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        
        const map = {};
        employees.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
  }, []);

  // Fetch objectives/goals using service
  const fetchObjectives = useCallback(async () => {
    try {
      const response = await goalsApi.getAll(1, 100);

      const goalsData = response?.data || [];

      if (Array.isArray(goalsData)) {
        const map = {};
        goalsData.forEach((goal) => {
          const goalId = goal.goalId || goal.goalid;
          const goalTitle = goal.goalName || goal.goaltitle || goal.title;
          if (goalId) {
            map[goalId] = goalTitle || `Goal ${goalId}`;
          }
        });
        setObjectives(map);
      }
    } catch (err) {
      console.error("Error fetching goals:", err.message);
    }
  }, []);

  // Fetch all submission data using services
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      const userEmpId = Number(user?.empId) || 1004;

      // Fetch HR Forms responses
      try {
        const hrRes = await hrFormApi.getResponsesByEmployee(userEmpId);
        const hrData = hrRes?.data || [];
        
        const enriched = hrData.map((hr) => ({
          ...hr,
          submittedAtFormatted: formatDate(hr.submittedAt),
          daysAgo: getDaysAgo(hr.submittedAt),
        }));
        setHrForms(enriched);
      } catch (hrErr) {
        console.error("HR Forms fetch error:", hrErr);
        setHrForms([]);
      }

      // Fetch Mentor Feedback
      try {
        const mentorRes = await mentorFeedbackApi.myFeedback(userEmpId);
        const mentorData = Array.isArray(mentorRes?.data)
          ? mentorRes.data
          : mentorRes?.data?.data || [];
        
        const enriched = mentorData.map((m) => ({
          ...m,
          mentorNameFull:
            employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
          createdAtFormatted: formatDate(m.createdAt),
          trackingId: m.mentorFeedbackId || m.trackingId || m.id,
        }));
        setMentor(enriched);
      } catch (mentorErr) {
        console.error("Mentor feedback fetch error:", mentorErr);
        setMentor([]);
      }

      // Fetch Peer Feedback
      try {
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];
        
        const peerData = allPeer.filter(
          (p) => Number(p.submittedByEmployeeId) === userEmpId
        );
        
        const enriched = peerData.map((p) => ({
          ...p,
          recipientNameFull:
            employeeMap[p.recipientEmployeeId] ||
            `Employee ${p.recipientEmployeeId}`,
          createdAtFormatted: formatDate(p.createdAt),
          queueId: p.queueId || p.id,
        }));
        setPeer(enriched);
      } catch (peerErr) {
        console.error("Peer feedback fetch error:", peerErr);
        setPeer([]);
      }

      // Fetch Goal Feedback
      try {
        const goalRes = await orgGoalFeedbackApi.list(1, 100);

        const goalData = goalRes?.data || [];

        if (Array.isArray(goalData)) {
          const myGoals = goalData
            .filter((g) => Number(g.submittedByEmployeeId) === userEmpId)
            .map((g) => ({
              ...g,
              objectiveTitle:
                objectives[g.organizationObjectiveId] ||
                `Goal #${g.organizationObjectiveId}`,
              submittedAtFormatted: formatDate(g.createdAt),
              daysAgo: getDaysAgo(g.createdAt),
              feedbackId: g.orgGoalFeedbackId,
              rating: g.rating || 0,
              feedbackComments: g.feedbackComments || "",
            }));

          setGoalFeedback(myGoals);
        } else {
          setGoalFeedback([]);
        }
      } catch (goalErr) {
        console.error("Goal feedback fetch error:", goalErr);
        setGoalFeedback([]);
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.empId, employeeMap, objectives]);

  // Initialize data on mount
  useEffect(() => {
    fetchEmployeeMap();
    fetchObjectives();
  }, [fetchEmployeeMap, fetchObjectives]);

  // Fetch data after employee map is loaded
  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, [employeeMap, fetchData]);

  // View response handler
  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  // Delete HR Form using service
  const deleteHRForm = async (responseId) => {
    if (!responseId) {
      showToast("Invalid response ID", "error");
      return;
    }

    if (!window.confirm("Delete this HR form submission?")) return;

    try {
      await hrFormApi.deleteResponse(responseId);
      showToast("HR form deleted successfully!", "success");
      await fetchData();
    } catch (err) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  // Delete Mentor Feedback using service
  const deleteMentor = async (trackingId) => {
    if (!trackingId) {
      showToast("Invalid mentor feedback ID", "error");
      return;
    }

    if (!window.confirm("Delete this mentor feedback?")) return;

    try {
      await mentorFeedbackApi.remove(trackingId);
      showToast("Mentor feedback deleted successfully!", "success");
      await fetchData();
    } catch (err) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  // Delete Peer Feedback using service
  const deletePeer = async (queueId) => {
    if (!queueId) {
      showToast("Invalid peer feedback ID", "error");
      return;
    }

    if (!window.confirm("Delete this peer feedback?")) return;

    try {
      await peerQueueApi.remove(queueId);
      showToast("Peer feedback deleted successfully!", "success");
      await fetchData();
    } catch (err) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  // Delete Goal Feedback using service
  const deleteGoalFeedback = async (feedbackId) => {
    if (!feedbackId) {
      showToast("Invalid goal feedback ID", "error");
      return;
    }

    if (!window.confirm("Delete this goal feedback?")) return;

    try {
      await orgGoalFeedbackApi.remove(feedbackId);
      showToast("Goal feedback deleted successfully!", "success");
      await fetchData();
    } catch (err) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  // Get data for current tab
  const getTabData = () => {
    switch (tab) {
      case "HR Forms":
        return hrForms;
      case "Goal Feedback":
        return goalFeedback;
      case "Mentor":
        return mentor;
      case "Peer":
        return peer;
      default:
        return [];
    }
  };

  // Get empty state icon for current tab
  const getEmptyStateIcon = () => {
    switch (tab) {
      case "HR Forms":
        return FileText;
      case "Goal Feedback":
        return Target;
      case "Mentor":
        return Send;
      case "Peer":
        return Users;
      default:
        return Inbox;
    }
  };

  return (
    <div
      style={{
        padding: "1.25rem 1.75rem",
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`alert ${
            toast.type === "success" ? "alert-success" : "alert-danger"
          } alert-dismissible fade show position-fixed`}
          style={{
            top: "20px",
            right: "20px",
            zIndex: 9999,
            minWidth: "300px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            borderRadius: "8px",
            border: "none",
            padding: "0.75rem 1rem",
            fontSize: "0.875rem",
          }}
        >
          {toast.message}
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setToast({ show: false, message: "", type: "" })}
          />
        </div>
      )}

      {/* Header */}
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
            {user?.firstName} {user?.lastName}'s Submissions
          </h2>
          <p
            className="mb-0"
            style={{ color: "#64748b", fontSize: "0.875rem" }}
          >
            View and manage all feedback you have submitted
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={() => {
            fetchEmployeeMap();
            fetchObjectives();
            fetchData();
          }}
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

      {/* Error Alert */}
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

      {/* Tabs */}
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
            {
              key: "HR Forms",
              label: "HR Forms",
              icon: FileText,
              count: hrForms.length,
            },
            {
              key: "Goal Feedback",
              label: "Goal Feedback",
              icon: Target,
              count: goalFeedback.length,
            },
            {
              key: "Mentor",
              label: "Mentor",
              icon: Send,
              count: mentor.length,
            },
            { key: "Peer", label: "Peer", icon: Users, count: peer.length },
          ].map(({ key, label, icon: Icon, count }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link border-0 d-flex align-items-center gap-2 ${
                  tab === key ? "active" : ""
                }`}
                onClick={() => setTab(key)}
                style={{
                  color: tab === key ? "#fff" : "rgba(255,255,255,0.7)",
                  backgroundColor:
                    tab === key ? "rgba(255,255,255,0.1)" : "transparent",
                  borderBottom:
                    tab === key ? "3px solid #fff" : "3px solid transparent",
                  padding: "1rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }
                }}
              >
                <Icon size={16} />
                {label} ({count})
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Content Area */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "0 0 10px 10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem",
          minHeight: "400px",
        }}
      >
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "300px" }}
          >
            <div
              className="spinner-border text-primary"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : getTabData().length === 0 ? (
          <div className="text-center py-5">
            {React.createElement(getEmptyStateIcon(), {
              size: 56,
              style: { color: "#cbd5e1", opacity: 0.5, marginBottom: "1rem" },
            })}
            <h6
              className="fw-bold mb-2"
              style={{ color: "#64748b", fontSize: "1.125rem" }}
            >
              No {tab} submissions yet
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
              You haven't submitted any {tab.toLowerCase()} feedback
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {/* HR Forms Cards */}
            {tab === "HR Forms" &&
              hrForms.map((hr) => {
                const statusColor =
                  hr.status === "Reviewed"
                    ? "#24A148"
                    : hr.status === "Submitted"
                    ? "#0F62FE"
                    : "#E2B93B";
                return (
                  <div className="col-md-6 col-lg-4" key={hr.responseId}>
                    <div
                      className="card border-0 h-100"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${statusColor}`,
                        borderRadius: "8px",
                      }}
                    >
                      <div className="card-body" style={{ padding: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6
                            className="mb-0"
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {hr.formName || "HR Form"}
                          </h6>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${statusColor}20`,
                              color: statusColor,
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                            }}
                          >
                            {hr.status || "Draft"}
                          </span>
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
                          {hr.submittedAtFormatted}
                          {hr.daysAgo !== null && (
                            <span> ({hr.daysAgo}d ago)</span>
                          )}
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary flex-grow-1"
                            onClick={() => handleViewResponse(hr, "HR")}
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
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteHRForm(hr.responseId)}
                            style={{
                              fontSize: "0.813rem",
                              borderRadius: "6px",
                              padding: "6px 10px",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Goal Feedback Cards */}
            {tab === "Goal Feedback" &&
              goalFeedback.map((goal) => (
                <div className="col-md-6 col-lg-4" key={goal.orgGoalFeedbackId}>
                  <div
                    className="card border-0 h-100"
                    style={{
                      border: "1px solid #e2e8f0",
                      borderLeft: "4px solid #0F62FE",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="card-body" style={{ padding: "1rem" }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6
                          className="mb-0"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0f172a",
                            flex: 1,
                          }}
                        >
                          {goal.objectiveTitle}
                        </h6>
                        <div className="d-flex align-items-center gap-1 ms-2">
                          <Star
                            size={14}
                            style={{ color: "#FFB800", fill: "#FFB800" }}
                          />
                          <span
                            className="fw-bold"
                            style={{ fontSize: "0.813rem" }}
                          >
                            {goal.rating}/5
                          </span>
                        </div>
                      </div>
                      <span
                        className="badge mb-2"
                        style={{
                          backgroundColor: "#dbeafe",
                          color: "#0f62fe",
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          borderRadius: "6px",
                        }}
                      >
                        {RATING_LABELS[goal.rating] || "N/A"}
                      </span>
                      <div
                        className="mb-3"
                        style={{ fontSize: "0.75rem", color: "#64748b" }}
                      >
                        <Clock
                          size={12}
                          className="me-1"
                          style={{ display: "inline" }}
                        />
                        {goal.submittedAtFormatted}
                        {goal.daysAgo !== null && (
                          <span> ({goal.daysAgo}d ago)</span>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary flex-grow-1"
                          onClick={() => handleViewResponse(goal, "Goal")}
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
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            deleteGoalFeedback(goal.orgGoalFeedbackId)
                          }
                          style={{
                            fontSize: "0.813rem",
                            borderRadius: "6px",
                            padding: "6px 10px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Mentor Feedback Cards */}
            {tab === "Mentor" &&
              mentor.map((m) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={m.trackingId || `mentor-${Math.random()}`}
                >
                  <div
                    className="card border-0 h-100"
                    style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  >
                    <div className="card-body" style={{ padding: "1rem" }}>
                      <div className="mb-2">
                        <small
                          style={{ fontSize: "0.75rem", color: "#64748b" }}
                        >
                          Mentor:
                        </small>
                        <h6
                          className="mb-0"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {m.mentorNameFull}
                        </h6>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#dcfce7",
                            color: "#24A148",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                          }}
                        >
                          {m.rating || 0}/5 Stars
                        </span>
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
                        {m.createdAtFormatted}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary flex-grow-1"
                          onClick={() => handleViewResponse(m, "Mentor")}
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
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteMentor(m.trackingId)}
                          disabled={!m.trackingId}
                          style={{
                            fontSize: "0.813rem",
                            borderRadius: "6px",
                            padding: "6px 10px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Peer Feedback Cards */}
            {tab === "Peer" &&
              peer.map((p) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={p.queueId || `peer-${Math.random()}`}
                >
                  <div
                    className="card border-0 h-100"
                    style={{ border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  >
                    <div className="card-body" style={{ padding: "1rem" }}>
                      <div className="mb-2">
                        <small
                          style={{ fontSize: "0.75rem", color: "#64748b" }}
                        >
                          Feedback for:
                        </small>
                        <h6
                          className="mb-0"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {p.recipientNameFull}
                        </h6>
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
                        {p.createdAtFormatted}
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary flex-grow-1"
                          onClick={() => handleViewResponse(p, "Peer")}
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
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deletePeer(p.queueId)}
                          disabled={!p.queueId}
                          style={{
                            fontSize: "0.813rem",
                            borderRadius: "6px",
                            padding: "6px 10px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Response View Modal */}
      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type={selectedType}
      />

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
