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
import "../../styles/auth/LeadershipDashboard.css";

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

  const BLUE_COLORS = ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#2563EB"];

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

  const GOAL_CHART_COLORS = BLUE_COLORS;

  return (
    <div className="leadership-dashboard-container">
      <Breadcrumb items={[{ label: "Leadership Dashboard" }]} />

      <div className="leadership-kpi-grid">
        <div className="leadership-kpi-card">
          <div className="leadership-kpi-icon leadership-teal">
            <DollarSign size={28} />
          </div>
          <div className="leadership-kpi-content">
            <h2>
              ₹<CountUp end={kpiStats.totalBudget} duration={2} separator="," />
            </h2>
            <p>Total Budget</p>
            <span className="leadership-kpi-subtitle">
              <TrendingUp size={12} /> {kpiStats.avgUtilization}% utilized
            </span>
          </div>
        </div>

        <div className="leadership-kpi-card">
          <div className="leadership-kpi-icon leadership-cyan">
            <Target size={28} />
          </div>
          <div className="leadership-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalActiveGoals} duration={2} />
            </h2>
            <p>Active Goals</p>
            <span className="leadership-kpi-subtitle">
              <Target size={12} /> {kpiStats.completionRate}% completion rate
            </span>
          </div>
        </div>

        <div className="leadership-kpi-card">
          <div className="leadership-kpi-icon leadership-aqua">
            <Briefcase size={28} />
          </div>
          <div className="leadership-kpi-content">
            <h2>
              <CountUp end={kpiStats.activeProjects} duration={2} />
            </h2>
            <p>Active Projects</p>
            <span className="leadership-kpi-subtitle">
              {kpiStats.totalProjects} total projects
            </span>
          </div>
        </div>

        <div className="leadership-kpi-card">
          <div className="leadership-kpi-icon leadership-turquoise">
            <Users size={28} />
          </div>
          <div className="leadership-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalDepartments} duration={2} />
            </h2>
            <p>Departments</p>
            <span className="leadership-kpi-subtitle">
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
                    className="status-segment segment-fulltime"
                    data-width={employeeStatus.fulltimePercent}
                  />
                  <div
                    className="status-segment segment-contract"
                    data-width={employeeStatus.contractPercent}
                  />
                  <div
                    className="status-segment segment-probation"
                    data-width={employeeStatus.probationPercent}
                  />
                  <div
                    className="status-segment segment-parttime"
                    data-width={employeeStatus.parttimePercent}
                  />
                </div>
              </div>

              <div className="status-grid">
                <div className="leadership-stat-card stat-card-fulltime">
                  <div className="leadership-stat-value">{employeeStatus.fulltime}</div>
                  <div className="leadership-stat-label">
                    Fulltime ({employeeStatus.fulltimePercent}%)
                  </div>
                </div>
                <div className="leadership-stat-card stat-card-contract">
                  <div className="leadership-stat-value">{employeeStatus.contract}</div>
                  <div className="leadership-stat-label">
                    Contract ({employeeStatus.contractPercent}%)
                  </div>
                </div>
                <div className="leadership-stat-card stat-card-probation">
                  <div className="leadership-stat-value">{employeeStatus.probation}</div>
                  <div className="leadership-stat-label">
                    Probation ({employeeStatus.probationPercent}%)
                  </div>
                </div>
                <div className="leadership-stat-card stat-card-parttime">
                  <div className="leadership-stat-value">{employeeStatus.parttime}</div>
                  <div className="leadership-stat-label">
                    Part-time ({employeeStatus.parttimePercent}%)
                  </div>
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
                      stroke="#e6f4f5"
                      vertical={false}
                    />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Total"
                      fill={BLUE_COLORS[0]}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Allocated"
                      fill={BLUE_COLORS[1]}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Utilized"
                      fill={BLUE_COLORS[2]}
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
                    <Legend />
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