// src/components/sla/ManagerEscalationModal.jsx - SIMPLIFIED & WORKING

import React, { useState } from 'react';
import { AlertTriangle, Send, Loader } from 'lucide-react';

const ManagerEscalationModal = ({ review, onClose, onEscalate, deptHeads }) => {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reasons = [
    'SLA Breach Risk',
    'Performance Concern',
    'Process Violation',
    'Urgent Action Required',
    'Policy Clarification',
    'Other'
  ];

  if (!review) return null;

  // ✅ Auto-select first dept head (no dropdown needed)
  const deptHead = deptHeads?.[0];

  // ✅ Show error if no dept head available
  if (!deptHead) {
    return (
      <div 
        className="modal show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} 
        onClick={onClose}
      >
        <div 
          className="modal-dialog modal-dialog-centered modal-sm" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
            <div className="modal-header border-0 px-4 py-3 bg-danger bg-opacity-10">
              <AlertTriangle size={20} className="text-danger me-2" />
              <h6 className="mb-0 fw-bold">Error</h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body px-4 py-4 text-center">
              <AlertTriangle size={48} className="text-danger mb-3" />
              <h5 className="fw-bold mb-2">No Department Head Available</h5>
              <p className="text-muted mb-0">Cannot escalate: No department head found for your department.</p>
            </div>
            <div className="modal-footer border-top px-4 py-3 gap-2">
              <button 
                type="button" 
                className="btn btn-primary w-100" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    if (comments.trim().length < 10) {
      setError('Comments must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const payload = {
        slaid: review.slaid,
        escalationLevel: 'L2',
        submittedByEmployeeId: user.empId,
        escalatedToEmployeeId: deptHead.employeeId || deptHead.employeeMasterId,
        reason,
        description: comments.trim()
      };

      console.log('🚀 Escalation Payload:', payload);
      await onEscalate(payload);
    } catch (err) {
      setError(err.message || 'Error escalating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} 
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-sm" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
          {/* HEADER */}
          <div 
            className="modal-header border-0 px-4 py-3" 
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={20} className="text-warning" />
              <h6 className="mb-0 fw-bold">⚠️ Escalate SLA?</h6>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              disabled={loading}
            />
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {/* ERROR ALERT */}
              {error && (
                <div className="alert alert-danger alert-sm mb-3 py-2" style={{ fontSize: '0.85rem', borderRadius: '6px' }}>
                  ❌ {error}
                </div>
              )}

              {/* SLA INFO */}
              <div 
                className="mb-3 p-2" 
                style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <small className="text-muted d-block">📋 SLA</small>
                <strong className="d-block">{review.employeeName}</strong>
                <small className="text-muted">{review.slatype}</small>
              </div>

              {/* DEPT HEAD INFO - AUTO SELECTED */}
              <div 
                className="mb-3 p-2" 
                style={{ backgroundColor: '#E8F4F8', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <small className="text-muted d-block">👔 Escalating To</small>
                <strong className="d-block text-primary">
                  {deptHead.firstName} {deptHead.lastName}
                </strong>
                <small className="text-muted">{deptHead.departmentName || 'Department Head'}</small>
              </div>

              {/* REASON DROPDOWN */}
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2">Reason *</label>
                <select
                  className="form-select form-select-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  required
                  style={{ borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Reason --</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* COMMENTS TEXTAREA */}
              <div className="mb-2">
                <label className="form-label small fw-bold mb-2">Comments *</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Explain why you're escalating..."
                  disabled={loading}
                  maxLength={250}
                  required
                  style={{ borderRadius: '6px', fontSize: '0.85rem', resize: 'none' }}
                />
                <small className="text-muted d-block mt-1">{comments.length}/250</small>
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer border-top px-4 py-2 gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
                style={{ borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-warning d-flex align-items-center gap-2"
                disabled={loading || !reason || comments.trim().length < 10}
                style={{ borderRadius: '6px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Escalating...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Escalate to DH</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManagerEscalationModal;
