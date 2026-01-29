import { useState, useEffect } from "react";
import roleService from "../../../../services/auth/roleService";
import { toast } from "sonner";
import "../../../../styles/auth/roles/EditRoleModal.css";
const EditRoleModal = ({ show, role, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    roleId: "",
    roleName: "",
    roleCode: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (role) {
      setFormData({
        roleId: role.roleId,
        roleName: role.roleName || "",
        roleCode: role.roleCode || "",
        description: role.description || "",
      });
      setErrors({});
    }
  }, [role]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.roleName.trim()) {
      newErrors.roleName = "Role name is required";
    } else if (formData.roleName.trim().length < 3) {
      newErrors.roleName = "Role name must be at least 3 characters";
    }
    if (!formData.roleCode.trim()) {
      newErrors.roleCode = "Role code is required";
    } else if (formData.roleCode.trim().length < 2) {
      newErrors.roleCode = "Role code must be at least 2 characters";
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.roleCode.trim())) {
      newErrors.roleCode = "Role code must contain only letters and numbers";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Enter Valid Details!");
      return;
    }
    try {
      setLoading(true);
      toast.loading("Updating role...");
      const payload = {
        roleId: formData.roleId,
        roleName: formData.roleName.trim() || null,
        roleCode: formData.roleCode.trim() || null,
        description: formData.description.trim() || null,
      };
      const response = await roleService.updateRole(payload);
      if (response.success) {
        toast.dismiss();
        toast.success("Role updated successfully");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to update role");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Error updating role");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="erm-backdrop" onClick={onClose} />
      <div className="erm-modal-container">
        <div className="erm-modal-dialog">
          <div className="erm-modal-header">
            <div className="erm-header-title">
              <i className="bi bi-pencil-square"></i>
              Edit Role
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="erm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="erm-form">
            <div className="erm-modal-body">
              {role?.isSystemRole && (
                <div className="erm-system-warning">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Warning:</strong> This is a system role. Changes may
                    affect core functionality.
                  </div>
                </div>
              )}
              <div className="erm-two-column">
                <div className="erm-column-left">
                  <div className="erm-form-group">
                    <label className="erm-form-label">
                      Role Name <span className="erm-required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="roleName"
                      placeholder="Enter role name (e.g., Admin, Manager)"
                      value={formData.roleName}
                      onChange={handleChange}
                      maxLength={50}
                      disabled={loading}
                      className={`erm-form-input ${
                        errors.roleName ? "error" : ""
                      }`}
                    />
                    {errors.roleName && (
                      <div className="erm-form-error">{errors.roleName}</div>
                    )}
                  </div>
                  <div className="erm-form-group erm-form-group-spaced">
                    <label className="erm-form-label">
                      Role Code <span className="erm-required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      name="roleCode"
                      placeholder="Enter role code (e.g., admin123, mgr01)"
                      value={formData.roleCode}
                      onChange={handleChange}
                      maxLength={20}
                      disabled={loading}
                      className={`erm-form-input ${
                        errors.roleCode ? "error" : ""
                      }`}
                    />
                    {errors.roleCode && (
                      <div className="erm-form-error">{errors.roleCode}</div>
                    )}
                  </div>
                </div>
                <div className="erm-column-right">
                  <div className="erm-form-group-full-height">
                    <label className="erm-form-label">
                      Description{" "}
                      <span className="erm-required-asterisk">*</span>
                    </label>
                    <textarea
                      name="description"
                      placeholder="Enter role description (minimum 10 characters)"
                      value={formData.description}
                      onChange={handleChange}
                      rows={8}
                      maxLength={255}
                      disabled={loading}
                      className={`erm-form-input erm-form-textarea ${
                        errors.description ? "error" : ""
                      }`}
                    />
                    {errors.description && (
                      <div className="erm-form-error-desc">
                        {errors.description}
                      </div>
                    )}
                    <small className="erm-char-count">
                      {formData.description.length}/255 characters
                    </small>
                  </div>
                </div>
              </div>
              <div className="erm-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>All fields are required for updating the role</small>
              </div>
            </div>
            <div className="erm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="erm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="erm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="erm-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update Role
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default EditRoleModal;
