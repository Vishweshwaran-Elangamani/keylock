import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../../styles/performancemanagement/manager/ManagerAcknowledgement.css";
 
const ManagerAcknowledgmentModal = ({ ackList, error, loading }) => {
  const navigate = useNavigate();
 
  return (
    <div className="manageracknowledgment-fullpage">
      {/* Breadcrumb */}
      <nav className="cg-breadcrumbs" aria-label="breadcrumb">
        <ol className="cg-breadcrumb">
          <li
            className="cg-breadcrumb-item"
            onClick={() => navigate("/hr/dashboard")}
          >
            <i className="bi bi-house-door"></i>
          </li>
          <li
            className="cg-breadcrumb-item"
            onClick={() => navigate("/hr/dashboard/performance")}
          >
            Performance
          </li>
          <li className="cg-breadcrumb-item active" aria-current="page">
            Employee Acknowledgments
          </li>
        </ol>
      </nav>
 
      <h2 className="manageracknowledgment-title">Employee Acknowledgments</h2>
 
      {loading ? (
        <div className="manageracknowledgment-loading">Loading...</div>
      ) : error ? (
        <div className="manageracknowledgment-error">{error}</div>
      ) : ackList.length === 0 ? (
        <div className="manageracknowledgment-empty">No employee acknowledgments found.</div>
      ) : (
        <>
          <table className="manageracknowledgment-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee Comment</th>
                <th>Date Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {ackList.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.employeeName}</td>
                  <td>{row.employeeComments}</td>
                  <td>
                    {row.acknowledgedAt
                      ? new Date(row.acknowledgedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
 
          {/* Pagination */}
          <div className="manageracknowledgment-pagination-container">
            <div className="manageracknowledgment-pagination-info">
              <span className="manageracknowledgment-pagination-label">Show</span>
              <select className="manageracknowledgment-pagination-select">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="manageracknowledgment-pagination-label">entries</span>
            </div>
            <div className="manageracknowledgment-pagination-status">
              Showing 1 to {ackList.length} of {ackList.length} entries
            </div>
            <nav className="manageracknowledgment-pagination-nav">
              <ul className="manageracknowledgment-pagination">
                <li className="manageracknowledgment-page-item disabled">
                  <button className="manageracknowledgment-page-link">
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li className="manageracknowledgment-page-item active">
                  <button className="manageracknowledgment-page-link">1</button>
                </li>
                <li className="manageracknowledgment-page-item disabled">
                  <button className="manageracknowledgment-page-link">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};
 
export default ManagerAcknowledgmentModal;
 
 