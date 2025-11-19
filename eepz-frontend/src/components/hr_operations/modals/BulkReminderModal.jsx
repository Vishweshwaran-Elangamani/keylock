import { Modal, Button, Spinner, CloseButton } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";

const BulkReminderModal = ({
  show,
  onHide,
  selectedEmployees,
  sendingBulkReminder,
  onSendBulkReminders,
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
              Send Bulk Reminders
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
              minHeight: '150px'
            }}
          >
            {/* Main Message */}
            <p 
              style={{
                fontSize: '14px',
                color: '#334155',
                lineHeight: '1.6',
                marginBottom: '12px'
              }}
            >
              You are about to send career goals reminders to{" "}
              <strong style={{ 
                color: '#27235C', 
                fontWeight: '700',
                fontSize: '15px'
              }}>
                {selectedEmployees.length}
              </strong>{" "}
              selected employee(s).
            </p>
            
            {/* Info Message */}
            <p 
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}
            >
              Each employee will receive an email reminder to set their career goals.
            </p>
            
            {/* Warning */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                marginTop: '16px'
              }}
            >
              <p 
                style={{
                  fontSize: '12px',
                  color: '#92400e',
                  margin: 0,
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '14px' }}>⚠</span>
                <span>This action cannot be undone.</span>
              </p>
            </div>
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
            {/* Cancel Button */}
            <Button
              onClick={onHide}
              disabled={sendingBulkReminder}
              style={{
                background: '#6c757d',
                borderColor: '#6c757d',
                color: '#ffffff',
                fontWeight: '600',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                opacity: sendingBulkReminder ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!sendingBulkReminder) {
                  e.target.style.background = '#5a6268';
                  e.target.style.borderColor = '#5a6268';
                }
              }}
              onMouseLeave={(e) => {
                if (!sendingBulkReminder) {
                  e.target.style.background = '#6c757d';
                  e.target.style.borderColor = '#6c757d';
                }
              }}
            >
              Cancel
            </Button>
            
            {/* Send Bulk Reminder Button */}
            <Button
              onClick={onSendBulkReminders}
              disabled={sendingBulkReminder}
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
                opacity: sendingBulkReminder ? 0.7 : 1,
                minWidth: '180px',
                justifyContent: 'center'
              }}
            >
              {sendingBulkReminder ? (
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
                  <FaPaperPlane style={{ fontSize: '12px', color: '#ffffff' }} />
                  <span>Send to {selectedEmployees.length} Employee(s)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkReminderModal;
