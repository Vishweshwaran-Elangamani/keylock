// src/components/project_management_components/modals/EditProjectModal.jsx

import React, { useEffect } from 'react';
import { Edit, CheckCircle, AlertCircle, X } from 'lucide-react';

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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => {
          if (e.target.classList.contains('modal')) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#f8f9fa", padding: "1.25rem 1.5rem" }}>
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                <Edit size={24} style={{ color: "#0f62fe" }} />
                <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  Edit Project
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <form onSubmit={onSubmit}>
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                {message && (
                  <div
                    className={`alert alert-${
                      message.type === "success" ? "success" : "danger"
                    } d-flex align-items-center gap-2 mb-4`}
                    style={{
                      borderRadius: "8px",
                      border: "none",
                      padding: "1rem",
                      fontSize: "0.95rem"
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

                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Project Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={formData.projectName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          projectName: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={formData.status || "Active"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      style={{ fontSize: "1rem", lineHeight: "1.6" }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Business Unit <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={formData.businessUnit || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessUnit: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
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
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Department <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={formData.department || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
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
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Engagement Model <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={formData.engagementModel || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          engagementModel: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
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
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      value={formData.startDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                      required
                      style={{ fontSize: "1rem" }}
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-semibold" style={{ fontSize: "1rem" }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      value={formData.endDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDate: e.target.value,
                        })
                      }
                      style={{ fontSize: "1rem" }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "1rem 1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-lg btn-secondary"
                  onClick={onClose}
                  style={{ fontSize: "1rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-lg btn-primary"
                  disabled={isSubmitting}
                  style={{ fontSize: "1rem" }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProjectModal;
