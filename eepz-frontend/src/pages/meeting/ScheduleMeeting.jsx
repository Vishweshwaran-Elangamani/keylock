import React, { useEffect, useMemo, useRef, useState } from "react";
import meetingService from "../../services/meeting/meetingService";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  FileText,
  Check,
  X,
  Plus,
  Home,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { employeeApi } from "../../services/feedbackmanagement/feedbackApi";
import CustomCalendar from "../../components/project-management/common/CustomCalendar";
import CustomDropdown from "../../components/project-management/common/CustomDropdown";
import "../../styles/mom/components/ScheduleMeeting.css";

const pad2 = (n) => String(n).padStart(2, "0");

const to24Hour = (hour12, minute, meridian) => {
  const h = parseInt(hour12, 10);
  const m = parseInt(minute, 10);

  if (!h || Number.isNaN(m)) return "";

  let hour = h;
  if (meridian === "AM") {
    if (hour === 12) hour = 0;
  } else if (meridian === "PM") {
    if (hour !== 12) hour += 12;
  }
  return `${pad2(hour)}:${pad2(m)}`;
};

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

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const [timeHour, setTimeHour] = useState("10");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timeMeridian, setTimeMeridian] = useState("AM");

  useEffect(() => {
    const t = to24Hour(timeHour, timeMinute, timeMeridian);
    setFormData((prev) => ({ ...prev, meetingTime: t }));
  }, [timeHour, timeMinute, timeMeridian]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (formData.meetingType === "One-on-One") {
        try {
          const response = await employeeApi.getSubordinates();

          const items = Array.isArray(response)
            ? response
            : response?.data?.items || response?.data || [];

          const mapped = items.map((item) => ({
            employeeId: item.employeeId,
            firstName: item.employeeName || item.firstName || "",
            lastName: item.lastName || "",
            email: item.email || "",
            roleName: item.roleName || "",
            departmentName: item.departmentName || "",
          }));

          setEmployeeOptions(mapped);

          if (mapped.length > 0) {
            setFormData((prev) => ({
              ...prev,
              participantEmployeeIds: [mapped[0].employeeId],
            }));
          }
        } catch (error) {
          toastr.error("Error fetching subordinates");
          console.error(error);
        }
      } else {
        try {
          const response = await meetingService.getAll();
          if (response?.success) {
            setEmployeeOptions(response.data || []);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOneOnOneChange = (name, empId) => {
    setFormData((prev) => ({
      ...prev,
      participantEmployeeIds: empId ? [empId] : [],
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
      }
      return {
        ...prev,
        participantEmployeeIds: [...prev.participantEmployeeIds, empId],
      };
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

  const filteredEmployees = useMemo(() => {
    return employeeOptions.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${
        emp.lastName || ""
      }`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [employeeOptions, searchTerm]);

  const meetingTypeOptions = useMemo(
    () => [
      { value: "One-on-One", label: "One-on-One" },
      { value: "Team Meeting", label: "Team Meeting" },
      { value: "Presentation", label: "Presentation" },
      { value: "Other", label: "Other" },
    ],
    []
  );

  const durationOptions = useMemo(
    () => [
      { value: "0.5", label: "30 minutes" },
      { value: "1", label: "1 hour" },
      { value: "1.5", label: "1.5 hours" },
      { value: "2", label: "2 hours" },
      { value: "3", label: "3 hours" },
    ],
    []
  );

  const oneOnOneEmployeeOptions = useMemo(() => {
    return filteredEmployees.map((emp) => ({
      value: emp.employeeId,
      label: `${emp.firstName || ""} ${emp.lastName || ""}${
        emp.departmentName ? ` - ${emp.departmentName}` : ""
      }`,
    }));
  }, [filteredEmployees]);

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const v = pad2(i + 1);
        return { value: v, label: v };
      }),
    []
  );

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const v = pad2(i);
        return { value: v, label: v };
      }),
    []
  );

  const meridianOptions = useMemo(
    () => [
      { value: "AM", label: "AM" },
      { value: "PM", label: "PM" },
    ],
    []
  );

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleMeetingDateChange = (value) => {
    setFormData((prev) => ({ ...prev, meetingDate: value }));
    setCalendarOpen(false);
  };

  return (
    <div className="container-fluid sched-page">
      <div className="row justify-content-center">
        <div className="col-lg-11 col-xl-10">
          <nav aria-label="breadcrumb" className="sched-breadcrumb-nav-meeting">
            <ol className="breadcrumb mb-0 d-flex align-items-center sched-breadcrumb">
              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/")}
                  className="sched-breadcrumb-link"
                  type="button"
                >
                  <Home size={18} />
                </button>
              </li>

              <li className="breadcrumb-item">
                <span className="sched-breadcrumb-home-separator">/</span>
              </li>

              <li className="breadcrumb-item d-flex align-items-center">
                <button
                  onClick={() => navigate("/manager/dashboard/meetmom")}
                  className="sched-breadcrumb-link"
                  type="button"
                >
                  Meeting and MoM
                </button>
              </li>

              <li className="breadcrumb-item">
                <span className="sched-breadcrumb-separator">/</span>
              </li>

              <li className="breadcrumb-item active d-flex align-items-center">
                <span className="sched-breadcrumb-current">
                  Schedule Meeting
                </span>
              </li>
            </ol>
          </nav>

          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm mb-4 border-0 rounded-3">
              <div className="card-body p-4">
                <div className="row g-3 align-items-start">
                  <div className="col-md-6">
                    <CustomDropdown
                      label={
                        <span className="sched-dd-label">
                          <Users size={20} /> Meeting Type
                        </span>
                      }
                      name="meetingType"
                      value={formData.meetingType}
                      options={meetingTypeOptions}
                      placeholder="Select meeting type"
                      onChange={handleDropdownChange}
                      className="sched-dd sched-dd-top"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-left gap-2 sched-label-top">
                      <FileText size={20} /> Meeting Title{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="meetingTitle"
                      value={formData.meetingTitle}
                      onChange={handleInputChange}
                      className="sched-title-input"
                      placeholder="Enter meeting title..."
                      required
                    />
                  </div>

                  <div className="col-12">
                    <div className="row g-3 align-items-start">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <Users size={20} /> Select Participant{" "}
                          <span className="text-danger">*</span>
                        </label>

                        {formData.meetingType === "One-on-One" ? (
                          <CustomDropdown
                            label={null}
                            name="participantEmployeeIds"
                            value={formData.participantEmployeeIds?.[0] || ""}
                            options={oneOnOneEmployeeOptions}
                            placeholder="Select employee"
                            onChange={handleOneOnOneChange}
                            className="sched-dd sched-dd-no-mb"
                          />
                        ) : (
                          <>
                            <div className="border rounded sched-multi-list">
                              <table className="table table-hover mb-0">
                                <thead className="table-light sched-table-head">
                                  <tr>
                                    <th className="text-start sched-th-select">
                                      Select
                                    </th>
                                    <th className="text-start sched-th">
                                      Name
                                    </th>
                                    <th className="text-start sched-th">
                                      Role
                                    </th>
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
                                                handleCheckboxChange(
                                                  emp.employeeId
                                                )
                                              }
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
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

                      <div className="col-md-3">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <CalendarIcon size={20} /> Meeting Date{" "}
                          <span className="text-danger">*</span>
                        </label>

                        <div ref={calendarRef} className="sched-date-wrap">
                          <input
                            type="text"
                            readOnly
                            value={formatDisplayDate(formData.meetingDate)}
                            onClick={() => setCalendarOpen((o) => !o)}
                            disabled={loading}
                            placeholder="Select date"
                            className={`sched-date-input${
                              loading ? " sched-date-input-disabled" : ""
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setCalendarOpen((o) => !o)}
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
                        </div>

                        <CustomCalendar
                          isOpen={calendarOpen}
                          onClose={() => setCalendarOpen(false)}
                          value={formData.meetingDate}
                          onChange={handleMeetingDateChange}
                          anchorRef={calendarRef}
                          position="below-icon"
                          align="left"
                          offset={{ x: 0, y: 0 }}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <Clock size={20} /> Meeting Time{" "}
                          <span className="text-danger">*</span>
                        </label>

                        <div className="sched-time-picker">
                          <CustomDropdown
                            label={null}
                            name="hour"
                            value={timeHour}
                            options={hourOptions}
                            placeholder="HH"
                            onChange={(n, v) => setTimeHour(v)}
                            className="sched-time-dd sched-dd-no-mb"
                          />
                          <CustomDropdown
                            label={null}
                            name="minute"
                            value={timeMinute}
                            options={minuteOptions}
                            placeholder="MM"
                            onChange={(n, v) => setTimeMinute(v)}
                            className="sched-time-dd sched-dd-no-mb"
                          />
                          <CustomDropdown
                            label={null}
                            name="meridian"
                            value={timeMeridian}
                            options={meridianOptions}
                            placeholder="AM/PM"
                            onChange={(n, v) => setTimeMeridian(v)}
                            className="sched-time-dd sched-dd-no-mb"
                          />
                        </div>

                        {!formData.meetingTime ? (
                          <div className="sched-time-error">
                            Please select time
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="row g-3 align-items-start">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2">
                          <Video size={20} /> Meeting Link
                        </label>

                        <div className="input-group sched-link-group">
                          <input
                            type="url"
                            name="meetingLink"
                            value={formData.meetingLink}
                            onChange={handleInputChange}
                            className="form-control sched-input sched-link-input"
                            placeholder="Enter meeting link or generate one"
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
                        <CustomDropdown
                          label={
                            <span className="sched-dd-label-durr">
                              <Clock size={20} /> Duration
                            </span>
                          }
                          name="duration"
                          value={formData.duration}
                          options={durationOptions}
                          placeholder="Select duration"
                          onChange={handleDropdownChange}
                          className="sched-dd sched-dd-dur"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
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
                    <CalendarIcon size={20} /> Schedule Meeting
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
