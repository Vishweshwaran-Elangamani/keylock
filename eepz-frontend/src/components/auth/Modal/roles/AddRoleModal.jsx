import { useState } from "react";
import roleService from "../../../../services/auth/roleService";
import { toast } from "sonner";
import "../../../../styles/auth/roles/AddRoleModal.css";
const AddRoleModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    roleName: "",
    roleCode: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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
      toast.loading("Creating role...");
      const payload = {
        roleName: formData.roleName.trim(),
        roleCode: formData.roleCode.trim(),
        description: formData.description.trim() || null,
      };
      const response = await roleService.createRole(payload);
      if (response.success) {
        toast.dismiss();
        toast.success("Role created successfully");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to create role");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Error creating role");
    } finally {
      setLoading(false);
    }
  };
  if (!show) return null;
  return (
    <>
      <div className="arm-backdrop" onClick={onClose} />
      <div className="arm-modal-container">
        <div className="arm-modal-dialog">
          <div className="arm-modal-header">
            <div className="arm-header-title">
              <i className="bi bi-plus-circle"></i>
              Add New Role
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="arm-close-button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="arm-form">
            <div className="arm-modal-body">
              <div className="arm-form-content">
                <div className="arm-form-group">
                  <label className="arm-form-label">
                    Role Name <span className="arm-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="roleName"
                    placeholder="Enter role name (e.g., Admin, Manager)"
                    value={formData.roleName}
                    onChange={handleChange}
                    maxLength={50}
                    disabled={loading}
                    className={`arm-form-input ${
                      errors.roleName ? "error" : ""
                    }`}
                  />
                  {errors.roleName && (
                    <div className="arm-form-error">{errors.roleName}</div>
                  )}
                </div>
                <div className="arm-form-group">
                  <label className="arm-form-label">
                    Role Code <span className="arm-required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="roleCode"
                    placeholder="Enter role code (e.g., admin123, mgr01)"
                    value={formData.roleCode}
                    onChange={handleChange}
                    maxLength={20}
                    disabled={loading}
                    className={`arm-form-input ${
                      errors.roleCode ? "error" : ""
                    }`}
                  />
                  {errors.roleCode && (
                    <div className="arm-form-error">{errors.roleCode}</div>
                  )}
                </div>
                <div className="arm-form-group">
                  <label className="arm-form-label">
                    Description <span className="arm-required-asterisk">*</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Enter role description (minimum 10 characters)"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={255}
                    disabled={loading}
                    className={`arm-form-input arm-form-textarea ${
                      errors.description ? "error" : ""
                    }`}
                  />
                  {errors.description && (
                    <div className="arm-form-error">{errors.description}</div>
                  )}
                  <small className="arm-char-count">
                    {formData.description.length}/255 characters
                  </small>
                </div>
              </div>
              <div className="arm-info-alert">
                <i className="bi bi-info-circle"></i>
                <small>
                  <strong>Note:</strong> Role codes should be unique and contain
                  only letters and numbers (e.g., admin, manager123, hrRole01).
                </small>
              </div>
            </div>
            <div className="arm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="arm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="arm-btn-submit"
              >
                {loading ? (
                  <>
                    <span className="arm-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Create Role
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
export default AddRoleModal;
