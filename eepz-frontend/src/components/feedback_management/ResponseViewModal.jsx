import React, { useState, useEffect } from 'react';
import { User, Clock, Lock, Target, Star, MessageSquare, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5253/api';

const QUESTION_TEMPLATES = {
  'PerformanceReview': [
    { id: 1, text: 'Quality of work delivered' },
    { id: 2, text: 'Meeting deadlines and commitments' },
    { id: 3, text: 'Technical skills and expertise' },
    { id: 4, text: 'Problem-solving and critical thinking' },
    { id: 5, text: 'Communication with team members' },
    { id: 6, text: 'Collaboration and teamwork' },
    { id: 7, text: 'Initiative and proactiveness' },
    { id: 8, text: 'Adaptability to change' },
    { id: 9, text: 'Leadership and mentoring (if applicable)' },
    { id: 10, text: 'Overall contribution to the team' }
  ],
  'GeneralFeedback': [
    { id: 1, text: 'How would you rate overall performance?' },
    { id: 2, text: 'Communication effectiveness' },
    { id: 3, text: 'Teamwork and collaboration' },
    { id: 4, text: 'Work quality and attention to detail' },
    { id: 5, text: 'Reliability and dependability' }
  ],
  'BiasReview': [
    { id: 1, text: 'Treats all team members fairly regardless of background' },
    { id: 2, text: 'Makes decisions based on merit, not personal preferences' },
    { id: 3, text: 'Respects diverse perspectives and opinions' },
    { id: 4, text: 'Provides equal opportunities to all team members' },
    { id: 5, text: 'Avoids stereotyping or making assumptions' },
    { id: 6, text: 'Handles conflicts impartially' },
    { id: 7, text: 'Creates an inclusive work environment' }
  ],
  'ProfessionalismReview': [
    { id: 1, text: 'Maintains professional conduct at all times' },
    { id: 2, text: 'Respects workplace policies and guidelines' },
    { id: 3, text: 'Communicates professionally with colleagues' },
    { id: 4, text: 'Handles confidential information appropriately' },
    { id: 5, text: 'Demonstrates punctuality and attendance' },
    { id: 6, text: 'Maintains appropriate workplace boundaries' },
    { id: 7, text: 'Represents the organization positively' },
    { id: 8, text: 'Takes accountability for actions and decisions' }
  ],
  'SurveyForm': [
    { id: 1, text: 'Job satisfaction level' },
    { id: 2, text: 'Work-life balance' },
    { id: 3, text: 'Team collaboration quality' },
    { id: 4, text: 'Management support' },
    { id: 5, text: 'Career growth opportunities' },
    { id: 6, text: 'Work environment and culture' },
    { id: 7, text: 'Resources and tools provided' }
  ],
  'EvaluationForm': [
    { id: 1, text: 'Meets job expectations and requirements' },
    { id: 2, text: 'Demonstrates required competencies' },
    { id: 3, text: 'Shows continuous improvement' },
    { id: 4, text: 'Achieves set goals and objectives' },
    { id: 5, text: 'Contributes to team success' },
    { id: 6, text: 'Professional development and learning' }
  ]
};

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const getRatingColor = (rating) => {
  const num = Number(rating);
  if (num === 5) return '#24A148';
  if (num === 4) return '#0F62FE';
  if (num === 3) return '#E2B93B';
  if (num === 2) return '#E89E14';
  if (num === 1) return '#E01950';
  return '#525252';
};

const ResponseViewModal = ({ show, response, onClose, type }) => {
  const [formDetails, setFormDetails] = useState(null);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);

  useEffect(() => {
    if (show && type === 'HR' && response?.formId && !formDetails) {
      const fetchFormDetails = async () => {
        setLoadingFormDetails(true);
        try {
          const res = await axios.get(`${API_BASE}/HrFeedbackForm/forms/${response.formId}`);
          if (res?.data?.success && res?.data?.data) {
            setFormDetails(res.data.data);
          }
        } catch (err) {
          console.warn('Could not fetch form details');
        } finally {
          setLoadingFormDetails(false);
        }
      };
      fetchFormDetails();
    }
  }, [show, type, response?.formId, formDetails]);

  const getQuestionText = (qId) => {
    const formType = formDetails?.formType || response?.formType || 'GeneralFeedback';
    const questions = QUESTION_TEMPLATES[formType] || [];
    const q = questions.find(x => x.id === Number(qId));
    return q ? q.text : `Question ${qId}`;
  };

  const parseHRResponses = () => {
    if (!response?.formResponse || typeof response.formResponse !== 'object') return [];
    
    const items = [];
    Object.keys(response.formResponse).forEach(key => {
      if (key.startsWith('question_')) {
        const qNum = key.replace('question_', '');
        items.push({
          qId: qNum,
          rating: response.formResponse[key],
          text: getQuestionText(qNum)
        });
      }
    });
    
    return items.sort((a, b) => Number(a.qId) - Number(b.qId));
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (!show || !response) return null;

  const hrResponses = type === 'HR' ? parseHRResponses() : [];
  const userComments = response.formResponse?.comments || null;

  return (
    <div 
      className="modal d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'block' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-lg modal-dialog-scrollable" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: 'var(--color-primary-1)' }}>
              {type === 'HR' && 'HR Form Response'}
              {type === 'Mentor' && 'Mentor Feedback'}
              {type === 'Peer' && 'Peer Feedback'}
              {type === 'Goal' && 'Goal Feedback Details'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            {/* HR FORM */}
            {type === 'HR' && (
              <>
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <h6 className="fw-bold mb-3">Form Information</h6>
                  <div className="row g-3 small">
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Form Name</div>
                      <div className="fw-bold">{response.formName || 'N/A'}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Status</div>
                      <span className={`badge ${response.status === 'Reviewed' ? 'bg-success' : response.status === 'Submitted' ? 'bg-primary' : 'bg-warning'}`}>
                        {response.status || 'Draft'}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Form Type</div>
                      <div className="fw-bold">{formDetails?.formType || 'Loading...'}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Submitted</div>
                      <div className="fw-bold">{formatDate(response.submittedAt)}</div>
                    </div>
                  </div>
                </div>

                {hrResponses.length > 0 && (
                  <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <h6 className="fw-bold mb-3">Your Ratings ({hrResponses.length} questions)</h6>
                    {hrResponses.map((item, idx) => (
                      <div key={idx} className="p-3 mb-2" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: `4px solid ${getRatingColor(item.rating)}` }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <small className="text-muted">Question {item.qId}</small>
                            <p className="mb-0 small fw-bold">{item.text}</p>
                          </div>
                          <span className="badge" style={{ backgroundColor: `${getRatingColor(item.rating)}20`, color: getRatingColor(item.rating) }}>
                            {item.rating}
                          </span>
                        </div>
                        <small className="text-muted">Rating: {RATING_LABELS[item.rating] || 'N/A'}</small>
                      </div>
                    ))}
                  </div>
                )}

                {userComments && (
                  <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <h6 className="fw-bold mb-2">Your Comments</h6>
                    <div className="p-3" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      <p className="mb-0 small">{userComments}</p>
                    </div>
                  </div>
                )}

                {response.status === 'Reviewed' && response.hrReviewComments && (
                  <div>
                    <h6 className="fw-bold mb-2">HR Review</h6>
                    <div className="p-3" style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', borderLeft: '4px solid #0F62FE' }}>
                      <p className="mb-0 small">{response.hrReviewComments}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MENTOR FEEDBACK */}
            {type === 'Mentor' && (
              <>
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <h6 className="fw-bold mb-3">Mentor Information</h6>
                  <div className="row g-3 small">
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Mentor Name</div>
                      <div className="fw-bold">
                        <User size={14} className="me-1" style={{ display: 'inline' }} />
                        {response.mentorNameFull || response.mentorName || 'N/A'}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Rating</div>
                      <span className="badge bg-success text-white">{response.rating || 0} / 5</span>
                    </div>
                    <div className="col-12">
                      <div className="text-muted mb-1">Submitted</div>
                      <div className="fw-bold">{formatDate(response.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {response.rating && (
                  <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <h6 className="fw-bold mb-2">Rating Details</h6>
                    <div className="p-3" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: `4px solid ${getRatingColor(response.rating)}` }}>
                      <div className="h5 mb-0" style={{ color: getRatingColor(response.rating) }}>
                        {response.rating} / 5 - {RATING_LABELS[response.rating]}
                      </div>
                    </div>
                  </div>
                )}

                {response.feedbackComments && (
                  <div>
                    <h6 className="fw-bold mb-2">Your Feedback</h6>
                    <div className="p-3" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      <p className="mb-0 small">{response.feedbackComments}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PEER FEEDBACK */}
            {type === 'Peer' && (
              <>
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <h6 className="fw-bold mb-3">Feedback Details</h6>
                  <div className="row g-3 small">
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Recipient</div>
                      <div className="fw-bold">
                        <User size={14} className="me-1" style={{ display: 'inline' }} />
                        {response.recipientNameFull || response.recipientName || 'N/A'}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Status</div>
                      <span className={`badge ${response.status === 'Approved' ? 'bg-success' : response.status === 'Rejected' ? 'bg-danger' : 'bg-warning'}`}>
                        {response.status || 'Pending'}
                      </span>
                    </div>
                    <div className="col-12">
                      <div className="text-muted mb-1">Submitted</div>
                      <div className="fw-bold">{formatDate(response.createdAt)}</div>
                    </div>
                    {response.isAnonymous && (
                      <div className="col-12">
                        <div className="text-muted mb-1">Type</div>
                        <div className="fw-bold">
                          <Lock size={14} className="me-1" style={{ display: 'inline' }} />
                          Anonymous
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {response.feedbackContent && (
                  <div>
                    <h6 className="fw-bold mb-2">Your Feedback</h6>
                    <div className="p-3" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      <p className="mb-0 small">{response.feedbackContent}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* GOAL FEEDBACK */}
            {type === 'Goal' && (
              <>
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Target size={18} style={{ color: '#0F62FE' }} />
                    Goal Information
                  </h6>
                  <div className="row g-3 small">
                    <div className="col-12">
                      <div className="text-muted mb-1">Objective</div>
                      <div className="fw-bold">
                        {response.objectiveTitle || response.organizationGoalName || `Objective #${response.organizationObjectiveId}`}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Rating</div>
                      <div className="d-flex align-items-center gap-2">
                        <Star size={16} style={{ color: '#FFB800', fill: '#FFB800' }} />
                        <span className="fw-bold">{response.rating}/5</span>
                        <span className="badge" style={{ backgroundColor: `${getRatingColor(response.rating)}20`, color: getRatingColor(response.rating) }}>
                          {RATING_LABELS[response.rating]}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Feedback From</div>
                      <span className={`badge ${response.feedbackFrom === 'Manager' ? 'bg-success' : 'bg-primary'}`}>
                        {response.feedbackFrom || 'Employee'}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Status</div>
                      <span className={`badge ${
                        response.status === 'Approved' ? 'bg-success' : 
                        response.status === 'Rejected' ? 'bg-danger' : 
                        'bg-info'
                      }`}>
                        {response.status || 'Submitted'}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted mb-1">Submitted</div>
                      <div className="fw-bold d-flex align-items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(response.createdAt)}
                      </div>
                    </div>
                    {response.submitterName && (
                      <div className="col-md-6">
                        <div className="text-muted mb-1">Submitted By</div>
                        <div className="fw-bold d-flex align-items-center gap-1">
                          <User size={14} />
                          {response.submitterName}
                        </div>
                      </div>
                    )}
                    {response.isAnonymous && (
                      <div className="col-md-6">
                        <div className="text-muted mb-1">Type</div>
                        <div className="fw-bold d-flex align-items-center gap-1">
                          <Lock size={14} />
                          Anonymous
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {response.feedbackComments && (
                  <div>
                    <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                      <MessageSquare size={16} style={{ color: '#0F62FE' }} />
                      Feedback Comments
                    </h6>
                    <div className="p-3" style={{ backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: '4px solid #0F62FE' }}>
                      <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{response.feedbackComments}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewModal;
