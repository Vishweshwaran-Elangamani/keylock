import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Send, AlertTriangle, Target, Users, Loader, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orgGoalFeedbackApi, peerQueueApi } from '../../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';
 
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';
 
export default function SubmitContextFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem('user') || '{}') || { empId: 1004, name: 'Dave Dev' },
    []
  );
 
  const [activeTab, setActiveTab] = useState('goal');
 
  const [goalForm, setGoalForm] = useState({
    organizationObjectiveId: '',
    objectiveTitle: '',
    rating: 4,
    feedbackComments: '',
    isAnonymous: false
  });
 
  const [contextForm, setContextForm] = useState({
    recipientEmployeeId: '',
    recipientName: '',
    projectContext: '',
    feedbackContent: '',
    isAnonymous: false
  });
 
  const [objectives, setObjectives] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
 
        const objResponse = await fetch(`${API_BASE}/Orgwideobjectives`);
        if (objResponse.ok) {
          const objData = await objResponse.json();
          setObjectives(objData.data || []);
        }
 
        const empResponse = await fetch(`${API_BASE}/EmployeeManagement/all`);
        if (empResponse.ok) {
          const empData = await empResponse.json();
          setEmployees(empData.data || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoadingData(false);
      }
    };
 
    fetchData();
  }, []);
 
  const handleObjectiveChange = (e) => {
    const selectedId = Number(e.target.value);
    const selectedObjective = objectives.find(obj => obj.objectiveId === selectedId);
    setGoalForm({
      ...goalForm,
      organizationObjectiveId: selectedId,
      objectiveTitle: selectedObjective?.title || ''
    });
  };
 
  const submitGoal = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');
 
    if (!goalForm.organizationObjectiveId || !goalForm.feedbackComments?.trim()) {
      setError('Objective and comments are required.');
      return;
    }
 
    setLoading(true);
    try {
      const payload = {
        organizationObjectiveId: Number(goalForm.organizationObjectiveId),
        submittedByEmployeeId: Number(user?.empId),
        managerEmployeeId: null,
        rating: Number(goalForm.rating || 0),
        feedbackComments: goalForm.feedbackComments,
        feedbackFrom: 'Employee',
        isAnonymous: !!goalForm.isAnonymous
      };
 
      await orgGoalFeedbackApi.create(payload);
     
      setSuccessMsg('Goal feedback submitted successfully!');
      setGoalForm({
        organizationObjectiveId: '',
        objectiveTitle: '',
        rating: 4,
        feedbackComments: '',
        isAnonymous: false
      });
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Goal feedback error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to submit goal feedback.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleEmployeeChange = (e) => {
    const selectedId = Number(e.target.value);
    const selectedEmployee = employees.find(emp => emp.employeeId === selectedId);
    setContextForm({
      ...contextForm,
      recipientEmployeeId: selectedId,
      recipientName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''
    });
  };
 
  const submitContext = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');
 
    if (!contextForm.recipientEmployeeId || !contextForm.feedbackContent?.trim() || !contextForm.projectContext?.trim()) {
      setError('Recipient, project context, and feedback are required.');
      return;
    }
 
    setLoading(true);
    try {
      const contextPrefix = contextForm.projectContext ? `[${contextForm.projectContext}] ` : '';
      const peerPayload = {
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(contextForm.recipientEmployeeId),
        feedbackContent: contextPrefix + contextForm.feedbackContent,
        isAnonymous: !!contextForm.isAnonymous
      };
 
      const createResponse = await peerQueueApi.create(peerPayload);
 
      if (createResponse.data?.success) {
        const queueId = createResponse.data?.data?.queueId;
 
        if (!queueId) {
          throw new Error('Queue ID not returned');
        }
 
        const approveResponse = await axios.post(
          `${API_BASE}/PeerFeedbackQueue/${queueId}/approve`,
          null,
          {
            params: {
              isProfessional: true,
              isRelevant: true,
              approvedByHRId: Number(user?.empId)
            },
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
 
        if (approveResponse.data?.success || approveResponse.status === 200) {
          setSuccessMsg(`Context feedback submitted successfully for ${contextForm.recipientName}!`);
        } else {
          setSuccessMsg(`Context feedback submitted to ${contextForm.recipientName}, pending approval.`);
        }
       
        setContextForm({
          recipientEmployeeId: '',
          recipientName: '',
          projectContext: '',
          feedbackContent: '',
          isAnonymous: false
        });
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setError(createResponse.data?.message || 'Failed to submit context feedback');
      }
    } catch (err) {
      console.error('Context feedback error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to submit context feedback.');
    } finally {
      setLoading(false);
    }
  };
 
  const selectedObjective = objectives.find(obj => obj.objectiveId == goalForm.organizationObjectiveId);
  const selectedEmployee = employees.find(emp => emp.employeeId == contextForm.recipientEmployeeId);
 
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          size={20}
          fill={starValue <= rating ? '#ffc107' : 'none'}
          stroke={starValue <= rating ? '#ffc107' : '#cbd5e1'}
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={() => setGoalForm({ ...goalForm, rating: starValue })}
        />
      );
    });
  };
 
  return (
    <div style={{ padding: '1.25rem 1.75rem', maxWidth: '100%', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
     
      {/* BACK BUTTON & HEADER */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn d-flex align-items-center justify-content-center"
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <ArrowLeft size={18} style={{ color: '#64748b' }} />
        </button>
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#27235c', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
            Submit Feedback
          </h2>
          <p className="mb-0" style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Provide goal or context-based feedback
          </p>
        </div>
      </div>
 
      {/* ALERTS */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" style={{ borderRadius: '8px', border: 'none', backgroundColor: '#fee2e2', padding: '0.75rem 1rem', maxWidth: '900px' }}>
          <AlertTriangle size={16} className="flex-shrink-0" style={{ marginTop: '2px', color: '#dc2626' }} />
          <div className="flex-grow-1">
            <p className="mb-0" style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
          </div>
          <button type="button" className="btn-close" style={{ fontSize: '0.75rem' }} onClick={() => setError('')} />
        </div>
      )}
 
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3" style={{ borderRadius: '8px', border: 'none', backgroundColor: '#dcfce7', padding: '0.75rem 1rem', maxWidth: '900px' }}>
          <CheckCircle size={16} className="flex-shrink-0" style={{ color: '#16a34a' }} />
          <p className="mb-0 flex-grow-1" style={{ fontSize: '0.875rem', color: '#166534' }}>{successMsg}</p>
          <button type="button" className="btn-close" style={{ fontSize: '0.75rem' }} onClick={() => setSuccessMsg('')} />
        </div>
      )}
 
      {/* TAB SELECTOR */}
      <div className="d-flex gap-2 mb-3" style={{ maxWidth: '900px' }}>
        <button
          type="button"
          className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          onClick={() => setActiveTab('goal')}
          style={{
            borderRadius: '8px',
            padding: '0.875rem',
            backgroundColor: activeTab === 'goal' ? '#0f62fe' : '#fff',
            color: activeTab === 'goal' ? '#fff' : '#64748b',
            border: activeTab === 'goal' ? 'none' : '1px solid #e2e8f0',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          <Target size={18} />
          Goal Feedback
        </button>
 
        <button
          type="button"
          className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          onClick={() => setActiveTab('context')}
          style={{
            borderRadius: '8px',
            padding: '0.875rem',
            backgroundColor: activeTab === 'context' ? '#0f62fe' : '#fff',
            color: activeTab === 'context' ? '#fff' : '#64748b',
            border: activeTab === 'context' ? 'none' : '1px solid #e2e8f0',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          <Users size={18} />
          Context Feedback
        </button>
      </div>
 
      {/* LOADING STATE */}
      {loadingData && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', maxWidth: '900px' }}>
          <div className="card-body text-center py-5">
            <Loader size={40} className="mb-3 animate-spin" style={{ color: '#0f62fe' }} />
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 0 }}>Loading data...</p>
          </div>
        </div>
      )}
 
      {/* GOAL FORM */}
      {!loadingData && activeTab === 'goal' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', maxWidth: '900px' }}>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={submitGoal}>
             
              {/* SELECT OBJECTIVE */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Select Objective <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={goalForm.organizationObjectiveId}
                  onChange={handleObjectiveChange}
                  required
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.875rem'
                  }}
                >
                  <option value="">Choose an objective...</option>
                  {objectives.map((obj) => (
                    <option key={obj.objectiveId} value={obj.objectiveId}>
                      {obj.title}
                    </option>
                  ))}
                </select>
              </div>
 
              {/* OBJECTIVE DESCRIPTION */}
              {selectedObjective && (
                <div className="mb-4 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Description</div>
                  <p style={{ fontSize: '0.875rem', color: '#0f172a', marginBottom: 0 }}>
                    {selectedObjective.description}
                  </p>
                </div>
              )}
 
              {/* RATING WITH STARS */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Rating <span className="text-danger">*</span>
                </label>
                <div className="d-flex align-items-center gap-3 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="d-flex gap-1">
                    {renderStars(goalForm.rating)}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f62fe' }}>
                    {goalForm.rating}/5
                  </span>
                </div>
              </div>
 
              {/* FEEDBACK COMMENTS */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Feedback Comments <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={goalForm.feedbackComments}
                  onChange={(e) => setGoalForm({ ...goalForm, feedbackComments: e.target.value })}
                  placeholder="Provide your detailed feedback on this objective..."
                  required
                  maxLength={1000}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                />
                <div className="d-flex justify-content-between" style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Be specific and constructive</span>
                  <span style={{ fontSize: '0.75rem', color: goalForm.feedbackComments.length > 900 ? '#dc2626' : '#64748b' }}>
                    {goalForm.feedbackComments.length}/1000
                  </span>
                </div>
              </div>
 
              {/* ANONYMOUS */}
              <div className="mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="goalAnon"
                    checked={goalForm.isAnonymous}
                    onChange={(e) => setGoalForm({ ...goalForm, isAnonymous: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="goalAnon" style={{ fontSize: '0.875rem' }}>
                    Submit anonymously
                  </label>
                </div>
              </div>
 
              {/* SUBMIT */}
              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={loading || !goalForm.organizationObjectiveId}
                style={{
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: '#0f62fe',
                  border: 'none'
                }}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
 
      {/* CONTEXT FORM */}
      {!loadingData && activeTab === 'context' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', maxWidth: '900px' }}>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={submitContext}>
             
              {/* SELECT RECIPIENT */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Select Recipient <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={contextForm.recipientEmployeeId}
                  onChange={handleEmployeeChange}
                  required
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.875rem'
                  }}
                >
                  <option value="">Choose a team member...</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
 
              {/* SELECTED EMPLOYEE INFO */}
              {selectedEmployee && (
                <div className="mb-4 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Feedback for</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </div>
                  <small style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedEmployee.email}</small>
                </div>
              )}
 
              {/* PROJECT CONTEXT */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Project Context <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={contextForm.projectContext}
                  onChange={(e) => setContextForm({ ...contextForm, projectContext: e.target.value })}
                  placeholder="e.g., AI Platform Project, Q4 Sprint"
                  required
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.875rem'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Specify the project or context
                </div>
              </div>
 
              {/* FEEDBACK CONTENT */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  Feedback Content <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={contextForm.feedbackContent}
                  onChange={(e) => setContextForm({ ...contextForm, feedbackContent: e.target.value })}
                  placeholder="Provide constructive feedback on their work, collaboration, or skills..."
                  required
                  maxLength={1000}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '120px'
                  }}
                />
                <div className="d-flex justify-content-between" style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Be specific and constructive</span>
                  <span style={{ fontSize: '0.75rem', color: contextForm.feedbackContent.length > 900 ? '#dc2626' : '#64748b' }}>
                    {contextForm.feedbackContent.length}/1000
                  </span>
                </div>
              </div>
 
              {/* ANONYMOUS */}
              <div className="mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="contextAnon"
                    checked={contextForm.isAnonymous}
                    onChange={(e) => setContextForm({ ...contextForm, isAnonymous: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="contextAnon" style={{ fontSize: '0.875rem' }}>
                    Submit anonymously
                  </label>
                </div>
              </div>
 
              {/* SUBMIT */}
              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={loading || !contextForm.recipientEmployeeId || !contextForm.projectContext}
                style={{
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: '#0f62fe',
                  border: 'none'
                }}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
 
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .form-control:focus, .form-select:focus {
          border-color: #0f62fe;
          box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.1);
        }
      `}</style>
    </div>
  );
}
 
 