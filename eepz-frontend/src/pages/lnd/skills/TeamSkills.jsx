import { useState, useEffect } from "react";
import { Users, ChevronRight, Search, X } from "lucide-react";
import Breadcrumb from "../../../components/lnd/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import EmployeeSkillsModal from "../../../components/lnd/modals/EmployeeSkillsModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";

const TeamSkills = () => {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [rolePrefix, setRolePrefix] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const roleName = user?.role || "";
    setRolePrefix(getRolePrefix(roleName));
  }, []);

  const getRolePrefix = (role) => {
    const prefixMap = {
      Manager: "/manager",
      "Department Head": "/department-head",
      Leadership: "/leadership",
      Employee: "/employee",
      HR: "/hr",
      Admin: "/admin",
    };
    return prefixMap[role] || "/employee";
  };

  // Fetch employees when page or search changes
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await lndService.getSubordinateEmployees(
        currentPage,
        searchTerm,
        12 // Page size
      );

      if (response.data.success) {
        setEmployees(response.data.data.items);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage,
        });
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on new search
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowSkillsModal(true);
  };

  const handleCloseModal = () => {
    setShowSkillsModal(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Learning & Development",
            path: `${rolePrefix}/lnd/dashboard`,
          },
          { label: "Team Skills" },
        ]}
      />

      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            placeholder="Search employees... (Press Enter)"
            style={{
              width: "100%",
              padding: "0.625rem 2.5rem 0.625rem 2.5rem",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "0.875rem",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#97247E";
              e.target.style.boxShadow = "0 0 0 3px rgba(151, 36, 126, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                color: "#6c757d",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#212529")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6c757d")}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Employee List */}
      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Employees Found"
          message={
            searchTerm
              ? "No employees match your search criteria."
              : "No subordinate employees found."
          }
        />
      ) : (
        <>
          <div style={{ minHeight: "65vh" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {employees.map((employee) => (
                <div
                  key={employee.employeeId}
                  onClick={() => handleEmployeeClick(employee)}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "#97247E";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        textAlign: "left",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "1.125rem",
                        }}
                      >
                        {employee.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h5
                          style={{
                            margin: 0,
                            fontWeight: "600",
                            color: "#212529",
                            fontSize: "1rem",
                          }}
                        >
                          {employee.employeeName}
                        </h5>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            color: "#6c757d",
                          }}
                        >
                          {employee.email}
                        </p>
                      </div>
                    </div>
                    {employee.departmentName && (
                      <div
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.75rem",
                          background: "#f3f4f6",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          color: "#4b5563",
                          fontWeight: "500",
                          marginTop: "0.5rem",
                        }}
                      >
                        {employee.departmentName}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={20} color="#97247E" />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Employee Skills Modal */}
      {showSkillsModal && selectedEmployee && (
        <EmployeeSkillsModal
          employee={selectedEmployee}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default TeamSkills;
