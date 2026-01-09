import React from "react";
import { Toaster } from "sonner";
import { useManagerDashboardLogic } from "../../../hooks/performancemanagement/useManagerDashboardLogic";
import Breadcrumb from "../../../components/common/Breadcrumb";
import AssessmentsTable from "./AssessmentsTable";
import AssessmentModal from "../../../components/performance_management/modals/ManagerPerformanceDashboard/AssessmentModal";
import { PaginationDropdown } from "./ManagerDashboardUtils";
import "../../../styles/performancemanagement/manager/ManagerPerformanceDashboard.css";

const StatisticsCards = ({ stats }) => {
  return (
    <div className="mgr-stats-grid">
      <div className="mgr-stat-card mgr-stat-total">
        <div className="mgr-stat-icon">
          <i className="bi bi-clipboard-data"></i>
        </div>
        <div className="mgr-stat-content">
          <div className="mgr-stat-value">{stats.total}</div>
          <div className="mgr-stat-label">Total Assessments</div>
        </div>
      </div>

      <div className="mgr-stat-card mgr-stat-pending">
        <div className="mgr-stat-icon">
          <i className="bi bi-hourglass-split"></i>
        </div>
        <div className="mgr-stat-content">
          <div className="mgr-stat-value">{stats.pending}</div>
          <div className="mgr-stat-label">Pending Forms</div>
        </div>
      </div>

      <div className="mgr-stat-card mgr-stat-completed">
        <div className="mgr-stat-icon">
          <i className="bi bi-check-circle"></i>
        </div>
        <div className="mgr-stat-content">
          <div className="mgr-stat-value">{stats.completed}</div>
          <div className="mgr-stat-label">Completed Forms</div>
        </div>
      </div>
    </div>
  );
};

