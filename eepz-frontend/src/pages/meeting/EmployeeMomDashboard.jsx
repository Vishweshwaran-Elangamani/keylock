// src/pages/Meeting/EmployeeMomDashboard.jsx
import { useState, useEffect } from 'react';
import momService from '../../services/meeting/momService';
import rsvpService from '../../services/meeting/rsvpService';
import employeeService from '../../services/meeting/employeeservice';
import toastr from 'toastr';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


import MeetingDetailsModal from '../../components/meeting/modals/MeetingDetailsModal';
import SharedMomsModal from '../../components/meeting/modals/SharedMomsModal';

const EmployeeMomDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employeeMap, setEmployeeMap] = useState({});
  const [stats, setStats] = useState({
    myMoms: 0,
    pendingActionItems: 0,
    meetingInvitations: 0,
    sharedMoms: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showSharedModal, setShowSharedModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    fetchMeetings();
  }, []);

  const fetchEmployeeNames = async (employeeMasterIds) => {
    if (!employeeMasterIds || employeeMasterIds.length === 0) return {};
    
    try {
      const uniqueIds = [...new Set(employeeMasterIds)];
      const response = await employeeService.getEmployeesByIds(uniqueIds);
      
      if (response.success && response.data) {
        const nameMap = {};
        response.data.forEach(emp => {
          nameMap[emp.employeeMasterId] = `${emp.firstName} ${emp.lastName}`;
        });
        return nameMap;
      }
      return {};
    } catch (error) {
      console.error('Error fetching employee names:', error);
      return {};
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [myMomsRes, actionItemsRes, invitationsRes, sharedRes] = await Promise.all([
        momService.getMyMoms(),
        momService.getMyActionItems(),
        rsvpService.getMyInvitations(),
        momService.getMomsSharedWithMe()
      ]);

      const employeeIds = [];
      if (actionItemsRes.data) {
        actionItemsRes.data.forEach(item => {
          if (item.assignedToEmployeeId) employeeIds.push(item.assignedToEmployeeId);
        });
      }
      if (myMomsRes.data) {
        myMomsRes.data.forEach(mom => {
          if (mom.actionItems) {
            mom.actionItems.forEach(ai => {
              if (ai.assignedToEmployeeId) employeeIds.push(ai.assignedToEmployeeId);
            });
          }
        });
      }

      if (employeeIds.length > 0) {
        const empNames = await fetchEmployeeNames(employeeIds);
        setEmployeeMap(empNames);
      }

      const pendingActions = actionItemsRes.data?.filter(item => item.status === 'Pending') || [];
      const pendingInvites = invitationsRes.data?.filter(inv => inv.rsvpStatus === 'Pending') || [];
      
      setStats({
        myMoms: myMomsRes.data?.length || 0,
        pendingActionItems: pendingActions.length,
        meetingInvitations: pendingInvites.length,
        sharedMoms: sharedRes.data?.length || 0
      });

      const activity = [];
      if (myMomsRes.data) {
        myMomsRes.data.slice(0,3).forEach(mom => {
          activity.push({
            type: 'mom',
            title: mom.meetingTitle,
            date: mom.createdAt,
            icon: 'bi-file-text',
            color: 'primary',
            meetingId: mom.meetingId,
            meetingData: mom
          });
        });
      }
      if (invitationsRes.data) {
        invitationsRes.data.slice(0, 2).forEach(inv => {
          activity.push({
            type: 'invitation',
            title: inv.meetingTitle,
            date: inv.meetingDate,
            icon: 'bi-calendar-event',
            color: 'warning',
            meetingId: inv.meetingId,
            meetingData: inv
          });
        });
      }
      setRecentActivity(activity.sort((a,b)=>new Date(b.date) - new Date(a.date)).slice(0,5));
    } catch (error) {
      toastr.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await momService.getMyMoms();
      setMeetings(res.data || []);
    } catch (error) {
      toastr.error('Failed to load meetings');
    }
  };

  const openMeetingDetails = (meeting) => setSelectedMeeting(meeting);
  const closeMeetingDetails = () => setSelectedMeeting(null);

  const handleActivityClick = (item) => {
    if (item.meetingData) {
      openMeetingDetails(item.meetingData);
    }
  };

  const openSharedModal = () => setShowSharedModal(true);
  const closeSharedModal = () => setShowSharedModal(false);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted fw-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol
          className="breadcrumb mb-0 d-flex align-items-center"
          style={{
            backgroundColor: "transparent",
            padding: 0,
            margin: 0,
          }}
        >
          <li
            className="breadcrumb-item"
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => navigate("/employee/dashboard")}
              style={{
                background: "none",
                border: "none",
                color: "#97247E",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
            >
              <i className="bi bi-house-door" style={{ fontSize: '1rem' }}></i>
              Dashboard
            </button>
          </li>
           <li
            style={{
              display: "flex",
              alignItems: "center",
              color: "#97247E",
              margin: "0 8px",
              fontSize: "1rem",
            }}
          >
            /
          </li>
          
          <li
            className="breadcrumb-item"
            style={{ display: "flex", alignItems: "center" }}
          >
            <button
              onClick={() => navigate("/employee/dashboard")}
              style={{
                background: "none",
                border: "none",
                color: "#97247E",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
            >
              Meetings and MoM
            </button>
          </li>
          <li
            style={{
              display: "flex",
              alignItems: "center",
              color: "#97247E",
              margin: "0 8px",
              fontSize: "1rem",
            }}
          >
            /
          </li>
          <li
            className="breadcrumb-item active"
            aria-current="page"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#1e293b",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              MOM Management
            </span>
          </li>
        </ol>
      </nav>

      {/* Quick Stats - Horizontal Layout */}
      <div className="row g-3 mb-4">
        <StatCard 
          icon="bi-file-text" 
          bgColor="#E3F2FD" 
          iconColor="#3B82F6"
          count={stats.myMoms} 
          label="MY MOMS"
          onClick={() => navigate('/employee/dashboard/meetmom/my-moms')}
        />
        <StatCard 
          icon="bi-clock-history" 
          bgColor="#E0E7FF" 
          iconColor="#7C3AED"
          count={stats.pendingActionItems} 
          label="PENDING ACTIONS"
          onClick={() => navigate('/employee/dashboard/meetmom/action-items')}
        />
        <StatCard 
          icon="bi-envelope-open" 
          bgColor="#DCFCE7" 
          iconColor="#16A34A"
          count={stats.meetingInvitations} 
          label="INVITATIONS"
          onClick={() => navigate('/employee/dashboard/meetmom/invitations')}
        />
        <StatCard 
          icon="bi-share" 
          bgColor="#FEF3C7" 
          iconColor="#F59E0B"
          count={stats.sharedMoms} 
          label="SHARED MOMS"
          onClick={openSharedModal}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="row g-3 mb-4">
        <ActionButton 
          icon="bi-file-earmark-text" 
          label="My MOMs" 
          color="primary"
          count={stats.myMoms}
          onClick={() => navigate('/employee/dashboard/meetmom/my-moms')} 
        />
        <ActionButton 
          icon="bi-share" 
          label="Shared MOMs" 
          color="info"
          count={stats.sharedMoms}
          onClick={openSharedModal}
        />
        <ActionButton 
          icon="bi-list-check" 
          label="Action Items" 
          color="success"
          count={stats.pendingActionItems}
          onClick={() => navigate('/employee/dashboard/meetmom/action-items')} 
        />
        <ActionButton 
          icon="bi-envelope" 
          label="Invitations" 
          color="warning"
          count={stats.meetingInvitations}
          onClick={() => navigate('/employee/dashboard/meetmom/invitations')} 
        />
      </div>

      <div className="row">
        {/* Recent Activity */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                  <i className="bi bi-clock-history"></i>
                  Recent Activity
                </h5>
                <span className="badge bg-light text-dark fw-medium">{recentActivity.length} items</span>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3.5rem', opacity: 0.3 }}>
                    <i className="bi bi-inbox"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">No recent activity</h6>
                  <p className="text-muted small mb-0">Your recent MOMs and invitations will appear here</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentActivity.map((item, idx) => (
                    <ActivityItem key={idx} item={item} onClick={() => handleActivityClick(item)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                  <i className="bi bi-calendar3"></i>
                  My Meetings
                </h5>
                <span className="badge bg-light text-dark fw-medium">{meetings.length} meetings</span>
              </div>
              {meetings.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3.5rem', opacity: 0.3 }}>
                    <i className="bi bi-calendar-x"></i>
                  </div>
                  <h6 className="fw-semibold text-muted mb-2">No meetings found</h6>
                  <p className="text-muted small mb-3">Create your first meeting minute to get started</p>
                </div>
              ) : (
                <>
                  <div className="list-group list-group-flush">
                    {meetings.slice(0, 5).map((m) => (
                      <div 
                        key={m.meetingId} 
                        className="list-group-item list-group-item-action border-0 px-0 py-3 rounded mb-2"
                        onClick={() => openMeetingDetails(m)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'transparent'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.transform = 'translateX(5px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <h6 className="mb-0 fw-semibold">{m.meetingTitle}</h6>
                              <span className="badge bg-primary-subtle text-primary small">{m.meetingType}</span>
                            </div>
                            <div className="d-flex align-items-center flex-wrap gap-3 text-muted small">
                              <span className="d-flex align-items-center gap-1">
                                <i className="bi bi-calendar3"></i>
                                {new Date(m.meetingDate).toLocaleDateString()}
                              </span>
                              <span className="d-flex align-items-center gap-1">
                                <i className="bi bi-clock"></i>
                                {new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {m.actionItems && m.actionItems.length > 0 && (
                                <span className="d-flex align-items-center gap-1">
                                  <i className="bi bi-check-circle"></i>
                                  {m.actionItems.length} action{m.actionItems.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <i className="bi bi-chevron-right text-muted" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                  {meetings.length > 5 && (
                    <div className="text-center mt-3 pt-3 border-top">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate('/employee/dashboard/meetmom/my-moms')}
                      >
                        View All {meetings.length} Meetings <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      {selectedMeeting && (
        <MeetingDetailsModal 
          meeting={selectedMeeting}
          onClose={closeMeetingDetails}
          employeeMap={employeeMap}
        />
      )}

      {showSharedModal && <SharedMomsModal onClose={closeSharedModal} />}

      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          display: none;
        }
        
        .gradient-primary-button {
          background: linear-gradient(90deg, #97247E 0%, #E01950 100%);
          color: #fff;
          border: none;
          font-weight: 500;
        }
        
        .gradient-primary-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(151, 36, 126, 0.3);
          transition: all 0.2s ease;
        }
        
        .gradient-primary-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

// Stat Card Component - Horizontal Layout with Black Border
const StatCard = ({ icon, bgColor, iconColor, count, label, onClick }) => (
  <div className="col-lg-3 col-md-6">
    <div 
      className="card shadow-sm h-100 mom-stat-card-horizontal"
      onClick={onClick}
      style={{ 
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: '1.5px solid #27235C',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: '#FFFFFF'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#0F62FE';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 35, 92, 0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#27235C';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* Icon with rounded background */}
      <div 
        style={{ 
          width: '56px', 
          height: '56px', 
          backgroundColor: bgColor,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <i className={`${icon} fs-3`} style={{ color: iconColor }}></i>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 className="fw-bold mb-1" style={{ fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
          {count}
        </h3>
        <p className="mb-0 fw-semibold" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
      </div>
    </div>
  </div>
);

const ActionButton = ({ icon, label, color, count, onClick }) => (
  <div className="col-lg-3 col-md-6">
    <button 
      className={`btn btn-outline-${color} w-100 py-3 d-flex align-items-center justify-content-between position-relative shadow-sm`}
      onClick={onClick}
      style={{ 
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      }}
    >
      <span className="d-flex align-items-center gap-2">
        <i className={icon} style={{ fontSize: '1.1rem' }}></i> 
        {label}
      </span>
      {count > 0 && (
        <span className={`badge bg-${color} rounded-pill`}>{count}</span>
      )}
    </button>
  </div>
);

const ActivityItem = ({ item, onClick }) => {
  const iconBgColor = {
    primary: '#e3f2fd',
    warning: '#fff3e0',
    success: '#e8f5e9',
    info: '#e1f5fe'
  };
  
  const iconColor = {
    primary: '#1976d2',
    warning: '#f57c00',
    success: '#388e3c',
    info: '#0288d1'
  };

  return (
    <div 
      className="d-flex align-items-start p-3 rounded-3"
      onClick={onClick}
      style={{ 
        cursor: 'pointer', 
        transition: 'all 0.2s',
        backgroundColor: '#f8f9fa',
        border: '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.borderColor = iconColor[item.color];
        e.currentTarget.style.transform = 'translateX(8px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center me-3"
        style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: iconBgColor[item.color],
          flexShrink: 0
        }}
      >
        <i className={`${item.icon} fs-5`} style={{ color: iconColor[item.color] }}></i>
      </div>
      <div className="flex-grow-1">
        <h6 className="mb-1 fw-semibold text-start" style={{ fontSize: '0.95rem' }}>{item.title}</h6>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted d-flex align-items-center gap-1">
            <i className="bi bi-calendar3"></i>
            {new Date(item.date).toLocaleDateString()}
          </small>
          <small className="text-muted d-flex align-items-center gap-1">
            <i className="bi bi-clock"></i>
            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
      </div>
      <i className="bi bi-arrow-right text-muted"></i>
    </div>
  );
};

export default EmployeeMomDashboard;
