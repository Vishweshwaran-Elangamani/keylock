

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
        className={`edm-custom-dropdown ${isOpen ? "active" : ""} ${
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
          className="edm-custom-dropdown-selected"
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
            className={`edm-custom-dropdown-text ${
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
            className={`edm-custom-dropdown-arrow ${isOpen ? "open" : ""}`}
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
            className="edm-custom-dropdown-menu"
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
                className={`edm-custom-dropdown-option ${
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

                  {/* Row 3: Status & Parent Department (EDITABLE - CUSTOM DROPDOWNS) */}
                  <div className="edm-form-row">
                    {/* Status - CUSTOM DROPDOWN */}
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

                    {/* Parent Department - CUSTOM DROPDOWN */}
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

                  {/* Row 4: HOD (EDITABLE - CUSTOM DROPDOWN) */}
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
