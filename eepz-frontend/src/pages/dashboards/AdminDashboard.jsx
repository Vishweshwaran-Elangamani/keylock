import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Bar,
} from "recharts";
import CountUp from "react-countup";
import { Users, Clock, Building2, UserPlus, Shield, TrendingUp, TrendingDown } from "lucide-react";
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
  const [data, setData] = useState({ users: [], roles: [], departments: [], changeRequests: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, rolesRes, deptsRes, requestsRes] = await Promise.all([
          userService.getAllUsers(), roleService.getAllRoles(), departmentService.getAllDepartments(), ChangeRequestService.getAllChangeRequests()
        ]);
        setData({
          users: usersRes.success ? usersRes.data || [] : [],
          roles: rolesRes.success ? rolesRes.data || [] : [],
          departments: deptsRes.success ? deptsRes.data || [] : [],
          changeRequests: requestsRes.success ? requestsRes.data || [] : [],
        });
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nonAdminUsers = useMemo(() => data.users.filter(u => u.roleName !== "Admin"), [data.users]);

  const stats = useMemo(() => {
    const activeUsers = nonAdminUsers.filter(u => u.isActive).length;
    const inactiveUsers = nonAdminUsers.filter(u => !u.isActive).length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = nonAdminUsers.filter(u => new Date(u.joiningDate) > thirtyDaysAgo).length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyNewUsers = nonAdminUsers.filter(u => new Date(u.joiningDate) > sevenDaysAgo).length;
    const pendingRequests = data.changeRequests.filter(r => r.status === "Pending").length;
    const approvedRequests = data.changeRequests.filter(r => r.status === "Approved").length;
    const rejectedRequests = data.changeRequests.filter(r => r.status === "Rejected").length;
    const systemRoles = data.roles.filter(r => r.isSystemRole).length;
    const customRoles = data.roles.filter(r => !r.isSystemRole).length;
    const activeRate = nonAdminUsers.length ? ((activeUsers / nonAdminUsers.length) * 100).toFixed(1) : 0;
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const prevMonthUsers = nonAdminUsers.filter(u => {
      const joinDate = new Date(u.joiningDate);
      return joinDate > sixtyDaysAgo && joinDate <= thirtyDaysAgo;
    }).length;
    const growthRate = prevMonthUsers > 0 ? (((newUsers - prevMonthUsers) / prevMonthUsers) * 100).toFixed(1) : newUsers > 0 ? 100 : 0;

    return {
      totalUsers: nonAdminUsers.length, activeUsers, inactiveUsers, newUsers, weeklyNewUsers,
      totalRoles: data.roles.length, systemRoles, customRoles, totalDepartments: data.departments.length,
      totalRequests: data.changeRequests.length, pendingRequests, approvedRequests, rejectedRequests,
      activeRate: parseFloat(activeRate), growthRate: parseFloat(growthRate)
    };
  }, [nonAdminUsers, data]);

  const departmentData = useMemo(() => {
    const deptCount = nonAdminUsers.reduce((acc, u) => {
      const dept = u.departmentName || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(deptCount).map(([name, value]) => ({ name, fullName: name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [nonAdminUsers]);

  const roleData = useMemo(() => {
    const roleCount = nonAdminUsers.reduce((acc, u) => {
      const role = u.roleName || "Unassigned";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCount).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [nonAdminUsers]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const newInMonth = nonAdminUsers.filter(u => {
        const joinDate = new Date(u.joiningDate);
        return joinDate >= monthStart && joinDate <= monthEnd;
      }).length;
      const activeInMonth = nonAdminUsers.filter(u => {
        const joinDate = new Date(u.joiningDate);
        return joinDate <= monthEnd && u.isActive;
      }).length;
      months.push({ month: monthName, New: newInMonth, Active: activeInMonth });
    }
    return months;
  }, [nonAdminUsers]);

  const requestStatusData = useMemo(() => [
    { name: "Approved", value: stats.approvedRequests },
    { name: "Pending", value: stats.pendingRequests },
    { name: "Rejected", value: stats.rejectedRequests }
  ], [stats]);

  const radarData = useMemo(() => {
    const topDepts = departmentData.slice(0, 5);
    return topDepts.map(dept => {
      const deptUsers = nonAdminUsers.filter(u => (u.departmentName || "Unassigned") === dept.name);
      return {
        department: dept.name,
        Active: deptUsers.filter(u => u.isActive).length,
        Inactive: deptUsers.filter(u => !u.isActive).length
      };
    });
  }, [departmentData, nonAdminUsers]);

  const requestTrendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const requestsInMonth = data.changeRequests.filter(req => {
        const requestDate = new Date(req.requestedAt);
        return requestDate >= monthStart && requestDate <= monthEnd;
      });
      months.push({
        month: monthName,
        Total: requestsInMonth.length,
        Approved: requestsInMonth.filter(r => r.status === "Approved").length,
        Pending: requestsInMonth.filter(r => r.status === "Pending").length
      });
    }
    return months;
  }, [data.changeRequests]);

  const COLORS = ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#2563EB"];

  if (loading) return (
    <div className="ada-loading-container">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="ada-dashboard">
      <Breadcrumb items={[{ label: "Admin Dashboard" }]} />
      
      <div className="ada-stats-grid">
        {[
          { icon: Users, value: stats.totalUsers, label: "Total Users", trend: `${Math.abs(stats.growthRate)}% vs last month`, up: stats.growthRate >= 0 },
          { icon: Clock, value: stats.pendingRequests, label: "Pending Requests", trend: "Awaiting review" },
          { icon: Building2, value: stats.totalDepartments, label: "Departments", trend: `${stats.totalRoles} roles` },
          { icon: Shield, value: stats.totalRoles, label: "System Roles", trend: `${stats.customRoles} custom` },
          { icon: UserPlus, value: stats.weeklyNewUsers, label: "New This Week", trend: "Last 7 days" }
        ].map(({ icon: Icon, value, label, trend, up }, i) => (
          <div key={i} className="ada-stat-card">
            <div className={`ada-stat-icon ada-stat-icon-${['primary','warning','info','purple','cyan'][i]}`}>
              <Icon size={28} />
            </div>
            <div className="ada-stat-content">
              <h2><CountUp end={value} duration={2} /></h2>
              <p>{label}</p>
              <span className="ada-stat-trend">
                {up !== undefined && (up ? <TrendingUp size={12} className="ada-trend-icon-up" /> : <TrendingDown size={12} className="ada-trend-icon-down" />)}
                {trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="ada-actions-card">
        <div className="ada-actions-grid">
          {[
            { path: "/admin/users", icon: "bi-person-plus", label: "Manage Users" },
            { path: "/admin/roles", icon: "bi-shield-check", label: "Configure Roles" },
            { path: "/admin/departments", icon: "bi-building", label: "Departments" },
            { path: "/admin/change-requests/pending", icon: "bi-clipboard-check", label: "Review Requests" }
          ].map(({ path, icon, label }, i) => (
            <button key={i} className="ada-action-btn" onClick={() => navigate(path)}>
              <i className={icon}></i>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ada-charts-grid">
        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-graph-up-arrow" />User Growth Trend
            </div>
            <span className="ada-card-badge">Last 6 Months</span>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#6c757d" fontSize={13} />
                <YAxis stroke="#6c757d" fontSize={13} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px" }} />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Area type="monotone" dataKey="New" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                <Area type="monotone" dataKey="Active" stroke="#1E40AF" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-radar" />Department Activity
            </div>
            <span className="ada-card-badge">Top 5 Depts</span>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="department" fontSize={12} />
                <PolarRadiusAxis fontSize={12} />
                <Radar name="Active" dataKey="Active" stroke="#1E40AF" fill="#1E40AF" fillOpacity={0.6} />
                <Radar name="Inactive" dataKey="Inactive" stroke="#BFDBFE" fill="#BFDBFE" fillOpacity={0.5} />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-pie-chart-fill" />Department Dist.
            </div>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="45%" labelLine={false} label={false} outerRadius={90} dataKey="value">
                  {departmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} users (${((value / stats.totalUsers) * 100).toFixed(0)}%)`, props.payload.fullName || props.payload.name]} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value, entry) => `${departmentData.find(d => d.name === entry.value)?.name || value}: ${departmentData.find(d => d.name === entry.value)?.value || 0}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-shield-fill" />Role Distribution
            </div>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={false}>
                  {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} users (${((value / stats.totalUsers) * 100).toFixed(0)}%)`, props.payload.name]} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value, entry) => `${roleData.find(d => d.name === entry.value)?.name || value}: ${roleData.find(d => d.name === entry.value)?.value || 0}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-clipboard-data" />Request Status
            </div>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={requestStatusData} cx="50%" cy="45%" labelLine={false} label={false} outerRadius={90} dataKey="value">
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "Approved" ? "#1E40AF" : entry.name === "Pending" ? "#60A5FA" : "#BFDBFE"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} requests`, name]} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value, entry) => `${requestStatusData.find(d => d.name === entry.value)?.name || value}: ${requestStatusData.find(d => d.name === entry.value)?.value || 0}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ada-chart-card">
          <div className="ada-card-header">
            <div className="ada-card-title">
              <i className="bi bi-bar-chart-line-fill" />Request Trend
            </div>
            <span className="ada-card-badge">Last 6 Months</span>
          </div>
          <div className="ada-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={requestTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#6c757d" fontSize={13} />
                <YAxis stroke="#6c757d" fontSize={13} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px" }} />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Bar dataKey="Approved" fill="#1E40AF" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Pending" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="Total" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, fill: "#2563EB" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
