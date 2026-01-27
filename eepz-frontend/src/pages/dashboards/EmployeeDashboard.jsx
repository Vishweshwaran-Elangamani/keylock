import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import CountUp from "react-countup";
import { Target, BookOpen, Calendar, AlertTriangle, TrendingUp, Trophy, Medal } from "lucide-react";
import goalService from "../../services/goals/goalService";
import lndService from "../../services/lnd/lndService";
import rsvpService from "../../services/meeting/rsvpService";
import slaService from "../../services/sla/slaService";
import { getEmployeeNominations } from "../../services/performancemanagement/api/nominationapi";
import Breadcrumb from "../../components/common/Breadcrumb";
import { toast } from "sonner";
import "../../styles/auth/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    goals: [], 
    lndAssignments: [], 
    lndSkills: [], 
    meetings: [], 
    slas: [],
    performance: { myRecognitions: [], stats: null }
  });

  const BLUE_COLORS = ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#2563EB"];

  useEffect(() => { fetchAllData(); }, []);

  const getUserData = () => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  };

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

      const empId = user.empMasterId || user.employeeMasterId || user.id;
      
      console.log('Fetching data for Employee ID:', empId);

      const [
        selfGoalsRes, 
        orgGoalsRes, 
        teamGoalsRes, 
        myLndAssignmentsRes, 
        myLndSkillsRes, 
        myMeetingsRes, 
        mySlasRes, 
        myNominationsRes
      ] = await Promise.all([
        goalService.queryGoals({ type: "self", pageSize: 1000 }).catch(() => ({ data: [] })),
        goalService.queryGoals({ type: "org", pageSize: 1000 }).catch(() => ({ data: [] })),
        goalService.queryGoals({ type: "team", pageSize: 1000 }).catch(() => ({ data: [] })),
        lndService.getMyAssignments(1, "", "", "", "", 1000).catch(() => ({ data: [] })),
        lndService.getMySkills(1, "", "", "asc", 1000).catch(() => ({ data: { items: [] } })),
        rsvpService.getMyInvitations().catch(() => []),
        slaService.getEmployeeSLAs(empId).catch(() => ({ data: [] })),
        getEmployeeNominations(empId).catch(err => {
          console.warn('Could not fetch nominations:', err.message);
          return { data: [] };
        })
      ]);

      const allGoals = [
        ...extractData(selfGoalsRes).map(g => ({ ...g, goalType: "self" })),
        ...extractData(orgGoalsRes).map(g => ({ ...g, goalType: "org" })),
        ...extractData(teamGoalsRes).map(g => ({ ...g, goalType: "team" }))
      ];

      const myNominations = extractData(myNominationsRes);
      
      console.log('My Nominations (FULL DATA):', JSON.stringify(myNominations, null, 2));
      
      if (myNominations.length > 0) {
        console.log('First nomination keys:', Object.keys(myNominations[0]));
      }

      const myRecognitions = myNominations.filter(n => {
        const status = (
          n.status || 
          n.nominationStatus || 
          n.approvalStatus || 
          n.state || 
          ''
        ).toLowerCase();
        
        console.log(`Nomination ${n.nominationId} status:`, status);
        
        if (!status) {
          console.warn('No status field found, treating all nominations as approved');
          return true;
        }
        
        return status === 'approved';
      });

      console.log('Filtered Recognitions:', myRecognitions);

      const stats = {
        totalNominations: myNominations.length,
        approvedNominations: myRecognitions.length,
        pendingNominations: myNominations.filter(n => {
          const status = (n.status || n.nominationStatus || n.approvalStatus || '').toLowerCase();
          return status === 'pending' || status === 'submitted';
        }).length,
        rejectedNominations: myNominations.filter(n => {
          const status = (n.status || n.nominationStatus || n.approvalStatus || '').toLowerCase();
          return status === 'rejected' || status === 'declined';
        }).length
      };

      console.log('Performance Stats:', stats);

      setDashboardData({
        goals: allGoals,
        lndAssignments: extractData(myLndAssignmentsRes),
        lndSkills: extractData(myLndSkillsRes),
        meetings: Array.isArray(myMeetingsRes) ? myMeetingsRes : extractData(myMeetingsRes),
        slas: extractData(mySlasRes),
        performance: { myRecognitions, stats }
      });

    } catch (err) {
      console.error("Error in fetchAllData:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (deadline) => deadline && slaService?.isOverdue?.(deadline);

  const getKPIStats = () => {
    const now = new Date();
    return {
      totalGoals: dashboardData.goals.length,
      totalLndAssignments: dashboardData.lndAssignments.length,
      totalMeetings: dashboardData.meetings.length,
      upcomingMeetings: dashboardData.meetings.filter(m => new Date(m.meetingDate || m.date) >= now).length,
      totalSlas: dashboardData.slas.length,
      overdueSlas: dashboardData.slas.filter(s => isOverdue(s.deadline || s.dueDate)).length
    };
  };

  const getPerformanceOverview = () => {
    const { myRecognitions, stats } = dashboardData.performance;
    
    console.log('getPerformanceOverview - myRecognitions:', myRecognitions);
    console.log('getPerformanceOverview - stats:', stats);
    
    const byRewardType = {};
    
    myRecognitions.forEach(r => {
      const type = (
        r.rewardType || 
        r.roleType || 
        r.rewardTypeName || 
        r.awardType ||
        r.opportunity?.rewardType || 
        "Other"
      );
      
      console.log(`Processing nomination ${r.nominationId}, type: ${type}`);
      
      byRewardType[type] = (byRewardType[type] || 0) + 1;
    });

    console.log('Reward types breakdown:', byRewardType);

    const chartData = Object.entries(byRewardType).map(([name, value], i) => ({
      name,
      value,
      fill: BLUE_COLORS[i % BLUE_COLORS.length]
    }));

    return {
      totalRecognitions: myRecognitions.length,
      totalNominations: stats?.totalNominations || 0,
      pendingNominations: stats?.pendingNominations || 0,
      chartData
    };
  };

  const getGoalsOverview = () => {
    const goals = dashboardData.goals;
    if (!goals?.length) return { total: 0, completed: 0, inProgress: 0, pending: 0, chartData: [] };

    const completed = goals.filter(g => (g.status || g.goalStatus || "").toLowerCase() === "completed").length;
    const inProgress = goals.filter(g => (g.status || g.goalStatus || "").toLowerCase() === "inprogress").length;
    const pending = goals.filter(g => ["pending", "open", "approved"].includes((g.status || g.goalStatus || "").toLowerCase())).length;

    const chartData = [
      completed > 0 && { name: "Completed", value: completed, fill: BLUE_COLORS[0] },
      inProgress > 0 && { name: "In Progress", value: inProgress, fill: BLUE_COLORS[1] },
      pending > 0 && { name: "Pending", value: pending, fill: BLUE_COLORS[2] }
    ].filter(Boolean);

    return { total: goals.length, completed, inProgress, pending, chartData };
  };

  const getLndOverview = () => {
    const skills = dashboardData.lndSkills;
    if (!skills?.length) return { total: 0, low: 0, medium: 0, high: 0, chartData: [] };

    let low = 0, medium = 0, high = 0;
    skills.forEach(s => {
      const r = Number(s.rating || s.proficiency || s.proficiencyLevel || s.score || 0);
      if (!isNaN(r)) {
        if (r <= 4) low++;
        else if (r <= 7) medium++;
        else high++;
      }
    });

    const chartData = [
      low > 0 && { name: "Rating 1-4", value: low, fill: BLUE_COLORS[2] },
      medium > 0 && { name: "Rating 5-7", value: medium, fill: BLUE_COLORS[1] },
      high > 0 && { name: "Rating 8-10", value: high, fill: BLUE_COLORS[0] }
    ].filter(Boolean);

    return { total: skills.length, low, medium, high, chartData };
  };

  const getMeetingsOverview = () => {
    const meetings = dashboardData.meetings;
    const now = new Date();
    const upcoming = meetings.filter(m => new Date(m.meetingDate || m.date) >= now).length;
    const completed = meetings.length - upcoming;

    const monthlyData = {};
    meetings.forEach(m => {
      const date = new Date(m.meetingDate || m.date || m.createdDate);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
      }
    });

    const chartData = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
      .map(([month, count]) => ({ month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }), count }));

    return { total: meetings.length, upcoming, completed, chartData };
  };

  const getSlaOverview = () => {
    const slas = dashboardData.slas;
    if (!slas?.length) return { total: 0, open: 0, overdue: 0, closed: 0, chartData: [] };

    const closed = slas.filter(s => (s.status || "").toLowerCase() === "closed").length;
    const open = slas.length - closed;
    const overdue = slas.filter(s => isOverdue(s.deadline || s.dueDate)).length;

    const chartData = [
      open > 0 && { name: "Open / In Progress", value: open, fill: BLUE_COLORS[1] },
      overdue > 0 && { name: "Overdue", value: overdue, fill: BLUE_COLORS[3] },
      closed > 0 && { name: "Closed", value: closed, fill: BLUE_COLORS[0] }
    ].filter(Boolean);

    return { total: slas.length, open, overdue, closed, chartData };
  };

  const StatCard = ({ type, value, label }) => (
    <div className={`emp-stat-card emp-stat-${type}`}>
      <div className="emp-stat-value">{value}</div>
      <div className="emp-stat-label">{label}</div>
    </div>
  );

  if (loading) return (
    <div className="ada-loading-container">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const kpiStats = getKPIStats();
  const perfOverview = getPerformanceOverview();
  const goalsData = getGoalsOverview();
  const lndData = getLndOverview();
  const meetingsData = getMeetingsOverview();
  const slaData = getSlaOverview();

  const kpiCards = [
    { 
      icon: "trophy", 
      value: perfOverview.totalRecognitions, 
      label: "My Recognitions", 
      subtitle: `Total nominations: ${perfOverview.totalNominations}`, 
      iconClass: "admin-purple" 
    },
    { 
      icon: Target, 
      value: kpiStats.totalGoals, 
      label: "My Goals", 
      subtitle: "Self, Team & Org", 
      iconClass: "admin-blue", 
      showTrend: true 
    },
    { 
      icon: BookOpen, 
      value: dashboardData.lndSkills.length, 
      label: "My Skills", 
      subtitle: "From L&D module", 
      iconClass: "admin-pink" 
    },
    { 
      icon: Calendar, 
      value: kpiStats.totalMeetings, 
      label: "Meetings", 
      subtitle: `${kpiStats.upcomingMeetings} upcoming`, 
      iconClass: "admin-green" 
    },
    { 
      icon: AlertTriangle, 
      value: kpiStats.totalSlas, 
      label: "My SLAs", 
      subtitle: `${kpiStats.overdueSlas} overdue`, 
      iconClass: "admin-cyan" 
    }
  ];

  return (
    <div className="hr-dashboard-container">
      <Breadcrumb items={[{ label: "Employee Dashboard" }]} />

      <div className="admin-kpi-grid">
        {kpiCards.map(({ icon, value, label, subtitle, iconClass, showTrend }, i) => {
          const IconComponent = icon;
          return (
            <div key={i} className="admin-kpi-card">
              <div className={`admin-kpi-icon ${iconClass}`}>
                {typeof icon === "string" ? <i className={`bi bi-${icon}`}></i> : <IconComponent size={28} />}
              </div>
              <div className="admin-kpi-content">
                <h2><CountUp end={value} duration={2} /></h2>
                <p>{label}</p>
                <span className="admin-kpi-subtitle">
                  {showTrend && <TrendingUp size={12} />} {subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-cards-container">
        <div className="dashboard-row">
          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-graph-up"></i>
                <h3>Performance & Recognition</h3>
              </div>
            </div>
            <div className="card-body">
              {perfOverview.totalRecognitions > 0 ? (
                <>
                  <div className="emp-stats-grid emp-stats-2col">
                    <StatCard type="recognition" value={perfOverview.totalRecognitions} label="My Recognitions" />
                    <StatCard type="org-noms" value={perfOverview.totalNominations} label="Total Nominations" />
                  </div>
                  <div className="emp-trophy-section">
                    <div className="emp-trophy-container">
                      <Trophy size={100} className="emp-trophy-icon" />
                      <div className="emp-trophy-badge">{perfOverview.totalRecognitions}</div>
                    </div>
                    <h4 className="emp-trophy-title">My Recognitions</h4>
                    {perfOverview.chartData.length > 0 && (
                      <div className="emp-recognition-list">
                        {perfOverview.chartData.map((item, i) => (
                          <div key={i} className="emp-recognition-item">
                            <Medal size={24} className="emp-recognition-medal" style={{ '--medal-color': item.fill }} />
                            <div className="emp-recognition-info">
                              <div className="emp-recognition-name">{item.name}</div>
                              <div className="emp-recognition-bar">
                                <div
                                  className="emp-recognition-fill"
                                  style={{
                                    '--fill-width': `${(item.value / perfOverview.totalRecognitions) * 100}%`,
                                    '--fill-color': item.fill
                                  }}
                                />
                              </div>
                            </div>
                            <span className="emp-recognition-count" style={{ '--count-color': item.fill }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-data-message">No approved recognitions yet</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-bullseye"></i>
                <h3>Goals Overview</h3>
              </div>
            </div>
            <div className="card-body">
              {goalsData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="total-purple" value={goalsData.total} label="Total" />
                    <StatCard type="completed-purple" value={goalsData.completed} label="Completed" />
                    <StatCard type="inprogress-coral" value={goalsData.inProgress} label="In Progress" />
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
                <div className="no-data-message">No goals overview data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card card-medium">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-calendar-check"></i>
                <h3>Meetings Scheduled</h3>
              </div>
            </div>
            <div className="card-body">
              {meetingsData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="total-purple" value={meetingsData.total} label="Total" />
                    <StatCard type="completed-purple" value={meetingsData.upcoming} label="Upcoming" />
                    <StatCard type="inprogress-coral" value={meetingsData.completed} label="Completed" />
                  </div>
                  {meetingsData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={meetingsData.chartData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={BLUE_COLORS[2]} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={BLUE_COLORS[2]} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="count" stroke={BLUE_COLORS[2]} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No meetings data</div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row dashboard-row-2">
          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-book"></i>
                <h3>Learning & Development</h3>
              </div>
            </div>
            <div className="card-body">
              {lndData.total > 0 ? (
                <>
                  <div className="emp-stats-grid emp-stats-4col">
                    <StatCard type="total-purple" value={lndData.total} label="Total Skills" />
                    <StatCard type="low-rating" value={lndData.low} label="Rating 1-4" />
                    <StatCard type="medium-rating" value={lndData.medium} label="Rating 5-7" />
                    <StatCard type="high-rating" value={lndData.high} label="Rating 8-10" />
                  </div>
                  {lndData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={lndData.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
                          {lndData.chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          formatter={(value, entry) => {
                            const item = lndData.chartData.find(d => d.name === entry.value);
                            return `${item?.name || value}: ${item?.value || 0}`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="no-data-message">No learning & development data</div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header-dark">
              <div className="card-header-content">
                <i className="bi bi-exclamation-triangle"></i>
                <h3>SLA Overview</h3>
              </div>
            </div>
            <div className="card-body">
              {slaData.total > 0 ? (
                <>
                  <div className="emp-stats-grid">
                    <StatCard type="total-purple" value={slaData.total} label="Total" />
                    <StatCard type="open" value={slaData.open} label="Open" />
                    <StatCard type="overdue" value={slaData.overdue} label="Overdue" />
                  </div>
                  {slaData.chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={slaData.chartData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={false}>
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
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
