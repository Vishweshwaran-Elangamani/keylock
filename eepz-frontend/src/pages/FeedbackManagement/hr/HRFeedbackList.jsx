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
  <span className="badge" style={{ backgroundColor: `${color}20`, color, padding: '6px 10px', fontSize: '0.75rem' }}>
    {text}
  </span>
);

export default function HRFeedbackList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('HR');
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
      console.log('📥 Fetching employee map...');
      const response = await axios.get(`${API_BASE}/EmployeeManagement/all`);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map = {};
        response.data.data.forEach(emp => {
          map[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeeMap(map);
        console.log('✅ Employee map loaded:', Object.keys(map).length);
      }
    } catch (err) {
      console.error('❌ Error fetching employee map:', err.message);
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
        console.log('📥 Fetching HR feedback...');
        const formsRes = await axios.get(`${API_BASE}/HrFeedbackForm/forms/active`);
        console.log('✅ Forms response:', formsRes.data);

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
                console.log(`✅ ${mappedHR.length} HR feedback from form ${form.formId}`);
              }
            } catch (err) {
              console.warn(`⚠️ Error fetching HR responses:`, err.message);
            }
          }
        }

        setHrForms(allHRFeedback);
      } catch (hrErr) {
        console.warn('❌ HR feedback API error:', hrErr.message);
        setHrForms([]);
      }

      // ======== FETCH MENTOR FEEDBACK ========
      try {
        console.log('📥 Fetching mentor feedback...');
        const mentorRes = await mentorFeedbackApi.list(1, 100);
        const mentorData = Array.isArray(mentorRes.data?.data) ? mentorRes.data.data : [];
        
        const enrichedMentorData = mentorData.map(m => ({
          ...m,
          mentorNameFull: employeeMap[m.mentorEmployeeId] || `Employee ${m.mentorEmployeeId}`
        }));
        
        setMentor(enrichedMentorData);
        console.log(`✅ ${enrichedMentorData.length} mentor feedback loaded`);
      } catch (mentorErr) {
        console.warn('❌ Mentor feedback API error:', mentorErr.message);
        setMentor([]);
      }

      // ======== FETCH PEER FEEDBACK ========
      try {
        console.log('📥 Fetching peer feedback...');
        const peerRes = await peerQueueApi.list(1, 100);
        const allPeer = Array.isArray(peerRes.data?.data) ? peerRes.data.data : [];
        
        const enrichedPeerData = allPeer.map(p => ({
          ...p,
          recipientNameFull: employeeMap[p.recipientEmployeeId] || `Employee ${p.recipientEmployeeId}`,
          submitterNameFull: employeeMap[p.submittedByEmployeeId] || `Employee ${p.submittedByEmployeeId}`
        }));
        
        setPeer(enrichedPeerData);
        console.log(`✅ ${enrichedPeerData.length} peer feedback loaded`);
      } catch (peerErr) {
        console.warn('❌ Peer feedback API error:', peerErr.message);
        setPeer([]);
      }

    } catch (err) {
      console.error('❌ Fetch error:', err);
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

  // ============================================================================
  // COMPONENTS
  // ============================================================================

  const TabBtn = ({ label, icon: Icon, active }) => (
    <button
      type="button"
      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setTab(label)}
      style={{ borderRadius: 'var(--radius-sm)' }}
    >
      <Icon size={14} className="me-1" style={{ display: 'inline' }} />
      {label}
    </button>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container-fluid py-3" style={{ maxWidth: '1200px' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <BarChart3 size={24} style={{ color: 'var(--color-primary-1)' }} />
            <h2 className="fw-bold mb-0" style={{ color: 'var(--color-primary-1)' }}>
              All Feedback
            </h2>
          </div>
          <p className="mb-0 small" style={{ color: 'var(--muted)' }}>
            View and manage all feedback submissions (HR, Mentor, Peer)
          </p>
        </div>
        <button
          className="btn d-flex align-items-center gap-2"
          onClick={() => {
            fetchEmployeeMap();
            fetchData();
          }}
          disabled={refreshing || loading}
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--border)', 
            color: 'var(--color-primary-3)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.5rem 0.9rem', 
            fontWeight: '600' 
          }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2" style={{ borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={18} className="mt-1" />
          <div>
            <strong>Error</strong>
            <p className="mb-0 small mt-1">{error}</p>
          </div>
          <button className="btn-close ms-auto" onClick={() => setError('')} />
        </div>
      )}

      {/* TABS */}
      <div className="card border-0 mb-3" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
        <div className="card-body d-flex gap-2 flex-wrap">
          
          <TabBtn label="Mentor" icon={Send} active={tab === 'Mentor'} />
          <TabBtn label="Peer" icon={Users} active={tab === 'Peer'} />
          <small className="text-muted ms-auto align-self-center">
            {loading && (
              <>
                <Clock size={14} className="me-1" style={{ display: 'inline' }} />
                Loading...
              </>
            )}
            {!loading && tab === 'HR' && `${hrForms.length} submission(s)`}
            {!loading && tab === 'Mentor' && `${mentor.length} submission(s)`}
            {!loading && tab === 'Peer' && `${peer.length} submission(s)`}
          </small>
        </div>
      </div>

      {/* ========== HR FORMS TAB ========== */}
     

      {/* ========== MENTOR TAB ========== */}
      {tab === 'Mentor' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Send size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">Mentor Feedback</h5>
            </div>
            {mentor.length === 0 ? (
              <p className="text-muted mb-0">No mentor feedback submitted yet</p>
            ) : (
              <div className="row g-3">
                {mentor.map((m) => (
                  <div className="col-md-6 col-lg-4" key={m.trackingId || m.id}>
                    <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small text-muted">Mentor:</h6>
                            <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                              <User size={14} className="me-1" style={{ display: 'inline' }} />
                              {getMentorName(m)}
                            </p>
                          </div>
                          <Badge text={`${m.rating || 0} / 5`} color="#24A148" />
                        </div>
                        <p className="small mb-2" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>
                          {m.feedbackComments ? m.feedbackComments.substring(0, 50) + '...' : 'No comments'}
                        </p>
                        <small className="text-muted d-block mb-2">
                          <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                        </small>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary flex-grow-1" 
                            onClick={() => handleViewResponse(m, 'Mentor')}
                            title="View details"
                          >
                            <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => deleteMentor(m.trackingId || m.id)} 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== PEER TAB ========== */}
      {tab === 'Peer' && (
        <div className="card border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Users size={20} style={{ color: 'var(--color-primary-1)' }} />
              <h5 className="mb-0">Peer Feedback</h5>
            </div>
            {peer.length === 0 ? (
              <p className="text-muted mb-0">No peer feedback submitted yet</p>
            ) : (
              <div className="row g-3">
                {peer.map((p) => {
                  const statusColor = p.status === 'Approved' ? '#24A148' : p.status === 'Rejected' ? '#E01950' : '#0F62FE';
                  
                  return (
                    <div className="col-md-6 col-lg-4" key={p.queueId || p.id}>
                      <div className="card h-100 border-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 small text-muted">From:</h6>
                              <p className="mb-2 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                                <User size={14} className="me-1" style={{ display: 'inline' }} />
                                {getSubmitterName(p)}
                              </p>
                              <h6 className="mb-1 small text-muted">To:</h6>
                              <p className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--color-primary-1)' }}>
                                <User size={14} className="me-1" style={{ display: 'inline' }} />
                                {getRecipientName(p)}
                              </p>
                            </div>
                            <Badge text={p.status || 'Pending'} color={statusColor} />
                          </div>

                          <p className="small mb-2" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>
                            {p.feedbackContent ? p.feedbackContent.substring(0, 50) + '...' : 'No content'}
                          </p>

                          <small className="text-muted d-block mb-2">
                            <Clock size={12} className="me-1" style={{ display: 'inline' }} />
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                          </small>

                          {p.isAnonymous && (
                            <small className="text-muted d-block mb-2">
                              <Lock size={12} className="me-1" style={{ display: 'inline' }} />
                              Submitted anonymously
                            </small>
                          )}

                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-secondary flex-grow-1" 
                              onClick={() => handleViewResponse(p, 'Peer')}
                              title="View details"
                            >
                              <Eye size={14} className="me-1" style={{ display: 'inline' }} />
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => deletePeer(p.queueId || p.id)} 
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODAL - IMPORTED COMPONENT */}
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
