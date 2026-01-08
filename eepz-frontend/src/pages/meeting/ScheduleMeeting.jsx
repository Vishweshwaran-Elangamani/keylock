import React, { useState, useEffect, useRef } from "react";
import meetingService from "../../services/meeting/meetingService";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  FileText,
  Search,
  Check,
  X,
  Plus,
  Home,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { employeeApi } from "../../services/feedbackmanagement/feedbackApi";
import "../../styles/mom/components/ScheduleMeeting.css";

const PRIMARY = "#27235C";

const ScheduleMeeting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    meetingType: "One-on-One",
    meetingTitle: "",
    participantEmployeeIds: [],
    meetingDate: "",
    meetingTime: "",
    duration: "1",
    meetingLink: "",
    agenda: "",
    sendCalendarInvite: true,
    reminder: 1,
  });
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [meetingTypeOpen, setMeetingTypeOpen] = useState(false);
  const meetingTypeRef = useRef(null);

  const [durationOpen, setDurationOpen] = useState(false);
  const durationRef = useRef(null);

  const [oneOnOneOpen, setOneOnOneOpen] = useState(false);
  const oneOnOneRef = useRef(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarYear, setCalendarYear] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (formData.meetingType === "One-on-One") {
        try {
          const response = await employeeApi.getSubordinates();
          if (response.success) {
            const items = response.data.items.map((item) => ({
              employeeId: item.employeeId,
              firstName: item.employeeName,
              lastName: "",
              email: item.email,
              roleName: "",
              departmentName: item.departmentName,
            }));
            setEmployeeOptions(items);
            if (items.length > 0) {
              setFormData((prev) => ({
                ...prev,
                participantEmployeeIds: [items[0].employeeId],
              }));
            }
          } else {
            toastr.error("Failed to fetch subordinates");
          }
        } catch (error) {
          toastr.error("Error fetching subordinates");
          console.error(error);
        }
      } else {
        try {
          const response = await meetingService.getAll();
          if (response.success) {
            setEmployeeOptions(response.data);
          } else {
            toastr.error("Failed to fetch employees");
          }
          setFormData((prev) => ({
            ...prev,
            participantEmployeeIds: [],
          }));
        } catch (error) {
          toastr.error("Error fetching employees");
          console.error(error);
        }
      }
    };
    fetchParticipants();
  }, [formData.meetingType]);

  useEffect(() => {
    const handler = (e) => {
      if (meetingTypeRef.current && !meetingTypeRef.current.contains(e.target))
        setMeetingTypeOpen(false);
      if (durationRef.current && !durationRef.current.contains(e.target))
        setDurationOpen(false);
      if (oneOnOneRef.current && !oneOnOneRef.current.contains(e.target))
        setOneOnOneOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setCalendarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOneOnOneChange = (empId) => {
    setFormData((prev) => ({
      ...prev,
      participantEmployeeIds: [empId],
    }));
  };

  const handleCheckboxChange = (empId) => {
    setFormData((prev) => {
      const isSelected = prev.participantEmployeeIds.includes(empId);
      if (isSelected) {
        return {
          ...prev,
          participantEmployeeIds: prev.participantEmployeeIds.filter(
            (id) => id !== empId
          ),
        };
      } else {
        return {
          ...prev,
          participantEmployeeIds: [...prev.participantEmployeeIds, empId],
        };
      }
    });
  };

  const generateTeamsLink = () => {
    const link = "https://teams.microsoft.com/meeting-xyz-" + Date.now();
    setFormData((prev) => ({ ...prev, meetingLink: link }));
    toastr.success("Teams link generated");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.meetingTitle ||
      !formData.meetingDate ||
      !formData.meetingTime ||
      formData.participantEmployeeIds.length === 0
    ) {
      toastr.error(
        "Please fill all required fields and select at least one participant."
      );
      return;
    }
    try {
      setLoading(true);
      const payload = {
        meetingTitle: formData.meetingTitle,
        meetingType: formData.meetingType,
        meetingDate: `${formData.meetingDate}T${formData.meetingTime}:00`,
        meetingLink: formData.meetingLink,
        agenda: formData.agenda,
        participantEmployeeIds: formData.participantEmployeeIds,
        duration: formData.duration,
        sendCalendarInvite: formData.sendCalendarInvite,
        reminder: formData.reminder,
      };
      await meetingService.scheduleMeeting(payload);
      toastr.success("Meeting scheduled successfully!");
      navigate("/manager/dashboard/meetmom");
    } catch (err) {
      toastr.error("Failed to schedule meeting");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employeeOptions.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const meetingTypeOptions = [
    "One-on-One",
    "Team Meeting",
    "Presentation",
    "Other",
  ];

  const durationOptions = [
    { value: "0.5", label: "30 minutes" },
    { value: "1", label: "1 hour" },
    { value: "1.5", label: "1.5 hours" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
  ];

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const ensureCalendarMonthYear = () => {
    if (calendarMonth === null || calendarYear === null) {
      const base = formData.meetingDate
        ? new Date(formData.meetingDate)
        : new Date();
      setCalendarMonth(base.getMonth());
      setCalendarYear(base.getFullYear());
    }
  };

  const getCalendarMatrix = () => {
    const today = new Date();
    const month = calendarMonth ?? today.getMonth();
    const year = calendarYear ?? today.getFullYear();

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

  const { cells, month, year } = getCalendarMatrix();
  const today = new Date();
  const selectedDate = formData.meetingDate
    ? new Date(formData.meetingDate)
    : null;

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

  const handleSelectCalendarDay = (day, current) => {
    if (!current) return;
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    const value = `${yyyy}-${mm}-${dd}`;
    setFormData((prev) => ({ ...prev, meetingDate: value }));
    setCalendarOpen(false);
  };

  const goPrevMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goNextMonth = () => {
    if (calendarMonth === null || calendarYear === null) return;
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const goToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setFormData((prev) => ({ ...prev, meetingDate: `${yyyy}-${mm}-${dd}` }));
    setCalendarMonth(now.getMonth());
    setCalendarYear(now.getFullYear());
    setCalendarOpen(false);
  };

  return (
    <div className="container-fluid sched-page">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          <nav aria-label="breadcrumb" className="sched-breadcrumb-nav">
            <ol className="breadcrumb mb-0 d-flex align-items-center sched-breadcrumb">
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/")}
                  className="sched-breadcrumb-link"
                  style={{ display: "flex", alignItems: "center", padding: 0 }}
                >
                  <Home size={18} />
                </button>
              </li>

              <li
                className="sched-breadcrumb-separator"
                style={{ margin: "0 4px" }}
              >
                /
              </li>

              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/meetmom")}
                  className="sched-breadcrumb-link"
                  style={{ padding: 0, marginLeft: "2px" }}
                >
                  Meeting and MoM
                </button>
              </li>

              <li
                className="sched-breadcrumb-separator"
                style={{ margin: "0 4px" }}
              >
                /
              </li>

              <li className="breadcrumb-item active d-flex align-items-center">
                <span
                  className="sched-breadcrumb-current"
                  style={{ marginLeft: "2px" }}
                >
                  Schedule Meeting
                </span>
              </li>
            </ol>
          </nav>

          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm mb-4 border-0 rounded-3">
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={20} /> Meeting Type
                    </label>
                    <div ref={meetingTypeRef} className="sched-dropdown-wrap">
                      <button
                        type="button"
                        className="sched-dropdown-btn"
                        onClick={() => setMeetingTypeOpen((prev) => !prev)}
                      >
                        <span className="sched-dropdown-label">
                          {formData.meetingType}
                        </span>
                        {meetingTypeOpen ? (
                          <ChevronUp size={18} color="#6B7280" />
                        ) : (
                          <ChevronDown size={18} color="#6B7280" />
                        )}
                      </button>
                      {meetingTypeOpen && (
                        <div className="sched-dropdown-menu">
                          {meetingTypeOptions.map((opt) => {
                            const active = opt === formData.meetingType;
                            return (
                              <div
                                key={opt}
                                className={`sched-dropdown-item${
                                  active ? " sched-dropdown-item-active" : ""
                                }`}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    meetingType: opt,
                                  }));
                                  setMeetingTypeOpen(false);
                                }}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <FileText size={20} /> Meeting Title{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="meetingTitle"
                      value={formData.meetingTitle}
                      onChange={handleInputChange}
                      className="form-control sched-input"
                      placeholder="Enter meeting title..."
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={20} /> Select Participant
                      {formData.meetingType !== "One-on-One" ? "s" : ""}{" "}
                      <span className="text-danger">*</span>
                    </label>

                    <div className="input-group mb-3 sched-search-group">
                      <span className="input-group-text bg-white border-end-0 sched-search-icon">
                        <Search size={20} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0 sched-input"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {formData.meetingType === "One-on-One" ? (
                      <div ref={oneOnOneRef} className="sched-dropdown-wrap">
                        <button
                          type="button"
                          className="sched-dropdown-btn"
                          onClick={() => setOneOnOneOpen((prev) => !prev)}
                        >
                          <span className="sched-dropdown-label">
                            {(() => {
                              const id = formData.participantEmployeeIds[0];
                              const emp = employeeOptions.find(
                                (e) => e.employeeId === id
                              );
                              if (!emp) return "Select employee";
                              return `${emp.firstName} ${emp.lastName || ""}${
                                emp.departmentName
                                  ? ` - ${emp.departmentName}`
                                  : ""
                              }`;
                            })()}
                          </span>
                          {oneOnOneOpen ? (
                            <ChevronUp size={18} color="#6B7280" />
                          ) : (
                            <ChevronDown size={18} color="#6B7280" />
                          )}
                        </button>
                        {oneOnOneOpen && (
                          <div className="sched-dropdown-menu">
                            {filteredEmployees.length === 0 ? (
                              <div className="sched-dropdown-empty">
                                No employees found
                              </div>
                            ) : (
                              filteredEmployees.map((emp) => {
                                const active =
                                  formData.participantEmployeeIds[0] ===
                                  emp.employeeId;
                                return (
                                  <div
                                    key={emp.employeeId}
                                    className={`sched-dropdown-item${
                                      active
                                        ? " sched-dropdown-item-active"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      handleOneOnOneChange(emp.employeeId);
                                      setOneOnOneOpen(false);
                                    }}
                                  >
                                    {emp.firstName} {emp.lastName}{" "}
                                    {emp.departmentName &&
                                      `- ${emp.departmentName}`}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="border rounded sched-multi-list">
                          <table className="table table-hover mb-0">
                            <thead className="table-light sched-table-head">
                              <tr>
                                <th className="text-start sched-th-select">
                                  Select
                                </th>
                                <th className="text-start sched-th">Name</th>
                                <th className="text-start sched-th">Role</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEmployees.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="text-center py-2 text-muted sched-td"
                                  >
                                    No employees found
                                  </td>
                                </tr>
                              ) : (
                                filteredEmployees.map((emp) => (
                                  <tr
                                    key={emp.employeeId}
                                    onClick={() =>
                                      handleCheckboxChange(emp.employeeId)
                                    }
                                    className="sched-row-click"
                                  >
                                    <td className="text-start">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input sched-check"
                                          type="checkbox"
                                          checked={formData.participantEmployeeIds.includes(
                                            emp.employeeId
                                          )}
                                          onChange={() =>
                                            handleCheckboxChange(emp.employeeId)
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </td>
                                    <td className="text-start sched-td">
                                      {emp.firstName} {emp.lastName}
                                    </td>
                                    <td className="text-start">
                                      <span className="badge bg-light text-dark border sched-role-badge">
                                        {emp.roleName ||
                                          emp.departmentName ||
                                          "-"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2 sched-selected-alert">
                          <Check size={20} />
                          <span>
                            <strong>
                              {formData.participantEmployeeIds.length}
                            </strong>{" "}
                            participant
                            {formData.participantEmployeeIds.length !== 1
                              ? "s"
                              : ""}{" "}
                            selected
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2">
                          <CalendarIcon size={20} /> Meeting Date{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <div ref={calendarRef} className="sched-date-wrap">
                          <input
                            type="text"
                            readOnly
                            value={formatDisplayDate(formData.meetingDate)}
                            onClick={() => {
                              ensureCalendarMonthYear();
                              setCalendarOpen((o) => !o);
                            }}
                            disabled={loading}
                            placeholder="Select date"
                            className={`sched-date-input${
                              loading ? " sched-date-input-disabled" : ""
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              ensureCalendarMonthYear();
                              setCalendarOpen((o) => !o);
                            }}
                            disabled={loading}
                            className="sched-date-icon-btn"
                          >
                            <svg
                              className="sched-calendar-svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <rect
                                x="4"
                                y="5"
                                width="16"
                                height="15"
                                rx="2"
                                ry="2"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                fill="none"
                              />
                              <line
                                x1="4"
                                y1="9"
                                x2="20"
                                y2="9"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                              <line
                                x1="9"
                                y1="3"
                                x2="9"
                                y2="7"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <line
                                x1="15"
                                y1="3"
                                x2="15"
                                y2="7"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>

                          {calendarOpen && (
                            <div className="sched-calendar">
                              <div className="sched-calendar-header">
                                <button
                                  type="button"
                                  onClick={goPrevMonth}
                                  className="sched-calendar-nav"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <span className="sched-calendar-title">
                                  {monthNames[month]} {year}
                                </span>
                                <button
                                  type="button"
                                  onClick={goNextMonth}
                                  className="sched-calendar-nav"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>

                              <div className="sched-calendar-weekdays">
                                {weekdays.map((w) => (
                                  <div
                                    key={w}
                                    className="sched-calendar-weekday"
                                  >
                                    {w}
                                  </div>
                                ))}
                              </div>
                              <div className="sched-calendar-grid">
                                {cells.map((c, idx) => {
                                  const cellDate = new Date(year, month, c.day);
                                  const isToday =
                                    c.current &&
                                    cellDate.getDate() === today.getDate() &&
                                    cellDate.getMonth() === today.getMonth() &&
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

                                  const classes = [
                                    "sched-calendar-cell",
                                    !c.current && "sched-calendar-cell-out",
                                    isToday && "sched-calendar-cell-today",
                                    isSelected && "sched-calendar-cell-selected",
                                  ]
                                    .filter(Boolean)
                                    .join(" ");

                                  return (
                                    <div
                                      key={idx}
                                      className={classes}
                                      onClick={() =>
                                        handleSelectCalendarDay(c.day, c.current)
                                      }
                                    >
                                      {c.day}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="sched-calendar-footer">
                                <button
                                  type="button"
                                  onClick={goToday}
                                  className="sched-calendar-today"
                                >
                                  Today
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2">
                          <Clock size={20} /> Meeting Time{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          name="meetingTime"
                          value={formData.meetingTime}
                          onChange={handleInputChange}
                          className="form-control sched-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-3" ref={durationRef}>
                      <label className="form-label fw-semibold d-flex align-items-center gap-2">
                        <Clock size={20} /> Duration
                      </label>
                      <div className="sched-dropdown-wrap">
                        <button
                          type="button"
                          className="sched-dropdown-btn"
                          onClick={() => setDurationOpen((prev) => !prev)}
                        >
                          <span className="sched-dropdown-label">
                            {
                              durationOptions.find(
                                (d) => d.value === formData.duration
                              )?.label
                            }
                          </span>
                          {durationOpen ? (
                            <ChevronUp size={18} color="#6B7280" />
                          ) : (
                            <ChevronDown size={18} color="#6B7280" />
                          )}
                        </button>
                        {durationOpen && (
                          <div className="sched-dropdown-menu">
                            {durationOptions.map((opt) => {
                              const active = opt.value === formData.duration;
                              return (
                                <div
                                  key={opt.value}
                                  className={`sched-dropdown-item${
                                    active ? " sched-dropdown-item-active" : ""
                                  }`}
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      duration: opt.value,
                                    }));
                                    setDurationOpen(false);
                                  }}
                                >
                                  {opt.label}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Video size={20} /> Meeting Link
                    </label>
                    <div className="input-group mb-3">
                      <input
                        type="url"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleInputChange}
                        className="form-control sched-input"
                        placeholder="Enter meeting link or generate one..."
                      />
                      <button
                        type="button"
                        onClick={generateTeamsLink}
                        className="btn btn-outline-primary d-flex align-items-center gap-2 sched-generate-btn"
                      >
                        <Plus size={20} /> Generate
                      </button>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <FileText size={20} /> Agenda
                    </label>
                    <textarea
                      name="agenda"
                      value={formData.agenda}
                      onChange={handleInputChange}
                      className="form-control sched-textarea"
                      rows={4}
                      placeholder="Enter meeting agenda and topics to discuss..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary px-4 d-flex align-items-center gap-2 sched-cancel-btn"
                onClick={() => navigate(-1)}
              >
                <X size={20} /> Cancel
              </button>
              <button
                type="submit"
                className="btn px-4 d-flex align-items-center gap-2 sched-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon size={20} />
                    Schedule Meeting
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

export default ScheduleMeeting;
