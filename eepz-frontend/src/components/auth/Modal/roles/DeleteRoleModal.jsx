import { useState } from "react";
import { toast } from "sonner";

const DeleteRoleModal = ({ show, role, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      toast.loading("Deleting role...");
      await onConfirm();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Blurred Blue Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(39, 35, 92, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "490px",
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
              fontSize: 15,
              fontWeight: 600,
              borderRadius: "0.5rem 0.5rem 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <i className="bi bi-trash-fill"></i>
              Delete Role Permanently
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {/* BODY */}
          <div style={{ padding: "16px 15px 4px 15px", background: "#fff" }}>
            {/* Confirmation */}
            <p
              style={{
                color: "#22223b",
                textAlign: "center",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Are you sure you want to permanently delete the role{" "}
              <strong
                style={{
                  color: "#b91c1c",
                  background: "#fee2e2",
                  borderRadius: 5,
                  padding: "2px 6px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {role?.roleName}
              </strong>
              ?
            </p>


            {/* WARNING BOX */}
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #facc15",
                borderRadius: 5,
                padding: "8px 10px",
                marginBottom: 9,
                textAlign: "left", // important: left align
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#b45309",
                  fontWeight: 700,
                  fontSize: 13,
                  marginBottom: 3,
                }}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Critical Warning</span>
              </div>
              <p
                style={{
                  color: "#a16207",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 2,
                }}
              >
                This action is <span style={{ fontWeight: 900 }}>PERMANENT</span> and{" "}
                <span style={{ fontWeight: 900 }}>CANNOT be reversed!</span>
              </p>
              <div style={{ color: "#a16207", fontSize: 12, marginBottom: 3 }}>
                <strong>Once deleted, this role will:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: 19, color: "#a16207", fontSize: 12 }}>
                <li>Be permanently removed from the system</li>
                <li>Require all users with this role to be reassigned</li>
                <li>Cannot be recovered or restored</li>
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
                padding: "5px 8px",
                gap: 5,
              }}
            >
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong> Please ensure this is the correct action before proceeding. System roles are protected and cannot be deleted.
              </small>
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
            {/* CANCEL */}
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
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
              onMouseEnter={e => {
                if (!loading) e.target.style.background = "#5a6268";
              }}
              onMouseLeave={e => {
                if (!loading) e.target.style.background = "#6c757d";
              }}
            >
              <i className="bi bi-arrow-left"></i>
              Cancel
            </button>
            {/* DELETE */}
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              style={{
                background: "linear-gradient(90deg, #ea3e44 0%, #e01950 100%)",
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
                opacity: loading ? 0.85 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                if (!loading) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={e => {
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
                      borderTop: "2px solid #e01950",
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
                  <i className="bi bi-trash-fill"></i>
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

export default DeleteRoleModal;
