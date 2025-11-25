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
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [rolePrefix, setRolePrefix] = useState("");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  // Fetch employees when page, search, or itemsPerPage changes
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, itemsPerPage]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await lndService.getSubordinateEmployees(
        currentPage,
        searchTerm,
        itemsPerPage // Dynamic page size
      );

      if (response.data.success) {
        setEmployees(response.data.data.items);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
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
      setCurrentPage(1);
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleCancelSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowSkillsModal(true);
  };

  const handleCloseModal = () => {
    setShowSkillsModal(false);
    setSelectedEmployee(null);
  };

  // Show initial loading spinner only when no data
  if (loading && employees.length === 0) {
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
          { label: "", path: "/dashboard", icon: "house-door" },
          { label: "LnD Dashboard", path: "/lnd/dashboard", icon: "" },
          { label: "Team Skills" },
        ]}
      />

      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search employees..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyPress={handleSearchSubmit}
              style={{ minHeight: "35.7px" }}
            />
            {searchTerm ? (
              <button
                className="btn btn-outline-secondary"
                onClick={handleCancelSearch}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee List */}
      {employees.length === 0 && !loading ? (
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
          <div
            style={{
              minHeight: "65vh",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
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
                    border: "1px solid rgb(39, 35, 92, 0.5)",
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
                    e.currentTarget.style.borderColor = "rgb(39, 35, 92, 0.5)";
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
                          backgroundColor: "rgb(39, 35, 92)",
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

          {/* Updated Pagination with new props */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[6, 12, 24, 48]}
          />
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
