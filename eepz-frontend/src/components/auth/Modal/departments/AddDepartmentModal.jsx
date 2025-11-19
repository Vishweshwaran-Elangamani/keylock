import { useState } from "react";
import departmentService from "../../../../services/auth/departmentService";
import { toast } from "sonner";
import "../../../../styles/auth/department/AddDepartmentModal.css";

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
      <div className="modal-backdrop-add-dept"></div>
      <div className="modal-wrapper-add-dept">
        <div className="modal-dialog-add-dept">
          <div className="modal-content-add-dept">
            <div className="modal-header-add-dept">
              <h5 className="modal-title-add-dept">
                <i className="bi bi-plus-circle"></i>
                Add New Department
              </h5>
              <button
                type="button"
                className="modal-close-btn-add-dept"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body-add-dept">
                <div className="form-grid-add-dept">
                  <div className="form-group-add-dept">
                    <label className="form-label-add-dept">
                      Department Name{" "}
                      <span className="required-mark-add-dept">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input-add-dept ${
                        errors.departmentName ? "is-invalid" : ""
                      }`}
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleChange}
                      placeholder="Enter department name"
                      maxLength={100}
                    />
                    {errors.departmentName && (
                      <div className="error-message-add-dept">
                        {errors.departmentName}
                      </div>
                    )}
                  </div>

                  <div className="form-group-add-dept">
                    <label className="form-label-add-dept">
                      Department Code{" "}
                      <span className="required-mark-add-dept">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input-add-dept ${
                        errors.departmentCode ? "is-invalid" : ""
                      }`}
                      name="departmentCode"
                      value={formData.departmentCode}
                      onChange={handleChange}
                      placeholder="Enter department code"
                      maxLength={100}
                    />
                    {errors.departmentCode && (
                      <div className="error-message-add-dept">
                        {errors.departmentCode}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer-add-dept">
                <button
                  type="button"
                  className="btn-cancel-add-dept"
                  onClick={onClose}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-add-dept"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-add-dept"></span>
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
      </div>
    </>
  );
};

export default AddDepartmentModal;
