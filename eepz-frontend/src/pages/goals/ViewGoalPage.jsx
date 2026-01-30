import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import GoalDetailsHeader from "../../components/goals/detail/GoalDetailsHeader";
import GoalChecklist from "../../components/goals/detail/GoalChecklist";
import GoalComments from "../../components/goals/detail/GoalComments";
import GoalTimeline from "../../components/goals/detail/GoalTimeline";
import GoalFormModal from "../../components/goals/modals/GoalFormModal";
import RequestApprovalModal from "../../components/goals/modals/RequestApprovalModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import { APPROVAL_TYPES } from "../../constants/goals/goalConstants";
import {
  canUserEdit,
  canUserAssign,
  canUserComment,
  isOverdue,
} from "../../utils/goals/goalHelpers";
import Breadcrumb from "../../components/common/Breadcrumb";
import styles from "../../styles/goals/pages/ViewGoalPage.module.css";

const ViewGoalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const getRolePrefix = (role) =>
    ({
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
    }[role] || "/employee");

  const rolePrefix = getRolePrefix(user.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [goal, setGoal] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [personalProgress, setPersonalProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canAssign: false,
    canComplete: false,
    canComment: false,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState(null);

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setAlert(null);

    try {
      const response = await goalService.getGoal(id);
      const goalData = response.data;

      setGoal(goalData);
      setCurrentProgress(goalData.progressPercent || 0);

      const isCompleted = ["completed", "closed", "cancelled"].includes(
        goalData.status?.toLowerCase()
      );

      const canEdit = !isCompleted && canUserEdit(goalData, user);
      const canAssign = !isCompleted && canUserAssign(goalData, user);
      const canComment = canUserComment(goalData, user);

      setPermissions({
        canEdit,
        canAssign,
        canComplete: !isCompleted,
        canComment,
      });
    } catch (error) {
      setAlert({
        type: "danger",
        message:
          error.response?.status === 404
            ? "Goal not found"
            : "Failed to load goal details",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  const handleRequestApproval = (approvalTypeParam) => {
    const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
    const isAssignee = goal.assignees?.some(
      (a) => a.employeeMasterId === user.empMasterId
    );

    let selectedApprovalType = approvalTypeParam;

    if (!selectedApprovalType) {
      if (goal.goalType === "self" || isCreator) {
        selectedApprovalType = APPROVAL_TYPES.COMPLETION;
      } else if (!isCreator && isAssignee) {
        selectedApprovalType = APPROVAL_TYPES.TASK_ACKNOWLEDGMENT;
      }
    }

    setApprovalType(selectedApprovalType);
    setShowApprovalModal(true);
  };

  const handleGoalUpdated = () => {
    loadGoal(false);
  };

  const handleRefresh = () => {
    loadGoal(true);
  };

  const getTabClass = (tabName) => {
    return `nav-link ${styles.navTab} ${activeTab === tabName ? "active" : ""}`;
  };

  if (loading) {
    return <LoadingSpinner text="Loading goal..." fullScreen />;
  }

  if (!goal) {
    return (
      <div className={`container-fluid p-4 ${styles.errorContainer}`}>
        <Alert type="danger" message="Goal not found" />
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>
          Go Back
        </button>
      </div>
    );
  }

  const isCreator = goal.createdByEmployeeMasterId === user.empMasterId;
  const isAssignee = goal.assignees?.some(
    (a) => a.employeeMasterId === user.empMasterId
  );
  const isLeadership = user.role === "Leadership";
  const isTeamGoal = goal.goalType === "team";
  const isLeadershipMonitoring =
    isLeadership && isTeamGoal && !isCreator && !isAssignee;
  const shouldShowCommentsAndTimeline =
    !(goal.goalType === "org" && user.role !== "Leadership") &&
    !isLeadershipMonitoring;

  return (
    <div className={`container-fluid ${styles.pageContainer}`}>
      {/* Breadcrumb */}
      {goal && (
        <Breadcrumb
          items={[
            { label: "Goals Dashboard", path: `${rolePrefix}/dashboard/goals` },
            { label: goal.title || "Goal Details", path: null, icon: "" },
          ]}
        />
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <GoalDetailsHeader
        goal={goal}
        onEdit={handleEdit}
        onAssign={handleAssign}
        onRequestApproval={handleRequestApproval}
        canEdit={permissions.canEdit}
        canAssign={permissions.canAssign}
        canComplete={permissions.canComplete}
        currentProgress={currentProgress}
        userPersonalProgress={personalProgress}
      />

      <ul className={`nav nav-tabs mb-4 ${styles.tabList}`}>
        <li className="nav-item">
          <button
            className={getTabClass("details")}
            onClick={() => setActiveTab("details")}
          >
            <i className="bi bi-list-check me-2"></i>
            Details
          </button>
        </li>
        {shouldShowCommentsAndTimeline && (
          <li className="nav-item">
            <button
              className={getTabClass("comments")}
              onClick={() => setActiveTab("comments")}
            >
              <i className="bi bi-chat-left-text me-2"></i>
              Comments
            </button>
          </li>
        )}
        {shouldShowCommentsAndTimeline && (
          <li className="nav-item">
            <button
              className={getTabClass("timeline")}
              onClick={() => setActiveTab("timeline")}
            >
              <i className="bi bi-clock-history me-2"></i>
              Timeline
            </button>
          </li>
        )}
      </ul>

      <div className={`tab-content ${styles.tabContent}`}>
        {activeTab === "details" && (
          <GoalChecklist
            goal={goal}
            onUpdate={loadGoal}
            onProgressChange={setCurrentProgress}
            onPersonalProgressChange={setPersonalProgress}
            onRequestApproval={handleRequestApproval}
          />
        )}

        {activeTab === "comments" && shouldShowCommentsAndTimeline && (
          <GoalComments
            goalId={id}
            canComment={permissions.canComment}
            goal={goal}
            goalStatus={goal.status}
          />
        )}

        {activeTab === "timeline" && shouldShowCommentsAndTimeline && (
          <GoalTimeline goalId={id} />
        )}
      </div>

      <GoalFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        goalData={goal}
        onSuccess={handleGoalUpdated}
      />

      {/* FIXED: Single RequestApprovalModal with dynamic approvalType */}
      <RequestApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovalType(null);
        }}
        goalId={id}
        approvalType={approvalType}
        onSuccess={handleGoalUpdated}
        goalType={goal?.goalType}
        requesterRole={user?.role}
      />
    </div>
  );
};

export default ViewGoalPage;
