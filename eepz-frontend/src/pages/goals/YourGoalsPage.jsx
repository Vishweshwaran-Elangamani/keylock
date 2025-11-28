import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/auth/AuthContext";
import goalService from "../../services/goals/goalService";
import GoalCard from "../../components/goals/cards/GoalCard";
import GoalTypeToggle from "../../components/goals/forms/GoalTypeToggle";
import GoalFilters from "../../components/goals/modals/GoalFilters";
import GoalFormModal from "../../components/goals/modals/GoalFormModal";
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
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);

  // Server-side pagination - itemsPerPage is now state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

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

  // Counts for type toggle
  const [typeCounts, setTypeCounts] = useState({
    self: 0,
    team: 0,
    org: 0,
  });

  // Debounce timer
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    loadCounts();
    loadProjects();
  }, []);

  // Added itemsPerPage to dependencies for server-side pagination
  useEffect(() => {
    loadGoals();
  }, [selectedType, currentPage, itemsPerPage, filters, searchTerm]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        setCurrentPage(1);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput]);

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
      const viewMode =
        user?.role === "Leadership"
          ? "company"
          : user?.role === "Department Head"
          ? "department"
          : "personal";

      const [selfRes, teamRes, orgRes] = await Promise.all([
        goalService.queryGoals({
          type: "self",
          status: "inprogress",
          page: 1,
          pageSize: 1_000_000,
          viewMode,
        }),
        goalService.queryGoals({
          type: "team",
          status: "inprogress",
          page: 1,
          pageSize: 1_000_000,
          viewMode,
        }),
        goalService.queryGoals({
          type: "org",
          status: "inprogress",
          page: 1,
          pageSize: 1_000_000,
          viewMode,
        }),
      ]);

      setTypeCounts({
        self:
          selfRes?.metadata?.totalCount ?? selfRes?.metadata?.resultCount ?? 0,
        team:
          teamRes?.metadata?.totalCount ?? teamRes?.metadata?.resultCount ?? 0,
        org: orgRes?.metadata?.totalCount ?? orgRes?.metadata?.resultCount ?? 0,
      });
    } catch (error) {
      console.error("Failed to load counts:", error);
      setTypeCounts({ self: 0, team: 0, org: 0 });
    }
  };

  const getViewMode = useCallback(() => {
    if (user?.role === "Leadership") return "company";
    if (user?.role === "Department Head") return "department";
    return "personal";
  }, [user?.role]);

  const loadGoals = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const params = {
        type: selectedType,
        page: currentPage,
        pageSize: itemsPerPage, // Changed from pageSize constant
        viewMode: getViewMode(),
        ...filters,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await goalService.queryGoals(params);

      console.log("API Response metadata:", response.metadata);

      const goalsData = Array.isArray(response.data)
        ? response.data
        : response.data?.goals || [];

      setGoals(goalsData);

      const metadata = response.metadata || {};

      if (metadata.totalCount !== undefined) {
        setTotalCount(metadata.totalCount);
        setTotalPages(
          metadata.totalPages || Math.ceil(metadata.totalCount / itemsPerPage)
        );
        setHasMorePages(
          currentPage < Math.ceil(metadata.totalCount / itemsPerPage)
        );
      } else {
        const resultCount = metadata.resultCount || goalsData.length;
        const mightHaveMore = resultCount >= itemsPerPage;

        setHasMorePages(mightHaveMore);

        if (mightHaveMore) {
          const estimatedTotal = currentPage * itemsPerPage + 1;
          setTotalCount(estimatedTotal);
          setTotalPages(currentPage + 1);
        } else {
          const exactTotal = (currentPage - 1) * itemsPerPage + resultCount;
          setTotalCount(exactTotal);
          setTotalPages(currentPage);
        }
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
      setAlert({
        type: "danger",
        message: error.response?.data?.message || "Failed to load goals",
      });
      setGoals([]);
      setTotalCount(0);
      setTotalPages(0);
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

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowFiltersModal(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      projectId: "",
      dateRange: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v !== "" && v !== null).length +
    (searchTerm ? 1 : 0);

  return (
    <div className="container-fluid">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "Goals Dashboard", path: "/dashboard/goals", icon: "" },
          { label: "Your Goals", path: null, icon: "" },
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

      <div className="d-flex gap-3 mb-3 align-items-center flex-wrap">
        {/* Goal Type Toggle */}
        <GoalTypeToggle
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          counts={typeCounts}
        />

        {/* Search Bar */}
        <div className="flex-grow-1">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by goal title or requester..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              style={{ minHeight: "36px", border: "1px solid rgb(39, 35, 92)" }}
            />
            {searchInput && (
              <button
                className="btn btn-outline-secondary flex-shrink-0"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
            <button
              className="btn btn-primary flex-shrink-0"
              onClick={handleSearch}
              disabled={loading}
              style={{ backgroundColor: "rgb(39, 35, 92)" }}
            >
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

        {/* Filter Button */}
        <button
          className="btn btn-outline-secondary flex-shrink-0"
          onClick={() => setShowFiltersModal(true)}
          style={{
            borderRadius: "8px",
            padding: "0.5rem 1rem",
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

        {/* Create Button */}
        <button
          className="btn btn-primary flex-shrink-0"
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Goal
        </button>
      </div>

      {/* Results Summary - Removed since Pagination now shows this info */}
      {activeFilterCount > 0 && (
        <div className="d-flex justify-content-end align-items-center mb-3">
          <button
            className="btn btn-link btn-sm text-danger p-0"
            onClick={handleClearFilters}
          >
            <i className="bi bi-x-circle me-1"></i>
            Clear all filters
          </button>
        </div>
      )}

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
          <div className="d-flex gap-2 justify-content-center">
            {activeFilterCount > 0 && (
              <button
                className="btn btn-outline-secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
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
        </div>
      ) : (
        <>
          {/* Goals Grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "60vh",
            }}
          >
            <div className="flex-grow-1">
              <div className="row g-3 mb-4">
                {goals.map((goal) => (
                  <div
                    key={goal.goalId}
                    className="col-12 col-md-6 col-lg-4 col-xl-3"
                  >
                    <GoalCard
                      goal={goal}
                      onComment={handleCommentClick}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[8, 12, 24, 48]}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              zIndex: 1000,
            }}
          />
        </>
      )}

      {/* Create Goal Modal */}
      <GoalFormModal isOpen={showCreateModal} />

      {/* Filters Modal */}
      <GoalFilters
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onApply={handleFiltersApply}
        projects={projects}
      />
    </div>
  );
};

export default YourGoalsPage;
