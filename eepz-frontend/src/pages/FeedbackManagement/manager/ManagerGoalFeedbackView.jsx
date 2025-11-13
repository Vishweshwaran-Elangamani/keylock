import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Target, Calendar, MessageCircle, Star, User, Briefcase, ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export default function ManagerGoalFeedbackView() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || {}, []);
  const isManager = user?.role?.toLowerCase() === 'manager' || user?.roleName?.toLowerCase() === 'manager';

  const [activeTab, setActiveTab] = useState('myFeedback'); // 'myFeedback' or 'teamFeedback'
  const [myGoalFeedback, setMyGoalFeedback] = useState([]);
  const [teamGoalFeedback, setTeamGoalFeedback] = useState([]);
  const [objectives, setObjectives] = useState({});
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (dateInput) => {
    if (!dateInput) return '—';
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2000) return '—';
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('✅ Employee map loaded:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('❌ Error fetching employees:', err.message);
    }
  };

  // Fetch Objectives
  const fetchObjectives = async () => {
    try {
      const response = await axios.get(`${API_BASE}/Orgwideobjectives`);
      const objectivesData = response.data?.data || response.data || [];
      
      if (Array.isArray(objectivesData)) {
        const objMap = {};
        objectivesData.forEach(obj => {
          objMap[obj.objectiveId] = obj.title || obj.objectiveName || `Objective ${obj.objectiveId}`;
        });
        setObjectives(objMap);
        console.log('✅ Objectives loaded:', Object.keys(objMap).length);
      }
    } catch (err) {
      console.error('❌ Error loading objectives:', err.message);
    }
  };

  // Fetch Goal Feedback
  const fetchGoalFeedback = async () => {
    setLoading(true);
    setError('');

    try {
      const empId = user?.empId;
      if (!empId) {
        setError('Employee ID not found');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching goal feedback for manager ID:', empId);

      // Fetch all goal feedback with pagination
      const response = await axios.get(`${API_BASE}/OrgGoalFeedback/all`, {
        params: {
          pageNumber: 1,
          pageSize: 100
        }
      });

      console.log('📊 Raw goal feedback response:', response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const allFeedback = response.data.data;

        // Filter: My feedback (submitted by me)
        const myFeedback = allFeedback
          .filter(f => Number(f.submittedByEmployeeId) === Number(empId))
          .map(f => ({
            ...f,
            objectiveTitle: f.organizationGoalName || objectives[f.organizationObjectiveId] || `Objective #${f.organizationObjectiveId}`,
            submitterName: employeeMap[f.submittedByEmployeeId] || f.submitterName || `Employee ${f.submittedByEmployeeId}`,
            formattedDate: formatDate(f.createdAt)
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMyGoalFeedback(myFeedback);
        console.log('✅ My goal feedback count:', myFeedback.length);

        // Filter: Team feedback (submitted by my team members where I'm the manager)
        if (isManager) {
          const teamFeedback = allFeedback
            .filter(f => {
              // Option 1: If managerEmployeeId is set in the feedback
              if (f.managerEmployeeId) {
                return Number(f.managerEmployeeId) === Number(empId);
              }
              
              // Option 2: If no managerEmployeeId, you can check if submitter reports to this manager
              // This would require an additional API call to get team members
              // For now, we'll show all feedback except the manager's own
              return Number(f.submittedByEmployeeId) !== Number(empId);
            })
            .map(f => ({
              ...f,
              objectiveTitle: f.organizationGoalName || objectives[f.organizationObjectiveId] || `Objective #${f.organizationObjectiveId}`,
              submitterName: employeeMap[f.submittedByEmployeeId] || f.submitterName || `Employee ${f.submittedByEmployeeId}`,
              formattedDate: formatDate(f.createdAt)
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setTeamGoalFeedback(teamFeedback);
          console.log('✅ Team goal feedback count:', teamFeedback.length);
        }
      } else {
        console.warn('⚠️ Invalid goal feedback data structure');
        setMyGoalFeedback([]);
        setTeamGoalFeedback([]);
      }
    } catch (err) {
      console.error('❌ Error fetching goal feedback:', err);
      setError('Failed to load goal feedback. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchEmployees();
      await fetchObjectives();
      await fetchGoalFeedback();
    };
    
    if (user?.empId) {
      loadData();
    }
  }, [user?.empId]);

  const renderFeedbackCard = (feedback, showSubmitter = false) => (
    <div className="col-12 col-md-6 col-lg-4" key={feedback.orgGoalFeedbackId}>
      <div 
        className="card border-0 shadow-sm h-100" 
        style={{ 
          borderRadius: '8px', 
          borderLeft: '4px solid #0F62FE' 
        }}
      >
        <div className="card-body">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Target size={16} style={{ color: '#0F62FE' }} />
                <h6 className="fw-bold mb-0 small">
                  {feedback.objectiveTitle}
                </h6>
              </div>
              {showSubmitter && (
                <div className="d-flex align-items-center gap-2 mb-2">
                  <User size={14} className="text-muted" />
                  <small className="text-muted">
                    {feedback.submitterName}
                  </small>
                </div>
              )}
              <div className="d-flex align-items-center gap-2">
                <Calendar size={14} className="text-muted" />
                <small className="text-muted">
                  {feedback.formattedDate}
                </small>
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-2">
              {/* Rating */}
              <div className="d-flex align-items-center gap-2">
                <Star size={16} style={{ color: '#FFB800', fill: '#FFB800' }} />
                <span className="fw-bold" style={{ color: '#0F62FE' }}>
                  {feedback.rating}/5
                </span>
              </div>
              <span className="badge" style={{ backgroundColor: '#0F62FE20', color: '#0F62FE', fontSize: '0.7rem' }}>
                {RATING_LABELS[feedback.rating] || 'N/A'}
              </span>
            </div>
          </div>

          {/* Feedback Source & Status */}
          <div className="mb-3">
            <span 
              className="badge me-2" 
              style={{ 
                backgroundColor: feedback.feedbackFrom === 'Manager' ? '#24A14820' : '#0F62FE20', 
                color: feedback.feedbackFrom === 'Manager' ? '#24A148' : '#0F62FE' 
              }}
            >
              {feedback.feedbackFrom || 'Employee'} Feedback
            </span>
            {feedback.isAnonymous && (
              <span className="badge" style={{ backgroundColor: '#E0195020', color: '#E01950' }}>
                Anonymous
              </span>
            )}
          </div>

          {/* Comments */}
          {feedback.feedbackComments && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <MessageCircle size={14} style={{ color: '#0F62FE' }} />
                <h6 className="small fw-bold text-muted mb-0">Comments</h6>
              </div>
              <p className="mb-0 small ps-3" style={{ lineHeight: '1.6', color: '#555' }}>
                {feedback.feedbackComments.length > 100 
                  ? feedback.feedbackComments.substring(0, 100) + '...' 
                  : feedback.feedbackComments}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <RefreshCw size={40} className="text-primary mb-3" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-muted">Loading goal feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center py-4" style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <div style={{ width: '100%', maxWidth: '1200px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* HEADER */}
        <div className="d-flex align-items-start mb-4">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
            style={{ borderRadius: '8px' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-1" style={{ color: '#0F62FE' }}>
              <Target size={24} className="me-2" style={{ display: 'inline' }} />
              Goal Feedback - Manager View
            </h2>
            <p className="mb-0 small text-muted">
              View your submissions and team feedback on organizational goals
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              fetchEmployees();
              fetchObjectives();
              fetchGoalFeedback();
            }}
            disabled={loading}
            title="Refresh"
            style={{ borderRadius: '8px' }}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <AlertTriangle size={18} className="me-2" style={{ display: 'inline' }} />
            <strong>Error:</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* TABS */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '8px' }}>
          <div className="card-body p-0">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${activeTab === 'myFeedback' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('myFeedback')}
                style={{ borderRadius: '8px 0 0 8px', padding: '1rem' }}
              >
                <User size={16} className="me-2" style={{ display: 'inline' }} />
                My Feedback ({myGoalFeedback.length})
              </button>
              {isManager && (
                <button
                  type="button"
                  className={`btn ${activeTab === 'teamFeedback' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveTab('teamFeedback')}
                  style={{ borderRadius: '0 8px 8px 0', padding: '1rem' }}
                >
                  <Briefcase size={16} className="me-2" style={{ display: 'inline' }} />
                  Team Feedback ({teamGoalFeedback.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MY FEEDBACK TAB */}
        {activeTab === 'myFeedback' && (
          <>
            {myGoalFeedback.length === 0 ? (
              <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                <div className="card-body text-center py-5">
                  <Target size={48} className="mb-3" style={{ color: '#ccc' }} />
                  <h5 className="text-muted mb-2">No goal feedback submitted yet</h5>
                  <p className="small text-muted mb-0">
                    Submit feedback on organizational objectives to see them here
                  </p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {myGoalFeedback.map(feedback => renderFeedbackCard(feedback, false))}
              </div>
            )}
          </>
        )}

        {/* TEAM FEEDBACK TAB (Manager Only) */}
        {activeTab === 'teamFeedback' && isManager && (
          <>
            {teamGoalFeedback.length === 0 ? (
              <div className="card border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                <div className="card-body text-center py-5">
                  <Users size={48} className="mb-3" style={{ color: '#ccc' }} />
                  <h5 className="text-muted mb-2">No team feedback yet</h5>
                  <p className="small text-muted mb-0">
                    Goal feedback from your team members will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {teamGoalFeedback.map(feedback => renderFeedbackCard(feedback, true))}
              </div>
            )}
          </>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
