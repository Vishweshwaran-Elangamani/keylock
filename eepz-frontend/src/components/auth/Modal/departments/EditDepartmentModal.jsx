import { useState, useEffect } from "react";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";
import "../../../../styles/auth/department/EditDepartmentModal.css";

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
      <div className="modal-backdrop-custom"></div>
      <div className="modal-wrapper-custom">
        <div className="modal-dialog-custom">
          <div className="modal-content-custom">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">
                <i className="bi bi-pencil-square"></i>
                Edit Department
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="form-grid">
                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Department Name <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input-custom ${
                        errors.departmentName ? "is-invalid" : ""
                      }`}
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleChange}
                      placeholder="Enter department name"
                      maxLength={100}
                      disabled={loading}
                    />
                    {errors.departmentName && (
                      <div className="error-message">
                        {errors.departmentName}
                      </div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">
                      Department Code <span className="required-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input-custom ${
                        errors.departmentCode ? "is-invalid" : ""
                      }`}
                      name="departmentCode"
                      value={formData.departmentCode}
                      onChange={handleChange}
                      placeholder="Enter department code"
                      maxLength={100}
                      disabled={loading}
                    />
                    {errors.departmentCode && (
                      <div className="error-message">
                        {errors.departmentCode}
                      </div>
                    )}
                  </div>
                </div>

                <div className="info-alert">
                  <i className="bi bi-info-circle"></i>
                  <small>Update department information</small>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-custom"></span>
                      Updating...
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
      </div>
    </>
  );
};

export default EditDepartmentModal;