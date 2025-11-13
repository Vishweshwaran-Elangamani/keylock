import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { CheckCircle, Send, AlertTriangle, Loader, Star, User } from 'lucide-react';
import { mentorFeedbackApi } from '../../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

export default function SubmitMentorFeedback() {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1004, firstName: 'Dave', lastName: 'Dev' },
    []
  );

  // State
  const [form, setForm] = useState({
    smeId: '',
    rating: 5,
    feedbackComments: '',
    isAnonymous: false
  });

  const [smeList, setSmeList] = useState([]);
  const [smeDetails, setSmeDetails] = useState(null);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingSme, setLoadingSme] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ============================================================================
  // FETCH EMPLOYEES
  // ============================================================================

  const fetchEmployeeMap = useCallback(async (signal) => {
    try {
      const response = await axios.get(`${API_BASE}/employeemanagement/all`, { signal });
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('Employee map created:', Object.keys(map).length, 'entries');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching employees:', err.message);
    }
  }, []);

  // ============================================================================
  // FETCH SME LIST (Replace mock with real API when available)
  // ============================================================================

  const fetchSmeList = useCallback(async (signal) => {
    setLoadingSme(true);
    try {
      // TODO: Replace with actual API, e.g., await axios.get(`${API_BASE}/sme/list`, { signal })
      const mockSmeList = [
        { smeId: 3001, employeeId: 1003, skillName: 'API Design', skillIdReference: 501 },
        { smeId: 3002, employeeId: 1002, skillName: 'Cloud Architecture', skillIdReference: 502 }
      ];
      
      setSmeList(mockSmeList);
      console.log('SME list loaded:', mockSmeList.length, 'SMEs');
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching SME list:', err.message);
      setError('Failed to load SME list. Please try refreshing.');
    } finally {
      setLoadingSme(false);
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const abortController = new AbortController();
    fetchEmployeeMap(abortController.signal);
    fetchSmeList(abortController.signal);
    return () => abortController.abort();
  }, [fetchEmployeeMap, fetchSmeList]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSmeChange = useCallback((smeId) => {
    setForm(prev => ({ ...prev, smeId }));
    setError('');  // Clear error on change
    
    if (!smeId) {
      setSmeDetails(null);
      return;
    }

    const sme = smeList.find(s => s.smeId === Number(smeId));
    
    if (sme) {
      setSmeDetails(sme);
      console.log('SME selected:', sme);
    } else {
      setSmeDetails(null);
      setError('Invalid SME selection. Please choose from the list.');
    }
  }, [smeList]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!smeDetails) {
      setError('Please select a valid SME');
      return;
    }
    if (!form.feedbackComments.trim()) {
      setError('Please enter your feedback comments');
      return;
    }
    if (form.feedbackComments.length > 5000) {
      setError('Feedback comments exceed 5000 characters');
      return;
    }

    // Build payload
    const payload = {
      smeId: smeDetails.smeId,
      mentorEmployeeId: smeDetails.employeeId,
      menteeEmployeeId: Number(user?.empId),
      skillIdReference: smeDetails.skillIdReference,
      rating: Number(form.rating),
      feedbackComments: form.feedbackComments,
      submittedByEmployeeId: Number(user?.empId),
      feedbackFrom: 'Mentee',
      isAnonymous: !!form.isAnonymous
    };

    console.log('Submitting mentor feedback payload');

    setLoading(true);
    try {
      const response = await mentorFeedbackApi.create(payload);
      
      if (response.data?.success === true) {
        setSuccess(`Feedback submitted successfully! Tracking ID: ${response.data?.data?.trackingId || 'Generated'}`);
        setForm({ smeId: '', rating: 5, feedbackComments: '', isAnonymous: false });
        setSmeDetails(null);
        // Auto-dismiss success after 5s
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to submit feedback. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [smeDetails, form, user?.empId]);

  // Interactive star rating handler
  const handleStarClick = useCallback((rating) => {
    setForm(prev => ({ ...prev, rating }));
  }, []);

  // Star rating renderer (clickable)
  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const rating = index + 1;
      return (
        <button
          key={index}
          type="button"
          className={`border-0 bg-transparent p-0 me-1 ${rating <= form.rating ? 'text-warning' : 'text-muted'}`}
          onClick={() => handleStarClick(rating)}
          aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
          style={{ cursor: 'pointer', transition: 'color 0.2s ease' }}
          onMouseEnter={(e) => { if (rating > form.rating) e.target.style.color = '#ffc107'; }}
          onMouseLeave={(e) => { if (rating > form.rating) e.target.style.color = '#6c757d'; }}
        >
          <Star size={24} fill={rating <= form.rating ? 'currentColor' : 'none'} strokeWidth={rating <= form.rating ? 0 : 2} />
        </button>
      );
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const isFormValid = smeDetails && form.feedbackComments.trim() && form.feedbackComments.length <= 5000;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '900px' }}>
      {/* HEADER */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <User size={24} style={{ color: 'var(--color-primary-1)', opacity: 0.8 }} />
          <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>
            Mentor Feedback Submission
          </h2>
        </div>
        <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
          Provide constructive feedback on your SME/Mentor's guidance and expertise
        </p>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3 fade show" role="alert" style={{ borderRadius: 'var(--radius-md)', border: '1px solid #f8d7da' }}>
          <AlertTriangle size={18} className="mt-1 flex-shrink-0 text-danger" />
          <div className="flex-grow-1">
            <strong>Submission Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Dismiss error" />
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3 fade show" role="alert" style={{ borderRadius: 'var(--radius-md)', border: '1px solid #d1e7dd', animation: 'fadeIn 0.3s ease-in' }}>
          <CheckCircle size={18} className="flex-shrink-0 text-success" />
          <div className="flex-grow-1 small fw-medium">{success}</div>
          <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Dismiss success" />
        </div>
      )}

      {/* MAIN FORM */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div className="card-body p-4">
          {/* USER INFO */}
          <div className="alert alert-light border-0 mb-4" style={{ backgroundColor: 'var(--color-bg-light)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
            <strong className="text-muted">Submitting as:</strong> {user?.firstName} {user?.lastName} (ID: {user?.empId})
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* STEP 1: SELECT SME */}
            <div className="mb-4">
              <label htmlFor="smeSelect" className="form-label fw-semibold small mb-2 d-flex align-items-center">
                <span className="me-2">Select Your Mentor/SME <span className="text-danger">*</span></span>
                {loadingSme && <Loader size={14} className="ms-1 animate-spin" />}
              </label>
              <select
                id="smeSelect"
                className={`form-select form-select-lg ${!smeDetails && error ? 'is-invalid' : ''}`}
                value={form.smeId}
                onChange={(e) => handleSmeChange(e.target.value)}
                disabled={loadingSme || loading}
                aria-describedby="smeHelp"
                style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              >
                <option value="">
                  {loadingSme 
                    ? 'Loading available mentors...' 
                    : smeList.length === 0 
                    ? 'No mentors available at this time' 
                    : 'Choose a mentor to provide feedback for'
                  }
                </option>
                {smeList.map((sme) => (
                  <option key={`sme-${sme.smeId}`} value={sme.smeId}>
                    {employeeMap[sme.employeeId] || `Employee ${sme.employeeId}`} - {sme.skillName}
                  </option>
                ))}
              </select>
              <div id="smeHelp" className="form-text small">Select the mentor whose guidance you'd like to rate.</div>
              {error && !smeDetails && <div className="invalid-feedback d-block">{error}</div>}
            </div>

            {/* CONDITIONAL FORM FIELDS */}
            {smeDetails && (
              <div className="animate__animated animate__fadeIn">
                {/* SME DETAILS CARD */}
                <div className="card border-0 bg-light mb-4" style={{ borderRadius: 'var(--radius-md)' }}>
                  <div className="card-body p-3">
                    <h6 className="card-title fw-semibold mb-2" style={{ color: 'var(--color-primary-1)' }}>Selected Mentor Details</h6>
                    <div className="row g-2 small">
                      <div className="col-6">
                        <span className="text-muted">Expertise Area:</span>
                        <div className="fw-medium">{smeDetails.skillName}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">Mentor:</span>
                        <div className="fw-medium">
                          {employeeMap[smeDetails.employeeId] || `Employee ${smeDetails.employeeId}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RATING (Clickable Stars) */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small mb-2">
                    Rating <span className="text-danger">*</span>
                  </label>
                  <div className="p-3 border rounded d-flex align-items-center" style={{ backgroundColor: '#f8f9fa', borderRadius: 'var(--radius-md)' }}>
                    <div className="d-flex me-3">
                      {renderStars()}
                    </div>
                    <span className="fw-medium text-primary ms-2">{form.rating}/5 Stars</span>
                  </div>
                  <div className="form-text small mt-1">Click stars to rate: 1 = Needs Improvement | 5 = Outstanding Performance</div>
                </div>

                {/* FEEDBACK COMMENTS */}
                <div className="mb-4">
                  <label htmlFor="feedbackComments" className="form-label fw-semibold small mb-2">
                    Detailed Feedback <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="feedbackComments"
                    className={`form-control ${!form.feedbackComments.trim() && error ? 'is-invalid' : ''}`}
                    rows={4}
                    value={form.feedbackComments}
                    onChange={(e) => setForm(prev => ({ ...prev, feedbackComments: e.target.value }))}
                    placeholder="Describe your experience with this mentor's teaching style, knowledge sharing, and overall impact on your growth. Be specific and constructive..."
                    maxLength={5000}
                    style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'vertical', minHeight: '100px' }}
                    aria-describedby="commentsHelp"
                  />
                  <div id="commentsHelp" className="form-text small mt-1 d-flex justify-content-between">
                    <span>Focus on strengths and areas for improvement.</span>
                    <span className={form.feedbackComments.length > 4500 ? 'text-danger' : 'text-muted'}>
                      {form.feedbackComments.length}/5000 characters
                    </span>
                  </div>
                  {!form.feedbackComments.trim() && error && <div className="invalid-feedback d-block">{error}</div>}
                </div>

                {/* ANONYMOUS OPTION */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="anonCheck"
                      checked={form.isAnonymous}
                      onChange={(e) => setForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      disabled={loading}
                    />
                    <label className="form-check-label small" htmlFor="anonCheck">
                      Submit anonymously
                      <div className="form-text small mt-1">Your identity will be hidden from the mentor, though HR may access it for review.</div>
                    </label>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary py-3 fw-semibold btn-lg"
                    disabled={loading || !isFormValid}
                    style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-1)' }}
                  >
                    <Send size={18} className={`me-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Submitting Feedback...' : 'Submit Feedback'}
                  </button>
                  <div className="form-text text-center mt-2 small text-muted">
                    By submitting, you agree to our feedback policy.
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* LOADING HINT (Only if no SMEs) */}
      {loadingSme && smeList.length === 0 && (
        <div className="alert alert-info mt-3 d-flex align-items-center" style={{ borderRadius: 'var(--radius-md)' }}>
          <Loader size={16} className="me-2 animate-spin" />
          <span className="small">Preparing mentor list...</span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .form-control:focus, .form-select:focus { border-color: var(--color-primary-1); box-shadow: 0 0 0 0.2rem rgba(13,110,253,0.25); }
        .is-invalid { border-color: #dc3545; }
      `}</style>
    </div>
  );
}
