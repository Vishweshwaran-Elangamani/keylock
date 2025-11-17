import { useState } from "react";
import departmentService from "../../../../services/auth/departmentService";
import {toast} from "sonner";
import "../../../../styles/auth/department/AddDepartmentModal.css";

const AddDepartmentModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
    description: "",
    managerUserId: "",
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

    // Department Name Validation
    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (formData.departmentName.trim().length < 3) {
      newErrors.departmentName =
        "Department name must be at least 3 characters";
    }

    // Department Code Validation
    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = "Department code is required";
    } else if (formData.departmentCode.trim().length < 2) {
      newErrors.departmentCode =
        "Department code must be at least 2 characters";
    }

    // Description Validation
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
      const payload = {
        ...formData,
        managerUserId: formData.managerUserId
          ? parseInt(formData.managerUserId)
          : null,
      };

      const response = await departmentService.createDepartment(payload);

      if (response.success) {

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
            {/* Modal Header */}
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

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body-add-dept">
                <div className="form-grid-add-dept">
                  {/* Department Name */}
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

                  {/* Department Code */}
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

                  {/* Description */}
                  <div className="form-group-add-dept form-group-full-add-dept">
                    <label className="form-label-add-dept">
                      Description{" "}
                      <span className="required-mark-add-dept">*</span>
                    </label>
                    <textarea
                      className={`form-textarea-add-dept ${
                        errors.description ? "is-invalid" : ""
                      }`}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter department description"
                      rows={3}
                      maxLength={255}
                    ></textarea>
                    {errors.description && (
                      <div className="error-message-add-dept">
                        {errors.description}
                      </div>
                    )}
                  </div>

                  {/* Manager User ID */}
                  <div className="form-group-add-dept form-group-full-add-dept">
                    <label className="form-label-add-dept">
                      Manager User ID{" "}
                      <span className="optional-text-add-dept">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      className={`form-input-add-dept ${
                        errors.managerUserId ? "is-invalid" : ""
                      }`}
                      name="managerUserId"
                      value={formData.managerUserId}
                      onChange={handleChange}
                      placeholder="Enter manager user ID"
                      min="1"
                    />
                    {errors.managerUserId && (
                      <div className="error-message-add-dept">
                        {errors.managerUserId}
                      </div>
                    )}
                    <small className="helper-text-add-dept">
                      Leave empty if no manager assigned yet
                    </small>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
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
