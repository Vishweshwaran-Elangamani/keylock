import React, { useState, useEffect } from "react";
import careerProgressionService from "../../services/hr_operations/hr/careerProgressionService";
import { Spinner, Alert } from "react-bootstrap";
import "../../../styles/hr_operations/hr/LeadershipApproval.css";

const LeadershipApproval = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("card"); // "card" or "table"

  useEffect(() => {
    fetchSubmittedPromotions();
  }, []);

  const fetchSubmittedPromotions = async () => {
    try {
      setLoading(true);

      const response =
        await careerProgressionService.getSubmittedToLeadership();

      setPromotions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error:", error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "Not Set";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="leadership-approval-root">
      <div className="leadership-header">
        <div className="leadership-header-left">
          <h4 className="leadership-title">
            <i className="bi bi-eye"></i>
            Leadership Promotion Review
          </h4>
          <p className="leadership-subtitle">
            View promotions submitted by HR (Payroll already updated)
          </p>
        </div>
        <div className="leadership-view-toggle">
          <button
            className={`toggle-btn ${viewType === "card" ? "active" : ""}`}
            onClick={() => setViewType("card")}
            title="Card View"
          >
            <i className="bi bi-grid-3x2-gap"></i>
          </button>
          <button
            className={`toggle-btn ${viewType === "table" ? "active" : ""}`}
            onClick={() => setViewType("table")}
            title="Table View"
          >
            <i className="bi bi-list-ul"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="leadership-loading-container">
          <Spinner animation="border" variant="primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading promotions...</p>
        </div>
      ) : promotions.length === 0 ? (
        <Alert variant="info" className="leadership-alert">
          <i className="bi bi-info-circle me-2"></i>
          No promotions submitted to leadership yet. HR needs to update payroll
          and submit.
        </Alert>
      ) : viewType === "card" ? (
        // CARD VIEW
        <div className="leadership-cards-grid">
          {promotions.map((p) => (
            <div key={p.promotionId} className="leadership-card">
              <div className="card-header">
                <div className="card-avatar">
                  {getInitials(p.employeeFullName || p.employeeEmail)}
                </div>
                <div className="card-header-info">
                  <h5 className="card-employee-name">
                    {p.employeeFullName || p.employeeEmail || "Unknown"}
                  </h5>
                  <p className="card-email">{p.employeeEmail || "N/A"}</p>
                </div>
              </div>

              <div className="card-body">
                <div className="card-row">
                  <span className="card-label">Department:</span>
                  <span className="card-value">
                    {p.departmentName || "N/A"}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">Current Role:</span>
                  <span className="card-value">{p.oldRole || "N/A"}</span>
                </div>

                <div className="card-row">
                  <span className="card-label">Promoted To:</span>
                  <span className="card-value promo-new-role">
                    {p.newRole || "N/A"}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">Current Salary:</span>
                  <span className="card-value">
                    {formatCurrency(p.oldSalary)}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">New Salary:</span>
                  <span className="card-value promo-new-salary">
                    {formatCurrency(p.newSalary)}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">Increment:</span>
                  <span className="card-value increment-badge">
                    {p.incrementPercentage
                      ? `+${p.incrementPercentage.toFixed(2)}%`
                      : "N/A"}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">Effective Date:</span>
                  <span className="card-value">
                    {formatDate(p.promotionDate)}
                  </span>
                </div>

                <div className="card-row">
                  <span className="card-label">Status:</span>
                  <span className="leadership-status-badge leadership-status-approved">
                    {p.status || "Approved"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // TABLE VIEW
        <div className="leadership-table-container">
          <table className="leadership-table table-hover">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Current Role</th>
                <th>New Role</th>
                <th>Old Salary</th>
                <th>New Salary</th>
                <th>Increment %</th>
                <th>Effective Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.promotionId}>
                  <td>
                    <div className="leadership-employee-info">
                      <div className="employee-avatar">
                        {getInitials(p.employeeFullName || p.employeeEmail)}
                      </div>
                      <div>
                        <strong>
                          {p.employeeFullName || p.employeeEmail || "Unknown"}
                        </strong>
                        <small>{p.employeeEmail || "N/A"}</small>
                      </div>
                    </div>
                  </td>

                  <td>{p.departmentName || "N/A"}</td>

                  <td>{p.oldRole || "N/A"}</td>

                  <td>
                    <strong style={{ color: "#10b981" }}>
                      {p.newRole || "N/A"}
                    </strong>
                  </td>

                  <td>{formatCurrency(p.oldSalary)}</td>

                  <td>
                    <strong className="leadership-new-salary">
                      {formatCurrency(p.newSalary)}
                    </strong>
                  </td>

                  <td className="leadership-text-center">
                    {p.incrementPercentage ? (
                      <span className="leadership-increment-badge">
                        +{p.incrementPercentage.toFixed(2)}%
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>

                  <td>{formatDate(p.promotionDate)}</td>

                  <td className="leadership-text-center">
                    <span className="leadership-status-badge leadership-status-approved">
                      {p.status || "Approved"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadershipApproval;
