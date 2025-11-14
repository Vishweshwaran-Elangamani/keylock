// src/components/sla/ResolveEscalationModal.jsx
import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const ResolveEscalationModal = ({ escalation, onClose, onResolve }) => {
  const [resolutionComments, setResolutionComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!resolutionComments.trim()) {
      toast.warning('Resolution comments required', {
        description: 'Please provide resolution comments before proceeding',
        duration: 4000,
      });
      return;
    }

    setLoading(true);
    try {
      await onResolve({
        escalationId: escalation.escalationId,
        resolutionComments: resolutionComments.trim(),
        escalationStatus: 'Resolved'
      });

      toast.success('Escalation resolved successfully', {
        description: 'Resolution comments have been saved',
        duration: 4000,
      });
    } catch (error) {
      toast.error('Failed to resolve escalation', {
        description: error.message || 'An error occurred while resolving',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '8px' }}>
          <div className="modal-header border-0">
            <h6 className="modal-title fw-semibold">Resolve Escalation</h6>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <div className="modal-body">
            <div className="mb-3 small">
              <div className="mb-2">
                <strong>{escalation.employeeName}</strong>
              </div>
              <div className="text-muted">
                {escalation.reason}
              </div>
            </div>

            <textarea
              className="form-control form-control-sm"
              rows="4"
              value={resolutionComments}
              onChange={(e) => setResolutionComments(e.target.value)}
              placeholder="Enter resolution comments..."
              disabled={loading}
              style={{ fontSize: '0.9rem' }}
            />
          </div>

          <div className="modal-footer border-0 gap-2">
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success d-flex align-items-center gap-2"
              onClick={handleResolve}
              disabled={loading || !resolutionComments.trim()}
            >
              <CheckCircle size={14} />
              {loading ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolveEscalationModal;
