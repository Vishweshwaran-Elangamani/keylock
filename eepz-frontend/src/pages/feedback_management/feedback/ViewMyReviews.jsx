import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, ArrowLeft, Star, User, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600' }}>
    {text}
  </span>
);

export default function ViewMyReviews() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || {}, []);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH REVIEWS
  // ============================================================================

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const empId = user?.empId;
      if (!empId) {
        setError('Employee ID not found');
        setLoading(false);
        return;
      }

      // STEP 1: Fetch employee map
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

      // STEP 2: Fetch reviews about me (where I'm the target)
      const reviewRes = await axios.get(`${API_BASE}/ManagerReview/target/${empId}`);
      if (reviewRes.data?.success && Array.isArray(reviewRes.data.data)) {
        const enriched = reviewRes.data.data.map(r => ({
          ...r,
          managerName: empMap[r.managerEmployeeId] || `Manager ${r.managerEmployeeId}`
        }));
        setReviews(enriched);
        console.log('My reviews loaded:', enriched.length);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reviews');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.empId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

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
    <div className="d-flex justify-content-center py-4" style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <div style={{ width: '100%', maxWidth: '1000px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* HEADER */}
        <div className="d-flex align-items-start mb-4">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>My Reviews</h2>
            <p className="mb-0 small text-muted">
              Reviews you have received from your managers
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchReviews}
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

        {/* STATS */}
        {reviews.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-2">
                    <div className="rounded p-2" style={{ background: '#0F62FE15' }}>
                      <Eye size={24} style={{ color: '#0F62FE' }} />
                    </div>
                  </div>
                  <h3 className="fw-bold" style={{ color: '#0F62FE' }}>{reviews.length}</h3>
                  <p className="mb-0 small text-muted">Reviews Received</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-2">
                    <div className="rounded p-2" style={{ background: '#24A14815' }}>
                      <Star size={24} style={{ color: '#24A148' }} />
                    </div>
                  </div>
                  <h3 className="fw-bold" style={{ color: '#24A148' }}>
                    {'⭐'.repeat(Math.round(averageRating))}
                  </h3>
                  <p className="mb-0 small text-muted">Average Rating: {averageRating}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS LIST */}
        {reviews.length === 0 ? (
          <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div className="card-body text-center py-5">
              <Star size={48} className="mb-3" style={{ color: 'var(--muted)' }} />
              <h5 className="text-muted mb-2">No reviews yet</h5>
              <p className="small text-muted mb-0">
                Check back later for reviews from your managers
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {reviews.map(review => (
              <div className="col-12" key={review.reviewcommentId}>
                <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
                  <div className="card-body">
                    {/* Manager & Rating */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <User size={16} style={{ color: 'var(--color-primary-1)' }} />
                          <h6 className="fw-bold mb-0">{review.managerName}</h6>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={14} className="text-muted" />
                          <small className="text-muted">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="mb-2">
                          <span title={`Rating: ${review.rating}`} style={{ fontSize: '1.5rem' }}>
                            {'⭐'.repeat(review.rating || 0)}
                          </span>
                        </div>
                        <Badge text={`${review.rating}/5`} color="#24A148" />
                      </div>
                    </div>

                    {/* Review Comment */}
                    <div className="mb-3">
                      <h6 className="small fw-bold text-muted mb-2">Review</h6>
                      <p className="mb-0" style={{ lineHeight: '1.6', color: '#333' }}>
                        {review.reviewComment}
                      </p>
                    </div>

                    {/* Project & Goal Context */}
                    {(review.projectContext || review.goalContext) && (
                      <div className="row g-2">
                        {review.projectContext && (
                          <div className="col-md-6">
                            <div className="p-2 rounded" style={{ backgroundColor: '#f9f9f9' }}>
                              <h6 className="small fw-bold text-muted mb-1">Project Context</h6>
                              <p className="small mb-0">{review.projectContext}</p>
                            </div>
                          </div>
                        )}
                        {review.goalContext && (
                          <div className="col-md-6">
                            <div className="p-2 rounded" style={{ backgroundColor: '#f9f9f9' }}>
                              <h6 className="small fw-bold text-muted mb-1">Goal Context</h6>
                              <p className="small mb-0">{review.goalContext}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
