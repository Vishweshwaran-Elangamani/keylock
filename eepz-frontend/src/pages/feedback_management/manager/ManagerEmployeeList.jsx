import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import "../../../styles/feedback/components/ManagerEmployeeList.css";

const MOCK_EMPLOYEES = [
  {
    empId: 1004,
    firstName: "Dave",
    lastName: "Dev",
    employeeCode: "EMP-1004",
    role: "Employee",
    department: "Engineering",
  },
  {
    empId: 1005,
    firstName: "Frank",
    lastName: "Frontend",
    employeeCode: "EMP-1005",
    role: "Employee",
    department: "Engineering",
  },
  {
    empId: 1006,
    firstName: "Jane",
    lastName: "Design",
    employeeCode: "EMP-1006",
    role: "Employee",
    department: "Design",
  },
  {
    empId: 1003,
    firstName: "Carol",
    lastName: "Code",
    employeeCode: "EMP-1003",
    role: "Employee",
    department: "Engineering",
  },
];

export default function ManagerEmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    try {
      setEmployees(MOCK_EMPLOYEES);
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mrev-page">
      <div className="mrev-container">
        <div className="mrev-header">
          <div className="mrev-header-left">
            <h2 className="mrev-title">Team Members:</h2>
            <p className="mrev-subtitle">Employees you manage</p>
          </div>
          <Link to="/manager/dashboard/feedback" className="mrev-btn mrev-btn-outline">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mrev-alert mrev-alert-error">
            <AlertTriangle size={18} className="mrev-alert-icon" />
            <div>
              <strong>Error</strong>
              <p className="mrev-alert-text">{error}</p>
            </div>
          </div>
        )}

        <div className="mrev-card">
          <div className="mrev-card-body">
            {employees.length === 0 ? (
              <p className="mrev-empty-text">No employees found</p>
            ) : (
              <div className="mrev-employees-grid">
                {employees.map((emp) => (
                  <div className="mrev-employee-col" key={emp.empId}>
                    <div className="mrev-employee-card">
                      <div className="mrev-employee-card-body">
                        <h6 className="mrev-employee-name">
                          {emp.firstName} {emp.lastName}
                        </h6>
                        <p className="mrev-employee-code">{emp.employeeCode}</p>
                        <div className="mrev-employee-details">
                          <div className="mrev-detail-row">
                            <strong>Role:</strong> {emp.role}
                          </div>
                          <div className="mrev-detail-row">
                            <strong>Department:</strong> {emp.department}
                          </div>
                        </div>
                        <Link
                          to={`/manager/dashboard/feedback/create-review`}
                          state={{ employee: emp }}
                          className="mrev-btn mrev-btn-primary mrev-btn-full"
                        >
                          <Plus size={14} className="mrev-btn-icon-left" />
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
