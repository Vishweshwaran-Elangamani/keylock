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
  LineChart,
  Line,
  Area,
  AreaChart,
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
  const [hoveredCard, setHoveredCard] = useState(null);
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
    const allocatedBudget = dashboardData.budgets.reduce(
      (sum, b) => sum + (parseFloat(b.allocatedAmount) || 0),
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
      allocatedBudget,
      budgetUtilization:
        totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0,
      remainingBudget: totalBudget - utilizedBudget,
      totalDepartments: dashboardData.departments.length,
      activeGoals,
      completedGoals,
      totalGoals: dashboardData.goals.length,
      goalCompletionRate,
      totalPolicies: dashboardData.policies.length,
      totalEmployees: dashboardData.employees.length,
      activeProjects,
      totalProjects: dashboardData.projects.length,
      totalLndAssignments: dashboardData.lndAssignments.length,
      completedLnd,
      lndCompletionRate,
    };
  };

  const getDepartmentBudgetAnalysis = () => {
    return dashboardData.budgets
      .map((budget) => {
        const dept = dashboardData.departments.find(
          (d) => d.departmentId === budget.departmentId
        );
        const deptName = dept?.departmentName || dept?.name || "Unknown";
        const total = parseFloat(budget.totalBudget) || 0;
        const utilized = parseFloat(budget.utilizedAmount) || 0;
        const remaining = total - utilized;
        const utilizationRate = total > 0 ? (utilized / total) * 100 : 0;

        return {
          name: deptName,
          utilized,
          remaining,
          utilizationRate: Math.round(utilizationRate),
        };
      })
      .filter((b) => b.utilized > 0 || b.remaining > 0)
      .sort((a, b) => b.utilizedRate - a.utilizedRate)
      .slice(0, 6);
  };

  const getBudgetTrendData = () => {
    const deptData = dashboardData.budgets.map((budget) => {
      const dept = dashboardData.departments.find(
        (d) => d.departmentId === budget.departmentId
      );
      const deptName = dept?.departmentName || dept?.name || "Unknown";
      return {
        department: deptName.length > 12 ? deptName.substring(0, 12) + "..." : deptName,
        budget: parseFloat(budget.totalBudget) || 0,
        utilized: parseFloat(budget.utilizedAmount) || 0,
        allocated: parseFloat(budget.allocatedAmount) || 0,
      };
    });
    return deptData.filter((d) => d.budget > 0).slice(0, 5);
  };

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
        const label = status.charAt(0).toUpperCase() + status.slice(1).replace("inprogress", "In Progress").replace("onhold", "On Hold");
        return {
          name: label,
          value: count,
          color: colors[label] || "#8b5cf6",
        };
      });
  };

  const getProjectPerformance = () => {
    const activeProjects = dashboardData.projects.filter(
      (p) => p.isActive === true
    ).length;
    const completedProjects = dashboardData.projects.filter(
      (p) => p.isActive === false
    ).length;

    const data = [];
    if (activeProjects > 0)
      data.push({ name: "Active", value: activeProjects, color: "#0F62FE" });
    if (completedProjects > 0)
      data.push({
        name: "Completed",
        value: completedProjects,
        color: "#10b981",
      });

    return data.length > 0 ? data : [{ name: "No Data", value: 1, color: "#e5e7eb" }];
  };

  const getLndPerformance = () => {
    const statusCount = {
      completed: 0,
      inprogress: 0,
      pending: 0,
    };

    dashboardData.lndAssignments.forEach((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      if (status === "completed") statusCount.completed++;
      else if (status === "inprogress" || status === "active")
        statusCount.inprogress++;
      else if (status === "pending" || status === "requested")
        statusCount.pending++;
    });

    return [
      { status: "Completed", count: statusCount.completed },
      { status: "In Progress", count: statusCount.inprogress },
      { status: "Pending", count: statusCount.pending },
    ].filter((item) => item.count > 0);
  };

  const getTopPerformingDepartments = () => {
  return dashboardData.budgets
    .map((budget) => {
      const dept = dashboardData.departments.find(
        (d) => d.departmentId === budget.departmentId
      );
      const deptName = dept?.departmentName || dept?.name || "Unknown";
      
      // ✅ CALCULATE utilization percentage from actual data
      const totalBudget = parseFloat(budget.totalBudget) || 0;
      const utilizedAmount = parseFloat(budget.utilizedAmount) || 0;
      const utilization = totalBudget > 0 
        ? Math.round((utilizedAmount / totalBudget) * 100) 
        : 0;
      
      return {
        department: deptName,
        utilization: utilization,
        headcount: budget.headcount || 0,
        totalBudget: totalBudget,
        utilized: utilizedAmount,
      };
    })
    .filter(dept => dept.totalBudget > 0) // ✅ Only show departments with actual budgets
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);
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
  const budgetAnalysis = getDepartmentBudgetAnalysis();
  const budgetTrend = getBudgetTrendData();
  const goalDistribution = getGoalDistribution();
  const projectPerformance = getProjectPerformance();
  const lndPerformance = getLndPerformance();
  const topDepartments = getTopPerformingDepartments();

  const cards = [
    {
      title: "Budget Management",
      description: "Manage departmental budgets",
      icon: "bi-cash-coin",
      gradient: "gradient-red",
      path: "/leadership/budget-management",
    },
    {
      title: "Company Policies",
      description: "View organizational policies",
      icon: "bi-shield-check",
      gradient: "gradient-orange",
      path: "/leadership/policies",
    },
    {
      title: "Goals Management",
      description: "Track organizational goals",
      icon: "bi bi-bullseye",
      gradient: "gradient-pink",
      path: "/leadership/dashboard/goals",
    },
    {
      title: "Learning & Development",
      description: "Employee training programs",
      icon: "bi bi-book",
      gradient: "gradient-purple",
      path: "/leadership/lnd/dashboard",
    },
  ];

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

      {/* Main Analytics Section */}
      <div className="dashboard-cards-container">
        {/* First Row - Budget Analysis */}
        <div className="dashboard-row">
          <div className="dashboard-card card-large">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up-arrow"></i>
                <h3>Budget Utilization by Department</h3>
              </div>
            </div>
            <div className="card-body">
              {budgetTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis dataKey="department" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="budget"
                      fill="#27235c"
                      radius={[8, 8, 0, 0]}
                      name="Total Budget"
                    />
                    <Bar
                      dataKey="utilized"
                      fill="#0F62FE"
                      radius={[8, 8, 0, 0]}
                      name="Utilized"
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

        {/* Second Row - Performance Metrics */}
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bar-chart-line-fill"></i>
                <h3>L&D Performance</h3>
              </div>
            </div>
            <div className="card-body">
              {lndPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={lndPerformance} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      horizontal={false}
                    />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="status"
                      stroke="#6b7280"
                      fontSize={11}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="count" fill="#0F62FE" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">No L&D data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-trophy-fill"></i>
                <h3>Top Performing Departments</h3>
              </div>
            </div>
            <div className="card-body">
              {topDepartments.length > 0 ? (
                <div style={{ padding: "0.5rem 0" }}>
                  {topDepartments.map((dept, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 0.5rem",
                        borderBottom:
                          idx < topDepartments.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#1f2937",
                          }}
                        >
                          {dept.department}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.2rem",
                          }}
                        >
                          {dept.headcount} employees
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            width: "60px",
                            height: "8px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${dept.utilization}%`,
                              height: "100%",
                              backgroundColor:
                                dept.utilization >= 80
                                  ? "#ef4444"
                                  : dept.utilization >= 60
                                  ? "#f59e0b"
                                  : "#10b981",
                              transition: "width 0.3s ease",
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#374151",
                            minWidth: "40px",
                            textAlign: "right",
                          }}
                        >
                          {dept.utilization}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-message">No department data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadershipDashboard;
