import React, { useState } from "react";
import { formatCurrency } from "../../../../utils/auth/currencyFormatter";
import UpdateUtilizationModal from "./UpdateUtilizationModal";
import "../../../../styles/hr_operations/hr/allocationsList.css";

const AllocationsList = ({
  budget,
  allocations = [],
  onBack,
  onUtilizationUpdated,
}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  //  GET USER ROLE FROM LOCALSTORAGE
  const userRole = localStorage.getItem("userRole");
  const isDeptHead = userRole === "Department Head";

  const getTypeColor = (type) => {
    const colors = {
      Promotion: { bg: "#fce7f3", color: "#be185d" },
      Training: { bg: "#e0e7ff", color: "#4338ca" },
      Bonus: { bg: "#dcfce7", color: "#166534" },
      Other: { bg: "#f3e8ff", color: "#7c3aed" },
    };
    return colors[type] || colors.Other;
  };

  const handleUtilizationUpdate = (updatedAllocation) => {
    const updatedAllocations = allocations.map((a) =>
      a.allocationId === updatedAllocation.allocationId ? updatedAllocation : a
    );

    if (onUtilizationUpdated) {
      onUtilizationUpdated(updatedAllocations);
    }

    setShowUpdateModal(false);
    setSelectedAllocation(null);
  };

  return (
    <div className="allocations-list-container">
      <div className="allocations-header">
        <h6 className="allocations-title">
          <i className="bi bi-diagram-3"></i>
          Allocations for {budget?.departmentName}
        </h6>
        <button className="btn-back" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> Back to Budgets
        </button>
      </div>

      {allocations.length === 0 ? (
        <div className="allocations-empty">
          <i className="bi bi-inbox"></i>
          <p>No allocations created yet</p>
          <small>Click "Allocate" button to create new allocations</small>
        </div>
      ) : (
        <>
          <div className="allocations-table-wrapper">
            <table className="allocations-table">
              <thead>
                <tr>
                  <th>Allocation Name</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Utilized</th>
                  <th>Utilized %</th>
                  {isDeptHead && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => {
                  const typeColor = getTypeColor(alloc.allocationType);
                  const utilizedAmount = alloc.utilizedAmount || 0;

                  return (
                    <tr key={alloc.allocationId}>
                      <td>
                        <strong>
                          {alloc.notes ||
                            alloc.allocationType ||
                            "Unnamed Allocation"}
                        </strong>
                      </td>
                      <td>
                        <span
                          className="allocation-type-badge"
                          style={{
                            backgroundColor: typeColor.bg,
                            color: typeColor.color,
                          }}
                        >
                          {alloc.allocationType}
                        </span>
                      </td>
                      <td>{formatCurrency(alloc.amount)}</td>
                      <td>
                        <span style={{ color: "#ef4444", fontWeight: "600" }}>
                          {formatCurrency(utilizedAmount)}
                        </span>
                      </td>
                      <td>
                        <div className="allocation-progress">
                          <div
                            className="allocation-progress-bar"
                            style={{
                              width: `${alloc.utilizationPercentage || 0}%`,
                              backgroundColor:
                                alloc.utilizationPercentage >= 90
                                  ? "#ef4444"
                                  : alloc.utilizationPercentage >= 75
                                  ? "#f59e0b"
                                  : alloc.utilizationPercentage >= 50
                                  ? "#10b981"
                                  : "#3b82f6",
                            }}
                          ></div>
                          <span className="allocation-progress-text">
                            {alloc.utilizationPercentage || 0}%
                          </span>
                        </div>
                      </td>
                      {/*  SHOW UPDATE BUTTON ONLY FOR DEPARTMENT HEAD */}
                      {isDeptHead && (
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedAllocation(alloc);
                              setShowUpdateModal(true);
                            }}
                            style={{
                              padding: "4px 12px",
                              fontSize: "0.85rem",
                              background: "#3b82f6",
                              border: "none",
                              borderRadius: "4px",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                            title="Update Utilization"
                          >
                            <i className="bi bi-pencil"></i> Update
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="allocations-summary">
            <div className="summary-item">
              <label>Total Allocations:</label>
              <span>
                {formatCurrency(
                  allocations.reduce((sum, a) => sum + (a.amount || 0), 0)
                )}
              </span>
            </div>
            <div className="summary-item">
              <label>Total Utilized:</label>
              <span style={{ color: "#ef4444" }}>
                {formatCurrency(
                  allocations.reduce(
                    (sum, a) => sum + (a.utilizedAmount || 0),
                    0
                  )
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {showUpdateModal && selectedAllocation && (
        <UpdateUtilizationModal
          show={showUpdateModal}
          allocation={selectedAllocation}
          onHide={() => {
            setShowUpdateModal(false);
            setSelectedAllocation(null);
          }}
          onUtilizationUpdated={handleUtilizationUpdate}
        />
      )}
    </div>
  );
};

export default AllocationsList;
