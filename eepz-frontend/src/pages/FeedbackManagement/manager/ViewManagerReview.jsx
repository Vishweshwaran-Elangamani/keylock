import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, User, Star, Target, Briefcase, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ 
    backgroundColor: `${color}20`, 
    color, 
    padding: '6px 12px', 
    fontSize: '0.75rem', 
    fontWeight: '600', 
    borderRadius: '6px' 
  }}>
    {text}
  </span>
);

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export default function ViewManagerReview() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || {}, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [review, setReview] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH REVIEW DATA
  // ============================================================================

  const fetchReviewData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch employee map
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
        console.warn('⚠️ Error fetching employee map:', err.message);
      }

      // Fetch review details
      const reviewRes = await axios.get(`${API_BASE}/ManagerReview/${id}`);
      if (reviewRes.data?.success && reviewRes.data.data) {
        const reviewData = {
          ...reviewRes.data.data,
          targetEmployeeName: empMap[reviewRes.data.data.targetEmployeeId] || reviewRes.data.data.targetEmployeeName || `Employee ${reviewRes.data.data.targetEmployeeId}`,
          managerName: empMap[reviewRes.data.data.managerEmployeeId] || `Manager ${reviewRes.data.data.managerEmployeeId}`
        };
        setReview(reviewData);
        console.log('✅ Review loaded:', reviewData);
      } else {
        setError('Review not found');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load review');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReviewData();
    }
  }, [id]);

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading review details...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container-fluid py-3" style={{ maxWidth: '900px' }}>
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <AlertTriangle size={18} />
          Review not found
        </div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="me-2" style={{ display: 'inline' }} />
          Go Back
        </button>
      </div>
    );
  }

  const statusColor = review.status === 'Finalized' ? '#24A148' : review.status === 'Submitted' ? '#0F62FE' : '#E2B93B';

  return (
    <div className="d-flex justify-content-center py-4" style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <div style={{ width: '100%', maxWidth: '900px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>Review Details</h2>
              <p className="mb-0 small text-muted">
                {review.targetEmployeeName} • {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchReviewData}
            disabled={loading}
            title="Refresh"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* SUCCESS ALERT */}
        {success && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{success}</div>
            <button className="btn-close" onClick={() => setSuccess('')} />
          </div>
        )}

        {/* STATUS & RATING CARD */}
        <div className="card border-0 mb-4" style={{ 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <User size={20} />
                  <small className="opacity-75">Reviewing</small>
                </div>
                <h4 className="fw-bold mb-0">{review.targetEmployeeName}</h4>
              </div>
              <div className="col-md-6 text-md-end mt-3 mt-md-0">
                <div className="d-flex align-items-center justify-content-md-end gap-2 mb-2">
                  <Star size={20} style={{ fill: 'white' }} />
                  <small className="opacity-75">Rating</small>
                </div>
                <h3 className="fw-bold mb-0">
                  {review.rating}/5
                  <span className="ms-2" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    ({RATING_LABELS[review.rating]})
                  </span>
                </h3>
                <div className="mt-1">
                  {[...Array(5)].map((_, index) => (
                    <Star 
                      key={index}
                      size={16} 
                      style={{ 
                        color: 'white', 
                        fill: index < review.rating ? 'white' : 'transparent',
                        marginRight: '2px'
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INFO CARDS ROW */}
        <div className="row g-3 mb-4">
          {/* Status */}
          <div className="col-md-4">
            <div className="card border-0 h-100" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)' }}>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <CheckCircle size={16} style={{ color: 'var(--color-primary-1)' }} />
                  <small className="text-muted fw-bold">Status</small>
                </div>
                <Badge text={review.status || 'Submitted'} color={statusColor} />
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="col-md-4">
            <div className="card border-0 h-100" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)' }}>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <User size={16} style={{ color: 'var(--color-primary-1)' }} />
                  <small className="text-muted fw-bold">Reviewed By</small>
                </div>
                <p className="mb-0 fw-semibold">{review.managerName}</p>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className="col-md-4">
            <div className="card border-0 h-100" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)' }}>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Calendar size={16} style={{ color: 'var(--color-primary-1)' }} />
                  <small className="text-muted fw-bold">Created On</small>
                </div>
                <p className="mb-0 fw-semibold">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEW COMMENT */}
        <div className="card border-0 mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={20} style={{ color: 'white' }} />
              </div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>Review Comment</h5>
            </div>
            <p className="mb-0" style={{ lineHeight: '1.8', color: '#333', fontSize: '1rem' }}>
              {review.reviewComment}
            </p>
          </div>
        </div>

        {/* PROJECT & GOAL CONTEXT */}
        {(review.projectContext || review.goalContext) && (
          <div className="row g-3 mb-4">
            {review.projectContext && (
              <div className="col-md-6">
                <div className="card border-0 h-100" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <Briefcase size={18} style={{ color: '#0F62FE' }} />
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>Project Context</h6>
                    </div>
                    <p className="mb-0" style={{ lineHeight: '1.6' }}>{review.projectContext}</p>
                  </div>
                </div>
              </div>
            )}
            {review.goalContext && (
              <div className="col-md-6">
                <div className="card border-0 h-100" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <Target size={18} style={{ color: '#24A148' }} />
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>Goal Context</h6>
                    </div>
                    <p className="mb-0" style={{ lineHeight: '1.6' }}>{review.goalContext}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBMITTED DATE */}
        {review.submittedDate && (
          <div className="card border-0 mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#f8f9fa' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle size={16} style={{ color: '#24A148' }} />
                <small className="text-muted">Submitted on</small>
                <strong>{new Date(review.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        )}

        {/* FINALIZED MESSAGE */}
        {review.status === 'Finalized' && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CheckCircle size={20} />
            <div>
              <strong>Review Finalized</strong>
              <p className="mb-0 small">This review has been finalized and can no longer be modified.</p>
            </div>
          </div>
        )}

        {/* BACK BUTTON */}
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary flex-grow-1"
            onClick={() => navigate(-1)}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <ArrowLeft size={16} className="me-2" style={{ display: 'inline' }} />
            Back to List
          </button>
        </div>

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
