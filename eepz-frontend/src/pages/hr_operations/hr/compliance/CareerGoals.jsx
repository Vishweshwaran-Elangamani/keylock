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
  Pagination,
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
  const [itemsPerPage] = useState(10);

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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      <h2 className="cg-page-title">Career Goals</h2>

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
          <div className="cg-card-table-title">Employees Without Goals</div>

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

        <div className="cg-table-wrapper">
          <table className="cg-employee-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <Form.Check
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    label=""
                  />
                </th>
                <th className="col-emp-id">EMPLOYEE ID</th>
                <th className="col-name">EMPLOYEE NAME</th>
                <th className="col-department">DEPARTMENT</th>
                <th className="col-email">EMAIL</th>
                <th className="col-days">DAYS WITHOUT GOALS</th>
                <th className="col-action-text">RECOMMENDED ACTION</th>
                <th className="col-action-btns">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loadingWithoutGoals ? (
                <tr>
                  <td colSpan={8} className="cg-table-loading">
                    <Spinner animation="border" size="sm" /> Loading...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="cg-table-no-data">
                    No employees found matching the criteria!
                  </td>
                </tr>
              ) : (
                currentItems.map((emp) => {
                  const empId = emp.userId ?? emp.UserId;
                  return (
                    <tr key={empId}>
                      <td className="col-checkbox">
                        <Form.Check
                          type="checkbox"
                          checked={selectedEmployees.includes(empId)}
                          onChange={() => handleSelectEmployee(empId)}
                          label=""
                        />
                      </td>
                      <td className="col-emp-id">
                        <strong>
                          {emp.employeeCompanyId ?? emp.EmployeeCompanyId}
                        </strong>
                      </td>
                      <td className="col-name">
                        {emp.employeeName ?? emp.EmployeeName}
                      </td>
                      <td className="col-department">
                        {emp.departmentName ?? emp.DepartmentName}
                      </td>
                      <td className="col-email">{emp.email ?? emp.Email}</td>
                      <td className="col-days">
                        <span
                          className={`cg-days-badge ${
                            (emp.daysWithoutGoals ?? emp.DaysWithoutGoals) > 30
                              ? "badge-danger"
                              : (emp.daysWithoutGoals ?? emp.DaysWithoutGoals) >
                                7
                              ? "badge-warning"
                              : "badge-info"
                          }`}
                        >
                          {emp.daysWithoutGoals ?? emp.DaysWithoutGoals}
                        </span>
                      </td>
                      <td className="col-action-text">
                        {emp.recommendedAction ?? emp.RecommendedAction}
                      </td>
                      <td className="col-action-btns">
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={`tooltip-send-${empId}`}>
                              Send Reminder
                            </Tooltip>
                          }
                        >
                          <button
                            className="cg-icon-btn cg-icon-btn-primary"
                            onClick={() => openSendReminder(emp)}
                          >
                            <FaPaperPlane />
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
                            className="cg-icon-btn cg-icon-btn-secondary"
                            onClick={() => fetchSuggestions(empId)}
                          >
                            <FaLightbulb />
                          </button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="cg-pagination-wrapper">
            <Pagination>
              <Pagination.First
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => paginate(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <Pagination.Ellipsis key={pageNum} disabled />;
                }
                return null;
              })}

              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
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
