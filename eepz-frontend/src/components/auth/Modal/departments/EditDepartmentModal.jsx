import { useState, useEffect } from "react";
import { Spinner, CloseButton } from "react-bootstrap";
import departmentService from "../../../../services/auth/departmentService";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
import "../../../../styles/auth/department/EditDepartmentModal.css";

const EditDepartmentModal = ({ show, department, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    departmentId: "",
    departmentName: "",
    departmentCode: "",
    description: "",
    status: "Active",
    parentDepartmentId: "",
    hodEmployeeId: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    if (department && show) {
      setFormData({
        departmentId: department.departmentId || "",
        departmentName: department.departmentName || "",
        departmentCode: department.departmentCode || "",
        description: department.description || "",
        status: department.status || "Active",
        parentDepartmentId: department.parentDepartmentId ?? "",
        hodEmployeeId: department.hodEmployeeId ?? "",
      });
      setErrors({});
      fetchDropdownData();
    }
  }, [department, show]);

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      // Fetch active departments (exclude current department)
      const deptResponse = await departmentService.getActiveDepartments();
      if (deptResponse.success) {
        const filteredDepts = (deptResponse.data || []).filter(
          (dept) => dept.departmentId !== department.departmentId
        );
        setDepartments(filteredDepts);
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
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      toast.loading("Updating department...");

      // Build payload - ALWAYS send all editable fields
      const payload = {
        departmentId: formData.departmentId,
        description: formData.description.trim() || null,
        status: formData.status,
        // IMPORTANT: Always send these fields (even if unchanged)
        parentDepartmentId:
          formData.parentDepartmentId === "" ||
          formData.parentDepartmentId === null
            ? null
            : parseInt(formData.parentDepartmentId),
        hodEmployeeId:
          formData.hodEmployeeId === "" || formData.hodEmployeeId === null
            ? null
            : parseInt(formData.hodEmployeeId),
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
      <div className="edm-backdrop" onClick={onClose} />

      <div className="edm-modal-container">
        <div className="edm-modal-dialog">
          {/* Header */}
          <div className="edm-modal-header">
            <div className="edm-header-title">
              <i className="bi bi-pencil-square"></i>
              Edit Department
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              className="edm-close-button"
              disabled={loading}
            />
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} autoComplete="off" className="edm-form">
            <div className="edm-modal-body">
              {loadingDropdowns ? (
                <div className="edm-loading-container">
                  <Spinner animation="border" size="sm" />
                  <p className="edm-loading-text">Loading form data...</p>
                </div>
              ) : (
                <div className="edm-form-content">
                  {/* Row 1: Department Name & Code (READ-ONLY) */}
                  <div className="edm-form-row">
                    <div className="edm-form-group">
                      <label className="edm-form-label">Department Name</label>
                      <input
                        type="text"
                        value={formData.departmentName}
                        disabled
                        className="edm-form-input edm-form-input-readonly"
                      />
                      <div className="edm-readonly-hint">
                        <i className="bi bi-lock-fill"></i> Cannot be edited
                      </div>
                    </div>

                    <div className="edm-form-group">
                      <label className="edm-form-label">Department Code</label>
                      <input
                        type="text"
                        value={formData.departmentCode}
                        disabled
                        className="edm-form-input edm-form-input-readonly edm-form-input-uppercase"
                      />
                      <div className="edm-readonly-hint">
                        <i className="bi bi-lock-fill"></i> Cannot be edited
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Description (EDITABLE) */}
                  <div className="edm-form-row-full">
                    <label className="edm-form-label">Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief description of the department"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={255}
                      rows={2}
                      className="edm-form-input edm-form-textarea"
                    />
                  </div>

                  {/* Row 3: Status & Parent Department (EDITABLE) */}
                  <div className="edm-form-row">
                    <div className="edm-form-group">
                      <label className="edm-form-label">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                        className="edm-form-input"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="edm-form-group">
                      <label className="edm-form-label">
                        Parent Department
                      </label>
                      <select
                        name="parentDepartmentId"
                        value={formData.parentDepartmentId}
                        onChange={handleChange}
                        disabled={loading}
                        className="edm-form-input"
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
                      <div className="edm-info-hint">
                        <i className="bi bi-info-circle"></i> Select "None" to
                        remove parent
                      </div>
                    </div>
                  </div>

                  {/* Row 4: HOD (EDITABLE - Department Heads Only) */}
                  <div className="edm-form-row-full">
                    <label className="edm-form-label">
                      Head of Department (HOD)
                    </label>
                    <select
                      name="hodEmployeeId"
                      value={formData.hodEmployeeId}
                      onChange={handleChange}
                      disabled={loading}
                      className="edm-form-input"
                    >
                      <option value="">-- None (No HOD Assigned) --</option>
                      {departmentHeads.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} (
                          {emp.employeeCompanyId})
                        </option>
                      ))}
                    </select>
                    <div className="edm-info-hint">
                      <i className="bi bi-info-circle"></i> Select "None" to
                      remove current HOD
                    </div>
                    {departmentHeads.length === 0 && !loadingDropdowns && (
                      <div className="edm-warning-hint">
                        <i className="bi bi-exclamation-triangle"></i> No
                        employees with "Department Head" role found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="edm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="edm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDropdowns}
                className="edm-btn-submit"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" />
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
    </>
  );
};

export default EditDepartmentModal;
