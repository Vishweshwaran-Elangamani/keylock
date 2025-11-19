import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

function DeadlineModal({
  isOpen,
  onClose,
  deadlineInDays,
  onDeadlineChange,
  onConfirm,
  pendingAction,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay - with blur and dark color */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39,35,92,0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1050,
          width: '400px',
          maxWidth: '92%',
          borderRadius: '0.75rem',
          background: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 30px 24px 30px',
          alignItems: 'center'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <i
          className="bi bi-calendar-check"
          style={{
            fontSize: "56px",
            color: "#27235C",
            marginBottom: "20px",
          }}
        ></i>
        {/* Title */}
        <h3 style={{
          color: "#27235C",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 8,
          textAlign: "center",
          letterSpacing: 0.2
        }}>
          Set Deadline
        </h3>
        <p
          style={{
            color: "#64748b",
            textAlign: 'center',
            fontSize: '14px',
            marginBottom: "24px"
          }}
        >
          How many days should employees have to complete this form?
        </p>
        {/* Input Group */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          marginBottom: "32px",
          gap: "7px"
        }}>
          <label
            htmlFor="deadlineInput"
            style={{
              color: "#334155",
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: 4
            }}
          >
            <i className="bi bi-clock-history" style={{ color: "#27235C", fontSize: 15 }}></i>
            Deadline (in days):
          </label>
          <input
            id="deadlineInput"
            type="number"
            min="1"
            max="365"
            value={deadlineInDays}
            onChange={e => onDeadlineChange(parseInt(e.target.value) || 7)}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              border: "1.5px solid #cbd5e1",
              borderRadius: "6px",
              color: "#27235C",
              outline: "none",
              boxSizing: "border-box",
              background: "#fff",
              transition: "all 0.2s",
              fontWeight: 500
            }}
          />
        </div>
        {/* Modal Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            width: "100%",
            justifyContent: 'center'
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 0',
              background: '#6c757d',
              border: 'none',
              borderRadius: 7,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              transition: 'all 0.15s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#5a6268';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#6c757d';
            }}
          > Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
              border: 'none',
              borderRadius: 7,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(151,36,126,0.18)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <i className="bi bi-check-lg"></i>{" "}
            {pendingAction === "Send" ? "Share Form" : "Save Draft"}
          </button>
        </div>
      </div>
    </>
  );
}

export default DeadlineModal;
