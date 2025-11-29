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
import Breadcrumb from "../../components/goals/common/Breadcrumb";
import { GOAL_TYPES } from "../../constants/goals/goalConstants"; 

const GoalsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [alert, setAlert] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allOngoingGoals, setAllOngoingGoals] = useState([]);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.SELF);

  // Pagination - now with state for itemsPerPage
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

  // Calculate paginated goals from all goals (memoized)
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

  // Load dashboard summary on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load ongoing goals only when selectedType changes
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

      // Fetch ALL goals for each status
      const requests = statuses.map((status) =>
        goalService.queryGoals({
          type: selectedType,
          status: status,
          page: 1,
          pageSize: 100,
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

      setAllOngoingGoals(sortedGoals);
      setCurrentPage(1); // Reset to page 1 when data changes
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
    // Page reset is handled by the Pagination component itself
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };

  return (
    <div className="container-fluid">
      <Breadcrumb
        items={[
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "Goals Dashboard", path: "/dashboard/goals", icon: "" },
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
            <div style={{ flex: 1 }}>
              <GoalTracker summary={summary} />
            </div>
            <div
              className="d-flex flex-column gap-2"
              style={{ minWidth: "180px" }}
            >
              <button
                className="btn btn-primary"
                onClick={handleCreateGoal}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  whiteSpace: "nowrap",
                  height: "55px",
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Goal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleViewAll}
                style={{
                  backgroundColor: "rgb(39, 35, 92)",
                  color: "white",
                  whiteSpace: "nowrap",
                  height: "50px",
                }}
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
              <h5 style={{ fontWeight: 600, marginBottom: 0 }}>
                <i
                  className="bi bi-arrow-repeat me-2"
                  style={{ color: "#0d6efd" }}
                ></i>
                Ongoing Goals
                {paginatedData.totalCount > 0 && (
                  <span
                    className="text-muted ms-2"
                    style={{ fontSize: "0.9rem", fontWeight: 400 }}
                  >
                    ({paginatedData.totalCount}{" "}
                    {paginatedData.totalCount === 1 ? "goal" : "goals"})
                  </span>
                )}
              </h5>
            </div>

            {loadingGoals ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading goals...</p>
              </div>
            ) : paginatedData.goals.length === 0 ? (
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
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "60vh",
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
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
                    style={{
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "#fff",
                      padding: "0.75rem 1rem",
                      borderTop: "1px solid #ddd",
                      zIndex: 1000,
                    }}
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
