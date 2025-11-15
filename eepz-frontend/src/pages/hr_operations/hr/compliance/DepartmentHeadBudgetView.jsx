import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import budgetAllocationService from "../../../../services/hr_operations/hr/budgetAllocationService";
import AllocationsList from "../modals/AllocationsList";
import "../../../../styles/hr_operations/hr/budgetAllocation.css";
import "../../../../styles/hr_operations/hr/allocationsList.css";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";

const DepartmentHeadBudgetView = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBudgetForAllocations, setSelectedBudgetForAllocations] =
    useState(null);

  // ✅ UPDATED: Use department name instead of ID
  const userDepartmentName = localStorage.getItem("departmentName");
  const userName = `${localStorage.getItem("firstName")} ${localStorage.getItem(
    "lastName"
  )}`;

  useEffect(() => {
    console.log("🏢 Department Head logged in:");
    console.log("   - Department Name:", userDepartmentName);
    console.log("   - User Name:", userName);

    if (!userDepartmentName) {
      setError("Department information not found. Please log in again.");
      setLoading(false);
      return;
    }

    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("📊 Fetching all department budgets...");
      const response = await budgetAllocationService.getAllDepartmentBudgets();
      
      console.log("📋 All budgets from backend:", response.data);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch budgets");
      }

      // ✅ UPDATED: Filter by department name instead of ID
      const departmentBudgets = response.data.filter((budget) => {
        console.log(`   Checking budget: DeptName="${budget.departmentName}"`);
        
        // Case-insensitive comparison and trim whitespace
        return budget.departmentName?.trim().toLowerCase() === 
               userDepartmentName?.trim().toLowerCase();
      });

      console.log(
        `✅ Filtered budgets for department "${userDepartmentName}":`,
        departmentBudgets
      );

      setBudgets(departmentBudgets);

      // ✅ IMPROVED: Better error handling
      if (departmentBudgets.length === 0) {
        console.warn(`⚠️ No budget found for department "${userDepartmentName}"`);
        
        // Show available departments for debugging
        const availableDepts = response.data.map(b => b.departmentName);
        console.log("📌 Available departments:", availableDepts);
        
        setError(
          `No budget allocated for ${userDepartmentName} department yet. Contact HR or Leadership to create a budget.`
        );
      }
    } catch (err) {
      console.error("❌ Error fetching budgets:", err);
      setError(err.message || "Failed to fetch budgets");
      toast.error(err.message || "Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllocations = async (budget) => {
    console.log("👁️ Viewing allocations for budget:", budget.budgetId);

    try {
      setLoading(true);

      console.log("📥 Fetching allocations from backend...");
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );

      console.log("📦 Backend response:", response);

      let budgetAllocations = [];
      if (response && response.success) {
        budgetAllocations = response.data || [];
      } else if (response && response.data) {
        budgetAllocations = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
      }

      console.log("✅ Fetched allocations:", budgetAllocations);

      setSelectedBudgetForAllocations({
        ...budget,
        allocations: budgetAllocations,
      });

      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching allocations:", err);
      toast.error("Failed to fetch allocations");
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    console.log("🔙 Back to budget list");
    setSelectedBudgetForAllocations(null);
    fetchBudgets();
  };

  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
  };

  const getUtilizationStatus = (percentage) => {
    if (!percentage) return { text: "No Usage", color: "#94a3b8" };
    if (percentage >= 90) return { text: "Critical", color: "#ef4444" };
    if (percentage >= 75) return { text: "High", color: "#f59e0b" };
    if (percentage >= 50) return { text: "Medium", color: "#10b981" };
    return { text: "Low", color: "#3b82f6" };
  };

  return (
    <div className="budget-root">
      {!selectedBudgetForAllocations && (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ color: "#27235c", marginBottom: "0.5rem" }}>
              Budget Utilization - {userDepartmentName}
            </h2>
            <p style={{ color: "#6c757d", fontSize: "0.95rem" }}>
              View and update budget utilization for your department
            </p>
          </div>
        </>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {!selectedBudgetForAllocations ? (
        <>
          {loading ? (
            <div className="budget-loading-container">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading budget data...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="budget-alert-empty">
              <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
              <h4 style={{ marginTop: "16px", color: "#64748b" }}>No Budget Allocated</h4>
              <p style={{ color: "#94a3b8" }}>
                No budget has been allocated for <strong>{userDepartmentName}</strong> department yet.
              </p>
              <small style={{ color: "#cbd5e1" }}>
                Contact HR or Leadership to allocate budget for your department.
              </small>
            </div>
          ) : (
            <div className="budget-table-container">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Fiscal Year</th>
                    <th>Total Budget</th>
                    <th>Allocated</th>
                    <th>Utilized</th>
                    <th>Remaining</th>
                    <th>Utilization %</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const remaining = (budget.allocatedAmount || 0) - (budget.utilizedAmount || 0);
                    const status = getUtilizationStatus(budget.utilizationPercentage);
                    
                    return (
                      <tr key={budget.budgetId}>
                        <td>
                          <strong>{budget.departmentName}</strong>
                        </td>
                        <td>{budget.fiscalYear}</td>
                        <td>{formatCurrency(budget.totalBudget)}</td>
                        <td style={{ color: "#3b82f6", fontWeight: "600" }}>
                          {formatCurrency(budget.allocatedAmount || 0)}
                        </td>
                        <td style={{ color: "#ef4444", fontWeight: "600" }}>
                          {formatCurrency(budget.utilizedAmount || 0)}
                        </td>
                        <td style={{ color: "#10b981", fontWeight: "600" }}>
                          {formatCurrency(remaining)}
                        </td>
                        <td>
                          <div className="budget-progress-container">
                            <div
                              className="budget-progress-bar"
                              style={{
                                width: `${budget.utilizationPercentage || 0}%`,
                                backgroundColor: getUtilizationColor(
                                  budget.utilizationPercentage
                                ),
                              }}
                            ></div>
                            <span className="budget-progress-text">
                              {Math.round(budget.utilizationPercentage || 0)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: status.color,
                              color: "white",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <button
                            className="budget-btn-edit"
                            onClick={() => handleShowAllocations(budget)}
                            title="View & Update Allocations"
                            style={{ background: "#8b5cf6", color: "#ffffff" }}
                          >
                            <i className="bi bi-eye"></i> View & Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <AllocationsList
          budget={selectedBudgetForAllocations}
          allocations={selectedBudgetForAllocations.allocations || []}
          onBack={handleBackToList}
          onUtilizationUpdated={(updatedAllocations) => {
            fetchBudgets();
            setSelectedBudgetForAllocations(null);
            toast.success("Utilization updated successfully");
          }}
        />
      )}
    </div>
  );
};

export default DepartmentHeadBudgetView;