export default function ManagerDashboard() {
  const {
    loading,
    showModal,
    setShowModal,
    modalMode,
    setModalMode,
    currentAssignment,
    setCurrentAssignment,
    assessmentData,
    setAssessmentData,
    submitting,
    activeTab,
    setActiveTab,
    pendingPage,
    setPendingPage,
    pendingPerPage,
    setPendingPerPage,
    completedPage,
    setCompletedPage,
    completedPerPage,
    setCompletedPerPage,
    pendingFormNameInput,
    setPendingFormNameInput,
    pendingFormNameFilter,
    setPendingFormNameFilter,
    completedFormNameInput,
    setCompletedFormNameInput,
    completedFormNameFilter,
    setCompletedFormNameFilter,
    pendingAssignments,
    completedAssignments,
    updateAssessmentData,
    handleSubmitAssessment,
    handleViewCompleted,
    getStatistics,
  } = useManagerDashboardLogic();

  const pendingTotalPages = Math.ceil(
    pendingAssignments.length / pendingPerPage
  );
  const pagedPendingAssignments = pendingAssignments.slice(
    (pendingPage - 1) * pendingPerPage,
    pendingPage * pendingPerPage
  );

  const completedTotalPages = Math.ceil(
    completedAssignments.length / completedPerPage
  );
  const pagedCompletedAssignments = completedAssignments.slice(
    (completedPage - 1) * completedPerPage,
    completedPage * completedPerPage
  );

  if (loading) {
    return (
      <div className="manevap-container">
        <Toaster position="top-right" />
        <div className="toaster-wrapper">
          <Toaster position="top-right" />
        </div>
        <div className="manevap-loading-state">
          <div className="spinner-border"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manevap-container">
      <div className="toaster-wrapper">
        <Toaster position="top-right" />
      </div>
      <div className="hrfcper-top-bar">
        <div className="breadcrumb-wrapper">
          <Breadcrumb
            items={[
              {
                label: "Performance Management",
                path: "/manager/dashboard/performance",
              },
              { label: "Manager Form" },
            ]}
          />
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
      />

      {!loading && <StatisticsCards stats={getStatistics()} />}

      <div
        className="mgrdash-pill-toggle"
        role="tablist"
        aria-label="Assignments"
      >
        <button
          className={`mgrdash-pill-tab ${
            activeTab === "pending" ? "active" : ""
          }`}
          onClick={() => setActiveTab("pending")}
          type="button"
          aria-selected={activeTab === "pending"}
        >
          <i className="bi bi-hourglass-split"></i>
          Pending{" "}
          <span className="mgrdash-pill-count">
            {pendingAssignments.length}
          </span>
        </button>
        <button
          className={`mgrdash-pill-tab ${
            activeTab === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completed")}
          type="button"
          aria-selected={activeTab === "completed"}
        >
          <i className="bi bi-check-circle"></i>
          Completed{" "}
          <span className="mgrdash-pill-count">
            {completedAssignments.length}
          </span>
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={pendingFormNameInput}
                  onChange={(e) => setPendingFormNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      setPendingFormNameFilter(pendingFormNameInput);
                    }
                  }}
                  className="manevap-filter-input"
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() => setPendingFormNameFilter(pendingFormNameInput)}
                  type="button"
                >
                  <i className="bi bi-search"></i> Search
                </button>
              </div>
              <button
                onClick={() => {
                  setPendingFormNameInput("");
                  setPendingFormNameFilter("");
                }}
                className="manevap-clear-btn"
                disabled={!pendingFormNameFilter}
                style={{
                  opacity: pendingFormNameFilter ? 1 : 0.6,
                  cursor: pendingFormNameFilter ? "pointer" : "not-allowed",
                }}
              >
                <i className="bi bi-x-circle"></i> Clear
              </button>
            </div>
          </div>
          {pendingAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <div className="manevap-empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3>
                {pendingFormNameFilter
                  ? "No Matching Assessments"
                  : "No Pending Assessments"}
              </h3>
              <p>
                {pendingFormNameFilter
                  ? "Try adjusting your filters"
                  : "All assessments have been completed!"}
              </p>
            </div>
          ) : (
            <AssessmentsTable
              data={pagedPendingAssignments}
              isCompleted={false}
              currentPage={pendingPage}
              totalPages={pendingTotalPages}
              perPage={pendingPerPage}
              totalItems={pendingAssignments.length}
              onPageChange={(page) => setPendingPage(page)}
              setPerPage={setPendingPerPage}
              setPage={setPendingPage}
              setCurrentAssignment={setCurrentAssignment}
              setModalMode={setModalMode}
              setAssessmentData={setAssessmentData}
              setShowModal={setShowModal}
              handleViewCompleted={handleViewCompleted}
            />
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div className="manevap-card">
          <div className="manevap-filter-section">
            <div className="manevap-filter-group">
              <div className="unified-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by form name..."
                  value={completedFormNameInput}
                  onChange={(e) => setCompletedFormNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      setCompletedFormNameFilter(completedFormNameInput);
                    }
                  }}
                  className="manevap-filter-input"
                />
                <button
                  className="manevap-btn-primary"
                  onClick={() =>
                    setCompletedFormNameFilter(completedFormNameInput)
                  }
                  type="button"
                >
                  <i className="bi bi-search"></i> Search
                </button>
              </div>
              <button
                onClick={() => {
                  setCompletedFormNameInput("");
                  setCompletedFormNameFilter("");
                }}
                className="manevap-clear-btn"
                disabled={!completedFormNameFilter}
                style={{
                  opacity: completedFormNameFilter ? 1 : 0.6,
                  cursor: completedFormNameFilter ? "pointer" : "not-allowed",
                }}
              >
                <i className="bi bi-x-circle"></i> Clear
              </button>
            </div>
          </div>
          {completedAssignments.length === 0 ? (
            <div className="manevap-empty-state">
              <div className="manevap-empty-icon">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <h3>
                {completedFormNameFilter
                  ? "No Matching Assessments"
                  : "No Completed Assessments"}
              </h3>
              <p>
                {completedFormNameFilter
                  ? "Try adjusting your filters"
                  : "Complete your pending assessments to see them here."}
              </p>
            </div>
          ) : (
            <AssessmentsTable
              data={pagedCompletedAssignments}
              isCompleted={true}
              currentPage={completedPage}
              totalPages={completedTotalPages}
              perPage={completedPerPage}
              totalItems={completedAssignments.length}
              onPageChange={(page) => setCompletedPage(page)}
              setPerPage={setCompletedPerPage}
              setPage={setCompletedPage}
              setCurrentAssignment={setCurrentAssignment}
              setModalMode={setModalMode}
              setAssessmentData={setAssessmentData}
              setShowModal={setShowModal}
              handleViewCompleted={handleViewCompleted}
            />
          )}
        </div>
      )}

      {showModal && currentAssignment && (
        <AssessmentModal
          showModal={showModal}
          setShowModal={setShowModal}
          modalMode={modalMode}
          currentAssignment={currentAssignment}
          assessmentData={assessmentData}
          submitting={submitting}
          updateAssessmentData={updateAssessmentData}
          handleSubmitAssessment={handleSubmitAssessment}
        />
      )}
    </div>
  );
}
