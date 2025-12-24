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

  const dropdownButtonStyle = {
    width: "100%",
    textAlign: "left",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    backgroundColor: "#ffffff",
    padding: "0.6rem 0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    color: "#111827",
  };

  const dropdownMenuStyle = {
    position: "absolute",
    zIndex: 20,
    backgroundColor: "#ffffff",
    borderRadius: "0 0 12px 12px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
    marginTop: "2px",
    overflow: "hidden",
    width: "100%",
    maxHeight: "260px",
    overflowY: "auto",
    textAlign: "left",
  };

  const dropdownItemStyle = (active) => ({
    padding: "10px 16px",
    textAlign: "left", // changed from center to left
    cursor: "pointer",
    backgroundColor: active ? PRIMARY : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontWeight: active ? 600 : 400,
    borderBottom: "1px solid #F3F4F6",
    fontSize: "0.95rem",
  });

  const dropdownItemHoverStyle = {
    backgroundColor: PRIMARY,
    color: "#ffffff",
  };

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
  const selectedDate = formData.meetingDate ? new Date(formData.meetingDate) : null;

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
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol
              className="breadcrumb mb-0 d-flex align-items-center"
              style={{ backgroundColor: "transparent", padding: 0, margin: 0 }}
            >
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7a1d65")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#97247E")
                  }
                >
                  <Home size={16} />
                  Dashboard
                </button>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#97247E",
                  margin: "0 8px",
                  fontSize: "1rem",
                }}
              >
                /
              </li>
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/meetmom")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#97247E",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7a1d65")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#97247E")
                  }
                >
                  Meeting and MoM
                </button>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#97247E",
                  margin: "0 8px",
                  fontSize: "1rem",
                }}
              >
                /
              </li>
              <li
                className="breadcrumb-item active d-flex align-items-center"
                aria-current="page"
              >
                <span
                  style={{
                    color: "#1e293b",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
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
                    <div
                      ref={meetingTypeRef}
                      style={{ position: "relative" }}
                    >
                      <button
                        type="button"
                        style={dropdownButtonStyle}
                        onClick={() =>
                          setMeetingTypeOpen((prev) => !prev)
                        }
                      >
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textAlign: "left", // left align selected label
                          }}
                        >
                          {formData.meetingType}
                        </span>
                        {meetingTypeOpen ? (
                          <ChevronUp size={18} color="#6B7280" />
                        ) : (
                          <ChevronDown size={18} color="#6B7280" />
                        )}
                      </button>
                      {meetingTypeOpen && (
                        <div style={dropdownMenuStyle}>
                          {meetingTypeOptions.map((opt) => (
                            <div
                              key={opt}
                              style={dropdownItemStyle(
                                opt === formData.meetingType
                              )}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  meetingType: opt,
                                }));
                                setMeetingTypeOpen(false);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  dropdownItemHoverStyle.backgroundColor;
                                e.currentTarget.style.color =
                                  dropdownItemHoverStyle.color;
                              }}
                              onMouseLeave={(e) => {
                                const active = opt === formData.meetingType;
                                e.currentTarget.style.backgroundColor = active
                                  ? PRIMARY
                                  : "#ffffff";
                                e.currentTarget.style.color = active
                                  ? "#ffffff"
                                  : "#111827";
                              }}
                            >
                              {opt}
                            </div>
                          ))}
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
                      className="form-control"
                      placeholder="Enter meeting title..."
                      required
                      style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={20} /> Select Participant
                      {formData.meetingType !== "One-on-One" ? "s" : ""}{" "}
                      <span className="text-danger">*</span>
                    </label>

                    <div className="input-group mb-3">
                      <span className="input-group-text bg-white border-end-0">
                        <Search size={20} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          boxShadow: "none",
                          fontSize: "1rem",
                          padding: "0.6rem 0.75rem",
                        }}
                      />
                    </div>

                    {formData.meetingType === "One-on-One" ? (
                      <div ref={oneOnOneRef} style={{ position: "relative" }}>
                        <button
                          type="button"
                          style={dropdownButtonStyle}
                          onClick={() =>
                            setOneOnOneOpen((prev) => !prev)
                          }
                        >
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textAlign: "left", // left align selected label
                            }}
                          >
                            {(() => {
                              const id =
                                formData.participantEmployeeIds[0];
                              const emp = employeeOptions.find(
                                (e) => e.employeeId === id
                              );
                              if (!emp) return "Select employee";
                              return `${emp.firstName} ${
                                emp.lastName || ""
                              }${
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
                          <div style={dropdownMenuStyle}>
                            {filteredEmployees.length === 0 ? (
                              <div
                                style={{
                                  padding: "10px 16px",
                                  textAlign: "center",
                                  fontSize: "0.95rem",
                                  color: "#6B7280",
                                }}
                              >
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
                                    style={dropdownItemStyle(active)}
                                    onClick={() => {
                                      handleOneOnOneChange(
                                        emp.employeeId
                                      );
                                      setOneOnOneOpen(false);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        dropdownItemHoverStyle.backgroundColor;
                                      e.currentTarget.style.color =
                                        dropdownItemHoverStyle.color;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        active ? PRIMARY : "#ffffff";
                                      e.currentTarget.style.color = active
                                        ? "#ffffff"
                                        : "#111827";
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
                        <div
                          className="border rounded"
                          style={{ maxHeight: 160, overflowY: "auto" }}
                        >
                          <table className="table table-hover mb-0">
                            <thead
                              className="table-light"
                              style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                              }}
                            >
                              <tr>
                                <th
                                  style={{ width: 60, fontSize: "1rem" }}
                                  className="text-start"
                                >
                                  Select
                                </th>
                                <th
                                  className="text-start"
                                  style={{ fontSize: "1rem" }}
                                >
                                  Name
                                </th>
                                <th
                                  className="text-start"
                                  style={{ fontSize: "1rem" }}
                                >
                                  Role
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEmployees.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="text-center py-2 text-muted"
                                    style={{ fontSize: "1rem" }}
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
                                    style={{ cursor: "pointer" }}
                                  >
                                    <td className="text-start">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={formData.participantEmployeeIds.includes(
                                            emp.employeeId
                                          )}
                                          onChange={() =>
                                            handleCheckboxChange(
                                              emp.employeeId
                                            )
                                          }
                                          onClick={(e) =>
                                            e.stopPropagation()
                                          }
                                          style={{ width: 18, height: 18 }}
                                        />
                                      </div>
                                    </td>
                                    <td
                                      className="text-start"
                                      style={{ fontSize: "1rem" }}
                                    >
                                      {emp.firstName} {emp.lastName}
                                    </td>
                                    <td className="text-start">
                                      <span
                                        className="badge bg-light text-dark border"
                                        style={{ fontSize: "0.9rem" }}
                                      >
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
                        <div
                          className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2"
                          style={{ fontSize: "1rem" }}
                        >
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
                        <div
                          ref={calendarRef}
                          style={{ position: "relative", width: "100%" }}
                        >
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
                            style={{
                              width: "100%",
                              padding: "0.6rem 2.5rem 0.6rem 0.75rem",
                              borderRadius: 8,
                              border: "1px solid #d1d5db",
                              fontSize: "0.95rem",
                              boxSizing: "border-box",
                              cursor: loading ? "not-allowed" : "pointer",
                              backgroundColor: loading ? "#f3f4f6" : "white",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              ensureCalendarMonthYear();
                              setCalendarOpen((o) => !o);
                            }}
                            disabled={loading}
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: 10,
                              transform: "translateY(-50%)",
                              border: "none",
                              background: "transparent",
                              cursor: loading ? "not-allowed" : "pointer",
                              padding: 0,
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
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

                          {calendarOpen && (
                            <div
                              style={{
                                position: "absolute",
                                right: -250,
                                top: "calc(100% + 4px)",
                                backgroundColor: "white",
                                borderRadius: 12,
                                boxShadow:
                                  "0 14px 40px rgba(15, 23, 42, 0.18)",
                                border: "1px solid #e5e7eb",
                                zIndex: 9999,
                                width: 280,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "0.5rem 0.9rem",
                                  borderBottom: "1px solid #e5e7eb",
                                  backgroundColor: "#ffffff",
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
                                  <ChevronLeft size={16} />
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
                                  <ChevronRight size={16} />
                                </button>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(7, 1fr)",
                                  padding: "0.35rem 0.9rem 0.2rem",
                                  gap: 4,
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
                                  padding: "0.15rem 0.9rem 0.6rem",
                                  gap: 4,
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

                                  const baseStyle = {
                                    textAlign: "center",
                                    padding: "0.4rem 0",
                                    borderRadius: 8,
                                    cursor: c.current ? "pointer" : "default",
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
                                  padding: "0.45rem 0.9rem 0.7rem",
                                  borderTop: "1px solid #e5e7eb",
                                  textAlign: "right",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={goToday}
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
                          className="form-control"
                          required
                          style={{
                            fontSize: "1rem",
                            padding: "0.6rem 0.75rem",
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3" ref={durationRef}>
                      <label className="form-label fw-semibold d-flex align-items-center gap-2">
                        <Clock size={20} /> Duration
                      </label>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          style={dropdownButtonStyle}
                          onClick={() =>
                            setDurationOpen((prev) => !prev)
                          }
                        >
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textAlign: "left", // left align selected label
                            }}
                          >
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
                          <div style={dropdownMenuStyle}>
                            {durationOptions.map((opt) => (
                              <div
                                key={opt.value}
                                style={dropdownItemStyle(
                                  opt.value === formData.duration
                                )}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    duration: opt.value,
                                  }));
                                  setDurationOpen(false);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    dropdownItemHoverStyle.backgroundColor;
                                  e.currentTarget.style.color =
                                    dropdownItemHoverStyle.color;
                                }}
                                onMouseLeave={(e) => {
                                  const active =
                                    opt.value === formData.duration;
                                  e.currentTarget.style.backgroundColor = active
                                    ? PRIMARY
                                    : "#ffffff";
                                  e.currentTarget.style.color = active
                                    ? "#ffffff"
                                    : "#111827";
                                }}
                              >
                                {opt.label}
                              </div>
                            ))}
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
                        className="form-control"
                        placeholder="Enter meeting link or generate one..."
                        style={{
                          fontSize: "1rem",
                          padding: "0.6rem 0.75rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={generateTeamsLink}
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                        style={{ fontSize: "1rem" }}
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
                      className="form-control"
                      rows={4}
                      placeholder="Enter meeting agenda and topics to discuss..."
                      style={{
                        fontSize: "1rem",
                        padding: "0.6rem 0.75rem",
                        minHeight: 90,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

          

            <div className="d-flex gap-3 justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary px-4 d-flex align-items-center gap-2"
                onClick={() => navigate(-1)}
                style={{ fontSize: "1rem", fontWeight: 500 }}
              >
                <X size={20} /> Cancel
              </button>
              <button
                type="submit"
                className="btn px-4 d-flex align-items-center gap-2"
                disabled={loading}
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  color: "#fff",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
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
      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ScheduleMeeting;
