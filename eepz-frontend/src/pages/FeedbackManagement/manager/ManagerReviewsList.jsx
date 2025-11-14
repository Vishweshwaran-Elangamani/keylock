import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Eye, Edit, Trash2, Star, User, X, Save, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import { managerReviewApi } from '../../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const Badge = ({ text, color = '#525252' }) => (
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '6px 10px', fontSize: '0.75rem', borderRadius: '4px', fontWeight: '600' }}>
    {text}
  </span>
);

export default function ManagerReviewsList() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}') || {}, []);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeMap, setEmployeeMap] = useState({});
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    targetEmployeeId: '',
    rating: 3,
    reviewComment: '',
    projectContext: '',
    goalContext: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Show toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ============================================================================
  // ENRICH REVIEWS WITH EMPLOYEE NAMES
  // ============================================================================

  const enrichReviews = (reviewsList, empMap) => {
    return reviewsList.map(review => ({
      ...review,
      managerName: empMap[review.managerEmployeeId] || `Manager ${review.managerEmployeeId}`,
      targetEmployeeName: empMap[review.targetEmployeeId] || review.targetEmployeeName || `Employee ${review.targetEmployeeId}`
    }));
  };

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      // STEP 1: Fetch employee map and full employee list
      let empMap = {};
      let empList = [];
      try {
        const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach(emp => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          empList = empRes.data.data;
          setEmployeeMap(empMap);
          setEmployees(empList);
          console.log('✅ Employee map loaded:', Object.keys(empMap).length);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching employee map:', err.message);
      }

      // STEP 2: Fetch reviews for current manager
      const managerId = user?.empId || 1002;
      const res = await axios.get(`${API_BASE}/ManagerReview/manager/${managerId}`);
      
      if (res.data?.success && Array.isArray(res.data.data)) {
        const enriched = enrichReviews(res.data.data, empMap);
        setReviews(enriched);
        console.log('✅ Reviews loaded:', enriched.length);
      } else {
        setReviews([]);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to fetch reviews';
      setError(errorMsg);
      console.error('❌ Error:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.empId]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => ({
    total: reviews.length,
    submitted: reviews.filter(r => r.status === 'Submitted' || r.submitted === true || r.isSubmitted === true).length,
    finalized: reviews.filter(r => r.status === 'Finalized').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0'
  }), [reviews]);

  // ============================================================================
  // HANDLE DELETE
  // ============================================================================

  const handleDelete = async (id) => {
    if (!id) {
      showToast('Invalid review ID', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    
    try {
      console.log('🗑️ Deleting review:', id);
      const response = await axios.delete(`${API_BASE}/ManagerReview/${id}`);
      
      if (response.data?.success) {
        setReviews(reviews.filter(r => r.reviewcommentId !== id));
        showToast('Review deleted successfully!', 'success');
      } else {
        const errorMsg = response.data?.message || 'Failed to delete review';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to delete review';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  // ============================================================================
  // HANDLE VIEW
  // ============================================================================

  const handleView = (id) => {
    navigate(`/manager/dashboard/feedback/review/`+id);
  };

  // ============================================================================
  // HANDLE EDIT - OPEN MODAL
  // ============================================================================

  const handleEdit = async (review) => {
    console.log('✏️ Opening edit modal for review:', review.reviewcommentId);
    
    setEditingReview(review);
    setEditForm({
      targetEmployeeId: review.targetEmployeeId || '',
      rating: review.rating || 3,
      reviewComment: review.reviewComment || '',
      projectContext: review.projectContext || '',
      goalContext: review.goalContext || ''
    });
    setShowEditModal(true);
  };

  

  // ============================================================================
  // HANDLE EDIT - SAVE
  // ============================================================================

 const handleSaveEdit = async (e) => {
  e.preventDefault();
  
  if (!editForm.targetEmployeeId || !editForm.reviewComment?.trim()) {
    showToast('Please select employee and enter review comment', 'error');
    return;
  }

  setEditLoading(true);
  
  try {
    const reviewId = editingReview.reviewcommentId;
    
    console.log('🔄 Step 1: Calling modify...');
    await axios.post(`${API_BASE}/ManagerReview/${reviewId}/modify`);

    console.log('💾 Step 2: Fetching current review...');
    const getCurrentReview = await axios.get(`${API_BASE}/ManagerReview/${reviewId}`);
    const currentReview = getCurrentReview.data?.data || getCurrentReview.data;
    
    console.log('📝 Step 3: Updating review...');
    const updatedReview = {
      ...currentReview,
      targetEmployeeId: Number(editForm.targetEmployeeId),
      rating: Number(editForm.rating),
      reviewComment: editForm.reviewComment,
      projectContext: editForm.projectContext || null,
      goalContext: editForm.goalContext || null,
      managerEmployeeId: currentReview.managerEmployeeId,
      status: 'Draft'
    };

    await axios.put(`${API_BASE}/ManagerReview/${reviewId}`, updatedReview);

    console.log('📤 Step 4: Re-submitting...');
    await axios.post(`${API_BASE}/ManagerReview/${reviewId}/submit`);

    // Wait a moment for backend to process
    await new Promise(resolve => setTimeout(resolve, 500));

    showToast('Review updated successfully!', 'success');
    setShowEditModal(false);
    setEditingReview(null);
    
    // Force refresh with cache busting
    await fetchReviews();
    
  } catch (err) {
    console.error('❌ Update error:', err);
    const errorMsg = err?.response?.data?.message || err.message || 'Failed to update review';
    showToast(errorMsg, 'error');
  } finally {
    setEditLoading(false);
  }
};

  // ============================================================================
  // HANDLE EDIT - CLOSE MODAL
  // ============================================================================

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingReview(null);
    setEditForm({
      targetEmployeeId: '',
      rating: 3,
      reviewComment: '',
      projectContext: '',
      goalContext: ''
    });
  };

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.employeeId === Number(editForm.targetEmployeeId));
  }, [editForm.targetEmployeeId, employees]);

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

      {/* EDIT MODAL */}
      {showEditModal && (
        <>
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1040 }}
            onClick={handleCloseEditModal}
          ></div>
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="modal-header" style={{ borderBottom: '2px solid var(--border)' }}>
                  <h5 className="modal-title fw-bold">Edit Review</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleCloseEditModal}
                  ></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <form onSubmit={handleSaveEdit} className="row g-3">
                    {/* SELECT EMPLOYEE */}
                    <div className="col-12">
                      <label className="form-label small fw-bold">
                        Select Employee <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={editForm.targetEmployeeId}
                        onChange={(e) => setEditForm({ ...editForm, targetEmployeeId: e.target.value })}
                        required
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        <option value="">-- Choose an employee --</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.firstName} {emp.lastName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SELECTED EMPLOYEE INFO */}
                    {selectedEmployee && (
                      <div className="col-12">
                        <div className="alert alert-info small mb-0" style={{ borderRadius: 'var(--radius-md)' }}>
                          <strong>Reviewing:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}
                          <br />
                          <small className="text-muted">{selectedEmployee.email} • {selectedEmployee.roleName}</small>
                        </div>
                      </div>
                    )}

                    {/* RATING BUTTONS */}
                    <div className="col-12">
                      <label className="form-label small fw-bold mb-2">
                        Rating <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            className={`btn flex-grow-1 ${editForm.rating === rating ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setEditForm({ ...editForm, rating })}
                            style={{ borderRadius: 'var(--radius-md)', padding: '0.5rem 0.25rem' }}
                          >
                            <div style={{ fontSize: '0.7rem', lineHeight: '1' }}>
                              <div className="fw-bold">{rating}</div>
                              <div className="small">{RATING_LABELS[rating]}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* REVIEW COMMENT */}
                    <div className="col-12">
                      <label className="form-label small fw-bold">
                        Review Comment <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={editForm.reviewComment}
                        onChange={(e) => setEditForm({ ...editForm, reviewComment: e.target.value })}
                        placeholder="Provide detailed feedback..."
                        required
                        style={{ borderRadius: 'var(--radius-md)' }}
                      />
                      <small className="text-muted">{editForm.reviewComment.length} / 2000</small>
                    </div>

                    {/* PROJECT CONTEXT */}
                    <div className="col-12">
                      <label className="form-label small fw-bold">
                        Project Context <span className="text-muted">(Optional)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editForm.projectContext}
                        onChange={(e) => setEditForm({ ...editForm, projectContext: e.target.value })}
                        placeholder="Mention any relevant projects..."
                        style={{ borderRadius: 'var(--radius-md)' }}
                      />
                    </div>

                    {/* GOAL CONTEXT */}
                    <div className="col-12">
                      <label className="form-label small fw-bold">
                        Goal Context <span className="text-muted">(Optional)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editForm.goalContext}
                        onChange={(e) => setEditForm({ ...editForm, goalContext: e.target.value })}
                        placeholder="Mention any relevant goals..."
                        style={{ borderRadius: 'var(--radius-md)' }}
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer" style={{ borderTop: '2px solid var(--border)' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <Loader size={16} className="me-2" style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-2" style={{ display: 'inline' }} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Star size={24} style={{ color: 'var(--color-primary-1)' }} />
            <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>My Reviews</h2>
          </div>
          <p className="mb-0 small text-muted">Create and manage your employee reviews</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            to="/manager/create-review" 
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem', fontWeight: '600' }}
          >
            <Star size={18} />
            Create Review
          </Link>
          <button
            className="btn d-flex align-items-center gap-2"
            onClick={fetchReviews}
            disabled={loading}
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border)', 
              color: 'var(--color-primary-3)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.5rem 0.9rem', 
              fontWeight: '600' 
            }}
          >
            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
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

      {/* STATS */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 text-center" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body py-3">
              <h3 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>{stats.total}</h3>
              <small className="text-muted">Total Reviews</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 text-center" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body py-3">
              <h3 className="fw-bold mb-1" style={{ color: '#24A148' }}>{stats.submitted}</h3>
              <small className="text-muted">Submitted</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 text-center" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body py-3">
              <h3 className="fw-bold mb-1" style={{ color: '#0F62FE' }}>{stats.finalized}</h3>
              <small className="text-muted">Finalized</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 text-center" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="card-body py-3">
              <div className="d-flex align-items-center justify-content-center gap-1">
                <Star size={20} style={{ color: '#FFB800', fill: '#FFB800' }} />
                <h3 className="fw-bold mb-0" style={{ color: '#FFB800' }}>{stats.avgRating}</h3>
              </div>
              <small className="text-muted">Avg Rating</small>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">All Reviews ({reviews.length})</h5>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-5">
              <User size={48} className="mb-3" style={{ color: 'var(--muted)' }} />
              <p className="text-muted mb-3">No reviews created yet</p>
              <Link to="/manager/create-review" className="btn btn-primary">
                <Star size={16} className="me-1" style={{ display: 'inline' }} />
                Create Your First Review
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600' }}>Employee</th>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600' }}>Rating</th>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600' }}>Status</th>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600' }}>Comment</th>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600' }}>Created</th>
                    <th style={{ color: 'var(--color-primary-1)', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
              
                <tbody>
                  {reviews.map(review => {
                    const isSubmitted = review.status === 'Submitted' || review.submitted === true || review.isSubmitted === true;
                    const isFinalized = review.status === 'Finalized';
                    
                    let statusColor = '#24A148';
                    let statusText = 'Submitted';
                    
                    if (isFinalized) {
                      statusColor = '#0F62FE';
                      statusText = 'Finalized';
                    }

                    return (
                      <tr key={review.reviewcommentId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="small">
                          <div className="d-flex align-items-center gap-2">
                            <User size={14} style={{ color: 'var(--muted)' }} />
                            <span className="fw-semibold">{review.targetEmployeeName}</span>
                          </div>
                        </td>
                        <td className="small">
                          <div className="d-flex align-items-center gap-1">
                            <Star size={14} style={{ color: '#FFB800', fill: '#FFB800' }} />
                            <span className="fw-semibold">{review.rating || 0}/5</span>
                          </div>
                        </td>
                        <td className="small">
                          <Badge text={statusText} color={statusColor} />
                        </td>
                        <td className="small text-truncate" style={{ maxWidth: '250px' }} title={review.reviewComment}>
                          {review.reviewComment || 'No comment'}
                        </td>
                        <td className="small text-muted">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => handleView(review.reviewcommentId)}
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                           
                          </div>
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
