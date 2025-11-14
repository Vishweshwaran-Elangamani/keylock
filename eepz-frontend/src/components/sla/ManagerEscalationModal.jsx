// src/components/sla/ManagerEscalationModal.jsx - FIXED (Check specific SLA escalations)
 
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import slaService from '../../services/sla/slaService';
 
const ManagerEscalationModal = ({ review, onClose, onEscalate }) => {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDeptHead, setFetchingDeptHead] = useState(true);
  const [deptHead, setDeptHead] = useState(null);
  const [error, setError] = useState(null);
  const [alreadyEscalated, setAlreadyEscalated] = useState(false);
 
  const reasons = [
    'SLA Breach Risk',
    'Performance Concern',
    'Process Violation',
    'Urgent Action Required',
    'Policy Clarification',
    'Other'
  ];
 
  useEffect(() => {
    checkEscalationStatus();
    fetchDepartmentHead();
  }, []);
 
  //  Check if THIS SPECIFIC SLA is already escalated
  const checkEscalationStatus = async () => {
    try {
      console.log(`Checking escalations for SLA ${review.slaid}`);
     
      //  Get escalations for THIS specific SLA
      const response = await slaService.getSLAEscalations(review.slaid);
     
      if (response?.success && response.data && response.data.length > 0) {
        // Check if there's already a pending L2 escalation
        const pendingL2Escalation = response.data.find(
          esc => esc.escalationLevel === 'L2' &&
          esc.escalationStatus === 'Pending'
        );
 
        if (pendingL2Escalation) {
          setAlreadyEscalated(true);
          console.log(' SLA already has pending L2 escalation:', pendingL2Escalation);
        } else {
          console.log(' No pending L2 escalation found');
        }
      } else {
        console.log(' No escalations found for this SLA');
      }
    } catch (error) {
      console.error(' Error checking escalation status:', error);
    }
  };
 
  const fetchDepartmentHead = async () => {
    setFetchingDeptHead(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
     
      console.log(' Current Manager:', user);
      console.log(' Manager Department Name:', user.departmentName);
 
      if (!user.departmentName) {
        console.warn(' Manager has no department assigned');
        setDeptHead(null);
        setFetchingDeptHead(false);
        return;
      }
 
      const response = await slaService.getAllEmployees();
     
      if (response?.success && response.data) {
        const deptHeadInSameDepartment = response.data.find(emp =>
          emp.departmentName === user.departmentName &&
          (emp.roleName === 'Department Head' || emp.role === 'Department Head')
        );
 
        if (deptHeadInSameDepartment) {
          setDeptHead(deptHeadInSameDepartment);
          console.log(' Department Head found:', deptHeadInSameDepartment);
        } else {
          console.warn(' No department head found for department:', user.departmentName);
          setDeptHead(null);
        }
      } else {
        console.warn(' No employees data received');
        setDeptHead(null);
      }
    } catch (error) {
      console.error(' Error fetching department head:', error);
      setDeptHead(null);
    } finally {
      setFetchingDeptHead(false);
    }
  };
 
  if (!review) return null;
 
  // ========== LOADING STATE ==========
  if (fetchingDeptHead) {
    return (
      <div
        className="modal show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0 small">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  // ========== ALREADY ESCALATED ERROR ==========
  if (alreadyEscalated) {
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
            <div className="modal-header border-0 px-4 py-3 bg-warning bg-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} className="text-warning" />
                <h6 className="mb-0 fw-bold">Already Escalated</h6>
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body px-4 py-4 text-center">
              <AlertTriangle size={48} className="text-warning mb-3" />
              <h5 className="fw-bold mb-2">Escalation Already Pending</h5>
              <p className="text-muted mb-0 small">
                This SLA has already been escalated to the Department Head and is awaiting response.
              </p>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={onClose}
                style={{ borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  // ========== NO DEPT HEAD ERROR ==========
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
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} className="text-danger" />
                <h6 className="mb-0 fw-bold">Error</h6>
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body px-4 py-4 text-center">
              <AlertTriangle size={48} className="text-danger mb-3" />
              <h5 className="fw-bold mb-2">No Department Head Available</h5>
              <p className="text-muted mb-0 small">
                Cannot escalate: No department head found for your department.
              </p>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={onClose}
                style={{ borderRadius: '8px' }}
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
 
    if (!reason) {
      setError('Please select a reason');
      toast.warning('Validation Error', {
        description: 'Please select a reason for escalation'
      });
      return;
    }
    if (comments.trim().length < 10) {
      setError('Comments must be at least 10 characters');
      toast.warning('Validation Error', {
        description: 'Comments must be at least 10 characters'
      });
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
 
      console.log(' Escalation Payload:', payload);
      await onEscalate(payload);
     
      toast.success('Escalation Successful!', {
        description: `SLA escalated to ${deptHead.firstName} ${deptHead.lastName} (Department Head).`,
        duration: 3000
      });
 
      setTimeout(() => {
        onClose();
      }, 1500);
 
    } catch (err) {
      console.error(' Escalation error:', err);
      setError(err.message || 'Error escalating');
     
      toast.error('Escalation Failed', {
        description: err.message || 'An error occurred while escalating. Please try again.',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
          <div
            className="modal-header border-0 px-4 py-3"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={20} className="text-warning" />
              <h6 className="mb-0 fw-bold"> Escalate to Department Head</h6>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>
 
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {error && (
                <div className="alert alert-danger alert-sm mb-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', borderRadius: '6px' }}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}
 
              <div
                className="mb-3 p-2"
                style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <small className="text-muted d-block"> SLA #{review.slaid}</small>
                <strong className="d-block">{review.employeeName}</strong>
                <small className="text-muted">{review.slatype}</small>
              </div>
 
              <div
                className="mb-3 p-2"
                style={{ backgroundColor: '#E8F4F8', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <small className="text-muted d-block"> Escalating To</small>
                <strong className="d-block text-primary">
                  {deptHead.firstName} {deptHead.lastName}
                </strong>
                <small className="text-muted">{deptHead.departmentName} - Department Head</small>
              </div>
 
              <div className="mb-3">
                <label className="form-label small fw-bold mb-2">
                  Reason <span className="text-danger">*</span>
                </label>
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
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
 
              <div className="mb-2">
                <label className="form-label small fw-bold mb-2">
                  Comments <span className="text-danger">*</span>
                </label>
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
 