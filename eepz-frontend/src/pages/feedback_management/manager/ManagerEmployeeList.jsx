import React, { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

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
      console.log(" Employees loaded");
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1200px" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2
            className="fw-bold mb-1"
            style={{ color: "var(--color-primary-1)" }}
          >
            {" "}
            Team Members:
          </h2>
          <p className="mb-0 small text-muted">Employees you manage</p>
        </div>
        <Link
          to="/manager/dashboard/feedback"
          className="btn btn-outline-secondary"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex align-items-start gap-2 mb-3"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
        </div>
      )}

      <div
        className="card border-0"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="card-body">
          {employees.length === 0 ? (
            <p className="text-muted mb-0">No employees found</p>
          ) : (
            <div className="row g-3">
              {employees.map((emp) => (
                <div className="col-md-6 col-lg-4" key={emp.empId}>
                  <div
                    className="card h-100 border-0"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div className="card-body">
                      <h6 className="mb-1">
                        {emp.firstName} {emp.lastName}
                      </h6>
                      <p className="small text-muted mb-2">
                        {emp.employeeCode}
                      </p>
                      <div className="small mb-3">
                        <div>
                          <strong>Role:</strong> {emp.role}
                        </div>
                        <div>
                          <strong>Department:</strong> {emp.department}
                        </div>
                      </div>
                      <Link
                        to={`/manager/dashboard/feedback/create-review`}
                        state={{ employee: emp }}
                        className="btn btn-sm btn-primary w-100"
                      >
                        <Plus size={14} className="me-1" />
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
  );
}
