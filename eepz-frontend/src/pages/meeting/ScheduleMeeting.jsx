import React, { useEffect, useMemo, useRef, useState } from "react";
import meetingService from "../../services/meeting/meetingService";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon, Clock, Users, Video,
  FileText, Check, X, Plus, Home, Sparkles,
  Crown, AlertTriangle, CheckCircle2, ShieldAlert,
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
  if (meridian === "AM") { if (hour === 12) hour = 0; }
  else if (meridian === "PM") { if (hour !== 12) hour += 12; }
  return `${pad2(hour)}:${pad2(m)}`;
};

const hoursToMinutes = (hoursStr) => Math.round(parseFloat(hoursStr) * 60);

const getScoreInfo = (score) => {
  if (!score) return null;
  const parts = score.split("/");
  const hard = parseInt(parts[0]?.replace("hard", "").trim() || "0");
  const soft = parseInt(parts[1]?.replace("soft", "").trim() || "0");
  if (hard < 0) return { label: "Has Conflict", cls: "sched-score-conflict" };
  if (soft === 0) return { label: "Perfect", cls: "sched-score-perfect" };
  if (soft >= -1) return { label: "Good", cls: "sched-score-good" };
  return { label: "Available", cls: "sched-score-fair" };
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

  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(null);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [conflictError, setConflictError] = useState("");

  // ── Heatmap state ──
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);
  const heatbarRef = useRef(null);

  useEffect(() => {
    const t = to24Hour(timeHour, timeMinute, timeMeridian);
    setFormData((prev) => ({ ...prev, meetingTime: t }));
  }, [timeHour, timeMinute, timeMeridian]);

  const handleTimeChange = (setter) => (n, v) => {
    setter(v);
    setAiSuggested(false);
    setSelectedSuggestionIdx(null);
    setConflictError("");
  };

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
        } catch {
          toastr.error("Error fetching subordinates");
        }
      } else {
        try {
          const response = await employeeApi.getAllEmployees();
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
          setFormData((prev) => ({ ...prev, participantEmployeeIds: [] }));
        } catch {
          toastr.error("Error fetching employees");
        }
      }
    };
    fetchParticipants();
  }, [formData.meetingType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConflictError("");
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOneOnOneChange = (name, empId) => {
    setFormData((prev) => ({
      ...prev,
      participantEmployeeIds: empId ? [empId] : [],
    }));
    setSuggestions([]);
    setSelectedSuggestionIdx(null);
  };

  const handleCheckboxChange = (empId) => {
    setFormData((prev) => {
      const isSelected = prev.participantEmployeeIds.includes(empId);
      return {
        ...prev,
        participantEmployeeIds: isSelected
          ? prev.participantEmployeeIds.filter((id) => id !== empId)
          : [...prev.participantEmployeeIds, empId],
      };
    });
    setSuggestions([]);
    setSelectedSuggestionIdx(null);
  };

  const generateTeamsLink = () => {
    const link = "https://teams.microsoft.com/meeting-xyz-" + Date.now();
    setFormData((prev) => ({ ...prev, meetingLink: link }));
    toastr.success("Teams link generated");
  };

  const canSuggest = formData.participantEmployeeIds.length > 0 && formData.duration;

const suggestHint = conflictError
  ? "Conflict detected — try suggesting a better time"
  : !formData.participantEmployeeIds.length
  ? "Select a participant first"
  : !formData.duration
  ? "Select a duration first"
  : ""; // ← empty when all good

  const handleSuggest = async () => {
    if (!canSuggest) return;
    try {
      setSuggestLoading(true);
      setSuggestions([]);
      setSelectedSuggestionIdx(null);
      setConflictError("");
      setHoveredIdx(null);

      const dateToUse = formData.meetingDate
        ? `${formData.meetingDate}T${formData.meetingTime || "09:00"}:00`
        : new Date().toISOString();

      const payload = {
        meetingTitle: formData.meetingTitle || "Untitled",
        meetingType: formData.meetingType,
        meetingDate: dateToUse,
        durationMinutes: hoursToMinutes(formData.duration),
        meetingLink: formData.meetingLink,
        agenda: formData.agenda,
        participantEmployeeIds: formData.participantEmployeeIds,
      };

      const res = await meetingService.suggestMeeting(payload);

      if (res?.success && res.data?.length > 0) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(a.suggestedStartTime) - new Date(b.suggestedStartTime)
        );
        setSuggestions(sorted);
        const freeCount = sorted.filter((s) => !s.hasConflict).length;
        if (freeCount > 0) {
          toastr.success(`${freeCount} conflict-free slot${freeCount > 1 ? "s" : ""} found!`);
        } else {
          toastr.warning("All suggested slots have conflicts. You may still pick one.");
        }
      } else {
        toastr.info("No suggestions available. Try a different date or participants.");
      }
    } catch {
      toastr.error("Failed to fetch suggestions. Please try again.");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handlePickSuggestion = (suggestion, idx) => {
    const dt = new Date(suggestion.suggestedStartTime);
    const dateStr = dt.toISOString().split("T")[0];
    let hours = dt.getHours();
    const minutes = pad2(dt.getMinutes());
    const meridian = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    setFormData((prev) => ({ ...prev, meetingDate: dateStr }));
    setTimeHour(pad2(hours));
    setTimeMinute(minutes);
    setTimeMeridian(meridian);
    setSelectedSuggestionIdx(idx);
    setAiSuggested(true);
    setConflictError("");

    if (suggestion.hasConflict) {
      toastr.warning(
        `This slot has ${suggestion.conflictCount} conflict${suggestion.conflictCount > 1 ? "s" : ""}. Consider a conflict-free slot.`
      );
    } else {
      toastr.success("Conflict-free time applied!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError("");

    if (
      !formData.meetingTitle ||
      !formData.meetingDate ||
      !formData.meetingTime ||
      formData.participantEmployeeIds.length === 0
    ) {
      toastr.error("Please fill all required fields and select at least one participant.");
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
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || "";
      const apiCode = err?.response?.data?.code || "";

      if (status === 409 || apiCode === "MeetingConflict" || apiMsg.toLowerCase().includes("conflict")) {
        setConflictError(
          "One or more participants already have a meeting at this time. Use \"Suggest Best Time\" to find a free slot."
        );
        toastr.warning("Scheduling conflict detected.");
      } else {
        toastr.error("Failed to schedule meeting. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employeeOptions.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [employeeOptions, searchTerm]);

  const meetingTypeOptions = useMemo(() => [
    { value: "One-on-One", label: "One-on-One" },
    { value: "Team Meeting", label: "Team Meeting" },
    { value: "Presentation", label: "Presentation" },
    { value: "Other", label: "Other" },
  ], []);

  const durationOptions = useMemo(() => [
    { value: "0.25", label: "15 minutes" },
    { value: "0.5", label: "30 minutes" },
    { value: "1", label: "1 hour" },
    { value: "1.5", label: "1.5 hours" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
  ], []);

  const oneOnOneEmployeeOptions = useMemo(() =>
    filteredEmployees.map((emp) => ({
      value: emp.employeeId,
      label: `${emp.firstName || ""} ${emp.lastName || ""}${emp.departmentName ? ` - ${emp.departmentName}` : ""}`,
    })),
  [filteredEmployees]);

  const hourOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => { const v = pad2(i + 1); return { value: v, label: v }; }), []);
  const minuteOptions = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => { const v = pad2(i); return { value: v, label: v }; }), []);
  const meridianOptions = useMemo(() => [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ], []);

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const handleMeetingDateChange = (value) => {
    setFormData((prev) => ({ ...prev, meetingDate: value }));
    setCalendarOpen(false);
    setAiSuggested(false);
    setConflictError("");
    setSuggestions([]);
    setSelectedSuggestionIdx(null);
  };

  const formatSuggestionTime = (iso) => {
    const dt = new Date(iso);
    return {
      time: dt.toLocaleString([], { hour: "2-digit", minute: "2-digit" }),
      date: dt.toLocaleString([], { weekday: "short", month: "short", day: "numeric" }),
    };
  };

  const freeSlots   = suggestions.filter((s) => !s.hasConflict).length;
  const conflictSlots = suggestions.filter((s) => s.hasConflict).length;
  const bestIdx     = suggestions.findIndex((s) => !s.hasConflict);
  const selectedSlot = selectedSuggestionIdx !== null ? suggestions[selectedSuggestionIdx] : null;

  // ── Heatmap helpers ──
  const getHeatColorClass = (s, idx) => {
    if (idx === bestIdx && !s.hasConflict) return "sched-heat-best";
    if (s.hasConflict) return "sched-heat-conflict";
    const info = getScoreInfo(s.score);
    if (!info || info.label === "Perfect") return "sched-heat-perfect";
    if (info.label === "Good") return "sched-heat-good";
    return "sched-heat-fair";
  };

  // Hour labels: 08 to 17 → 10 labels, positions 0%–90% for 40 slots
  const hourLabels = useMemo(() => {
    const total = suggestions.length || 40;
    return Array.from({ length: 11 }, (_, i) => ({
      label: `${String(8 + i).padStart(2, "0")}:00`,
      pct: ((i * 4) / total) * 100,
    }));
  }, [suggestions.length]);

  const handleCellMouseEnter = (e, idx) => {
    setHoveredIdx(idx);
    if (heatbarRef.current) {
      const rect    = e.currentTarget.getBoundingClientRect();
      const barRect = heatbarRef.current.getBoundingClientRect();
      const rawLeft = rect.left - barRect.left + rect.width / 2;
      // clamp so tooltip stays inside bar
      const clamped = Math.max(60, Math.min(rawLeft, barRect.width - 60));
      setTooltipLeft(clamped);
    }
  };

  return (
    <div className="container-fluid sched-page">
      <div className="row justify-content-center">
        <div className="col-lg-11 col-xl-10">

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="sched-breadcrumb-nav-meeting">
            <ol className="breadcrumb mb-0 d-flex align-items-center sched-breadcrumb">
              <li className="breadcrumb-item d-flex align-items-center">
                <button onClick={() => navigate("/manager/dashboard/")} className="sched-breadcrumb-link" type="button">
                  <Home size={18} />
                </button>
              </li>
              <li className="breadcrumb-item"><span className="sched-breadcrumb-home-separator">/</span></li>
              <li className="breadcrumb-item d-flex align-items-center">
                <button onClick={() => navigate("/manager/dashboard/meetmom")} className="sched-breadcrumb-link" type="button">
                  Meeting and MoM
                </button>
              </li>
              <li className="breadcrumb-item"><span className="sched-breadcrumb-separator">/</span></li>
              <li className="breadcrumb-item active d-flex align-items-center">
                <span className="sched-breadcrumb-current">Schedule Meeting</span>
              </li>
            </ol>
          </nav>

          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm mb-4 border-0 rounded-3">
              <div className="card-body p-4">
                <div className="row g-3 align-items-start">

                  {/* Row 1 — Type + Title */}
                  <div className="col-md-6">
                    <CustomDropdown
                      label={<span className="sched-dd-label"><Users size={20} /> Meeting Type</span>}
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
                      <FileText size={20} /> Meeting Title <span className="text-danger">*</span>
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

                  {/* Row 2 — Participant + Date + Time */}
                  <div className="col-12">
                    <div className="row g-3 align-items-start">

                      {/* Participant */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <Users size={20} /> Select Participant <span className="text-danger">*</span>
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
                            <div className="mb-2">
                              <input
                                type="text"
                                className="form-control sched-search-input"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <div className="border rounded sched-multi-list">
                              <table className="table table-hover mb-0">
                                <thead className="table-light sched-table-head">
                                  <tr>
                                    <th className="text-start sched-th-select">Select</th>
                                    <th className="text-start sched-th">Name</th>
                                    <th className="text-start sched-th">Role</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredEmployees.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="text-center py-2 text-muted sched-td">No employees found</td>
                                    </tr>
                                  ) : (
                                    filteredEmployees.map((emp) => (
                                      <tr key={emp.employeeId} onClick={() => handleCheckboxChange(emp.employeeId)} className="sched-row-click">
                                        <td className="text-start">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input sched-check"
                                              type="checkbox"
                                              checked={formData.participantEmployeeIds.includes(emp.employeeId)}
                                              onChange={() => handleCheckboxChange(emp.employeeId)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                        </td>
                                        <td className="text-start sched-td">{emp.firstName} {emp.lastName}</td>
                                        <td className="text-start">
                                          <span className="badge bg-light text-dark border sched-role-badge">
                                            {emp.roleName || emp.departmentName || "-"}
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
                                <strong>{formData.participantEmployeeIds.length}</strong>{" "}
                                participant{formData.participantEmployeeIds.length !== 1 ? "s" : ""} selected
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Date */}
                      <div className="col-md-3">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <CalendarIcon size={20} /> Meeting Date <span className="text-danger">*</span>
                        </label>
                        <div ref={calendarRef} className="sched-date-wrap">
                          <input
                            type="text"
                            readOnly
                            value={formatDisplayDate(formData.meetingDate)}
                            onClick={() => setCalendarOpen((o) => !o)}
                            disabled={loading}
                            placeholder="Select date"
                            className={`sched-date-input${loading ? " sched-date-input-disabled" : ""}`}
                          />
                          <button type="button" onClick={() => setCalendarOpen((o) => !o)} disabled={loading} className="sched-date-icon-btn">
                            <svg className="sched-calendar-svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <rect x="4" y="5" width="16" height="15" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
                              <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.8" />
                              <line x1="9" y1="3" x2="9" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              <line x1="15" y1="3" x2="15" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

                      {/* Time */}
                      <div className="col-md-3">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2 sched-label-top">
                          <Clock size={20} /> Meeting Time <span className="text-danger">*</span>
                          
                        </label>
                        <div className={`sched-time-picker${conflictError ? " sched-time-picker-error" : ""}`}>
                          <CustomDropdown label={null} name="hour" value={timeHour} options={hourOptions} placeholder="HH" onChange={handleTimeChange(setTimeHour)} className="sched-time-dd sched-dd-no-mb" />
                          <CustomDropdown label={null} name="minute" value={timeMinute} options={minuteOptions} placeholder="MM" onChange={handleTimeChange(setTimeMinute)} className="sched-time-dd sched-dd-no-mb" />
                          <CustomDropdown label={null} name="meridian" value={timeMeridian} options={meridianOptions} placeholder="AM/PM" onChange={handleTimeChange(setTimeMeridian)} className="sched-time-dd sched-dd-no-mb" />
                        </div>
                        {!formData.meetingTime && (
                          <div className="sched-time-error">Please select time</div>
                        )}
                        {conflictError && (
                          <div className="sched-conflict-inline">
                            <span className="sched-conflict-dot" />
                            <span>{conflictError}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                  <div className="col-12">

                    {/* Suggest Button Row */}
                    <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
                      <button
                        type="button"
                        className={`btn sched-suggest-btn d-flex align-items-center gap-2${!canSuggest ? " sched-suggest-btn-disabled" : ""}${conflictError ? " sched-suggest-btn-urgent" : ""}`}
                        onClick={handleSuggest}
                        disabled={suggestLoading || !canSuggest}
                        title={suggestHint}
                      >
                        {suggestLoading
                          ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          : <Sparkles size={16} />
                        }
                        {suggestLoading ? "Finding slots..." : "Suggest Best Time"}
                      </button>
                      <small className={`sched-suggest-hint${conflictError ? " sched-suggest-hint-urgent" : !canSuggest ? " sched-suggest-hint-warn" : ""}`}>
                        {suggestHint}
                      </small>
                    </div>

                    {/* ── Skeleton ── */}
                    {suggestLoading && (
                      <div className="sched-heatmap-skeleton">
                        <div className="d-flex justify-content-between mb-2">
                          <div className="sched-skeleton-line" style={{ width: "180px", height: "15px" }} />
                          <div className="d-flex gap-2">
                            <div className="sched-skeleton-line" style={{ width: "80px", height: "22px", borderRadius: "20px" }} />
                            <div className="sched-skeleton-line" style={{ width: "80px", height: "22px", borderRadius: "20px" }} />
                          </div>
                        </div>
                        <div className="sched-skeleton-heatbar" />
                        <div className="d-flex justify-content-between mt-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="sched-skeleton-line" style={{ width: "30px", height: "10px" }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── HEATMAP ── */}
                    {!suggestLoading && suggestions.length > 0 && (
                      <div className="sched-heatmap-wrap">

                        {/* Header */}
                        <div className="sched-heatmap-header">
                          <div className="sched-timeline-title">
                            <CalendarIcon size={14} />
                            {formData.meetingDate
                              ? new Date(formData.meetingDate + "T00:00:00").toLocaleDateString([], {
                                  weekday: "long", month: "long", day: "numeric",
                                })
                              : "Availability Heatmap"
                            }
                            <span className="sched-timeline-count">{suggestions.length} slots</span>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            {freeSlots > 0 && (
                              <span className="sched-stat-pill sched-stat-free">
                                <Check size={11} /> {freeSlots} free
                              </span>
                            )}
                            {conflictSlots > 0 && (
                              <span className="sched-stat-pill sched-stat-conflict">
                                <AlertTriangle size={11} /> {conflictSlots} conflict{conflictSlots > 1 ? "s" : ""}
                              </span>
                            )}
                            <div className="sched-hm-legend">
                              <span className="sched-hm-legend-item"><span className="sched-hm-dot sched-hm-dot-best" />Best</span>
                              <span className="sched-hm-legend-item"><span className="sched-hm-dot sched-hm-dot-perfect" />Perfect</span>
                              <span className="sched-hm-legend-item"><span className="sched-hm-dot sched-hm-dot-good" />Good</span>
                              <span className="sched-hm-legend-item"><span className="sched-hm-dot sched-hm-dot-conflict" />Conflict</span>
                            </div>
                          </div>
                        </div>

                        {/* ── Bar + Tooltip ── */}
                        <div
                          className="sched-heatmap-bar"
                          ref={heatbarRef}
                          onMouseLeave={() => setHoveredIdx(null)}
                        >
                          {/* Cells */}
                          {suggestions.map((s, idx) => {
                            const colorCls  = getHeatColorClass(s, idx);
                            const isSelected = selectedSuggestionIdx === idx;
                            const isHovered  = hoveredIdx === idx;
                            return (
                              <div
                                key={idx}
                                className={[
                                  "sched-heat-cell",
                                  colorCls,
                                  isSelected ? "sched-heat-selected" : "",
                                  isHovered  ? "sched-heat-hovered"  : "",
                                ].join(" ").trim()}
                                onMouseEnter={(e) => handleCellMouseEnter(e, idx)}
                                onClick={() => handlePickSuggestion(s, idx)}
                              />
                            );
                          })}

                          {/* Selected marker needle */}
                          {selectedSuggestionIdx !== null && (() => {
                            const pct = (selectedSuggestionIdx / suggestions.length) * 100;
                            return (
                              <div
                                className="sched-heat-needle"
                                style={{ left: `${pct + (1 / suggestions.length) * 50}%` }}
                              />
                            );
                          })()}

                          {/* ── Hover Snackbar Tooltip ── */}
                          {hoveredIdx !== null && (() => {
                            const s         = suggestions[hoveredIdx];
                            const { time, date } = formatSuggestionTime(s.suggestedStartTime);
                            const scoreInfo = getScoreInfo(s.score);
                            const isBest    = hoveredIdx === bestIdx && !s.hasConflict;
                            return (
                              <div
                                className={`sched-heat-snackbar${s.hasConflict ? " sched-snackbar-conflict" : " sched-snackbar-free"}`}
                                style={{ left: tooltipLeft }}
                              >
                                {/* Arrow */}
                                <div className={`sched-snackbar-arrow${s.hasConflict ? " sched-snackbar-arrow-conflict" : " sched-snackbar-arrow-free"}`} />

                                {/* Top row */}
                                <div className="sched-snackbar-top">
                                  <div className="sched-snackbar-time">
                                    {isBest && <Crown size={12} className="sched-snackbar-crown" />}
                                    {time}
                                  </div>
                                  {scoreInfo && (
                                    <div className={`sched-score-badge ${scoreInfo.cls}`}>
                                      {scoreInfo.label}
                                    </div>
                                  )}
                                </div>

                                {/* Status row */}
                                {s.hasConflict ? (
                                  <div className="sched-snackbar-conflict-body">
                                    <div className="sched-snackbar-conflict-title">
                                      <ShieldAlert size={11} />
                                      {s.conflictCount} conflict{s.conflictCount > 1 ? "s" : ""}
                                    </div>
                                    {s.conflictingEmployees?.slice(0, 3).map((ce, i) => (
                                      <div key={i} className="sched-snackbar-emp">
                                        <span className="sched-snackbar-emp-name">{ce.employeeName}</span>
                                        <span className="sched-snackbar-emp-mtg"> — {ce.conflictingMeetingTitle}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="sched-snackbar-free-body">
                                    <Check size={11} /> All participants free
                                  </div>
                                )}

                                <div className="sched-snackbar-cta">Click to select</div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* ── Hour ruler ── */}
                        <div className="sched-heat-ruler">
                          {hourLabels.map(({ label, pct }) => (
                            <div
                              key={label}
                              className="sched-heat-ruler-label"
                              style={{ left: `${pct}%` }}
                            >
                              {label}
                            </div>
                          ))}
                        </div>

                        {/* ── Selected detail panel ── */}
                        {selectedSlot && (() => {
                          const { time, date } = formatSuggestionTime(selectedSlot.suggestedStartTime);
                          const scoreInfo = getScoreInfo(selectedSlot.score);
                          return (
                            <div className={`sched-detail-panel${selectedSlot.hasConflict ? " sched-detail-panel-conflict" : " sched-detail-panel-free"}`}>
                              <div className="sched-detail-left">
                                <div className="sched-detail-time">{time}</div>
                                <div className="sched-detail-date">{date}</div>
                                {scoreInfo && (
                                  <div className={`sched-score-badge ${scoreInfo.cls}`}>{scoreInfo.label}</div>
                                )}
                              </div>
                              <div className="sched-detail-divider" />
                              <div className="sched-detail-right">
                                {selectedSlot.hasConflict ? (
                                  <>
                                    <div className="sched-detail-conflict-title">
                                      <ShieldAlert size={14} />
                                      {selectedSlot.conflictCount} conflict{selectedSlot.conflictCount > 1 ? "s" : ""} detected
                                    </div>
                                    {selectedSlot.conflictingEmployees?.map((ce, i) => (
                                      <div key={i} className="sched-detail-conflict-row">
                                        <span className="sched-conflict-emp-name">{ce.employeeName}</span>
                                        <span className="sched-conflict-emp-meeting"> — {ce.conflictingMeetingTitle}</span>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <div className="sched-detail-free-text">
                                    <CheckCircle2 size={15} className="text-success" />
                                    All participants are free at this time
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                className="sched-detail-clear"
                                onClick={() => { setSelectedSuggestionIdx(null); setAiSuggested(false); }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })()}

                        {freeSlots === 0 && (
                          <div className="sched-no-free-alert mt-2">
                            <AlertTriangle size={15} />
                            <span>All suggested slots have conflicts. Try a different date or fewer participants.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 4 — Link + Duration */}
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
                          <button type="button" onClick={generateTeamsLink} className="btn btn-outline-primary d-flex align-items-center gap-2 sched-generate-btn">
                            <Plus size={20} /> Generate
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <CustomDropdown
                          label={<span className="sched-dd-label-durr"><Clock size={20} /> Duration</span>}
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

                  {/* Row 5 — Agenda */}
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

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end mt-4">
              <button type="button" className="btn btn-secondary px-4 d-flex align-items-center gap-2 sched-cancel-btn" onClick={() => navigate(-1)}>
                <X size={20} /> Cancel
              </button>
              <button type="submit" className="btn px-4 d-flex align-items-center gap-2 sched-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Scheduling...</>
                ) : (
                  <><CalendarIcon size={20} /> Schedule Meeting</>
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