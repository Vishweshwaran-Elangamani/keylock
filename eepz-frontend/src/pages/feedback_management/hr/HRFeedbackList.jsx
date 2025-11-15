import React, { useEffect, useMemo, useState } from 'react';
import { 
  RefreshCw, AlertTriangle, Eye, Trash2, MessageSquare, 
  FileText, Users, Send, Clock, Lock, User, BarChart3
} from 'lucide-react';
import { mentorFeedbackApi, peerQueueApi } from '../../../services/feedbackmanagement/feedbackApi';
import ResponseViewModal from '../../../components/FeedbackManagement/ResponseViewModal';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

const Badge = ({ text, color = '#525252' }) => (
  <span style={{ 
    display: 'inline-block',
    backgroundColor: `${color}15`, 
    color, 
    padding: '6px 12px', 
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: '6px',
    border: `1.5px solid ${color}40`
  }}>
    {text}
  </span>
);

export default function HRFeedbackList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Mentor');
  const [hrForms, setHrForms] = useState([]);
  const [mentor, setMentor] = useState([]);
  const [peer, setPeer] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeMap, setEmployeeMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // ============================================================================
  // FETCH EMPLOYEE MAP
  // ============================================================================

  const fetchEmployeeMap = async () => {
    try {
      console.log('Fetching employee map...');
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('Employee map loaded:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('Error fetching employee map:', err.message);
    }
  };

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchData = async () => {
    setRefreshing(true);
    setLoading(true);
    setError('');
    
    try {
      // ======== FETCH HR FEEDBACK ========
      try {
        console.log('Fetching HR feedback...');
        const formsRes = await axios.get(`${API_BASE}/HrFeedbackForm/forms/active`);
        console.log('Forms response:', formsRes.data);

        let allHRFeedback = [];

        if (formsRes.data?.success && Array.isArray(formsRes.data.data)) {
          const forms = formsRes.data.data;

          for (const form of forms) {
            try {
              const respRes = await axios.get(`${API_BASE}/HrFeedbackForm/responses/by-form/${form.formId}`);

              if (respRes.data?.success && Array.isArray(respRes.data.data)) {
                const mappedHR = respRes.data.data.map(r => ({
                  responseId: r.responseId,
                  formId: form.formId,
                  formName: form.formName,
                  employeeId: r.employeeId,
                  employeeName: employeeMap[r.employeeId] || `Employee ${r.employeeId}`,
                  status: r.status || 'Submitted',
                  submittedAt: r.submittedDate || r.createdAt || new Date().toISOString(),
                  hrReviewComments: r.hrReviewComments,
                  ...r
                }));

                allHRFeedback = [...allHRFeedback, ...mappedHR];
                console.log(`${mappedHR.length} HR feedback from form ${form.formId}`);
              }
            } catch (err) {
              console.warn(`Error fetching HR responses:`, err.message);
            }
          }
        }

        setHrForms(allHRFeedback);
      } catch (hrErr) {
        console.warn('HR feedback API error:', hrErr.message);
        setHrForms([]);
      }

      // ======== FETCH MENTOR FEEDBACK ========
      try {
        console.log('Fetching mentor feedback...');
        const mentorRes = await mentorFeedbackApi.list(1, 100);
        const mentorData = Array.isArray(mentorRes.data?.data) ? mentorRes.data.data : [];
        
        const enrichedMentorData = mentorData.map(m => ({
          ...m,
          mentorNameFull: employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`
        }));
        
        setMentor(enrichedMentorData);
        console.log(`${enrichedMentorData.length} mentor feedback loaded`);
      } catch (mentorErr) {
        console.warn('Mentor feedback API error:', mentorErr.message);
        setMentor([]);
      }

      // ======== FETCH PEER FEEDBACK ========
      try {
        console.log('Fetching peer feedback...');
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes.data?.data) ? peerRes.data.data : [];
        
        const enrichedPeerData = allPeer.map(p => ({
          ...p,
          recipientNameFull: employeeMap[p.recipientEmployeeId] || `Employee ${p.recipientEmployeeId}`,
          submitterNameFull: employeeMap[p.submittedByEmployeeId] || `Employee ${p.submittedByEmployeeId}`
        }));
        
        setPeer(enrichedPeerData);
        console.log(`${enrichedPeerData.length} peer feedback loaded`);
      } catch (peerErr) {
        console.warn('Peer feedback API error:', peerErr.message);
        setPeer([]);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployeeMap();
  }, []);

  useEffect(() => {
    if (Object.keys(employeeMap).length > 0) {
      fetchData();
    }
  }, [employeeMap]);

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================

  const handleViewResponse = (data, type) => {
    setSelectedResponse(data);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResponse(null);
    setSelectedType(null);
  };

  // ============================================================================
  // DELETE HANDLERS
  // ============================================================================

  const deleteHRForm = async (responseId) => {
    if (!window.confirm('Delete this HR form submission? This action cannot be undone.')) return;
    setError('');
    
    try {
      await axios.delete(`${API_BASE}/HrFeedbackForm/responses/${responseId}`);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to delete HR form');
    }
  };

  const deleteMentor = async (trackingId) => {
    if (!window.confirm('Delete this mentor feedback submission?')) return;
    setError('');
    
    try {
      await mentorFeedbackApi.remove(trackingId);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete mentor feedback');
    }
  };

  const deletePeer = async (queueId) => {
    if (!window.confirm('Delete this peer feedback submission?')) return;
    setError('');
    
    try {
      await peerQueueApi.remove(queueId);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete peer feedback');
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getMentorName = (m) => {
    return m.mentorNameFull || m.mentorName || `Employee ${m.mentorEmployeeId}`;
  };

  const getRecipientName = (p) => {
    return p.recipientNameFull || p.recipientName || `Employee ${p.recipientEmployeeId}`;
  };

  const getSubmitterName = (p) => {
    return p.submitterNameFull || p.submitterName || `Employee ${p.submittedByEmployeeId}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: '1.75rem', color: '#212529' }}>
              All Feedback Submissions
            </h2>
            <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
              View and manage all feedback submissions (Mentor & Peer)
            </p>
          </div>
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => {
              fetchEmployeeMap();
              fetchData();
            }}
            disabled={refreshing || loading}
            style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: 600, border: '2px solid #dee2e6' }}
          >
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show d-flex align-items-start gap-2 mb-4" role="alert" style={{ borderRadius: '8px' }}>
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* TABS - PURPLE COLOR */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div className="row g-3">
            {/* Mentor Card */}
            <div className="col-md-6">
              <button
                type="button"
                onClick={() => setTab('Mentor')}
                style={{
                  width: '100%',
                  background: tab === 'Mentor' ? '#97247E' : 'white',
                  border: `2px solid ${tab === 'Mentor' ? '#97247E' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: tab === 'Mentor' ? 'rgba(255,255,255,0.2)' : '#97247E15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Send size={24} style={{ color: tab === 'Mentor' ? 'white' : '#97247E' }} />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: tab === 'Mentor' ? 'white' : '#6c757d',
                      marginBottom: '4px'
                    }}>
                      Mentor Feedback
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: tab === 'Mentor' ? 'white' : '#212529'
                    }}>
                      {mentor.length}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Peer Card */}
            <div className="col-md-6">
              <button
                type="button"
                onClick={() => setTab('Peer')}
                style={{
                  width: '100%',
                  background: tab === 'Peer' ? '#97247E' : 'white',
                  border: `2px solid ${tab === 'Peer' ? '#97247E' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: tab === 'Peer' ? 'rgba(255,255,255,0.2)' : '#97247E15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={24} style={{ color: tab === 'Peer' ? 'white' : '#97247E' }} />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: tab === 'Peer' ? 'white' : '#6c757d',
                      marginBottom: '4px'
                    }}>
                      Peer Feedback
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: tab === 'Peer' ? 'white' : '#212529'
                    }}>
                      {peer.length}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ width: '3rem', height: '3rem', color: '#97247E', borderWidth: '3px' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3 fw-medium">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* ========== MENTOR TAB ========== */}
            {tab === 'Mentor' && (
              mentor.length === 0 ? (
                <div style={{ 
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '3rem',
                  textAlign: 'center'
                }}>
                  <AlertTriangle size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                  <h5 className="fw-bold mb-2" style={{ color: '#6c757d' }}>No Mentor Feedback Yet</h5>
                  <p className="text-muted mb-0">There are no mentor feedback submissions.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {mentor.map((m) => (
                    <div className="col-md-6 col-lg-4" key={m.trackingId || m.id}>
                      <div style={{ 
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderLeft: '4px solid #97247E',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        height: '100%',
                        transition: 'box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(151, 36, 126, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>
                              Mentor
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <User size={14} style={{ color: '#97247E' }} />
                              <h6 className="mb-0 fw-bold" style={{ fontSize: '0.938rem', color: '#212529' }}>
                                {getMentorName(m)}
                              </h6>
                            </div>
                          </div>
                          <Badge text={`${m.rating || 0}/5`} color="#97247E" />
                        </div>

                        <div className="mb-3">
                          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.813rem' }}>
                            <Clock size={14} />
                            <span>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</span>
                          </div>
                        </div>

                        <div className="mb-3" style={{ 
                          background: '#f8f9fa',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          minHeight: '60px'
                        }}>
                          <p className="mb-0" style={{ fontSize: '0.813rem', color: '#495057' }}>
                            {m.feedbackComments ? m.feedbackComments.substring(0, 80) + '...' : 'No comments'}
                          </p>
                        </div>

                        <div className="d-flex gap-2">
                          <button 
                            className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
                            onClick={() => handleViewResponse(m, 'Mentor')}
                            style={{ 
                              borderRadius: '6px', 
                              padding: '8px', 
                              fontWeight: 600,
                              background: '#97247E',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button 
                            className="btn btn-outline-danger d-flex align-items-center justify-content-center" 
                            onClick={() => deleteMentor(m.trackingId || m.id)}
                            style={{ borderRadius: '6px', padding: '8px', width: '40px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ========== PEER TAB ========== */}
            {tab === 'Peer' && (
              peer.length === 0 ? (
                <div style={{ 
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '3rem',
                  textAlign: 'center'
                }}>
                  <AlertTriangle size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                  <h5 className="fw-bold mb-2" style={{ color: '#6c757d' }}>No Peer Feedback Yet</h5>
                  <p className="text-muted mb-0">There are no peer feedback submissions.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {peer.map((p) => {
                    const statusColor = p.status === 'Approved' ? '#198754' : p.status === 'Rejected' ? '#dc3545' : '#97247E';
                    
                    return (
                      <div className="col-md-6 col-lg-4" key={p.queueId || p.id}>
                        <div style={{ 
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderLeft: `4px solid ${statusColor}`,
                          borderRadius: '10px',
                          padding: '1.25rem',
                          height: '100%',
                          transition: 'box-shadow 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(151, 36, 126, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>
                                From
                              </div>
                              <div className="d-flex align-items-center gap-1 mb-2">
                                <User size={14} style={{ color: '#6c757d' }} />
                                <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.875rem', color: '#212529' }}>
                                  {getSubmitterName(p)}
                                </h6>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '4px', fontWeight: 600 }}>
                                To
                              </div>
                              <div className="d-flex align-items-center gap-1">
                                <User size={14} style={{ color: '#97247E' }} />
                                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.938rem', color: '#212529' }}>
                                  {getRecipientName(p)}
                                </h6>
                              </div>
                            </div>
                            <Badge text={p.status || 'Pending'} color={statusColor} />
                          </div>

                          <div className="mb-3">
                            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.813rem' }}>
                              <Clock size={14} />
                              <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</span>
                            </div>
                          </div>

                          {p.isAnonymous && (
                            <div className="mb-2" style={{ fontSize: '0.813rem', color: '#6c757d' }}>
                              <Lock size={12} className="me-1" style={{ display: 'inline' }} />
                              <span>Anonymous submission</span>
                            </div>
                          )}

                          <div className="mb-3" style={{ 
                            background: '#f8f9fa',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            minHeight: '60px'
                          }}>
                            <p className="mb-0" style={{ fontSize: '0.813rem', color: '#495057' }}>
                              {p.feedbackContent ? p.feedbackContent.substring(0, 80) + '...' : 'No content'}
                            </p>
                          </div>

                          <div className="d-flex gap-2">
                            <button 
                              className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
                              onClick={() => handleViewResponse(p, 'Peer')}
                              style={{ 
                                borderRadius: '6px', 
                                padding: '8px', 
                                fontWeight: 600,
                                background: '#97247E',
                                color: 'white',
                                border: 'none'
                              }}
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button 
                              className="btn btn-outline-danger d-flex align-items-center justify-content-center" 
                              onClick={() => deletePeer(p.queueId || p.id)}
                              style={{ borderRadius: '6px', padding: '8px', width: '40px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>

      <ResponseViewModal 
        show={showModal} 
        response={selectedResponse} 
        onClose={handleCloseModal}
        type={selectedType}
      />

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
