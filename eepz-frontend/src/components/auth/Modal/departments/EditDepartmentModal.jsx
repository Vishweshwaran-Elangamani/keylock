import { useState, useEffect } from "react";
import { Spinner, CloseButton } from "react-bootstrap";
import departmentService from "../../../../services/auth/departmentService";
import userService from "../../../../services/auth/userService";
import { toast } from "sonner";

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
          (user) => user.roleName === "Department Head"  && user.status === "Active"
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
          formData.parentDepartmentId === "" || formData.parentDepartmentId === null
            ? null
            : parseInt(formData.parentDepartmentId),
        hodEmployeeId: 
          formData.hodEmployeeId === "" || formData.hodEmployeeId === null
            ? null
            : parseInt(formData.hodEmployeeId),
      };

      console.log("✅ Update Payload (All Fields):", payload);

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
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(39,35,92,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "550px",
          maxHeight: "90vh",
          overflowY: "auto",
          zIndex: 1050,
        }}
      >
        <div
          style={{
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="bi bi-pencil-square"></i>
              Edit Department
            </div>
            <CloseButton
              onClick={onClose}
              variant="white"
              style={{ filter: "brightness(0) invert(1)", opacity: 1 }}
              disabled={loading}
            />
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ margin: 0 }}>
            <div style={{ padding: "16px 15px", background: "#fff" }}>
              {loadingDropdowns ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Spinner animation="border" size="sm" />
                  <p style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                    Loading form data...
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Row 1: Department Name & Code (READ-ONLY) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={labelStyle}>Department Name</label>
                      <input
                        type="text"
                        value={formData.departmentName}
                        disabled
                        style={{
                          ...inputStyle,
                          background: "#f1f5f9",
                          color: "#64748b",
                          cursor: "not-allowed",
                        }}
                      />
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        <i className="bi bi-lock-fill"></i> Cannot be edited
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={labelStyle}>Department Code</label>
                      <input
                        type="text"
                        value={formData.departmentCode}
                        disabled
                        style={{
                          ...inputStyle,
                          background: "#f1f5f9",
                          color: "#64748b",
                          cursor: "not-allowed",
                          textTransform: "uppercase",
                        }}
                      />
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        <i className="bi bi-lock-fill"></i> Cannot be edited
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Description (EDITABLE) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief description of the department"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={255}
                      rows={2}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "60px",
                      }}
                    />
                  </div>

                  {/* Row 3: Status & Parent Department (EDITABLE) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={labelStyle}>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                        style={inputStyle}
                      >
                        <option value="Active">✅ Active</option>
                        <option value="Inactive">⏸️ Inactive</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={labelStyle}>Parent Department</label>
                      <select
                        name="parentDepartmentId"
                        value={formData.parentDepartmentId}
                        onChange={handleChange}
                        disabled={loading}
                        style={inputStyle}
                      >
                        <option value="">🏢 None (Root Department)</option>
                        {departments.map((dept) => (
                          <option key={dept.departmentId} value={dept.departmentId}>
                            {dept.departmentName} ({dept.departmentCode})
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        <i className="bi bi-info-circle"></i> Select "None" to remove parent
                      </div>
                    </div>
                  </div>

                  {/* Row 4: HOD (EDITABLE - Department Heads Only) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <label style={labelStyle}>Head of Department (HOD)</label>
                    <select
                      name="hodEmployeeId"
                      value={formData.hodEmployeeId}
                      onChange={handleChange}
                      disabled={loading}
                      style={inputStyle}
                    >
                      <option value="">👤 None (No HOD Assigned)</option>
                      {departmentHeads.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCompanyId})
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                      <i className="bi bi-info-circle"></i> Select "None" to remove current HOD
                    </div>
                    {departmentHeads.length === 0 && !loadingDropdowns && (
                      <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                        <i className="bi bi-exclamation-triangle"></i> No employees with "Department Head" role found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={cancelButtonStyle}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDropdowns}
                style={submitButtonStyle}
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

// Shared Styles
const labelStyle = {
  fontWeight: 600,
  fontSize: 13,
  color: "#334155",
  marginBottom: 3,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  background: "#fff",
  color: "#22223b",
};

const cancelButtonStyle = {
  background: "#6c757d",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  padding: "7px 12px",
  fontSize: 12,
  borderRadius: 5,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.2s ease",
};

const submitButtonStyle = {
  background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  padding: "7px 12px",
  fontSize: 12,
  borderRadius: 5,
  boxShadow: "0 2px 8px rgba(151, 36, 126, 0.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export default EditDepartmentModal;
