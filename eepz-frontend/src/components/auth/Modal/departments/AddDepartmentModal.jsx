import { useState } from "react";
import { Modal, Button, Form, Spinner, CloseButton } from "react-bootstrap";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";

const AddDepartmentModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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
      const response = await departmentService.createDepartment(formData);
      if (response.success) {
        toast.success("Department created successfully");
        onSuccess();
      } else {
        toast.error(response.message || "Failed to create department");
      }
    } catch (error) {
      toast.error(error.message || "Error creating department");
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
          backgroundColor: "rgba(39, 35, 92, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
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
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
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
              <i className="bi bi-plus-circle"></i>
              Add Department
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              style={{
                filter: "brightness(0) invert(1)",
                opacity: 1,
              }}
              disabled={loading}
            />
          </div>
          {/* Body */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ margin: 0 }}>
            <div style={{ padding: "16px 15px 6px 15px", background: "#fff" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
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
                    Department Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentName"
                    placeholder="Enter department name"
                    value={formData.departmentName}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
                    autoFocus
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
                    Department Code <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    placeholder="Enter department code"
                    value={formData.departmentCode}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
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
            </div>
            {/* Footer */}
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
                Cancel
              </button>
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
                  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.25)",
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
                    <Spinner animation="border" size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Create Department
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

export default AddDepartmentModal;
