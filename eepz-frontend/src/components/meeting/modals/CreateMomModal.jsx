import React, { useState, useEffect, useRef } from "react";
import employeeService from "../../../services/meeting/employeeservice";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";
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

  const [calendarState, setCalendarState] = useState({
    openIndex: null,
    month: null,
    year: null,
  });

  const [assignOpenIndex, setAssignOpenIndex] = useState(null);
  const [statusOpenIndex, setStatusOpenIndex] = useState(null);
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
        console.error("Failed to fetch employees:", error);
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
      if (!clickedCal)
        setCalendarState((prev) => ({ ...prev, openIndex: null }));
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
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

    const errorKey = `actionItem_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
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
    if (calendarState.openIndex === index) {
      setCalendarState({ openIndex: null, month: null, year: null });
    }
    if (assignOpenIndex === index) setAssignOpenIndex(null);
    if (statusOpenIndex === index) setStatusOpenIndex(null);
  };

  const validateForm = () => {
    const newErrors = {};
    formData.actionItems.forEach((item, index) => {
      if (item.taskDescription.trim()) {
        if (!item.assignedToEmployeeId) {
          newErrors[`actionItem_${index}_assignedToEmployeeId`] =
            "Please assign this task";
        }
        if (!item.dueDate) {
          newErrors[`actionItem_${index}_dueDate`] = "Please set a due date";
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

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const ensureCalendarMonthYear = (index) => {
    setCalendarState((prev) => {
      const value = formData.actionItems[index]?.dueDate;
      const base = value ? new Date(value) : new Date();
      return {
        openIndex: prev.openIndex === index ? null : index,
        month: base.getMonth(),
        year: base.getFullYear(),
      };
    });
  };

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarState.month ?? today.getMonth();
    const year = calendarState.year ?? today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length, current: false });
    }
    return { cells, month, year };
  };

  const goPrevMonth = () => {
    setCalendarState((prev) => {
      if (prev.month === null || prev.year === null) return prev;
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { ...prev, month: m, year: y };
    });
  };

  const goNextMonth = () => {
    setCalendarState((prev) => {
      if (prev.month === null || prev.year === null) return prev;
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return { ...prev, month: m, year: y };
    });
  };

  const handleSelectCalendarDay = (index, day, current) => {
    if (!current) return;
    const { month, year } = calendarState;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    handleActionItemChange(index, "dueDate", `${yyyy}-${mm}-${dd}`);
    setCalendarState({ openIndex: null, month: null, year: null });
  };

  const goToday = (index) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    handleActionItemChange(index, "dueDate", `${yyyy}-${mm}-${dd}`);
    setCalendarState({
      openIndex: index,
      month: now.getMonth(),
      year: now.getFullYear(),
    });
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

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();

  return (
    <div className="cmm-modal-container">
      <div className="cmm-card-body">
        <div className="cmm-header">
          <h6 className="cmm-title">
            <i className="bi bi-file-text"></i>
            Create Meeting Minutes
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
                    <i className="bi bi-people"></i>
                    Attendees
                  </label>
                  <textarea
                    className="cmm-textarea cmm-textarea-compact cmm-input-sm"
                    rows="1"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleInputChange}
                    placeholder="Enter attendees (comma separated)..."
                  />
                  <small className="cmm-help-text">
                    List all meeting participants
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="cmm-section">
            <label className="cmm-label cmm-flex-gap">
              <i className="bi bi-chat-left-text"></i>
              Comments & Observations
            </label>
            <textarea
              className="cmm-textarea cmm-textarea-compact"
              rows="1"
              name="commentsObservations"
              value={formData.commentsObservations}
              onChange={handleInputChange}
              placeholder="Add any observations or notes about the meeting..."
            />
          </div>

          <div className="cmm-section">
            <div className="cmm-section-header">
              <label className="cmm-section-label cmm-flex-gap">
                <i className="bi bi-chat-dots"></i>
                Discussion Points
              </label>
              <button
                type="button"
                className="cmm-btn cmm-btn-sm cmm-btn-outline-primary cmm-flex-gap"
                onClick={addDiscussionPoint}
              >
                <i className="bi bi-plus-circle"></i>
                Add Point
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
                <i className="bi bi-check2-square"></i>
                Action Items
              </label>
              <button
                type="button"
                className="cmm-btn cmm-btn-sm cmm-btn-outline-success cmm-flex-gap"
                onClick={addActionItem}
              >
                <i className="bi bi-plus-circle"></i>
                Add Action
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
                  const isCalendarOpen = calendarState.openIndex === index;
                  const selectedDate = item.dueDate
                    ? new Date(item.dueDate)
                    : null;

                  return (
                    <div key={index} className="cmm-action-item">
                      <div className="cmm-action-body">
                        <div className="cmm-mb-3">
                          <label className="cmm-label">
                            Task Description *
                          </label>
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
                              <i className="bi bi-person-circle"></i>
                              Assign To *
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
                                    ? getEmployeeName(
                                        item.assignedToEmployeeId
                                      ) || "Select employee..."
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
                                  {(loadingEmployees ? [] : employees).map(
                                    (emp) => {
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
                                    }
                                  )}
                                  {!loadingEmployees &&
                                    employees.length === 0 && (
                                      <div className="cmm-no-employees">
                                        No employees
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                            {errors[
                              `actionItem_${index}_assignedToEmployeeId`
                            ] && (
                              <div className="cmm-error">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {
                                  errors[
                                    `actionItem_${index}_assignedToEmployeeId`
                                  ]
                                }
                              </div>
                            )}
                            {item.assignedToEmployeeId &&
                              getEmployeeName(item.assignedToEmployeeId) && (
                                <small className="cmm-success-text">
                                  <i className="bi bi-check-circle"></i>
                                  Assigned to:{" "}
                                  <strong>
                                    {getEmployeeName(item.assignedToEmployeeId)}
                                  </strong>
                                </small>
                              )}
                          </div>

                          <div className="cmm-col-md-4">
                            <label className="cmm-label cmm-flex-gap">
                              <i className="bi bi-calendar-event"></i>
                              Due Date *
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
                                  errors[`actionItem_${index}_dueDate`]
                                    ? "cmm-is-invalid"
                                    : ""
                                }`}
                                onClick={() => ensureCalendarMonthYear(index)}
                              />
                              <button
                                type="button"
                                className="cmm-calendar-trigger"
                                onClick={() => ensureCalendarMonthYear(index)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 18 18"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    x="1.25"
                                    y="2.25"
                                    width="15.5"
                                    height="14.5"
                                    rx="3"
                                    ry="3"
                                    fill="none"
                                    stroke={PRIMARY}
                                    strokeWidth="1.8"
                                  />
                                  <rect
                                    x="3.5"
                                    y="4.25"
                                    width="11"
                                    height="2.6"
                                    rx="1.3"
                                    fill={PRIMARY}
                                  />
                                  <rect
                                    x="6"
                                    y="2"
                                    width="1.8"
                                    height="3"
                                    rx="0.9"
                                    fill={PRIMARY}
                                  />
                                  <rect
                                    x="10.5"
                                    y="2"
                                    width="1.8"
                                    height="3"
                                    rx="0.9"
                                    fill={PRIMARY}
                                  />
                                </svg>
                              </button>

                              {isCalendarOpen && (
                                <div className="cmm-calendar">
                                  <div className="cmm-calendar-header">
                                    <button
                                      type="button"
                                      className="cmm-calendar-nav"
                                      onClick={goPrevMonth}
                                    >
                                      <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <span className="cmm-calendar-title">
                                      {monthNames[month]} {year}
                                    </span>
                                    <button
                                      type="button"
                                      className="cmm-calendar-nav"
                                      onClick={goNextMonth}
                                    >
                                      <i className="bi bi-chevron-right"></i>
                                    </button>
                                  </div>

                                  <div className="cmm-calendar-weekdays">
                                    {weekdays.map((w) => (
                                      <div key={w} className="cmm-weekday">
                                        {w}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="cmm-calendar-days">
                                    {cells.map((c, idx) => {
                                      const cellDate = new Date(
                                        year,
                                        month,
                                        c.day
                                      );
                                      const isToday =
                                        c.current &&
                                        cellDate.getDate() ===
                                          today.getDate() &&
                                        cellDate.getMonth() ===
                                          today.getMonth() &&
                                        cellDate.getFullYear() ===
                                          today.getFullYear();
                                      const isSelected =
                                        selectedDate &&
                                        c.current &&
                                        cellDate.getDate() ===
                                          selectedDate.getDate() &&
                                        cellDate.getMonth() ===
                                          selectedDate.getMonth() &&
                                        cellDate.getFullYear() ===
                                          selectedDate.getFullYear();

                                      return (
                                        <div
                                          key={idx}
                                          className={`cmm-calendar-day ${
                                            c.current ? "cmm-current" : ""
                                          } ${isToday ? "cmm-today" : ""} ${
                                            isSelected ? "cmm-selected" : ""
                                          }`}
                                          onClick={() =>
                                            handleSelectCalendarDay(
                                              index,
                                              c.day,
                                              c.current
                                            )
                                          }
                                        >
                                          {c.day}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="cmm-calendar-footer">
                                    <button
                                      type="button"
                                      className="cmm-today-btn"
                                      onClick={() => goToday(index)}
                                    >
                                      Today
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {errors[`actionItem_${index}_dueDate`] && (
                              <div className="cmm-error">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {errors[`actionItem_${index}_dueDate`]}
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

                        <div className="cmm-action-footer">
                          <button
                            type="button"
                            className="cmm-btn cmm-btn-sm cmm-btn-outline-danger cmm-flex-gap"
                            onClick={() => removeActionItem(index)}
                          >
                            <i className="bi bi-trash"></i>
                            Remove Action Item
                          </button>
                        </div>
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
        </form>

        {formData.actionItems.length > 0 && (
          <div className="cmm-note">
            <i className="bi bi-info-circle cmm-note-icon"></i>
            <div>
              <strong>Note:</strong> All assigned employees will be notified via
              email about their action items.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMomModal;
