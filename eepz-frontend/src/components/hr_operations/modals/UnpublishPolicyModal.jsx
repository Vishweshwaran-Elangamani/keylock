const UnpublishPolicyModal = ({ show, policy, onHide, onUnpublish, unpublishing }) => {
  if (!show || !policy) return null;

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
              <i className="bi bi-eye-slash-fill"></i>
              Unpublish Policy
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={unpublishing}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: unpublishing ? "not-allowed" : "pointer",
                opacity: unpublishing ? 0.7 : 1,
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
              You are about to unpublish the following policy:
            </p>

            {/* Policy Info Box */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <strong style={{ fontSize: 15, color: "#1e293b" }}>
                    {policy.policyName}
                  </strong>
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  <i className="bi bi-tag" style={{ marginRight: 6 }}></i>
                  {policy.category || "General"}
                </div>
                {policy.description && (
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                    {policy.description.substring(0, 100)}
                    {policy.description.length > 100 && "..."}
                  </div>
                )}
              </div>
            </div>

            {/* Info Message */}
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              This policy will be hidden from employees and moved to draft status.
            </p>

            {/* Warning Info */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "2px solid #fbbf24",
                color: "#92400e",
                borderRadius: 6,
                fontSize: 12,
                padding: "10px 12px",
                gap: 8,
                fontWeight: 500,
              }}
            >
              <i
                className=""
                style={{ fontSize: 16, marginTop: 2, color: "#fbbf24" }}
              ></i>
              <div>
                <strong style={{ display: "block", marginBottom: 4 }}>Warning:</strong>
                Employees will no longer be able to view or acknowledge this policy.
              </div>
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
              disabled={unpublishing}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: unpublishing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: unpublishing ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!unpublishing) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                if (!unpublishing) e.target.style.background = "#6c757d";
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onUnpublish}
              disabled={unpublishing}
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
                cursor: unpublishing ? "not-allowed" : "pointer",
                opacity: unpublishing ? 0.85 : 1,
                transition: "all 0.2s ease",
                minWidth: 140,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!unpublishing) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!unpublishing) e.target.style.opacity = 1;
              }}
            >
              {unpublishing ? (
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
                  Unpublishing...
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}</style>
                </>
              ) : (
                <>
                  <i className="bi bi-eye-slash-fill"></i>
                  Unpublish Policy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnpublishPolicyModal;
