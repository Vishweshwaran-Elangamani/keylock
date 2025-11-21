import { useState, useEffect } from "react";
import roleService from "../../../../services/auth/roleService";
import { toast } from "sonner";

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
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "590px",
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
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <i className="bi bi-pencil-square"></i>
              Edit Role
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

          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <div style={{ padding: "16px 15px 6px 15px", background: "#fff" }}>
              {role?.isSystemRole && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                    background: "#fef3c7",
                    color: "#dc973a",
                    padding: "6px 8px",
                    borderRadius: 4,
                    fontSize: 13,
                    gap: 7,
                    textAlign: "center"
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Warning:</strong>{" "}
                    This is a system role. Changes may affect core functionality.
                  </div>
                </div>
              )}

              {/* 2 column layout */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {/* LEFT COLUMN */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Role Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="roleName"
                      placeholder="Enter role name (e.g., Admin, Manager)"
                      value={formData.roleName}
                      onChange={handleChange}
                      maxLength={50}
                      disabled={loading}
                      style={{
                        border: errors.roleName
                          ? "1px solid #dc3545"
                          : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                      }}
                    />
                    {errors.roleName && (
                      <div style={{ color: "#dc3545", fontSize: 11, marginTop: 2 }}>
                        {errors.roleName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Role Code <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="roleCode"
                      placeholder="Enter role code (e.g., admin123, mgr01)"
                      value={formData.roleCode}
                      onChange={handleChange}
                      maxLength={20}
                      disabled={loading}
                      style={{
                        border: errors.roleCode
                          ? "1px solid #dc3545"
                          : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                      }}
                    />
                    {errors.roleCode && (
                      <div style={{ color: "#dc3545", fontSize: 11, marginTop: 2 }}>
                        {errors.roleCode}
                      </div>
                    )}
                  </div>
                </div>
                {/* RIGHT COLUMN */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#334155",
                        marginBottom: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Description <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                    </label>
                    <textarea
                      name="description"
                      placeholder="Enter role description (minimum 10 characters)"
                      value={formData.description}
                      onChange={handleChange}
                      rows={8}
                      maxLength={255}
                      disabled={loading}
                      style={{
                        border: errors.description
                          ? "1px solid #dc3545"
                          : "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "8px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        resize: "vertical",
                        minHeight: 90,
                        maxHeight: 130,
                        fontFamily: "inherit",
                        lineHeight: 1.4,
                        marginBottom: 3,
                      }}
                    />
                    {errors.description && (
                      <div style={{ color: "#dc3545", fontSize: 11, marginBottom: 3 }}>
                        {errors.description}
                      </div>
                    )}
                    <small style={{ color: "#64748b", fontSize: 11 }}>
                      {formData.description.length}/255 characters
                    </small>
                  </div>
                </div>
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
                  marginTop: 10,
                }}
              >
                <i className="bi bi-info-circle"></i>
                <small>All fields are required for updating the role</small>
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
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              {/* Update Button */}
              <button
                type="submit"
                disabled={loading}
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
                  cursor: loading ? "not-allowed" : "pointer",
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
                        borderTop: "2px solid #E01950",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    Updating...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
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
