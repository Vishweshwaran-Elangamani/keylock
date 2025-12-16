import React, { useState, useEffect } from 'react';

const MomDetailsView = ({ mom, onClose }) => {
  return (
    <div 
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-0" style={{ padding: '1.5rem 1.5rem 1rem' }}>
            <div>
              <h5 className="modal-title fw-bold mb-2">{mom.meetingTitle}</h5>
              <span className="badge bg-primary-subtle text-primary">{mom.meetingType}</span>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '1rem 1.5rem' }}>
            <div className="card bg-light border-0 mb-4">
              <div className="card-body p-3">
                <h6 className="fw-semibold mb-3 text-muted small">MEETING INFORMATION</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">Meeting Date:</small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i className="bi bi-calendar3 text-primary"></i>
                      {new Date(mom.meetingDate).toLocaleString()}
                    </div>
                  </div>
                  {mom.meetingLink && (
                    <div className="col-md-6">
                      <small className="text-muted d-block mb-1">Meeting Link:</small>
                      <a
                        href={mom.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary fw-semibold d-flex align-items-center gap-2"
                      >
                        <i className="bi bi-link-45deg"></i>
                        Join Meeting
                        <i className="bi bi-box-arrow-up-right small"></i>
                      </a>
                    </div>
                  )}
                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">Attendees:</small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i className="bi bi-people text-success"></i>
                      {mom.attendees || 'N/A'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block mb-1">Submitted by:</small>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle text-info"></i>
                      {mom.submittedByEmployeeName} ({mom.submittedByRole})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {mom.commentsObservations && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-chat-left-text text-info"></i>
                  Comments & Observations
                </h6>
                <div className="alert alert-secondary mb-0">{mom.commentsObservations}</div>
              </div>
            )}

            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots text-warning"></i>
                Discussion Points
                {mom.discussionPoints?.length > 0 && (
                  <span className="badge bg-light text-dark">{mom.discussionPoints.length}</span>
                )}
              </h6>
              {mom.discussionPoints?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {mom.discussionPoints.map((dp, index) => (
                    <div key={index} className="p-3 rounded d-flex align-items-start gap-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <span
                        className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: '28px', height: '28px', flexShrink: 0, fontSize: '0.8rem' }}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-grow-1">{dp.pointText}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">No discussion points recorded</div>
              )}
            </div>

            <div className="mb-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-check2-square text-success"></i>
                Action Items
                {mom.actionItems?.length > 0 && (
                  <span className="badge bg-light text-dark">{mom.actionItems.length}</span>
                )}
              </h6>
              {mom.actionItems?.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {mom.actionItems.map((ai, index) => (
                    <div key={index} className="p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="fw-semibold mb-0">{ai.taskDescription}</h6>
                        <span className={`badge ${ai.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {ai.status}
                        </span>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-primary"></i>
                            <strong>Assigned to:</strong> {ai.assignedToEmployeeName || 'N/A'}
                          </small>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-flex align-items-center gap-2">
                            <i className="bi bi-calendar-event text-danger"></i>
                            <strong>Due Date:</strong> {ai.dueDate ? new Date(ai.dueDate).toLocaleDateString() : 'N/A'}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mb-0">No action items recorded</div>
              )}
            </div>
          </div>
          <div className="modal-footer border-0" style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <button className="btn btn-secondary px-4" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MomDetailsView;
