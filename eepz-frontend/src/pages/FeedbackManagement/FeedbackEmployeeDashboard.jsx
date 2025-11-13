import React, { useEffect, useState, useMemo } from 'react';
import { 
  RefreshCw, AlertTriangle, FileText, CheckCircle, Clock, 
  Send, Search, Eye, User, Zap, Star, Users, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { peerQueueApi } from '../../services/feedbackmanagement/feedbackApi';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const StatCard = ({ label, value, Icon, color }) => (
  <div className="card border-0" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
    <div className="card-body text-center">
      <div className="d-flex justify-content-center mb-2">
        <div className="rounded p-2" style={{ background: `${color}15` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <h3 className="fw-bold" style={{ color }}>{value}</h3>
      <p className="mb-0 small text-muted">{label}</p>
    </div>
  </div>
);

export default function FeedbackEmployeeDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1004, firstName: 'Dave', lastName: 'Dev' });

  const [activeHrForms, setActiveHrForms] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH DASHBOARD DATA
  // ============================================================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const empId = user?.empId || 1004;

      // Employee map
      let empMap = {};
      try {
        const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach(emp => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn('Error fetching employee map:', err.message);
      }

      // Active HR Forms
      try {
        const activeRes = await axios.get(`${API_BASE}/HrFeedbackForm/forms/active`);
        if (activeRes.data?.success) {
          setActiveHrForms(activeRes.data.data || []);
        }
      } catch (err) {
        console.warn('Error fetching active forms:', err.message);
      }

      // Submitted HR Forms
      try {
        const submittedRes = await axios.get(`${API_BASE}/HrFeedbackForm/responses/by-employee/${empId}`);
        if (submittedRes.data?.success) {
          setSubmittedForms(submittedRes.data.data || []);
        }
      } catch (err) {
        console.warn('Error fetching submitted forms:', err.message);
      }

      // Reviews about me
      try {
        const reviewRes = await axios.get(`${API_BASE}/ManagerReview/target/${empId}`);
        if (reviewRes.data?.success && Array.isArray(reviewRes.data.data)) {
          setMyReviews(reviewRes.data.data);
        }
      } catch (err) {
        console.warn('Error fetching my reviews:', err.message);
      }

      // Peer feedback
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        if (Array.isArray(peerRes.data?.data)) {
          const myFeedback = peerRes.data.data
            .filter(p => p.recipientEmployeeId === empId)
            .map(p => ({
              ...p,
              submittedByName: empMap[p.submittedByEmployeeId] || `Employee ${p.submittedByEmployeeId}`
            }));
          setMyPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn('Error fetching peer feedback:', err.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.empId]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const submittedFormIds = new Set(submittedForms.map(f => f.formId));
    const pending = activeHrForms.filter(f => !submittedFormIds.has(f.formId)).length;
    const submitted = submittedForms.length;

    return [
      { label: 'Pending Forms', value: pending, Icon: Clock, color: '#E2B93B' },
      { label: 'Submitted Forms', value: submitted, Icon: CheckCircle, color: '#24A148' },
      { label: 'Reviews Received', value: myReviews.length, Icon: Star, color: '#0F62FE' },
      { label: 'Peer Feedback', value: myPeerFeedback.length, Icon: Users, color: '#9D4EDD' }
    ];
  }, [activeHrForms, submittedForms, myReviews, myPeerFeedback]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1200px' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <User size={24} style={{ color: 'var(--color-primary-1)' }} />
            <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>
              Employee Dashboard
            </h2>
          </div>
          <p className="mb-0 small text-muted">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={refresh}
          disabled={refreshing}
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
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={18} className="mt-1" />
          <div className="flex-grow-1">
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* STATS - 4 CARDS */}
      <div className="row g-3 mb-4">
        {stats.map((s, idx) => (
          <div key={idx} className="col-6 col-md-3">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid var(--border)' }}>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              borderBottom: activeTab === 'overview' ? '3px solid var(--color-primary-1)' : 'none',
              color: activeTab === 'overview' ? 'var(--color-primary-1)' : 'var(--muted)',
              fontWeight: '600'
            }}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'peer-feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('peer-feedback')}
            style={{
              borderBottom: activeTab === 'peer-feedback' ? '3px solid var(--color-primary-1)' : 'none',
              color: activeTab === 'peer-feedback' ? 'var(--color-primary-1)' : 'var(--muted)',
              fontWeight: '600'
            }}
          >
            Peer Feedback ({myPeerFeedback.length})
          </button>
        </li>
      </ul>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* QUICK ACTIONS */}
          <div className="card border-0 mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Zap size={20} style={{ color: 'var(--color-primary-1)' }} />
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <Link to="/employee/dashboard/feedback/submit-mentor" className="btn btn-outline-primary w-100">
                    <Send size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Mentor Feedback</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link to="/employee/dashboard/feedback/contextfeedback" className="btn btn-outline-primary w-100">
                    <Zap size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Context Feedback</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link to="/employee/dashboard/feedback/assignedform" className="btn btn-outline-primary w-100">
                    <Eye size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Assigned Forms</span>
                  </Link>
                </div>
                
                <div className="col-6 col-md-3">
                  <Link to="/employee/dashboard/feedback/submit-peer" className="btn btn-outline-info w-100">
                    <Users size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Peer Feedback</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link to="/employee/dashboard/feedback/submissions" className="btn btn-outline-secondary w-100">
                    <Search size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">My Submissions</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* FEEDBACK OVERVIEW */}
          
        </>
      )}

      {/* PEER FEEDBACK TAB */}
      {activeTab === 'peer-feedback' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <h5 className="fw-bold mb-4" style={{ color: 'var(--color-primary-1)' }}>
              All Peer Feedback ({myPeerFeedback.length})
            </h5>
            
            {myPeerFeedback.length === 0 ? (
              <div className="text-center py-5">
                <Users size={48} className="mb-3" style={{ color: 'var(--muted)' }} />
                <p className="text-muted mb-0">No peer feedback received yet</p>
              </div>
            ) : (
              <div className="row g-3">
                {myPeerFeedback.map(feedback => (
                  <div className="col-12" key={feedback.peerQueueId || feedback.contextFeedbackId}>
                    <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-1">{feedback.submittedByName}</h6>
                            <small className="text-muted">
                              {feedback.submittedDate 
                                ? new Date(feedback.submittedDate).toLocaleDateString()
                                : new Date(feedback.createdAt).toLocaleDateString()
                              }
                            </small>
                          </div>
                          <span className="badge" style={{ backgroundColor: '#9D4EDD20', color: '#9D4EDD', padding: '6px 12px' }}>
                            Peer Feedback
                          </span>
                        </div>
                        <p className="mb-0" style={{ lineHeight: '1.6', color: '#333' }}>
                          {feedback.comment || feedback.feedbackComment || 'No comment provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
