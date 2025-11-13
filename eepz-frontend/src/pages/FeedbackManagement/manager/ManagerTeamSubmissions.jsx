import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  RefreshCw, AlertTriangle, Eye, MessageSquare, 
  FileText, Users, Send, Clock, User, Target, Star, Zap, Briefcase
} from 'lucide-react';
import { mentorFeedbackApi, peerQueueApi } from '../../../services/feedbackmanagement/feedbackApi';
import ResponseViewModal from '../../../components/FeedbackManagement/ResponseViewModal';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

// Robust date formatting helper
const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  
  try {
    let dateObj;
    
    if (typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const normalized = dateInput.includes(' ') && !dateInput.includes('T')
        ? dateInput.replace(' ', 'T')
        : dateInput;
      dateObj = new Date(normalized);
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      return '—';
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date detected:', dateInput);
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    console.error('Date formatting error:', err, dateInput);
    return 'Invalid Date';
  }
};

// Calculate days ago safely
const getDaysAgo = (dateInput) => {
  try {
    const dateObj = typeof dateInput === 'string' 
      ? new Date(dateInput.replace(' ', 'T')) 
      : new Date(dateInput);
    
    if (isNaN(dateObj.getTime())) return null;
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  } catch {
    return null;
  }
};

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '6px 10px', fontSize: '0.75rem' }}>
    {text}
  </span>
);

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export default function ManageTeamSubmissions() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1006, firstName: 'Department', lastName: 'Head' }, []);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('HRForms');
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [goalFeedback, setGoalFeedback] = useState([]);
  const [objectives, setObjectives] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Fetch Employee Map & Department Employees
  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        const deptEmps = [];
        
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          // Filter department employees (you can adjust this logic based on your department structure)
          if (emp.departmentId === user?.departmentId || emp.employeeId !== user?.empId) {
            deptEmps.push(emp);
          }
        });
        
        setEmployeeMap(map);
        setDepartmentEmployees(deptEmps);
        console.log('✅ Employee map loaded:', Object.keys(map).length, 'employees');
        console.log('✅ Department employees:', deptEmps.length);
      }
    } catch (err) {
      console.error('❌ Error fetching employee data:', err.message);
    }
  }, [user?.empId, user?.departmentId]);

  // Fetch Objectives
  const fetchObjectives = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/Orgwideobjectives`);
      const objectivesData = response.data?.data || response.data || [];
      
      if (Array.isArray(objectivesData)) {
        const map = {};
        objectivesData.forEach(obj => {
          map[obj.objectiveId] = obj.title || obj.objectiveName || `Objective ${obj.objectiveId}`;
        });
        setObjectives(map);
        console.log('✅ Objectives loaded:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('❌ Error fetching objectives:', err.message);
    }
  }, []);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError('');
    
    try {
      if (departmentEmployees.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const deptEmpIds = departmentEmployees.map(emp => emp.employeeId);

      // HR Forms
      try {
        const hrData = [];
        for (const empId of deptEmpIds) {
          const hrRes = await axios.get(`${API_BASE}/HrFeedbackForm/responses/by-employee/${empId}`);
          if (hrRes.data?.success && Array.isArray(hrRes.data.data)) {
            hrData.push(...hrRes.data.data.map(item => ({
              ...item,
              submittedByEmployeeId: empId,
              submittedByName: employeeMap[empId] || `Employee ${empId}`,
              submittedAtFormatted: formatDate(item.submittedAt),
              daysAgo: getDaysAgo(item.submittedAt)
            })));
          }
        }
        setHrForms(hrData);
        console.log('✅ HR forms loaded:', hrData.length);
      } catch (hrErr) {
        console.warn('⚠️ HR feedback API error:', hrErr.message);
        setHrForms([]);
      }

      // Mentor Feedback
      try {
        const mentorData = [];
        for (const empId of deptEmpIds) {
          const mentorRes = await mentorFeedbackApi.myFeedback(empId);
          if (Array.isArray(mentorRes.data?.data)) {
            mentorData.push(...mentorRes.data.data.map(m => ({
              ...m,
              submittedByEmployeeId: empId,
              submittedByName: employeeMap[empId] || `Employee ${empId}`,
              mentorNameFull: employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
              createdAtFormatted: formatDate(m.createdAt)
            })));
          }
        }
        setMentor(mentorData);
        console.log('✅ Mentor feedback loaded:', mentorData.length);
      } catch (mentorErr) {
        console.warn('⚠️ Mentor feedback API error:', mentorErr.message);
        setMentor([]);
      }

      // Peer Feedback
      try {
        const peerRes = await peerQueueApi.list(1, 200);
        const allPeer = Array.isArray(peerRes.data?.data) ? peerRes.data.data : [];
        const peerData = allPeer
          .filter(p => deptEmpIds.includes(Number(p.submittedByEmployeeId)))
          .map(p => ({
            ...p,
            submittedByName: employeeMap[p.submittedByEmployeeId] || `Employee ${p.submittedByEmployeeId}`,
            recipientNameFull: employeeMap[p.recipientEmployeeId] || `Employee ${p.recipientEmployeeId}`,
            createdAtFormatted: formatDate(p.createdAt)
          }));
        setPeer(peerData);
        console.log('✅ Peer feedback loaded:', peerData.length);
      } catch (peerErr) {
        console.warn('⚠️ Peer feedback API error:', peerErr.message);
        setPeer([]);
      }

      // Goal Feedback
      try {
        console.log('🔍 Fetching goal feedback for department...');
        
        const goalRes = await axios.get(`${API_BASE}/OrgGoalFeedback/all`, {
          params: {
            pageNumber: 1,
            pageSize: 200
          }
        });
        
        if (goalRes.data?.success && Array.isArray(goalRes.data.data)) {
          const deptGoals = goalRes.data.data
            .filter(g => deptEmpIds.includes(Number(g.submittedByEmployeeId)))
            .map(g => ({
              ...g,
              objectiveTitle: g.organizationGoalName || objectives[g.organizationObjectiveId] || `Objective #${g.organizationObjectiveId}`,
              submittedByName: employeeMap[g.submittedByEmployeeId] || `Employee ${g.submittedByEmployeeId}`,
              submittedAtFormatted: formatDate(g.createdAt),
              daysAgo: getDaysAgo(g.createdAt),
              feedbackId: g.orgGoalFeedbackId,
              rating: g.rating || 0,
              feedbackComments: g.feedbackComments || ''
            }));
          
          setGoalFeedback(deptGoals);
          console.log('✅ Goal feedback loaded:', deptGoals.length, 'items');
        } else {
          setGoalFeedback([]);
        }
      } catch (goalErr) {
        console.error('❌ Goal feedback API error:', goalErr.message);
        setGoalFeedback([]);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentEmployees, employeeMap, objectives]);

  useEffect(() => {
    fetchEmployeeData();
    fetchObjectives();
  }, [fetchEmployeeData, fetchObjectives]);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0 && departmentEmployees.length > 0) {
      fetchData();
    }
  }, [employeeMap, departmentEmployees, fetchData]);

  // Modal Handlers
  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  // Tab Button Component
  const TabBtn = ({ label, icon: Icon, active }) => (
    <button
      type="button"
      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setTab(label)}
      style={{ borderRadius: 'var(--radius-sm)' }}
    >
      <Icon size={14} className="me-1" style={{ display: 'inline' }} />
      {label}
    </button>
  );

  return (
    <div className="container-fluid py-3" style={{ maxWidth: '1200px' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Briefcase size={24} style={{ color: 'var(--color-primary-1)' }} />
            <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>
              Department Team Submissions
            </h2>
          </div>
          <p className="mb-0 small" style={{ color: 'var(--muted)' }}>
            View all feedback from your department ({departmentEmployees.length} employees)
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={() => {
            fetchEmployeeData();
            fetchObjectives();
            fetchData();
          }}
          disabled={refreshing || loading}
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--border)', 
            color: 'var(--color-primary-3)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.5rem 0.9rem', 
            fontWeight: '600' 
          }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2" style={{ borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* TABS */}
      <div className="card border-0 mb-3" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
        <div className="card-body d-flex gap-2 flex-wrap">
          <TabBtn label="HR Forms" icon={FileText} active={tab === 'HR Forms'} />
          <TabBtn label="Goal Feedback" icon={Target} active={tab === 'Goal Feedback'} />
          <TabBtn label="Mentor" icon={Send} active={tab === 'Mentor'} />
          <TabBtn label="Peer" icon={Users} active={tab === 'Peer'} />
          <small className="text-muted ms-auto align-self-center">
            {loading && (
              <>
                <Clock size={14} className="me-1" style={{ display: 'inline' }} />
                Loading...
              </>
            )}
            {!loading && tab === 'HR Forms' && `${hrForms.length} submission(s)`}
            {!loading && tab === 'Goal Feedback' && `${goalFeedback.length} submission(s)`}
            {!loading && tab === 'Mentor' && `${mentor.length} submission(s)`}
            {!loading && tab === 'Peer' && `${peer.length} submission(s)`}
          </small>
        </div>
      </div>

      {/* HR FORMS TAB */}
      {tab === 'HR Forms' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FileText size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">HR Form Responses</h5>
            </div>
            {hrForms.length === 0 ? (
              <div className="alert alert-info mb-0">
                <AlertTriangle size={16} className="me-2" style={{ display: 'inline' }} />
                No HR form responses from department yet
              </div>
            ) : (
              <div className="row g-3">
                {hrForms.map((hr) => {
                  const statusColor = hr.status === 'Reviewed' ? '#24A148' : hr.status === 'Submitted' ? '#0F62FE' : '#E2B93B';
                  return (
                    <div className="col-md-6 col-lg-4" key={hr.responseId}>
                      <div 
                        className="card h-100 border-0" 
                        style={{ 
                          border: '1px solid var(--border)', 
                          borderLeft: `4px solid ${statusColor}`,
                          borderRadius: 'var(--radius-lg)' 
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 small text-muted">{hr.submittedByName}</h6>
                              <h6 className="mb-0">{hr.formName || 'HR Form'}</h6>
                            </div>
                            <Badge text={hr.status || 'Draft'} color={statusColor} />
                          </div>

                          <div className="small mb-3">
                            <div className="text-muted">
                              <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                              <strong>Submitted:</strong> {hr.submittedAtFormatted}
                              {hr.daysAgo !== null && <span> ({hr.daysAgo}d ago)</span>}
                            </div>
                          </div>

                          {hr.status === 'Reviewed' && hr.hrReviewComments && (
                            <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#f0f0f0' }}>
                              <small className="fw-bold d-block mb-1">
                                <MessageSquare size={12} className="me-1" style={{ display: 'inline' }} />
                                HR Review:
                              </small>
                              <p className="small mb-0">{hr.hrReviewComments.substring(0, 50)}...</p>
                            </div>
                          )}

                          <button 
                            className="btn btn-sm btn-outline-secondary w-100" 
                            onClick={() => handleViewResponse(hr, 'HR')}
                            title="View details"
                          >
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOAL FEEDBACK TAB */}
      {tab === 'Goal Feedback' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Target size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">Goal Feedback</h5>
            </div>
            {goalFeedback.length === 0 ? (
              <div className="alert alert-info mb-0">
                <AlertTriangle size={16} className="me-2" style={{ display: 'inline' }} />
                No goal feedback from department yet
              </div>
            ) : (
              <div className="row g-3">
                {goalFeedback.map((goal) => (
                  <div className="col-md-6 col-lg-4" key={goal.orgGoalFeedbackId}>
                    <div 
                      className="card h-100 border-0" 
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderLeft: '4px solid #0F62FE',
                        borderRadius: 'var(--radius-lg)' 
                      }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">{goal.submittedByName}</h6>
                            <h6 className="mb-0 small">{goal.objectiveTitle}</h6>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Star size={14} style={{ color: '#FFB800', fill: '#FFB800' }} />
                            <span className="fw-bold small">{goal.rating}/5</span>
                          </div>
                        </div>

                        <Badge text={RATING_LABELS[goal.rating] || 'N/A'} color="#0F62FE" />

                        <div className="small my-2">
                          <div className="text-muted">
                            <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                            {goal.submittedAtFormatted}
                            {goal.daysAgo !== null && <span> ({goal.daysAgo}d ago)</span>}
                          </div>
                        </div>

                        {goal.feedbackComments && (
                          <p className="small mb-3" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>
                            {goal.feedbackComments.substring(0, 60)}...
                          </p>
                        )}

                        <button 
                          className="btn btn-sm btn-outline-secondary w-100" 
                          onClick={() => handleViewResponse(goal, 'Goal')}
                          title="View details"
                        >
                          <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MENTOR TAB */}
      {tab === 'Mentor' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Send size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">Mentor Feedback</h5>
            </div>
            {mentor.length === 0 ? (
              <p className="text-muted mb-0">No mentor feedback from department yet</p>
            ) : (
              <div className="row g-3">
                {mentor.map((m) => (
                  <div className="col-md-6 col-lg-4" key={m.trackingId || m.id}>
                    <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">{m.submittedByName}</h6>
                            <p className="mb-0 fw-bold small" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                              <User size={12} className="me-1" style={{ display: 'inline' }} />
                              {m.mentorNameFull}
                            </p>
                          </div>
                          <Badge text={`${m.rating || 0} / 5`} color="#24A148" />
                        </div>
                        <p className="small mb-2" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>
                          {m.feedbackComments ? m.feedbackComments.substring(0, 50) + '...' : 'No comments'}
                        </p>
                        <small className="text-muted d-block mb-2">
                          <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                          {m.createdAtFormatted}
                        </small>
                        <button 
                          className="btn btn-sm btn-outline-secondary w-100" 
                          onClick={() => handleViewResponse(m, 'Mentor')}
                          title="View details"
                        >
                          <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PEER TAB */}
      {tab === 'Peer' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Users size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">Peer Feedback</h5>
            </div>
            {peer.length === 0 ? (
              <p className="text-muted mb-0">No peer feedback from department yet</p>
            ) : (
              <div className="row g-3">
                {peer.map((p) => (
                  <div className="col-md-6 col-lg-4" key={p.queueId || p.id}>
                    <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">{p.submittedByName}</h6>
                            <p className="mb-0 fw-bold small" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                              <User size={14} className="me-1" style={{ display: 'inline' }} />
                              {p.recipientNameFull}
                            </p>
                          </div>
                        </div>

                        <p className="small mb-2" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>
                          {p.feedbackContent ? p.feedbackContent.substring(0, 50) + '...' : 'No content'}
                        </p>

                        <small className="text-muted d-block mb-2">
                          <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                          {p.createdAtFormatted}
                        </small>

                        <button 
                          className="btn btn-sm btn-outline-secondary w-100" 
                          onClick={() => handleViewResponse(p, 'Peer')}
                          title="View details"
                        >
                          <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ResponseViewModal 
        show={showModal} 
        response={selectedResponse} 
        onClose={handleCloseModal}
        type={selectedType}
      />

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
