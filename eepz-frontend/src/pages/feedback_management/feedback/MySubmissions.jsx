import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw,AlertTriangle,Eye,Trash2,Clock, FileText,Users,Send,Target,Star,ArrowLeft, Inbox,Home,User,X,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {mentorFeedbackApi, peerQueueApi,orgGoalFeedbackApi, employeeApi, goalsApi,} 
from "../../../services/feedbackmanagement/feedbackApi";
import hrFormApi from "../../../services/feedbackmanagement/hrFormApi";
import ResponseViewModal from "../../../components/feedback_management/modals/ResponseViewModal";
import Breadcrumb from "../../../components/feedback_management/common/FeedbackBreadcrumb";
import "../../../styles/feedback/components/MySubmissions.css";

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  try {
    let dateObj;
    if (typeof dateInput === "number") {
      dateObj = new Date(dateInput);
   } else if (typeof dateInput === "string") {
      const normalized = dateInput.includes(" ") && !dateInput.includes("T")  ? dateInput.replace(" ", "T") : dateInput;
      dateObj = new Date(normalized);
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      return "—";
    }
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", });
  } catch {
    return "Invalid Date";
  }
};

const getDaysAgo = (dateInput) => {
  try {
    const dateObj =  typeof dateInput === "string" ? new Date(dateInput.replace(" ", "T")) : new Date(dateInput);
    if (isNaN(dateObj.getTime())) return null;
    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  } catch {
    return null;
  }
};

const getFeedbackDashboardPath = (roleName) => {
  const routes = {
    Employee: "/employee/dashboard/feedback",
    Manager: "/manager/dashboard/feedback",
    DepartmentHead: "/depthead/dashboard/feedback",
    "Department Head": "/depthead/dashboard/feedback",
    HR: "/hr/dashboard/feedback",
  };
  return routes[roleName] || "/employee/dashboard/feedback";
};

const RATING_LABELS = {
  1: "Poor",2: "Fair",3: "Good",4: "Very Good",5: "Excellent",};

