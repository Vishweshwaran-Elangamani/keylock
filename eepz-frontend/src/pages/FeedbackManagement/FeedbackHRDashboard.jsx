import React, { useEffect, useState, useMemo } from 'react';
import { 
  RefreshCw, AlertTriangle, FileText, Eye, Search, 
  TrendingUp, Plus, Send, Star, Users, ArrowRight, 
  Target, Zap, User, Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { peerQueueApi } from '../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';

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

export default function FeedbackHRDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1001, firstName: 'Alice', lastName: 'HR' }, []);
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // HR-specific data
  const [feedback, setFeedback] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  
  // Employee-like data (HR as employee)
  const [myPeerFeedback, setMyPeerFeedback] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [activeHrForms, setActiveHrForms] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // ============================================================================
  // FETCH EMPLOYEES
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('✅ Employee map created:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('❌ Error fetching employees:', err.message);
    }
  };

  // ============================================================================
  // FETCH DASHBOARD DATA
  // ============================================================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const hrId = user?.empId || 1001;

      // Peer feedback queue (HR role)
      try {
        const res = await peerQueueApi.list(1, 100);
        const feedbackData = res.data?.data || [];
        
        const mappedFeedback = feedbackData.map(item => ({
          ...item,
          submitterName: employeeMap[item.submittedByEmployeeId] || `Employee ${item.submittedByEmployeeId}`,
          recipientName: employeeMap[item.recipientEmployeeId] || `Employee ${item.recipientEmployeeId}`
        }));
        
        setFeedback(mappedFeedback);
        console.log('✅ Peer feedback loaded:', mappedFeedback.length);
      } catch (err) {
        console.warn('⚠️ Error fetching peer feedback:', err.message);
      }

      // Peer feedback received (HR as employee)
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        if (Array.isArray(peerRes.data?.data)) {
          const myFeedback = peerRes.data.data
            .filter(p => p.recipientEmployeeId === hrId)
            .map(p => ({
              ...p,
              submittedByName: employeeMap[p.submittedByEmployeeId] || `Employee ${p.submittedByEmployeeId}`
            }));
          setMyPeerFeedback(myFeedback);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching my peer feedback:', err.message);
      }

      // Active HR Forms
      try {
        const activeRes = await axios.get(`${API_BASE}/HrFeedbackForm/forms/active`);
        if (activeRes.data?.success) {
          setActiveHrForms(activeRes.data.data || []);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching active forms:', err.message);
      }

      // Submitted HR Forms (HR as employee)
      try {
        const submittedRes = await axios.get(`${API_BASE}/HrFeedbackForm/responses/by-employee/${hrId}`);
        if (submittedRes.data?.success) {
          setSubmittedForms(submittedRes.data.data || []);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching submitted forms:', err.message);
      }

      // Reviews about me
      try {
        const reviewRes = await axios.get(`${API_BASE}/ManagerReview/target/${hrId}`);
        if (reviewRes.data?.success && Array.isArray(reviewRes.data.data)) {
          setMyReviews(reviewRes.data.data);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching my reviews:', err.message);
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchDashboardData();
    }
  }, [employeeMap, user?.empId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const refresh = async () => {
    setRefreshing(true);
    await fetchEmployeeMap();
    await fetchDashboardData();
    setRefreshing(false);
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const submittedFormIds = new Set(submittedForms.map(f => f.formId));
    const pendingForms = activeHrForms.filter(f => !submittedFormIds.has(f.formId)).length;

    return [
      { label: 'Total Feedback', value: feedback.length, Icon: FileText, color: '#525252' },
     
    ];
  }, [feedback, activeHrForms, submittedForms, myPeerFeedback]);

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
              HR Dashboard
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

        </li>
        <li className="nav-item">
         
        </li>
      </ul>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* QUICK ACTIONS - DUAL ROLE */}
          <div className="card border-0 mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Zap size={20} style={{ color: 'var(--color-primary-1)' }} />
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              
              {/* HR-specific actions */}
              <h6 className="small text-muted mb-2">HR Functions</h6>
              <div className="row g-2 mb-3">
               
                <div className="col-6 col-md-3">
                  <Link to="/hr/dashboard/feedback/hrformlist" className="btn btn-outline-primary w-100">
                    <Search size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">All Feedback</span>
                  </Link>
                </div>
                <div className="col-6 col-md-3">
                  <Link to="/hr/dashboard/feedback/create-form" className="btn btn-outline-primary w-100">
                    <Plus size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Create Form</span>
                  </Link>
                </div>
                
              </div>

              {/* Employee-like actions */}
              <h6 className="small text-muted mb-2">Submit Feedback</h6>
              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <Link to="/hr/dashboard/feedback/submit-mentor" className="btn btn-outline-secondary w-100">
                    <Send size={16} className="me-1" style={{ display: 'inline' }} />
                    <span className="small">Mentor Feedback</span>
                  </Link>
                </div>
                
             
              </div>
            </div>
          </div>

       

          {/* FEEDBACK OVERVIEW */}
          
        </>
      )}

      {/* HR OPERATIONS TAB */}
      {activeTab === 'hr-operations' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <h5 className="fw-bold mb-4" style={{ color: 'var(--color-primary-1)' }}>
              Recent Feedback ({feedback.length})
            </h5>
            
            {feedback.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={48} className="mb-3" style={{ color: 'var(--muted)' }} />
                <p className="text-muted mb-0">No feedback to review yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ color: 'var(--color-primary-1)' }}>From</th>
                      <th style={{ color: 'var(--color-primary-1)' }}>To</th>
                      <th style={{ color: 'var(--color-primary-1)' }}>Content</th>
                      <th style={{ color: 'var(--color-primary-1)' }}>Date</th>
                      <th style={{ color: 'var(--color-primary-1)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item, index) => (
                      <tr key={`feedback-${item.queueId || index}`}>
                        <td className="small fw-bold">{item.submitterName}</td>
                        <td className="small fw-bold">{item.recipientName}</td>
                        <td className="small text-truncate" style={{ maxWidth: '300px' }}>
                          {item.feedbackContent || 'No content'}
                        </td>
                        <td className="small text-muted">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <Link to="/hr/review-queue" className="btn btn-sm btn-outline-secondary">
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
                {myPeerFeedback.map(feedbackItem => (
                  <div className="col-12" key={feedbackItem.peerQueueId || feedbackItem.contextFeedbackId}>
                    <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-1">{feedbackItem.submittedByName}</h6>
                            <small className="text-muted">
                              {feedbackItem.submittedDate 
                                ? new Date(feedbackItem.submittedDate).toLocaleDateString()
                                : new Date(feedbackItem.createdAt).toLocaleDateString()
                              }
                            </small>
                          </div>
                          <span className="badge" style={{ backgroundColor: '#9D4EDD20', color: '#9D4EDD', padding: '6px 12px' }}>
                            Peer Feedback
                          </span>
                        </div>
                        <p className="mb-0" style={{ lineHeight: '1.6', color: '#333' }}>
                          {feedbackItem.comment || feedbackItem.feedbackComment || feedbackItem.feedbackContent || 'No comment provided'}
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
