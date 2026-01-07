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

      const mappedActionItems = (mom.actionItems || []).map((item) => ({
        actionItemId: item.actionItemId,
        taskDescription: item.taskDescription || item.task || "",
        assignedToEmployeeId: item.assignedToEmployeeId,
        assignedToEmployeeName:
          item.assignedToEmployeeName || item.assignTo || "",
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
      newItems[index].assignedToEmployeeName = value;
      newItems[index].assignedToEmployeeId = employeeMap[value] || null;
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

  const validateForm = () => {
    const newErrors = {};
    if (!meetingData) newErrors.meeting = "Meeting details missing";

    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription && !item.assignedToEmployeeId) {
        newErrors[`actionItem_${index}`] =
          "Please select an employee for this task";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toastr.error(
        "Please check the form - make sure all action items have employees assigned"
      );
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
        <div className="alert alert-danger">Meeting data unavailable</div>
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
                        value={meetingData.meetingTitle}
                        disabled
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="momce-label">Meeting Type</label>
                      <input
                        type="text"
                        className="form-control momce-input"
                        value={meetingData.meetingType}
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
                        value={`${
                          meetingData.attendees?.length || 0
                        } participants`}
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
                      No discussion points added yet. Click "Add Point" to
                      start.
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
                              <textarea
                                value={dp.point || ""}
                                onChange={(e) =>
                                  handleChangeDiscussionPoint(
                                    index,
                                    e.target.value
                                  )
                                }
                                className="form-control momce-textarea flex-grow-1"
                                rows="2"
                                placeholder="Enter discussion point..."
                              />
                              <button
                                type="button"
                                className="btn momce-remove-btn"
                                onClick={() =>
                                  handleRemoveDiscussionPoint(index)
                                }
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
                                  className="form-control momce-input"
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
                                  className={`form-select momce-input ${
                                    errors[`actionItem_${index}`]
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                >
                                  <option value="">Assign to...</option>
                                  {allEmployees.map((emp) => {
                                    const fullName = `${emp.firstName} ${emp.lastName}`;
                                    return (
                                      <option
                                        key={emp.employeeMasterId}
                                        value={fullName}
                                      >
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
                                  className="form-control momce-input"
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
                            {item.assignedToEmployeeId && (
                              <small className="text-success">
                                ✓ Assigned to Employee ID:{" "}
                                {item.assignedToEmployeeId}
                              </small>
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
                  />
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
    </div>
  );
};

export default CreateOrEditMom;
