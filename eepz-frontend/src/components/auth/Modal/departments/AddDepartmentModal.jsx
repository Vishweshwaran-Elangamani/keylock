import { useState, useEffect, useRef, useMemo } from "react";
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
    parentDepartmentId: "",
    hodEmployeeId: "",
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
      const deptResponse = await departmentService.getActiveDepartments();
      if (deptResponse.success) {
        setDepartments(deptResponse.data || []);
      }
      const usersResponse = await userService.getAllUsers();
      if (usersResponse.success) {
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const statusOptions = useMemo(
    () => [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    []
  );

  const parentDepartmentOptions = useMemo(
    () => [
      { value: "", label: "-- None (Root Department) --" },
      ...departments.map((dept) => ({
        value: dept.departmentId.toString(),
        label: `${dept.departmentName} (${dept.departmentCode})`,
      })),
    ],
    [departments]
  );

  const hodOptions = useMemo(
    () => [
      { value: "", label: "-- Select HOD --" },
      ...departmentHeads.map((emp) => ({
        value: emp.employeeId.toString(),
        label: `${emp.firstName} ${emp.lastName} (${emp.employeeCompanyId})`,
      })),
    ],
    [departmentHeads]
  );

  const CustomDropdown = ({
    options,
    value,
    onChange,
    placeholder,
    error,
    name,
    disabled,
    forceUpward = false,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(forceUpward);
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
      if (forceUpward) {
        setOpenUpward(true);
        return;
      }
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 250;
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }, [isOpen, forceUpward]);

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div
        ref={dropdownRef}
        className={`adm-custom-dropdown ${error ? "adm-error" : ""} ${
          disabled ? "adm-disabled" : ""
        }`}
        tabIndex={disabled ? -1 : 0}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        <div className="adm-custom-selected" onClick={toggleDropdown}>
          <span className={!selectedOption ? "adm-placeholder-text" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="adm-custom-arrow"></span>
        </div>
        {isOpen && (
          <div
            className={`adm-custom-menu ${openUpward ? "adm-menu-upward" : ""}`}
          >
            {options.map((option, index) => (
              <div
                key={`${name}-${index}-${option.value}`}
                className={`adm-custom-option ${
                  value === option.value ? "adm-custom-option-active" : ""
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
          <form onSubmit={handleSubmit} autoComplete="off" className="adm-form">
            <div className="adm-modal-body">
              {loadingDropdowns ? (
                <div className="adm-loading-container">
                  <Spinner animation="border" size="sm" />
                  <p className="adm-loading-text">Loading form data...</p>
                </div>
              ) : (
                <div className="adm-form-content">
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Department Name{" "}
                        <span className="adm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="departmentName"
                        placeholder="e.g., Human Resources"
                        value={formData.departmentName || ""}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength={100}
                        autoFocus
                        className={`adm-form-input ${
                          errors.departmentName ? "adm-input-error" : ""
                        }`}
                      />
                      {errors.departmentName && (
                        <div className="adm-form-error">
                          {errors.departmentName}
                        </div>
                      )}
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Department Code{" "}
                        <span className="adm-required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="departmentCode"
                        placeholder="e.g., HR-001"
                        value={formData.departmentCode || ""}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength={20}
                        className={`adm-form-input adm-form-input-uppercase ${
                          errors.departmentCode ? "adm-input-error" : ""
                        }`}
                      />
                      {errors.departmentCode && (
                        <div className="adm-form-error">
                          {errors.departmentCode}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="adm-form-row-full">
                    <label className="adm-form-label">Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief description of the department"
                      value={formData.description || ""}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={255}
                      rows={2}
                      className="adm-form-input adm-form-textarea"
                    />
                  </div>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Status <span className="adm-required-asterisk">*</span>
                      </label>
                      <CustomDropdown
                        name="status"
                        options={statusOptions}
                        value={formData.status || ""}
                        onChange={handleChange}
                        placeholder="Select Status"
                        disabled={loading}
                        error={errors.status}
                        forceUpward={false}
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Parent Department
                      </label>
                      <CustomDropdown
                        name="parentDepartmentId"
                        options={parentDepartmentOptions}
                        value={formData.parentDepartmentId || ""}
                        onChange={handleChange}
                        placeholder="-- None (Root Department) --"
                        disabled={loading}
                        error={errors.parentDepartmentId}
                        forceUpward={true}
                      />
                    </div>
                  </div>
                  <div className="adm-form-row-full">
                    <label className="adm-form-label">
                      Head of Department (HOD)
                    </label>
                    <CustomDropdown
                      name="hodEmployeeId"
                      options={hodOptions}
                      value={formData.hodEmployeeId || ""}
                      onChange={handleChange}
                      placeholder="-- Select HOD --"
                      disabled={loading}
                      error={errors.hodEmployeeId}
                      forceUpward={true}
                    />
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
            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="adm-btn-cancel"
              >
                <i className="bi bi-x-circle"></i>
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
