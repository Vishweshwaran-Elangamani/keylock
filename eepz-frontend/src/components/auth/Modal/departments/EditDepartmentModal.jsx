import { useState, useEffect, useRef } from "react";
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
        parentDepartmentId: department.parentDepartmentId 
          ? department.parentDepartmentId.toString() 
          : "",
        hodEmployeeId: department.hodEmployeeId 
          ? department.hodEmployeeId.toString() 
          : "",
      });
      setErrors({});
      fetchDropdownData();
    }
  }, [department, show]);

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);

      const deptResponse = await departmentService.getActiveDepartments();
      if (deptResponse.success) {
        const filteredDepts = (deptResponse.data || []).filter(
          (dept) => dept.departmentId !== department.departmentId
        );
        setDepartments(filteredDepts);
      }

      const usersResponse = await userService.getAllUsers();
      if (usersResponse.success) {
        const allUsers = usersResponse.data || [];
        
        const filteredHeads = allUsers.filter((user) => {
          const hasRole = user.roleName && 
                         user.roleName.toLowerCase() === "department head";
          const isActive = user.status === "Active";
          return hasRole && isActive;
        });
        
        setDepartmentHeads(filteredHeads);
      }
    } catch (error) {
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

  const CustomDropdown = ({
    options,
    value,
    onChange,
    placeholder,
    error,
    name,
    disabled,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (selectedValue) => {
      onChange({ target: { name, value: selectedValue } });
      setIsOpen(false);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizedValue = value === null || value === undefined ? "" : value.toString();
    const selectedOption = options.find((opt) => opt.value.toString() === normalizedValue);

    return (
      <div
        ref={dropdownRef}
        className={`edm-custom-dropdown ${error ? "edm-error" : ""} ${
          disabled ? "edm-disabled" : ""
        }`}
        tabIndex={disabled ? -1 : 0}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        <div className="edm-custom-selected" onClick={toggleDropdown}>
          <span className={!selectedOption ? "edm-placeholder-text" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="edm-custom-arrow"></span>
        </div>

        {isOpen && (
          <div className="edm-custom-menu">
            {options.map((option) => (
              <div
                key={option.value || "empty"}
                className={`edm-custom-option ${
                  normalizedValue === option.value.toString() ? "edm-custom-option-active" : ""
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const parentDepartmentOptions = [
    { value: "", label: "-- None (Root Department) --" },
    ...departments.map((dept) => ({
      value: dept.departmentId.toString(),
      label: `${dept.departmentName} (${dept.departmentCode})`,
    })),
  ];

  const hodOptions = [
    { value: "", label: "-- None (No HOD Assigned) --" },
    ...departmentHeads.map((emp) => ({
      value: emp.employeeId.toString(),
      label: `${emp.firstName} ${emp.lastName} (${emp.employeeCompanyId})`,
    })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      toast.loading("Updating department...");

      const payload = {
        departmentId: formData.departmentId,
        description: formData.description.trim() || null,
        status: formData.status,
        parentDepartmentId:
          formData.parentDepartmentId === "" || formData.parentDepartmentId === null
            ? null
            : parseInt(formData.parentDepartmentId, 10),
        hodEmployeeId:
          formData.hodEmployeeId === "" || formData.hodEmployeeId === null
            ? null
            : parseInt(formData.hodEmployeeId, 10),
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

          <form onSubmit={handleSubmit} autoComplete="off" className="edm-form">
            <div className="edm-modal-body">
              {loadingDropdowns ? (
                <div className="edm-loading-container">
                  <Spinner animation="border" size="sm" />
                  <p className="edm-loading-text">Loading form data...</p>
                </div>
              ) : (
                <div className="edm-form-content">
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

                  <div className="edm-form-row">
                    <div className="edm-form-group">
                      <label className="edm-form-label">Status</label>
                      <CustomDropdown
                        name="status"
                        options={statusOptions}
                        value={formData.status}
                        onChange={handleChange}
                        placeholder="Select Status"
                        disabled={loading}
                      />
                    </div>

                    <div className="edm-form-group">
                      <label className="edm-form-label">
                        Parent Department
                      </label>
                      <CustomDropdown
                        name="parentDepartmentId"
                        options={parentDepartmentOptions}
                        value={formData.parentDepartmentId}
                        onChange={handleChange}
                        placeholder="-- None (Root Department) --"
                        disabled={loading}
                      />
                      <div className="edm-info-hint">
                        <i className="bi bi-info-circle"></i> Select "None" to
                        remove parent
                      </div>
                    </div>
                  </div>

                  <div className="edm-form-row-full">
                    <label className="edm-form-label">
                      Head of Department (HOD)
                    </label>
                    <CustomDropdown
                      name="hodEmployeeId"
                      options={hodOptions}
                      value={formData.hodEmployeeId}
                      onChange={handleChange}
                      placeholder="-- None (No HOD Assigned) --"
                      disabled={loading}
                    />
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
