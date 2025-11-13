import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, FileText, CheckCircle, Plus, Eye, Send, LogOut, Users, Zap, Clock, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '4px 8px', fontSize: '0.7rem' }}>
    {text}
  </span>
);

const StatCard = ({ label, value, Icon, color }) => (
  <div className="card border-0" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
    <div className="card-body">
      <div className="d-flex justify-content-between mb-2">
        <div className="rounded p-2" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <h3 className="fw-bold" style={{ color }}>{value}</h3>
      <p className="mb-0 small" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  </div>
);

export default function FeedbackDepartmentHeadDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1006, firstName: 'Department', lastName: 'Head' }, []);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [allReviews, setAllReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewsAboutMe, setReviewsAboutMe] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // ENRICH REVIEWS WITH EMPLOYEE NAMES
  // ============================================================================

  const enrichReviews = (reviews, empMap) => {
    return reviews.map(review => ({
      ...review,
      targetEmployeeName: empMap[review.targetEmployeeId] || review.targetEmployeeName || `Employee ${review.targetEmployeeId}`,
      managerName: empMap[review.managerEmployeeId] || `Manager ${review.managerEmployeeId}`
    }));
  };

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      if (empRes.data?.success && Array.isArray(empRes.data.data)) {
        const map = {};
        empRes.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('✅ Employee map loaded:', Object.keys(map).length);
        return map;
      }
    } catch (err) {
      console.warn('⚠️ Error fetching employee map:', err.message);
    }
    return {};
  };

  // ============================================================================
  // FETCH ALL REVIEWS
  // ============================================================================

  const fetchAllData = async (empMap = {}) => {
    setRefreshing(true);
    setLoading(true);
    setError('');
    
    try {
      const deptHeadId = user?.empId || 1006;

      // STEP 1: Get all reviews in system
      try {
        console.log('📥 Fetching all reviews...');
        const allRes = await axios.get(`${API_BASE}/ManagerReview/all`);
        if (allRes.data?.success && Array.isArray(allRes.data.data)) {
          const enriched = enrichReviews(allRes.data.data, empMap);
          setAllReviews(enriched);
          console.log('✅ All reviews loaded:', enriched.length);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching all reviews:', err.message);
      }

      // STEP 2: Get pending reviews
      try {
        console.log('📥 Fetching pending reviews...');
        const pendingRes = await axios.get(`${API_BASE}/ManagerReview/status/Pending`);
        if (pendingRes.data?.success && Array.isArray(pendingRes.data.data)) {
          const enriched = enrichReviews(pendingRes.data.data, empMap);
          setPendingReviews(enriched);
          console.log('✅ Pending reviews loaded:', enriched.length);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching pending reviews:', err.message);
      }

      // STEP 3: Get approved reviews
      try {
        console.log('📥 Fetching approved reviews...');
        const approvedRes = await axios.get(`${API_BASE}/ManagerReview/status/Approved`);
        if (approvedRes.data?.success && Array.isArray(approvedRes.data.data)) {
          const enriched = enrichReviews(approvedRes.data.data, empMap);
          setApprovedReviews(enriched);
          console.log('✅ Approved reviews loaded:', enriched.length);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching approved reviews:', err.message);
      }

      // STEP 4: Get reviews about me
      try {
        console.log('📥 Fetching reviews about me...');
        const targetRes = await axios.get(`${API_BASE}/ManagerReview/target/${deptHeadId}`);
        if (targetRes.data?.success && Array.isArray(targetRes.data.data)) {
          const enriched = enrichReviews(targetRes.data.data, empMap);
          setReviewsAboutMe(enriched);
          console.log('✅ Reviews about me loaded:', enriched.length);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching reviews about me:', err.message);
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('❌ Critical error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const loadData = async () => {
      const empMap = await fetchEmployeeMap();
      await fetchAllData(empMap);
    };
    loadData();
  }, [user?.empId]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => [
    { label: 'Total Reviews', value: allReviews.length, Icon: FileText, color: '#525252' },
   
  ], [allReviews, pendingReviews, approvedReviews]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

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
    <div className="container-fluid py-3" style={{ maxWidth: '1200px' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>Department Head Dashboard</h2>
          <p className="mb-0 small text-muted">
            {user?.firstName} {user?.lastName} • ID: {user?.empId}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={() => fetchAllData(employeeMap)}
            disabled={refreshing || loading}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--color-primary-3)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem', fontWeight: '600' }}
          >
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={handleLogout}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: '#E01950', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem', fontWeight: '600' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
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
        {stats.map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="card border-0 mb-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
        <div className="card-body">
          <h5 className="mb-3" style={{ color: 'var(--color-primary-1)' }}>Quick Actions</h5>
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <Link to="/department-head/dashboard/feedback/allreviews" className="btn btn-primary w-100">
                <Eye size={16} className="me-1" style={{ display: 'inline' }} />
                <span className="small">All Reviews</span>
              </Link>
            </div>
            
            
           
          </div>
        </div>
      </div>


      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
