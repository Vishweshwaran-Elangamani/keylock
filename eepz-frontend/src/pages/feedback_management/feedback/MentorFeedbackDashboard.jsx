import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, User, MessageSquare, Calendar, Filter, Eye, ThumbsUp, Clock, CheckCircle, Award, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mentorFeedbackApi } from '../../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';
 
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';
 
const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};
 
const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
 
const getRatingColor = (rating) => {
  const num = Number(rating);
  if (num === 5) return '#24A148';
  if (num === 4) return '#0F62FE';
  if (num === 3) return '#E2B93B';
  if (num === 2) return '#E89E14';
  if (num === 1) return '#E01950';
  return '#64748b';
};
 
export default function MentorFeedbackDashboard() {
  const navigate = useNavigate();
 
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : { empId: 1, firstName: 'John', lastName: 'Smith' };
    } catch {
      return { empId: 1, firstName: 'John', lastName: 'Smith' };
    }
  }, []);
 
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
 
  const [filters, setFilters] = useState({
    status: 'all',
    rating: 'all',
    skill: 'all'
  });
 
  // Fetch all data with employee name mapping
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
   
    try {
      const empId = user?.empId || user?.employeeId || 1;
     
      // FIRST: Fetch employee map
      console.log('🔍 Fetching employee map...');
      const empResponse = await axios.get(`${API_BASE}/EmployeeManagement/all`);
     
      let employeeMap = {};
      if (empResponse.data?.success && Array.isArray(empResponse.data.data)) {
        empResponse.data.data.forEach(emp => {
          employeeMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        console.log(' Employee map loaded:', Object.keys(employeeMap).length);
      }
     
      // THEN: Fetch mentor feedback
      console.log('🔍 Fetching mentor feedback...');
      const response = await mentorFeedbackApi.aboutMe(empId);
     
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Enrich with employee names
        const enriched = response.data.data.map(feedback => {
          // Use menteeEmployeeId from the API response
          const menteeId = feedback.menteeEmployeeId;
          const menteeName = employeeMap[menteeId] || `Employee ${menteeId}`;
         
          return {
            ...feedback,
            menteeName: menteeName,
            createdAtFormatted: formatDate(feedback.createdAt)
          };
        });
       
        setFeedbacks(enriched);
        setFilteredFeedbacks(enriched);
        console.log(' Feedback loaded:', enriched.length);
      } else {
        setFeedbacks([]);
        setFilteredFeedbacks([]);
      }
    } catch (err) {
      console.error('❌ Error fetching feedbacks:', err);
      setError('Failed to load feedback. Please try again.');
      setFeedbacks([]);
      setFilteredFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.empId]);
 
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
 
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };
 
  // Filter logic
  useEffect(() => {
    let filtered = [...feedbacks];
 
    if (filters.status !== 'all') {
      filtered = filtered.filter(f => f.status === filters.status);
    }
 
    if (filters.rating !== 'all') {
      filtered = filtered.filter(f => f.rating === Number(filters.rating));
    }
 
    if (filters.skill !== 'all') {
      filtered = filtered.filter(f => f.skillName === filters.skill);
    }
 
    setFilteredFeedbacks(filtered);
  }, [filters, feedbacks]);
 
  // Acknowledge feedback
  const handleAcknowledge = async (trackingId) => {
    try {
      const response = await mentorFeedbackApi.acknowledge(trackingId);
     
      if (response.data?.success) {
        setFeedbacks(prev => prev.map(f =>
          f.trackingId === trackingId ? { ...f, status: 'Acknowledged' } : f
        ));
        alert('✓ Feedback acknowledged successfully!');
      }
    } catch (err) {
      console.error('Error acknowledging feedback:', err);
      alert('Failed to acknowledge feedback');
    }
  };
 
  // Stats
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const avgRating = total > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
      : 0;
    const pending = feedbacks.filter(f => f.status === 'Submitted').length;
    const acknowledged = feedbacks.filter(f => f.status === 'Acknowledged').length;
 
    return { total, avgRating, pending, acknowledged };
  }, [feedbacks]);
 
  const uniqueSkills = useMemo(() => {
    return [...new Set(feedbacks.map(f => f.skillName).filter(Boolean))];
  }, [feedbacks]);
 
  const renderStars = (rating) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#FFB800' : 'none'}
            stroke={star <= rating ? '#FFB800' : '#cbd5e1'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };
 
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div style={{ padding: '1.25rem 1.75rem', maxWidth: '100%', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
     
      {/* BACK BUTTON & HEADER */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn d-flex align-items-center justify-content-center"
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <ArrowLeft size={18} style={{ color: '#64748b' }} />
        </button>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold mb-0" style={{ color: '#27235c', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
              SME Dashboard
            </h2>
            <span className="badge d-flex align-items-center gap-1" style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}>
              <Award size={14} />
              SME
            </span>
          </div>
          <p className="mb-0" style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Feedback from your mentees • {user.firstName} {user.lastName}
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            backgroundColor: 'transparent',
            border: '1.5px solid #0F62FE',
            color: '#0F62FE',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
 
      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger mb-3" style={{ borderRadius: '8px', border: 'none', backgroundColor: '#fee2e2', padding: '0.75rem 1rem' }}>
          <p className="mb-0" style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
        </div>
      )}
 
      {/* STATS CARDS */}
      <div className="row g-3 mb-3">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="card-body text-center" style={{ padding: '1.25rem 1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.875rem'
                }}
              >
                <MessageSquare size={28} color="#0F62FE" strokeWidth={2.5} />
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
                {stats.total}
              </h2>
              <p className="mb-0" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                Total Feedback
              </p>
            </div>
          </div>
        </div>
 
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="card-body text-center" style={{ padding: '1.25rem 1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.875rem'
                }}
              >
                <Star size={28} color="#E2B93B" strokeWidth={2.5} />
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
                {stats.avgRating}
              </h2>
              <p className="mb-0" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                Average Rating
              </p>
            </div>
          </div>
        </div>
 
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="card-body text-center" style={{ padding: '1.25rem 1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.875rem'
                }}
              >
                <Clock size={28} color="#E01950" strokeWidth={2.5} />
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
                {stats.pending}
              </h2>
              <p className="mb-0" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                Pending
              </p>
            </div>
          </div>
        </div>
 
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="card-body text-center" style={{ padding: '1.25rem 1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.875rem'
                }}
              >
                <CheckCircle size={28} color="#24A148" strokeWidth={2.5} />
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: '2rem', color: '#0f172a', lineHeight: 1 }}>
                {stats.acknowledged}
              </h2>
              <p className="mb-0" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                Acknowledged
              </p>
            </div>
          </div>
        </div>
      </div>
 
      {/* FILTERS */}
      <div className="card border-0 mb-3" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="card-body" style={{ padding: '1.25rem' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <Filter size={18} style={{ color: '#0f172a' }} />
            <h6 className="mb-0 fw-bold" style={{ color: '#0f172a', fontSize: '0.875rem' }}>Filter Feedback</h6>
          </div>
         
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.813rem', fontWeight: 600, color: '#64748b' }}>Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{ fontSize: '0.875rem', borderRadius: '6px' }}
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
 
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.813rem', fontWeight: 600, color: '#64748b' }}>Rating</label>
              <select
                className="form-select"
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                style={{ fontSize: '0.875rem', borderRadius: '6px' }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
 
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.813rem', fontWeight: 600, color: '#64748b' }}>Skill</label>
              <select
                className="form-select"
                value={filters.skill}
                onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                style={{ fontSize: '0.875rem', borderRadius: '6px' }}
              >
                <option value="all">All Skills</option>
                {uniqueSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
 
      {/* FEEDBACK LIST */}
      {filteredFeedbacks.length === 0 ? (
        <div className="card border-0" style={{ borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div className="card-body text-center py-5">
            <MessageSquare size={56} style={{ color: '#cbd5e1', opacity: 0.5 }} className="mb-3" />
            <h6 className="fw-bold mb-2" style={{ color: '#64748b', fontSize: '1.125rem' }}>
              No feedback found
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
              {feedbacks.length === 0
                ? "You haven't received any feedback from mentees yet"
                : "No feedback matches your current filters"}
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.trackingId} className="col-md-6 col-lg-4">
              <div
                className="card border-0 h-100"
                style={{
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${getRatingColor(feedback.rating)}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span
                      className="badge"
                      style={{
                        backgroundColor: feedback.status === 'Acknowledged' ? '#dbeafe' : feedback.status === 'Reviewed' ? '#dcfce7' : '#fef3c7',
                        color: feedback.status === 'Acknowledged' ? '#0F62FE' : feedback.status === 'Reviewed' ? '#24A148' : '#E2B93B',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        fontWeight: 600
                      }}
                    >
                      {feedback.status}
                    </span>
                    <div className="d-flex align-items-center gap-1">
                      <Star size={14} style={{ color: '#FFB800', fill: '#FFB800' }} />
                      <span className="fw-bold" style={{ fontSize: '0.813rem' }}>{feedback.rating}/5</span>
                    </div>
                  </div>
 
                  <h6 className="fw-bold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                    {feedback.skillName}
                  </h6>
 
                  <div className="mb-3">
                    <small style={{ fontSize: '0.75rem', color: '#64748b' }}>Feedback from</small>
                    <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                      <User size={14} />
                      {feedback.isAnonymous ? 'Anonymous' : feedback.menteeName}
                    </div>
                  </div>
 
                  <div className="mb-3" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <Calendar size={12} className="me-1" style={{ display: 'inline' }} />
                    {feedback.createdAtFormatted}
                  </div>
 
                  {feedback.feedbackComments && (
                    <p
                      className="mb-3"
                      style={{
                        fontSize: '0.813rem',
                        color: '#475569',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '60px',
                        lineHeight: 1.5
                      }}
                    >
                      {feedback.feedbackComments}
                    </p>
                  )}
 
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary flex-grow-1"
                      onClick={() => setSelectedFeedback(feedback)}
                      style={{ fontSize: '0.813rem', borderRadius: '6px', padding: '6px' }}
                    >
                      <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                      View
                    </button>
                    {feedback.status === 'Submitted' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(feedback.trackingId);
                        }}
                        style={{ fontSize: '0.813rem', borderRadius: '6px', padding: '6px 10px' }}
                        title="Acknowledge"
                      >
                        <ThumbsUp size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* DETAIL MODAL */}
      {selectedFeedback && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setSelectedFeedback(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1050,
              width: '90%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white" style={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
              <div className="p-4 border-bottom">
                <h5 className="mb-0 fw-bold" style={{ color: '#0f172a', fontSize: '1.125rem' }}>
                  Feedback Details
                </h5>
              </div>
              <div className="p-4">
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <small style={{ fontSize: '0.75rem', color: '#64748b' }}>Skill</small>
                    <div className="fw-semibold" style={{ color: '#0f172a' }}>{selectedFeedback.skillName}</div>
                  </div>
                  <div className="col-6">
                    <small style={{ fontSize: '0.75rem', color: '#64748b' }}>Rating</small>
                    <div className="d-flex align-items-center gap-2">
                      {renderStars(selectedFeedback.rating)}
                      <span className="fw-bold">{selectedFeedback.rating}/5</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <small style={{ fontSize: '0.75rem', color: '#64748b' }}>From</small>
                    <div className="fw-semibold" style={{ color: '#0f172a' }}>
                      {selectedFeedback.isAnonymous ? 'Anonymous' : selectedFeedback.menteeName}
                    </div>
                  </div>
                  <div className="col-6">
                    <small style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted</small>
                    <div className="fw-semibold" style={{ color: '#0f172a' }}>{selectedFeedback.createdAtFormatted}</div>
                  </div>
                </div>
 
                <div>
                  <small style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Feedback Comments</small>
                  <div className="p-3 mt-2" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #0F62FE' }}>
                    <p className="mb-0" style={{ fontSize: '0.875rem', color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedFeedback.feedbackComments}
                    </p>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 p-4 border-top">
                {selectedFeedback.status === 'Submitted' && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      handleAcknowledge(selectedFeedback.trackingId);
                      setSelectedFeedback(null);
                    }}
                    style={{ borderRadius: '8px', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    <ThumbsUp size={16} className="me-2" style={{ display: 'inline' }} />
                    Acknowledge
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => setSelectedFeedback(null)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.625rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: 'none'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
 
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
 
 