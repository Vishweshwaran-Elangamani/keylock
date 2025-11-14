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


  // Get Department Head's department ID from localStorage
  const userDepartmentId = parseInt(localStorage.getItem("departmentId"));
  const userDepartmentName = localStorage.getItem("departmentName");
  const userName = `${localStorage.getItem("firstName")} ${localStorage.getItem(
    "lastName"
  )}`;


  useEffect(() => {
    console.log("Department Head logged in:");
    console.log("- Department ID:", userDepartmentId);
    console.log("- Department Name:", userDepartmentName);


    if (!userDepartmentId) {
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
      console.log("Fetching all department budgets...");
      const response = await budgetAllocationService.getAllDepartmentBudgets();
      console.log("All budgets:", response.data);


      // Filter to show only Department Head's department
      const departmentBudgets =
        response.data?.filter((b) => b.departmentId === userDepartmentId) || [];


      console.log(
        "Filtered budgets for department",
        userDepartmentId,
        ":",
        departmentBudgets
      );
      setBudgets(departmentBudgets);


      if (departmentBudgets.length === 0) {
        setError(
          `No budget allocated for ${userDepartmentName} department yet.`
        );
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(err.message || "Failed to fetch budgets");
      showToast("Error", err.message || "Failed to fetch budgets", "danger");
    } finally {
      setLoading(false);
    }
  };


  const handleShowAllocations = async (budget) => {
    console.log("Viewing allocations for budget:", budget.budgetId);


    try {
      setLoading(true);


      //  FETCH ALLOCATIONS FROM BACKEND
      console.log("Fetching allocations from backend...");
      const response =
        await budgetAllocationService.getBudgetAllocationsByBudget(
          budget.budgetId
        );


      console.log("Backend response:", response);


      // Handle response structure - check both data and data.data
      let budgetAllocations = [];
      if (response.data) {
        budgetAllocations = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
      }


      console.log("Fetched allocations:", budgetAllocations);


      setSelectedBudgetForAllocations({
        ...budget,
        allocations: budgetAllocations,
      });


      setLoading(false);
    } catch (err) {
      console.error("Error fetching allocations:", err);
      showToast("Error", "Failed to fetch allocations", "danger");
      setLoading(false);
    }
  };


  const handleBackToList = () => {
    console.log("Back to budget list");
    setSelectedBudgetForAllocations(null);
    fetchBudgets(); // Refresh data
  };


  const showToast = (title, message, type) => {
    const fullMessage = `${title}: ${message}`;
    
    switch (type) {
      case "success":
        toast.success(fullMessage);
        break;
      case "danger":
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast.warning(fullMessage);
        break;
      case "info":
        toast.info(fullMessage);
        break;
      default:
        toast(fullMessage);
    }
  };


  const getUtilizationColor = (percentage) => {
    if (!percentage) return "#cbd5e1";
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    if (percentage >= 50) return "#10b981";
    return "#3b82f6";
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
        <div className="alert alert-danger budget-alert" role="alert">
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
              <i className="bi bi-inbox"></i>
              <p>No budget allocated for {userDepartmentName} department</p>
              <small>Contact HR or Leadership to allocate budget</small>
            </div>
          ) : (
            <div className="budget-table-container">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Fiscal Year</th>
                    <th>Allocated Budget</th>
                    <th>Utilized</th>
                    <th>Utilization %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr key={budget.budgetId}>
                      <td>
                        <strong>{budget.departmentName}</strong>
                      </td>
                      <td>{budget.fiscalYear}</td>
                      <td>{formatCurrency(budget.allocatedAmount)}</td>
                      <td style={{ color: "#ef4444", fontWeight: "600" }}>
                        {formatCurrency(budget.utilizedAmount || 0)}
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
                            {budget.utilizationPercentage || 0}%
                          </span>
                        </div>
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
                  ))}
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
            showToast("Success", "Utilization updated successfully", "success");
          }}
        />
      )}
    </div>
  );
};


export default DepartmentHeadBudgetView;
