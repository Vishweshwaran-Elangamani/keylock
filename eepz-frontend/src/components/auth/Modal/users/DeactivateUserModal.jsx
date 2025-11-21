import { useState } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";

const DeactivateUserModal = ({ show, onHide, onUserDeactivated, user }) => {
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      const response = await userService.deactivateUser(user.userId);

      if (response.success) {
        toast.success("User deactivated permanently!");
        onUserDeactivated();
        setTimeout(() => {
          onHide();
        }, 500);
      } else {
        toast.error(response.message || "Failed to deactivate user");
      }
    } catch (error) {
      toast.error(error.message || "Failed to deactivate user");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "550px",
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
          {/* MODAL HEADER */}
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
              <i className="bi bi-x-circle-fill"></i>
              Deactivate User Permanently
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* MODAL BODY */}
          <div
            style={{
              padding: "20px 15px",
              background: "#fff",
              textAlign: "left",
            }}
          >
            {/* Confirmation Question */}
            <p
              style={{
                fontSize: 15,
                color: "#334155",
                marginBottom: 16,
                lineHeight: 1.6,
                textAlign: "center"
              }}
            >
              Are you sure you want to permanently deactivate{" "}
              <strong
                style={{
                  color: "#dc2626",
                  fontWeight: 700,
                }}
              >
                {user?.firstName} {user?.lastName}
              </strong>
              ?
            </p>

            {/* Critical Warning Box */}
            <div
              style={{
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                border: "2px solid #dc2626",
                borderRadius: 8,
                padding: 14,
                marginBottom: 14,
                textAlign: "center"
              }}
            >
              {/* Warning Header with Icon */}
              <div
                style={{
                  alignItems: "center",
                  gap: 8,
                  color: "#dc2626",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 10
                }}
              >
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{ fontSize: 18}}
                ></i>
                <span>Critical Warning</span>
              </div>

              {/* Warning Text */}
              <p
                style={{
                  fontSize: 13,
                  color: "#7f1d1d",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                <strong>This action is PERMANENT and CANNOT be reversed!</strong>
                <br />
              </p>

              {/* Warning List */}
              <ul
                style={{
                  fontSize: 13,
                  color: "#991b1b",
                  marginLeft: 20,
                  marginBottom: 0,
                  paddingLeft: 0,
                  lineHeight: 1.7,
                  textAlign: "left"
                }}
              >
                <strong>Once deactivated, this user will:</strong>
                <li>Lose all access to the system immediately</li>
                <li>Be unable to log in</li>
                <li>Not be able to be reactivated</li>
              </ul>
            </div>

            {/* Info Alert */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: 4,
                fontSize: 12,
                padding: "8px 10px",
                gap: 6,
                alignContent: "center"
              }}
            >
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong> Please ensure this is the correct action
                before proceeding.
              </small>
            </div>
          </div>

          {/* MODAL FOOTER - ACTION BUTTONS */}
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
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = "#6c757d";
              }}
            >
              <i className="bi bi-arrow-left"></i> Cancel
            </button>

            {/* Deactivate Button - NEW RED COLOR FROM IMAGE */}
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              style={{
                background: loading
                  ? "#e63946"
                  : "linear-gradient(90deg, #e63946 0%, #d62828 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 12px",
                fontSize: 12,
                borderRadius: 5,
                boxShadow: "0 2px 8px rgba(230,57,70,0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.85 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.opacity = 1;
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #d62828",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      marginRight: 6,
                    }}
                  />
                  Deactivating...
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}</style>
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle-fill"></i>
                  Yes, Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeactivateUserModal;
