import React, { useState, useEffect, useRef } from "react";
import employeeService from "../../../services/meeting/employeeservice";
import momService from "../../../services/meeting/momService";
import toastr from "toastr";

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

  // calendar state shared for the open action item
  const [calendarState, setCalendarState] = useState({
    openIndex: null,
    month: null,
    year: null,
  });

  // custom dropdown state for each action item
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

  // close all popups on outside click
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
      if (!clickedCal) setCalendarState((prev) => ({ ...prev, openIndex: null }));
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

  // ===== Calendar helpers =====
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

  // shared dropdown styles (like your Department component)
  const dropdownTriggerStyle = {
    width: "100%",
    borderRadius: "9999px",
    border: "1px solid #E5E7EB",
    backgroundColor: "#ffffff",
    padding: "0.35rem 0.75rem",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
  };

  const listContainerStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 2,
    backgroundColor: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: "0 0 10px 10px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
    zIndex: 20,
    maxHeight: 220,
    overflowY: "auto",
  };

  const itemStyle = (active) => ({
    padding: "8px 16px",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: active ? PRIMARY : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontSize: "0.85rem",
    borderBottom: "1px solid #F3F4F6",
  });

  return (
    <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: "12px" }}>
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
              <h6 className="fw-semibold mb-3 text-muted small">
                MEETING INFORMATION
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.meetingTitle}
                    disabled
                    style={{ backgroundColor: "#ffffff" }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">
                    Meeting Type
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.meetingType}
                    disabled
                    style={{ backgroundColor: "#ffffff" }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted d-flex align-items-center gap-2">
                    <i className="bi bi-people"></i>
                    Attendees
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleInputChange}
                    placeholder="Enter attendees (comma separated)..."
                    style={{ backgroundColor: "#ffffff", resize: "vertical" }}
                  />
                  <small className="text-muted">
                    List all meeting participants
                  </small>
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
              style={{ resize: "vertical" }}
            />
          </div>

         
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots"></i>
                Discussion Points
                {formData.discussionPoints.length > 0 && (
                  <span className="badge bg-primary">
                    {formData.discussionPoints.length}
                  </span>
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
                <i className="bi bi-chat-dots" style={{ fontSize: "1.5rem" }}></i>
                <div>
                  <p className="mb-0 fw-semibold">No discussion points added</p>
                  <small className="text-muted">
                    Click "Add Point" to document key topics discussed
                  </small>
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
                          style={{
                            width: "28px",
                            height: "28px",
                            flexShrink: 0,
                            fontSize: "0.8rem",
                          }}
                        >
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          className="form-control flex-grow-1"
                          value={dp.pointText}
                          onChange={(e) =>
                            handleDiscussionPointChange(index, e.target.value)
                          }
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
                  <span className="badge bg-success">
                    {formData.actionItems.length}
                  </span>
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
                <i
                  className="bi bi-check2-square"
                  style={{ fontSize: "1.5rem" }}
                ></i>
                <div>
                  <p className="mb-0 fw-semibold">No action items added</p>
                  <small className="text-muted">
                    Click "Add Action" to create tasks and assign them to team
                    members
                  </small>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {formData.actionItems.map((item, index) => {
                  const isCalendarOpen = calendarState.openIndex === index;
                  const selectedDate = item.dueDate
                    ? new Date(item.dueDate)
                    : null;

                  return (
                    <div key={index} className="card border shadow-sm">
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-muted">
                            Task Description *
                          </label>
                          <input
                            type="text"
                            className="form-control"
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

                        <div className="row g-2">
                         
                          <div className="col-md-5">
                            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                              <i className="bi bi-person-circle"></i>
                              Assign To *
                            </label>
                            <div
                              ref={(el) => (assignRefs.current[index] = el)}
                              style={{ position: "relative" }}
                            >
                             <button
  type="button"
  style={dropdownTriggerStyle}
  onClick={() =>
    setAssignOpenIndex(assignOpenIndex === index ? null : index)
  }
>
  <span
    style={{
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    {item.assignedToEmployeeId
      ? getEmployeeName(item.assignedToEmployeeId) || "Select employee..."
      : loadingEmployees
      ? "Loading..."
      : "Select employee..."}
  </span>
  <span style={{ display: "inline-flex", marginLeft: "0.25rem" }}>
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      style={{
        transition: "transform 0.2s ease",
        transform:
          assignOpenIndex === index ? "rotate(180deg)" : "rotate(0deg)",
        display: "block",
      }}
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
                                <div style={listContainerStyle}>
                                  {(loadingEmployees ? [] : employees).map(
                                    (emp) => {
                                      const active =
                                        String(item.assignedToEmployeeId) ===
                                        String(emp.employeeMasterId);
                                      return (
                                        <div
                                          key={emp.employeeMasterId}
                                          style={itemStyle(active)}
                                          onClick={() => {
                                            handleActionItemChange(
                                              index,
                                              "assignedToEmployeeId",
                                              emp.employeeMasterId
                                            );
                                            setAssignOpenIndex(null);
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                              PRIMARY;
                                            e.currentTarget.style.color =
                                              "#ffffff";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                              active ? PRIMARY : "#ffffff";
                                            e.currentTarget.style.color = active
                                              ? "#ffffff"
                                              : "#111827";
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
                                      <div
                                        style={{
                                          padding: "8px 16px",
                                          fontSize: "0.85rem",
                                          color: "#6b7280",
                                          textAlign: "center",
                                        }}
                                      >
                                        No employees
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                            {errors[`actionItem_${index}_assignedToEmployeeId`] && (
                              <div className="invalid-feedback d-block">
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
                                <small className="text-success d-flex align-items-center gap-1 mt-1">
                                  <i className="bi bi-check-circle"></i>
                                  Assigned to:{" "}
                                  <strong>
                                    {getEmployeeName(item.assignedToEmployeeId)}
                                  </strong>
                                </small>
                              )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                              <i className="bi bi-calendar-event"></i>
                              Due Date *
                            </label>
                            <div
                              ref={(el) => (calendarRefs.current[index] = el)}
                              style={{ position: "relative", width: "100%" }}
                            >
                              <input
                                type="text"
                                readOnly
                                value={formatDisplayDate(item.dueDate)}
                                placeholder="Select date"
                                className={`form-control form-control-sm ${
                                  errors[`actionItem_${index}_dueDate`]
                                    ? "is-invalid"
                                    : ""
                                }`}
                                style={{
                                  paddingRight: "2.3rem",
                                  cursor: "pointer",
                                  backgroundColor: "#ffffff",
                                }}
                                onClick={() => ensureCalendarMonthYear(index)}
                              />
                              <button
                                type="button"
                                onClick={() => ensureCalendarMonthYear(index)}
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  right: 8,
                                  transform: "translateY(-50%)",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
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
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    right: 0,
                                    backgroundColor: "white",
                                    borderRadius: 12,
                                    boxShadow:
                                      "0 14px 40px rgba(15, 23, 42, 0.18)",
                                    border: "1px solid #e5e7eb",
                                    zIndex: 9999,
                                    width: 260,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "0.5rem 0.75rem",
                                      borderBottom: "1px solid #e5e7eb",
                                      backgroundColor: "#f9fafb",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={goPrevMonth}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        padding: 4,
                                      }}
                                    >
                                      <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        color: "#111827",
                                      }}
                                    >
                                      {monthNames[month]} {year}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={goNextMonth}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        padding: 4,
                                      }}
                                    >
                                      <i className="bi bi-chevron-right"></i>
                                    </button>
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(7, 1fr)",
                                      padding: "0.25rem 0.75rem",
                                      gap: 2,
                                      fontSize: "0.75rem",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {weekdays.map((w) => (
                                      <div
                                        key={w}
                                        style={{
                                          textAlign: "center",
                                          padding: "0.25rem 0",
                                        }}
                                      >
                                        {w}
                                      </div>
                                    ))}
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(7, 1fr)",
                                      padding: "0.25rem 0.75rem 0.5rem 0.75rem",
                                      gap: 2,
                                    }}
                                  >
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

                                      const baseStyle = {
                                        textAlign: "center",
                                        padding: "0.35rem 0",
                                        borderRadius: 6,
                                        cursor: c.current
                                          ? "pointer"
                                          : "default",
                                        fontSize: "0.8rem",
                                      };

                                      let bg = "transparent";
                                      let color = c.current
                                        ? "#111827"
                                        : "#d1d5db";

                                      if (isToday) {
                                        bg = "rgba(39,35,92,0.08)";
                                      }
                                      if (isSelected) {
                                        bg = PRIMARY;
                                        color = "#ffffff";
                                      }

                                      return (
                                        <div
                                          key={idx}
                                          style={{
                                            ...baseStyle,
                                            backgroundColor: bg,
                                            color,
                                          }}
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

                                  <div
                                    style={{
                                      padding: "0.4rem 0.75rem 0.6rem",
                                      borderTop: "1px solid #e5e7eb",
                                      textAlign: "right",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => goToday(index)}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: PRIMARY,
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Today
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {errors[`actionItem_${index}_dueDate`] && (
                              <div className="invalid-feedback d-block">
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {errors[`actionItem_${index}_dueDate`]}
                              </div>
                            )}
                          </div>

                          <div className="col-md-3">
  <label className="form-label small fw-semibold text-muted">
    Status
  </label>
  <div
    ref={(el) => (statusRefs.current[index] = el)}
    style={{ position: "relative" }}
  >
    <button
      type="button"
      style={dropdownTriggerStyle}
      onClick={() =>
        setStatusOpenIndex(statusOpenIndex === index ? null : index)
      }
    >
      <span>{item.status}</span>
      <span style={{ display: "inline-flex", marginLeft: "0.25rem" }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          style={{
            transition: "transform 0.2s ease",
            transform: statusOpenIndex === index ? "rotate(180deg)" : "rotate(0deg)",
            display: "block",
          }}
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
      <div style={listContainerStyle}>
        {["Pending", "Completed"].map((st) => {
          const active = st === item.status;
          return (
            <div
              key={st}
              style={itemStyle(active)}
              onClick={() => {
                handleActionItemChange(index, "status", st);
                setStatusOpenIndex(null);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PRIMARY;
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = active ? PRIMARY : "#ffffff";
                e.currentTarget.style.color = active ? "#ffffff" : "#111827";
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
                  );
                })}
              </div>
            )}
          </div>

          <div className="d-flex gap-2 pt-3 border-top">
            <button
              type="submit"
              disabled={submitting || loadingEmployees}
              className="btn gradient-primary-button flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              style={{
                background:
                  "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                color: "#fff",
                border: "none",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(151, 36, 126, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
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
              className="btn btn-danger px-4 d-flex align-items-center gap-2"
              disabled={submitting}
              style={{ fontWeight: "500" }}
            >
              <i className="bi bi-x-circle"></i>
              Cancel
            </button>
          </div>
        </form>

        {formData.actionItems.length > 0 && (
          <div className="alert alert-info mt-3 mb-0 d-flex align-items-start gap-2">
            <i className="bi bi-info-circle mt-1 flex-shrink-0"></i>
            <div className="small">
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
