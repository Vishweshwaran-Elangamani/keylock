import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import GoalTracker from "../../components/goals/cards/GoalTracker";
import GoalCard from "../../components/goals/cards/GoalCard";
import GoalTypeToggle from "../../components/goals/forms/GoalTypeToggle";
import GoalFormModal from "../../components/goals/modals/GoalFormModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import Pagination from "../../components/goals/common/Pagination";
import Breadcrumb from "../../components/common/Breadcrumb";
import { GOAL_TYPES } from "../../constants/goals/goalConstants";
import styles from "../../styles/goals/pages/GoalsDashboard.module.css";

const GoalsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRolePrefix = (role) =>
    ({
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
    }[role] || "/employee");

  const rolePrefix = getRolePrefix(user.role);

  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [alert, setAlert] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allOngoingGoals, setAllOngoingGoals] = useState([]);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.SELF);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Role checks
  const isEmployee = user.role === "Employee";
  const isManager = ["Manager", "Department Head"].includes(user.role);
  const isLeader = user.role === "Leadership";

  // Calculate paginated goals
  const paginatedData = useMemo(() => {
    const totalCount = allOngoingGoals.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentGoals = allOngoingGoals.slice(startIndex, endIndex);

    return {
      goals: currentGoals,
      totalCount,
      totalPages,
    };
  }, [allOngoingGoals, currentPage, itemsPerPage]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadOngoingGoals();
  }, [selectedType]);

  const loadDashboardData = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await goalService.getDashboardSummary();
      setSummary(response.data);
    } catch (error) {
      setAlert({
        type: "danger",
        message: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOngoingGoals = useCallback(async () => {
    setLoadingGoals(true);
    setAlert(null);

    try {
      const statuses = ["open", "inprogress", "reopened"];
      const requests = statuses.map((status) =>
        goalService.queryGoals({
          type: selectedType,
          status: status,
          page: 1,
          pageSize: 100,
        })
      );

      const responses = await Promise.all(requests);
      const allGoals = responses.flatMap((response) => response.data || []);
      const uniqueGoals = Array.from(
        new Map(allGoals.map((goal) => [goal.goalId, goal])).values()
      );
      const sortedGoals = uniqueGoals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setAllOngoingGoals(sortedGoals);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading ongoing goals:", error);
      setAlert({
        type: "danger",
        message: "Failed to load ongoing goals",
      });
      setAllOngoingGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  }, [selectedType]);

  const handleCreateGoal = () => {
    setShowCreateModal(true);
  };

  const handleGoalCreated = () => {
    loadDashboardData();
    loadOngoingGoals();
  };

  const handleCommentClick = (goal) => {
    setSelectedGoal(goal);
    setShowCommentModal(true);
  };

  const handleViewAll = () => {
    const rolePath = isEmployee
      ? "employee"
      : isLeader
      ? "leadership"
      : "manager";
    navigate(`/${rolePath}/goals/your-goals`);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };

  return (
    <div className="container-fluid">
      <Breadcrumb
        items={[
          { label: "Goals Dashboard", path: `${rolePrefix}/dashboard/goals` },
        ]}
      />

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner text="Loading dashboard..." />
      ) : (
        <>
          {/* Summary Cards with Action Buttons */}
          <div className="d-flex align-items-start gap-3 mb-4">
            <div className={styles.summarySection}>
              <GoalTracker summary={summary} />
            </div>
            <div
              className={`d-flex flex-column gap-2 ${styles.actionButtonsContainer}`}
            >
              <button
                className={`btn btn-primary ${styles.createGoalButton}`}
                onClick={handleCreateGoal}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Goal
              </button>
              <button
                className={`btn btn-primary ${styles.viewGoalsButton}`}
                onClick={handleViewAll}
              >
                <i className="bi bi-list-ul me-2"></i>
                Your Goals
              </button>
            </div>
          </div>

          {/* Goal Type Toggle */}
          <GoalTypeToggle
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
          />

          {/* Ongoing Goals Section */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className={styles.sectionTitle}>
                <i
                  className={`bi bi-arrow-repeat me-2 ${styles.sectionIcon}`}
                ></i>
                Ongoing Goals
                {paginatedData.totalCount > 0 && (
                  <span className={`text-muted ms-2 ${styles.goalCount}`}>
                    ({paginatedData.totalCount}{" "}
                    {paginatedData.totalCount === 1 ? "goal" : "goals"})
                  </span>
                )}
              </h5>
            </div>

            {loadingGoals ? (
              <div className={styles.loadingContainer}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className={`text-muted ${styles.loadingText}`}>
                  Loading goals...
                </p>
              </div>
            ) : paginatedData.goals.length === 0 ? (
              <div className={`card text-center ${styles.emptyStateCard}`}>
                <i className={`bi bi-inbox ${styles.emptyStateIcon}`}></i>
                <h6 className={`mt-3 mb-2 ${styles.emptyStateTitle}`}>
                  No ongoing goals
                </h6>
              </div>
            ) : (
              <>
                <div className={styles.goalsContainer}>
                  <div className={styles.goalsContent}>
                    <div className="row g-3 mb-4">
                      {paginatedData.goals.map((goal) => (
                        <div
                          key={goal.goalId}
                          className="col-12 col-md-6 col-xl-4"
                        >
                          <GoalCard goal={goal} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sticky Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={handlePageChange}
                    loading={loadingGoals}
                    totalItems={paginatedData.totalCount}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    pageSizeOptions={[6, 12, 24, 48]}
                    className={styles.stickyPagination}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Create Goal Modal */}
      <GoalFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGoalCreated}
      />
    </div>
  );
};

export default GoalsDashboard;
