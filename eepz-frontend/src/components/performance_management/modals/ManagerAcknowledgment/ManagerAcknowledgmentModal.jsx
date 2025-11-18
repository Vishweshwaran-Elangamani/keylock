import React from "react";
// import "../../../styles/performancemanagement/manager/";  // Ensure you have the styles for modal
import "../../../../pages/performancemanagement/manager/ManagerAcknowledgment";
const ManagerAcknowledgmentModal = ({
  showModal,
  setShowModal,
  ackList,
  error,
  loading
}) => {
  if (!showModal) return null;

  return (
    <div className="manager-acknowledgment-modal-overlay" onClick={() => setShowModal(false)}>
      <div className="manager-acknowledgment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="manager-acknowledgment-modal-header">
          <h3>Employee Acknowledgments</h3>
          <button className="manager-acknowledgment-close-btn" onClick={() => setShowModal(false)}>
            ×
          </button>
        </div>

        {loading ? (
          <div className="manager-acknowledgment-loading">Loading...</div>
        ) : error ? (
          <div className="manager-acknowledgment-error">{error}</div>
        ) : ackList.length === 0 ? (
          <div className="manager-acknowledgment-empty">No employee acknowledgments found.</div>
        ) : (
          <table className="manager-acknowledgment-table">
            <thead>
              <tr>
                <th className="manager-acknowledgment-th">Employee</th>
                <th className="manager-acknowledgment-th">Employee Comment</th>
                <th className="manager-acknowledgment-th">Date Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {ackList.map((row, idx) => (
                <tr key={idx} className="manager-acknowledgment-tr">
                  <td className="manager-acknowledgment-td">{row.employeeName}</td>
                  <td className="manager-acknowledgment-td">{row.employeeComments}</td>
                  <td className="manager-acknowledgment-td">
                    {row.acknowledgedAt
                      ? new Date(row.acknowledgedAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerAcknowledgmentModal;
