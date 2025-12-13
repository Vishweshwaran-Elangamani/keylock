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
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Award,
  BookOpen,
} from "lucide-react";
import budgetAllocationService from "../../services/hr_operations/hr/budgetAllocationService";
import goalService from "../../services/goals/goalService";
import employeePolicyService from "../../services/hr_operations/employee/employeePolicyService";
import { employeeApi } from "../../services/feedbackmanagement/feedbackApi";
import projectService from "../../services/project_management/projectService";
import lndService from "../../services/lnd/lndService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/common/Dashboard.css";

const formatCurrency = (amount) => {
  if (!amount) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const LeadershipDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [dashboardData, setDashboardData] = useState({
    budgets: [],
    departments: [],
    goals: [],
    policies: [],
    employees: [],
    projects: [],
    lndAssignments: [],
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

      const [
        budgetsRes,
        departmentsRes,
        goalsRes,
        policiesRes,
        employeesRes,
        projectsRes,
        lndAssignmentsRes,
      ] = await Promise.all([
        budgetAllocationService
          .getAllDepartmentBudgets()
          .catch(() => ({ data: [] })),
        budgetAllocationService
          .getAllDepartments()
          .catch(() => ({ data: [] })),
        goalService
          .queryGoals({ page: 1, pageSize: 1000 })
          .catch(() => ({ data: [] })),
        employeePolicyService.getPublishedPolicies().catch(() => []),
        employeeApi.getAll().catch(() => ({ data: [] })),
        projectService.getAllProjects().catch(() => ({ data: [] })),
        lndService
          .getAllOrganizationAssignments(1, "", "", "", "", 1000)
          .catch(() => ({ data: { items: [], totalCount: 0 } })),
      ]);

      const extractedBudgets = extractData(budgetsRes);
      const extractedDepartments = extractData(departmentsRes);
      const extractedGoals = extractData(goalsRes);
      const extractedPolicies = Array.isArray(policiesRes)
        ? policiesRes
        : extractData(policiesRes);
      const extractedEmployees = extractData(employeesRes);
      const extractedProjects = extractData(projectsRes);

      let extractedLndAssignments = [];
      if (lndAssignmentsRes?.data?.data?.items?.$values) {
        extractedLndAssignments = lndAssignmentsRes.data.data.items.$values;
      } else if (Array.isArray(lndAssignmentsRes?.data?.data?.items)) {
        extractedLndAssignments = lndAssignmentsRes.data.data.items;
      } else if (Array.isArray(lndAssignmentsRes?.data)) {
        extractedLndAssignments = lndAssignmentsRes.data;
      }

      console.log("📊 Employees Data:", extractedEmployees);
      console.log("📊 Goals Data:", extractedGoals);

      setDashboardData({
        budgets: extractedBudgets,
        departments: extractedDepartments,
        goals: extractedGoals,
        policies: extractedPolicies,
        employees: extractedEmployees,
        projects: extractedProjects,
        lndAssignments: extractedLndAssignments,
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
    const utilizedBudget = dashboardData.budgets.reduce(
      (sum, b) => sum + (parseFloat(b.utilizedAmount) || 0),
      0
    );

    const activeGoals = dashboardData.goals.filter((g) => {
      const status = (g.status || "").toLowerCase();
      return (
        status === "open" || status === "inprogress" || status === "reopened"
      );
    }).length;

    const completedGoals = dashboardData.goals.filter(
      (g) => (g.status || "").toLowerCase() === "completed"
    ).length;

    const goalCompletionRate =
      dashboardData.goals.length > 0
        ? Math.round((completedGoals / dashboardData.goals.length) * 100)
        : 0;

    const activeProjects = dashboardData.projects.filter(
      (p) => p.isActive === true
    ).length;

    const completedLnd = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      return status === "completed";
    }).length;

    const lndCompletionRate =
      dashboardData.lndAssignments.length > 0
        ? Math.round(
            (completedLnd / dashboardData.lndAssignments.length) * 100
          )
        : 0;

    return {
      totalBudget,
      utilizedBudget,
      budgetUtilization:
        totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0,
      totalDepartments: dashboardData.departments.length,
      activeGoals,
      completedGoals,
      totalGoals: dashboardData.goals.length,
      goalCompletionRate,
      totalEmployees: dashboardData.employees.length,
      activeProjects,
      totalProjects: dashboardData.projects.length,
      totalLndAssignments: dashboardData.lndAssignments.length,
      completedLnd,
      lndCompletionRate,
    };
  };

  // ✅ Employee Status Distribution
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

  // ✅ Budget By Department
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

  // ✅ Goals Distribution
  const getGoalDistribution = () => {
    const statusMap = {
      open: 0,
      inprogress: 0,
      completed: 0,
      onhold: 0,
      cancelled: 0,
    };

    dashboardData.goals.forEach((goal) => {
      const status = (goal.status || "open").toLowerCase().replace(/\s/g, "");
      if (statusMap.hasOwnProperty(status)) {
        statusMap[status]++;
      } else {
        statusMap.open++;
      }
    });

    const colors = {
      Open: "#f59e0b",
      "In Progress": "#0F62FE",
      Completed: "#10b981",
      "On Hold": "#6b7280",
      Cancelled: "#ef4444",
    };

    return Object.entries(statusMap)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => {
        const label = status
          .charAt(0)
          .toUpperCase() + status.slice(1)
          .replace("inprogress", "In Progress")
          .replace("onhold", "On Hold");
        return {
          name: label,
          value: count,
          color: colors[label] || "#8b5cf6",
        };
      });
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
  const goalDistribution = getGoalDistribution();

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Leadership Dashboard" }]} />

      {/* KPI Section */}
      <div className="admin-kpi-grid">
        <div
          className="admin-kpi-card"
          onClick={() => navigate("/leadership/budget-management")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-kpi-icon admin-pink">
            <DollarSign size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp
                end={kpiStats.totalBudget}
                duration={2}
                prefix="₹"
                separator=","
              />
            </h2>
            <p>Total Budget</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.budgetUtilization >= 75 ? (
                <TrendingUp size={12} color="#ef4444" />
              ) : (
                <TrendingDown size={12} color="#10b981" />
              )}{" "}
              {kpiStats.budgetUtilization}% utilized
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/leadership/dashboard/goals")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-kpi-icon admin-green">
            <Target size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.activeGoals} duration={2} />
            </h2>
            <p>Active Goals</p>
            <span className="admin-kpi-subtitle">
              <Award size={12} /> {kpiStats.goalCompletionRate}% completion rate
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

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/leadership/lnd/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="admin-kpi-icon admin-purple">
            <BookOpen size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalLndAssignments} duration={2} />
            </h2>
            <p>L&D Programs</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.lndCompletionRate}% completion rate
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon admin-yellow">
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

      {/* ✅ MAIN SECTION - 3 CARDS: Employee Status, Budget, Goals */}
      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          {/* Card 1: Employee Status */}
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

          {/* Card 2: Budget Allocation */}
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

          {/* Card 3: Goals Distribution */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-pie-chart-fill"></i>
                <h3>Goals Distribution</h3>
              </div>
            </div>
            <div className="card-body">
              {goalDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={goalDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {goalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    {goalDistribution.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "inline-block",
                          margin: "0 0.75rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            backgroundColor: item.color,
                            borderRadius: "2px",
                            marginRight: "0.3rem",
                          }}
                        ></span>
                        <span style={{ color: "#374151" }}>
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-data-message">No goals data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadershipDashboard;  
