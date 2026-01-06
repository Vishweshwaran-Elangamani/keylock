import React from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../common/Breadcrumb";
import "../../../../styles/performancemanagement/components/ManagerAcknowledgment.css";

const ManagerAcknowledgmentModal = ({ ackList, error, loading }) => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: "Performance", path: "/hr/dashboard/performance" },
    { label: "Employee Acknowledgments", path: null }
  ];

  return (
    <div className="manager-ack-container">
     
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/manager/dashboard" },
          { label: "Performance", path: "/manager/dashboard/performance" },
          { label: "Employee Acknowledgements", path: null }
        ]}
      />

     
      <h2 className="manager-ack-title">Employee Acknowledgments</h2>

   
      {loading ? (
        <div className="manager-ack-loading">Loading...</div>
      ) : error ? (
        <div className="manager-ack-error">{error}</div>
      ) : ackList.length === 0 ? (
        <div className="manager-ack-no-data">No employee acknowledgments found.</div>
      ) : (
        <div className="manager-ack-content">
          {/* Table Container */}
          <div className="manager-ack-table-container">
            <table className="manager-ack-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Comment</th>
                  <th>Date Acknowledged</th>
                </tr>
              </thead>
              <tbody>
                {ackList.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "" : "row-even"}>
                    <td className="cell-employee">{row.employeeName}</td>
                    <td className="cell-comment">{row.employeeComments}</td>
                    <td className="cell-date">
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
          </div>

          
          <div className="manager-ack-pagination">
          
            <div className="manager-ack-entries-selector">
              <span>Show</span>
              <select className="manager-ack-entries-select">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>

            
            <div className="manager-ack-pagination-status">
              Showing 1 to {ackList.length} of {ackList.length} entries
            </div>

            {/* Pagination Controls */}
            <nav>
              <ul className="manager-ack-pagination-nav">
                <li>
                  <button className="manager-ack-pagination-btn" disabled>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li>
                  <button className="manager-ack-pagination-btn active">1</button>
                </li>
                <li>
                  <button className="manager-ack-pagination-btn" disabled>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerAcknowledgmentModal;
