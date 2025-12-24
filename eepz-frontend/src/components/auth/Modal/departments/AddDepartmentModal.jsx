import { useState, useEffect } from "react";
import { Spinner, CloseButton } from "react-bootstrap";
import departmentService from "../../../../services/auth/departmentService";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/department/AddDepartmentModal.css";

const AddDepartmentModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
    description: "",
    status: "Active",
    parentDepartmentId: null,
    hodEmployeeId: null,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    if (show) {
      fetchDropdownData();
    }
  }, [show]);

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      // Fetch active departments for parent dropdown
      const deptResponse = await departmentService.getActiveDepartments();
      if (deptResponse.success) {
        setDepartments(deptResponse.data || []);
      }

      // Fetch ALL users and filter for Department Head role on frontend
      const usersResponse = await userService.getAllUsers();
      if (usersResponse.success) {
        // Filter only users with Department Head role (RoleCode === "DEPT_HEAD")
        const filteredHeads = (usersResponse.data || []).filter(
          (user) =>
            user.roleName === "Department Head" && user.status === "Active"
        );
        setDepartmentHeads(filteredHeads);
      }
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      toast.error("Failed to load dropdown data");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    } else if (formData.departmentName.trim().length < 3) {
      newErrors.departmentName =
        "Department name must be at least 3 characters";
    }

    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = "Department code is required";
    } else if (formData.departmentCode.trim().length < 2) {
      newErrors.departmentCode =
        "Department code must be at least 2 characters";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.departmentCode.trim())) {
      newErrors.departmentCode =
        "Department code can only contain letters, numbers, hyphens and underscores";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Creating department...");

      const payload = {
        departmentName: formData.departmentName.trim(),
        departmentCode: formData.departmentCode.trim().toUpperCase(),
        description: formData.description.trim() || null,
        status: formData.status,
        parentDepartmentId: formData.parentDepartmentId
          ? parseInt(formData.parentDepartmentId)
          : null,
        hodEmployeeId: formData.hodEmployeeId
          ? parseInt(formData.hodEmployeeId)
          : null,
      };

      const response = await departmentService.createDepartment(payload);

      if (response.success) {
        toast.dismiss();
        toast.success("Department created successfully");
        onSuccess();
      } else {
        toast.dismiss();
        toast.error(response.message || "Failed to create department");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Error creating department");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="adm-backdrop" onClick={onClose} />

      <div className="adm-modal-container">
        <div className="adm-modal-dialog">
          {/* Header */}
          <div className="adm-modal-header">
            <div className="adm-header-title">
              <i className="bi bi-plus-circle"></i>
              Add Department
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              className="adm-close-button"
              disabled={loading}
            />
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} autoComplete="off" className="adm-form">
            <div className="adm-modal-body">
              {loadingDropdowns ? (
                <div className="adm-loading-container">
                  <Spinner animation="border" size="sm" />
                  <p className="adm-loading-text">Loading form data...</p>
                </div>
              ) : (
                <div className="adm-form-content">
                  {/* Row 1: Department Name & Code */}
                  <div className="adm-form-row">
                    {/* Department Name */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Department Name{" "}
                        <span className="adm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="departmentName"
                        placeholder="e.g., Human Resources"
                        value={formData.departmentName}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength={100}
                        autoFocus
                        className={`adm-form-input ${
                          errors.departmentName ? "error" : ""
                        }`}
                      />
                      {errors.departmentName && (
                        <div className="adm-form-error">
                          {errors.departmentName}
                        </div>
                      )}
                    </div>

                    {/* Department Code */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Department Code{" "}
                        <span className="adm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="departmentCode"
                        placeholder="e.g., HR-001"
                        value={formData.departmentCode}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength={20}
                        className={`adm-form-input adm-form-input-uppercase ${
                          errors.departmentCode ? "error" : ""
                        }`}
                      />
                      {errors.departmentCode && (
                        <div className="adm-form-error">
                          {errors.departmentCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <div className="adm-form-row-full">
                    <label className="adm-form-label">Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief description of the department"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={255}
                      rows={2}
                      className="adm-form-input adm-form-textarea"
                    />
                  </div>

                  {/* Row 3: Status & Parent Department */}
                  <div className="adm-form-row">
                    {/* Status */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Status <span className="adm-required-asterisk">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                        className="adm-form-input"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Parent Department */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Parent Department
                      </label>
                      <select
                        name="parentDepartmentId"
                        value={formData.parentDepartmentId || ""}
                        onChange={handleChange}
                        disabled={loading}
                        className="adm-form-input"
                      >
                        <option value="">-- None (Root Department) --</option>
                        {departments.map((dept) => (
                          <option
                            key={dept.departmentId}
                            value={dept.departmentId}
                          >
                            {dept.departmentName} ({dept.departmentCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: HOD (Department Heads Only - Frontend Filtered) */}
                  <div className="adm-form-row-full">
                    <label className="adm-form-label">
                      Head of Department (HOD)
                    </label>
                    <select
                      name="hodEmployeeId"
                      value={formData.hodEmployeeId || ""}
                      onChange={handleChange}
                      disabled={loading}
                      className="adm-form-input"
                    >
                      <option value="">-- Select HOD --</option>
                      {departmentHeads.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} (
                          {emp.employeeCompanyId})
                        </option>
                      ))}
                    </select>
                    {departmentHeads.length === 0 && !loadingDropdowns && (
                      <div className="adm-info-message">
                        <i className="bi bi-info-circle"></i> No employees with
                        "Department Head" role found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="adm-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDropdowns}
                className="adm-btn-submit"
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
