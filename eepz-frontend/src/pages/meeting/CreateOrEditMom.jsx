import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import momService from "../../services/meeting/momService";
import meetingService from "../../services/meeting/meetingService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/mom/components/CreateOrEditMom.css";

const initialActionItem = {
  taskDescription: "",
  assignedToEmployeeId: null,
  assignedToEmployeeName: "",
  dueDate: "",
  status: "Pending",
};

const CreateOrEditMom = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { momId, meetingId } = useParams();
  const [meetingData, setMeetingData] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [formData, setFormData] = useState({
    discussionPoints: [],
    actionItems: [],
    commentsObservations: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
    if (isEdit && momId) {
      fetchMomData(momId);
    } else if (meetingId) {
      fetchMeetingData(meetingId);
    }
  }, [momId, meetingId, isEdit]);

  // Helper to get property with PascalCase/camelCase fallback
  const getProperty = (obj, camelKey, pascalKey) => {
    return obj?.[camelKey] ?? obj?.[pascalKey] ?? null;
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      const employeeData = response.data || response.Data || [];
      const employeeSuccess = response.success || response.Success;

      if (employeeSuccess && employeeData.length > 0) {
        setAllEmployees(employeeData);
        const nameToIdMap = {};
        employeeData.forEach((emp) => {
          const firstName = getProperty(emp, 'firstName', 'FirstName') || '';
          const lastName = getProperty(emp, 'lastName', 'LastName') || '';
          const empId = getProperty(emp, 'employeeMasterId', 'EmployeeMasterId') || 
                        getProperty(emp, 'employeeId', 'EmployeeId');
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName && empId) {
            nameToIdMap[fullName] = empId;
          }
        });
        setEmployeeMap(nameToIdMap);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else {
        toastr.error("Failed to load employees");
      }
    }
  };

  const fetchMomData = async (id) => {
    setLoading(true);
    try {
      const response = await momService.getMomById(id);
      const mom = response.data || response.Data || response;

      // Extract properties with fallback
      const discussionPoints = getProperty(mom, 'discussionPoints', 'DiscussionPoints') || [];
      const actionItems = getProperty(mom, 'actionItems', 'ActionItems') || [];
      const commentsObservations = getProperty(mom, 'commentsObservations', 'CommentsObservations') || '';

      const mappedActionItems = actionItems.map((item) => ({
        actionItemId: getProperty(item, 'actionItemId', 'ActionItemId'),
        taskDescription: getProperty(item, 'taskDescription', 'TaskDescription') || 
                        getProperty(item, 'task', 'Task') || '',
        assignedToEmployeeId: getProperty(item, 'assignedToEmployeeId', 'AssignedToEmployeeId'),
        assignedToEmployeeName: getProperty(item, 'assignedToEmployeeName', 'AssignedToEmployeeName') || 
                               getProperty(item, 'assignTo', 'AssignTo') || '',
        dueDate: getProperty(item, 'dueDate', 'DueDate') || '',
        status: getProperty(item, 'status', 'Status') || 'Pending',
      }));

      const mappedDiscussionPoints = discussionPoints.map((dp) => ({
        pointId: getProperty(dp, 'pointId', 'PointId'),
        point: getProperty(dp, 'pointText', 'PointText') || 
               getProperty(dp, 'point', 'Point') || '',
      }));

      setFormData({
        discussionPoints: mappedDiscussionPoints,
        actionItems: mappedActionItems,
        commentsObservations: commentsObservations,
      });

      setMeetingData({
        meetingTitle: getProperty(mom, 'meetingTitle', 'MeetingTitle'),
        meetingType: getProperty(mom, 'meetingType', 'MeetingType'),
        meetingDate: getProperty(mom, 'meetingDate', 'MeetingDate'),
        meetingLink: getProperty(mom, 'meetingLink', 'MeetingLink') || '',
        attendees: getProperty(mom, 'attendees', 'Attendees') || [],
      });
    } catch (err) {
      console.error("Failed to load MOM:", err);
      if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else {
        toastr.error("Failed to load MOM");
      }
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingData = async (id) => {
    setLoading(true);
    try {
      const response = await meetingService.getMeetingById(id);
      const meeting = response.data || response.Data || response;

      setMeetingData({
        meetingTitle: getProperty(meeting, 'meetingTitle', 'MeetingTitle'),
        meetingType: getProperty(meeting, 'meetingType', 'MeetingType'),
        meetingDate: getProperty(meeting, 'meetingDate', 'MeetingDate'),
        meetingLink: getProperty(meeting, 'meetingLink', 'MeetingLink') || '',
        attendees: getProperty(meeting, 'attendees', 'Attendees') || [],
      });
    } catch (err) {
      console.error("Failed to load meeting:", err);
      if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else {
        toastr.error("Meeting not found");
      }
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscussionPoint = () => {
    setFormData((prev) => ({
      ...prev,
      discussionPoints: [...prev.discussionPoints, { point: "" }],
    }));
  };

  const handleChangeDiscussionPoint = (index, value) => {
    const newPoints = [...formData.discussionPoints];
    newPoints[index].point = value;
    setFormData((prev) => ({ ...prev, discussionPoints: newPoints }));
    
    // Clear error if exists
    if (errors[`discussionPoint_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`discussionPoint_${index}`];
      setErrors(newErrors);
    }
  };

  const handleRemoveDiscussionPoint = (index) => {
    const newPoints = [...formData.discussionPoints];
    newPoints.splice(index, 1);
    setFormData((prev) => ({ ...prev, discussionPoints: newPoints }));
    
    // Clear error if exists
    if (errors[`discussionPoint_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`discussionPoint_${index}`];
      setErrors(newErrors);
    }
  };

  const handleAddActionItem = () => {
    setFormData((prev) => ({
      ...prev,
      actionItems: [...prev.actionItems, { ...initialActionItem }],
    }));
  };

  const handleChangeActionItem = (index, field, value) => {
    const newItems = [...formData.actionItems];

    if (field === "assignedToEmployeeName") {
      newItems[index].assignedToEmployeeName = value;
      newItems[index].assignedToEmployeeId = employeeMap[value] || null;
    } else if (field === "taskDescription") {
      newItems[index].taskDescription = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, actionItems: newItems }));
    
    // Clear error if exists
    if (errors[`actionItem_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`actionItem_${index}`];
      setErrors(newErrors);
    }
  };

  const handleRemoveActionItem = (index) => {
    const newItems = [...formData.actionItems];
    newItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, actionItems: newItems }));
    
    // Clear error if exists
    if (errors[`actionItem_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`actionItem_${index}`];
      setErrors(newErrors);
    }
  };

  const handleCommentsChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      commentsObservations: e.target.value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!meetingData) {
      newErrors.meeting = "Meeting details missing";
    }

    // Validate discussion points
    formData.discussionPoints.forEach((point, index) => {
      if (point.point && point.point.trim().length < 3) {
        newErrors[`discussionPoint_${index}`] = "Discussion point must be at least 3 characters";
      }
      if (point.point && point.point.length > 2000) {
        newErrors[`discussionPoint_${index}`] = "Discussion point cannot exceed 2000 characters";
      }
    });

    // Validate action items
    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription && item.taskDescription.trim()) {
        // Task has description, must have employee assigned
        if (!item.assignedToEmployeeId) {
          newErrors[`actionItem_${index}`] = "Please select an employee for this task";
        }
        
        // Validate task description length
        if (item.taskDescription.length < 3) {
          newErrors[`actionItem_${index}`] = "Task description must be at least 3 characters";
        }
        if (item.taskDescription.length > 1000) {
          newErrors[`actionItem_${index}`] = "Task description cannot exceed 1000 characters";
        }
        
        // Validate due date
        if (item.dueDate) {
          const dueDate = new Date(item.dueDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (dueDate < yesterday) {
            newErrors[`actionItem_${index}_date`] = "Due date cannot be in the past";
          }
        }
      }
    });

    // Validate meeting date (if not edit mode)
    if (!isEdit && meetingData?.meetingDate) {
      const dateValidation = momService.validation.validateMeetingDate(meetingData.meetingDate);
      if (!dateValidation.valid) {
        newErrors.meetingDate = dateValidation.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastr.error("Please check the form for errors");
      return;
    }

    setSubmitting(true);
    try {
      const momPayload = {
        momId: isEdit ? parseInt(momId) : 0,
        meetingId: meetingId ? parseInt(meetingId) : undefined,
        meetingTitle: meetingData.meetingTitle,
        meetingType: meetingData.meetingType,
        meetingDate: meetingData.meetingDate,
        meetingLink: meetingData.meetingLink,
        attendees: meetingData.attendees,
        discussionPoints: formData.discussionPoints
          .filter((dp) => dp.point && dp.point.trim())
          .map((dp, index) => ({
            pointId: dp.pointId || 0,
            pointText: dp.point.trim(),
            pointOrder: index + 1,
          })),
        actionItems: formData.actionItems
          .filter((ai) => ai.taskDescription && ai.taskDescription.trim())
          .map((ai) => ({
            actionItemId: ai.actionItemId || 0,
            taskDescription: ai.taskDescription.trim(),
            assignedToEmployeeId: ai.assignedToEmployeeId,
            dueDate: ai.dueDate,
            status: ai.status || "Pending",
          })),
        commentsObservations: formData.commentsObservations.trim(),
      };

      if (isEdit) {
        const response = await momService.updateMom(momPayload);
        if (response.success || response.Success) {
          toastr.success("MOM updated successfully");
          navigate("/mom/my-moms");
        }
      } else {
        const response = await momService.createMom(momPayload);
        if (response.success || response.Success) {
          toastr.success("MOM created successfully");
          navigate("/mom/my-moms");
        }
      }
    } catch (err) {
      console.error("MOM Submission Error:", err);
      
      // Enhanced error handling
      if (err.validationErrors) {
        toastr.error(`Validation Error: ${err.validationErrors}`);
      } else if (err.retryAfter) {
        toastr.error(`Rate limit exceeded. Please wait ${err.retryAfter} seconds.`);
      } else if (err.message) {
        toastr.error(`Failed to ${isEdit ? 'update' : 'create'} MOM: ${err.message}`);
      } else {
        toastr.error(`Failed to ${isEdit ? 'update' : 'create'} MOM`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="momce-loading">
        <div
          className="spinner-border text-primary momce-loading-spinner"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="container-fluid px-4 py-4 momce-page">
        <div className="alert alert-danger">
          Meeting data unavailable. Please go back and try again.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="momce-page">
      <div className="container-fluid px-4 py-4 momce-container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="momce-header">
              <button
                className="btn momce-back-btn"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="momce-title">
                  {isEdit ? "Edit MOM" : "Create MOM from Meeting"}
                </h2>
                <p className="momce-subtitle">
                  {isEdit
                    ? "Update meeting minutes"
                    : "Add discussion points and action items for this meeting (meeting info is read-only)"}
                </p>
              </div>
            </div>

            {errors.meetingDate && (
              <div className="alert alert-warning mb-3">
                <strong>Warning:</strong> {errors.meetingDate}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="card momce-card mb-4">
                <div className="card-body momce-card-body">
                  <h5 className="momce-card-title">
                    <FileText size={22} />
                    Meeting Details (Auto-filled)
                  </h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="momce-label">Meeting Title</label>
                      <input
                        type="text"
                        className="form-control momce-input"
                        value={meetingData.meetingTitle || ''}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="momce-label">Meeting Type</label>
                      <input
                        type="text"
                        className="form-control momce-input"
                        value={meetingData.meetingType || ''}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="momce-label">
                        <Calendar size={16} className="me-1" /> Date &amp; Time
                      </label>
                      <input
                        type="text"
                        className="form-control momce-input"
                        value={formatDateTime(meetingData.meetingDate)}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="momce-label">
                        <Users size={16} className="me-1" /> Attendees
                      </label>
                      <input
                        type="text"
                        className="form-control momce-input"
                        value={
                          Array.isArray(meetingData.attendees)
                            ? `${meetingData.attendees.length} participants`
                            : meetingData.attendees || 'Not specified'
                        }
                        disabled
                      />
                    </div>
                    {meetingData.meetingLink && (
                      <div className="col-12">
                        <label className="momce-label">Meeting Link</label>
                        <input
                          type="text"
                          className="form-control momce-input"
                          value={meetingData.meetingLink}
                          disabled
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card momce-card mb-4">
                <div className="card-body momce-card-body">
                  <div className="momce-section-header">
                    <h5 className="momce-card-title mb-0">
                      <MessageSquare size={22} />
                      Discussion Points
                    </h5>
                    <button
                      type="button"
                      className="btn momce-add-btn"
                      onClick={handleAddDiscussionPoint}
                    >
                      <Plus size={16} />
                      Add Point
                    </button>
                  </div>
                  {formData.discussionPoints.length === 0 ? (
                    <div className="alert alert-secondary mb-0">
                      No discussion points added yet. Click "Add Point" to start.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {formData.discussionPoints.map((dp, index) => (
                        <div key={index} className="card momce-subcard">
                          <div className="card-body momce-subcard-body">
                            <div className="momce-discussion-row">
                              <span className="momce-discussion-index">
                                {index + 1}
                              </span>
                              <div className="flex-grow-1">
                                <textarea
                                  value={dp.point || ""}
                                  onChange={(e) =>
                                    handleChangeDiscussionPoint(index, e.target.value)
                                  }
                                  className={`form-control momce-textarea ${
                                    errors[`discussionPoint_${index}`] ? 'is-invalid' : ''
                                  }`}
                                  rows="2"
                                  placeholder="Enter discussion point..."
                                  maxLength={2000}
                                />
                                {errors[`discussionPoint_${index}`] && (
                                  <div className="invalid-feedback d-block">
                                    {errors[`discussionPoint_${index}`]}
                                  </div>
                                )}
                                <small className="text-muted">
                                  {dp.point?.length || 0}/2000 characters
                                </small>
                              </div>
                              <button
                                type="button"
                                className="btn momce-remove-btn"
                                onClick={() => handleRemoveDiscussionPoint(index)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card momce-card mb-4">
                <div className="card-body momce-card-body">
                  <div className="momce-section-header">
                    <h5 className="momce-card-title mb-0">
                      <CheckCircle size={22} />
                      Action Items
                    </h5>
                    <button
                      type="button"
                      className="btn momce-add-action-btn"
                      onClick={handleAddActionItem}
                    >
                      <Plus size={16} />
                      Add Action
                    </button>
                  </div>
                  {formData.actionItems.length === 0 ? (
                    <div className="alert alert-secondary mb-0">
                      No action items added yet. Click "Add Action" to start.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {formData.actionItems.map((item, index) => (
                        <div key={index} className="card momce-subcard">
                          <div className="card-body momce-subcard-body">
                            <div className="row g-2 mb-2">
                              <div className="col-12">
                                <input
                                  type="text"
                                  placeholder="Task description..."
                                  value={item.taskDescription || ""}
                                  onChange={(e) =>
                                    handleChangeActionItem(
                                      index,
                                      "taskDescription",
                                      e.target.value
                                    )
                                  }
                                  className={`form-control momce-input ${
                                    errors[`actionItem_${index}`] && 
                                    !errors[`actionItem_${index}`].includes('employee')
                                      ? 'is-invalid' 
                                      : ''
                                  }`}
                                  maxLength={1000}
                                />
                                <small className="text-muted">
                                  {item.taskDescription?.length || 0}/1000 characters
                                </small>
                              </div>
                              <div className="col-md-4">
                                <select
                                  value={item.assignedToEmployeeName || ""}
                                  onChange={(e) =>
                                    handleChangeActionItem(
                                      index,
                                      "assignedToEmployeeName",
                                      e.target.value
                                    )
                                  }
                                  className={`form-select momce-input ${
                                    errors[`actionItem_${index}`] &&
                                    errors[`actionItem_${index}`].includes('employee')
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                >
                                  <option value="">Assign to...</option>
                                  {allEmployees.map((emp) => {
                                    const firstName = getProperty(emp, 'firstName', 'FirstName') || '';
                                    const lastName = getProperty(emp, 'lastName', 'LastName') || '';
                                    const empId = getProperty(emp, 'employeeMasterId', 'EmployeeMasterId') || 
                                                  getProperty(emp, 'employeeId', 'EmployeeId');
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    
                                    return (
                                      <option key={empId} value={fullName}>
                                        {fullName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="date"
                                  value={item.dueDate || ""}
                                  onChange={(e) =>
                                    handleChangeActionItem(index, "dueDate", e.target.value)
                                  }
                                  className={`form-control momce-input ${
                                    errors[`actionItem_${index}_date`] ? 'is-invalid' : ''
                                  }`}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                                {errors[`actionItem_${index}_date`] && (
                                  <div className="invalid-feedback d-block">
                                    {errors[`actionItem_${index}_date`]}
                                  </div>
                                )}
                              </div>
                              <div className="col-md-3">
                                <select
                                  value={item.status || "Pending"}
                                  onChange={(e) =>
                                    handleChangeActionItem(index, "status", e.target.value)
                                  }
                                  className="form-select momce-input"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <button
                                  type="button"
                                  className="btn momce-remove-btn-full w-100"
                                  onClick={() => handleRemoveActionItem(index)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {errors[`actionItem_${index}`] && (
                              <div className="text-danger small mb-2">
                                {errors[`actionItem_${index}`]}
                              </div>
                            )}
                            {item.assignedToEmployeeId ? (
                              <small className="text-success">
                                Assigned to Employee ID: {item.assignedToEmployeeId}
                              </small>
                            ) : (
                              item.taskDescription && (
                                <small className="text-warning">
                                  Please assign an employee for this task
                                </small>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card momce-card mb-4">
                <div className="card-body momce-card-body">
                  <h5 className="momce-card-title">
                    <MessageSquare size={22} />
                    Comments &amp; Observations
                  </h5>
                  <textarea
                    name="commentsObservations"
                    value={formData.commentsObservations}
                    onChange={handleCommentsChange}
                    className="form-control momce-textarea"
                    rows="5"
                    placeholder="Add any additional comments or observations about the meeting..."
                    maxLength={5000}
                  />
                  <small className="text-muted">
                    {formData.commentsObservations?.length || 0}/5000 characters
                  </small>
                </div>
              </div>

              <div className="momce-footer-actions">
                <button
                  type="button"
                  className="btn momce-cancel-btn"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn momce-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {isEdit ? "Update MOM" : "Create MOM"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrEditMom;
