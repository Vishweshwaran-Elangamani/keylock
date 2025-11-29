import { useState, useEffect } from "react";
import { CloseButton } from "react-bootstrap";
import { toast } from "sonner";
import internalOpportunityService from "../../../services/internal/internalOpportunityService";

const EditOpportunityModal = ({
  show,
  onHide,
  onOpportunityUpdated,
  opportunity,
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

  useEffect(() => {
    if (opportunity) {
      setFormData({
        opportunityName: opportunity.opportunityName || "",
        departmentId: opportunity.departmentId || "",
        description: opportunity.description || "",
        requirements: opportunity.requirements || "",
        eligibilityCriteria: opportunity.eligibilityCriteria || "",
        deadline: opportunity.deadline
          ? opportunity.deadline.split("T")[0]
          : "",
        status: opportunity.status || "Active",
      });
    }
  }, [opportunity]);

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

    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
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
        eligibilityCriteria: formData.eligibilityCriteria.trim() || null,
        deadline: formData.deadline,
        status: formData.status,
      };

      const response = await internalOpportunityService.updateOpportunity(
        opportunity.opportunityId,
        payload
      );

      if (response.success) {
        toast.success("Opportunity updated successfully!");
        onOpportunityUpdated();
        onHide();
      } else {
        toast.error(response.message || "Failed to update opportunity");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update opportunity");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Modal Header - Dark Navy Blue */}
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
              <i className="bi bi-pencil-fill"></i>
              Edit Opportunity
            </div>
            <CloseButton
              onClick={handleClose}
              disabled={loading}
              variant="white"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: loading ? 0.5 : 1
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
                maxHeight: 'calc(90vh - 140px)'
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
                  placeholder="Opportunity name"
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
                    Deadline <span style={{ color: '#ef4444', fontWeight: '700' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
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
                  placeholder="Description"
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
                  placeholder="Requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
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
                  placeholder="Eligibility criteria"
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

              {/* Status - Narrow Width */}
              <div style={{ marginBottom: '16px', maxWidth: '250px' }}>
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
            </div>

            {/* Modal Footer - Fixed */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                flexShrink: 0,
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem'
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#6c757d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.65 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = '#6c757d';
                  }
                }}
              >
                <i className="bi bi-x-circle"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(90deg, #97247E 0%, #E01950 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                  boxShadow: '0 2px 8px rgba(151, 36, 126, 0.25)',
                  opacity: loading ? 0.65 : 1,
                  minWidth: '170px',
                  justifyContent: 'center'
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Update Opportunity
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

export default EditOpportunityModal;
