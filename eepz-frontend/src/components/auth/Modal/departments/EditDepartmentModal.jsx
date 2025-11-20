import { useState, useEffect } from "react";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";

const EditDepartmentModal = ({ show, department, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    departmentName: "",
    departmentCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (department && show) {
      setFormData({
        departmentId: department.departmentId || "",
        departmentName: department.departmentName || "",
        departmentCode: department.departmentCode || "",
      });
      setErrors({});
    }
  }, [department, show]);

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
    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (formData.departmentName.trim().length < 3) {
      newErrors.departmentName = "Department name must be at least 3 characters";
    }
    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = "Department code is required";
    } else if (formData.departmentCode.trim().length < 2) {
      newErrors.departmentCode = "Department code must be at least 2 characters";
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
      toast.loading("Updating department...");
      const payload = {
        departmentId: formData.departmentId,
        departmentName: formData.departmentName,
        departmentCode: formData.departmentCode,
      };
      const response = await departmentService.updateDepartment(payload);
      if (response.success) {
        toast.dismiss();
        toast.success("Department updated successfully");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      toast.dismiss();
      toast.error(error.message || "Error updating department");
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
          maxWidth: "390px",
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
              Edit Department
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

          {/* BODY / FORM */}
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <div style={{ padding: "16px 15px 4px 15px", background: "#fff" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 7,
                }}
              >
                {/* Department Name */}
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
                    Department Name{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    name="departmentName"
                    disabled={loading}
                    placeholder="Enter department name"
                    value={formData.departmentName}
                    onChange={handleChange}
                    style={{
                      border: errors.departmentName
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.departmentName && (
                    <div style={{ color: "#dc3545", fontSize: 11, marginTop: 2 }}>
                      {errors.departmentName}
                    </div>
                  )}
                </div>
                {/* Department Code */}
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
                    Department Code{" "}
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    name="departmentCode"
                    disabled={loading}
                    placeholder="Enter department code"
                    value={formData.departmentCode}
                    onChange={handleChange}
                    style={{
                      border: errors.departmentCode
                        ? "1px solid #dc3545"
                        : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.departmentCode && (
                    <div style={{ color: "#dc3545", fontSize: 11, marginTop: 2 }}>
                      {errors.departmentCode}
                    </div>
                  )}
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
                }}
              >
                <i className="bi bi-info-circle"></i>
                <small>Update department information</small>
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
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = "#5a6268";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = "#6c757d";
                  }
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              {/* Submit Button */}
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
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: loading ? 0.85 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.opacity = 0.93;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.opacity = 1;
                  }
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid #fff",
                        borderTop: "2px solid #138cbe",
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
                    Update Department
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

export default EditDepartmentModal;
