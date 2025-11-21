import React, { useState, useEffect } from "react";
import { X, Check, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const EditSLAModal = ({ sla, onClose, onUpdate }) => {
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sla) {
      // Format date for input (YYYY-MM-DD)
      const date = new Date(sla.deadline);
      const formattedDate = date.toISOString().split("T")[0];
      setDeadline(formattedDate);
      setStatus(sla.status || "Open");
      setUpdateReason("");
    }
  }, [sla]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!deadline) {
      setError("Deadline is required");
      return;
    }

    if (!updateReason.trim()) {
      setError("Update reason is required");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updateData = {
        deadline: new Date(deadline).toISOString(),
        status: status,
        complianceStatus: status === "Closed" ? "OnTime" : sla.complianceStatus,
      };

      console.log("📝 Updating SLA with:", updateData);
      await onUpdate(sla.slaid, updateData);
    } catch (err) {
      setError(err.message || "Failed to update SLA");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => {
          if (e.target.classList.contains('modal')) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div 
            className="modal-content" 
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
          >
            {/* ✅ UPDATED HEADER - Dark Purple Theme */}
            <div 
              className="modal-header" 
              style={{ 
                backgroundColor: '#3c3862',
                borderBottom: 'none',
                padding: '1.25rem 1.5rem',
                color: 'white'
              }}
            >
              <h5 
                className="modal-title mb-0" 
                style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  color: 'white',
                  textAlign: 'left'
                }}
              >
                Edit SLA #{sla?.slaid}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={updating}
                aria-label="Close"
                style={{
                  opacity: 0.8,
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </div>

            {/* ✅ UPDATED BODY - Light Gray Background */}
            <div className="modal-body" style={{ padding: '1.75rem', backgroundColor: '#f8f9fa' }}>
              {/* ✅ UPDATED ERROR ALERT */}
              {error && (
                <div 
                  className="alert alert-dismissible fade show mb-4 d-flex align-items-center"
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    padding: '1rem',
                    backgroundColor: 'rgba(224, 25, 80, 0.1)',
                    color: '#E01950'
                  }}
                >
                  <AlertCircle size={20} className="me-2" style={{ flexShrink: 0 }} />
                  <span style={{ textAlign: 'left' }}>{error}</span>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* ✅ UPDATED SLA INFO BOX */}
                <div
                  className="mb-4"
                  style={{ 
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'left'
                  }}
                >
                  <small 
                    className="text-muted d-block mb-2" 
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500,
                      textAlign: 'left'
                    }}
                  >
                    Current SLA
                  </small>
                  <strong 
                    className="d-block mb-1" 
                    style={{ 
                      fontSize: '0.95rem',
                      color: '#374151',
                      textAlign: 'left'
                    }}
                  >
                    {sla?.slatype}
                  </strong>
                  <small 
                    className="text-muted" 
                    style={{ 
                      fontSize: '0.85rem',
                      textAlign: 'left'
                    }}
                  >
                    Employee: {sla?.employeeName}
                  </small>
                </div>

                {/* ✅ UPDATED DEADLINE INPUT */}
                <div className="mb-4">
                  <label 
                    className="form-label fw-semibold" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      display: 'block',
                      textAlign: 'left'
                    }}
                  >
                    Deadline <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control text-start"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    disabled={updating}
                    style={{ 
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.95rem',
                      backgroundColor: 'white',
                      textAlign: 'left'
                    }}
                  />
                </div>

                {/* ✅ UPDATED STATUS SELECT */}
                <div className="mb-4">
                  <label 
                    className="form-label fw-semibold" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      display: 'block',
                      textAlign: 'left'
                    }}
                  >
                    Status <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <select
                    className="form-select text-start"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={updating}
                    style={{ 
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.95rem',
                      backgroundColor: 'white',
                      textAlign: 'left'
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* ✅ UPDATED UPDATE REASON TEXTAREA */}
                <div className="mb-3">
                  <label 
                    className="form-label fw-semibold" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem',
                      display: 'block',
                      textAlign: 'left'
                    }}
                  >
                    Update Reason <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <textarea
                    className="form-control text-start"
                    rows="3"
                    placeholder="Why are you updating this SLA?"
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    maxLength={250}
                    disabled={updating}
                    style={{ 
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.95rem',
                      backgroundColor: 'white',
                      lineHeight: '1.6',
                      textAlign: 'left'
                    }}
                  />
                  <small 
                    className="text-muted d-block mt-2" 
                    style={{ 
                      fontSize: '0.85rem',
                      textAlign: 'left'
                    }}
                  >
                    {updateReason.length}/250 characters
                  </small>
                </div>
              </form>
            </div>

            {/* ✅ UPDATED FOOTER */}
            <div 
              className="modal-footer" 
              style={{ 
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={updating}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  opacity: updating ? 0.5 : 1,
                  cursor: updating ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!updating) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              
              {/* ✅ UPDATED UPDATE BUTTON - Gradient Theme */}
              <button
                type="button"
                className="btn d-flex align-items-center gap-2"
                onClick={handleSubmit}
                disabled={updating || !deadline || !updateReason.trim()}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(151, 36, 126, 0.3)',
                  transition: 'all 0.2s ease',
                  opacity: (updating || !deadline || !updateReason.trim()) ? 0.6 : 1,
                  cursor: (updating || !deadline || !updateReason.trim()) ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!(updating || !deadline || !updateReason.trim())) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(151, 36, 126, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(151, 36, 126, 0.3)';
                }}
              >
                {updating ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm" 
                      role="status"
                      style={{ width: '16px', height: '16px' }}
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update SLA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditSLAModal;
