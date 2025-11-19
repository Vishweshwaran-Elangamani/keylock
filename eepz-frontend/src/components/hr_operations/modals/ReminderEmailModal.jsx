import { Modal, Button, CloseButton, Spinner } from "react-bootstrap";

const ReminderEmailModal = ({
  show,
  onHide,
  reminderTargetUser,
  reminderResult,
  sendingReminder,
  onSendReminder,
}) => {
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
              Send Career Goals Reminder
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
              minHeight: '120px'
            }}
          >
            <p 
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: '1.6',
                marginBottom: '8px'
              }}
            >
              Send goal-setting reminder to:
            </p>
            <p 
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}
            >
              {reminderTargetUser?.email ?? reminderTargetUser?.Email}
            </p>
            
            {/* Reminder Result */}
            {reminderResult && (
              <div 
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: reminderResult.successful > 0 ? '#dcfce7' : '#fee2e2',
                  border: reminderResult.successful > 0 ? '1px solid #86efac' : '1px solid #fecaca',
                  color: reminderResult.successful > 0 ? '#166534' : '#991b1b'
                }}
              >
                {reminderResult.successful > 0 ? (
                  <>
                    <span style={{ fontSize: '16px' }}>✓</span>
                    <span>Reminder sent successfully!</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>✗</span>
                    <span>Failed to send reminder</span>
                  </>
                )}
              </div>
            )}
          </Modal.Body>
          
          {/* FOOTER */}
          <div 
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}
          >
            {/* Close Button */}
            <Button
              onClick={onHide}
              disabled={sendingReminder}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!sendingReminder) {
                  e.target.style.background = '#5a6268';
                  e.target.style.borderColor = '#5a6268';
                }
              }}
              onMouseLeave={(e) => {
                if (!sendingReminder) {
                  e.target.style.background = '#6c757d';
                  e.target.style.borderColor = '#6c757d';
                }
              }}
            >
              Close
            </Button>
            
            {/* Send Reminder Button */}
            <Button
              onClick={onSendReminder}
              disabled={sendingReminder}
              style={{
                background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 16px',
                fontWeight: '600',
                fontSize: '13px',
                borderRadius: '6px',
                transition: 'all 0.12s ease',
                boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: sendingReminder ? 0.7 : 1
              }}
            >
              {sendingReminder ? (
                <>
                  <Spinner 
                    animation="border" 
                    size="sm" 
                    style={{ 
                      width: '1rem', 
                      height: '1rem',
                      borderWidth: '2px'
                    }}
                  />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-send" style={{ fontSize: '13px' }}></i>
                  <span>Send Reminder</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReminderEmailModal;
