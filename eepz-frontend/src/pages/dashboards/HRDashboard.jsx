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
import "../../styles/auth/HRDashboard.css";

const formatStatusLabel = (raw) => {
  if (!raw) return "";
  const lower = String(raw).toLowerCase().replace(/_/g, " ");
  return lower.replace(/\b\w/g, (c) => c.toUpperCase());
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
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
        budgetAllocationService.getAllDepartmentBudgets().catch(() => ({ data: [] })),
        budgetAllocationService.getAllDepartments().catch(() => ({ data: [] })),
        violationService.getAllViolations().catch(() => ({ data: [] })),
        internalOpportunityService.getAllOpportunities().catch(() => ({ success: false, data: [] })),
        nominationService.getAllNominations().catch(() => ({ success: false, data: [] })),
        lndService.getAllOrganizationAssignments(1, "", "", "", "", 1000).catch(() => ({ data: { items: [], totalCount: 0 } })),
        projectService.getAllProjects().catch(() => ({ data: [] })),
        getDeptHeadRatings().catch(() => ({ data: [] })),
        getAllManagerNominations().catch(() => ({ data: [] })),
        getDashboardSummary().catch(() => ({ data: null })),
        getApprovedProfiles().catch(() => ({ data: [] })),
        getStatistics().catch(() => ({ data: null })),
        getAllForms().catch(() => ({ data: [] })),
        listSubmitted().catch(() => ({ data: { data: { assessments: [] } } })),
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
          extractedSelfAssessments = selfAssessmentsRes.data.data.assessments.$values;
        }
      } else if (selfAssessmentsRes?.data?.assessments) {
        if (Array.isArray(selfAssessmentsRes.data.assessments)) {
          extractedSelfAssessments = selfAssessmentsRes.data.assessments;
        } else if (selfAssessmentsRes.data.assessments.$values) {
          extractedSelfAssessments = selfAssessmentsRes.data.assessments.$values;
        }
      } else {
        extractedSelfAssessments = extractData(selfAssessmentsRes);
      }

      let allPeriodAllocations = [];
      for (const budget of extractedBudgets) {
        try {
          const periodRes = await periodAllocationService.getPeriodAllocationsByBudget(budget.budgetId);
          if (periodRes.success) {
            const periods = extractData(periodRes);
            allPeriodAllocations = [...allPeriodAllocations, ...periods];
          }
        } catch { }
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
    const statusCount = { fulltime: 0, contract: 0, probation: 0, parttime: 0 };
    dashboardData.employees.forEach((emp) => {
      const status = (emp.employmentType || emp.status || "").toLowerCase();
      if (status.includes("full") || status.includes("permanent")) statusCount.fulltime++;
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
    const totalBudget = dashboardData.budgets.reduce((sum, b) => sum + (parseFloat(b.totalBudget) || 0), 0);
    const pendingNominations = dashboardData.nominations.filter(
      (n) =>
        n.status?.toLowerCase().includes("pending") ||
        n.managerApprovalStatus === "Pending" ||
        n.deptHeadApprovalStatus === "Pending" ||
        n.hrApprovalStatus === "Pending"
    ).length;

    const activeEmployees = dashboardData.employees.filter((e) => e.isActive === true).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newEmployeesThisMonth = dashboardData.employees.filter((e) => {
      const joinDate = new Date(e.joiningDate || e.createdDate || e.createdAt);
      return joinDate > thirtyDaysAgo;
    }).length;

    const totalLndAssignments = dashboardData.lndAssignments.length;
    const activeLndAssignments = dashboardData.lndAssignments.filter((a) => {
      const status = (a.assignmentStatus || a.status || "").toLowerCase().replace(/\s/g, "");
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
        const dept = dashboardData.departments.find((d) => d.departmentId === budget.departmentId);
        const deptName = dept?.departmentName || dept?.name || "";
        return deptName === selectedDepartment;
      });
    }

    return filteredBudgets
      .map((budget) => {
        const dept = dashboardData.departments.find((d) => d.departmentId === budget.departmentId);
        const deptName = dept?.departmentName || dept?.name || "Unknown";
        return {
          name: deptName.length > 10 ? deptName.substring(0, 10) + "..." : deptName,
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

  const getPerformanceOverview = () => {
    const totalNominations = dashboardData.managerNominations.length;
    const totalForms = dashboardData.appraisalForms.length;
    const totalAssessments = dashboardData.selfAssessments.length;
    const totalRatings = dashboardData.performanceRatings.length;

    const pendingNominations = dashboardData.managerNominations.filter((n) => {
      const status = (n.hrApprovalStatus || n.approvalStatus || n.status || "").toLowerCase();
      return status === "pending" || status === "submitted";
    }).length;

    const approvedNominations = dashboardData.managerNominations.filter((n) => {
      const status = (n.hrApprovalStatus || n.approvalStatus || n.status || "").toLowerCase();
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
      { name: "Pending Nominations", value: overview.pendingNominations, color: "#f59e0b" },
      { name: "Approved Nominations", value: overview.approvedNominations, color: "#10b981" },
      { name: "Pending Assessments", value: overview.pendingAssessments, color: "#22d3ee" },
      { name: "Completed Assessments", value: overview.completedAssessments, color: "#0891b2" },
    ].filter((item) => item.value > 0);
    return data;
  };

  if (loading) {
    return (
      <div className="hrd-loading-container">
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
  const perfOverview = getPerformanceOverview();

  const CHART_COLORS = ["#0891b2", "#06b6d4", "#10b981", "#f59e0b", "#14b8a6", "#22d3ee"];

  return (
    <div className="hrd-dashboard">
      <Breadcrumb items={[{ label: "HR Dashboard" }]} />

      <div className="hrd-stats-grid">
        <div className="hrd-stat-card">
          <div className="hrd-stat-icon hrd-stat-icon-primary">
            <Users size={28} />
          </div>
          <div className="hrd-stat-content">
            <h2><CountUp end={kpiStats.totalEmployees} duration={2} /></h2>
            <p>Total Users</p>
            <span className="hrd-stat-trend">
              <TrendingUp size={12} /> {kpiStats.newEmployeesThisMonth > 0 ? "100%" : "0%"} vs last month
            </span>
          </div>
        </div>

        <div className="hrd-stat-card">
          <div className="hrd-stat-icon hrd-stat-icon-success">
            <UserCheck size={28} />
          </div>
          <div className="hrd-stat-content">
            <h2><CountUp end={kpiStats.activeEmployees} duration={2} /></h2>
            <p>Active Users</p>
            <span className="hrd-stat-trend">100% active rate</span>
          </div>
        </div>

        <div className="hrd-stat-card">
          <div className="hrd-stat-icon hrd-stat-icon-warning">
            <Award size={28} />
          </div>
          <div className="hrd-stat-content">
            <h2><CountUp end={kpiStats.pendingNominations} duration={2} /></h2>
            <p>Pending Nominations</p>
            <span className="hrd-stat-trend">{dashboardData.nominations.length} total</span>
          </div>
        </div>

        <div className="hrd-stat-card">
          <div className="hrd-stat-icon hrd-stat-icon-info">
            <Briefcase size={28} />
          </div>
          <div className="hrd-stat-content">
            <h2><CountUp end={kpiStats.totalDepartments} duration={2} /></h2>
            <p>Departments</p>
            <span className="hrd-stat-trend">{kpiStats.activeProjects} projects</span>
          </div>
        </div>

        <div className="hrd-stat-card">
          <div className="hrd-stat-icon hrd-stat-icon-cyan">
            <Shield size={28} />
          </div>
          <div className="hrd-stat-content">
            <h2><CountUp end={perfOverview.totalForms} duration={2} /></h2>
            <p>Appraisal Forms</p>
            <span className="hrd-stat-trend">Performance tracking</span>
          </div>
        </div>
      </div>

      <div className="hrd-cards-container">
        <div className="hrd-row">
          <div className="hrd-card hrd-card-medium">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-person-badge"></i>
                <h3>Employee Status</h3>
              </div>
              <button className="hrd-card-filter-btn">
                <i className="bi bi-calendar3"></i> This Week
              </button>
            </div>
            <div className="hrd-card-body">
              <div className="hrd-employee-status-summary">
                <div className="hrd-status-total">
                  <span className="hrd-label">Total Employee</span>
                  <h2>{employeeStatus.total}</h2>
                </div>
                <div className="hrd-status-bar">
                  <div className="hrd-status-segment hrd-fulltime" style={{ width: `${employeeStatus.fulltimePercent}%` }}></div>
                  <div className="hrd-status-segment hrd-contract" style={{ width: `${employeeStatus.contractPercent}%` }}></div>
                  <div className="hrd-status-segment hrd-probation" style={{ width: `${employeeStatus.probationPercent}%` }}></div>
                  <div className="hrd-status-segment hrd-parttime" style={{ width: `${employeeStatus.parttimePercent}%` }}></div>
                </div>
              </div>

              <div className="hrd-status-grid">
                <div className="hrd-status-card">
                  <div className="hrd-status-legend">
                    <span className="hrd-legend-dot hrd-fulltime"></span>
                    <span>Fulltime ({employeeStatus.fulltimePercent}%)</span>
                  </div>
                  <h3>{employeeStatus.fulltime}</h3>
                </div>
                <div className="hrd-status-card">
                  <div className="hrd-status-legend">
                    <span className="hrd-legend-dot hrd-contract"></span>
                    <span>Contract ({employeeStatus.contractPercent}%)</span>
                  </div>
                  <h3>{employeeStatus.contract}</h3>
                </div>
                <div className="hrd-status-card">
                  <div className="hrd-status-legend">
                    <span className="hrd-legend-dot hrd-probation"></span>
                    <span>Probation ({employeeStatus.probationPercent}%)</span>
                  </div>
                  <h3>{employeeStatus.probation}</h3>
                </div>
                <div className="hrd-status-card">
                  <div className="hrd-status-legend">
                    <span className="hrd-legend-dot hrd-parttime"></span>
                    <span>Part-time ({employeeStatus.parttimePercent}%)</span>
                  </div>
                  <h3>{employeeStatus.parttime}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="hrd-card hrd-card-medium">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-cash-stack"></i>
                <h3>Budget Allocation</h3>
              </div>
              <select className="hrd-card-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                <option>All Departments</option>
                {dashboardData.departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentName || d.name}>
                    {d.departmentName || d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="hrd-card-body">
              {budgetByDept.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetByDept}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Total" fill="#0891b2" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Allocated" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Utilized" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="hrd-no-data">No budget data available</div>
              )}
            </div>
          </div>

          <div className="hrd-card hrd-card-medium">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-calendar-range"></i>
                <h3>Period Allocations</h3>
              </div>
            </div>
            <div className="hrd-card-body">
              {periodAllocations.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={periodAllocations}>
                    <defs>
                      <linearGradient id="colorAmountHR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="period" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0891b2" strokeWidth={2} fillOpacity={1} fill="url(#colorAmountHR)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="hrd-no-data">No period allocation data</div>
              )}
            </div>
          </div>
        </div>

        <div className="hrd-row">
          <div className="hrd-card hrd-card-small">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-folder"></i>
                <h3>Project Status</h3>
              </div>
            </div>
            <div className="hrd-card-body">
              {projectStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={projectStatus} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={false}>
                      {projectStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value, entry) => {
                        const item = projectStatus.find((d) => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="hrd-no-data">No project data</div>
              )}
            </div>
          </div>

          <div className="hrd-card hrd-card-small">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-award"></i>
                <h3>Nominations</h3>
              </div>
            </div>
            <div className="hrd-card-body">
              {nominationStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={nominationStatus} cx="50%" cy="45%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" label={false}>
                      {nominationStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value, entry) => {
                        const item = nominationStatus.find((d) => d.name === entry.value);
                        return `${item?.name || value}: ${item?.value || 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="hrd-no-data">No nomination data</div>
              )}
            </div>
          </div>

          <div className="hrd-card hrd-card-small">
            <div className="hrd-card-header">
              <div className="hrd-card-header-content">
                <i className="bi bi-star-fill"></i>
                <h3>Performance Management</h3>
              </div>
            </div>
            <div className="hrd-card-body">
              {(() => {
                const chartData = getPerformanceChartData();
                const totalItems = perfOverview.totalNominations + perfOverview.totalAssessments + perfOverview.totalForms;

                if (totalItems === 0) {
                  return <div className="hrd-no-data">No performance data available</div>;
                }

                return (
                  <>
                    <div className="hrd-perf-overview">
                      <div className="hrd-perf-stats-grid">
                        <div className="hrd-perf-stat-card hrd-perf-cyan">
                          <div className="hrd-perf-stat-value">{perfOverview.totalNominations}</div>
                          <div className="hrd-perf-stat-label">Nominations</div>
                        </div>
                        <div className="hrd-perf-stat-card hrd-perf-green">
                          <div className="hrd-perf-stat-value">{perfOverview.totalAssessments}</div>
                          <div className="hrd-perf-stat-label">Assessments</div>
                        </div>
                        <div className="hrd-perf-stat-card hrd-perf-yellow">
                          <div className="hrd-perf-stat-value">{perfOverview.totalForms}</div>
                          <div className="hrd-perf-stat-label">Forms</div>
                        </div>
                      </div>
                    </div>

                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" label={false}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="hrd-perf-chart-info">{perfOverview.totalForms} form{perfOverview.totalForms !== 1 ? "s" : ""} available</div>
                    )}
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
