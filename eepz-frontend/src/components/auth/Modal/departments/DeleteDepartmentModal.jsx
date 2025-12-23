import { useState } from "react";
import { toast } from "sonner";

const DeleteDepartmentModal = ({ show, department, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    // Frontend validation - Check if HOD is assigned
    if (department?.hodEmployeeId) {
      toast.error("Cannot delete department with assigned HOD. Please remove HOD first from Edit Department.");
      return;
    }

    // Frontend validation - Check if has children
    if (department?.hasChildren && department?.childDepartmentCount > 0) {
      toast.error(
        `Cannot delete department with ${department.childDepartmentCount} child department(s). Delete or reassign them first.`
      );
      return;
    }

    try {
      setLoading(true);
      toast.loading("Deleting department...");
      await onConfirm();
      toast.dismiss();
      toast.success("Department deleted successfully");
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Failed to delete department");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  // Check if deletion is blocked
  const isDeleteBlocked =
    department?.hodEmployeeId ||
    (department?.hasChildren && department?.childDepartmentCount > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.40)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "520px",
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
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <i className="bi bi-trash-fill"></i>
              Delete Department Permanently
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
                fontSize: "18px",
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
          <div
            style={{
              padding: "16px 15px",
              background: "#fff",
              fontSize: "13px",
            }}
          >
            {/* Department Info Card */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "12px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <i
                  className="bi bi-building"
                  style={{ fontSize: "16px", color: "#97247E" }}
                ></i>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#27235C",
                  }}
                >
                  {department?.departmentName}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Code:</strong>{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      background: "#e2e8f0",
                      padding: "2px 6px",
                      borderRadius: 3,
                      fontWeight: 600,
                    }}
                  >
                    {department?.departmentCode}
                  </span>
                </div>

                {department?.parentDepartmentName && (
                  <div style={{ marginBottom: 4 }}>
                    <strong>Parent:</strong> {department.parentDepartmentName}
                  </div>
                )}

                {department?.hodEmployeeName && (
                  <div
                    style={{
                      marginBottom: 4,
                      color: "#e01950",
                      fontWeight: 600,
                    }}
                  >
                    <strong>⚠️ HOD Assigned:</strong>{" "}
                    {department.hodEmployeeName}
                  </div>
                )}

                {department?.hasChildren && (
                  <div
                    style={{
                      marginBottom: 4,
                      color: "#e01950",
                      fontWeight: 600,
                    }}
                  >
                    <strong>⚠️ Child Departments:</strong>{" "}
                    {department.childDepartmentCount}
                  </div>
                )}

                {department?.description && (
                  <div style={{ marginTop: 6, fontStyle: "italic" }}>
                    {department.description}
                  </div>
                )}
              </div>
            </div>

            {/* Blocking Warning */}
            {isDeleteBlocked && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 5,
                  padding: "10px 12px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                  <span>Cannot Delete This Department</span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {department?.hodEmployeeId && (
                    <li>
                      HOD is assigned. Please remove HOD first from Edit
                      Department
                    </li>
                  )}
                  {department?.hasChildren &&
                    department?.childDepartmentCount > 0 && (
                      <li>
                        Has {department.childDepartmentCount} child
                        department(s). Delete or reassign them first
                      </li>
                    )}
                </ul>
              </div>
            )}

            {/* Normal Warning */}
            {!isDeleteBlocked && (
              <>
                <p
                  style={{
                    color: "#22223b",
                    textAlign: "center",
                    fontSize: 13,
                    marginBottom: 12,
                    fontWeight: 500,
                  }}
                >
                  Are you absolutely sure you want to permanently delete this
                  department?
                </p>

                <div
                  style={{
                    background: "#fef9c3",
                    border: "1px solid #facc15",
                    borderRadius: 5,
                    padding: "10px 12px",
                    marginBottom: 10,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#b45309",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Critical Warning</span>
                  </div>
                  <p
                    style={{
                      color: "#a16207",
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    This action is{" "}
                    <span style={{ fontWeight: 900 }}>PERMANENT</span> and{" "}
                    <span style={{ fontWeight: 900 }}>CANNOT be reversed!</span>
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: "#a16207",
                      fontSize: 12,
                    }}
                  >
                    <li>All employees must be reassigned to another department</li>
                    <li>Department history and data will be permanently lost</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </>
            )}

            {/* Info Note */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: 4,
                fontSize: 11,
                padding: "6px 10px",
                gap: 6,
              }}
            >
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong>{" "}
                {isDeleteBlocked
                  ? "Resolve the issues above before deletion."
                  : "Ensure all employees are reassigned before deleting."}
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
            }}
          >
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                background: "#6c757d",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 14px",
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
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || isDeleteBlocked}
              style={{
                background: isDeleteBlocked
                  ? "#94a3b8"
                  : "linear-gradient(90deg,#ea3e44 0%,#e01950 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "7px 14px",
                fontSize: 12,
                borderRadius: 5,
                cursor:
                  loading || isDeleteBlocked ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: loading || isDeleteBlocked ? 0.6 : 1,
                transition: "all 0.2s ease",
                boxShadow: isDeleteBlocked
                  ? "none"
                  : "0 2px 8px rgba(224, 25, 80, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading && !isDeleteBlocked) e.target.style.opacity = 0.93;
              }}
              onMouseLeave={(e) => {
                if (!loading && !isDeleteBlocked) e.target.style.opacity = 1;
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
                  {isDeleteBlocked ? "Delete Blocked" : "Yes, Delete Permanently"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteDepartmentModal;
