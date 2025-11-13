import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Send, AlertTriangle, Target, Users, Loader } from 'lucide-react';
import { orgGoalFeedbackApi, peerQueueApi } from '../../../services/feedbackmanagement/feedbackApi';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5333/api';

export default function SubmitContextFeedback() {
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

      console.log('📤 Submitting goal feedback:', payload);

      await orgGoalFeedbackApi.create(payload);
      
      setSuccessMsg('✅ Goal feedback submitted successfully!');
      setGoalForm({
        organizationObjectiveId: '',
        objectiveTitle: '',
        rating: 4,
        feedbackComments: '',
        isAnonymous: false
      });
    } catch (err) {
      console.error('❌ Goal feedback error:', err);
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
      // STEP 1: Create peer feedback with context
      const contextPrefix = contextForm.projectContext ? `[${contextForm.projectContext}] ` : '';
      const peerPayload = {
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(contextForm.recipientEmployeeId),
        feedbackContent: contextPrefix + contextForm.feedbackContent,
        isAnonymous: !!contextForm.isAnonymous
      };

      console.log('📤 Step 1: Creating context feedback:', peerPayload);

      const createResponse = await peerQueueApi.create(peerPayload);

      console.log('✅ Step 1 Complete - Context feedback created:', createResponse.data);

      if (createResponse.data?.success) {
        const queueId = createResponse.data?.data?.queueId;

        if (!queueId) {
          throw new Error('Queue ID not returned from create endpoint');
        }

        console.log(`📤 Step 2: Auto-approving context feedback with queueId ${queueId}`);

        // STEP 2: Auto-approve the context feedback
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

        console.log('✅ Step 2 Complete - Context feedback approved:', approveResponse.data);

        if (approveResponse.data?.success || approveResponse.status === 200) {
          setSuccessMsg(`✅ Context feedback submitted and approved successfully for ${contextForm.recipientName}!`);
          setContextForm({
            recipientEmployeeId: '',
            recipientName: '',
            projectContext: '',
            feedbackContent: '',
            isAnonymous: false
          });
        } else {
          setSuccessMsg(`⚠️ Context feedback submitted to ${contextForm.recipientName}, but auto-approval failed. HR will review it.`);
          setContextForm({
            recipientEmployeeId: '',
            recipientName: '',
            projectContext: '',
            feedbackContent: '',
            isAnonymous: false
          });
        }
      } else {
        setError(createResponse.data?.message || 'Failed to submit context feedback');
      }
    } catch (err) {
      console.error('❌ Context feedback error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to submit context feedback.');
    } finally {
      setLoading(false);
    }
  };

  const selectedObjective = objectives.find(obj => obj.objectiveId == goalForm.organizationObjectiveId);
  const selectedEmployee = employees.find(emp => emp.employeeId == contextForm.recipientEmployeeId);

  const RATING_LABELS = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <div className="d-flex justify-content-center py-4" style={{ minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '600px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: 'var(--color-primary-1)' }}>
            Submit Feedback
          </h2>
          <p className="text-muted small mb-0">
            Select feedback type and submit your response
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button className="btn-close" onClick={() => setError('')} aria-label="Close" />
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2 mb-3" style={{ borderRadius: 'var(--radius-md)' }}>
            <CheckCircle size={18} className="flex-shrink-0" />
            <div className="small flex-grow-1">{successMsg}</div>
            <button className="btn-close" onClick={() => setSuccessMsg('')} aria-label="Close" />
          </div>
        )}

        {/* Tab Selector */}
        <div className="row g-2 mb-4">
          <div className="col-6">
            <button
              type="button"
              className="btn w-100 d-flex flex-column align-items-center justify-content-center"
              onClick={() => setActiveTab('goal')}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: activeTab === 'goal' ? 'var(--color-primary-1)' : '#f5f5f5',
                color: activeTab === 'goal' ? 'white' : '#333',
                border: 'none',
                fontWeight: activeTab === 'goal' ? '600' : '400',
                transition: 'all 0.2s',
                cursor: 'pointer',
                height: '80px'
              }}
            >
              <Target size={20} className="mb-2" />
              <span style={{ fontSize: '0.9rem' }}>Goal Feedback</span>
            </button>
          </div>

          <div className="col-6">
            <button
              type="button"
              className="btn w-100 d-flex flex-column align-items-center justify-content-center"
              onClick={() => setActiveTab('context')}
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: activeTab === 'context' ? 'var(--color-primary-1)' : '#f5f5f5',
                color: activeTab === 'context' ? 'white' : '#333',
                border: 'none',
                fontWeight: activeTab === 'context' ? '600' : '400',
                transition: 'all 0.2s',
                cursor: 'pointer',
                height: '80px'
              }}
            >
              <Users size={20} className="mb-2" />
              <span style={{ fontSize: '0.9rem' }}>Context Feedback</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="card-body text-center py-5">
              <Loader size={40} className="text-primary mb-3" style={{ animation: 'spin 1s linear infinite' }} />
              <p className="small text-muted">Loading data...</p>
            </div>
          </div>
        )}

        {/* Goal Form */}
        {!loadingData && activeTab === 'goal' && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: 'var(--color-primary-1)' }}>Goal Feedback Form</h5>
              <form onSubmit={submitGoal} className="row g-3">
                {/* Objective Dropdown */}
                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Select Objective <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={goalForm.organizationObjectiveId}
                    onChange={handleObjectiveChange}
                    required
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">-- Choose an objective --</option>
                    {objectives.map((obj) => (
                      <option key={obj.objectiveId} value={obj.objectiveId}>
                        {obj.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Objective Description */}
                {selectedObjective && (
                  <div className="col-12">
                    <div className="alert alert-info small mb-0" style={{ borderRadius: 'var(--radius-md)' }}>
                      <strong>Description:</strong>
                      <p className="mb-0 mt-2">{selectedObjective.description}</p>
                    </div>
                  </div>
                )}

                {/* Rating - Button Group */}
                <div className="col-12">
                  <label className="form-label small fw-bold mb-2">
                    Rating <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        className={`btn flex-grow-1 ${goalForm.rating === rating ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setGoalForm({ ...goalForm, rating })}
                        style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem 0.5rem' }}
                      >
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                          <div className="fw-bold mb-1">{rating}</div>
                          <div style={{ fontSize: '0.7rem' }}>{RATING_LABELS[rating]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Feedback Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={goalForm.feedbackComments}
                    onChange={(e) => setGoalForm({ ...goalForm, feedbackComments: e.target.value })}
                    placeholder="Provide your detailed feedback..."
                    required
                    maxLength={1000}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                  <small className="text-muted">{goalForm.feedbackComments.length} / 1000</small>
                </div>

                {/* Anonymous */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="goalAnon"
                      checked={goalForm.isAnonymous}
                      onChange={(e) => setGoalForm({ ...goalForm, isAnonymous: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="goalAnon">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading || !goalForm.organizationObjectiveId}
                    style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem' }}
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="me-2" style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="me-2" style={{ display: 'inline' }} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Context Feedback Form */}
        {!loadingData && activeTab === 'context' && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: 'var(--color-primary-1)' }}>Context Feedback Form</h5>
              <p className="small text-muted mb-3">Provide peer feedback linked to a specific project or context</p>
              <form onSubmit={submitContext} className="row g-3">
                {/* Employee Dropdown */}
                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Select Recipient <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={contextForm.recipientEmployeeId}
                    onChange={handleEmployeeChange}
                    required
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">-- Choose a team member --</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                  <div className="col-12">
                    <div className="alert alert-info small mb-0" style={{ borderRadius: 'var(--radius-md)' }}>
                      <strong>Feedback for:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}
                      <br />
                      <small className="text-muted">{selectedEmployee.email}</small>
                    </div>
                  </div>
                )}

                {/* Project Context */}
                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Project Context <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={contextForm.projectContext}
                    onChange={(e) => setContextForm({ ...contextForm, projectContext: e.target.value })}
                    placeholder="e.g., AI Platform Project, Q4 Sprint"
                    required
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                  <small className="text-muted">Specify the project or context for this feedback</small>
                </div>

                {/* Feedback Content */}
                <div className="col-12">
                  <label className="form-label small fw-bold">
                    Feedback Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={contextForm.feedbackContent}
                    onChange={(e) => setContextForm({ ...contextForm, feedbackContent: e.target.value })}
                    placeholder="Provide constructive feedback on their work, collaboration, or skills in this project..."
                    required
                    maxLength={1000}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                  <small className="text-muted">{contextForm.feedbackContent.length} / 1000</small>
                </div>

                {/* Anonymous */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="contextAnon"
                      checked={contextForm.isAnonymous}
                      onChange={(e) => setContextForm({ ...contextForm, isAnonymous: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="contextAnon">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading || !contextForm.recipientEmployeeId || !contextForm.projectContext}
                    style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem' }}
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="me-2" style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
                        Submitting & Approving...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="me-2" style={{ display: 'inline' }} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
