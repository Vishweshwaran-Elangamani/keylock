import { useEffect, useState } from "react";
import careerGoalsService from "../../../../services/hr_operations/hr/careerGoalsService";
import {
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

  const list = [
    { label: "All Departments", value: "" },
    ...options.map((o) => ({
      label: o,
      value: o,
    })),
  ];

  const selected = list.find((o) => o.value === value) || list[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="cg-filter-select cg-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="cg-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="cg-custom-arrow" />
      </div>
      {open && (
        <div className="cg-custom-menu">
          {list.map((opt) => (
            <div
              key={opt.value || "all-departments"}
              className={
                "cg-custom-option" +
                (opt.value === value ? " cg-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
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
      className="cg-filter-select cg-custom-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
    >
      <div
        className="cg-custom-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected.label}
        <span className="cg-custom-arrow" />
      </div>
      {open && (
        <div className="cg-custom-menu">
          {options.map((opt) => (
            <div
              key={opt.value || "all-days"}
              className={
                "cg-custom-option" +
                (opt.value === value ? " cg-custom-option-active" : "")
              }
              onClick={() => handleSelect(opt.value)}
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

      {/* STATISTICS CARDS */}
      {adoptionStats && (
        <div className="cg-stats-grid">
          <div className="cg-stat-card">
            <div className="cg-stat-icon cg-stat-icon-primary">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="cg-stat-content">
              <h3 className="cg-stat-value">{adoptionStats.totalEmployees}</h3>
              <p className="cg-stat-label">Total Employees</p>
            </div>
          </div>

          <div className="cg-stat-card">
            <div className="cg-stat-icon cg-stat-icon-success">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="cg-stat-content">
              <h3 className="cg-stat-value">
                {adoptionStats.employeesWithGoals}
              </h3>
              <p className="cg-stat-label">
                With Goals ({adoptionStats.adoptionRate}%)
              </p>
            </div>
          </div>

          <div className="cg-stat-card">
            <div className="cg-stat-icon cg-stat-icon-danger">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="cg-stat-content">
              <h3 className="cg-stat-value">
                {adoptionStats.employeesWithoutGoals}
              </h3>
              <p className="cg-stat-label">Without Goals</p>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS COLLAPSE */}
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

      {/* FILTERS CARD WITH ACTION BUTTONS */}
      <div className="cg-filters-card">
        <div className="cg-filters-content">
          <div className="cg-search-box">
            <div className="cg-search-inner">
              <span className="cg-search-icon">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cg-search-input"
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

          <button className="cg-btn-clear" onClick={clearFilters}>
  Clear Filters
</button>

{selectedEmployees.length > 0 && (
  <button className="cg-btn-bulk" onClick={openBulkReminderModal}>
    <i className="bi bi-send"></i>
    Send to Selected ({selectedEmployees.length})
  </button>
)}



<button
  className="cg-btn-analytics"
  onClick={() => setShowVisualization(!showVisualization)}
>
  <FaChartBar />
  {showVisualization ? "Hide" : "Show"} Analytics
</button>

        </div>
      </div>

      {/* TABLE */}
      <div className="cg-table-card">
        <div className="cg-table-wrapper">
          <table className="cg-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>
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
                <th className="cg-text-center">Actions</th>
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
                      <td className="cg-email-cell">
                        {emp.email ?? emp.Email}
                      </td>
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
                      <td>
                        <div className="cg-action-buttons">
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-send-${empId}`}>
                                Send Reminder
                              </Tooltip>
                            }
                          >
                            <button
                              className="cg-action-btn cg-action-send"
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
                              className="cg-action-btn cg-action-suggest"
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

        {/* PAGINATION */}
        {filteredData.length > 0 && (
          <div className="cg-pagination-container">
            <div className="cg-pagination-info">
              <span className="cg-pagination-label">Show</span>
              <select
                className="cg-pagination-select"
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
              <span className="cg-pagination-label">entries</span>
            </div>

            <div className="cg-pagination-status">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>

            <nav className="cg-pagination-nav">
              <ul className="cg-pagination">
                <li
                  className={`cg-page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="cg-page-link"
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
                    className={`cg-page-item ${
                      page === currentPage ? "active" : ""
                    } ${typeof page !== "number" ? "disabled" : ""}`}
                  >
                    <button
                      className="cg-page-link"
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
                  className={`cg-page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="cg-page-link"
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
