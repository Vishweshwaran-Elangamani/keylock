

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import CountUp from "react-countup";
import {
  DollarSign,
  Target,
  Briefcase,
  Users,
  TrendingUp,
} from "lucide-react";
import budgetAllocationService from "../../services/hr_operations/hr/budgetAllocationService";
import goalService from "../../services/goals/goalService";
import { employeeApi } from "../../services/feedbackmanagement/feedbackApi";
import projectService from "../../services/project_management/projectService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";

const formatStatusLabel = (raw) => {
  if (!raw) return "";
  const lower = String(raw).toLowerCase().replace(/_/g, " ");
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
};

const LeadershipDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [dashboardData, setDashboardData] = useState({
    budgets: [],
    departments: [],
    goals: [],
    employees: [],
    projects: [],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    if (response.success === true || response.success === false) {
      if (response.data) {
        if (Array.isArray(response.data)) return response.data;
        if (response.data.$values) return response.data.$values;
      }
    }

    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (response.data.$values) return response.data.$values;
      if (response.data.data) {
        if (Array.isArray(response.data.data)) return response.data.data;
        if (response.data.data.$values) return response.data.data.$values;
      }
    }

    if (response.$values) return response.$values;
    return [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [budgetsRes, departmentsRes, goalsRes, employeesRes, projectsRes] =
        await Promise.all([
          budgetAllocationService
            .getAllDepartmentBudgets()
            .catch(() => ({ data: [] })),
          budgetAllocationService
            .getAllDepartments()
            .catch(() => ({ data: [] })),
          goalService
            .queryGoals({ pageSize: 1000, status: "" })
            .catch(() => ({ data: [] })),
          employeeApi.getAll().catch(() => ({ data: [] })),
          projectService.getAllProjects().catch(() => ({ data: [] })),
        ]);

      const extractedBudgets = extractData(budgetsRes);
      const extractedDepartments = extractData(departmentsRes);
      const extractedGoals = extractData(goalsRes);
      const extractedEmployees = extractData(employeesRes);
      const extractedProjects = extractData(projectsRes);

      setDashboardData({
        budgets: extractedBudgets,
        departments: extractedDepartments,
        goals: extractedGoals,
        employees: extractedEmployees,
        projects: extractedProjects,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getKPIStats = () => {
    const totalBudget = dashboardData.budgets.reduce(
      (sum, b) => sum + (parseFloat(b.totalBudget) || 0),
      0
    );

    const totalActiveGoals = dashboardData.goals.filter((g) => {
      const status = (g.status || g.goalStatus || "").toLowerCase();
      return (
        status === "inprogress" ||
        status === "pending" ||
        status === "approved" ||
        status === "open" ||
        status === "active"
      );
    }).length;

    const activeProjects = dashboardData.projects.filter((p) => {
      if (p.isActive === true || p.isActive === 1) return true;
      if (p.status) {
        const status = p.status.toLowerCase();
        return status === "active" || status === "inprogress" || status === "in progress";
      }
      if (p.projectStatus) {
        const status = p.projectStatus.toLowerCase();
        return status === "active" || status === "inprogress" || status === "in progress";
      }
      return false;
    }).length;

    const totalProjects = dashboardData.projects.length;

    const totalDepartments = dashboardData.departments.length;
    const totalEmployees = dashboardData.employees.length;

    const budgetUtilization = dashboardData.budgets.reduce((sum, b) => {
      const total = parseFloat(b.totalBudget) || 0;
      const utilized = parseFloat(b.utilizedAmount) || 0;
      return sum + (total > 0 ? (utilized / total) * 100 : 0);
    }, 0);

    const avgUtilization =
      dashboardData.budgets.length > 0
        ? Math.round(budgetUtilization / dashboardData.budgets.length)
        : 0;

    const completionRate =
      dashboardData.goals.length > 0
        ? Math.round(
            (dashboardData.goals.filter(
              (g) =>
                g.status?.toLowerCase() === "completed" ||
                g.goalStatus?.toLowerCase() === "completed"
            ).length /
              dashboardData.goals.length) *
              100
          )
        : 0;

    return {
      totalBudget,
      totalActiveGoals,
      activeProjects,
      totalProjects,
      totalDepartments,
      totalEmployees,
      avgUtilization,
      completionRate,
    };
  };

  const getEmployeeStatus = () => {
    const statusCount = {
      fulltime: 0,
      contract: 0,
      probation: 0,
      parttime: 0,
    };
    dashboardData.employees.forEach((emp) => {
      const status = (emp.employmentType || emp.status || "").toLowerCase();
      if (status.includes("full") || status.includes("permanent"))
        statusCount.fulltime++;
      else if (status.includes("contract")) statusCount.contract++;
      else if (status.includes("probation")) statusCount.probation++;
      else if (status.includes("part")) statusCount.parttime++;
      else statusCount.fulltime++;
    });

    const total = dashboardData.employees.length || 1;
    return {
      total,
      fulltime: statusCount.fulltime,
      contract: statusCount.contract,
      probation: statusCount.probation,
      parttime: statusCount.parttime,
      fulltimePercent: Math.round((statusCount.fulltime / total) * 100),
      contractPercent: Math.round((statusCount.contract / total) * 100),
      probationPercent: Math.round((statusCount.probation / total) * 100),
      parttimePercent: Math.round((statusCount.parttime / total) * 100),
    };
  };

  const getBudgetByDepartment = () => {
    let filteredBudgets = dashboardData.budgets;

    if (selectedDepartment !== "All Departments") {
      filteredBudgets = dashboardData.budgets.filter((budget) => {
        const dept = dashboardData.departments.find(
          (d) => d.departmentId === budget.departmentId
        );
        const deptName = dept?.departmentName || dept?.name || "";
        return deptName === selectedDepartment;
      });
    }

    return filteredBudgets
      .map((budget) => {
        const dept = dashboardData.departments.find(
          (d) => d.departmentId === budget.departmentId
        );
        const deptName = dept?.departmentName || dept?.name || "Unknown";
        return {
          name:
            deptName.length > 10
              ? deptName.substring(0, 10) + "..."
              : deptName,
          Total: parseFloat(budget.totalBudget) || 0,
          Allocated: parseFloat(budget.allocatedAmount) || 0,
          Utilized: parseFloat(budget.utilizedAmount) || 0,
        };
      })
      .filter((b) => b.Total > 0)
      .slice(0, 5);
  };

  const getGoalStatusDistribution = () => {
    const statusCount = {};
    dashboardData.goals.forEach((goal) => {
      const raw = goal.status || goal.goalStatus || "Unknown";
      const key = formatStatusLabel(raw);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    return Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  };

  if (loading) {
    return (
      <div className="ada-loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const kpiStats = getKPIStats();
  const employeeStatus = getEmployeeStatus();
  const budgetByDept = getBudgetByDepartment();
  const goalStatusDistribution = getGoalStatusDistribution();

  const GOAL_CHART_COLORS = [
    "#84cc16",
    "#65a30d",
    "#a3e635",
    "#bef264",
    "#d9f99d",
    "#ecfccb",
  ];

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Leadership Dashboard" }]} />

      <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-pink">
            <DollarSign size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              ₹<CountUp end={kpiStats.totalBudget} duration={2} separator="," />
            </h2>
            <p>Total Budget</p>
            <span className="admin-kpi-subtitle">
              <TrendingUp size={12} /> {kpiStats.avgUtilization}% utilized
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-yellow">
            <Target size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalActiveGoals} duration={2} />
            </h2>
            <p>Active Goals</p>
            <span className="admin-kpi-subtitle">
              <Target size={12} /> {kpiStats.completionRate}% completion rate
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-blue">
            <Briefcase size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.activeProjects} duration={2} />
            </h2>
            <p>Active Projects</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.totalProjects} total projects
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-green">
            <Users size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalDepartments} duration={2} />
            </h2>
            <p>Departments</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.totalEmployees} employees
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-person-badge"></i>
                <h3>Employee Status</h3>
              </div>
              <button className="card-filter-btn-dark">
                <i className="bi bi-calendar3"></i> This Week
              </button>
            </div>
            <div className="card-body">
              <div className="employee-status-summary">
                <div className="status-total">
                  <span className="label">Total Employee</span>
                  <h2>{employeeStatus.total}</h2>
                </div>
                <div className="status-bar">
                  <div
                    className="status-segment"
                    style={{
                      width: `${employeeStatus.fulltimePercent}%`,
                      backgroundColor: "#f59e0b",
                    }}
                  ></div>
                  <div
                    className="status-segment"
                    style={{
                      width: `${employeeStatus.contractPercent}%`,
                      backgroundColor: "#374151",
                    }}
                  ></div>
                  <div
                    className="status-segment"
                    style={{
                      width: `${employeeStatus.probationPercent}%`,
                      backgroundColor: "#ef4444",
                    }}
                  ></div>
                  <div
                    className="status-segment"
                    style={{
                      width: `${employeeStatus.parttimePercent}%`,
                      backgroundColor: "#ec4899",
                    }}
                  ></div>
                </div>
              </div>

              <div className="status-grid">
                <div className="status-card">
                  <div className="status-legend">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: "#f59e0b" }}
                    ></span>
                    <span>
                      Fulltime ({employeeStatus.fulltimePercent}%)
                    </span>
                  </div>
                  <h3>{employeeStatus.fulltime}</h3>
                </div>
                <div className="status-card">
                  <div className="status-legend">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: "#374151" }}
                    ></span>
                    <span>
                      Contract ({employeeStatus.contractPercent}%)
                    </span>
                  </div>
                  <h3>{employeeStatus.contract}</h3>
                </div>
                <div className="status-card">
                  <div className="status-legend">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: "#ef4444" }}
                    ></span>
                    <span>
                      Probation ({employeeStatus.probationPercent}%)
                    </span>
                  </div>
                  <h3>{employeeStatus.probation}</h3>
                </div>
                <div className="status-card">
                  <div className="status-legend">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: "#ec4899" }}
                    ></span>
                    <span>
                      Part-time ({employeeStatus.parttimePercent}%)
                    </span>
                  </div>
                  <h3>{employeeStatus.parttime}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-cash-stack"></i>
                <h3>Budget Allocation</h3>
              </div>
              <select
                className="card-select-dark"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option>All Departments</option>
                {dashboardData.departments.map((d) => (
                  <option
                    key={d.departmentId}
                    value={d.departmentName || d.name}
                  >
                    {d.departmentName || d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="card-body">
              {budgetByDept.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetByDept}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      formatter={(value) =>
                        `₹${Number(value).toLocaleString()}`
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="Total"
                      fill="#27235c"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Allocated"
                      fill="#0F62FE"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Utilized"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No budget data available</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goal Status Distribution</h3>
              </div>
            </div>
            <div className="card-body">
              {goalStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={goalStatusDistribution}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                    >
                      {goalStatusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GOAL_CHART_COLORS[index % GOAL_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value, entry) => {
                        const item = goalStatusDistribution.find(
                          (d) => d.name === entry.value
                        );
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No goal data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadershipDashboard;
