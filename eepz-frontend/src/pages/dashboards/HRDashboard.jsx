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
  AreaChart,
  Area,
} from "recharts";
import CountUp from "react-countup";
import {
  Users,
  Briefcase,
  Award,
  UserCheck,
  TrendingUp,
  Shield,
} from "lucide-react";
import careerGoalsService from "../../services/hr_operations/hr/careerGoalsService";
import budgetAllocationService from "../../services/hr_operations/hr/budgetAllocationService";
import periodAllocationService from "../../services/hr_operations/hr/periodAllocationService";
import violationService from "../../services/hr_operations/hr/violationService";
import { employeeApi } from "../../services/feedbackmanagement/feedbackApi";
import internalOpportunityService from "../../services/internal/internalOpportunityService";
import nominationService from "../../services/internal/nominationService";
import lndService from "../../services/lnd/lndService";
import projectService from "../../services/project_management/projectService";
import { getDeptHeadRatings } from "../../services/performancemanagement/hr/appraisalapi";
import {
  getAllManagerNominations,
  getDashboardSummary,
  getApprovedProfiles,
  getStatistics,
} from "../../services/performancemanagement/hr/hrnominationapi";
import { getAllForms } from "../../services/performancemanagement/hr/formsapi";
import { listSubmitted } from "../../services/performancemanagement/hr/selfassessmentapi";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";

