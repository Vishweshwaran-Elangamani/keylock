
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import momService from "../../services/meeting/momService";
import meetingService from "../../services/meeting/meetingService";
import employeeService from "../../services/meeting/employeeservice";
import toastr from "toastr";
import {
  FileText,
  Calendar,
  Clock,
  Link as LinkIcon,
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


 
  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      if (response.success && response.data) {
        setAllEmployees(response.data);
        
        const nameToIdMap = {};
        response.data.forEach((emp) => {
          const fullName = `${emp.firstName} ${emp.lastName}`;
          nameToIdMap[fullName] = emp.employeeMasterId;
        });
        setEmployeeMap(nameToIdMap);
        
        console.log("👥 Employee Map (Name -> ID):", nameToIdMap);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };


  const fetchMomData = async (id) => {
    setLoading(true);
    try {
      const response = await momService.getMomById(id);
      const mom = response.data || response;
      
    
      const mappedActionItems = (mom.actionItems || []).map(item => ({
        actionItemId: item.actionItemId,
        taskDescription: item.taskDescription || item.task || "",
        assignedToEmployeeId: item.assignedToEmployeeId,
        assignedToEmployeeName: item.assignedToEmployeeName || item.assignTo || "",
        dueDate: item.dueDate || "",
        status: item.status || "Pending",
      }));
      
      setFormData({
        discussionPoints: mom.discussionPoints || [],
        actionItems: mappedActionItems,
        commentsObservations: mom.commentsObservations || "",
      });
      setMeetingData({
        meetingTitle: mom.meetingTitle,
        meetingType: mom.meetingType,
        meetingDate: mom.meetingDate,
        meetingLink: mom.meetingLink || "",
        attendees: mom.attendees || [],
      });
    } catch (err) {
      toastr.error("Failed to load MOM");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };


  // Fetch Meeting (create mode)
  const fetchMeetingData = async (id) => {
    setLoading(true);
    try {
      const response = await meetingService.getMeetingById(id);
      const meeting = response.data || response;
      setMeetingData({
        meetingTitle: meeting.meetingTitle,
        meetingType: meeting.meetingType,
        meetingDate: meeting.meetingDate,
        meetingLink: meeting.meetingLink || "",
        attendees: meeting.attendees || [],
      });
    } catch (err) {
      toastr.error("Meeting not found");
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
  };


  const handleRemoveDiscussionPoint = (index) => {
    const newPoints = [...formData.discussionPoints];
    newPoints.splice(index, 1);
    setFormData((prev) => ({ ...prev, discussionPoints: newPoints }));
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
      // When employee name changes, also set the ID
      newItems[index].assignedToEmployeeName = value;
      newItems[index].assignedToEmployeeId = employeeMap[value] || null;
      
      console.log(`Assigned: ${value} -> ID: ${employeeMap[value]}`);
    } else if (field === "taskDescription") {
      newItems[index].taskDescription = value;
    } else {
      newItems[index][field] = value;
    }
    
    setFormData((prev) => ({ ...prev, actionItems: newItems }));
  };


  const handleRemoveActionItem = (index) => {
    const newItems = [...formData.actionItems];
    newItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, actionItems: newItems }));
  };



  const handleCommentsChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      commentsObservations: e.target.value,
    }));
  };


  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!meetingData) newErrors.meeting = "Meeting details missing";
    

    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription && !item.assignedToEmployeeId) {
        newErrors[`actionItem_${index}`] = "Please select an employee for this task";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toastr.error("Please check the form - make sure all action items have employees assigned");
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
        discussionPoints: formData.discussionPoints.filter(
          (dp) => dp.point && dp.point.trim()
        ),
        actionItems: formData.actionItems
          .filter((ai) => ai.taskDescription && ai.taskDescription.trim())
          .map((ai) => ({
            actionItemId: ai.actionItemId || 0,
            taskDescription: ai.taskDescription,
            assignedToEmployeeId: ai.assignedToEmployeeId,
            dueDate: ai.dueDate,
            status: ai.status || "Pending",
          })),
        commentsObservations: formData.commentsObservations,
      };

      console.log("Submitting MOM Payload:", momPayload);

      if (isEdit) {
        await momService.updateMom(momPayload);
        toastr.success("MOM updated successfully");
      } else {
        await momService.createMom(momPayload);
        toastr.success("MOM created successfully");
      }
      navigate("/mom/my-moms");
    } catch (err) {
      toastr.error("Failed to submit MOM");
      console.error("MOM Submission Error:", err);
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
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }


  if (!meetingData) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger">Meeting data unavailable</div>
      </div>
    );
  }


  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
              onClick={() => navigate(-1)}
              style={{ width: "40px", height: "40px", flexShrink: 0 }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2
                className="fw-bold mb-1"
                style={{ color: "#1e293b", fontSize: "1.75rem" }}
              >
                {isEdit ? "Edit MOM" : "Create MOM from Meeting"}
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                {isEdit
                  ? "Update meeting minutes"
                  : "Add discussion points and action items for this meeting (meeting info is read-only)"}
              </p>
            </div>
          </div>


          <form onSubmit={handleSubmit}>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-semibold mb-4 d-flex align-items-center gap-2">
                  <FileText size={22} />
                  Meeting Details (Auto-filled)
                </h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.meetingTitle}
                      disabled
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">
                      Meeting Type
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={meetingData.meetingType}
                      disabled
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">
                      <Calendar size={16} className="me-1" /> Date & Time
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDateTime(meetingData.meetingDate)}
                      disabled
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">
                      <Users size={16} className="me-1" /> Attendees
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${
                        meetingData.attendees?.length || 0
                      } participants`}
                      disabled
                    />
                  </div>
                  {meetingData.meetingLink && (
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">
                        <LinkIcon size={16} className="me-1" /> Meeting Link
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={meetingData.meetingLink}
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title fw-semibold mb-0 d-flex align-items-center gap-2">
                    <MessageSquare size={22} />
                    Discussion Points
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary d-flex align-items-center gap-2"
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
                      <div key={index} className="card bg-light border-0">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start gap-2">
                            <span
                              className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "28px",
                                height: "28px",
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </span>
                            <textarea
                              value={dp.point || ""}
                              onChange={(e) =>
                                handleChangeDiscussionPoint(
                                  index,
                                  e.target.value
                                )
                              }
                              className="form-control flex-grow-1"
                              rows="2"
                              placeholder="Enter discussion point..."
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                              onClick={() => handleRemoveDiscussionPoint(index)}
                              style={{ flexShrink: 0 }}
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


            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title fw-semibold mb-0 d-flex align-items-center gap-2">
                    <CheckCircle size={22} />
                    Action Items
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-success d-flex align-items-center gap-2"
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
                      <div key={index} className="card bg-light border-0">
                        <div className="card-body p-3">
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
                                className="form-control"
                              />
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
                                className={`form-select ${errors[`actionItem_${index}`] ? 'is-invalid' : ''}`}
                              >
                                <option value="">Assign to...</option>
                                {allEmployees.map((emp) => {
                                  const fullName = `${emp.firstName} ${emp.lastName}`;
                                  return (
                                    <option key={emp.employeeMasterId} value={fullName}>
                                      {fullName}
                                    </option>
                                  );
                                })}
                              </select>
                              {errors[`actionItem_${index}`] && (
                                <div className="invalid-feedback d-block">
                                  {errors[`actionItem_${index}`]}
                                </div>
                              )}
                            </div>
                            <div className="col-md-3">
                              <input
                                type="date"
                                value={item.dueDate || ""}
                                onChange={(e) =>
                                  handleChangeActionItem(
                                    index,
                                    "dueDate",
                                    e.target.value
                                  )
                                }
                                className="form-control"
                              />
                            </div>
                            <div className="col-md-3">
                              <select
                                value={item.status || "Pending"}
                                onChange={(e) =>
                                  handleChangeActionItem(
                                    index,
                                    "status",
                                    e.target.value
                                  )
                                }
                                className="form-select"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                            <div className="col-md-2">
                              <button
                                type="button"
                                className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-1"
                                onClick={() => handleRemoveActionItem(index)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {item.assignedToEmployeeId && (
                            <small className="text-success">
                              ✓ Assigned to Employee ID: {item.assignedToEmployeeId}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-semibold mb-3 d-flex align-items-center gap-2">
                  <MessageSquare size={22} />
                  Comments & Observations
                </h5>
                <textarea
                  name="commentsObservations"
                  value={formData.commentsObservations}
                  onChange={handleCommentsChange}
                  className="form-control"
                  rows="5"
                  placeholder="Add any additional comments or observations about the meeting..."
                />
              </div>
            </div>


         
            <div className="d-flex gap-3 justify-content-end mb-4">
              <button
                type="button"
                className="btn btn-light px-4 d-flex align-items-center gap-2"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success px-4 d-flex align-items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
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
  );
};


export default CreateOrEditMom;
