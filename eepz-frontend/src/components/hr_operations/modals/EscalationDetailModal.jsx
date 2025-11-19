import { Modal, Badge, CloseButton } from "react-bootstrap";

const EscalationDetailModal = ({ 
  show, 
  onHide, 
  escalation,
  getSeverityBadge,
  getStatusBadge 
}) => {
  if (!escalation) return null;

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      {show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(39, 35, 92, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1040,
            transition: 'all 0.3s ease'
          }}
          onClick={onHide}
        />
      )}

      <Modal 
        show={show} 
        onHide={onHide} 
        size="lg" 
        centered
        backdrop={false}
        style={{ zIndex: 1050 }}
      >
        <div style={{
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: 'none'
        }}>
          {/* HEADER with White Close Button */}
          <div 
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div 
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#ffffff'
              }}
            >
              SLA Escalation Details
            </div>
            <CloseButton 
              onClick={onHide}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1
              }}
            />
          </div>
          
          {/* BODY */}
          <Modal.Body 
            style={{ 
              padding: '24px', 
              background: '#ffffff',
              border: 'none',
              maxHeight: 'calc(90vh - 140px)',
              overflowY: 'auto'
            }}
          >
            {/* Detail Grid */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                fontSize: '14px'
              }}
            >
              {/* Employee Name */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Employee Name:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.employeeName || "N/A"}
                </span>
              </div>

              {/* Employee ID */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Employee ID:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.employeeUserId}
                </span>
              </div>

              {/* Email */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Email:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.employeeEmail || "N/A"}
                </span>
              </div>

              {/* SLA Type */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  SLA Type:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.slaType || "N/A"}
                </span>
              </div>

              {/* Escalation Level */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Escalation Level:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.escalationLevel}
                </span>
              </div>

              {/* Severity */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Severity:
                </label>
                <div>
                  <Badge 
                    bg={getSeverityBadge(escalation.severity)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      fontWeight: '500'
                    }}
                  >
                    {escalation.severity}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Status:
                </label>
                <div>
                  <Badge 
                    bg={getStatusBadge(escalation.escalationStatus)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      fontWeight: '500'
                    }}
                  >
                    {escalation.escalationStatus}
                  </Badge>
                </div>
              </div>

              {/* Days Overdue */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Days Overdue:
                </label>
                <span 
                  style={{ 
                    color: '#dc2626', 
                    fontWeight: '700',
                    fontSize: '15px'
                  }}
                >
                  {escalation.daysOverdue} days
                </span>
              </div>

              {/* SLA Deadline */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  SLA Deadline:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {new Date(escalation.slaDeadline).toLocaleDateString()}
                </span>
              </div>

              {/* Escalated To */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Escalated To:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.escalatedToName || "N/A"}
                </span>
              </div>

              {/* Escalated At */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Escalated At:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {new Date(escalation.submittedAt).toLocaleString()}
                </span>
              </div>

              {/* Submitted By */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Submitted By:
                </label>
                <span style={{ color: '#1e293b' }}>
                  {escalation.submittedByName || "N/A"}
                </span>
              </div>

              {/* Reason - Full Width */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  gridColumn: '1 / -1'
                }}
              >
                <label 
                  style={{
                    fontWeight: '600',
                    color: '#475569',
                    fontSize: '13px'
                  }}
                >
                  Reason:
                </label>
                <p 
                  style={{ 
                    margin: 0,
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    lineHeight: '1.6',
                    fontSize: '13px'
                  }}
                >
                  {escalation.reason}
                </p>
              </div>

              {/* Description - Full Width (Conditional) */}
              {escalation.description && (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    gridColumn: '1 / -1'
                  }}
                >
                  <label 
                    style={{
                      fontWeight: '600',
                      color: '#475569',
                      fontSize: '13px'
                    }}
                  >
                    Description:
                  </label>
                  <p 
                    style={{ 
                      margin: 0,
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      lineHeight: '1.6',
                      fontSize: '13px'
                    }}
                  >
                    {escalation.description}
                  </p>
                </div>
              )}

              {/* Resolution Details (Conditional) */}
              {escalation.resolvedAt && (
                <>
                  {/* Resolved At */}
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <label 
                      style={{
                        fontWeight: '600',
                        color: '#475569',
                        fontSize: '13px'
                      }}
                    >
                      Resolved At:
                    </label>
                    <span style={{ color: '#1e293b' }}>
                      {new Date(escalation.resolvedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Resolved By */}
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <label 
                      style={{
                        fontWeight: '600',
                        color: '#475569',
                        fontSize: '13px'
                      }}
                    >
                      Resolved By:
                    </label>
                    <span style={{ color: '#1e293b' }}>
                      {escalation.resolvedByName || "N/A"}
                    </span>
                  </div>

                  {/* Resolution Comments (Conditional) */}
                  {escalation.resolutionComments && (
                    <div 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        gridColumn: '1 / -1'
                      }}
                    >
                      <label 
                        style={{
                          fontWeight: '600',
                          color: '#475569',
                          fontSize: '13px'
                        }}
                      >
                        Resolution Comments:
                      </label>
                      <p 
                        style={{ 
                          margin: 0,
                          padding: '12px',
                          backgroundColor: '#f0fdf4',
                          borderRadius: '6px',
                          border: '1px solid #86efac',
                          color: '#166534',
                          lineHeight: '1.6',
                          fontSize: '13px'
                        }}
                      >
                        {escalation.resolutionComments}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Modal.Body>
        </div>
      </Modal>
    </>
  );
};

export default EscalationDetailModal;
