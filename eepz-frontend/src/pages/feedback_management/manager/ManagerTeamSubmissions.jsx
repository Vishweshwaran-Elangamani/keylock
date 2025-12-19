import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  MessageSquare,
  FileText,
  Users,
  Send,
  Clock,
  User,
  Target,
  Star,
  Briefcase,
} from "lucide-react";
import {
  mentorFeedbackApi,
  peerQueueApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// Robust date formatting helper
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

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date detected:", dateInput);
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    console.error("Date formatting error:", err, dateInput);
    return "Invalid Date";
  }
};

// Calculate days ago safely
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

export default function ManageTeamSubmissions() {
  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "{}") || {
        empId: 1006,
        firstName: "Department",
        lastName: "Head",
      },
    []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("HRForms");
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [goalFeedback, setGoalFeedback] = useState([]);
  const [objectives, setObjectives] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Fetch Employee Map & Department Employees
  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        const deptEmps = [];

        response.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          if (
            emp.departmentId === user?.departmentId ||
            emp.employeeId !== user?.empId
          ) {
            deptEmps.push(emp);
          }
        });

        setEmployeeMap(map);
        setDepartmentEmployees(deptEmps);
      }
    } catch (err) {
      console.error("Error fetching employee data:", err.message);
    }
  }, [user?.empId, user?.departmentId]);

  // Fetch Objectives
  const fetchObjectives = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/Orgwideobjectives`);
      const objectivesData = response.data?.data || response.data || [];

      if (Array.isArray(objectivesData)) {
        const map = {};
        objectivesData.forEach((obj) => {
          map[obj.objectiveId] =
            obj.title || obj.objectiveName || `Objective ${obj.objectiveId}`;
        });
        setObjectives(map);
      }
    } catch (err) {
      console.error("Error fetching objectives:", err.message);
    }
  }, []);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");

    try {
      if (departmentEmployees.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const deptEmpIds = departmentEmployees.map((emp) => emp.employeeId);

      // HR Forms
      try {
        const hrData = [];
        for (const empId of deptEmpIds) {
          const hrRes = await axios.get(
            `${API_BASE}/HrFeedbackForm/responses/by-employee/${empId}`
          );
          if (hrRes.data?.success && Array.isArray(hrRes.data.data)) {
            hrData.push(
              ...hrRes.data.data.map((item) => ({
                ...item,
                submittedByEmployeeId: empId,
                submittedByName: employeeMap[empId] || `Employee ${empId}`,
                submittedAtFormatted: formatDate(item.submittedAt),
                daysAgo: getDaysAgo(item.submittedAt),
              }))
            );
          }
        }
        setHrForms(hrData);
      } catch (hrErr) {
        console.warn("HR feedback API error:", hrErr.message);
        setHrForms([]);
      }

      // Mentor Feedback
      try {
        const mentorData = [];
        for (const empId of deptEmpIds) {
          const mentorRes = await mentorFeedbackApi.myFeedback(empId);
          if (Array.isArray(mentorRes.data?.data)) {
            mentorData.push(
              ...mentorRes.data.data.map((m) => ({
                ...m,
                submittedByEmployeeId: empId,
                submittedByName: employeeMap[empId] || `Employee ${empId}`,
                mentorNameFull:
                  employeeMap[m.mentorEmployeeId] ||
                  `Employee ${m.mentorEmployeeId}`,
                createdAtFormatted: formatDate(m.createdAt),
              }))
            );
          }
        }
        setMentor(mentorData);
      } catch (mentorErr) {
        console.warn("Mentor feedback API error:", mentorErr.message);
        setMentor([]);
      }

      // Peer Feedback
      try {
        const peerRes = await peerQueueApi.list(1, 200);
        const allPeer = Array.isArray(peerRes.data?.data)
          ? peerRes.data.data
          : [];
        const peerData = allPeer
          .filter((p) => deptEmpIds.includes(Number(p.submittedByEmployeeId)))
          .map((p) => ({
            ...p,
            submittedByName:
              employeeMap[p.submittedByEmployeeId] ||
              `Employee ${p.submittedByEmployeeId}`,
            recipientNameFull:
              employeeMap[p.recipientEmployeeId] ||
              `Employee ${p.recipientEmployeeId}`,
            createdAtFormatted: formatDate(p.createdAt),
          }));
        setPeer(peerData);
      } catch (peerErr) {
        console.warn("Peer feedback API error:", peerErr.message);
        setPeer([]);
      }

      // Goal Feedback
      try {

        const goalRes = await axios.get(`${API_BASE}/OrgGoalFeedback/all`, {
          params: {
            pageNumber: 1,
            pageSize: 200,
          },
        });

        if (goalRes.data?.success && Array.isArray(goalRes.data.data)) {
          const deptGoals = goalRes.data.data
            .filter((g) => deptEmpIds.includes(Number(g.submittedByEmployeeId)))
            .map((g) => ({
              ...g,
              objectiveTitle:
                g.organizationGoalName ||
                objectives[g.organizationObjectiveId] ||
                `Objective #${g.organizationObjectiveId}`,
              submittedByName:
                employeeMap[g.submittedByEmployeeId] ||
                `Employee ${g.submittedByEmployeeId}`,
              submittedAtFormatted: formatDate(g.createdAt),
              daysAgo: getDaysAgo(g.createdAt),
              feedbackId: g.orgGoalFeedbackId,
              rating: g.rating || 0,
              feedbackComments: g.feedbackComments || "",
            }));

          setGoalFeedback(deptGoals);
        } else {
          setGoalFeedback([]);
        }
      } catch (goalErr) {
        console.error("Goal feedback API error:", goalErr.message);
        setGoalFeedback([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch submissions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentEmployees, employeeMap, objectives]);

  useEffect(() => {
    fetchEmployeeData();
    fetchObjectives();
  }, [fetchEmployeeData, fetchObjectives]);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0 && departmentEmployees.length > 0) {
      fetchData();
    }
  }, [employeeMap, departmentEmployees, fetchData]);

  // Modal Handlers
  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  const getActiveData = () => {
    switch (tab) {
      case "HRForms":
        return hrForms;
      case "GoalFeedback":
        return goalFeedback;
      case "Mentor":
        return mentor;
      case "Peer":
        return peer;
      default:
        return [];
    }
  };

  const activeData = getActiveData();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <h2
              className="fw-bold mb-1"
              style={{ fontSize: "1.75rem", color: "#212529" }}
            >
              Department Team Submissions
            </h2>
            <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
              View all feedback from your department (
              {departmentEmployees.length} employees)
            </p>
          </div>
          
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-4"
            role="alert"
            style={{ borderRadius: "8px" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* ENHANCED PILL-STYLE TOGGLE TABS WITH INCREASED SIZE */}
        <div className="d-flex justify-content-center mb-4">
          <div
            className="toggle-container"
            style={{
              backgroundColor: "#27235c",
              borderRadius: "60px",
              padding: "8px",
              display: "inline-flex",
              gap: "4px",
              boxShadow: "0 6px 16px rgba(39, 35, 92, 0.25)",
              minHeight: "60px",
            }}
          >
            <button
              type="button"
              onClick={() => setTab("HRForms")}
              style={{
                background: tab === "HRForms" ? "#ffffff" : "transparent",
                color: tab === "HRForms" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "60px",
                padding: "14px 36px",
                fontSize: "0.938rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              HR Forms
              {hrForms.length > 0 && (
                <span
                  style={{
                    marginLeft: "10px",
                    backgroundColor:
                      tab === "HRForms" ? "#27235c" : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "14px",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {hrForms.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("GoalFeedback")}
              style={{
                background: tab === "GoalFeedback" ? "#ffffff" : "transparent",
                color: tab === "GoalFeedback" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "60px",
                padding: "14px 36px",
                fontSize: "0.938rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Goal Feedback
              {goalFeedback.length > 0 && (
                <span
                  style={{
                    marginLeft: "10px",
                    backgroundColor:
                      tab === "GoalFeedback"
                        ? "#27235c"
                        : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "14px",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {goalFeedback.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("Mentor")}
              style={{
                background: tab === "Mentor" ? "#ffffff" : "transparent",
                color: tab === "Mentor" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "60px",
                padding: "14px 36px",
                fontSize: "0.938rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Mentor
              {mentor.length > 0 && (
                <span
                  style={{
                    marginLeft: "10px",
                    backgroundColor:
                      tab === "Mentor" ? "#27235c" : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "14px",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {mentor.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("Peer")}
              style={{
                background: tab === "Peer" ? "#ffffff" : "transparent",
                color: tab === "Peer" ? "#27235c" : "#ffffff",
                border: "none",
                borderRadius: "60px",
                padding: "14px 36px",
                fontSize: "0.938rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Peer
              {peer.length > 0 && (
                <span
                  style={{
                    marginLeft: "10px",
                    backgroundColor:
                      tab === "Peer" ? "#27235c" : "rgba(255,255,255,0.3)",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "14px",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {peer.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{
                width: "3rem",
                height: "3rem",
                color: "#97247E",
                borderWidth: "3px",
              }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3 fw-medium">Loading submissions...</p>
          </div>
        ) : activeData.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <AlertTriangle
              size={48}
              style={{ color: "#cbd5e1", marginBottom: "1rem" }}
            />
            <h5 className="fw-bold mb-2" style={{ color: "#6c757d" }}>
              No Submissions Yet
            </h5>
            <p className="text-muted mb-0">
              There are no submissions from your department in this category.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {/* HR FORMS */}
            {tab === "HRForms" &&
              hrForms.map((hr) => {
                const statusColor =
                  hr.status === "Reviewed"
                    ? "#198754"
                    : hr.status === "Submitted"
                    ? "#97247E"
                    : "#ffc107";
                return (
                  <div className="col-md-6 col-lg-4" key={hr.responseId}>
                    <div
                      style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderLeft: `4px solid ${statusColor}`,
                        borderRadius: "10px",
                        padding: "1.25rem",
                        height: "100%",
                        transition: "box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,0,0,0.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow = "none")
                      }
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6c757d",
                              marginBottom: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {hr.submittedByName}
                          </div>
                          <h6
                            className="mb-0 fw-bold"
                            style={{ fontSize: "1rem", color: "#212529" }}
                          >
                            {hr.formName || "HR Form"}
                          </h6>
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: `1.5px solid ${statusColor}40`,
                          }}
                        >
                          {hr.status || "Draft"}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div
                          className="d-flex align-items-center gap-2 text-muted"
                          style={{ fontSize: "0.813rem" }}
                        >
                          <Clock size={14} />
                          <span>{hr.submittedAtFormatted}</span>
                          {hr.daysAgo !== null && (
                            <span>({hr.daysAgo}d ago)</span>
                          )}
                        </div>
                      </div>

                      {hr.status === "Reviewed" && hr.hrReviewComments && (
                        <div
                          className="mb-3"
                          style={{
                            background: "#f8f9fa",
                            padding: "0.75rem",
                            borderRadius: "6px",
                            border: "1px solid #e9ecef",
                          }}
                        >
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <MessageSquare
                              size={12}
                              style={{ color: "#6c757d" }}
                            />
                            <small
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#6c757d",
                              }}
                            >
                              HR Review:
                            </small>
                          </div>
                          <p
                            className="mb-0"
                            style={{ fontSize: "0.813rem", color: "#495057" }}
                          >
                            {hr.hrReviewComments.substring(0, 80)}...
                          </p>
                        </div>
                      )}

                      <button
                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleViewResponse(hr, "HR")}
                        style={{
                          borderRadius: "6px",
                          padding: "8px",
                          fontWeight: 600,
                        }}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* GOAL FEEDBACK */}
            {tab === "GoalFeedback" &&
              goalFeedback.map((goal) => (
                <div className="col-md-6 col-lg-4" key={goal.orgGoalFeedbackId}>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderLeft: "4px solid #97247E",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      height: "100%",
                      transition: "box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            marginBottom: "4px",
                            fontWeight: 600,
                          }}
                        >
                          {goal.submittedByName}
                        </div>
                        <h6
                          className="mb-0 fw-bold"
                          style={{ fontSize: "0.938rem", color: "#212529" }}
                        >
                          {goal.objectiveTitle}
                        </h6>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Star
                          size={16}
                          style={{ color: "#ffc107", fill: "#ffc107" }}
                        />
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "#212529",
                          }}
                        >
                          {goal.rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#97247E15",
                          color: "#97247E",
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1.5px solid #97247E40",
                        }}
                      >
                        {RATING_LABELS[goal.rating] || "N/A"}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div
                        className="d-flex align-items-center gap-2 text-muted"
                        style={{ fontSize: "0.813rem" }}
                      >
                        <Clock size={14} />
                        <span>{goal.submittedAtFormatted}</span>
                        {goal.daysAgo !== null && (
                          <span>({goal.daysAgo}d ago)</span>
                        )}
                      </div>
                    </div>

                    {goal.feedbackComments && (
                      <div
                        className="mb-3"
                        style={{
                          background: "#f8f9fa",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          minHeight: "60px",
                        }}
                      >
                        <p
                          className="mb-0"
                          style={{ fontSize: "0.813rem", color: "#495057" }}
                        >
                          {goal.feedbackComments.substring(0, 80)}...
                        </p>
                      </div>
                    )}

                    <button
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleViewResponse(goal, "Goal")}
                      style={{
                        borderRadius: "6px",
                        padding: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}

            {/* MENTOR */}
            {tab === "Mentor" &&
              mentor.map((m) => (
                <div className="col-md-6 col-lg-4" key={m.trackingId || m.id}>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderLeft: "4px solid #198754",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      height: "100%",
                      transition: "box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            marginBottom: "4px",
                            fontWeight: 600,
                          }}
                        >
                          {m.submittedByName}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <User size={14} style={{ color: "#198754" }} />
                          <h6
                            className="mb-0 fw-bold"
                            style={{ fontSize: "0.938rem", color: "#212529" }}
                          >
                            {m.mentorNameFull}
                          </h6>
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#19875415",
                          color: "#198754",
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1.5px solid #19875440",
                        }}
                      >
                        {m.rating || 0}/5
                      </span>
                    </div>

                    <div className="mb-3">
                      <div
                        className="d-flex align-items-center gap-2 text-muted"
                        style={{ fontSize: "0.813rem" }}
                      >
                        <Clock size={14} />
                        <span>{m.createdAtFormatted}</span>
                      </div>
                    </div>

                    <div
                      className="mb-3"
                      style={{
                        background: "#f8f9fa",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        minHeight: "60px",
                      }}
                    >
                      <p
                        className="mb-0"
                        style={{ fontSize: "0.813rem", color: "#495057" }}
                      >
                        {m.feedbackComments
                          ? m.feedbackComments.substring(0, 80) + "..."
                          : "No comments"}
                      </p>
                    </div>

                    <button
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleViewResponse(m, "Mentor")}
                      style={{
                        borderRadius: "6px",
                        padding: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}

            {/* PEER */}
            {tab === "Peer" &&
              peer.map((p) => (
                <div className="col-md-6 col-lg-4" key={p.queueId || p.id}>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderLeft: "4px solid #6610f2",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      height: "100%",
                      transition: "box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div className="mb-3">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6c757d",
                          marginBottom: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {p.submittedByName}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <User size={14} style={{ color: "#6610f2" }} />
                        <h6
                          className="mb-0 fw-bold"
                          style={{ fontSize: "0.938rem", color: "#212529" }}
                        >
                          {p.recipientNameFull}
                        </h6>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div
                        className="d-flex align-items-center gap-2 text-muted"
                        style={{ fontSize: "0.813rem" }}
                      >
                        <Clock size={14} />
                        <span>{p.createdAtFormatted}</span>
                      </div>
                    </div>

                    <div
                      className="mb-3"
                      style={{
                        background: "#f8f9fa",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        minHeight: "60px",
                      }}
                    >
                      <p
                        className="mb-0"
                        style={{ fontSize: "0.813rem", color: "#495057" }}
                      >
                        {p.feedbackContent
                          ? p.feedbackContent.substring(0, 80) + "..."
                          : "No content"}
                      </p>
                    </div>

                    <button
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleViewResponse(p, "Peer")}
                      style={{
                        borderRadius: "6px",
                        padding: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <ResponseViewModal
        show={showModal}
        response={selectedResponse}
        onClose={handleCloseModal}
        type={selectedType}
      />

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        
        .toggle-container button:hover {
          opacity: 0.92;
        }
        
        .toggle-container button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
