import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../../common/Breadcrumb";
import "../../../../styles/performancemanagement/components/ManagerAcknowledgment.css";
 
const ManagerAcknowledgmentModal = ({ ackList = [], error, loading }) => {
  const navigate = useNavigate();
 
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(5);
  const dropdownRef = useRef(null);
 
  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setEntriesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
 
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setEntriesOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);
 
  const breadcrumbItems = [
    { label: "Performance", path: "/hr/dashboard/performance" },
    { label: "Employee Acknowledgments", path: null },
  ];
 
  return (
    <div className="manager-ack-container">
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/manager/dashboard" },
          { label: "Performance", path: "/manager/dashboard/performance" },
          { label: "Employee Acknowledgements", path: null },
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
                            day: "numeric",
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
 
              <div className="manager-ack-pagination-dropdown" ref={dropdownRef}>
                <div
                  className="manager-ack-selected"
                  tabIndex={0}
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={entriesOpen}
                  onClick={() => setEntriesOpen((p) => !p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEntriesOpen((p) => !p);
                    }
                  }}
                >
                  {selectedEntries}
                  <span className="manager-ack-arrow" />
                </div>
 
                {entriesOpen && (
                  <div className="manager-ack-menu" role="listbox">
                    {[5, 10, 15].map((val) => (
                      <div
                        key={val}
                        role="option"
                        aria-selected={selectedEntries === val}
                        className={`manager-ack-option ${
                          selectedEntries === val ? "manager-ack-option-active" : ""
                        }`}
                        onClick={() => {
                          setSelectedEntries(val);
                          setEntriesOpen(false);
 
                        }}
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              <span>entries</span>
            </div>
 
            <div className="manager-ack-pagination-status">
              Showing 1 to {ackList.length} of {ackList.length} entries
            </div>
 
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
 