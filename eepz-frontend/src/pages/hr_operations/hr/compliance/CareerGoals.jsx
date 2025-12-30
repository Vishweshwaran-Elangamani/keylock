import { useEffect, useState } from "react";
import careerGoalsService from "../../../../services/hr_operations/hr/careerGoalsService";
import {
  Spinner,
  OverlayTrigger,
  Tooltip,
  Form,
  Collapse,
} from "react-bootstrap";
import { FaSearch, FaChartBar } from "react-icons/fa";
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

// Purple colors for charts
const COLORS = [
  "#97247E", // Purple/Magenta
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#A855F7", // Purple
  "#C026D3", // Fuchsia
  "#9333EA", // Violet
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
      className="cg-filter-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
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
      className="cg-days-select custom-status-dropdown"
      tabIndex={0}
      onBlur={() => setTimeout(() => setOpen(false), 200)}
      style={{ position: "relative" }}
    >
      <div
        className="custom-status-selected"
        onClick={() => setOpen((prev) => !prev)}
      >
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
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
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
  }, [withoutGoals, departmentFilter, daysFilter, activeSearchTerm]);

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

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    let filtered = [...withoutGoals];

    if (activeSearchTerm) {
      filtered = filtered.filter(
        (emp) =>
          (emp.employeeName?.toLowerCase() || "").includes(
            activeSearchTerm.toLowerCase()
          ) ||
          (emp.email?.toLowerCase() || "").includes(
            activeSearchTerm.toLowerCase()
          ) ||
          (emp.employeeCompanyId?.toLowerCase() || "").includes(
            activeSearchTerm.toLowerCase()
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
    setActiveSearchTerm("");
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
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;

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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cg-page">
      <Toaster position="top-right" closeButton expand={false} />

      {/* STATISTICS CARDS */}
      {adoptionStats && (
        <div className="stats-cards-cg">
          <div className="stat-card-cg stat-total-cg">
            <div className="stat-icon-cg">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="stat-content-cg">
              <div className="stat-value-cg">
                {adoptionStats.totalEmployees}
              </div>
              <div className="stat-label-cg">Total Employees</div>
            </div>
          </div>

          <div className="stat-card-cg stat-with-goals-cg">
            <div className="stat-icon-cg">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="stat-content-cg">
              <div className="stat-value-cg">
                {adoptionStats.employeesWithGoals}
              </div>
              <div className="stat-label-cg">
                With Goals ({adoptionStats.adoptionRate}%)
              </div>
            </div>
          </div>

          <div className="stat-card-cg stat-without-goals-cg">
            <div className="stat-icon-cg">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="stat-content-cg">
              <div className="stat-value-cg">
                {adoptionStats.employeesWithoutGoals}
              </div>
              <div className="stat-label-cg">Without Goals</div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="cg-controls">
        <div className="cg-search-input">
          <div className="cg-search-inner">
            <span className="cg-search-icon">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="cg-search-field"
            />
            <button
              type="button"
              className="cg-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        <div className="cg-department-filter">
          <DepartmentDropdown
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={uniqueDepartments}
          />
        </div>

        <div className="cg-days-filter">
          <DaysDropdown value={daysFilter} onChange={setDaysFilter} />
        </div>

        <button className="cg-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>

        <button
          className="cg-btn-analytics"
          onClick={() => setShowVisualization(!showVisualization)}
        >
          <FaChartBar />
          {showVisualization ? "Hide" : "Show"} Analytics
        </button>

        <div className="cg-results-count">
          Showing {filteredData.length}{" "}
          {filteredData.length === 1 ? "employee" : "employees"}
        </div>

        {selectedEmployees.length > 0 && (
          <button className="cg-btn-bulk" onClick={openBulkReminderModal}>
            <i className="bi bi-send"></i>
            Send to Selected ({selectedEmployees.length})
          </button>
        )}
      </div>

      {/* ANALYTICS COLLAPSE */}
      <Collapse in={showVisualization}>
        <div className="cg-analytics-section">
          <div className="cg-charts-grid">
            <div className="cg-chart-card">
              <div className="cg-chart-header">
                <i className="bi bi-bar-chart-line"></i>
                <h3>Days Without Goals Distribution</h3>
              </div>
              <div className="cg-chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getDaysDistributionData()}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="count"
                      fill="#97247E"
                      name="Employees"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="cg-chart-card">
              <div className="cg-chart-header">
                <i className="bi bi-pie-chart"></i>
                <h3>Employees by Department</h3>
              </div>
              <div className="cg-chart-body">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getDepartmentData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
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
                    <RechartsTooltip
                      formatter={(value, name, props) => [
                        `${value} employees`,
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="cg-chart-legend">
                  {getDepartmentData().map((entry, index) => (
                    <div key={index} className="cg-legend-item">
                      <span
                        className="cg-legend-dot"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></span>
                      <span className="cg-legend-text">
                        {entry.name}: {entry.value} employees
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Collapse>

      {/* TABLE */}
      <div
        className={`cg-table-card ${
          totalPages > 1 ? "cg-table-with-pagination" : ""
        }`}
      >
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingWithoutGoals ? (
                <tr>
                  <td colSpan={7} className="cg-empty-state">
                    <div className="cg-empty-content">
                      <Spinner animation="border" size="sm" /> Loading...
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cg-empty-state">
                    <div className="cg-empty-content">
                      <i className="bi bi-inbox"></i>
                      <h4>No employees found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
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
                      <td>
                        <span className="cg-department-badge">
                          {emp.departmentName ?? emp.DepartmentName}
                        </span>
                      </td>
                      <td className="cg-email-cell">
                        {emp.email ?? emp.Email}
                      </td>
                      <td>
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
                          {emp.daysWithoutGoals ?? emp.DaysWithoutGoals} days
                        </span>
                      </td>
                      <td>
                        <div className="cg-table-actions">
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`tooltip-send-${empId}`}>
                                Send Reminder
                              </Tooltip>
                            }
                          >
                            <button
                              className="cg-action-send"
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
                              className="cg-action-suggest"
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
      </div>

      {/* PAGINATION - NOW BELOW THE TABLE */}
      {totalPages > 1 && filteredData.length > 0 && (
        <div className="cg-pagination-wrapper-bottom">
          <nav className="cg-pagination">
            <ul className="cg-pagination-list">
              <li
                className={`cg-page-item ${
                  currentPage === 1 ? "disabled" : ""
                }`}
              >
                <button
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
