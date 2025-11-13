// src/pages/sla/SLAEscalations.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle,
  User, Calendar, FileText, MessageSquare
} from 'lucide-react';
import slaService from '../../services/sla/slaService';
import { formatDate, formatDateTime } from '../../utils/sla/dateFormatter';

const SLAEscalations = () => {
  const { slaid } = useParams();
  const navigate = useNavigate();
  const [escalations, setEscalations] = useState([]);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({
    escalationStatus: 'Resolved',
    resolutionComments: ''
  });

  useEffect(() => {
    fetchData();
  }, [slaid]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [slaResponse, escalationsResponse] = await Promise.all([
        slaService.getSLAById(parseInt(slaid)),
        slaService.getSLAEscalations(parseInt(slaid))
      ]);

      if (slaResponse.success) {
        setSla(slaResponse.data);
      }

      if (escalationsResponse.success) {
        setEscalations(escalationsResponse.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEscalation = async (escalationId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await slaService.resolveEscalation({
        escalationId,
        resolvedByEmployeeId: user.empId,
        ...resolutionForm
      });

      if (response.success) {
        alert('Escalation resolved successfully!');
        setSelectedEscalation(null);
        setResolutionForm({ escalationStatus: 'Resolved', resolutionComments: '' });
        fetchData();
      }
    } catch (err) {
      alert('Failed to resolve escalation: ' + err.message);
    }
  };

  const getEscalationLevelColor = (level) => {
    switch (level) {
      case 'L1': return { bg: '#0F62FE15', text: '#0F62FE' };
      case 'L2': return { bg: '#E2B93B15', text: '#E2B93B' };
      case 'DeptHead': return { bg: '#AC509815', text: '#AC5098' };
      case 'Leadership': return { bg: '#E0195015', text: '#E01950' };
      default: return { bg: '#6B728015', text: '#6B7280' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle size={20} color="#24A148" />;
      case 'Dismissed':
        return <XCircle size={20} color="#6B7280" />;
      case 'Escalated':
        return <AlertTriangle size={20} color="#E2B93B" />;
      default:
        return <Clock size={20} color="#0F62FE" />;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary rounded-circle"
            onClick={() => navigate(-1)}
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>
              SLA Escalations
            </h2>
            {sla && (
              <p className="text-muted mb-0">
                {sla.slatype} - {sla.employeeName}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Escalations List */}
      {escalations.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <AlertTriangle size={64} className="text-muted mb-3" />
            <h5 className="text-muted">No Escalations</h5>
            <p className="text-muted mb-0">This SLA has no escalations</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {escalations.map((escalation, index) => {
            const levelColors = getEscalationLevelColor(escalation.escalationLevel);
            const isExpanded = selectedEscalation === escalation.escalationId;

            return (
              <div key={escalation.escalationId} className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '48px', 
                            height: '48px',
                            backgroundColor: levelColors.bg
                          }}
                        >
                          {getStatusIcon(escalation.escalationStatus)}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="mb-0 fw-bold">{escalation.reason}</h5>
                            <span 
                              className="badge"
                              style={{
                                backgroundColor: levelColors.bg,
                                color: levelColors.text,
                                border: `1px solid ${levelColors.text}30`
                              }}
                            >
                              {escalation.escalationLevel}
                            </span>
                          </div>
                          <p className="text-muted mb-0 small">{escalation.description}</p>
                        </div>
                      </div>

                      <div className="text-end">
                        <span 
                          className={`badge ${
                            escalation.escalationStatus === 'Resolved' ? 'bg-success' :
                            escalation.escalationStatus === 'Dismissed' ? 'bg-secondary' :
                            escalation.escalationStatus === 'Escalated' ? 'bg-warning' :
                            'bg-primary'
                          }`}
                        >
                          {escalation.escalationStatus}
                        </span>
                        <div className="text-muted small mt-2">
                          Escalation #{index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="row g-4 mb-3">
                      <div className="col-md-3">
                        <div className="d-flex align-items-start gap-2">
                          <User size={16} className="text-muted mt-1" />
                          <div>
                            <small className="text-muted d-block">Escalated To</small>
                            <strong className="small">{escalation.escalatedTo}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="d-flex align-items-start gap-2">
                          <User size={16} className="text-muted mt-1" />
                          <div>
                            <small className="text-muted d-block">Submitted By</small>
                            <strong className="small">{escalation.submittedBy}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="d-flex align-items-start gap-2">
                          <Calendar size={16} className="text-muted mt-1" />
                          <div>
                            <small className="text-muted d-block">Submitted At</small>
                            <strong className="small">{formatDateTime(escalation.submittedAt)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="d-flex align-items-start gap-2">
                          <Clock size={16} className="text-muted mt-1" />
                          <div>
                            <small className="text-muted d-block">Escalation Deadline</small>
                            <strong className="small">{formatDate(escalation.escalationDeadline)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Section */}
                    {escalation.resolvedAt && (
                      <div 
                        className="alert alert-success mb-0 d-flex align-items-start gap-3"
                        style={{ borderRadius: '8px' }}
                      >
                        <CheckCircle size={20} className="text-success mt-1 flex-shrink-0" />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className="d-block">Resolution</strong>
                            <small className="text-muted">
                              Resolved by {escalation.resolvedBy} on {formatDateTime(escalation.resolvedAt)}
                            </small>
                          </div>
                          <p className="mb-0 small">{escalation.resolutionComments}</p>
                        </div>
                      </div>
                    )}

                    {/* Resolve Button */}
                    {escalation.escalationStatus === 'Pending' && (
                      <div className="mt-3">
                        <button
                          className="btn btn-outline-success btn-sm d-flex align-items-center gap-2"
                          onClick={() => setSelectedEscalation(
                            isExpanded ? null : escalation.escalationId
                          )}
                          style={{ borderRadius: '8px' }}
                        >
                          <MessageSquare size={14} />
                          {isExpanded ? 'Cancel' : 'Resolve Escalation'}
                        </button>

                        {/* Resolution Form */}
                        {isExpanded && (
                          <div className="mt-3 p-3 border rounded" style={{ borderRadius: '8px' }}>
                            <h6 className="fw-semibold mb-3">Resolve Escalation</h6>
                            
                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Status</label>
                              <select
                                className="form-select"
                                value={resolutionForm.escalationStatus}
                                onChange={(e) => setResolutionForm({
                                  ...resolutionForm,
                                  escalationStatus: e.target.value
                                })}
                                style={{ borderRadius: '8px' }}
                              >
                                <option value="Resolved">Resolved</option>
                                <option value="Dismissed">Dismissed</option>
                                <option value="Escalated">Escalate Further</option>
                              </select>
                            </div>

                            <div className="mb-3">
                              <label className="form-label small fw-semibold">Resolution Comments</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                value={resolutionForm.resolutionComments}
                                onChange={(e) => setResolutionForm({
                                  ...resolutionForm,
                                  resolutionComments: e.target.value
                                })}
                                placeholder="Provide details about the resolution..."
                                style={{ borderRadius: '8px' }}
                              />
                            </div>

                            <button
                              className="btn btn-success d-flex align-items-center gap-2"
                              onClick={() => handleResolveEscalation(escalation.escalationId)}
                              disabled={!resolutionForm.resolutionComments}
                              style={{ borderRadius: '8px' }}
                            >
                              <CheckCircle size={16} />
                              Submit Resolution
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SLAEscalations;
