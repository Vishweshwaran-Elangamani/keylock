import { useEffect, useState } from "react";
import careerGoalsService from "../../../../services/hr_operations/hr/careerGoalsService";
import {
  Button,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Form,
  Collapse,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import { FaSearch, FaChartBar, FaChartLine } from "react-icons/fa";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast, Toaster } from "sonner";
import GoalSuggestionsModal from "../../../../components/hr_operations/modals/GoalSuggestionsModal";
import ReminderEmailModal from "../../../../components/hr_operations/modals/ReminderEmailModal";
import BulkReminderModal from "../../../../components/hr_operations/modals/BulkReminderModal";
import Breadcrumb from "../../../../components/common/Breadcrumb";
import "../../../../styles/hr_operations/hr/CareerGoals.css";

const COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
];

/* Custom dropdown for departments */
const DepartmentDropdown = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);

  const list = [{ label: "All Departments", value: "" }, ...options.map((o) => ({
    label: o,
    value: o,
  }))];

  const selected = list.find((o) => o.value === value) || list[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="cg-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-status-selected">
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {list.map((opt) => (
            <div
              key={opt.value || "all-departments"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
              }
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Custom dropdown for days filter */
const DaysDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "All Days", value: "" },
    { label: "0-7 days", value: "0-7" },
    { label: "8-30 days", value: "8-30" },
    { label: "30+ days", value: "30+" },
  ];

  const selected = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="cg-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((prev) => !prev)}
      style={{ position: "relative" }}
    >
      <div className="custom-status-selected">
        {selected.label}
        <span className="custom-status-arrow" />
      </div>
      {open && (
        <div className="custom-status-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all-days"}
              className={
                "custom-status-option" +
                (opt.value === value ? " custom-status-option-active" : "")
              }
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkReminderModal, setBulkReminderModal] = useState(false);
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showVisualization, setShowVisualization] = useState(false);

  useEffect(() => {
    fetchWithoutGoals();
    fetchAdoptionStats();
    fetchGoalStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withoutGoals, departmentFilter, daysFilter]);

  useEffect(() => {
    setSelectedEmployees([]);
    setSelectAll(false);
  }, [filteredData]);

  const fetchWithoutGoals = () => {
    setLoadingWithoutGoals(true);
    careerGoalsService
      .getEmployeesWithoutGoals()
      .then((res) => {
        const employees = res.data.employees || [];
        setWithoutGoals(employees);
      })
      .catch(() => setWithoutGoals([]))
      .finally(() => setLoadingWithoutGoals(false));
  };

  const fetchAdoptionStats = () => {
    setLoadingAdoption(true);
    careerGoalsService
      .getGoalAdoptionRate()
      .then((res) => {
        const stats = res.data;
        setAdoptionStats(stats);
      })
      .catch(() => setAdoptionStats(null))
      .finally(() => setLoadingAdoption(false));
  };

  const fetchGoalStats = () => {
    setLoadingGoalStats(true);
    careerGoalsService
      .getGoalStatistics()
      .then((res) => setGoalStats(res.data))
      .catch(() => setGoalStats(null))
      .finally(() => setLoadingGoalStats(false));
  };

  const fetchSuggestions = (userId) => {
    setLoadingSuggestions(true);
    careerGoalsService
      .getGoalSuggestions(userId)
      .then((res) => setGoalSuggestions(res.data))
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
    setFilteredData(withoutGoals);
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
      toast("Please select at least one employee!");
      return;
    }
    setBulkReminderModal(true);
  };

  const sendBulkReminders = () => {
    setSendingBulkReminder(true);
    careerGoalsService
      .sendGoalReminders({
        sendType: "multiple",
        userIds: selectedEmployees,
        includeGoalSuggestions: true,
      })
      .then((res) => {
        toast(
          `Reminder sent successfully! Sent to ${selectedEmployees.length} employee(s).`
        );
        setBulkReminderModal(false);
        setSelectedEmployees([]);
        setSelectAll(false);
      })
      .catch(() => {
        toast("Failed to send bulk reminders.");
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
    careerGoalsService
      .sendGoalReminders({
        sendType: "single",
        userId: reminderTargetUser.userId ?? reminderTargetUser.UserId,
        includeGoalSuggestions: true,
      })
      .then((res) => {
        setReminderResult(res.data);
        toast("Reminder sent successfully!");
        setTimeout(() => {
          setReminderEmailModal(false);
          setReminderResult(null);
        }, 1000);
      })
      .catch(() => {
        toast("Failed to send reminder.");
      })
      .finally(() => setSendingReminder(false));
  };

  const handleCloseReminderModal = () => {
    setReminderEmailModal(false);
    setReminderResult(null);
  };

  const getDaysDistributionData = () => {
    const distribution = {
      "0-7 days": 0,
      "8-30 days": 0,
      "31-60 days": 0,
      "60+ days": 0,
    };

    filteredData.forEach((emp) => {
      const days = emp.daysWithoutGoals ?? emp.DaysWithoutGoals ?? 0;
      if (days <= 7) distribution["0-7 days"]++;
      else if (days <= 30) distribution["8-30 days"]++;
      else if (days <= 60) distribution["31-60 days"]++;
      else distribution["60+ days"]++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const getDepartmentData = () => {
    const deptCounts = {};
    filteredData.forEach((emp) => {
      const dept = emp.departmentName ?? emp.DepartmentName ?? "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  if (loadingAdoption) {
    return (
      <div className="cg-loading-container">
        <Spinner animation="border" />
        <p>Loading career goals data...</p>
      </div>
    );
  }

  return (
    <div className="cg-root">
      <Toaster position="top-right" closeButton expand={false} />

      {adoptionStats && (
        <div className="cg-summary-cards">
          <div className="cg-summary-card total">
            <div className="cg-summary-card-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="cg-summary-card-content">
              <div className="cg-summary-card-value">
                {adoptionStats.totalEmployees}
              </div>
              <div className="cg-summary-card-label">Total Employees</div>
            </div>
          </div>

          <div className="cg-summary-card with-goals">
            <div className="cg-summary-card-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="cg-summary-card-content">
              <div className="cg-summary-card-value">
                {adoptionStats.employeesWithGoals}
              </div>
              <div className="cg-summary-card-label">
                With Goals ({adoptionStats.adoptionRate}%)
              </div>
            </div>
          </div>

          <div className="cg-summary-card without-goals">
            <div className="cg-summary-card-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="cg-summary-card-content">
              <div className="cg-summary-card-value">
                {adoptionStats.employeesWithoutGoals}
              </div>
              <div className="cg-summary-card-label">Without Goals</div>
            </div>
          </div>
        </div>
      )}

      <div className="cag-filter-section">
        <div className="cg-filter-row-single">
          <div className="cg-search-input-wrapper">
            <div className="cg-search-inner">
              <span className="cg-search-icon">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cg-search-field"
              />
              <button
                type="button"
                className="cg-search-btn"
                onClick={applyFilters}
              >
                Search
              </button>
            </div>
          </div>

          <DepartmentDropdown
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={uniqueDepartments}
          />

          <DaysDropdown value={daysFilter} onChange={setDaysFilter} />

          <button className="cg-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>

          <div className="cg-results-count-inline">
            Showing {currentItems.length} of {filteredData.length} employees
          </div>

          {selectedEmployees.length > 0 && (
            <button className="cg-bulk-btn" onClick={openBulkReminderModal}>
              <i className="bi bi-send me-1"></i>
              Send to Selected ({selectedEmployees.length})
            </button>
          )}

          <button
            className="cg-analytics-btn"
            onClick={() => setShowVisualization(!showVisualization)}
          >
            <FaChartBar className="me-1" />
            {showVisualization ? "Hide" : "Show"} Analytics
          </button>
        </div>
      </div>

      <Collapse in={showVisualization}>
        <div>
          <Card className="cg-analytics-card">
            <Card.Body>
              <h5 className="cg-analytics-title">
                <FaChartLine className="me-2" />
                Goal Adoption Analytics
              </h5>
              <Row>
                <Col md={6} className="mb-4">
                  <h6 className="text-center mb-3">
                    Days Without Goals Distribution
                  </h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getDaysDistributionData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8B5CF6" name="Employees" />
                    </BarChart>
                  </ResponsiveContainer>
                </Col>

                <Col md={6} className="mb-4">
                  <h6 className="text-center mb-3">Employees by Department</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getDepartmentData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getDepartmentData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      <div className="cg-table-container">
        <table className="cg-table">
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
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Email</th>
              <th>Days Without Goals</th>
              <th>Recommended Action</th>
              <th className="cg-text-center cg-actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingWithoutGoals ? (
              <tr>
                <td colSpan={8} className="cg-empty-state">
                  <Spinner animation="border" size="sm" /> Loading...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="cg-empty-state">
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
                    <td className="cg-email-cell">{emp.email ?? emp.Email}</td>
                    <td className="cg-text-center">
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
                    <td>{emp.recommendedAction ?? emp.RecommendedAction}</td>
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
                            className="action-btn action-btn-warning"
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
              <option value="5">5</option>
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
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
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
