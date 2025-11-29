import { useState, useMemo } from "react";
import { CloseButton } from "react-bootstrap";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";
import { toast } from "sonner";

const CreateOpportunityModal = ({
  show,
  onHide,
  onOpportunityCreated,
  departments,
}) => {
  const [formData, setFormData] = useState({
    opportunityName: "",
    departmentId: "",
    description: "",
    requirements: "",
    eligibilityCriteria: "",
    deadline: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const min = today.toISOString().split("T")[0];
    const currentMonth = today.getMonth();
    const aprilDeadlineYear = currentMonth >= 3 ? currentYear + 1 : currentYear;
    const max = `${aprilDeadlineYear}-04-30`;
    return { minDate: min, maxDate: max };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
    } else if (formData.opportunityName.trim().length < 5) {
      newErrors.opportunityName = "Opportunity name must be at least 5 characters";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = "Requirements are required";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        newErrors.deadline = "Deadline cannot be in the past";
      }

      const maxDeadline = new Date(maxDate);
      if (deadlineDate > maxDeadline) {
        newErrors.deadline = `Deadline cannot be after April 30th, ${maxDeadline.getFullYear()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please enter valid details");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        opportunityName: formData.opportunityName.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim() || "",
        deadline: formData.deadline,
        status: formData.status,
      };

      const response = await internalOpportunityService.createOpportunity(payload);

      if (response.success || response.data) {
        toast.success("Opportunity created successfully!");
        setFormData({
          opportunityName: "",
          departmentId: "",
          description: "",
          requirements: "",
          eligibilityCriteria: "",
          deadline: "",
          status: "Active",
        });
        setErrors({});
        onOpportunityCreated();
        onHide();
      } else {
        toast.error(response.message || "Failed to create opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        "Failed to create opportunity";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      opportunityName: "",
      departmentId: "",
      description: "",
      requirements: "",
      eligibilityCriteria: "",
      deadline: "",
      status: "Active",
    });
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop with Blur */}
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
        onClick={handleClose}
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
        {/* Modal Dialog */}
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header */}
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
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff'
              }}
            >
              <i className="bi bi-briefcase-fill"></i>
              Create Internal Opportunity
            </div>
            <CloseButton
              onClick={handleClose}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1
              }}
            />
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
            {/* Modal Body - Scrollable */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff',
                maxHeight: 'calc(85vh - 140px)'
              }}
            >
              {/* Opportunity Name - Full Width */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}
                >
                  Opportunity Name <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <input
                  type="text"
                  name="opportunityName"
                  placeholder="e.g., Senior Java Developer - Project Phoenix"
                  value={formData.opportunityName}
                  onChange={handleChange}
                  maxLength={200}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: errors.opportunityName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={(e) => {
                    if (!errors.opportunityName) {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.opportunityName) {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.opportunityName && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.opportunityName}
                  </div>
                )}
              </div>

              {/* Department and Deadline Row */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '16px'
                }}
              >
                {/* Department */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#334155',
                      marginBottom: '6px',
                      textAlign: 'left'
                    }}
                  >
                    Department <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: errors.departmentId ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onFocus={(e) => {
                      if (!errors.departmentId) {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.departmentId) {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.departmentId}
                    </div>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#334155',
                      marginBottom: '6px',
                      textAlign: 'left'
                    }}
                  >
                    Application Deadline <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={minDate}
                    max={maxDate}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: errors.deadline ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      if (!errors.deadline) {
                        e.target.style.borderColor = '#27235C';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.deadline) {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.deadline && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                      {errors.deadline}
                    </div>
                  )}
                  <small style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block', fontStyle: 'italic', textAlign: 'left' }}>
                    Select a date between {new Date(minDate).toLocaleDateString()} and{" "}
                    {new Date(maxDate).toLocaleDateString()}
                  </small>
                </div>
              </div>

              {/* Description - Full Width */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}
                >
                  Description <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Provide detailed description of the opportunity..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: errors.description ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    minHeight: '80px',
                    maxHeight: '120px'
                  }}
                  onFocus={(e) => {
                    if (!errors.description) {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.description) {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.description && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Requirements - Full Width */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}
                >
                  Requirements <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                </label>
                <textarea
                  name="requirements"
                  placeholder="List required skills and qualifications..."
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: errors.requirements ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    minHeight: '80px',
                    maxHeight: '120px'
                  }}
                  onFocus={(e) => {
                    if (!errors.requirements) {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.requirements) {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {errors.requirements && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.requirements}
                  </div>
                )}
              </div>

              {/* Eligibility Criteria - Full Width */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '13px',
                    color: '#334155',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}
                >
                  Eligibility Criteria
                </label>
                <textarea
                  name="eligibilityCriteria"
                  placeholder="Define eligibility criteria (optional)..."
                  value={formData.eligibilityCriteria}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    minHeight: '80px',
                    maxHeight: '120px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#27235C';
                    e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Status and Info Row */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '250px 1fr',
                  gap: '20px',
                  marginBottom: '16px',
                  alignItems: 'start'
                }}
              >
                {/* Status - Left Side */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#334155',
                      marginBottom: '6px',
                      textAlign: 'left'
                    }}
                  >
                    Status <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#27235C';
                      e.target.style.boxShadow = '0 0 0 0.2rem rgba(39, 35, 92, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Info Alert - Right Side */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#0369a1',
                    marginTop: '20px' // Aligns with select field
                  }}
                >
                  <i 
                    className="bi bi-info-circle-fill" 
                    style={{ 
                      fontSize: '16px',
                      flexShrink: 0,
                      color: '#0284c7'
                    }}
                  ></i>
                  <span style={{ lineHeight: '1.4' }}>
                    Employees will be able to view and apply for active opportunities
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div
              style={{
                padding: '12px 20px',
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
              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  background: '#6c757d',
                  borderColor: '#6c757d',
                  color: '#ffffff',
                  fontWeight: '600',
                  padding: '8px 16px',
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
                Cancel
              </button>
              
              {/* Create Opportunity Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
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
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Post Opportunity
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

export default CreateOpportunityModal;
