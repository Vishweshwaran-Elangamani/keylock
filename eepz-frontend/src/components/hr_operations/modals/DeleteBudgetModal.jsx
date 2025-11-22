import { useState } from "react";

const DeleteConfirmationModal = ({ show, onConfirm, onCancel, budget }) => {
  const [deleting, setDeleting] = useState(false);

  if (!show || !budget) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

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
        onClick={onCancel}
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
          {/* HEADER - Fixed */}
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
              flexShrink: 0,
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
              <i className="bi bi-exclamation-triangle"></i>
              Confirm Delete
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.7 : 1,
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
              textAlign: "center",
            }}
          >
            {/* Warning Alert */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{ fontSize: 32, color: "#dc2626" }}
                ></i>
              </div>
            </div>

            <h5
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: 12,
              }}
            >
              Delete Department Budget?
            </h5>

            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Are you sure you want to delete this department budget?
            </p>

            {budget && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1e293b",
                    margin: 0,
                  }}
                >
                  {budget.departmentName} - {budget.fiscalYear}
                </p>
              </div>
            )}

            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <i
                className="bi bi-info-circle-fill"
                style={{ fontSize: 16, color: "#dc2626", flexShrink: 0 }}
              ></i>
              <p
                style={{
                  fontSize: 13,
                  color: "#991b1b",
                  margin: 0,
                  textAlign: "left",
                  lineHeight: 1.5,
                }}
              >
                <strong>Warning:</strong> This action cannot be undone. All
                associated data will be permanently deleted.
              </p>
            </div>
          </div>

          {/* FOOTER - Fixed */}
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
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.7 : 1,
                transition: "all 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!deleting) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                if (!deleting) e.target.style.background = "#6c757d";
              }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              style={{
                background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.85 : 1,
                transition: "all 0.2s ease",
                minWidth: 100,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!deleting) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!deleting) e.target.style.opacity = 1;
              }}
            >
              {deleting ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #dc2626",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      marginRight: 6,
                    }}
                  />
                  Deleting...
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}</style>
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
    </>
  );
};

export default DeleteBudgetModal;
