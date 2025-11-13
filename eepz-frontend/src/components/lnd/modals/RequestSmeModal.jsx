import { useState, useEffect } from 'react';
import { X, Users, AlertCircle, Calendar } from 'lucide-react';
import { lndService } from '../../../services/lnd/lndService';
import { toast } from 'sonner';

const RequestSmeModal = ({ employeeId, skillId, onClose, onSuccess }) => {
  const [availableSmes, setAvailableSmes] = useState([]);
  const [selectedSmeId, setSelectedSmeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSmes, setFetchingSmes] = useState(true);

  useEffect(() => {
    fetchAvailableSmes();
  }, []);

  const fetchAvailableSmes = async () => {
    try {
      setFetchingSmes(true);
      const response = await lndService.getAvailableSmes(skillId, 1);
      
      if (response.data.success) {
        setAvailableSmes(response.data.data.items);
        if (response.data.data.items.length > 0) {
          setSelectedSmeId(response.data.data.items[0].smeId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch SMEs:', error);
      toast.error('Failed to load available SMEs');
    } finally {
      setFetchingSmes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSmeId) {
      toast.error('Please select an SME');
      return;
    }

    try {
      setLoading(true);

      const data = {
        skillId: skillId,
        mentorEmployeeId: selectedSmeId,
        menteeEmployeeId: employeeId,
        deadline: deadline || null
      };

      const response = await lndService.requestSmeAssignment(data);

      if (response.data.success) {
        onSuccess();
      } else {
        toast.error(response.data.message || 'Failed to request SME assignment');
      }
    } catch (error) {
      console.error('Failed to request SME:', error);
      toast.error(error.response?.data?.message || 'Failed to request SME assignment');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (fetchingSmes) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem', marginBottom: 0 }}>Loading available SMEs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h5 style={{ margin: 0, fontWeight: '600', color: '#212529' }}>
              Request SME Assignment
            </h5>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '1.5rem' }}>
              {availableSmes.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffc107'
                  }}
                >
                  <Users size={48} color="#856404" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#856404', margin: 0, marginBottom: '0.5rem' }}>
                    No Available SMEs
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#856404', margin: 0 }}>
                    All SMEs for this skill are currently at maximum capacity (3 assignments).
                    Please try again later.
                  </p>
                </div>
              ) : (
                <>
                  {/* Available SMEs List */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#212529', marginBottom: '0.75rem', display: 'block' }}>
                      Available SMEs ({availableSmes.length})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {availableSmes.map((sme) => (
                        <div
                          key={sme.employeeId}
                          style={{
                            padding: '1rem',
                            border: selectedSmeId === sme.employeeId ? '2px solid #97247E' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            background: selectedSmeId === sme.employeeId ? '#f9f5ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setSelectedSmeId(sme.employeeId)}
                        >                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#212529', margin: 0, marginBottom: '0.25rem' }}>
                                {sme.employeeName}
                              </p>
                              <p style={{ fontSize: '0.8125rem', color: '#6c757d', margin: 0 }}>
                                Current Assignments: {sme.inProgressAssignments}/3
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="smeSelection"
                              checked={selectedSmeId === sme.employeeId}
                              onChange={() => setSelectedSmeId(sme.employeeId)}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deadline (Optional) */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#212529', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} />
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={getMinDate()}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#97247E';
                        e.target.style.boxShadow = '0 0 0 3px rgba(151, 36, 126, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#212529',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || availableSmes.length === 0 || !selectedSmeId}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: !loading && availableSmes.length > 0 && selectedSmeId
                    ? 'linear-gradient(135deg, #AC5098 0%, #97247E 100%)'
                    : '#e5e7eb',
                  color: !loading && availableSmes.length > 0 && selectedSmeId ? '#fff' : '#6c757d',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: !loading && availableSmes.length > 0 && selectedSmeId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Requesting...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RequestSmeModal;
