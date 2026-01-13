import React, { useState, useEffect, useRef } from "react";
import employeeService from "../../../services/meeting/employeeservice";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";
import CustomCalendar from "../../../components/project_management_components/common/CustomCalendar";
import "../../../styles/mom/modals/CreateMomModal.css";

const PRIMARY = "#27235C";

const CreateMomModal = ({ meetingData, onClose }) => {
  const userId = parseInt(localStorage.getItem("userId")) || 0;
  const userRole = localStorage.getItem("userRole") || "Employee";

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    meetingId: meetingData.meetingId || 0,
    meetingTitle: meetingData.meetingTitle || "",
    meetingType: meetingData.meetingType || "",
    meetingDate: meetingData.meetingDate || new Date().toISOString(),
    meetingLink: meetingData.meetingLink || "",
    attendees: meetingData.attendees || "",
    commentsObservations: meetingData.commentsObservations || "",
    submittedByEmployeeId: userId,
    submittedByRole: userRole,
    isEditable: true,
    discussionPoints:
      meetingData.discussionPoints?.map((dp, index) => ({
        pointId: 0,
        pointText: dp.pointText || "",
        pointOrder: index + 1,
      })) || [],
    actionItems:
      meetingData.actionItems?.map((ai) => ({
        actionItemId: 0,
        taskDescription: ai.taskDescription || "",
        assignedToEmployeeId: ai.assignedToEmployeeId || "",
        dueDate: ai.dueDate || "",
        status: ai.status || "Pending",
      })) || [],
  });

  const [errors, setErrors] = useState({});
  const [assignOpenIndex, setAssignOpenIndex] = useState(null);
  const [statusOpenIndex, setStatusOpenIndex] = useState(null);

  const [calendarOpenIndex, setCalendarOpenIndex] = useState(null);

  const assignRefs = useRef({});
  const statusRefs = useRef({});
  const calendarRefs = useRef({});

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await employeeService.getAllEmployees();
        if (response.success && response.data) {
          const filteredEmployees = response.data.filter(
            (emp) => emp.roleName !== "System Administrator"
          );
          setEmployees(filteredEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
        toastr.error("Failed to load employee list");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const path = e.composedPath ? e.composedPath() : [];

      const clickedAssign = Object.values(assignRefs.current).some((ref) =>
        ref ? path.includes(ref) : false
      );
      const clickedStatus = Object.values(statusRefs.current).some((ref) =>
        ref ? path.includes(ref) : false
      );
      const clickedCal = Object.values(calendarRefs.current).some((ref) =>
        ref ? path.includes(ref) : false
      );

      if (!clickedAssign) setAssignOpenIndex(null);
      if (!clickedStatus) setStatusOpenIndex(null);
      if (!clickedCal) setCalendarOpenIndex(null);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleDiscussionPointChange = (index, value) => {
    const updated = [...formData.discussionPoints];
    updated[index].pointText = value;
    setFormData((prev) => ({ ...prev, discussionPoints: updated }));
  };

  const addDiscussionPoint = () => {
    setFormData((prev) => ({
      ...prev,
      discussionPoints: [
        ...prev.discussionPoints,
        {
          pointId: 0,
          pointText: "",
          pointOrder: prev.discussionPoints.length + 1,
        },
      ],
    }));
  };

  const removeDiscussionPoint = (index) => {
    const updated = formData.discussionPoints.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, discussionPoints: updated }));
  };

  const handleActionItemChange = (index, field, value) => {
    const updated = [...formData.actionItems];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, actionItems: updated }));

    const errorKey = `actionItem[${index}].${field}`;
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: null }));
  };

  const addActionItem = () => {
    setFormData((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        {
          actionItemId: 0,
          taskDescription: "",
          assignedToEmployeeId: "",
          dueDate: "",
          status: "Pending",
        },
      ],
    }));
  };

  const removeActionItem = (index) => {
    const updated = formData.actionItems.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, actionItems: updated }));

    if (calendarOpenIndex === index) setCalendarOpenIndex(null);
    if (assignOpenIndex === index) setAssignOpenIndex(null);
    if (statusOpenIndex === index) setStatusOpenIndex(null);
  };

  const validateForm = () => {
    const newErrors = {};
    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription.trim()) {
        if (!item.assignedToEmployeeId) {
          newErrors[`actionItem[${index}].assignedToEmployeeId`] =
            "Please assign this task";
        }
        if (!item.dueDate) {
          newErrors[`actionItem[${index}].dueDate`] = "Please set a due date";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toastr.error("Please fix the errors before submitting");
      return;
    }
    setSubmitting(true);
    try {
      await momService.createMom(formData);
      toastr.success("MOM created successfully");
      onClose();
      window.location.reload();
    } catch (err) {
      toastr.error("Failed to create MOM");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getEmployeeName = (employeeMasterId) => {
    const employee = employees.find(
      (e) => e.employeeMasterId === parseInt(employeeMasterId)
    );
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleDueDateChange = (index, value) => {
    handleActionItemChange(index, "dueDate", value);
    setCalendarOpenIndex(null);
  };

  return (
    <div className="cmm-modal-container">
      <div className="cmm-card-body">
        <div className="cmm-header">
          <h6 className="cmm-title">
            <i className="bi bi-file-text"></i> Create Meeting Minutes
          </h6>
          <button
            type="button"
            className="cmm-close-btn"
            onClick={onClose}
          ></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cmm-info-card">
            <div className="cmm-info-card-body">
              <h6 className="cmm-section-title">MEETING INFORMATION</h6>
              <div className="cmm-row">
                <div className="cmm-col-md-6">
                  <label className="cmm-label">Meeting Title</label>
                  <input
                    type="text"
                    className="cmm-input cmm-input-sm"
                    value={formData.meetingTitle}
                    disabled
                  />
                </div>
                <div className="cmm-col-md-6">
                  <label className="cmm-label">Meeting Type</label>
                  <input
                    type="text"
                    className="cmm-input cmm-input-sm"
                    value={formData.meetingType}
                    disabled
                  />
                </div>
                <div className="cmm-col-12">
                  <label className="cmm-label cmm-flex-gap">
                    <i className="bi bi-people"></i> Attendees
                  </label>
                  <textarea
                    className="cmm-textarea cmm-textarea-compact cmm-input-sm"
                    rows="1"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleInputChange}
                    placeholder="Enter attendees (comma separated)..."
                  ></textarea>
                  <small className="cmm-help-text">
                    List all meeting participants
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="cmm-section">
            <label className="cmm-label cmm-flex-gap">
              <i className="bi bi-chat-left-text"></i> Comments & Observations
            </label>
            <textarea
              className="cmm-textarea cmm-textarea-compact"
              rows="1"
              name="commentsObservations"
              value={formData.commentsObservations}
              onChange={handleInputChange}
              placeholder="Add any observations or notes about the meeting..."
            ></textarea>
          </div>

          <div className="cmm-section">
            <div className="cmm-section-header">
              <label className="cmm-section-label cmm-flex-gap">
                <i className="bi bi-chat-dots"></i> Discussion Points
              </label>
              <button
                type="button"
                className="cmm-btn cmm-btn-sm cmm-btn-outline-primary cmm-flex-gap"
                onClick={addDiscussionPoint}
              >
                <i className="bi bi-plus-circle"></i> Add Point
              </button>
            </div>

            {formData.discussionPoints.length === 0 ? (
              <div className="cmm-empty-state">
                <i className="cmm-empty-icon bi bi-chat-dots"></i>
                <div>
                  <p className="cmm-empty-title">No discussion points added</p>
                  <small className="cmm-empty-subtitle">
                    Click "Add Point" to document key topics discussed
                  </small>
                </div>
              </div>
            ) : (
              <div className="cmm-discussion-list">
                {formData.discussionPoints.map((dp, index) => (
                  <div key={index} className="cmm-discussion-item">
                    <div className="cmm-discussion-body">
                      <div className="cmm-discussion-row">
                        <input
                          type="text"
                          className="cmm-input cmm-flex-grow-1"
                          value={dp.pointText}
                          onChange={(e) =>
                            handleDiscussionPointChange(index, e.target.value)
                          }
                          placeholder="Enter discussion point..."
                        />
                        <button
                          type="button"
                          className="cmm-btn cmm-btn-sm cmm-btn-outline-danger cmm-flex-center"
                          onClick={() => removeDiscussionPoint(index)}
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

          <div className="cmm-section">
            <div className="cmm-section-header">
              <label className="cmm-section-label cmm-flex-gap">
                <i className="bi bi-check2-square"></i> Action Items
              </label>
              <button
                type="button"
                className="cmm-btn cmm-btn-sm cmm-btn-outline-success cmm-flex-gap"
                onClick={addActionItem}
              >
                <i className="bi bi-plus-circle"></i> Add Action
              </button>
            </div>

            {formData.actionItems.length === 0 ? (
              <div className="cmm-empty-state">
                <i className="cmm-empty-icon bi bi-check2-square"></i>
                <div>
                  <p className="cmm-empty-title">No action items added</p>
                  <small className="cmm-empty-subtitle">
                    Click "Add Action" to create tasks and assign them to team
                    members
                  </small>
                </div>
              </div>
            ) : (
              <div className="cmm-action-list">
                {formData.actionItems.map((item, index) => {
                  const isCalendarOpen = calendarOpenIndex === index;

                  return (
                    <div key={index} className="cmm-action-item">
                      <div className="cmm-action-body">
                        <div className="cmm-mb-3">
                          <label className="cmm-label">Task Description</label>
                          <input
                            type="text"
                            className="cmm-input"
                            value={item.taskDescription}
                            onChange={(e) =>
                              handleActionItemChange(
                                index,
                                "taskDescription",
                                e.target.value
                              )
                            }
                            placeholder="Describe the action item..."
                          />
                        </div>

                        <div className="cmm-row cmm-row-equal">
                          <div className="cmm-col-md-4">
                            <label className="cmm-label cmm-flex-gap">
                              <i className="bi bi-person-circle"></i> Assign To
                            </label>
                            <div
                              ref={(el) => (assignRefs.current[index] = el)}
                              className="cmm-relative"
                            >
                              <button
                                type="button"
                                className={`cmm-dropdown-trigger ${
                                  assignOpenIndex === index
                                    ? "cmm-dropdown-open"
                                    : ""
                                }`}
                                onClick={() =>
                                  setAssignOpenIndex(
                                    assignOpenIndex === index ? null : index
                                  )
                                }
                              >
                                <span className="cmm-dropdown-text">
                                  {item.assignedToEmployeeId
                                    ? getEmployeeName(item.assignedToEmployeeId)
                                    : loadingEmployees
                                    ? "Loading..."
                                    : "Select employee..."}
                                </span>
                                <span className="cmm-dropdown-arrow">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                  >
                                    <polyline
                                      points="6 9 12 15 18 9"
                                      fill="none"
                                      stroke={PRIMARY}
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </button>

                              {assignOpenIndex === index && (
                                <div className="cmm-dropdown-list">
                                  {loadingEmployees ? (
                                    <div className="cmm-no-employees">
                                      Loading...
                                    </div>
                                  ) : employees.length > 0 ? (
                                    employees.map((emp) => {
                                      const active =
                                        String(item.assignedToEmployeeId) ===
                                        String(emp.employeeMasterId);
                                      return (
                                        <div
                                          key={emp.employeeMasterId}
                                          className={`cmm-dropdown-item ${
                                            active ? "cmm-active" : ""
                                          }`}
                                          onClick={() => {
                                            handleActionItemChange(
                                              index,
                                              "assignedToEmployeeId",
                                              emp.employeeMasterId
                                            );
                                            setAssignOpenIndex(null);
                                          }}
                                        >
                                          {emp.firstName} {emp.lastName} -{" "}
                                          {emp.roleName}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="cmm-no-employees">
                                      No employees
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {errors[
                              `actionItem[${index}].assignedToEmployeeId`
                            ] && (
                              <div className="cmm-error">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {
                                  errors[
                                    `actionItem[${index}].assignedToEmployeeId`
                                  ]
                                }
                              </div>
                            )}

                            {item.assignedToEmployeeId && (
                              <small className="cmm-success-text">
                                <i className="bi bi-check-circle"></i> Assigned
                                to{" "}
                                <strong>
                                  {getEmployeeName(item.assignedToEmployeeId)}
                                </strong>
                              </small>
                            )}
                          </div>

                          <div className="cmm-col-md-4">
                            <label className="cmm-label cmm-flex-gap">
                              <i className="bi bi-calendar-event"></i> Due Date
                            </label>

                            <div
                              ref={(el) => (calendarRefs.current[index] = el)}
                              className="cmm-relative cmm-w-100"
                            >
                              <input
                                type="text"
                                readOnly
                                value={formatDisplayDate(item.dueDate)}
                                placeholder="Select date"
                                className={`cmm-input cmm-input-sm ${
                                  errors[`actionItem[${index}].dueDate`]
                                    ? "cmm-is-invalid"
                                    : ""
                                }`}
                                onClick={() =>
                                  setCalendarOpenIndex(
                                    calendarOpenIndex === index ? null : index
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="cmm-calendar-trigger"
                                onClick={() =>
                                  setCalendarOpenIndex(
                                    calendarOpenIndex === index ? null : index
                                  )
                                }
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                  <rect
                                    x="4"
                                    y="5"
                                    width="16"
                                    height="15"
                                    rx="2"
                                    ry="2"
                                    stroke={PRIMARY}
                                    strokeWidth="1.8"
                                    fill="none"
                                  />

                                  <line
                                    x1="4"
                                    y1="9"
                                    x2="20"
                                    y2="9"
                                    stroke={PRIMARY}
                                    strokeWidth="1.8"
                                  />

                                  <line
                                    x1="9"
                                    y1="3"
                                    x2="9"
                                    y2="7"
                                    stroke={PRIMARY}
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                  />

                                  <line
                                    x1="15"
                                    y1="3"
                                    x2="15"
                                    y2="7"
                                    stroke={PRIMARY}
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>

                            <CustomCalendar
                              isOpen={isCalendarOpen}
                              onClose={() => setCalendarOpenIndex(null)}
                              value={item.dueDate}
                              onChange={(value) =>
                                handleDueDateChange(index, value)
                              }
                              anchorRef={{
                                current: calendarRefs.current[index],
                              }}
                              position="below-icon"
                              align="left"
                              offset={{ x: 0, y: 0 }}
                            />

                            {errors[`actionItem[${index}].dueDate`] && (
                              <div className="cmm-error">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {errors[`actionItem[${index}].dueDate`]}
                              </div>
                            )}
                          </div>

                          <div className="cmm-col-md-4">
                            <label className="cmm-label">Status</label>

                            <div
                              ref={(el) => (statusRefs.current[index] = el)}
                              className="cmm-relative"
                            >
                              <button
                                type="button"
                                className={`cmm-dropdown-trigger ${
                                  statusOpenIndex === index
                                    ? "cmm-dropdown-open"
                                    : ""
                                }`}
                                onClick={() =>
                                  setStatusOpenIndex(
                                    statusOpenIndex === index ? null : index
                                  )
                                }
                              >
                                <span className="cmm-dropdown-text">
                                  {item.status}
                                </span>
                                <span className="cmm-dropdown-arrow">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                  >
                                    <polyline
                                      points="6 9 12 15 18 9"
                                      fill="none"
                                      stroke={PRIMARY}
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </button>

                              {statusOpenIndex === index && (
                                <div className="cmm-dropdown-list">
                                  {["Pending", "Completed"].map((st) => {
                                    const active = st === item.status;
                                    return (
                                      <div
                                        key={st}
                                        className={`cmm-dropdown-item ${
                                          active ? "cmm-active" : ""
                                        }`}
                                        onClick={() => {
                                          handleActionItemChange(
                                            index,
                                            "status",
                                            st
                                          );
                                          setStatusOpenIndex(null);
                                        }}
                                      >
                                        {st}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="cmm-action-footer">
                        <button
                          type="button"
                          className="cmm-btn cmm-btn-sm cmm-btn-outline-danger cmm-flex-gap"
                          onClick={() => removeActionItem(index)}
                        >
                          <i className="bi bi-trash"></i> Remove Action Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cmm-actions">
            <button
              type="submit"
              disabled={submitting || loadingEmployees}
              className="cmm-submit-btn cmm-flex-center cmm-flex-grow-1"
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm cmm-mr-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating MOM...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle cmm-mr-2"></i>
                  Create MOM
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cmm-cancel-btn cmm-flex-center"
              disabled={submitting}
            >
              <i className="bi bi-x-circle cmm-mr-2"></i>
              Cancel
            </button>
          </div>

          {formData.actionItems.length > 0 && (
            <div className="cmm-note">
              <i className="bi bi-info-circle cmm-note-icon"></i>
              <div>
                <strong>Note:</strong> All assigned employees will be notified
                via email about their action items.
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateMomModal;
