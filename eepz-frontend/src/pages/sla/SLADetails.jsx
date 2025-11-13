// src/pages/sla/SLADetails.jsx - IMPROVED UI
 
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Clock,
  CheckCircle, AlertTriangle, RotateCcw, History, Loader
} from 'lucide-react';
import SLAHistoryTimeline from '../../components/sla/SLAHistoryTimeline';
import ReopenSLAForm from '../../components/sla/ReopenSLAForm';
import EscalationForm from '../../components/sla/EscalationForm';
import slaService, { escalationHelpers, dateHelpers } from '../../services/sla/slaService';
 
const SLADetails = () => {
  const { slaid } = useParams();
  const navigate = useNavigate();
  const [sla, setSla] = useState(null);
  const [history, setHistory] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [canReopen, setCanReopen] = useState(false);
  const [canEscalate, setCanEscalate] = useState(false);
  const [escalationBlockReason, setEscalationBlockReason] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
 
  // ========== INITIALIZE ==========
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    } catch (err) {
      console.error('❌ Error parsing user:', err);
    }
    fetchSLADetails();
  }, [slaid]);
 
  // ========== FETCH SLA DATA ==========
  const fetchSLADetails = useCallback(async () => {
    setLoading(true);
    setError(null);
 
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
 
      console.log(`🔍 Fetching SLA ${slaid}`);
      const slaResponse = await slaService.getSLAById(parseInt(slaid));
     
      if (!slaResponse?.success || !slaResponse.data) {
        setError('SLA not found');
        setSla(null);
        setLoading(false);
        return;
      }
 
      setSla(slaResponse.data);
      console.log('✅ SLA loaded:', slaResponse.data);
 
      // Fetch SLA history
      try {
        const historyResponse = await slaService.getSLAHistory(parseInt(slaid));
        if (historyResponse?.success && Array.isArray(historyResponse.data)) {
          setHistory(historyResponse.data);
          console.log(`✅ ${historyResponse.data.length} history entries loaded`);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn('⚠️ Could not load history:', err.message);
        setHistory([]);
      }
 
      // Fetch SLA escalations
      try {
        const escalationsResponse = await slaService.getSLAEscalations(parseInt(slaid));
        if (escalationsResponse?.success && Array.isArray(escalationsResponse.data)) {
          const escData = escalationsResponse.data;
          setEscalations(escData);
          console.log(`✅ ${escData.length} escalations loaded`);
          updateEscalationStatus(slaResponse.data, escData, userData);
        } else {
          setEscalations([]);
          updateEscalationStatus(slaResponse.data, [], userData);
        }
      } catch (err) {
        console.warn('⚠️ Could not load escalations:', err.message);
        setEscalations([]);
        updateEscalationStatus(slaResponse.data, [], userData);
      }
    } catch (err) {
      console.error('❌ Error fetching SLA details:', err);
      setError(err.message || 'Failed to fetch SLA details');
    } finally {
      setLoading(false);
    }
  }, [slaid]);
 
  // ========== UPDATE ESCALATION STATUS ==========
  const updateEscalationStatus = useCallback((slaData, escalationsData, userData) => {
    if (!slaData || !userData) return;
 
    const canEsc = escalationHelpers.canEscalateToL2(slaData, escalationsData) &&
                   (userData.roleName === 'Employee' || userData.roleName === 'Manager');
 
    setCanEscalate(canEsc);
 
    if (!canEsc) {
      const reason = escalationHelpers.getEscalationBlockReason(slaData, escalationsData);
      setEscalationBlockReason(reason);
    } else {
      setEscalationBlockReason(null);
    }
 
    setCanReopen(userData.roleName === 'Manager' && slaData.status === 'Closed');
  }, []);
 
  // ========== ACTION HANDLERS ==========
  const handleEscalateClick = useCallback(() => {
    if (!canEscalate) {
      alert(`❌ Cannot escalate: ${escalationBlockReason}`);
      return;
    }
    setShowEscalationForm(true);
  }, [canEscalate, escalationBlockReason]);
 
  const handleCloseSLA = useCallback(async () => {
    if (!window.confirm('Are you sure you want to close this SLA?')) return;
 
    try {
      setRefreshing(true);
      console.log(`✅ Closing SLA ${sla.slaid}`);
      const res = await slaService.closeSLA({
        slaid: sla.slaid,
        closedByEmployeeId: user.empId,
        closureComments: 'Closed from details page'
      });
 
      if (res?.success) {
        alert('✅ SLA closed successfully!');
        await fetchSLADetails();
      } else {
        alert('❌ ' + (res?.message || 'Failed to close SLA'));
      }
    } catch (err) {
      console.error('❌ Error closing SLA:', err);
      alert('Error: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  }, [sla, user, fetchSLADetails]);
 
  const handleReopenSuccess = useCallback(() => {
    setShowReopenForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);
 
  const handleEscalationSuccess = useCallback(() => {
    setShowEscalationForm(false);
    fetchSLADetails();
  }, [fetchSLADetails]);
 
  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '600px' }}>
        <div className="text-center">
          <Loader size={48} className="text-primary mb-3" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-muted">Loading SLA details...</p>
        </div>
      </div>
    );
  }
 
  if (error || !sla) {
    return (
      <div className="p-4">
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertTriangle size={20} />
          <span>{error || 'SLA not found'}</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="me-2" />
          Go Back
        </button>
      </div>
    );
  }
 
  const daysRemaining = dateHelpers.daysRemaining(sla.deadline);
  const hasEscalations = escalations.length > 0;
 
  return (
    <div className="container-fluid" style={{ padding: '1.5rem' }}>
      {/* ========== HEADER ========== */}
      <div
        className="d-flex justify-content-between align-items-center mb-4 gap-3"
        style={{ flexWrap: 'wrap' }}
      >
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              padding: 0
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: '#27235c', fontSize: '1.75rem' }}>
              SLA Details
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
              SLA #{sla.slaid} - {sla.slatype}
            </p>
          </div>
        </div>
 
        {/* ACTION BUTTONS */}
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          {sla.status !== 'Closed' && (user?.roleName === 'Employee' || user?.roleName === 'Manager') && (
            canEscalate ? (
              <button
                onClick={handleEscalateClick}
                className="btn btn-warning d-flex align-items-center gap-2"
                style={{
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 500
                }}
              >
                <AlertTriangle size={16} />
                Escalate
              </button>
            ) : (
              <button
                disabled
                className="btn btn-secondary d-flex align-items-center gap-2"
                title={escalationBlockReason || 'Cannot escalate'}
                style={{
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 500
                }}
              >
                <AlertTriangle size={16} />
                Escalated
              </button>
            )
          )}
 
          {canReopen && sla.status === 'Closed' && (
            <button
              onClick={() => setShowReopenForm(true)}
              className="btn btn-warning d-flex align-items-center gap-2"
              style={{
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 500
              }}
            >
              <RotateCcw size={16} />
              Reopen
            </button>
          )}
 
          {sla.status !== 'Closed' && user?.roleName === 'Manager' && (
            <button
              onClick={handleCloseSLA}
              disabled={refreshing}
              className="btn btn-success d-flex align-items-center gap-2"
              style={{
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 500
              }}
            >
              <CheckCircle size={16} />
              Close SLA
            </button>
          )}
        </div>
      </div>
 
      {/* ========== MAIN GRID ========== */}
      <div className="row g-4">
        {/* LEFT COLUMN */}
        <div className="col-lg-8">
          {/* STATUS CARD */}
          <div
            className="card border-0 shadow-sm mb-4"
            style={{ borderRadius: '12px' }}
          >
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="d-flex gap-3 mb-4 align-items-start">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#e0f2fe',
                    borderRadius: '12px',
                    flexShrink: 0
                  }}
                >
                  <FileText size={28} className="text-primary" />
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-2 fw-bold" style={{ color: '#0f172a' }}>
                    {sla.slatype}
                  </h4>
                  <div className="d-flex gap-2 flex-wrap">
                    <span
                      className={`badge ${
                        sla.status === 'Closed' ? 'bg-success' :
                        sla.status === 'Escalated' ? 'bg-danger' :
                        'bg-primary'
                      }`}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px'
                      }}
                    >
                      {sla.status}
                    </span>
                    {hasEscalations && (
                      <span
                        className="badge bg-warning text-dark"
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                      >
                        ⚠️ Escalated
                      </span>
                    )}
                  </div>
                </div>
              </div>
 
              {/* DETAILS GRID */}
              <div className="row g-4">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Employee
                  </small>
                  <strong style={{ color: '#0f172a', fontSize: '0.938rem' }}>
                    {sla.employeeName || '—'}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Department
                  </small>
                  <strong style={{ color: '#0f172a', fontSize: '0.938rem' }}>
                    {sla.departmentName || '—'}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Deadline
                  </small>
                  <strong style={{ color: '#0f172a', fontSize: '0.938rem' }}>
                    {dateHelpers.formatDeadline(sla.deadline)}
                  </strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Compliance Status
                  </small>
                  <strong
                    className={sla.complianceStatus === 'OnTime' ? 'text-success' : 'text-danger'}
                    style={{ fontSize: '0.938rem' }}
                  >
                    {sla.complianceStatus || '—'}
                  </strong>
                </div>
              </div>
 
              {/* REOPEN ALERT */}
              {sla.reopenedAt && (
                <div
                  className="alert alert-warning mt-4 d-flex gap-3 align-items-start"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                    backgroundColor: '#fef3c7'
                  }}
                >
                  <RotateCcw size={20} className="flex-shrink-0" style={{ marginTop: '2px' }} />
                  <div>
                    <strong className="d-block mb-1" style={{ color: '#92400e' }}>
                      This SLA was reopened
                    </strong>
                    <small className="text-muted d-block" style={{ color: '#78350f' }}>
                      Reopened on {dateHelpers.formatDeadline(sla.reopenedAt)} with {sla.reopenExtensionDays || 0} day extension
                      {sla.reopenReason && <><br />Reason: {sla.reopenReason}</>}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
 
          {/* ESCALATION CHAIN */}
          {hasEscalations && (
            <div
              className="card border-0 shadow-sm mb-4"
              style={{ borderRadius: '12px' }}
            >
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <h5 className="mb-3 fw-bold d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                  <AlertTriangle size={20} className="text-danger" />
                  Escalation Chain ({escalations.length})
                </h5>
 
                {escalations.map((esc, idx) => (
                  <div
                    key={esc.escalationId}
                    className="mb-3 pb-3"
                    style={{
                      borderBottom: idx < escalations.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}
                  >
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <span
                        className={`badge ${esc.escalationLevel === 'L2' ? 'bg-warning text-dark' : 'bg-info'}`}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                      >
                        {esc.escalationLevel}
                      </span>
                      <span
                        className={`badge ${esc.escalationStatus === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                      >
                        {esc.escalationStatus === 'Resolved' ? '✓ Resolved' : '⏳ Pending'}
                      </span>
                    </div>
 
                    <div
                      className="p-3"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div className="row g-3 mb-2">
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Escalated By
                          </small>
                          <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                            {esc.submittedByName || `User ${esc.submittedByEmployeeId}`}
                          </strong>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Escalated To
                          </small>
                          <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                            {esc.escalatedToName || `User ${esc.escalatedToEmployeeId}`}
                          </strong>
                        </div>
                      </div>
                      <div className="mb-1">
                        <small className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                          <span className="fw-semibold">Reason:</span> {esc.reason || '—'}
                        </small>
                      </div>
                      {esc.description && (
                        <small className="text-muted d-block" style={{ fontSize: '0.813rem' }}>
                          <span className="fw-semibold">Description:</span> {esc.description}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {/* TABS - IMPROVED STYLING */}
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          >
            {/* TAB HEADERS */}
            <div
              style={{
                backgroundColor: '#27235c',
                borderBottom: '2px solid #1e1b4d'
              }}
            >
              <ul
                className="nav nav-tabs border-0 m-0"
                role="tablist"
                style={{ padding: '0 1rem' }}
              >
                <li className="nav-item">
                  <button
                    className={`nav-link border-0 d-flex align-items-center gap-2 ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                    style={{
                      color: activeTab === 'details' ? '#fff' : 'rgba(255,255,255,0.7)',
                      backgroundColor: activeTab === 'details' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      borderBottom: activeTab === 'details' ? '3px solid #fff' : '3px solid transparent',
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'details') {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'details') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }
                    }}
                  >
                    <FileText size={16} />
                    Details
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link border-0 d-flex align-items-center gap-2 ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    style={{
                      color: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.7)',
                      backgroundColor: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      borderBottom: activeTab === 'history' ? '3px solid #fff' : '3px solid transparent',
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'history') {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'history') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }
                    }}
                  >
                    <History size={16} />
                    History ({history.length})
                  </button>
                </li>
              </ul>
            </div>
 
            {/* TAB CONTENT */}
            <div className="card-body" style={{ padding: '1.5rem' }}>
              {activeTab === 'details' && (
                <div className="row g-4">
                  {sla.createdAt && (
                    <div className="col-md-6">
                      <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Created At
                      </small>
                      <strong style={{ color: '#0f172a', fontSize: '0.938rem' }}>
                        {new Date(sla.createdAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {sla.updatedAt && (
                    <div className="col-md-6">
                      <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Last Updated
                      </small>
                      <strong style={{ color: '#0f172a', fontSize: '0.938rem' }}>
                        {new Date(sla.updatedAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              )}
 
              {activeTab === 'history' && (
                <div>
                  {history.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem 1rem' }}>
                      <History size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                      <p className="text-muted mb-0" style={{ fontSize: '0.938rem', fontWeight: 500 }}>
                        No history available
                      </p>
                    </div>
                  ) : (
                    <SLAHistoryTimeline history={history} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* RIGHT SIDEBAR */}
        <div className="col-lg-4">
          <div
            className="card border-0 shadow-sm sticky-top"
            style={{ top: '20px', borderRadius: '12px' }}
          >
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <h5 className="mb-4 fw-bold" style={{ color: '#0f172a' }}>
                Status Summary
              </h5>
 
              <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Escalations
                </small>
                <div className="fw-bold text-primary" style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {escalations.length}
                </div>
              </div>
 
              <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status
                </small>
                <span
                  className={`badge ${
                    sla.status === 'Closed' ? 'bg-success' :
                    sla.status === 'Escalated' ? 'bg-danger' :
                    'bg-primary'
                  }`}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '6px'
                  }}
                >
                  {sla.status}
                </span>
              </div>
 
              <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Days Until Deadline
                </small>
                <div
                  className={`fw-bold ${daysRemaining < 0 ? 'text-danger' : 'text-success'}`}
                  style={{ fontSize: '1.75rem', lineHeight: 1.2 }}
                >
                  {Math.abs(daysRemaining)} days
                  <small className="d-block text-muted" style={{ fontSize: '0.875rem', marginTop: '4px', fontWeight: 500 }}>
                    {daysRemaining < 0 ? 'OVERDUE' : 'remaining'}
                  </small>
                </div>
              </div>
 
              <div
                className="p-3"
                style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}
              >
                <small className="d-block fw-bold mb-2" style={{ color: '#1e40af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pending Escalations
                </small>
                <div className="fw-bold" style={{ fontSize: '1.75rem', color: '#1e40af', lineHeight: 1 }}>
                  {escalations.filter(e => e.escalationStatus === 'Pending').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ========== MODALS ========== */}
      {showReopenForm && (
        <ReopenSLAForm
          sla={sla}
          onClose={() => setShowReopenForm(false)}
          onSuccess={handleReopenSuccess}
        />
      )}
 
      {showEscalationForm && (
        <EscalationForm
          sla={sla}
          onClose={() => setShowEscalationForm(false)}
          onSuccess={handleEscalationSuccess}
        />
      )}
 
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
 
export default SLADetails;
 
 