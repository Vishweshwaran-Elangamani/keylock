import { useState } from "react";
import { toast } from "sonner";
import "../../../../styles/auth/department/DeleteDepartmentModal.css";
const DeleteDepartmentModal = ({ show, department, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (department?.hodEmployeeId) {
      toast.error(
        "Cannot delete department with assigned HOD. Please remove HOD first from Edit Department."
      );
      return;
    }
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
  const isDeleteBlocked =
    department?.hodEmployeeId ||
    (department?.hasChildren && department?.childDepartmentCount > 0);
  return (
    <>
      <div className="ddm-backdrop" onClick={onClose} />
      <div className="ddm-modal-container">
        <div className="ddm-modal-dialog">
          <div className="ddm-modal-header">
            <div className="ddm-header-title">
              <i className="bi bi-trash-fill"></i>
              Delete Department Permanently
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="ddm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="ddm-modal-body">
            <div className="ddm-info-card">
              <div className="ddm-info-header">
                <i className="bi bi-building ddm-info-icon"></i>
                <span className="ddm-info-name">
                  {department?.departmentName}
                </span>
              </div>
              <div className="ddm-info-details">
                <div className="ddm-info-row">
                  <strong>Code:</strong>{" "}
                  <span className="ddm-info-code">
                    {department?.departmentCode}
                  </span>
                </div>
                {department?.parentDepartmentName && (
                  <div className="ddm-info-row">
                    <strong>Parent:</strong> {department.parentDepartmentName}
                  </div>
                )}
                {department?.hodEmployeeName && (
                  <div className="ddm-info-row ddm-info-warning">
                    <strong> HOD Assigned:</strong> {department.hodEmployeeName}
                  </div>
                )}
                {department?.hasChildren && (
                  <div className="ddm-info-row ddm-info-warning">
                    <strong> Child Departments:</strong>{" "}
                    {department.childDepartmentCount}
                  </div>
                )}
                {department?.description && (
                  <div className="ddm-info-description">
                    {department.description}
                  </div>
                )}
              </div>
            </div>
            {isDeleteBlocked && (
              <div className="ddm-blocking-alert">
                <div className="ddm-blocking-title">
                  <i className="bi bi-x-circle-fill"></i>
                  <span>Cannot Delete This Department</span>
                </div>
                <ul className="ddm-blocking-list">
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
            {!isDeleteBlocked && (
              <>
                <p className="ddm-confirm-text">
                  Are you absolutely sure you want to permanently delete this
                  department?
                </p>
                <div className="ddm-critical-alert">
                  <div className="ddm-critical-title">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Critical Warning</span>
                  </div>
                  <p className="ddm-critical-text">
                    This action is{" "}
                    <span className="ddm-critical-emphasis">PERMANENT</span> and{" "}
                    <span className="ddm-critical-emphasis">
                      CANNOT be reversed!
                    </span>
                  </p>
                  <ul className="ddm-critical-list">
                    <li>
                      All employees must be reassigned to another department
                    </li>
                    <li>
                      Department history and data will be permanently lost
                    </li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </>
            )}
            <div className="ddm-info-note">
              <i className="bi bi-info-circle"></i>
              <small>
                <strong>Note:</strong>{" "}
                {isDeleteBlocked
                  ? "Resolve the issues above before deletion."
                  : "Ensure all employees are reassigned before deleting."}
              </small>
            </div>
          </div>
          <div className="ddm-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ddm-btn-cancel"
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || isDeleteBlocked}
              className={`ddm-btn-delete ${isDeleteBlocked ? "blocked" : ""}`}
            >
              {loading ? (
                <>
                  <span className="ddm-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash-fill"></i>
                  {isDeleteBlocked
                    ? "Delete Blocked"
                    : "Yes, Delete Permanently"}
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
