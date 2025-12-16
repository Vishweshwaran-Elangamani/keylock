import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Edit, CheckCircle, AlertCircle, X, MessageSquare } from 'lucide-react';


const EditProjectModal = ({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  message,
  departments,
  businessUnits,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);


  if (!show) return null;


  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000
        }}
        onClick={onClose}
      />

      {/* Modal Container - CENTERED */}
      <div
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: '900px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        <div 
          style={{ 
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              backgroundColor: '#3c3862',
              borderBottom: 'none',
              padding: '1.25rem 1.5rem',
              color: 'white',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h5 style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'white'
            }}>
              <MessageSquare size={22} style={{ color: 'white' }} />
              <span>Edit Project</span>
            </h5>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                opacity: 0.9
              }}
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div 
              style={{ 
                padding: '1.75rem', 
                backgroundColor: '#f8f9fa',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {message && (
                <div
                  className={`alert alert-${
                    message.type === "success" ? "success" : "danger"
                  } d-flex align-items-center gap-2 mb-4`}
                  style={{
                    borderRadius: '8px',
                    border: 'none',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    backgroundColor: message.type === 'success' 
                      ? 'rgba(36, 161, 72, 0.1)' 
                      : 'rgba(224, 25, 80, 0.1)',
                    color: message.type === 'success' ? '#24A148' : '#E01950',
                    textAlign: 'left'
                  }}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Goal Info Box */}
              <div 
                style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>
                  Project: <span style={{ color: '#374151', fontWeight: 600 }}>{formData.projectName || 'New Project'}</span>
                </span>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Project Name <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control text-start"
                    value={formData.projectName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectName: e.target.value,
                      })
                    }
                    placeholder="Enter project name"
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Status <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <select
                    className="form-select text-start"
                    value={formData.status || "Active"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value,
                      })
                    }
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="col-12">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    className="form-control text-start"
                    rows="4"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter project description"
                    style={{ 
                      fontSize: '0.95rem', 
                      lineHeight: '1.6',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Business Unit <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <select
                    className="form-select text-start"
                    value={formData.businessUnit || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessUnit: e.target.value,
                      })
                    }
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Business Unit</option>
                    {businessUnits?.map((bu, idx) => (
                      <option key={idx} value={bu}>
                        {bu}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Department <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <select
                    className="form-select text-start"
                    value={formData.department || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                      })
                    }
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments?.map((dept) => (
                      <option
                        key={dept.departmentId}
                        value={dept.departmentName}
                      >
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Engagement Model <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <select
                    className="form-select text-start"
                    value={formData.engagementModel || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        engagementModel: e.target.value,
                      })
                    }
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Model</option>
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Time and Materials">Time and Materials</option>
                    <option value="Agile - Scrum">Agile - Scrum</option>
                    <option value="Agile - Kanban">Agile - Kanban</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Retainer">Retainer</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    Start Date <span style={{ color: '#E01950' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control text-start"
                    value={formData.startDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                    required
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div className="col-md-12">
                  <label 
                    className="form-label fw-semibold text-start d-block" 
                    style={{ 
                      fontSize: '0.9rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-control text-start"
                    value={formData.endDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDate: e.target.value,
                      })
                    }
                    style={{ 
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      padding: '0.65rem 0.75rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{ 
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(192, 38, 211, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(192, 38, 211, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(192, 38, 211, 0.3)';
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // Render using React Portal
  return ReactDOM.createPortal(modalContent, document.body);
};


export default EditProjectModal;
