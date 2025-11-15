import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import periodAllocationService from "../../../../services/hr_operations/hr/periodAllocationService";
import CreatePeriodAllocationModal from "../modals/CreatePeriodAllocationModal";
import UpdatePeriodAllocationModal from "../modals/UpdatePeriodAllocationModal";
import AllocateFromPeriodModal from "../modals/AllocateFromPeriodModal";
import ViewPeriodDetailsModal from "../modals/ViewPeriodDetailsModal";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import "../../../../styles/hr_operations/hr/periodAllocation.css";

// ========== DELETE CONFIRMATION MODAL COMPONENT ==========
const DeleteConfirmModal = ({ show, onConfirm, onCancel, period, loading }) => {
  if (!show || !period) return null;

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static" className="period-modal">
      <div className="pa-modal-header-gradient bg-danger">
        <Modal.Title className="modal-title-custom">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Confirm Deletion
        </Modal.Title>
        <button 
          type="button" 
          className="btn-close btn-close-white" 
          onClick={onCancel}
          disabled={loading}
        ></button>
      </div>
      <Modal.Body className="modal-body-custom">
        <div className="alert alert-warning-custom mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Warning: This action cannot be undone!</strong>
            <p className="mb-0 mt-2">
              Are you sure you want to delete this period allocation? 
              {period.subAllocationCount > 0 && (
                <span className="text-danger fw-bold">
                  {" "}This will also delete {period.subAllocationCount} sub-allocation(s).
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="delete-period-info">
          <div className="text-center py-3">
            <div className="delete-period-badge">
              {period.period} {period.periodYear}
            </div>
            <div className="delete-period-details">
              <div className="detail-row">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{period.departmentName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Allocated Amount:</span>
                <span className="detail-value text-primary">{formatCurrency(period.allocatedAmount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Utilized:</span>
                <span className="detail-value text-danger">{formatCurrency(period.utilizedAmount || 0)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sub-Allocations:</span>
                <span className="detail-value">{period.subAllocationCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions-custom">
          <button 
            type="button" 
            className="btn btn-secondary-custom" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Yes, Delete Period
              </>
            )}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

// ========== MAIN COMPONENT ==========
const PeriodAllocationManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [periodAllocations, setPeriodAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [showUpdatePeriodModal, setShowUpdatePeriodModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBudgets();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
    }
  }, [selectedBudget]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAllocationService.getAllDepartmentBudgets();

      if (response.success) {
        const yearFiltered = response.data.filter(
          (b) => b.fiscalYear === selectedYear
        );
        setBudgets(yearFiltered);

        // Auto-select first budget
        if (yearFiltered.length > 0 && !selectedBudget) {
          setSelectedBudget(yearFiltered[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(err.message || "Failed to load budgets");
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodAllocations = async (budgetId) => {
    try {
      const response = await periodAllocationService.getPeriodAllocationsByBudget(
        budgetId
      );

      if (response.success) {
        setPeriodAllocations(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching period allocations:", err);
      toast.error("Failed to load period allocations");
    }
  };

  const handleBudgetSelect = (budget) => {
    setSelectedBudget(budget);
  };

  const handleCreatePeriod = () => {
    if (!selectedBudget) {
      toast.error("Please select a budget first");
      return;
    }
    setShowCreatePeriodModal(true);
  };

  const handleUpdatePeriod = (period) => {
    setSelectedPeriod(period);
    setShowUpdatePeriodModal(true);
  };

  const handleAllocateFromPeriod = (period) => {
    setSelectedPeriod(period);
    setShowAllocateModal(true);
  };

  const handleViewDetails = (period) => {
    setSelectedPeriod(period);
    setShowDetailsModal(true);
  };

  // ✅ UPDATED: Show custom modal instead of window.confirm
  const handleDeletePeriod = (period) => {
    setSelectedPeriod(period);
    setShowDeleteModal(true);
  };

  // ✅ NEW: Confirm delete handler
  const confirmDelete = async () => {
    if (!selectedPeriod) return;

    setDeleteLoading(true);

    try {
      const response = await periodAllocationService.deletePeriodAllocation(
        selectedPeriod.periodAllocationId
      );

      if (response.success) {
        toast.success("Period allocation deleted successfully");
        fetchPeriodAllocations(selectedBudget.budgetId);
        fetchBudgets(); // Refresh budget totals
        setShowDeleteModal(false);
        setSelectedPeriod(null);
      } else {
        toast.error(response.message || "Failed to delete period allocation");
      }
    } catch (error) {
      console.error("Error deleting period allocation:", error);
      toast.error(error.message || "Failed to delete period allocation");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ NEW: Cancel delete handler
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedPeriod(null);
  };

  const handleSuccess = () => {
    if (selectedBudget) {
      fetchPeriodAllocations(selectedBudget.budgetId);
      fetchBudgets(); // Refresh budget totals
    }
  };

  const getBudgetStatus = (budget) => {
    const utilization = budget.utilizationPercentage || 0;
    if (utilization >= 90) return "critical";
    if (utilization >= 75) return "warning";
    if (utilization >= 50) return "good";
    return "healthy";
  };

  const getPeriodStatus = (period) => {
    const utilization = period.utilizationPercentage || 0;
    if (utilization >= 90) return "critical";
    if (utilization >= 75) return "warning";
    if (utilization >= 50) return "good";
    return "healthy";
  };

  const filteredBudgets = budgets.filter((budget) =>
    budget.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading period allocations...</p>
      </div>
    );
  }

  return (
    <div className="period-allocation-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-calendar3 me-2"></i>
            Period-Based Budget Allocation
          </h1>
          <p>Manage quarterly/periodic budget allocations for departments</p>
        </div>
        <div className="header-actions">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-filter"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleCreatePeriod}>
            <i className="bi bi-plus-circle me-2"></i>
            Create Period Allocation
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Left Sidebar: Budget List */}
        <div className="budget-list-sidebar">
          <div className="sidebar-header">
            <h3>Department Budgets</h3>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="budget-cards">
            {filteredBudgets.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
                <p className="mt-2">No budgets found for {selectedYear}</p>
              </div>
            ) : (
              filteredBudgets.map((budget) => (
                <div
                  key={budget.budgetId}
                  className={`budget-card ${
                    selectedBudget?.budgetId === budget.budgetId ? "active" : ""
                  }`}
                  onClick={() => handleBudgetSelect(budget)}
                >
                  <div className="budget-card-header">
                    <h4>{budget.departmentName}</h4>
                    <span className={`status-badge ${getBudgetStatus(budget)}`}>
                      {Math.round(budget.utilizationPercentage || 0)}%
                    </span>
                  </div>
                  <div className="budget-card-stats">
                    <div className="stat">
                      <span className="label">Total Budget</span>
                      <span className="value">
                        {formatCurrency(budget.totalBudget)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Allocated</span>
                      <span className="value">
                        {formatCurrency(budget.allocatedAmount || 0)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="label">Remaining</span>
                      <span className="value positive">
                        {formatCurrency(
                          budget.totalBudget - (budget.allocatedAmount || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Period Allocations */}
        <div className="period-allocations-main">
          {!selectedBudget ? (
            <div className="empty-state-large">
              <div className="empty-icon">📊</div>
              <h3>Select a Department Budget</h3>
              <p>Choose a department from the left to view and manage period allocations</p>
            </div>
          ) : (
            <>
              {/* Budget Summary */}
              <div className="budget-summary-header">
                <div className="summary-info">
                  <h2>{selectedBudget.departmentName}</h2>
                  <span className="fiscal-year">FY {selectedBudget.fiscalYear}</span>
                </div>
                <div className="summary-stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Budget</span>
                    <span className="stat-value">
                      {formatCurrency(selectedBudget.totalBudget)}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Allocated in Periods</span>
                    <span className="stat-value">
                      {formatCurrency(selectedBudget.allocatedAmount || 0)}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Utilized</span>
                    <span className="stat-value">
                      {formatCurrency(selectedBudget.utilizedAmount || 0)}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Utilization</span>
                    <span className="stat-value">
                      {Math.round(selectedBudget.utilizationPercentage || 0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Period Allocations Grid */}
              <div className="period-allocations-grid">
                {periodAllocations.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Period Allocations Yet</h3>
                    <p>Create period allocations to distribute the budget</p>
                    <button className="btn-primary" onClick={handleCreatePeriod}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Create First Period
                    </button>
                  </div>
                ) : (
                  periodAllocations.map((period) => (
                    <div key={period.periodAllocationId} className="period-card">
                      <div className="period-card-header">
                        <div className="period-info">
                          <h3>
                            {period.period} {period.periodYear}
                          </h3>
                          <span className={`status-badge ${getPeriodStatus(period)}`}>
                            {Math.round(period.utilizationPercentage || 0)}%
                          </span>
                        </div>
                        <div className="period-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleViewDetails(period)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleUpdatePeriod(period)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeletePeriod(period)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="period-card-body">
                        <div className="period-stats">
                          <div className="stat">
                            <span className="label">Allocated</span>
                            <span className="value">
                              {formatCurrency(period.allocatedAmount)}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="label">Utilized</span>
                            <span className="value">
                              {formatCurrency(period.utilizedAmount || 0)}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="label">Remaining</span>
                            <span className="value positive">
                              {formatCurrency(period.remainingAmount || 0)}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="label">Sub-Allocations</span>
                            <span className="value">{period.subAllocationCount || 0}</span>
                          </div>
                        </div>

                        <div className="progress-bar-container">
                          <div className="progress-bar">
                            <div
                              className={`progress-fill ${getPeriodStatus(period)}`}
                              style={{
                                width: `${period.utilizationPercentage || 0}%`,
                              }}
                            />
                          </div>
                          <span className="progress-text">
                            {Math.round(period.utilizationPercentage || 0)}% Utilized
                          </span>
                        </div>

                        {period.notes && (
                          <div className="period-notes">
                            <span className="notes-label">Notes:</span>
                            <p>{period.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="period-card-footer">
                        <button
                          className="btn-secondary"
                          onClick={() => handleAllocateFromPeriod(period)}
                          disabled={period.remainingAmount <= 0}
                        >
                          <i className="bi bi-plus-square me-2"></i>
                          Sub-Allocate (HR)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreatePeriodModal && (
        <CreatePeriodAllocationModal
          budget={selectedBudget}
          onClose={() => setShowCreatePeriodModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showUpdatePeriodModal && selectedPeriod && (
        <UpdatePeriodAllocationModal
          period={selectedPeriod}
          budget={selectedBudget}
          onClose={() => setShowUpdatePeriodModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showAllocateModal && selectedPeriod && (
        <AllocateFromPeriodModal
          period={selectedPeriod}
          budget={selectedBudget}
          onClose={() => setShowAllocateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showDetailsModal && selectedPeriod && (
        <ViewPeriodDetailsModal
          period={selectedPeriod}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* ✅ NEW: Delete Confirmation Modal */}
      {showDeleteModal && selectedPeriod && (
        <DeleteConfirmModal
          show={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          period={selectedPeriod}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default PeriodAllocationManagement;
