// src/components/sla/ReopenSLAForm.jsx
import React, { useState } from 'react';
import { X, RotateCcw, Send, AlertCircle } from 'lucide-react';
import slaService from '../../services/sla/slaService';


const ReopenSLAForm = ({ sla, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    extensionDays: 1,  // ✅ Fixed to 1 only
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const reopenData = {
        slaid: sla.slaid,
        extensionDays: 1,  // ✅ Always 1 day
        reopenReason: formData.reason,
        reopenedByEmployeeId: user.empId
      };

      console.log('📤 Sending reopen payload:', reopenData);

      const response = await slaService.reopenSLA(reopenData);
      
      if (response.success) {
        alert('✅ SLA reopened successfully with 1 day extension!');
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to reopen SLA');
      }
    } catch (err) {
      console.error('❌ Reopen error:', err);
      setError(err.message || 'Failed to reopen SLA');
    } finally {
      setLoading(false);
    }
  };


  const calculateNewDeadline = () => {
    const originalDeadline = new Date(sla.deadline);
    const newDeadline = new Date(originalDeadline);
    newDeadline.setDate(newDeadline.getDate() + 1);  // ✅ Always +1 day
    return newDeadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title d-flex align-items-center gap-2 mb-1">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', backgroundColor: '#AC509815' }}
                >
                  <RotateCcw size={20} color="#AC5098" />
                </div>
                <span style={{ color: 'var(--color-primary-1)' }}>Reopen SLA with 1 Day Extension</span>
              </h5>
              <p className="text-muted mb-0 ms-5 ps-2 small">
                Grant 1 additional day to complete this SLA
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="card border-0 mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="card-body p-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block">Current Deadline</small>
                      <strong>{new Date(sla.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">New Deadline (+ 1 Day)</small>
                      <strong className="text-success">{calculateNewDeadline()}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info d-flex align-items-center gap-2">
                <AlertCircle size={18} />
                <span>This SLA will be extended by <strong>1 day only</strong></span>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Reason for Reopening <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why this SLA needs 1 more day..."
                  required
                  disabled={loading}
                  maxLength={500}
                  style={{ borderRadius: '8px' }}
                />
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">Provide clear justification</small>
                  <small className="text-muted">{formData.reason.length}/500</small>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={onClose}
                disabled={loading}
                style={{ borderRadius: '8px' }}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2"
                disabled={loading}
                style={{ borderRadius: '8px', minWidth: '180px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Extending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Extend SLA</span>
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

export default ReopenSLAForm;
