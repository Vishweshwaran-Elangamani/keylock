import { useState, useEffect } from "react";
import nominationService from "../../../services/internal/nominationService";
import userService from "../../../services/auth/userService";
import { toast } from "sonner";

const ManagerNominateModal = ({
  show,
  onHide,
  opportunity,
  onNominationSubmitted,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    justification: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      fetchEmployees();
    }
  }, [show]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);

      const userIdStr = localStorage.getItem("userId");

      if (!userIdStr) {
        console.error("No userId found in localStorage");
        toast.error("User ID not found. Please login again.");
        setEmployees([]);
        return;
      }

      const managerId = parseInt(userIdStr);

      if (isNaN(managerId) || managerId <= 0) {
        console.error("Invalid manager ID:", managerId);
        toast.error("Invalid user ID. Please login again.");
        setEmployees([]);
        return;
      }

      const response = await userService.getEmployeesByManager(managerId);

      const employeeList = response.data || response || [];

      setEmployees(employeeList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

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

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select a team member";
    }

    if (!formData.justification.trim()) {
      newErrors.justification = "Justification is required";
    } else if (formData.justification.trim().length < 50) {
      newErrors.justification = "Justification must be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        opportunityId: opportunity.opportunityId,
        nomineeEmployeeId: parseInt(formData.employeeId),
        justification: formData.justification.trim(),
        nominationType: "Manager",
      };

      const response = await nominationService.managerNominate(payload);

      if (response.success) {
        toast.success("Team member nominated successfully!");
        onNominationSubmitted();
        onHide();
      } else {
        toast.error(response.message || "Failed to nominate team member");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to nominate team member");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Custom Backdrop with Blur Effect */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(39, 35, 92, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onHide}
      />

      {/* Modal Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '20px'
        }}
      >
        {/* Modal Dialog - Compact Size from Image */}
        <div
          style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Navy Blue Theme (AddPolicy) */}
          <div
            style={{
              background: '#27235C',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-person-plus"></i>
              Nominate Team Member
            </div>
            <button
              onClick={onHide}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Form - Scrollable Body */}
          <form 
            onSubmit={handleSubmit}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1,
              overflow: 'hidden'
            }}
          >
            {/* Modal Body - Compact Padding */}
            <div
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff',
                maxHeight: 'calc(85vh - 120px)'
              }}
            >
              {/* Info Section - Compact */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f0f9ff',
                  padding: '12px 16px',
                  marginBottom: '16px'
                }}
              >
                <p style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  <strong style={{ fontWeight: '600' }}>Opportunity:</strong> {opportunity.opportunityName}
                </p>
                <p style={{ fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                  <strong style={{ fontWeight: '600' }}>Department:</strong> {opportunity.departmentName}
                </p>
                <p style={{ fontSize: '13px', color: '#334155', marginBottom: 0 }}>
                  <strong style={{ fontWeight: '600' }}>Deadline:</strong>{" "}
                  {new Date(opportunity.deadline).toLocaleDateString()}
                </p>
              </div>

              {/* Select Team Member */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Select Team Member{" "}
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={loadingEmployees}
                  style={{
                    width: '100%',
                    border: errors.employeeId ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    cursor: loadingEmployees ? 'not-allowed' : 'pointer',
                    backgroundColor: '#ffffff',
                    color: '#334155'
                  }}
                  onFocus={(e) => {
                    if (!errors.employeeId) {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.employeeId) {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <option value="" disabled>
                    {loadingEmployees
                      ? "Loading team members..."
                      : "-- Choose a team member --"}
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
                {errors.employeeId && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.employeeId}
                  </div>
                )}
              </div>

              {/* Justification Field */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Why is this team member a good fit?{" "}
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <textarea
                  name="justification"
                  placeholder="Explain why you believe this team member is perfect for this role..."
                  value={formData.justification}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  style={{
                    width: '100%',
                    border: errors.justification ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    resize: 'vertical',
                    minHeight: '100px',
                    maxHeight: '180px',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    if (!errors.justification) {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.justification) {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.justification && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.justification}
                  </div>
                )}
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  {formData.justification.length}/1000 characters
                  {formData.justification.length >= 50 && !errors.justification && (
                    <span style={{ color: '#22c55e', marginLeft: '8px' }}>
                      ✓ Minimum length met
                    </span>
                  )}
                </small>
              </div>
            </div>

            {/* Modal Footer - Compact */}
            <div
              style={{
                padding: '10px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              }}
            >
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onHide}
                disabled={loading}
                style={{
                  background: '#6c757d',
                  borderColor: '#6c757d',
                  color: '#ffffff',
                  fontWeight: '600',
                  padding: '7px 14px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#5a6268';
                    e.target.style.borderColor = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#6c757d';
                    e.target.style.borderColor = '#6c757d';
                  }
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>

              {/* Nominate Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '7px 14px',
                  fontWeight: '600',
                  fontSize: '13px',
                  borderRadius: '6px',
                  transition: 'all 0.12s ease',
                  boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        display: 'inline-block'
                      }}
                    />
                    Nominating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Nominate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Keyframe Animation for Spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default ManagerNominateModal;
