import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Eye, Filter, Download, BarChart3, Clock, CheckCircle, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '4px 8px', fontSize: '0.7rem' }}>
    {text}
  </span>
);

export default function DeptHeadReviewList() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [employeeMap, setEmployeeMap] = useState({});
  const [filterManager, setFilterManager] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [managers, setManagers] = useState([]);

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const map = {};
        res.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
      }
    } catch (err) {
      console.error('Error fetching employee map:', err.message);
    }
  };

  // ============================================================================
  // FETCH ALL REVIEWS
  // ============================================================================

  const fetchReviews = async () => {
    setRefreshing(true);
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_BASE}/ManagerReview/all`);
      
      if (res.data?.success && Array.isArray(res.data.data)) {
        const enriched = res.data.data.map(review => ({
          ...review,
          managerName: employeeMap[review.managerEmployeeId] || `Manager ${review.managerEmployeeId}`,
          targetEmployeeName: employeeMap[review.targetEmployeeId] || `Employee ${review.targetEmployeeId}`
        }));

        setReviews(enriched);
        setFilteredReviews(enriched);

        // Extract unique managers
        const uniqueManagers = [...new Set(enriched.map(r => r.managerEmployeeId))];
        setManagers(uniqueManagers);

        console.log('✅ Reviews loaded:', enriched.length);
      }
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      fetchReviews();
    }
  }, [employeeMap]);

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================

  useEffect(() => {
    let filtered = reviews;

    if (filterManager !== 'All') {
      filtered = filtered.filter(r => r.managerEmployeeId === Number(filterManager));
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setFilteredReviews(filtered);
  }, [filterManager, filterStatus, reviews]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'Pending').length,
    approved: reviews.filter(r => r.status === 'Approved').length,
    submitted: reviews.filter(r => r.status === 'Submitted').length
  }), [reviews]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-3" style={{ maxWidth: '1400px' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="d-flex gap-2 align-items-start">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>Department Reviews</h2>
            <p className="mb-0 small text-muted">View all manager reviews in department</p>
          </div>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={fetchReviews}
          disabled={refreshing}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--color-primary-3)' }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3">
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* STATS */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h4 className="fw-bold text-primary">{stats.total}</h4>
              <small className="text-muted">Total Reviews</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h4 className="fw-bold" style={{ color: '#E2B93B' }}>{stats.pending}</h4>
              <small className="text-muted">Pending</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h4 className="fw-bold" style={{ color: '#24A148' }}>{stats.approved}</h4>
              <small className="text-muted">Approved</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
            <div className="card-body">
              <h4 className="fw-bold text-info">{stats.submitted}</h4>
              <small className="text-muted">Submitted</small>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card border-0 mb-3" style={{ border: '1px solid var(--border)' }}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-bold small">Filter by Manager:</label>
              <select
                className="form-select form-select-sm"
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
              >
                <option value="All">All Managers</option>
                {managers.map(managerId => (
                  <option key={managerId} value={managerId}>
                    {employeeMap[managerId] || `Manager ${managerId}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small">Filter by Status:</label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-outline-secondary btn-sm w-100">
                <Download size={14} className="me-1" />
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
        <div className="card-body">
          {filteredReviews.length === 0 ? (
            <p className="text-muted mb-0">No reviews found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ color: 'var(--color-primary-1)' }}>Manager</th>
                    <th style={{ color: 'var(--color-primary-1)' }}>Target Employee</th>
                    <th style={{ color: 'var(--color-primary-1)' }}>Rating</th>
                    <th style={{ color: 'var(--color-primary-1)' }}>Status</th>
                    <th style={{ color: 'var(--color-primary-1)' }}>Date</th>
                    <th style={{ color: 'var(--color-primary-1)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => {
                    const statusColor = review.status === 'Approved' ? '#24A148' : review.status === 'Pending' ? '#E2B93B' : '#0F62FE';
                    return (
                      <tr key={review.reviewcommentId}>
                        <td className="small fw-bold">{review.managerName}</td>
                        <td className="small fw-bold">{review.targetEmployeeName}</td>
                        <td className="small">{'⭐'.repeat(review.rating || 0)}</td>
                        <td>
                          <Badge text={review.status || 'Draft'} color={statusColor} />
                        </td>
                        <td className="small text-muted">{new Date(review.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/reviews/detail/${review.reviewcommentId}`, { state: { review } })}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
