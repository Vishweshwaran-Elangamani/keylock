import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import GoalTracker from "../../components/goals/cards/GoalTracker";
import GoalCard from "../../components/goals/cards/GoalCard";
import GoalTypeToggle from "../../components/goals/forms/GoalTypeToggle";
import GoalFormModal from "../../components/goals/modals/GoalFormModal";
import QuickCommentModal from "../../components/goals/modals/QuickCommentModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import Pagination from "../../components/goals/common/Pagination";
import { GOAL_TYPES } from "../../constants/goals/goalConstants";

const GoalsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [alert, setAlert] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ongoingGoals, setOngoingGoals] = useState([]);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.SELF);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Role checks
  const isEmployee = user.role === "Employee";
  const isManager = ["Manager", "Department Head"].includes(user.role);
  const isLeader = user.role === "Leadership";
  const canCreateTeamGoals = isManager || isLeader;
  const canCreateOrgGoals = isLeader;

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadOngoingGoals();
  }, [selectedType, currentPage]);

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

  const loadOngoingGoals = async () => {
    setLoadingGoals(true);
    try {
      // Fetch goals for ongoing statuses: open, inprogress, reopened
      const statuses = ["open", "inprogress", "reopened"];

      // Fetch more items per status to ensure we have enough after combining
      const requests = statuses.map((status) =>
        goalService.queryGoals({
          type: selectedType,
          status: status,
          page: currentPage,
          pageSize: pageSize * 2, // Fetch more to account for deduplication
        })
      );

      const responses = await Promise.all(requests);

      // Combine all results
      const allGoals = responses.flatMap((response) => response.data || []);

      // Remove duplicates based on goalId
      const uniqueGoals = Array.from(
        new Map(allGoals.map((goal) => [goal.goalId, goal])).values()
      );

      // Sort by most recent
      const sortedGoals = uniqueGoals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Calculate pagination for combined results
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGoals = sortedGoals.slice(startIndex, endIndex);

      setOngoingGoals(paginatedGoals);
      setTotalCount(sortedGoals.length);
      setTotalPages(Math.ceil(sortedGoals.length / pageSize));
    } catch (error) {
      console.error("Error loading ongoing goals:", error);
      setAlert({
        type: "danger",
        message: "Failed to load ongoing goals",
      });
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleCreateGoal = () => {
    setShowCreateModal(true);
  };

  const handleGoalCreated = () => {
    loadDashboardData();
    setCurrentPage(1); // Reset to first page
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

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            style={{
              fontWeight: 700,
              color: "#212529",
              marginBottom: "0.5rem",
              textAlign: "left",
            }}
          >
            Goals Dashboard
          </h2>
          <p className="text-muted mb-0">
            Track and manage your goals in one place
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleCreateGoal}>
            <i className="bi bi-plus-circle me-2"></i>
            Create Goal
          </button>
          <button className="btn btn-outline-secondary" onClick={handleViewAll}>
            <i className="bi bi-list-ul me-2"></i>
            Your Goals
          </button>
        </div>
      </div>

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
          {/* Summary Cards */}
          <GoalTracker summary={summary} />

          <hr></hr>

          {/* Goal Type Toggle */}
          <GoalTypeToggle
            selectedType={selectedType}
            onTypeChange={(type) => {
              setSelectedType(type);
              setCurrentPage(1); // Reset to first page when changing type
            }}
          />

          <hr></hr>

          {/* Ongoing Goals Section */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ fontWeight: 600, marginBottom: 0 }}>
                <i
                  className="bi bi-arrow-repeat me-2"
                  style={{ color: "#0d6efd" }}
                ></i>
                Ongoing Goals
                {totalCount > 0 && (
                  <span
                    className="text-muted ms-2"
                    style={{ fontSize: "0.9rem", fontWeight: 400 }}
                  >
                    ({totalCount} {totalCount === 1 ? "goal" : "goals"})
                  </span>
                )}
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                onClick={handleViewAll}
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="View all items"
                aria-label="View all items"
              >
                <i className="bi bi-arrow-right ms-2" aria-hidden="true"></i>
              </button>
            </div>

            {loadingGoals ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading goals...</p>
              </div>
            ) : ongoingGoals.length === 0 ? (
              <div
                className="card text-center"
                style={{ padding: "3rem", backgroundColor: "#f8f9fa" }}
              >
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: "4rem", color: "#dee2e6" }}
                ></i>
                <h6 className="mt-3 mb-2" style={{ color: "#6c757d" }}>
                  No ongoing goals
                </h6>
                <p className="text-muted mb-3">
                  Start by creating your first goal
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateGoal}
                  style={{ maxWidth: "200px", margin: "0 auto" }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Goal
                </button>
              </div>
            ) : (
              <>
                <div className="row g-3 mb-4">
                  {ongoingGoals.map((goal) => (
                    <div key={goal.goalId} className="col-12 col-md-6 col-xl-4">
                      <GoalCard
                        goal={goal}
                        onComment={handleCommentClick}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    loading={loadingGoals}
                    currentPageItems={ongoingGoals.length}
                    pageSize={pageSize}
                  />
                )}
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

      {/* Quick Comment Modal */}
      {selectedGoal && (
        <QuickCommentModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedGoal(null);
          }}
          goalId={selectedGoal.goalId}
          goalTitle={selectedGoal.title}
          onSuccess={loadOngoingGoals}
        />
      )}
    </div>
  );
};

export default GoalsDashboard;
