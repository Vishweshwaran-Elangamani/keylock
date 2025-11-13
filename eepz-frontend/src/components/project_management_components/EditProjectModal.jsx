// src/components/ProjectManagementComponents/EditProjectModal.jsx
import React from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';

const EditProjectModal = ({
  showEditModal,
  selectedProject,
  editFormData,
  setEditFormData,
  departments,
  businessUnits,
  isSubmitting,
  modalMessage,
  setModalMessage,
  handleUpdateProject,
  setShowEditModal
}) => {
  if (!showEditModal) return null;

  const statusOptions = ['Active', 'On Hold', 'Completed', 'Cancelled'];
  const engagementModels = ['Fixed Price', 'Time and Materials', 'Agile - Scrum', 'Agile - Kanban', 'Consulting', 'Retainer'];

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-pencil-square me-2"></i>
              Edit Project
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            ></button>
          </div>

          <form onSubmit={handleUpdateProject}>
            <div className="modal-body">
              {modalMessage && (
                <div className={`alert alert-${modalMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show d-flex align-items-center gap-2`}>
                  {modalMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <div className="flex-grow-1">{modalMessage.text}</div>
                  <button type="button" className="btn-close" onClick={() => setModalMessage(null)}></button>
                </div>
              )}

              <div className="row g-3">
                {/* Project Name */}
                <div className="col-md-6">
                  <label className="form-label">
                    Project Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={editFormData.projectName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, projectName: e.target.value })}
                    className="form-control"
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>

                {/* Client Name */}
                <div className="col-md-6">
                  <label className="form-label">
                    Client Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={editFormData.clientName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                    className="form-control"
                    placeholder="Enter client name"
                  />
                </div>

                {/* Status */}
                <div className="col-md-12">
                  <label className="form-label">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    name="status"
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="form-select"
                  >
                    {statusOptions.map((status, idx) => (
                      <option key={idx} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>

                {/* Business Unit */}
                <div className="col-md-6">
                  <label className="form-label">
                    Business Unit <span className="text-danger">*</span>
                  </label>
                  <select
                    name="businessUnit"
                    value={editFormData.businessUnit || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, businessUnit: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Business Unit</option>
                    {businessUnits.map((bu, idx) => (
                      <option key={idx} value={bu}>{bu}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="col-md-6">
                  <label className="form-label">
                    Department <span className="text-danger">*</span>
                  </label>
                  <select
                    name="department"
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept.departmentName}>{dept.departmentName}</option>
                    ))}
                  </select>
                </div>

                {/* Engagement Model */}
                <div className="col-md-6">
                  <label className="form-label">
                    Engagement Model <span className="text-danger">*</span>
                  </label>
                  <select
                    name="engagementModel"
                    value={editFormData.engagementModel || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, engagementModel: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Engagement Model</option>
                    {engagementModels.map((model, idx) => (
                      <option key={idx} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="col-md-6">
                  <label className="form-label">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={editFormData.startDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="form-control"
                  />
                </div>

                {/* End Date */}
                <div className="col-md-12">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editFormData.endDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  'Update Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
