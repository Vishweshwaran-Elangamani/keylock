// src/components/Meeting/CreateMomModal.jsx
import React, { useState, useEffect } from 'react';
import employeeService from '../../../services/meeting/employeeservice';
import momService from '../../../services/meeting/momService';
import toastr from 'toastr';

const CreateMomModal = ({ meetingData, onClose }) => {
  const userId = parseInt(localStorage.getItem('userId')) || 0;
  const userRole = localStorage.getItem('userRole') || 'Employee';

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    meetingId: meetingData.meetingId || 0,
    meetingTitle: meetingData.meetingTitle || '',
    meetingType: meetingData.meetingType || '',
    meetingDate: meetingData.meetingDate || new Date().toISOString(),
    meetingLink: meetingData.meetingLink || '',
    attendees: meetingData.attendees || '',
    commentsObservations: meetingData.commentsObservations || '',
    submittedByEmployeeId: userId,
    submittedByRole: userRole,
    isEditable: true,
    discussionPoints: meetingData.discussionPoints?.map((dp, index) => ({
      pointId: 0,
      pointText: dp.pointText || '',
      pointOrder: index + 1
    })) || [],
    actionItems: meetingData.actionItems?.map(ai => ({
      actionItemId: 0,
      taskDescription: ai.taskDescription || '',
      assignedToEmployeeId: ai.assignedToEmployeeId || '',
      dueDate: ai.dueDate || '',
      status: ai.status || 'Pending'
    })) || []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await employeeService.getAllEmployees();
        if (response.success && response.data) {
          // ✅ EXCLUDE System Administrator
          const filteredEmployees = response.data.filter(
            emp => emp.roleName !== 'System Administrator'
          );
          setEmployees(filteredEmployees);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        toastr.error('Failed to load employee list');
      } finally {
        setLoadingEmployees(false);
      }
    };
    
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDiscussionPointChange = (index, value) => {
    const updated = [...formData.discussionPoints];
    updated[index].pointText = value;
    setFormData(prev => ({ ...prev, discussionPoints: updated }));
  };

  const addDiscussionPoint = () => {
    setFormData(prev => ({
      ...prev,
      discussionPoints: [...prev.discussionPoints, { 
        pointId: 0, 
        pointText: '', 
        pointOrder: prev.discussionPoints.length + 1 
      }]
    }));
  };

  const removeDiscussionPoint = (index) => {
    const updated = formData.discussionPoints.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, discussionPoints: updated }));
  };

  const handleActionItemChange = (index, field, value) => {
    const updated = [...formData.actionItems];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, actionItems: updated }));
    
    const errorKey = `actionItem_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, { 
        actionItemId: 0, 
        taskDescription: '', 
        assignedToEmployeeId: '', 
        dueDate: '', 
        status: 'Pending' 
      }]
    }));
  };

  const removeActionItem = (index) => {
    const updated = formData.actionItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, actionItems: updated }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription.trim()) {
        if (!item.assignedToEmployeeId) {
          newErrors[`actionItem_${index}_assignedToEmployeeId`] = 'Please assign this task';
        }
        if (!item.dueDate) {
          newErrors[`actionItem_${index}_dueDate`] = 'Please set a due date';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastr.error('Please fix the errors before submitting');
      return;
    }
    
    setSubmitting(true);
    try {
      await momService.createMom(formData);
      toastr.success('MOM created successfully');
      onClose();
      window.location.reload();
    } catch (err) {
      toastr.error('Failed to create MOM');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (employeeMasterId) => {
    const employee = employees.find(e => e.employeeMasterId === parseInt(employeeMasterId));
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  return (
    <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-file-text"></i>
            Create Meeting Minutes
          </h6>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card bg-light border-0 mb-4">
            <div className="card-body p-3">
              <h6 className="fw-semibold mb-3 text-muted small">MEETING INFORMATION</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Meeting Title</label>
                  <input 
                    type="text"
                    className="form-control form-control-sm" 
                    value={formData.meetingTitle} 
                    disabled
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Meeting Type</label>
                  <input 
                    type="text"
                    className="form-control form-control-sm" 
                    value={formData.meetingType} 
                    disabled
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-chat-left-text"></i>
              Comments & Observations
            </label>
            <textarea 
              className="form-control" 
              rows="3"
              name="commentsObservations"
              value={formData.commentsObservations} 
              onChange={handleInputChange}
              placeholder="Add any observations or notes about the meeting..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots"></i>
                Discussion Points
                {formData.discussionPoints.length > 0 && (
                  <span className="badge bg-primary">{formData.discussionPoints.length}</span>
                )}
              </label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2" 
                onClick={addDiscussionPoint}
              >
                <i className="bi bi-plus-circle"></i> Add Point
              </button>
            </div>

            {formData.discussionPoints.length === 0 ? (
              <div className="alert alert-light border d-flex align-items-center gap-3 mb-0">
                <i className="bi bi-chat-dots" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <p className="mb-0 fw-semibold">No discussion points added</p>
                  <small className="text-muted">Click "Add Point" to document key topics discussed</small>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {formData.discussionPoints.map((dp, index) => (
                  <div key={index} className="card bg-light border-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-start gap-2">
                        <span 
                          className="badge bg-primary d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: '28px', height: '28px', flexShrink: 0, fontSize: '0.8rem' }}
                        >
                          {index + 1}
                        </span>
                        <input 
                          type="text"
                          className="form-control flex-grow-1" 
                          value={dp.pointText} 
                          onChange={(e) => handleDiscussionPointChange(index, e.target.value)} 
                          placeholder="Enter discussion point..." 
                        />
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger d-flex align-items-center"
                          onClick={() => removeDiscussionPoint(index)}
                          style={{ flexShrink: 0 }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-check2-square"></i>
                Action Items
                {formData.actionItems.length > 0 && (
                  <span className="badge bg-success">{formData.actionItems.length}</span>
                )}
              </label>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-2" 
                onClick={addActionItem}
              >
                <i className="bi bi-plus-circle"></i> Add Action
              </button>
            </div>

            {formData.actionItems.length === 0 ? (
              <div className="alert alert-light border d-flex align-items-center gap-3 mb-0">
                <i className="bi bi-check2-square" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <p className="mb-0 fw-semibold">No action items added</p>
                  <small className="text-muted">Click "Add Action" to create tasks and assign them to team members</small>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {formData.actionItems.map((item, index) => (
                  <div key={index} className="card border shadow-sm">
                    <div className="card-body p-3">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">Task Description *</label>
                        <input 
                          type="text"
                          className="form-control" 
                          value={item.taskDescription} 
                          onChange={(e) => handleActionItemChange(index, 'taskDescription', e.target.value)} 
                          placeholder="Describe the action item..." 
                        />
                      </div>

                      <div className="row g-2">
                        <div className="col-md-5">
                          <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-person-circle"></i>
                            Assign To *
                          </label>
                          <select
                            className={`form-select form-select-sm ${errors[`actionItem_${index}_assignedToEmployeeId`] ? 'is-invalid' : ''}`}
                            value={item.assignedToEmployeeId}
                            onChange={(e) => handleActionItemChange(index, 'assignedToEmployeeId', e.target.value)}
                            disabled={loadingEmployees}
                          >
                            <option value="">
                              {loadingEmployees ? 'Loading...' : 'Select employee...'}
                            </option>
                            {employees.map((emp) => (
                              <option key={emp.employeeMasterId} value={emp.employeeMasterId}>
                                {emp.firstName} {emp.lastName} - {emp.roleName}
                              </option>
                            ))}
                          </select>
                          {errors[`actionItem_${index}_assignedToEmployeeId`] && (
                            <div className="invalid-feedback d-block">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {errors[`actionItem_${index}_assignedToEmployeeId`]}
                            </div>
                          )}
                          {item.assignedToEmployeeId && getEmployeeName(item.assignedToEmployeeId) && (
                            <small className="text-success d-flex align-items-center gap-1 mt-1">
                              <i className="bi bi-check-circle"></i>
                              Assigned to: <strong>{getEmployeeName(item.assignedToEmployeeId)}</strong>
                            </small>
                          )}
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-calendar-event"></i>
                            Due Date *
                          </label>
                          <input 
                            type="date"
                            className={`form-control form-control-sm ${errors[`actionItem_${index}_dueDate`] ? 'is-invalid' : ''}`}
                            value={item.dueDate} 
                            onChange={(e) => handleActionItemChange(index, 'dueDate', e.target.value)} 
                            min={new Date().toISOString().split('T')[0]}
                          />
                          {errors[`actionItem_${index}_dueDate`] && (
                            <div className="invalid-feedback d-block">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {errors[`actionItem_${index}_dueDate`]}
                            </div>
                          )}
                        </div>

                        <div className="col-md-3">
                          <label className="form-label small fw-semibold text-muted">Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={item.status}
                            onChange={(e) => handleActionItemChange(index, 'status', e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-top">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2" 
                          onClick={() => removeActionItem(index)}
                        >
                          <i className="bi bi-trash"></i>
                          Remove Action Item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex gap-2 pt-3 border-top">
            <button 
              type="submit" 
              disabled={submitting || loadingEmployees} 
              className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              style={{ fontWeight: '500' }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Creating MOM...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  Create MOM
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-light px-4 d-flex align-items-center gap-2"
              disabled={submitting}
            >
              <i className="bi bi-x-lg"></i>
              Cancel
            </button>
          </div>
        </form>

        {formData.actionItems.length > 0 && (
          <div className="alert alert-info mt-3 mb-0 d-flex align-items-start gap-2">
            <i className="bi bi-info-circle mt-1 flex-shrink-0"></i>
            <div className="small">
              <strong>Note:</strong> All assigned employees will be notified via email about their action items.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMomModal;