const formatStatusLabel = (raw) => {
  if (!raw) return "";
  const lower = String(raw).toLowerCase().replace(/_/g, " ");
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [dashboardData, setDashboardData] = useState({
    employees: [],
    budgets: [],
    departments: [],
    violations: [],
    goals: [],
    opportunities: [],
    nominations: [],
    periodAllocations: [],
    lndAssignments: [],
    projects: [],
    performanceRatings: [],
    managerNominations: [],
    nominationSummary: null,
    approvedProfiles: [],
    nominationStats: null,
    appraisalForms: [],
    selfAssessments: [],
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
        employeesRes,
        allGoalsRes,
        budgetsRes,
        departmentsRes,
        violationsRes,
        opportunitiesRes,
        nominationsRes,
        lndAssignmentsRes,
        projectsRes,
        performanceRatingsRes,
        managerNominationsRes,
        nominationSummaryRes,
        approvedProfilesRes,
        nominationStatsRes,
        appraisalFormsRes,
        selfAssessmentsRes,
      ] = await Promise.all([
        employeeApi.getAll().catch(() => ({ data: [] })),
        careerGoalsService.getAllGoals().catch(() => ({ data: [] })),
        budgetAllocationService
          .getAllDepartmentBudgets()
          .catch(() => ({ data: [] })),
        budgetAllocationService
          .getAllDepartments()
          .catch(() => ({ data: [] })),
        violationService.getAllViolations().catch(() => ({ data: [] })),
        internalOpportunityService
          .getAllOpportunities()
          .catch(() => ({ success: false, data: [] })),
        nominationService
          .getAllNominations()
          .catch(() => ({ success: false, data: [] })),
        lndService
          .getAllOrganizationAssignments(1, "", "", "", "", 1000)
          .catch(() => ({ data: { items: [], totalCount: 0 } })),
        projectService.getAllProjects().catch(() => ({ data: [] })),
        getDeptHeadRatings().catch(() => ({ data: [] })),
        getAllManagerNominations().catch(() => ({ data: [] })),
        getDashboardSummary().catch(() => ({ data: null })),
        getApprovedProfiles().catch(() => ({ data: [] })),
        getStatistics().catch(() => ({ data: null })),
        getAllForms().catch(() => ({ data: [] })),
        listSubmitted().catch(() => ({
          data: { data: { assessments: [] } },
        })),
      ]);

      const extractedEmployees = extractData(employeesRes);
      const extractedBudgets = extractData(budgetsRes);
      const extractedDepartments = extractData(departmentsRes);
      const extractedViolations = extractData(violationsRes);
      const extractedGoals = extractData(allGoalsRes);
      const extractedOpportunities = extractData(opportunitiesRes);
      const extractedNominations = extractData(nominationsRes);

      let extractedLndAssignments = [];
      if (lndAssignmentsRes?.data?.data?.items?.$values) {
        extractedLndAssignments = lndAssignmentsRes.data.data.items.$values;
      } else if (Array.isArray(lndAssignmentsRes?.data?.data?.items)) {
        extractedLndAssignments = lndAssignmentsRes.data.data.items;
      } else if (Array.isArray(lndAssignmentsRes?.data)) {
        extractedLndAssignments = lndAssignmentsRes.data;
      }

      const extractedProjects = extractData(projectsRes);
      const extractedPerformanceRatings = extractData(performanceRatingsRes);
      const extractedManagerNominations = extractData(managerNominationsRes);
      const extractedApprovedProfiles = extractData(approvedProfilesRes);
      const extractedAppraisalForms = extractData(appraisalFormsRes);

      let extractedSelfAssessments = [];
      if (selfAssessmentsRes?.data?.data?.assessments) {
        if (Array.isArray(selfAssessmentsRes.data.data.assessments)) {
          extractedSelfAssessments = selfAssessmentsRes.data.data.assessments;
        } else if (selfAssessmentsRes.data.data.assessments.$values) {
          extractedSelfAssessments =
            selfAssessmentsRes.data.data.assessments.$values;
        }
      } else if (selfAssessmentsRes?.data?.assessments) {
        if (Array.isArray(selfAssessmentsRes.data.assessments)) {
          extractedSelfAssessments = selfAssessmentsRes.data.assessments;
        } else if (selfAssessmentsRes.data.assessments.$values) {
          extractedSelfAssessments =
            selfAssessmentsRes.data.assessments.$values;
        }
      } else {
        extractedSelfAssessments = extractData(selfAssessmentsRes);
      }

      let allPeriodAllocations = [];
      for (const budget of extractedBudgets) {
        try {
          const periodRes =
            await periodAllocationService.getPeriodAllocationsByBudget(
              budget.budgetId
            );
          if (periodRes.success) {
            const periods = extractData(periodRes);
            allPeriodAllocations = [...allPeriodAllocations, ...periods];
          }
        } catch {
          console.log("Period allocations error");
        }
      }

      setDashboardData({
        employees: extractedEmployees,
        budgets: extractedBudgets,
        departments: extractedDepartments,
        violations: extractedViolations,
        goals: extractedGoals,
        opportunities: extractedOpportunities,
        nominations: extractedNominations,
        periodAllocations: allPeriodAllocations,
        lndAssignments: extractedLndAssignments,
        projects: extractedProjects,
        performanceRatings: extractedPerformanceRatings,
        managerNominations: extractedManagerNominations,
        nominationSummary: nominationSummaryRes.data,
        approvedProfiles: extractedApprovedProfiles,
        nominationStats: nominationStatsRes.data,
        appraisalForms: extractedAppraisalForms,
        selfAssessments: extractedSelfAssessments,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
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

  const getKPIStats = () => {
    const totalBudget = dashboardData.budgets.reduce(
      (sum, b) => sum + (parseFloat(b.totalBudget) || 0),
      0
    );
    const pendingNominations = dashboardData.nominations.filter(
      (n) =>
        n.status?.toLowerCase().includes("pending") ||
        n.managerApprovalStatus === "Pending" ||
        n.deptHeadApprovalStatus === "Pending" ||
        n.hrApprovalStatus === "Pending"
    ).length;

    const activeEmployees = dashboardData.employees.filter(
      (e) => e.isActive === true
    ).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newEmployeesThisMonth = dashboardData.employees.filter((e) => {
      const joinDate = new Date(
        e.joiningDate || e.createdDate || e.createdAt
      );
      return joinDate > thirtyDaysAgo;
    }).length;

    const totalLndAssignments = dashboardData.lndAssignments.length;
    const activeLndAssignments = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      return status === "inprogress" || status === "active";
    }).length;

    return {
      totalEmployees: dashboardData.employees.length,
      activeEmployees: activeEmployees || dashboardData.employees.length,
      totalDepartments: dashboardData.departments.length,
      pendingNominations,
      totalLndAssignments,
      activeLndAssignments,
      activeProjects: dashboardData.projects.filter((p) => p.isActive).length,
      newEmployeesThisMonth,
      totalBudget,
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

  const getPeriodAllocations = () => {
    const periodMap = {};
    dashboardData.periodAllocations.forEach((pa) => {
      const key = pa.period || "Unknown";
      if (!periodMap[key]) periodMap[key] = 0;
      periodMap[key] += parseFloat(pa.allocatedAmount) || 0;
    });
    return Object.entries(periodMap)
      .map(([period, amount]) => ({ period, amount }))
      .slice(0, 6);
  };

  const getProjectStatus = () => {
    const statusCount = {};
    dashboardData.projects.forEach((p) => {
      const raw = p.projectStatus || p.status || "Unknown";
      const key = formatStatusLabel(raw);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    return Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  };

  const getNominationStatus = () => {
    const statusCount = {};
    dashboardData.nominations.forEach((nom) => {
      const raw = nom.status || "Pending";
      const key = formatStatusLabel(raw);
      statusCount[key] = (statusCount[key] || 0) + 1;
    });
    return Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  };

  const getLndOverview = () => {
    if (
      !dashboardData.lndAssignments ||
      dashboardData.lndAssignments.length === 0
    ) {
      return [];
    }

    const completed = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      return status === "completed";
    }).length;

    const active = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      return status === "inprogress" || status === "active";
    }).length;

    const pending = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "")
        .toLowerCase()
        .replace(/\s/g, "");
      return status === "pending" || status === "requested";
    }).length;

    const result = [];
    if (completed > 0)
      result.push({ name: "Completed", value: completed, color: "#10b981" });
    if (active > 0)
      result.push({ name: "In Progress", value: active, color: "#0F62FE" });
    if (pending > 0)
      result.push({ name: "Pending", value: pending, color: "#f59e0b" });

    if (result.length === 0 && dashboardData.lndAssignments.length > 0) {
      return [
        {
          name: "Total Assignments",
          value: dashboardData.lndAssignments.length,
          color: "#0F62FE",
        },
      ];
    }

    return result;
  };

  const getPerformanceOverview = () => {
    const totalNominations = dashboardData.managerNominations.length;
    const totalForms = dashboardData.appraisalForms.length;
    const totalAssessments = dashboardData.selfAssessments.length;
    const totalRatings = dashboardData.performanceRatings.length;

    const pendingNominations = dashboardData.managerNominations.filter((n) => {
      const status = (
        n.hrApprovalStatus ||
        n.approvalStatus ||
        n.status ||
        ""
      ).toLowerCase();
      return status === "pending" || status === "submitted";
    }).length;

    const approvedNominations = dashboardData.managerNominations.filter((n) => {
      const status = (
        n.hrApprovalStatus ||
        n.approvalStatus ||
        n.status ||
        ""
      ).toLowerCase();
      return status === "approved";
    }).length;

    const pendingAssessments = dashboardData.selfAssessments.filter((a) => {
      const status = (a.status || "").toLowerCase();
      return status === "pending" || status === "submitted";
    }).length;

    const completedAssessments = dashboardData.selfAssessments.filter((a) => {
      const status = (a.status || "").toLowerCase();
      return status === "approved" || status === "completed";
    }).length;

    return {
      totalNominations,
      totalForms,
      totalAssessments,
      totalRatings,
      pendingNominations,
      approvedNominations,
      pendingAssessments,
      completedAssessments,
    };
  };

  const getPerformanceChartData = () => {
    const overview = getPerformanceOverview();

    const data = [
      {
        name: "Pending Nominations",
        value: overview.pendingNominations,
        color: "#f59e0b",
      },
      {
        name: "Approved Nominations",
        value: overview.approvedNominations,
        color: "#10b981",
      },
      {
        name: "Pending Assessments",
        value: overview.pendingAssessments,
        color: "#ef4444",
      },
      {
        name: "Completed Assessments",
        value: overview.completedAssessments,
        color: "#0F62FE",
      },
    ].filter((item) => item.value > 0);

    return data;
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

  const employeeStatus = getEmployeeStatus();
  const kpiStats = getKPIStats();
  const budgetByDept = getBudgetByDepartment();
  const periodAllocations = getPeriodAllocations();
  const projectStatus = getProjectStatus();
  const nominationStatus = getNominationStatus();
  const lndOverview = getLndOverview();
  const perfOverview = getPerformanceOverview();

  const CHART_COLORS = [
    "#97247E",
    "#0F62FE",
    "#10b981",
    "#f59e0b",
    "#E01950",
    "#8b5cf6",
  ];

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "HR Dashboard" }]} />

      <div className="admin-kpi-grid">
        <div
          className="admin-kpi-card"
          onClick={() => navigate("/auth/admin/users")}
        >
          <div className="admin-kpi-icon admin-pink">
            <Users size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalEmployees} duration={2} />
            </h2>
            <p>Total Users</p>
            <span className="admin-kpi-subtitle">
              <TrendingUp size={12} />{" "}
              {kpiStats.newEmployeesThisMonth > 0 ? "100%" : "0%"} vs last month
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/auth/admin/users")}
        >
          <div className="admin-kpi-icon admin-green">
            <UserCheck size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.activeEmployees} duration={2} />
            </h2>
            <p>Active Users</p>
            <span className="admin-kpi-subtitle">100% active rate</span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() =>
            navigate("/performancemanagement/hr/hrnomination")
          }
        >
          <div className="admin-kpi-icon admin-yellow">
            <Award size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={perfOverview.pendingNominations} duration={2} />
            </h2>
            <p>Pending Nominations</p>
            <span className="admin-kpi-subtitle">
              {perfOverview.totalNominations} total
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() => navigate("/hr/departments")}
        >
          <div className="admin-kpi-icon admin-blue">
            <Briefcase size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={kpiStats.totalDepartments} duration={2} />
            </h2>
            <p>Departments</p>
            <span className="admin-kpi-subtitle">
              {kpiStats.activeProjects} projects
            </span>
          </div>
        </div>

        <div
          className="admin-kpi-card"
          onClick={() =>
            navigate("/performancemanagement/hr/formslist")
          }
        >
          <div className="admin-kpi-icon admin-purple">
            <Shield size={28} />
          </div>
          <div className="admin-kpi-content">
            <h2>
              <CountUp end={perfOverview.totalForms} duration={2} />
            </h2>
            <p>Appraisal Forms</p>
            <span className="admin-kpi-subtitle">Performance tracking</span>
          </div>
        </div>
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          {/* Employee Status */}
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
                      Fulltime ({employeeStatus.fulltimePercent}
                      %)
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
                      Contract ({employeeStatus.contractPercent}
                      %)
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
                      Probation ({employeeStatus.probationPercent}
                      %)
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
                      Part-time ({employeeStatus.parttimePercent}
                      %)
                    </span>
                  </div>
                  <h3>{employeeStatus.parttime}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Allocation */}
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

          {/* Period Allocations */}
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-calendar-range"></i>
                <h3>Period Allocations</h3>
              </div>
            </div>
            <div className="card-body">
              {periodAllocations.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={periodAllocations}>
                    <defs>
                      <linearGradient
                        id="colorAmount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#27235c"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#27235c"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis dataKey="period" stroke="#9ca3af" fontSize={11} />
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
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#27235c"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  No period allocation data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECOND ROW: project, nominations, performance, L&D */}
        <div className="dashboard-row">
          {/* Project Status */}
          <div className="dashboard-card card-small">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-folder"></i>
                <h3>Project Status</h3>
              </div>
            </div>
            <div className="card-body">
              {projectStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={projectStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {projectStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <button
                    className="card-view-btn"
                    onClick={() => navigate("/hr/dashboard/projectmgmt")}
                  >
                    View All Projects
                  </button>
                </>
              ) : (
                <div className="no-data-message">No project data</div>
              )}
            </div>
          </div>

          {/* Nominations */}
          <div className="dashboard-card card-small">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-award"></i>
                <h3>Nominations</h3>
              </div>
            </div>
            <div className="card-body">
              {nominationStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={nominationStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {nominationStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <button
                    className="card-view-btn"
                    onClick={() => navigate("/internal/nominations")}
                  >
                    View All Nominations
                  </button>
                </>
              ) : (
                <div className="no-data-message">No nomination data</div>
              )}
            </div>
          </div>

          {/* Performance Management */}
          <div className="dashboard-card card-small">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-star-fill"></i>
                <h3>Performance Management</h3>
              </div>
            </div>
            <div className="card-body">
              {(() => {
                const chartData = getPerformanceChartData();
                const totalItems =
                  perfOverview.totalNominations +
                  perfOverview.totalAssessments +
                  perfOverview.totalForms;

                if (totalItems === 0) {
                  return (
                    <div className="no-data-message">
                      No performance data available
                    </div>
                  );
                }

                return (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "0.5rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            background: "#f0f9ff",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            textAlign: "center",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "bold",
                              color: "#0F62FE",
                            }}
                          >
                            {perfOverview.totalNominations}
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "#1e40af",
                            }}
                          >
                            Nominations
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#f0fdf4",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            textAlign: "center",
                            border: "1px solid #86efac",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "bold",
                              color: "#10b981",
                            }}
                          >
                            {perfOverview.totalAssessments}
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "#047857",
                            }}
                          >
                            Assessments
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#fef3c7",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            textAlign: "center",
                            border: "1px solid #fcd34d",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "bold",
                              color: "#d97706",
                            }}
                          >
                            {perfOverview.totalForms}
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "#b45309",
                            }}
                          >
                            Forms
                          </div>
                        </div>
                      </div>
                    </div>

                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ value }) => value}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {perfOverview.totalForms} form
                        {perfOverview.totalForms !== 1 ? "s" : ""} available
                      </div>
                    )}

                    <button
                      className="card-view-btn"
                      onClick={() => navigate("/hr/dashboard/performance")}
                    >
                      View Performance Dashboard
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Learning & Development */}
          <div className="dashboard-card card-small">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-book"></i>
                <h3>Learning & Development</h3>
              </div>
            </div>
            <div className="card-body">
              {(() => {
                const lndData = lndOverview;
                const totalAssignments =
                  dashboardData.lndAssignments?.length || 0;

                if (totalAssignments === 0) {
                  return (
                    <div className="no-data-message">
                      No L&D assignments available
                    </div>
                  );
                }

                if (lndData.length === 0) {
                  return (
                    <div className="no-data-message">
                      {totalAssignments} assignment
                      {totalAssignments !== 1 ? "s" : ""} found
                      <br />
                      <small
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "0.5rem",
                          display: "block",
                        }}
                      >
                        Status data not available
                      </small>
                    </div>
                  );
                }

                return (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={lndData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {lndData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <button
                      className="card-view-btn"
                      onClick={() => navigate("/hr/lnd/dashboard")}
                    >
                      View All Assignments ({totalAssignments})
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