export default function MySubmissions() {
  const navigate = useNavigate();
  const user = useMemo( () =>JSON.parse(localStorage.getItem("user") || "{}") || {
  empId: 1004, firstName: "Dave", lastName: "Dev", roleName: "Employee",},[]);

  const feedbackDashboardPath = useMemo( () => getFeedbackDashboardPath(user?.roleName || "Employee"), [user?.roleName] ); 
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
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const openErrorModal = (message) => {
    setError(message || "Failed to fetch submissions");
    setErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setError("");
    setErrorModalOpen(false);
  };

  const fetchEmployeeMap = useCallback(async () => {
    try {
      const response = await employeeApi.getAll();
      if (response?.data) {
        const employees = Array.isArray(response.data)? response.data : response.data.data || [];
        const map = {};
        employees.forEach((emp) => { map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;});
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error("Error fetching employee map:", err.message);
    }
  }, []);

  const fetchObjectives = useCallback(async () => {
    try {
      const response = await goalsApi.getAll(1, 100);
      const goalsData = response?.data?.data || response?.data || [];
      if (Array.isArray(goalsData)) {
        const map = {};
          goalsData.forEach((goal) => {const goalId = goal.goalId || goal.goalid || goal.GoalId;
          const goalTitle =goal.goalName ||goal.organizationGoalName ||goal.goaltitle ||goal.title;
          if (goalId) { map[goalId] = goalTitle || `Goal ${goalId}`; }
        });setObjectives(map);
      }
    } catch (err) {
    console.error("Error fetching goals:", err.message);
    }
  },[]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError("");
    try {
      const userEmpId = Number(user?.empId) || 1004;
      try {
        const hrRes = await hrFormApi.getResponsesByEmployee(userEmpId);
        const hrData = hrRes?.data || [];
        const enriched = hrData.map((hr) =>({...hr,submittedAtFormatted: formatDate(hr.submittedAt),daysAgo: getDaysAgo(hr.submittedAt),}));
        setHrForms(enriched);} catch (hrErr) {console.error("HR Forms fetch error:", hrErr);
        setHrForms([]);
      }
      try {
        const mentorRes = await mentorFeedbackApi.byMentee(userEmpId);
        const mentorData = Array.isArray(mentorRes?.data)  ? mentorRes.data  : mentorRes?.data?.data || [];
        const enriched = mentorData.map((m) => ({ ...m,
          mentorNameFull:employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
          createdAtFormatted: formatDate(m.createdAt), trackingId: m.mentorFeedbackId || m.trackingId || m.id, }));
        setMentor(enriched);
      } catch (mentorErr) {
        console.error("Mentor feedback fetch error:", mentorErr);
        setMentor([]);
      }
    try {
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes?.data) ? peerRes.data : peerRes?.data?.data || [];
        const peerData = allPeer.filter((p) => Number(p.submittedByEmployeeId) === userEmpId);
        const enriched = peerData.map((p) => ({ ...p, recipientNameFull:
          employeeMap[p.recipientEmployeeId] || `Employee ${p.recipientEmployeeId}`,createdAtFormatted: formatDate(p.createdAt),queueId: p.queueId || p.id, }));
        setPeer(enriched);
      } catch (peerErr) {
        console.error("Peer feedback fetch error:", peerErr);
        setPeer([]);
      }
      try {
        const goalRes = await orgGoalFeedbackApi.list(1, 100);
        const allGoalData = goalRes?.data?.data || goalRes?.data || [];
        if (Array.isArray(allGoalData)) {
          const myGoals = allGoalData
            .filter((g) => {const matches = Number(g.submittedByEmployeeId) === userEmpId;
              return matches; })
            .map((g) => ({...g, objectiveTitle:objectives[g.goalId] ||g.organizationGoalName ||`Goal #${g.goalId}`,
              submittedAtFormatted: formatDate(g.createdAt || g.submittedAt), daysAgo: getDaysAgo(g.createdAt || g.submittedAt), feedbackId: g.orgGoalFeedbackId,
              rating: g.rating || 0, feedbackComments: g.feedbackComments || "", }));
          setGoalFeedback(myGoals);
        } else {
          console.warn("Goal data is not an array:", allGoalData);
          setGoalFeedback([]);
        }
      } catch (goalErr) {
        console.error("Goal feedback fetch error:", goalErr);
        setGoalFeedback([]);
      }
    } catch (err) {
      openErrorModal(err?.message || "Failed to fetch submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.empId, employeeMap, objectives]);

  useEffect(() => {
    fetchEmployeeMap();
    fetchObjectives();
  }, [fetchEmployeeMap, fetchObjectives]);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, 
 [employeeMap, objectives, fetchData]);
  const handleViewResponse = (raw, type) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    if (type === "Goal") {const normalized = {  ...raw, submittedByName: fullName,submittedAt: raw.createdAt || raw.submittedAt || raw.submittedAtFormatted,rating: raw.rating, comments: raw.feedbackComments,};
      setSelectedResponse(normalized);
      setSelectedType(type);
      setShowModal(true);
      return;
    }
    if (type === "Mentor") {
      const normalized = { ...raw,submittedByName: fullName, submittedAt: raw.createdAt || raw.createdAtFormatted, comments: raw.feedbackContent || raw.comments, rating: raw.rating,};
      setSelectedResponse(normalized);
      setSelectedType(type);
      setShowModal(true);
      return;
    }
    if (type === "Peer") {
      const normalized = {...raw,
      submittedByName: fullName,submittedAt: raw.createdAt || raw.createdAtFormatted,comments: raw.feedbackContent,};
      setSelectedResponse(normalized);
      setSelectedType(type);
      setShowModal(true);
      return;
    }
    setSelectedResponse(raw);
    setSelectedType(type);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

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
      default:  return [];
  } };

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
      default:return Inbox;
  } };

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (<>{error && (
        <div className={`fm-mysub-error-modal-backdrop ${errorModalOpen ? "fm-mysub-error-modal-backdrop--show" : ""}`} 
        onClick={closeErrorModal} >
        <div className="fm-mysub-error-modal" onClick={(e) => e.stopPropagation()} >
          <div className="fm-mysub-error-modal__header">
            <h6 className="fm-mysub-error-modal__title">Error</h6>
             <button type="button" className="fm-mysub-modal-close-btn" onClick={closeErrorModal} aria-label="Close">
                <X size={20} /> </button>
            </div>
            <div className="fm-mysub-error-modal__body">
             <p>{error}</p>
            </div>
            <div className="fm-mysub-error-modal__footer">
              <button type="button" className="fm-mysub-modal-btn fm-mysub-modal-btn--secondary"onClick={closeErrorModal}>
                Close </button>
            </div>
          </div>
        </div>
      )}

      <div className="fm-mysub-page-wrapper">
        <Breadcrumb  items={[
        { label: "Feedback Management", path: feedbackDashboardPath }, { label: "My Submissions" },]}/>
        <div className="fm-mysub-tabs-wrapper d-flex justify-content-center mb-3">
          <div className="fm-mysub-tabs">
            <button type="button" className={`fm-mysub-tab-btn ${ tab === "HR Forms" ? "fm-mysub-tab-btn--active" : ""}`}
              onClick={() => setTab("HR Forms")}>
              <FileText size={15} />
              <span>HR Forms</span>
            {hrForms.length > 0 && (
            <span className="fm-mysub-tab-btn__badge"> {hrForms.length}</span>)}
            </button>
            <button type="button" className={`fm-mysub-tab-btn ${ tab === "Goal Feedback" ? "fm-mysub-tab-btn--active" : ""
              }`}onClick={() => setTab("Goal Feedback")}>
              <Target size={15} />
              <span>Goal Feedback</span>
              {goalFeedback.length > 0 && ( <span className="fm-mysub-tab-btn__badge">{goalFeedback.length}</span>
              )}
            </button>
            <button type="button" className={`fm-mysub-tab-btn ${ tab === "Mentor" ? "fm-mysub-tab-btn--active" : "" }`} onClick={() => setTab("Mentor")} >
              <Send size={15} />
              <span>Mentor</span>{mentor.length > 0 && ( <span className="fm-mysub-tab-btn__badge">{mentor.length}</span>)}
            </button>

            <button type="button" className={`fm-mysub-tab-btn ${ tab === "Peer" ? "fm-mysub-tab-btn--active" : "" }`}onClick={() => setTab("Peer")}>
              <Users size={15} />
              <span>Peer</span>{peer.length > 0 && ( <span className="fm-mysub-tab-btn__badge">{peer.length}</span> )}
            </button>
          </div>
        </div>

        <div className="fm-mysub-content">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center fm-mysub-loading">
              <div className="spinner-border text-primary"style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : getTabData().length === 0 ? (
            <div className="fm-mysub-empty text-center">
              {React.createElement(getEmptyStateIcon(), {
                size: 56,className: "fm-mysub-empty__icon mb-3",})}
              <h6 className="fm-mysub-empty__title fw-bold mb-2"> No {tab} submissions yet</h6>
              <p className="fm-mysub-empty__subtitle mb-0"> You haven't submitted any {tab.toLowerCase()} feedback </p>
            </div> ) : (
            <div className="row g-3">
              {tab === "HR Forms" && hrForms.map((hr) => (
                  <div className="col-md-6 col-lg-4" key={hr.responseId}>
                    <div className="fm-mysub-card fm-mysub-card--hr card h-100">
                      <div className="fm-mysub-card__body card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <User size={18} className="fm-mysub-card__icon-muted" />
                            <div className="flex-grow-1 text-start">
                              <div className="fm-mysub-card__label-small mb-1">From</div>
                              <div className="fm-mysub-card__primary-text"> {user.firstName} {user.lastName} </div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2 mb-3">
                          <User size={18} className="fm-mysub-card__icon-muted"/>
                          <div className="text-start">
                            <div className="fm-mysub-card__label-small mb-1">To </div>
                            <div className="fm-mysub-card__primary-text">HR</div>
                          </div>
                        </div>
                       
                        <div className="fm-mysub-card__preview mb-3">
                          <p className="fm-mysub-card__preview-text"> {hr.formName || "HR Form Submission"}</p>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn fm-mysub-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewResponse(hr, "HR")}>
                            <Eye size={16} /> View</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {tab === "Goal Feedback" &&
                goalFeedback.map((goal) => (
                  <div className="col-md-6 col-lg-4" key={goal.orgGoalFeedbackId} >
                    <div className="fm-mysub-card fm-mysub-card--goal card h-100">
                      <div className="fm-mysub-card__body card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <User size={18} className="fm-mysub-card__icon-muted"/>
                            <div className="flex-grow-1 text-start">
                              <div className="fm-mysub-card__label-small mb-1"> From</div>
                              <div className="fm-mysub-card__primary-text">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2 mb-3">
                          <Target size={18} className="fm-mysub-card__icon-muted"/>
                          <div className="text-start">
                            <div className="fm-mysub-card__label-small mb-1">  Goal</div>
                            <div className="fm-mysub-card__primary-text">{goal.objectiveTitle}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Clock size={16} className="fm-mysub-card__icon-muted" />
                          <div className="fm-mysub-card__meta-text"> {goal.submittedAtFormatted}</div>
                        </div>
                        {goal.rating > 0 && (
                          <div className="d-flex align-items-center gap-1 mb-3">
                            <Star  size={14}  className="fm-mysub-rating-star"  fill="#fbbf24" />
                            <span className="fm-mysub-rating-text">{RATING_LABELS[goal.rating] || "Rated"} ( {goal.rating}/5) </span>
                          </div> )}
                        <div className="fm-mysub-card__preview mb-3">
                          <p className="fm-mysub-card__preview-text">{goal.feedbackComments || "No comments provided"} </p>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn fm-mysub-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewResponse(goal, "Goal")}>
                            <Eye size={16} />View  </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {tab === "Mentor" && mentor.map((m) => (
              <div className="col-md-6 col-lg-4" key={m.trackingId || `mentor-${m.mentorEmployeeId}`}>
                    <div className="fm-mysub-card fm-mysub-card--mentor card h-100">
                      <div className="fm-mysub-card__body card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <User size={18} className="fm-mysub-card__icon-muted"/>
                            <div className="flex-grow-1 text-start">
                              <div className="fm-mysub-card__label-small mb-1"> From</div>
                              <div className="fm-mysub-card__primary-text"> {user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2 mb-3">
                          <User size={18} className="fm-mysub-card__icon-muted"/>
                          <div className="text-start">
                            <div className="fm-mysub-card__label-small mb-1">To </div>
                            <div className="fm-mysub-card__primary-text">{m.mentorNameFull}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <Clock size={16} className="fm-mysub-card__icon-muted"/>
                          <div className="fm-mysub-card__meta-text">{m.createdAtFormatted}</div>
                        </div>
                        <div className="fm-mysub-card__preview mb-3">
                          <p className="fm-mysub-card__preview-text">
                          {m.feedbackContent || m.comments || "Mentor feedback..."}
                          </p>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="button"
                            className="btn fm-mysub-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewResponse(m, "Mentor")}>
                            <Eye size={16} /> View </button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
              {tab === "Peer" && peer.map((p) => (
              <div className="col-md-6 col-lg-4" key={p.queueId || `peer-${p.recipientEmployeeId}`}>
                    <div className="fm-mysub-card fm-mysub-card--peer card h-100">
                      <div className="fm-mysub-card__body card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                            <User size={18}  className="fm-mysub-card__icon-muted" />
                            <div className="flex-grow-1 text-start">
                              <div className="fm-mysub-card__label-small mb-1"> From </div>
                              <div className="fm-mysub-card__primary-text"> {user.firstName} {user.lastName} </div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2 mb-3">
                          <User size={18} className="fm-mysub-card__icon-muted" />
                          <div className="text-start">
                            <div className="fm-mysub-card__label-small mb-1"> To </div>
                            <div className="fm-mysub-card__primary-text"> {p.recipientNameFull}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <Clock size={16} className="fm-mysub-card__icon-muted"/>
                          <div className="fm-mysub-card__meta-text">{p.createdAtFormatted}</div>
                        </div>
                        <div className="fm-mysub-card__preview mb-3">
                          <p className="fm-mysub-card__preview-text"> {p.feedbackContent || "Peer feedback..."}</p>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn fm-mysub-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewResponse(p, "Peer")}>
                            <Eye size={16} />  View </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <ResponseViewModal 
        show={showModal}response={selectedResponse} 
        onClose={handleCloseModal}type={selectedType}/>
      </div>
    </>
  );
}
