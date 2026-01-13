import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import CountUp from "react-countup";
import { Users, Target, Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";
import goalService from "../../services/goals/goalService";
import nominationService from "../../services/internal/nominationService";
import slaService from "../../services/sla/slaService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/DepartmentHeadDashboard.css";
import { getComplianceSummary } from "../../utils/sla/slaCalculations";

const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    pendingGoalApprovals: [], pendingNominations: [], pendingPerformanceReviews: [],
    approvedPerformanceReviews: [], departmentSLAs: [], departmentEmployees: [],
    allGoals: [], approvedNominations: [], complianceTrend: []
  });

  useEffect(() => { fetchAllData(); }, []);

  const getUserData = () => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  };

  const getToken = () => localStorage.getItem("token") || localStorage.getItem("accessToken");

  const createApiPort5222 = () => {
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5222";
    const instance = axios.create({
      baseURL: `${BASE_URL}/api`,
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    instance.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    }, (error) => Promise.reject(error));

    return instance;
  };

  const getDeptHeadSubmittedRatings = () => createApiPort5222().get("/DeptHeadApprovals/submitted-ratings");
  const getApprovedEmployees = (page = 1, pageSize = 100) => createApiPort5222().get("/DeptHeadApprovals/approved-employees", { params: { page, pageSize } });

  const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const data = response.data || response;
    const paths = [data?.data?.items, data?.data?.$values, data?.data, data?.items, data?.$values, data];
    return paths.find(p => Array.isArray(p)) || [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const user = getUserData();
      if (!user) {
        toast.error("User not found. Please login again.");
        navigate("/login");
        return;
      }

      const deptHeadId = user.empMasterId || user.employeeMasterId || user.userId || user.id;

      const [
        pendingGoalApprovalsRes, pendingNominationsRes, performanceReviewsRes,
        approvedEmployeesRes, allGoalsRes, allEmployeesRes, allSlasRes
      ] = await Promise.all([
        goalService.getPendingApprovals().catch(() => ({ data: [] })),
        nominationService.getPendingDeptHeadReview().catch(() => ({ success: false, data: [] })),
        getDeptHeadSubmittedRatings().catch(() => ({ data: [] })),
        getApprovedEmployees(1, 100).catch(() => ({ data: [] })),
        goalService.queryGoals({ pageSize: 1000 }).catch(() => ({ data: [] })),
        slaService.getAllEmployees().catch(() => ({ data: [] })),
        slaService.getAllSLAs().catch(() => ({ success: false, data: [] }))
      ]);

      const extractedAllEmployees = extractData(allEmployeesRes);
      const allSlas = allSlasRes?.success && Array.isArray(allSlasRes.data) ? allSlasRes.data : [];

      const deptHeadEmployee = extractedAllEmployees.find((emp) => {
        const empId = emp.empMasterId || emp.employeeMasterId || emp.userId || emp.id;
        return String(empId) === String(deptHeadId);
      });

      const departmentId = deptHeadEmployee ? (deptHeadEmployee.departmentId || deptHeadEmployee.deptId || deptHeadEmployee.department?.departmentId || deptHeadEmployee.department?.id || null) : null;
      const deptSLAs = departmentId ? allSlas.filter((sla) => String(sla.departmentId) === String(departmentId)) : allSlas;

      const extractedAllGoals = extractData(allGoalsRes);
      const derivedPendingApprovals = extractedAllGoals.filter((g) => {
        const s = (g.status || g.goalStatus || "").toLowerCase();
        return s === "pending_depthead_review" || s === "submitted_to_depthead" || s === "pending_approval" || s === "pending";
      });

      let complianceTrendData = [];
      if (deptSLAs.length > 0) {
        const summary = getComplianceSummary(deptSLAs);
        complianceTrendData = [{
          month: "Current",
          compliance: Number(summary.compliancePercentage || 0),
          totalSLAs: summary.totalSLAs,
          onTimeSLAs: summary.onTimeSLAs,
          breachedSLAs: summary.breachedSLAs
        }];
      }

      const extractedPerformanceReviews = extractData(performanceReviewsRes);
      const pendingPerformanceReviews = extractedPerformanceReviews.filter((r) => {
        const status = (r.status || r.reviewStatus || "").toLowerCase();
        return status === "pending" || status === "submitted" || status === "awaiting_approval" || status === "pending_depthead_review" || status === "pending_approval";
      });

      setDashboardData({
        pendingGoalApprovals: derivedPendingApprovals,
        pendingNominations: extractData(pendingNominationsRes),
        pendingPerformanceReviews,
        approvedPerformanceReviews: extractData(approvedEmployeesRes),
        departmentSLAs: deptSLAs,
        departmentEmployees: extractedAllEmployees,
        allGoals: extractedAllGoals,
        approvedNominations: extractData(pendingNominationsRes).filter((n) => n.status?.toLowerCase() === "approved"),
        complianceTrend: complianceTrendData
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getKPIStats = () => {
    const overdueSLAs = dashboardData.departmentSLAs.filter((s) => {
      const deadline = new Date(s.deadline || s.dueDate);
      return deadline < new Date() && s.status?.toLowerCase() !== "closed";
    }).length;

    return {
      totalTeamMembers: dashboardData.departmentEmployees.length,
      pendingGoalApprovals: dashboardData.pendingGoalApprovals.length,
      pendingNominations: dashboardData.pendingNominations.length,
      pendingPerformanceReviews: dashboardData.pendingPerformanceReviews.length,
      totalDepartmentSLAs: dashboardData.departmentSLAs.length,
      overdueSLAs
    };
  };

  const getGoalsOverview = () => {
    const goals = dashboardData.allGoals;
    if (!goals?.length) return { total: 0, completed: 0, inProgress: 0, pending: 0, chartData: [] };

    const completed = goals.filter((g) => (g.status || g.goalStatus || "").toLowerCase() === "completed").length;
    const inProgress = goals.filter((g) => (g.status || g.goalStatus || "").toLowerCase() === "inprogress").length;
    const pending = goals.filter((g) => ["pending", "open", "approved"].includes((g.status || g.goalStatus || "").toLowerCase())).length;

    // BLUE THEME CHART COLORS
    const chartData = [
      completed > 0 && { name: "Completed", value: completed, fill: "#3B82F6" },
      inProgress > 0 && { name: "In Progress", value: inProgress, fill: "#60A5FA" },
      pending > 0 && { name: "Pending", value: pending, fill: "#1E40AF" }
    ].filter(Boolean);

    return { total: goals.length, completed, inProgress, pending, chartData };
  };

  const getPerformanceReviewsOverview = () => {
    const pending = dashboardData.pendingPerformanceReviews.length;
    const approved = dashboardData.approvedPerformanceReviews.length;
    // BLUE THEME CHART COLORS
    const chartData = [
      pending > 0 && { name: "Pending Review", value: pending, fill: "#60A5FA" },
      approved > 0 && { name: "Approved", value: approved, fill: "#3B82F6" }
    ].filter(Boolean);
    return { total: pending + approved, pending, approved, chartData };
  };

  const getNominationsOverview = () => {
    const nominations = dashboardData.pendingNominations;
    const pending = nominations.filter((n) => n.status?.toLowerCase().includes("pending")).length;
    const approved = nominations.filter((n) => n.status?.toLowerCase() === "approved").length;
    const rejected = nominations.filter((n) => n.status?.toLowerCase().includes("rejected")).length;

    // BLUE THEME CHART COLORS
    const chartData = [
      pending > 0 && { name: "Pending", value: pending, fill: "#60A5FA" },
      approved > 0 && { name: "Approved", value: approved, fill: "#3B82F6" },
      rejected > 0 && { name: "Rejected", value: rejected, fill: "#1E40AF" }
    ].filter(Boolean);

    return { total: nominations.length, pending, approved, rejected, chartData };
  };

  const getSLAOverview = () => {
    const slas = dashboardData.departmentSLAs;
    if (!slas?.length) return { total: 0, open: 0, overdue: 0, closed: 0, chartData: [] };

    const closed = slas.filter((s) => s.status?.toLowerCase() === "closed").length;
    const open = slas.filter((s) => ["open", "inprogress"].includes(s.status?.toLowerCase())).length;
    const overdue = slas.filter((s) => {
      const deadline = new Date(s.deadline || s.dueDate);
      return deadline < new Date() && s.status?.toLowerCase() !== "closed";
    }).length;

    // BLUE THEME CHART COLORS
    const chartData = [
      overdue > 0 && { name: "Overdue", value: overdue, fill: "#1E40AF" },
      open > 0 && { name: "Open", value: open, fill: "#60A5FA" },
      closed > 0 && { name: "Closed", value: closed, fill: "#3B82F6" }
    ].filter(Boolean);

    return { total: slas.length, open, overdue, closed, chartData };
  };

  if (loading) return (
    <div className="ada-loading-container">
      <div className="spinner-border" style={{ width: '3rem', height: '3rem', color: '#3B82F6' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const kpiStats = getKPIStats();
  const goalsData = getGoalsOverview();
  const performanceData = getPerformanceReviewsOverview();
  const nominationsData = getNominationsOverview();
  const slaData = getSLAOverview();
  const complianceTrend = dashboardData.complianceTrend || [];
  const hasCompliancePoints = complianceTrend.some((p) => !isNaN(p.compliance));

  const kpiCards = [
    { icon: Users, value: kpiStats.totalTeamMembers, label: "Team Members", subtitle: "Department size", iconClass: "admin-purple" },
    { icon: Target, value: kpiStats.pendingGoalApprovals, label: "Goal Approvals", subtitle: "Pending review", iconClass: "admin-blue", showTrend: true },
    { icon: Shield, value: kpiStats.pendingNominations, label: "Nominations", subtitle: "Pending approval", iconClass: "admin-pink" },
    { icon: CheckCircle, value: kpiStats.pendingPerformanceReviews, label: "Performance Reviews", subtitle: "Awaiting approval", iconClass: "admin-green" },
    { icon: AlertTriangle, value: kpiStats.totalDepartmentSLAs, label: "Department SLAs", subtitle: `${kpiStats.overdueSLAs} overdue`, iconClass: "admin-cyan" }
  ];

  const StatCard = ({ type, value, label }) => (
    <div className={`emp-stat-card emp-stat-${type}`}>
      <div className="emp-stat-value">{value}</div>
      <div className="emp-stat-label">{label}</div>
    </div>
  );

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Department Head Dashboard" }]} />

      <div className="admin-kpi-grid">
        {kpiCards.map(({ icon: IconComponent, value, label, subtitle, iconClass, showTrend }, i) => (
          <div key={i} className="admin-kpi-card">
            <div className={`admin-kpi-icon ${iconClass}`}>
              <IconComponent size={28} />
            </div>
            <div className="admin-kpi-content">
              <h2><CountUp end={value} duration={2} /></h2>
              <p>{label}</p>
              <span className="admin-kpi-subtitle">
                {showTrend && <TrendingUp size={12} />} {subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye" />
                <h3>Goals Overview</h3>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="total" value={goalsData.total} label="Total" />
                    <StatCard type="completed" value={goalsData.completed} label="Completed" />
                    <StatCard type="inprogress" value={goalsData.inProgress} label="In Progress" />
                  </div>
                  {goalsData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={goalsData.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
                          {goalsData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = goalsData.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No goal data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up" />
                <h3>Performance Reviews</h3>
              </div>
            </div>
            <div className="card-body">
              {performanceData.total > 0 ? (
                <>
                  <div className="emp-stats-grid emp-stats-2col">
                    <StatCard type="pending" value={performanceData.pending} label="Pending" />
                    <StatCard type="approved" value={performanceData.approved} label="Approved" />
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={[{ name: "Pending", value: performanceData.pending }, { name: "Approved", value: performanceData.approved }]} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#60A5FA" />
                        <Cell fill="#3B82F6" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No pending reviews</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-award" />
                <h3>Nomination Reviews</h3>
              </div>
            </div>
            <div className="card-body">
              {nominationsData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="pending" value={nominationsData.pending} label="Pending" />
                    <StatCard type="approved" value={nominationsData.approved} label="Approved" />
                    <StatCard type="rejected" value={nominationsData.rejected} label="Rejected" />
                  </div>
                  {nominationsData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={nominationsData.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
                          {nominationsData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = nominationsData.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No nominations</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row dashboard-row-2">
          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-file-earmark-check" />
                <h3>Department SLAs</h3>
              </div>
            </div>
            <div className="card-body">
              {slaData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="total" value={slaData.total} label="Total" />
                    <StatCard type="overdue" value={slaData.overdue} label="Overdue" />
                    <StatCard type="closed" value={slaData.closed} label="Closed" />
                  </div>
                  {slaData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={slaData.chartData} cx="50%" cy="45%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" label={false}>
                          {slaData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = slaData.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No SLA data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up-arrow" />
                <h3>Compliance Trend</h3>
              </div>
            </div>
            <div className="card-body">
              {hasCompliancePoints ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="compliance" value={`${complianceTrend[0].compliance}%`} label="Compliance Rate" />
                    <StatCard type="ontime" value={complianceTrend[0].onTimeSLAs} label="On-time" />
                    <StatCard type="breached" value={complianceTrend[0].breachedSLAs} label="Breached" />
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={complianceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="compliance" stroke="#3B82F6" strokeWidth={3} dot={{ fill: "#3B82F6", r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="no-data-message">No compliance data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHeadDashboard;
