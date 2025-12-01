import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Bar,
} from "recharts";
import CountUp from "react-countup";
import {
  Users,
  UserCheck,
  Clock,
  Building2,
  Shield,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import userService from "../../services/auth/userService";
import roleService from "../../services/auth/roleService";
import departmentService from "../../services/auth/departmentService";
import ChangeRequestService from "../../services/auth/changeRequestService";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    users: [],
    roles: [],
    departments: [],
    changeRequests: [],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, deptsRes, requestsRes] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles(),
        departmentService.getAllDepartments(),
        ChangeRequestService.getAllChangeRequests(),
      ]);

      setDashboardData({
        users: usersRes.success ? usersRes.data || [] : [],
        roles: rolesRes.success ? rolesRes.data || [] : [],
        departments: deptsRes.success ? deptsRes.data || [] : [],
        changeRequests: requestsRes.success ? requestsRes.data || [] : [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getNonAdminUsers = () => {
    return dashboardData.users.filter((user) => user.roleName !== "Admin");
  };

  const getStats = () => {
    const nonAdminUsers = getNonAdminUsers();
    const activeUsers = nonAdminUsers.filter((u) => u.isActive).length;
    const inactiveUsers = nonAdminUsers.filter((u) => !u.isActive).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = nonAdminUsers.filter((u) => {
      const joinDate = new Date(u.joiningDate);
      return joinDate > thirtyDaysAgo;
    }).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyNewUsers = nonAdminUsers.filter((u) => {
      const joinDate = new Date(u.joiningDate);
      return joinDate > sevenDaysAgo;
    }).length;

    const pendingRequests = dashboardData.changeRequests.filter(
      (r) => r.status === "Pending"
    ).length;
    const approvedRequests = dashboardData.changeRequests.filter(
      (r) => r.status === "Approved"
    ).length;
    const rejectedRequests = dashboardData.changeRequests.filter(
      (r) => r.status === "Rejected"
    ).length;

    const systemRoles = dashboardData.roles.filter((r) => r.isSystemRole).length;
    const customRoles = dashboardData.roles.filter((r) => !r.isSystemRole).length;

    const activeRate =
      nonAdminUsers.length > 0
        ? ((activeUsers / nonAdminUsers.length) * 100).toFixed(1)
        : 0;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const prevMonthUsers = nonAdminUsers.filter((u) => {
      const joinDate = new Date(u.joiningDate);
      return joinDate > sixtyDaysAgo && joinDate <= thirtyDaysAgo;
    }).length;

    const growthRate =
      prevMonthUsers > 0
        ? (((newUsers - prevMonthUsers) / prevMonthUsers) * 100).toFixed(1)
        : newUsers > 0
        ? 100
        : 0;

    return {
      totalUsers: nonAdminUsers.length,
      activeUsers,
      inactiveUsers,
      newUsers,
      weeklyNewUsers,
      totalRoles: dashboardData.roles.length,
      systemRoles,
      customRoles,
      totalDepartments: dashboardData.departments.length,
      totalRequests: dashboardData.changeRequests.length,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      activeRate: parseFloat(activeRate),
      growthRate: parseFloat(growthRate),
    };
  };

  const getDepartmentDistribution = () => {
    const nonAdminUsers = getNonAdminUsers();
    const deptCount = {};

    nonAdminUsers.forEach((user) => {
      const dept = user.departmentName || "Unassigned";
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    return Object.entries(deptCount)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const getRoleDistribution = () => {
    const nonAdminUsers = getNonAdminUsers();
    const roleCount = {};

    nonAdminUsers.forEach((user) => {
      const role = user.roleName || "Unassigned";
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return Object.entries(roleCount)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getMonthlyTrend = () => {
    const nonAdminUsers = getNonAdminUsers();
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const newInMonth = nonAdminUsers.filter((user) => {
        const joinDate = new Date(user.joiningDate);
        return joinDate >= monthStart && joinDate <= monthEnd;
      }).length;

      const activeInMonth = nonAdminUsers.filter((user) => {
        const joinDate = new Date(user.joiningDate);
        return joinDate <= monthEnd && user.isActive;
      }).length;

      months.push({
        month: monthName,
        New: newInMonth,
        Active: activeInMonth,
      });
    }

    return months;
  };

  const getRequestStatusData = () => {
    return [
      { name: "Pending", value: stats.pendingRequests },
      { name: "Approved", value: stats.approvedRequests },
      { name: "Rejected", value: stats.rejectedRequests },
    ];
  };

  const getDepartmentActivityRadar = () => {
    const nonAdminUsers = getNonAdminUsers();
    const topDepts = getDepartmentDistribution().slice(0, 5);

    return topDepts.map((dept) => {
      const deptUsers = nonAdminUsers.filter((u) => {
        const deptName = u.departmentName || "Unassigned";
        return (
          deptName === dept.name ||
          (dept.name.includes("...") &&
            deptName.startsWith(dept.name.replace("...", "")))
        );
      });
      const active = deptUsers.filter((u) => u.isActive).length;
      const inactive = deptUsers.filter((u) => !u.isActive).length;

      return {
        department: dept.name,
        Active: active,
        Inactive: inactive,
      };
    });
  };

  const getRequestTrendData = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const requestsInMonth = dashboardData.changeRequests.filter((req) => {
        const requestDate = new Date(req.requestedAt);
        return requestDate >= monthStart && requestDate <= monthEnd;
      });

      months.push({
        month: monthName,
        Total: requestsInMonth.length,
        Approved: requestsInMonth.filter((r) => r.status === "Approved").length,
        Pending: requestsInMonth.filter((r) => r.status === "Pending").length,
      });
    }

    return months;
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

  const stats = getStats();
  const departmentData = getDepartmentDistribution();
  const roleData = getRoleDistribution();
  const monthlyTrend = getMonthlyTrend();
  const requestStatusData = getRequestStatusData();
  const radarData = getDepartmentActivityRadar();
  const requestTrendData = getRequestTrendData();

  const COLORS = [
    "#97247E",
    "#E01950",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <div className="ada-dashboard">
      <Breadcrumb
        items={[
          {
            label: "Admin Dashboard",
          },
        ]}
      />

      {/* STATISTICS CARDS */}
      <div className="ada-stats-grid">
        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-primary">
            <Users size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.totalUsers} duration={2} />
            </h3>
            <p className="ada-stat-label">Total Users</p>
            <div className="ada-stat-trend">
              {stats.growthRate >= 0 ? (
                <TrendingUp size={14} className="ada-trend-icon-up" />
              ) : (
                <TrendingDown size={14} className="ada-trend-icon-down" />
              )}
              <span>{Math.abs(stats.growthRate)}% vs last month</span>
            </div>
          </div>
        </div>

        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-success">
            <UserCheck size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.activeUsers} duration={2} />
            </h3>
            <p className="ada-stat-label">Active Users</p>
            <div className="ada-stat-trend">
              <span className="ada-trend-neutral">
                {stats.activeRate}% active rate
              </span>
            </div>
          </div>
        </div>

        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-warning">
            <Clock size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.pendingRequests} duration={2} />
            </h3>
            <p className="ada-stat-label">Pending Requests</p>
            <div className="ada-stat-trend">
              <span className="ada-trend-neutral">Awaiting review</span>
            </div>
          </div>
        </div>

        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-info">
            <Building2 size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.totalDepartments} duration={2} />
            </h3>
            <p className="ada-stat-label">Departments</p>
            <div className="ada-stat-trend">
              <span className="ada-trend-neutral">
                {stats.totalRoles} roles
              </span>
            </div>
          </div>
        </div>

        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-purple">
            <Shield size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.systemRoles} duration={2} />
            </h3>
            <p className="ada-stat-label">System Roles</p>
            <div className="ada-stat-trend">
              <span className="ada-trend-neutral">
                {stats.customRoles} custom
              </span>
            </div>
          </div>
        </div>

        <div className="ada-stat-card">
          <div className="ada-stat-icon ada-stat-icon-cyan">
            <UserPlus size={24} />
          </div>
          <div className="ada-stat-content">
            <h3 className="ada-stat-value">
              <CountUp end={stats.weeklyNewUsers} duration={2} />
            </h3>
            <p className="ada-stat-label">New This Week</p>
            <div className="ada-stat-trend">
              <span className="ada-trend-neutral">Last 7 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="ada-actions-card">
        <div className="ada-actions-grid">
          <button
            className="ada-action-btn"
            onClick={() => navigate("/admin/users")}
          >
            <i className="bi bi-person-plus"></i>
            <span>Manage Users</span>
          </button>
          <button
            className="ada-action-btn"
            onClick={() => navigate("/admin/roles")}
          >
            <i className="bi bi-shield-check"></i>
            <span>Configure Roles</span>
          </button>
          <button
            className="ada-action-btn"
            onClick={() => navigate("/admin/departments")}
          >
            <i className="bi bi-building"></i>
            <span>Departments</span>
          </button>
          <button
            className="ada-action-btn"
            onClick={() => navigate("/admin/change-requests/pending")}
          >
            <i className="bi bi-clipboard-check"></i>
            <span>Review Requests</span>
          </button>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="ada-charts-grid">
        {/* USER GROWTH TREND */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-graph-up-arrow" />
              <h3>User Growth Trend</h3>
            </div>
            <span className="card-filter-btn-dark">Last 6 Months</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#97247E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#97247E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis dataKey="month" stroke="#6c757d" fontSize={13} />
                <YAxis stroke="#6c757d" fontSize={13} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Area
                  type="monotone"
                  dataKey="New"
                  stroke="#97247E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNew)"
                />
                <Area
                  type="monotone"
                  dataKey="Active"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DEPARTMENT ACTIVITY RADAR */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-radar" />
              <h3>Department Activity Analysis</h3>
            </div>
            <span className="card-filter-btn-dark">Top 5 Departments</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="department" fontSize={12} />
                <PolarRadiusAxis fontSize={12} />
                <Radar
                  name="Active"
                  dataKey="Active"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Inactive"
                  dataKey="Inactive"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.5}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DEPARTMENT DISTRIBUTION */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-pie-chart-fill" />
              <h3>Department Distribution</h3>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={85}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROLE DISTRIBUTION */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-shield-fill" />
              <h3>Role Distribution</h3>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  fill="#8884d8"
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {roleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REQUEST STATUS */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-clipboard-data" />
              <h3>Request Status</h3>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={85}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Pending"
                          ? "#f59e0b"
                          : entry.name === "Approved"
                          ? "#10b981"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REQUEST TREND */}
        <div className="dashboard-card card-medium">
          <div className="card-header-dark">
            <div className="card-header-content">
              <i className="bi bi-bar-chart-line-fill" />
              <h3>Request Trend</h3>
            </div>
            <span className="card-filter-btn-dark">Last 6 Months</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={requestTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis dataKey="month" stroke="#6c757d" fontSize={13} />
                <YAxis stroke="#6c757d" fontSize={13} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar dataKey="Approved" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke="#97247E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
