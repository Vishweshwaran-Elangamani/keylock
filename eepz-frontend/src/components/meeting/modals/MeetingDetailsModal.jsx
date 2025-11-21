// src/components/Meeting/MeetingDetailsModal.jsx
import React, { useState } from 'react';
import CreateMomModal from './CreateMomModal';

const MeetingDetailsModal = ({ meeting, onClose, employeeMap }) => {
  const [showCreateMom, setShowCreateMom] = useState(false);
  
  const toggleCreateMom = () => setShowCreateMom(!showCreateMom);

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          {/* ✅ UPDATED: Dark purple header with white text */}
          <div 
            className="modal-header border-0" 
            style={{ 
              backgroundColor: '#3C3668',
              padding: '1.5rem',
              textAlign: 'left'
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <h5 className="modal-title fw-bold mb-2" style={{ color: 'white', fontSize: '1.25rem', textAlign: 'left' }}>
                {meeting.meetingTitle}
              </h5>
              <span className="badge bg-light text-primary" style={{ fontSize: '0.85rem' }}>
                {meeting.meetingType}
              </span>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          {/* ✅ UPDATED: Left-aligned body content */}
          <div className="modal-body" style={{ padding: '2rem', textAlign: 'left' }}>
            {/* Date & Time and Attendees Row */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-calendar3 text-primary"></i>
                    <small className="text-muted fw-semibold">Date & Time</small>
                  </div>
                  <span className="d-block fw-medium" style={{ textAlign: 'left' }}>
                    {new Date(meeting.meetingDate).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-people text-success"></i>
                    <small className="text-muted fw-semibold">Attendees</small>
                  </div>
                  <span className="d-block fw-medium" style={{ textAlign: 'left' }}>
                    {meeting.attendees || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Meeting Link Section */}
            {meeting.meetingLink && (
              <div className="mb-4">
                <div className="p-3 rounded" style={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb', textAlign: 'left' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-link-45deg text-primary"></i>
                    <small className="text-muted fw-semibold">Meeting Link</small>
                  </div>
                  <a 
                    href={meeting.meetingLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary text-decoration-none d-flex align-items-center gap-2 fw-medium"
                    style={{ textAlign: 'left' }}
                  >
                    Join Meeting <i className="bi bi-box-arrow-up-right small"></i>
                  </a>
                </div>
              </div>
            )}

            {/* Comments & Observations Section */}
            {meeting.commentsObservations && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ textAlign: 'left' }}>
                  <i className="bi bi-chat-left-text text-info"></i>
                  Comments & Observations
                </h6>
                <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #17a2b8', textAlign: 'left' }}>
                  <p className="mb-0" style={{ textAlign: 'left' }}>{meeting.commentsObservations}</p>
                </div>
              </div>
            )}

            {/* Discussion Points Section */}
            {meeting.discussionPoints && meeting.discussionPoints.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ textAlign: 'left' }}>
                  <i className="bi bi-chat-dots text-warning"></i>
                  Discussion Points
                  <span className="badge bg-light text-dark">{meeting.discussionPoints.length}</span>
                </h6>
                <div className="d-flex flex-column gap-2">
                  {meeting.discussionPoints.map((dp, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded d-flex align-items-start gap-3" 
                      style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}
                    >
                      <span 
                        className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: '28px', height: '28px', flexShrink: 0, fontSize: '0.8rem' }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-grow-1" style={{ textAlign: 'left' }}>{dp.pointText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items Section */}
            {meeting.actionItems && meeting.actionItems.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ textAlign: 'left' }}>
                  <i className="bi bi-check2-square text-success"></i>
                  Action Items
                  <span className="badge bg-light text-dark">{meeting.actionItems.length}</span>
                </h6>
                <div className="d-flex flex-column gap-3">
                  {meeting.actionItems.map((ai, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded" 
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', textAlign: 'left' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="fw-semibold mb-0 flex-grow-1 pe-2" style={{ textAlign: 'left' }}>
                          {ai.taskDescription}
                        </h6>
                        <span className={`badge ${ai.status === 'Pending' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {ai.status}
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-3 text-muted small" style={{ textAlign: 'left' }}>
                        <span className="d-flex align-items-center gap-2">
                          <i className="bi bi-person-circle text-primary"></i>
                          <span>
                            <strong>Assigned to:</strong>{' '}
                            <span className="text-primary fw-medium">
                              {employeeMap[ai.assignedToEmployeeId] || `Employee ${ai.assignedToEmployeeId}`}
                            </span>
                          </span>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <i className="bi bi-calendar-event text-danger"></i>
                          <span>
                            <strong>Due:</strong> {new Date(ai.dueDate).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create MOM Button */}
            <button 
              className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm" 
              onClick={toggleCreateMom}
              style={{ 
                transition: 'all 0.2s',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <i className={`bi ${showCreateMom ? 'bi-x-circle' : 'bi-plus-circle'}`}></i>
              {showCreateMom ? 'Cancel MOM Creation' : 'Create MOM for this Meeting'}
            </button>

            {/* Conditional Create MOM Modal */}
            {showCreateMom && <CreateMomModal meetingData={meeting} onClose={toggleCreateMom} />}
          </div>

          {/* ✅ UPDATED: Footer with consistent styling */}
          <div 
            className="modal-footer border-0" 
            style={{ 
              padding: '1rem 2rem', 
              backgroundColor: '#f8f9fa'
            }}
          >
            <button 
              className="btn btn-secondary px-4" 
              onClick={onClose}
              style={{ 
                borderRadius: '8px',
                padding: '0.5rem 1.5rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;
