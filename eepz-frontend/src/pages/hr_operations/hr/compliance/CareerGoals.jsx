import { useEffect, useState } from "react";
import hrApi from "../../../../services/hr_operations/hr/hrApi";
import {
  Button,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
  Form,
  InputGroup,
} from "react-bootstrap";
import { FaPaperPlane, FaLightbulb, FaSearch } from "react-icons/fa";
import GoalSuggestionsModal from "../../../../components/hr_operations/modals/GoalSuggestionsModal";
import ReminderEmailModal from "../../../../components/hr_operations/modals/ReminderEmailModal";
import BulkReminderModal from "../../../../components/hr_operations/modals/BulkReminderModal";
import "../../../../styles/hr_operations/hr/careerGoals.css";

const CareerGoals = () => {
  const [withoutGoals, setWithoutGoals] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingWithoutGoals, setLoadingWithoutGoals] = useState(false);
  const [goalSuggestions, setGoalSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [adoptionStats, setAdoptionStats] = useState(null);
  const [loadingAdoption, setLoadingAdoption] = useState(false);
  const [goalStats, setGoalStats] = useState(null);
  const [loadingGoalStats, setLoadingGoalStats] = useState(false);
  const [reminderEmailModal, setReminderEmailModal] = useState(false);
  const [reminderTargetUser, setReminderTargetUser] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [alert, setAlert] = useState(null);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkReminderModal, setBulkReminderModal] = useState(false);
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchWithoutGoals();
    fetchAdoptionStats();
    fetchGoalStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withoutGoals, searchTerm, departmentFilter, daysFilter]);

  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [filteredData]);

  const fetchWithoutGoals = () => {
    setLoadingWithoutGoals(true);
    hrApi
      .get("/Compliance/employees-without-goals")
      .then((res) => {
        setWithoutGoals(res.data.data.employees || []);
      })
      .catch(() => setWithoutGoals([]))
      .finally(() => setLoadingWithoutGoals(false));
  };

  const fetchAdoptionStats = () => {
    setLoadingAdoption(true);
    hrApi
      .get("/Compliance/goal-adoption-rate")
      .then((res) => setAdoptionStats(res.data.data))
      .catch(() => setAdoptionStats(null))
      .finally(() => setLoadingAdoption(false));
  };

  const fetchGoalStats = () => {
    setLoadingGoalStats(true);
    hrApi
      .get("/Compliance/goal-statistics")
      .then((res) => setGoalStats(res.data.data))
      .catch(() => setGoalStats(null))
      .finally(() => setLoadingGoalStats(false));
  };

  const fetchSuggestions = (userId) => {
    setLoadingSuggestions(true);
    hrApi
      .get(`/Compliance/suggest-goals/${userId}`)
      .then((res) => setGoalSuggestions(res.data.data))
      .catch(() => setGoalSuggestions(null))
      .finally(() => setLoadingSuggestions(false));
  };

  const applyFilters = () => {
    let filtered = [...withoutGoals];

    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          (emp.employeeName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (emp.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (emp.employeeCompanyId?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(
        (emp) =>
          emp.departmentName?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    if (daysFilter) {
      filtered = filtered.filter((emp) => {
        const days = emp.daysWithoutGoals ?? 0;
        if (daysFilter === "0-7") return days <= 7;
        if (daysFilter === "8-30") return days > 7 && days <= 30;
        if (daysFilter === "30+") return days > 30;
        return true;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setDaysFilter("");
    setCurrentPage(1);
  };

  const uniqueDepartments = [
    ...new Set(withoutGoals.map((emp) => emp.departmentName).filter(Boolean)),
  ];

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentItems.map((emp) => emp.userId ?? emp.UserId);
      setSelectedEmployees(allIds);
      setSelectAll(true);
    } else {
      setSelectedEmployees([]);
      setSelectAll(false);
    }
  };

  const handleSelectEmployee = (userId) => {
    if (selectedEmployees.includes(userId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedEmployees([...selectedEmployees, userId]);
    }
  };

  const openBulkReminderModal = () => {
    if (selectedEmployees.length === 0) {
      setAlert({
        type: "warning",
        message: "Please select at least one employee!",
      });
      return;
    }
    setBulkReminderModal(true);
  };

  const sendBulkReminders = () => {
    setSendingBulkReminder(true);
    hrApi
      .post("/Compliance/send-goal-reminders", {
        sendType: "multiple",
        userIds: selectedEmployees,
        includeGoalSuggestions: true,
      })
      .then((res) => {
        setAlert({
          type: "success",
          message: `Reminders sent to ${selectedEmployees.length} employees successfully!`,
        });
        setBulkReminderModal(false);
        setSelectedEmployees([]);
        setSelectAll(false);
      })
      .catch(() => {
        setAlert({ type: "danger", message: "Failed to send bulk reminders." });
      })
      .finally(() => setSendingBulkReminder(false));
  };

  const openSendReminder = (user) => {
    setReminderTargetUser(user);
    setReminderResult(null);
    setReminderEmailModal(true);
  };

  const sendReminder = () => {
    setSendingReminder(true);
    hrApi
      .post("/Compliance/send-goal-reminders", {
        sendType: "single",
        userId: reminderTargetUser.userId ?? reminderTargetUser.UserId,
        includeGoalSuggestions: true,
      })
      .then((res) => {
        setReminderResult(res.data.data);
        setAlert({ type: "success", message: "Reminder sent successfully!" });

        setTimeout(() => {
          setReminderEmailModal(false);
          setReminderResult(null);
        }, 1000);
      })
      .catch(() => {
        setAlert({ type: "danger", message: "Failed to send reminder." });
      })
      .finally(() => setSendingReminder(false));
  };

  const handleCloseReminderModal = () => {
    setReminderEmailModal(false);
    setReminderResult(null);
  };

  return (
    <div className="cg-root">
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {loadingAdoption ? (
        <div className="cg-loading-container">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="cg-career-kpi-row">
          {adoptionStats && (
            <>
              <div className="cg-kpi-card card-purple">
                <div className="cg-kpi-label">Total Employees</div>
                <div className="cg-kpi-value">
                  {adoptionStats.totalEmployees}
                </div>
                <span className="cg-kpi-meta meta-green">
                  +{adoptionStats.employeesWithGoals} set goals
                </span>
              </div>

              <div className="cg-kpi-card card-indigo">
                <div className="cg-kpi-label">With Goals</div>
                <div className="cg-kpi-value">
                  {adoptionStats.employeesWithGoals}
                </div>
                <span className="cg-kpi-meta meta-blue">
                  {adoptionStats.adoptionRate}% adoption
                </span>
              </div>

              <div className="cg-kpi-card card-amber">
                <div className="cg-kpi-label">Without Goals</div>
                <div className="cg-kpi-value">
                  {adoptionStats.employeesWithoutGoals}
                </div>
                <span className="cg-kpi-meta meta-orange">Need action</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="cg-card-container">
        <div className="cg-card-table-header">
          {selectedEmployees.length > 0 && (
            <Button
              variant="primary"
              className="cg-bulk-btn"
              onClick={openBulkReminderModal}
            >
              <FaPaperPlane className="me-2" />
              Send Reminder to Selected ({selectedEmployees.length})
            </Button>
          )}
        </div>

        <div className="cg-filter-section">
          <div className="cg-filter-row-single">
            <InputGroup className="cg-search-input">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              className="cg-filter-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              className="cg-filter-select"
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
            >
              <option value="">All Days</option>
              <option value="0-7">0-7 days</option>
              <option value="8-30">8-30 days</option>
              <option value="30+">30+ days</option>
            </Form.Select>

            <Button
              variant="outline-secondary"
              onClick={clearFilters}
              className="cg-clear-btn"
            >
              Clear Filters
            </Button>

            <div className="cg-results-count-inline">
              Showing {currentItems.length} of {filteredData.length} employees
            </div>
          </div>
        </div>

        {/* Table Card - Updated Design */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="cg-employee-table">
              <thead>
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      label=""
                    />
                  </th>
                  <th>EMPLOYEE ID</th>
                  <th>EMPLOYEE NAME</th>
                  <th>DEPARTMENT</th>
                  <th>EMAIL</th>
                  <th>DAYS WITHOUT GOALS</th>
                  <th>RECOMMENDED ACTION</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loadingWithoutGoals ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <Spinner animation="border" size="sm" /> Loading...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <i className="bi bi-inbox"></i>
                      <p>No employees found matching the criteria!</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((emp) => {
                    const empId = emp.userId ?? emp.UserId;
                    return (
                      <tr key={empId}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedEmployees.includes(empId)}
                            onChange={() => handleSelectEmployee(empId)}
                            label=""
                          />
                        </td>
                        <td>
                          <strong>
                            {emp.employeeCompanyId ?? emp.EmployeeCompanyId}
                          </strong>
                        </td>
                        <td>{emp.employeeName ?? emp.EmployeeName}</td>
                        <td>{emp.departmentName ?? emp.DepartmentName}</td>
                        <td className="email-cell">{emp.email ?? emp.Email}</td>
                        <td>
                          <span
                            className={`cg-days-badge ${
                              (emp.daysWithoutGoals ?? emp.DaysWithoutGoals) >
                              30
                                ? "badge-danger"
                                : (emp.daysWithoutGoals ??
                                    emp.DaysWithoutGoals) > 7
                                ? "badge-warning"
                                : "badge-info"
                            }`}
                          >
                            {emp.daysWithoutGoals ?? emp.DaysWithoutGoals}
                          </span>
                        </td>
                        <td>
                          {emp.recommendedAction ?? emp.RecommendedAction}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-send-${empId}`}>
                                  Send Reminder
                                </Tooltip>
                              }
                            >
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => openSendReminder(emp)}
                              >
                                <i className="bi bi-send"></i>
                              </button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-suggest-${empId}`}>
                                  Suggest Goals
                                </Tooltip>
                              }
                            >
                              <button
                                className="action-btn action-btn-view"
                                onClick={() => fetchSuggestions(empId)}
                              >
                                <i className="bi bi-lightbulb"></i>
                              </button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Updated Design */}
          {filteredData.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span className="pagination-label">Show</span>
                <select
                  className="pagination-select"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="pagination-label">entries</span>
              </div>

              <div className="pagination-status">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                {filteredData.length} entries
              </div>

              <nav className="pagination-nav">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {getPageNumbers().map((page, index) => (
                    <li
                      key={index}
                      className={`page-item ${
                        page === currentPage ? "active" : ""
                      } ${typeof page !== "number" ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          typeof page === "number" && setCurrentPage(page)
                        }
                        disabled={typeof page !== "number"}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      <GoalSuggestionsModal
        show={!!goalSuggestions}
        onHide={() => setGoalSuggestions(null)}
        goalSuggestions={goalSuggestions}
        loadingSuggestions={loadingSuggestions}
      />

      <ReminderEmailModal
        show={reminderEmailModal}
        onHide={handleCloseReminderModal}
        reminderTargetUser={reminderTargetUser}
        reminderResult={reminderResult}
        sendingReminder={sendingReminder}
        onSendReminder={sendReminder}
      />

      <BulkReminderModal
        show={bulkReminderModal}
        onHide={() => setBulkReminderModal(false)}
        selectedEmployees={selectedEmployees}
        sendingBulkReminder={sendingBulkReminder}
        onSendBulkReminders={sendBulkReminders}
      />
    </div>
  );
};

export default CareerGoals;
