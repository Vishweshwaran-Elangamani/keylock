import React from "react";

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this period allocation?",
  itemName = "",
  isDeleting = false 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
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
        onClick={handleCancel}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1050,
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: '#27235C',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff'
            }}
          >
            <i className="bi bi-exclamation-triangle"></i>
            {title}
          </div>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px',
            background: '#ffffff',
            overflowY: 'auto',
            flex: 1,
            border: 'none'
          }}
        >
          <p 
            style={{ 
              fontSize: '14px', 
              color: '#334155',
              marginBottom: '16px',
              lineHeight: '1.5',
              textAlign: 'center'
            }}
          >
            {message}
          </p>
          
          {itemName && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              <strong style={{ fontSize: '14px', color: '#991b1b' }}>
                {itemName}
              </strong>
            </div>
          )}
          
          {/* Warning Box - Centered Content */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffecb5',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#664d03',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              <i 
                className="bi bi-exclamation-triangle-fill" 
                style={{ 
                  fontSize: '16px',
                  marginRight: '6px'
                }}
              ></i>
              <strong>Warning</strong>
            </div>
            <p style={{ margin: 0 }}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
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
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              background: '#6c757d',
              borderColor: '#6c757d',
              color: '#ffffff',
              fontWeight: '600',
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '6px',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.65 : 1,
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.background = '#5a6268';
                e.target.style.borderColor = '#5a6268';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.background = '#6c757d';
                e.target.style.borderColor = '#6c757d';
              }
            }}
          >
            Cancel
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              background: '#dc3545',
              borderColor: '#dc3545',
              color: '#ffffff',
              fontWeight: '600',
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '6px',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.65 : 1,
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.background = '#bb2d3b';
                e.target.style.borderColor = '#bb2d3b';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.background = '#dc3545';
                e.target.style.borderColor = '#dc3545';
              }
            }}
          >
            {isDeleting ? (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block'
                  }}
                />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash"></i>
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default DeleteConfirmationModal;
