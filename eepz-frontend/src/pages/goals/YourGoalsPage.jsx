import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import GoalCard from "../../components/goals/cards/GoalCard";
import GoalTypeToggle from "../../components/goals/forms/GoalTypeToggle";
import GoalFilters from "../../components/goals/forms/GoalFilters";
import GoalFormModal from "../../components/goals/modals/GoalFormModal";
import QuickCommentModal from "../../components/goals/modals/QuickCommentModal";
import LoadingSpinner from "../../components/goals/common/LoadingSpinner";
import Alert from "../../components/goals/common/Alert";
import Pagination from "../../components/goals/common/Pagination";
import { GOAL_TYPES } from "../../constants/goals/goalConstants";
import Breadcrumb from "../../components/goals/common/Breadcrumb";

const YourGoalsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [goals, setGoals] = useState([]);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES.SELF);
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    projectId: "",
    dateRange: "",
    dateFrom: "",
    dateTo: "",
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Counts for type toggle
  const [typeCounts, setTypeCounts] = useState({
    self: 0,
    team: 0,
    org: 0,
  });

  useEffect(() => {
    loadCounts();
    loadProjects();
  }, []);

  useEffect(() => {
    loadGoals();
  }, [selectedType, currentPage, filters, searchTerm]);

  const loadProjects = async () => {
    try {
      const response = await goalService.getUserProjects();
      const projectsData = response.data || [];
      const formattedProjects = projectsData.map((project) => ({
        id: project.projectId || project.id,
        name: project.projectName || project.name,
      }));
      setProjects(formattedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadCounts = async () => {
    try {
      const params = user?.role === "Leadership" ? { viewMode: "company" } : {};

      const [selfRes, teamRes, orgRes] = await Promise.all([
        goalService.queryGoals({
          type: "self",
          page: 1,
          pageSize: 1,
          ...params,
        }),
        goalService.queryGoals({
          type: "team",
          page: 1,
          pageSize: 1,
          ...params,
        }),
        goalService.queryGoals({
          type: "org",
          page: 1,
          pageSize: 1,
          ...params,
        }),
      ]);

      setTypeCounts({
        self:
          selfRes?.metadata?.resultCount ||
          selfRes?.data?.metadata?.resultCount ||
          0,
        team:
          teamRes?.metadata?.resultCount ||
          teamRes?.data?.metadata?.resultCount ||
          0,
        org:
          orgRes?.metadata?.resultCount ||
          orgRes?.data?.metadata?.resultCount ||
          0,
      });
    } catch (error) {
      console.error("Failed to load counts:", error);
      setTypeCounts({
        self: 0,
        team: 0,
        org: 0,
      });
    }
  };

  const getViewMode = () => {
    if (user?.role === "Leadership") {
      return "company"; // Company-wide view for Leadership
    }
    if (user?.role === "Department Head") {
      return "department"; // Department-wide for DeptHead
    }
    return "personal"; // Personal for others
  };

  const loadGoals = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const params = {
        type: selectedType, // Can be any type
        page: currentPage,
        pageSize: pageSize,
        viewMode: getViewMode(), // Leadership = company
        ...filters,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await goalService.queryGoals(params);

      const goalsData = Array.isArray(response.data)
        ? response.data
        : response.data?.goals || [];
      setGoals(goalsData);

      if (response.metadata) {
        setTotalCount(
          response.metadata.totalCount || response.metadata.resultCount || 0
        );
        setTotalPages(
          Math.ceil((response.metadata.totalCount || 0) / pageSize)
        );
      } else {
        setTotalCount(goalsData.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to load goals",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = (goal) => {
    setSelectedGoal(goal);
    setShowCommentModal(true);
  };

  const handleGoalCreated = () => {
    loadGoals();
    loadCounts();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    setSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v !== "" && v !== null).length +
    (searchTerm ? 1 : 0);

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "Goals Dashboard", path: "/dashboard/goals", icon: "" },
          { label: "Your Goals", path: null, icon: "" },
        ]}
      />

      {/* Goal Type Toggle */}
      <GoalTypeToggle
        selectedType={selectedType}
        onTypeChange={(type) => {
          setSelectedType(type);
          setCurrentPage(1);
        }}
        counts={typeCounts}
      />

      {/* Search & Filter Button Row */}
      <div className="d-flex gap-3 mb-3 align-items-center">
        {/* Search Bar */}
        <div className="col-md-10">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by goal title or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              style={{ minHeight: "35.7px" }}
            />
            {searchTerm ? (
              <button
                className="btn btn-outline-secondary"
                onClick={handleCancelSearch}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            )}
          </div>
        </div>

        {/* Filter Button */}
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowFiltersModal(true)}
          style={{
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            width: "200px",
          }}
        >
          <i className="bi bi-funnel me-2"></i>
          Filters
          {activeFilterCount > 0 && (
            <span
              className="badge bg-primary ms-2"
              style={{ fontSize: "0.7rem" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/*Create Button*/}
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Goal
        </button>
      </div>

      {/* Results Summary */}
      <div className="mb-3">
        {activeFilterCount > 0 && (
          <span className="text-muted ms-2">
            ({activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
            active)
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner text="Loading goals..." />
      ) : goals.length === 0 ? (
        <div
          className="card text-center"
          style={{ padding: "3rem", backgroundColor: "#f8f9fa" }}
        >
          <i
            className="bi bi-inbox"
            style={{ fontSize: "4rem", color: "#dee2e6" }}
          ></i>
          <h6 className="mt-3 mb-2" style={{ color: "#6c757d" }}>
            {activeFilterCount > 0
              ? "No goals match your filters"
              : "No goals found"}
          </h6>
          <p className="text-muted mb-3">
            {activeFilterCount > 0
              ? "Try adjusting your search or filters"
              : "Start by creating your first goal"}
          </p>
          {activeFilterCount > 0 && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowFiltersModal(true)}
              style={{ maxWidth: "200px", margin: "0 auto" }}
            >
              Adjust Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Goals Grid */}
          <div className="row g-3 mb-4">
            {goals.map((goal) => (
              <div key={goal.goalId} className="col-12 col-md-6 col-xl-4">
                <GoalCard
                  goal={goal}
                  onComment={handleCommentClick}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
          currentPageItems={goals.length}
          pageSize={pageSize}
        />
      )}

      {/* Create Goal Modal */}
      <GoalFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGoalCreated}
      />

      {/* Filters Modal */}
      <GoalFilters
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        projects={projects}
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
          onSuccess={loadGoals}
        />
      )}
    </div>
  );
};

export default YourGoalsPage;
