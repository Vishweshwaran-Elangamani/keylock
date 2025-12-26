

import { useState, useEffect, useRef } from "react";
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

  // ========================
  // CUSTOM DROPDOWN COMPONENT
  // ========================

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

    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div
        ref={dropdownRef}
        style={{
          position: "relative",
          width: "100%",
          userSelect: "none",
          zIndex: isOpen ? 1000 : 10,
        }}
        className={`adm-custom-dropdown ${isOpen ? "active" : ""} ${
          error ? "error" : ""
        } ${disabled ? "disabled" : ""}`}
      >
        <div
          style={{
            padding: "8px 2rem 8px 10px",
            display: "flex",
            alignItems: "center",
            position: "relative",
            fontSize: "13px",
            border: `1px solid ${
              error ? "#dc3545" : isOpen ? "#27235c" : "#cbd5e1"
            }`,
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
            minHeight: "37px",
            color: "#334155",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          className="adm-custom-dropdown-selected"
          onClick={toggleDropdown}
          tabIndex={disabled ? -1 : 0}
        >
          <span
            style={{
              flex: 1,
              color: selectedOption ? "#334155" : "#9ca3af",
              textAlign: "left",
              fontWeight: 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            className={`adm-custom-dropdown-text ${
              !selectedOption ? "placeholder" : ""
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: isOpen
                ? "translateY(-25%) rotate(-135deg)"
                : "translateY(-50%) rotate(45deg)",
              width: "7px",
              height: "7px",
              borderRight: "2px solid #64748b",
              borderBottom: "2px solid #64748b",
              pointerEvents: "none",
              transition: "transform 0.2s ease",
            }}
            className={`adm-custom-dropdown-arrow ${isOpen ? "open" : ""}`}
          ></span>
        </div>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
              zIndex: 10000,
              maxHeight: "220px",
              overflowY: "auto",
            }}
            className="adm-custom-dropdown-menu"
          >
            {options.map((option) => (
              <div
                key={option.value}
                style={{
                  padding: "9px 12px",
                  fontSize: "13px",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  backgroundColor: "#ffffff",
                  transition: "all 0.15s ease",
                  borderBottom: "1px solid #f1f5f9",
                }}
                className={`adm-custom-dropdown-option ${
                  value === option.value ? "selected" : ""
                }`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#27235c";
                  e.target.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ffffff";
                  e.target.style.color = "#334155";
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ========================
  // DROPDOWN OPTIONS
  // ========================

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
    { value: "", label: "-- Select HOD --" },
    ...departmentHeads.map((emp) => ({
      value: emp.employeeId.toString(),
      label: `${emp.firstName} ${emp.lastName} (${emp.employeeCompanyId})`,
    })),
  ];

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

                  {/* Row 3: Status & Parent Department - CUSTOM DROPDOWNS */}
                  <div className="adm-form-row">
                    {/* Status - CUSTOM DROPDOWN */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        Status <span className="adm-required-asterisk">*</span>
                      </label>
                      <CustomDropdown
                        name="status"
                        options={statusOptions}
                        value={formData.status}
                        onChange={handleChange}
                        placeholder="Select Status"
                        disabled={loading}
                      />
                    </div>

                    {/* Parent Department - CUSTOM DROPDOWN */}
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
                      />
                    </div>
                  </div>

                  {/* Row 4: HOD - CUSTOM DROPDOWN */}
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
