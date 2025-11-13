import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  RefreshCw, AlertTriangle, Eye, Trash2, MessageSquare, 
  FileText, Users, Send, Clock, User, Target, Star
} from 'lucide-react';
import { mentorFeedbackApi, peerQueueApi, hrFormApi, orgGoalFeedbackApi } from '../../../services/feedbackmanagement/feedbackApi';
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

export default function MySubmissions() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1004, firstName: 'Dave', lastName: 'Dev' }, []);
  
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
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Show toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch Employee Map
  const fetchEmployeeMap = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('✅ Employee map loaded:', Object.keys(map).length, 'employees');
      }
    } catch (err) {
      console.error('❌ Error fetching employee map:', err.message);
    }
  }, []);

  // Fetch Goals/Objectives
  const fetchObjectives = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/Goals/all`, {
        params: { pageNumber: 1, pageSize: 100 }
      });
      
      const goalsData = response.data?.data || response.data || [];
      
      if (Array.isArray(goalsData)) {
        const map = {};
        goalsData.forEach(goal => {
          map[goal.goalid] = goal.goaltitle || `Goal ${goal.goalid}`;
        });
        setObjectives(map);
        console.log('✅ Goals loaded:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('❌ Error fetching goals:', err.message);
    }
  }, []);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError('');
    
    try {
      const userEmpId = Number(user?.empId) || 1004;

      // HR Forms
      try {
        const hrRes = await axios.get(`${API_BASE}/HrFeedbackForm/responses/by-employee/${userEmpId}`);
        if (hrRes.data?.success && Array.isArray(hrRes.data.data)) {
          const enriched = hrRes.data.data.map(hr => ({
            ...hr,
            submittedAtFormatted: formatDate(hr.submittedAt),
            daysAgo: getDaysAgo(hr.submittedAt)
          }));
          setHrForms(enriched);
          console.log('✅ HR forms loaded:', enriched.length);
        } else {
          setHrForms([]);
        }
      } catch (hrErr) {
        console.warn('⚠️ HR feedback API error:', hrErr.message);
        setHrForms([]);
      }

      // Mentor Feedback - FIX: Properly map the ID field
      try {
        const mentorRes = await mentorFeedbackApi.myFeedback(userEmpId);
        const mentorData = Array.isArray(mentorRes.data?.data) ? mentorRes.data.data : [];
        const enriched = mentorData.map(m => ({
          ...m,
          mentorNameFull: employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`,
          createdAtFormatted: formatDate(m.createdAt),
          // Use the correct ID field from API response
          trackingId: m.mentorFeedbackId || m.trackingId || m.id
        }));
        setMentor(enriched);
        console.log('✅ Mentor feedback loaded:', enriched.length);
        if (enriched.length > 0) {
          console.log('📋 Sample mentor feedback:', enriched[0]);
        }
      } catch (mentorErr) {
        console.warn('⚠️ Mentor feedback API error:', mentorErr.message);
        setMentor([]);
      }

      // Peer Feedback
      try {
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes.data?.data) ? peerRes.data.data : [];
        const peerData = allPeer.filter(p => Number(p.submittedByEmployeeId) === userEmpId);
        const enriched = peerData.map(p => ({
          ...p,
          recipientNameFull: employeeMap[p.recipientEmployeeId] || `Employee ${p.recipientEmployeeId}`,
          createdAtFormatted: formatDate(p.createdAt),
          queueId: p.queueId || p.id
        }));
        setPeer(enriched);
        console.log('✅ Peer feedback loaded:', enriched.length);
      } catch (peerErr) {
        console.warn('⚠️ Peer feedback API error:', peerErr.message);
        setPeer([]);
      }

      // Goal Feedback
      try {
        console.log('🔍 Fetching goal feedback with pagination...');
        
        const goalRes = await orgGoalFeedbackApi.list(1, 100);
        
        console.log('📊 Raw goal feedback response:', goalRes.data);
        
        if (goalRes.data?.success && Array.isArray(goalRes.data.data)) {
          const myGoals = goalRes.data.data
            .filter(g => Number(g.submittedByEmployeeId) === userEmpId)
            .map(g => ({
              ...g,
              objectiveTitle: objectives[g.organizationObjectiveId] || `Goal #${g.organizationObjectiveId}`,
              submittedAtFormatted: formatDate(g.createdAt),
              daysAgo: getDaysAgo(g.createdAt),
              feedbackId: g.orgGoalFeedbackId,
              rating: g.rating || 0,
              feedbackComments: g.feedbackComments || ''
            }));
          
          setGoalFeedback(myGoals);
          console.log('✅ Goal feedback loaded:', myGoals.length, 'items');
        } else {
          console.warn('⚠️ Invalid goal feedback response structure');
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
  }, [user?.empId, employeeMap, objectives]);

  useEffect(() => {
    fetchEmployeeMap();
    fetchObjectives();
  }, [fetchEmployeeMap, fetchObjectives]);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, [employeeMap, fetchData]);

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

  // Delete Handlers
  const deleteHRForm = async (responseId) => {
    if (!responseId) {
      showToast('Invalid response ID', 'error');
      return;
    }
    
    if (!window.confirm('Delete this HR form submission? This action cannot be undone.')) return;
    
    setError('');
    try {
      console.log('🗑️ Deleting HR form:', responseId);
      await hrFormApi.removeResponse(responseId);
      console.log('✅ HR form deleted successfully');
      
      showToast('HR form submission deleted successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error('❌ Delete HR form error:', err);
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete HR form';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const deleteMentor = async (trackingId) => {
    if (!trackingId) {
      showToast('Invalid mentor feedback ID', 'error');
      return;
    }
    
    if (!window.confirm('Delete this mentor feedback submission?')) return;
    
    setError('');
    try {
      console.log('🗑️ Deleting mentor feedback:', trackingId);
      await axios.delete(`${API_BASE}/MentorFeedback/${trackingId}`);
      console.log('✅ Mentor feedback deleted successfully');
      
      showToast('Mentor feedback deleted successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error('❌ Delete mentor error:', err);
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete mentor feedback';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const deletePeer = async (queueId) => {
    if (!queueId) {
      showToast('Invalid peer feedback ID', 'error');
      return;
    }
    
    if (!window.confirm('Delete this peer feedback submission?')) return;
    
    setError('');
    try {
      console.log('🗑️ Deleting peer feedback:', queueId);
      await peerQueueApi.remove(queueId);
      console.log('✅ Peer feedback deleted successfully');
      
      showToast('Peer feedback deleted successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error('❌ Delete peer error:', err);
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete peer feedback';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const deleteGoalFeedback = async (feedbackId) => {
    if (!feedbackId) {
      showToast('Invalid goal feedback ID', 'error');
      return;
    }
    
    if (!window.confirm('Delete this goal feedback submission?')) return;
    
    setError('');
    try {
      console.log('🗑️ Deleting goal feedback ID:', feedbackId);
      await orgGoalFeedbackApi.remove(feedbackId);
      console.log('✅ Goal feedback deleted successfully');
      
      showToast('Goal feedback deleted successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error('❌ Delete goal feedback error:', err);
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete goal feedback';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
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
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div 
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show position-fixed`}
          style={{ 
            top: '20px', 
            right: '20px', 
            zIndex: 9999,
            minWidth: '300px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          role="alert"
        >
          {toast.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setToast({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <User size={24} style={{ color: 'var(--color-primary-1)' }} />
            <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>
              {user?.firstName} {user?.lastName}'s Submissions
            </h2>
          </div>
          <p className="mb-0 small" style={{ color: 'var(--muted)' }}>
            View and manage all feedback you have submitted
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={() => {
            fetchEmployeeMap();
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
          <TabBtn label="HRForms" icon={FileText} active={tab === 'HRForms'} />
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
            {!loading && tab === 'HRForms' && `${hrForms.length} submission(s)`}
            {!loading && tab === 'Goal Feedback' && `${goalFeedback.length} submission(s)`}
            {!loading && tab === 'Mentor' && `${mentor.length} submission(s)`}
            {!loading && tab === 'Peer' && `${peer.length} submission(s)`}
          </small>
        </div>
      </div>

      {/* HR FORMS TAB */}
      {tab === 'HRForms' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FileText size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">HR Form Responses</h5>
            </div>
            {hrForms.length === 0 ? (
              <div className="alert alert-info mb-0">
                <AlertTriangle size={16} className="me-2" style={{ display: 'inline' }} />
                No HR form responses submitted yet
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
                            <h6 className="mb-0">{hr.formName || 'HR Form'}</h6>
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

                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-secondary flex-grow-1" 
                              onClick={() => handleViewResponse(hr, 'HR')}
                              title="View details"
                            >
                              <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => deleteHRForm(hr.responseId)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
                No goal feedback submitted yet
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
                          <h6 className="mb-0 small">{goal.objectiveTitle}</h6>
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

                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary flex-grow-1" 
                            onClick={() => handleViewResponse(goal, 'Goal')}
                            title="View details"
                          >
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => deleteGoalFeedback(goal.orgGoalFeedbackId)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
              <p className="text-muted mb-0">No mentor feedback submitted yet</p>
            ) : (
              <div className="row g-3">
                {mentor.map((m) => (
                  <div className="col-md-6 col-lg-4" key={m.trackingId || m.mentorFeedbackId || `mentor-${Math.random()}`}>
                    <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">Mentor:</h6>
                            <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                              <User size={14} className="me-1" style={{ display: 'inline' }} />
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
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary flex-grow-1" 
                            onClick={() => handleViewResponse(m, 'Mentor')}
                            title="View details"
                          >
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => deleteMentor(m.trackingId)} 
                            title="Delete"
                            disabled={!m.trackingId}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
              <p className="text-muted mb-0">No peer feedback submitted yet</p>
            ) : (
              <div className="row g-3">
                {peer.map((p) => (
                  <div className="col-md-6 col-lg-4" key={p.queueId || `peer-${Math.random()}`}>
                    <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">Feedback for:</h6>
                            <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
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

                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary flex-grow-1" 
                            onClick={() => handleViewResponse(p, 'Peer')}
                            title="View details"
                          >
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => deletePeer(p.queueId)} 
                            title="Delete"
                            disabled={!p.queueId}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
