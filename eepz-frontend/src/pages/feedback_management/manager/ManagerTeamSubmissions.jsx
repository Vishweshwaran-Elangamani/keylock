import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw, AlertTriangle,Eye,
  MessageSquare,Clock,User,Star,
} from "lucide-react";
import {
  mentorFeedbackApi,peerQueueApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import axios from "axios";
import "../../../styles/feedback/components/ManagerTeamSubmissions.css";

const API_BASE = import.meta.env.VITE_API_BASE;

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
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getDaysAgo = (dateInput) => {
  try {
    const dateObj =
      typeof dateInput === "string"
        ? new Date(dateInput.replace(" ", "T")): new Date(dateInput);

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
  1: "Poor",2: "Fair",3: "Good",4: "Very Good",5: "Excellent",
};

export default function ManageTeamSubmissions() {
  const user = useMemo(
    () =>JSON.parse(localStorage.getItem("user") || "{}") || { empId: 1006,firstName: "Department",lastName: "Head",},
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
  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        const deptEmps = [];

        response.data.data.forEach((emp) => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          if (
            emp.departmentId === user?.departmentId ||emp.employeeId !== user?.empId
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

  const fetchObjectives = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/Orgwideobjectives`);
      const objectivesData = response.data?.data || response.data || [];
      if (Array.isArray(objectivesData)) {
        const map = {};
        objectivesData.forEach((obj) => {map[obj.objectiveId] =
            obj.title || obj.objectiveName || `Objective ${obj.objectiveId}`;
        });
        setObjectives(map);
      }
    } catch (err) {
      console.error("Error fetching objectives:", err.message);
    }
  }, []);

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
                submittedByEmployeeId: empId,submittedByName: employeeMap[empId] || `Employee ${empId}`,
                submittedAtFormatted: formatDate(item.submittedAt),daysAgo: getDaysAgo(item.submittedAt),
              }))
            );
          }
        }
        setHrForms(hrData);
      } catch (hrErr) {
        console.warn("HR feedback API error:", hrErr.message);
        setHrForms([]);
      }

      try {
        const mentorData = [];
        for (const empId of deptEmpIds) {
          const mentorRes = await mentorFeedbackApi.myFeedback(empId);
          if (Array.isArray(mentorRes.data?.data)) {
            mentorData.push(...mentorRes.data.data.map((m) => ({
                ...m,  submittedByEmployeeId: empId,submittedByName: employeeMap[empId] || 
                `Employee ${empId}`,mentorNameFull:employeeMap[m.mentorEmployeeId] ||`Employee ${m.mentorEmployeeId}`,
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
      try {
        const peerRes = await peerQueueApi.list(1, 200);
        const allPeer = Array.isArray(peerRes.data?.data)
          ? peerRes.data.data
          : [];
        const peerData = allPeer
          .filter((p) => deptEmpIds.includes(Number(p.submittedByEmployeeId)))
          .map((p) => ({ ...p,
            submittedByName:
              employeeMap[p.submittedByEmployeeId] ||`Employee ${p.submittedByEmployeeId}`,
            recipientNameFull:
              employeeMap[p.recipientEmployeeId] ||`Employee ${p.recipientEmployeeId}`,
            createdAtFormatted: formatDate(p.createdAt),
          }));
        setPeer(peerData);
      } catch (peerErr) {
        console.warn("Peer feedback API error:", peerErr.message);
        setPeer([]);
      }
      try {
        const goalRes = await axios.get(`${API_BASE}/OrgGoalFeedback/all`, {
          params: {
            pageNumber: 1,pageSize: 200,
          },
        });
        if (goalRes.data?.success && Array.isArray(goalRes.data.data)) {
          const deptGoals = goalRes.data.data
            .filter((g) => deptEmpIds.includes(Number(g.submittedByEmployeeId)))
            .map((g) => ({
              ...g,
              objectiveTitle: g.organizationGoalName || objectives[g.organizationObjectiveId] ||
                `Objective #${g.organizationObjectiveId}`,submittedByName:  employeeMap[g.submittedByEmployeeId] ||
                `Employee ${g.submittedByEmployeeId}`,
              submittedAtFormatted: formatDate(g.createdAt),daysAgo: getDaysAgo(g.createdAt),
              feedbackId: g.orgGoalFeedbackId,rating: g.rating || 0,feedbackComments: g.feedbackComments || "",
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
        err?.response?.data?.message || err.message ||
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
      default: return [];
    }
  };
  const activeData = getActiveData();

  return (
    <div className="mts-page">
      <div className="mts-container">
        <div className="mts-header">
          <div className="mts-header-text">
            <h2 className="mts-title">Department Team Submissions</h2>
            <p className="mts-subtitle">
              View all feedback from your department ({departmentEmployees.length} employees)
            </p>
          </div>
        </div>

        {error && (
          <div className="mts-alert mts-alert-error" role="alert">
            <AlertTriangle size={18} className="mts-alert-icon" />
            <div className="mts-alert-body">
              <strong>Error</strong>
              <p className="mts-alert-message">{error}</p>
            </div>
            <button type="button" className="mts-alert-close" onClick={() => setError("")}/>
          </div>
        )}

        <div className="mts-toggle-wrapper">
          <div className="mts-toggle-container">
            <button type="button" onClick={() => setTab("HRForms")} className={`mts-toggle-btn ${
                tab === "HRForms" ? "mts-toggle-btn-active" : "" }`}>
              <span>HR Forms</span>
              {hrForms.length > 0 && (
                <span className="mts-toggle-count">{hrForms.length}</span>
              )}
            </button>
            <button type="button" onClick={() => setTab("GoalFeedback")}
              className={`mts-toggle-btn $ tab === "GoalFeedback" ? "mts-toggle-btn-active" : ""
              }`}>
              <span>Goal Feedback</span>
              {goalFeedback.length > 0 && (
                <span className="mts-toggle-count">{goalFeedback.length}</span>
              )}
            </button>
            <button type="button" onClick={() => setTab("Mentor")}className={`mts-toggle-btn ${
                tab === "Mentor" ? "mts-toggle-btn-active" : "" }`}>
              <span>Mentor</span>
              {mentor.length > 0 && (
                <span className="mts-toggle-count">{mentor.length}</span> )}
            </button>
            <button type="button"  onClick={() => setTab("Peer")}  className={`mts-toggle-btn ${
                tab === "Peer" ? "mts-toggle-btn-active" : "" }`} >
              <span>Peer</span>
              {peer.length > 0 && ( <span className="mts-toggle-count">{peer.length}</span>)}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="mts-loading">
            <div className="mts-spinner" role="status">
              <span className="mts-visually-hidden">Loading...</span>
            </div>
            <p className="mts-loading-text">Loading submissions...</p>
          </div>
        ) : activeData.length === 0 ? (
          <div className="mts-empty-card">
            <AlertTriangle size={48} className="mts-empty-icon" />
            <h5 className="mts-empty-title">No Submissions Yet</h5>
            <p className="mts-empty-text">
              There are no submissions from your department in this category.
            </p>
          </div>
        ) : (
          <div className="mts-grid">
            {tab === "HRForms" &&
              hrForms.map((hr) => {
                const statusColor =
                  hr.status === "Reviewed"
                    ? "mts-status-reviewed": hr.status === "Submitted" ? "mts-status-submitted": "mts-status-pending";
                return (
                  <div className="mts-card" key={hr.responseId}>
                    <div className="mts-card-inner mts-card-hr">
                      <div className="mts-card-header">
                        <div className="mts-card-header-left">
                          <div className="mts-card-submitter">{hr.submittedByName}</div>
                          <h6 className="mts-card-title"> {hr.formName || "HR Form"}</h6>
                        </div>
                        <span className={`mts-status-badge ${statusColor}`}>{hr.status || "Draft"}</span>
                      </div>
                      <div className="mts-card-date-row">
                        <Clock size={14} className="mts-card-date-icon" />
                        <span className="mts-card-date-text">{hr.submittedAtFormatted}</span>
                        {hr.daysAgo !== null && (
                          <span className="mts-card-date-ago">({hr.daysAgo}d ago)</span>
                        )}
                      </div>
                      {hr.status === "Reviewed" && hr.hrReviewComments && (
                        <div className="mts-hr-review">
                          <div className="mts-hr-review-header">
                            <MessageSquare size={12} className="mts-hr-review-icon"/>
                            <small className="mts-hr-review-label">HR Review:</small>
                          </div>
                          <p className="mts-hr-review-text">
                            {hr.hrReviewComments.substring(0, 80)}...
                          </p>
                        </div>
                      )}
                      <button className="mts-btn mts-btn-outline mts-btn-full" onClick={() => handleViewResponse(hr, "HR")}>
                        <Eye size={16} className="mts-btn-icon-left" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            {tab === "GoalFeedback" &&
              goalFeedback.map((goal) => (
                <div className="mts-card" key={goal.orgGoalFeedbackId}>
                  <div className="mts-card-inner mts-card-goal">
                    <div className="mts-card-header">
                      <div className="mts-card-header-left">
                        <div className="mts-card-submitter"> {goal.submittedByName}</div>
                        <h6 className="mts-card-title">{goal.objectiveTitle}</h6>
                      </div>
                      <div className="mts-goal-rating">
                        <Star size={16} className="mts-goal-star" />
                        <span className="mts-goal-rating-value">{goal.rating}/5</span>
                      </div>
                    </div>
                    <div className="mts-goal-badge-row">
                      <span className="mts-goal-rating-badge">{RATING_LABELS[goal.rating] || "N/A"}</span>
                    </div>
                    <div className="mts-card-date-row">
                      <Clock size={14} className="mts-card-date-icon" />
                      <span className="mts-card-date-text">{goal.submittedAtFormatted}</span>
                      {goal.daysAgo !== null && (
                        <span className="mts-card-date-ago"> ({goal.daysAgo}d ago)</span>
                      )}
                    </div>
                    {goal.feedbackComments && (
                      <div className="mts-comment-box">
                        <p className="mts-comment-text">{goal.feedbackComments.substring(0, 80)}...</p>
                      </div>
                    )}
                    <button className="mts-btn mts-btn-outline mts-btn-full" 
                    onClick={() => handleViewResponse(goal, "Goal")}>
                      <Eye size={16} className="mts-btn-icon-left" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            {tab === "Mentor" &&
              mentor.map((m) => (
                <div className="mts-card" key={m.trackingId || m.id}>
                  <div className="mts-card-inner mts-card-mentor">
                    <div className="mts-card-header">
                      <div className="mts-card-header-left">
                        <div className="mts-card-submitter">{m.submittedByName} </div>
                        <div className="mts-mentor-name-row">
                          <User size={14} className="mts-mentor-icon" />
                          <h6 className="mts-card-title">{m.mentorNameFull}</h6>
                        </div>
                      </div>
                      <span className="mts-mentor-rating-badge">{m.rating || 0}/5</span>
                    </div>
                    <div className="mts-card-date-row">
                      <Clock size={14} className="mts-card-date-icon" />
                      <span className="mts-card-date-text"> {m.createdAtFormatted}</span>
                    </div>
                    <div className="mts-comment-box">
                      <p className="mts-comment-text">
                        {m.feedbackComments
                          ? m.feedbackComments.substring(0, 80) + "..."
                          : "No comments"}
                      </p>
                    </div>
                    <button className="mts-btn mts-btn-outline mts-btn-full" onClick={() => handleViewResponse(m, "Mentor")}>
                      <Eye size={16} className="mts-btn-icon-left" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            {tab === "Peer" &&
              peer.map((p) => (
                <div className="mts-card" key={p.queueId || p.id}>
                  <div className="mts-card-inner mts-card-peer">
                    <div className="mts-card-header">
                      <div className="mts-card-header-left">
                        <div className="mts-card-submitter">{p.submittedByName}</div>
                        <div className="mts-mentor-name-row">
                          <User size={14} className="mts-peer-icon" />
                          <h6 className="mts-card-title"> {p.recipientNameFull}</h6>
                        </div>
                      </div>
                    </div>

                    <div className="mts-card-date-row">
                      <Clock size={14} className="mts-card-date-icon" />
                      <span className="mts-card-date-text">{p.createdAtFormatted}</span>
                    </div>

                    <div className="mts-comment-box">
                      <p className="mts-comment-text">
                        {p.feedbackContent ? p.feedbackContent.substring(0, 80) + "...": "No content"}
                      </p>
                    </div>

                    <button className="mts-btn mts-btn-outline mts-btn-full"onClick={() => handleViewResponse(p, "Peer")}>
                      <Eye size={16} className="mts-btn-icon-left" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <ResponseViewModal
          show={showModal}
          response={selectedResponse}
          onClose={handleCloseModal}
          type={selectedType}
        />
      </div>
    </div>
  );
}
