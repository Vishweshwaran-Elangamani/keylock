import { useState } from "react";
import { CloseButton } from "react-bootstrap";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";

const DeleteOpportunityModal = ({
  show,
  onHide,
  onOpportunityDeleted,
  opportunity,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await internalOpportunityService.deleteOpportunity(
        opportunity.opportunityId
      );

      if (response.success) {
        toast.success("Opportunity deleted successfully!");
        onOpportunityDeleted();
        onHide();
      } else {
        toast.error(response.message || "Failed to delete opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to delete opportunity");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop with Blur */}
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

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog - Smaller Width */}
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Dark Navy Blue */}
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
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444' }}></i>
              Delete Opportunity
            </div>
            <CloseButton
              onClick={onHide}
              disabled={loading}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: loading ? 0.5 : 1
              }}
            />
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Delete Confirmation */}
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#334155',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}
              >
                Are you sure you want to delete the opportunity{" "}
                <strong style={{ color: '#1e293b', fontWeight: '700' }}>
                  {opportunity.opportunityName}
                </strong>
                ?
              </p>

              {/* Warning Box */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#991b1b'
                }}
              >
                <i 
                  className="bi bi-exclamation-circle" 
                  style={{ 
                    fontSize: '16px', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                ></i>
                <span>
                  This action cannot be undone. All related nominations will also be affected.
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              flexShrink: 0,
              borderBottomLeftRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#6c757d',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.65 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#5a6268';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#6c757d';
                }
              }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                opacity: loading ? 0.65 : 1,
                minWidth: '110px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#ef4444';
                }
              }}
            >
              {loading ? (
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
                  <span>Deleting...</span>
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

export default DeleteOpportunityModal;
