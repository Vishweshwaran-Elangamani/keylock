import { Modal, Button, Spinner, CloseButton } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";

const BulkReminderModal = ({
  show,
  onHide,
  selectedEmployees,
  sendingBulkReminder,
  onSendBulkReminders,
}) => {
  if (!show) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onHide}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "500px",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "#27235C",
              color: "#fff",
              padding: "13px 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-send-fill"></i>
              Send Bulk Reminders
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={sendingBulkReminder}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: sendingBulkReminder ? "not-allowed" : "pointer",
                opacity: sendingBulkReminder ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* BODY */}
          <div
            style={{
              padding: "20px",
              background: "#fff",
              textAlign: "left",
            }}
          >
            {/* Main Message */}
            <p
              style={{
                fontSize: 14,
                color: "#334155",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              You are about to send career goals reminders to{" "}
              <strong
                style={{
                  color: "#27235C",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {selectedEmployees.length}
              </strong>{" "}
              selected employee(s).
            </p>

            {/* Info Message */}
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Each employee will receive an email reminder to set their career goals.
            </p>

            {/* Warning */}
            <div
              style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "2px solid #f59e0b",
                borderRadius: 6,
                marginTop: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#92400e",
                  margin: 0,
                  fontStyle: "italic",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 500,
                  textAlign: "center"
                }}
              >
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 14, color: "#f59e0b" }}></i>
                <span>This action cannot be undone.</span>
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: "10px 15px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onHide}
              disabled={sendingBulkReminder}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: sendingBulkReminder ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: sendingBulkReminder ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!sendingBulkReminder) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                if (!sendingBulkReminder) e.target.style.background = "#6c757d";
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSendBulkReminders}
              disabled={sendingBulkReminder}
              style={{
                background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: sendingBulkReminder ? "not-allowed" : "pointer",
                opacity: sendingBulkReminder ? 0.85 : 1,
                transition: "all 0.2s ease",
                minWidth: 180,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!sendingBulkReminder) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!sendingBulkReminder) e.target.style.opacity = 1;
              }}
            >
              {sendingBulkReminder ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #E01950",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      marginRight: 6,
                    }}
                  />
                  Sending...
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}</style>
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  Send to {selectedEmployees.length} Employee(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkReminderModal;
