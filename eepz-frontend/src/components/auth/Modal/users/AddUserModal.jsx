import { useState, useEffect } from "react";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";
 
const AddUserModal = ({ show, onHide, onUserAdded, roles, departments }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeCompanyId: "",
    mobileNumber: "",
    dateOfBirthOfficial: "",
    gender: "",
    employmentType: "",
    employmentStatus: "Active",
    joiningDate: new Date().toISOString().split("T")[0],
    employeeType: "FullTime",
    roleId: "",
    departmentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
 
  useEffect(() => {
    const fetchNextEmployeeId = async () => {
      try {
        const response = await userService.getNextEmployeeCompanyId();
        if (response.success) {
          setFormData(prev => ({
            ...prev,
            employeeCompanyId: response.data
          }));
        }
      } catch (error) {
        setFormData(prev => ({
          ...prev,
          employeeCompanyId: ""
        }));
      }
    };
    if (show) fetchNextEmployeeId();
  }, [show]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeCompanyId") {
      if (value === "" || /^\d+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
 
  const validateForm = () => {
    const newErrors = {};
   
    // First Name validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2) newErrors.firstName = "First name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) newErrors.firstName = "First name must contain only letters";
 
    // Last Name validation
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2) newErrors.lastName = "Last name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) newErrors.lastName = "Last name must contain only letters";
 
    // Employee Company ID validation
    if (!formData.employeeCompanyId.trim()) newErrors.employeeCompanyId = "Employee Company ID is required";
    else if (!/^\d+$/.test(formData.employeeCompanyId.trim())) newErrors.employeeCompanyId = "Employee Company ID must contain only numbers";
    else {
      const idNumber = parseInt(formData.employeeCompanyId.trim());
      if (idNumber < 12560) newErrors.employeeCompanyId = "Employee Company ID must start from 12560 or higher";
      else if (idNumber > 999999) newErrors.employeeCompanyId = "Employee Company ID must be less than 1000000";
    }
 
    // Email validation
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = "Please enter a valid email address";
 
    // Mobile Number validation - NOW REQUIRED
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = "Phone number must start with 6-9 and be exactly 10 digits";
    }
 
    // Date of Birth validation - NOW REQUIRED
    if (!formData.dateOfBirthOfficial) {
      newErrors.dateOfBirthOfficial = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirthOfficial);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (dob > today) newErrors.dateOfBirthOfficial = "Date of birth cannot be in the future";
      else if (age < 18) newErrors.dateOfBirthOfficial = "User must be at least 18 years old";
      else if (age > 100) newErrors.dateOfBirthOfficial = "Please enter a valid date of birth";
    }
 
    // Gender validation - NOW REQUIRED
    if (!formData.gender) newErrors.gender = "Gender is required";
 
    // Employment Type validation - NOW REQUIRED
    if (!formData.employmentType) newErrors.employmentType = "Employment type is required";
 
    // Role validation
    if (!formData.roleId) newErrors.roleId = "Role is required";
   
    // Department validation
    if (!formData.departmentId) newErrors.departmentId = "Department is required";
   
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
        employeeCompanyId: formData.employeeCompanyId.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobileNumber: formData.mobileNumber.trim()
          ? `+91-${formData.mobileNumber.trim()}`
          : null,
        gender: formData.gender || null,
        dateOfBirthOfficial: formData.dateOfBirthOfficial || null,
        employmentType: formData.employmentType,
        employmentStatus: formData.employmentStatus,
        joiningDate: formData.joiningDate,
        employeeType: formData.employeeType,
        roleId: parseInt(formData.roleId),
        departmentId: parseInt(formData.departmentId),
        workLocation: null,
        noticePeriodDays: 30,
        confirmationDate: null,
        middleName: null,
        callingName: null,
        referredBy: null,
        dateOfBirthActual: null,
        alternateNumber: null,
        personalEmail: null,
        reportingManagerEmployeeId: null,
      };
      const response = await userService.createUser(payload);
      if (response.success) {
        toast.success("User created successfully! Temporary password sent to email.");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          employeeCompanyId: "",
          mobileNumber: "",
          dateOfBirthOfficial: "",
          gender: "",
          employmentType: "",
          employmentStatus: "Active",
          joiningDate: new Date().toISOString().split("T")[0],
          employeeType: "FullTime",
          roleId: "",
          departmentId: "",
        });
        onUserAdded?.();
        setTimeout(() => onHide(), 500);
      } else {
        toast.error(response.message || "Failed to create user");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to create user"
      );
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
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onHide}
      />
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "97%",
          maxWidth: "800px",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
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
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              color: "#fff", fontSize: 15, fontWeight: 600,
            }}>
              <i className="bi bi-person-plus-fill"></i>
              Add New User
            </div>
            <button
              type="button"
              onClick={onHide}
              disabled={loading}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            ><i className="bi bi-x-lg"></i></button>
          </div>
          {/* BODY/FORM */}
          <form onSubmit={handleSubmit} style={{ margin: 0 }}>
            <div style={{ padding: "14px 15px 6px 15px", background: "#fff", textAlign: "left"}}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {/* First Name */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    First Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    maxLength={100}
                    style={{
                      width: "100%",
                      border: errors.firstName ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.firstName && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.firstName}</div>}
                </div>
                {/* Last Name */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Last Name <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    maxLength={100}
                    style={{
                      width: "100%",
                      border: errors.lastName ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.lastName && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.lastName}</div>}
                </div>
                {/* Employee Company Id */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Employee ID <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="employeeCompanyId"
                    placeholder="e.g., 12560"
                    value={formData.employeeCompanyId}
                    onChange={handleChange}
                    maxLength={6}
                    style={{
                      width: "100%",
                      border: errors.employeeCompanyId ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.employeeCompanyId && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.employeeCompanyId}</div>}
                  <small style={{ color: "#64748b", fontSize: 11 }}>
                    Must be numeric and start from 12560 or higher
                  </small>
                </div>
                {/* Email */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Email <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email ID"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={255}
                    style={{
                      width: "100%",
                      border: errors.email ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.email && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.email}</div>}
                </div>
                {/* Mobile Number - NOW REQUIRED */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Mobile <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{
                      background: "#f3f4f6", border: "1px solid #cbd5e1",
                      borderRadius: "6px 0 0 6px",
                      color: "#64748b",
                      padding: "8px 6px 8px 10px", fontSize: 13
                    }}>+91</span>
                    <input
                      type="tel"
                      name="mobileNumber"
                      placeholder="Enter mobile number"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      maxLength={10}
                      style={{
                        borderTop: errors.mobileNumber ? "1px solid #dc3545" : "1px solid #cbd5e1",
                        borderRight: errors.mobileNumber ? "1px solid #dc3545" : "1px solid #cbd5e1",
                        borderBottom: errors.mobileNumber ? "1px solid #dc3545" : "1px solid #cbd5e1",
                        borderLeft: "none",
                        borderRadius: "0 6px 6px 0",
                        fontSize: 13,
                        background: "#fff",
                        color: "#22223b",
                        padding: "8px 9px",
                        width: "100%",
                      }}
                    />
                  </div>
                  {errors.mobileNumber && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.mobileNumber}</div>}
                  <small style={{ color: "#64748b", fontSize: 11 }}>Must start with 6-9 (10 digits)</small>
                </div>
                {/* Date of Birth - NOW REQUIRED */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Date of Birth <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirthOfficial"
                    placeholder="dd/mm/yyyy"
                    value={formData.dateOfBirthOfficial}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.dateOfBirthOfficial ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      padding: "8px 9px",
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                    }}
                  />
                  {errors.dateOfBirthOfficial && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.dateOfBirthOfficial}</div>}
                  <small style={{ color: "#64748b", fontSize: 11 }}>Must be 18+ years old</small>
                </div>
                {/* Gender - NOW REQUIRED */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Gender <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.gender ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px"
                    }}>
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="PreferNotToSay">Prefer not to say</option>
                  </select>
                  {errors.gender && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.gender}</div>}
                </div>
                {/* Employment Type - NOW REQUIRED */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Employment Type <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.employmentType ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px"
                    }}>
                    <option value="" disabled>Select Employment Type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Intern">Intern</option>
                    <option value="Probation">Probation</option>
                  </select>
                  {errors.employmentType && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.employmentType}</div>}
                </div>
                {/* Role - ✅ ADMIN ROLE EXCLUDED */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Role <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.roleId ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}>
                    <option value="" disabled>Select Role</option>
                    {roles.filter(role => role.roleName !== "Admin").map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.roleId}</div>}
                </div>
                {/* Department */}
                <div style={{ flex: 1, minWidth: "47%" }}>
                  <label style={{
                    fontWeight: 600, fontSize: 13, color: "#334155", marginBottom: 2, display: "block"
                  }}>
                    Department <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      border: errors.departmentId ? "1px solid #dc3545" : "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                      color: "#22223b",
                      padding: "8px 9px",
                    }}>
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && <div style={{ color: "#dc3545", fontSize: 11 }}>{errors.departmentId}</div>}
                </div>
              </div>
              {/* Info Alert */}
              <div style={{
                display: "flex", alignItems: "center", background: "#f1f5f9",
                color: "#64748b", borderRadius: 4, fontSize: 12, padding: "5px 8px", gap: 5, marginTop: 10
              }}>
                <i className="bi bi-info-circle"></i>
                <small>Password is automatically generated and sent to user's email</small>
              </div>
            </div>
            {/* FOOTER */}
            <div style={{
              padding: "10px 15px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
            }}>
              <button
                type="button"
                onClick={onHide}
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
                <i className="bi bi-x-circle"></i> Cancel
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
                  boxShadow: "0 2px 8px rgba(151,36,126,0.25)",
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
                    <span style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff",
                      borderTop: "2px solid #E01950",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      marginRight: 6,
                    }} />
                    Adding...
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i> Add User
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
 
export default AddUserModal;
