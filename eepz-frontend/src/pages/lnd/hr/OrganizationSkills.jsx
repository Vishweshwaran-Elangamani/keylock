import { useState, useEffect } from "react";
import { Users, ChevronRight } from "lucide-react";
import Breadcrumb from "../../../components/common/Breadcrumb";
import Pagination from "../../../components/lnd/common/Pagination";
import EmptyState from "../../../components/lnd/common/EmptyState";
import EmployeeSkillsModal from "../../../components/lnd/modals/EmployeeSkillsModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import styles from "../../../styles/lnd/pages/hr/OrganizationSkills.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";
const OrganizationSkills = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, itemsPerPage, searchTerm]);
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await lndService.getAllOrganizationEmployees({
        pageNumber: currentPage,
        searchTerm: searchTerm,
        pageSize: itemsPerPage,
      });

      if (response.data.success) {
        let employeesData = response.data.data.items;

        if (!searchTerm) {
          employeesData = employeesData.filter(
            (emp) => emp.departmentName !== "Administration"
          );
        }

        setEmployees(employeesData);
        setTotalItems(response.data.data.totalCount);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      toast.error(LND_TOASTS.FAILED_TO_LOAD_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
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
  // Helper to generate initials
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };
  if (loading && employees.length === 0) {
    return (
      <div className={styles.loadingContainer}>
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
          { label: "LnD Dashboard", path: "/hr/lnd/dashboard", icon: "" },
          { label: "Organizational Skills" },
        ]}
      />
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <div className="input-group">
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Search employees..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
            />
            {searchTerm ? (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancelSearch}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSearchSubmit}
              >
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
              : "No employees found in the organization."
          }
        />
      ) : (
        <>
          <div
            className={`${styles.contentContainer} ${
              loading ? styles.contentContainerLoading : ""
            }`}
          >
            <div className={styles.employeeGrid}>
              {employees.map((employee) => (
                <div
                  key={employee.employeeId}
                  onClick={() => handleEmployeeClick(employee)}
                  className={styles.employeeCard}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.headerInfo}>
                      <div className={styles.avatar}>
                        {getInitials(employee.employeeName)}
                      </div>
                      <div>
                        <h5 className={styles.employeeName}>
                          {employee.employeeName}
                        </h5>
                        <p className={styles.employeeEmail}>{employee.email}</p>
                      </div>
                    </div>
                    {employee.departmentName && (
                      <div className={styles.departmentBadge}>
                        {employee.departmentName}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={20} className={styles.chevronIcon} />
                </div>
              ))}
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[4, 8, 12, 24]}
          />
        </>
      )}
      {/* Employee Skills Modal */}
      {showSkillsModal && selectedEmployee && (
        <EmployeeSkillsModal
          employee={selectedEmployee}
          onClose={handleCloseModal}
          isReadOnly={true}
        />
      )}
    </div>
  );
};
export default OrganizationSkills;                  
