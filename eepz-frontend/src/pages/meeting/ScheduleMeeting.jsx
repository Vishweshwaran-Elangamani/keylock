import { useState, useEffect } from "react";
import meetingService from "../../services/meeting/meetingService";
import toastr from "toastr";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  Bell,
  Send,
  Search,
  Check,
  X,
  Plus,
  Home,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

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

  // Fetch subordinates for One-on-One meeting participants or all employees for others
  useEffect(() => {
    const fetchParticipants = async () => {
      if (formData.meetingType === "One-on-One") {
        try {
          const response = await meetingService.getSubordinates();
          if (response.success) {
            const items = response.data.items.map((item) => ({
              employeeId: item.employeeId,
              firstName: item.employeeName,
              lastName: "", // no last name provided in API response
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
          const response = await meetingService.getAllEmployees();
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOneOnOneChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      participantEmployeeIds: [parseInt(e.target.value, 10)],
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

  return (
    <div
      className="container-fluid px-4 py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol
              className="breadcrumb mb-0 d-flex align-items-center"
              style={{ backgroundColor: "transparent", padding: 0, margin: 0 }}
            >
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
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#7a1d65")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
                >
                  <Home size={16} /> Dashboard
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
              <li className="breadcrumb-item active d-flex align-items-center" aria-current="page">
                <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: 600 }}>
                  Schedule Meeting
                </span>
              </li>
            </ol>
          </nav>

          <form onSubmit={handleSubmit}>
            <div className="card shadow-sm mb-4 border-0 rounded-3">
              <div className="card-body p-4">
                <div className="row g-4">
                  {/* Meeting Type & Title */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={20} /> Meeting Type
                    </label>
                    <select
                      name="meetingType"
                      value={formData.meetingType}
                      onChange={handleInputChange}
                      className="form-select"
                      style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                    >
                      <option value="One-on-One">One-on-One</option>
                      <option value="Team Meeting">Team Meeting</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <FileText size={20} /> Meeting Title <span className="text-danger">*</span>
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

                  {/* Participants */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={20} /> Select Participant{formData.meetingType !== "One-on-One" ? "s" : ""}
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
                        style={{ boxShadow: "none", fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                      />
                    </div>

                    {formData.meetingType === "One-on-One" ? (
                      <select
                        value={formData.participantEmployeeIds[0] || ""}
                        onChange={handleOneOnOneChange}
                        required
                        className="form-select"
                        style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                      >
                        <option value="">Select an employee</option>
                        {filteredEmployees.map((emp) => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.firstName} {emp.lastName} {emp.departmentName && `- ${emp.departmentName}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <div
                          className="border rounded"
                          style={{ maxHeight: 160, overflowY: "auto" }}
                        >
                          <table className="table table-hover mb-0">
                            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ width: 60, fontSize: "1rem" }} className="text-start">Select</th>
                                <th className="text-start" style={{ fontSize: "1rem" }}>Name</th>
                                <th className="text-start" style={{ fontSize: "1rem" }}>Role</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEmployees.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="text-center py-2 text-muted" style={{ fontSize: "1rem" }}>
                                    No employees found
                                  </td>
                                </tr>
                              ) : (
                                filteredEmployees.map((emp) => (
                                  <tr
                                    key={emp.employeeId}
                                    onClick={() => handleCheckboxChange(emp.employeeId)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <td className="text-start">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={formData.participantEmployeeIds.includes(emp.employeeId)}
                                          onChange={() => handleCheckboxChange(emp.employeeId)}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ width: 18, height: 18 }}
                                        />
                                      </div>
                                    </td>
                                    <td className="text-start" style={{ fontSize: "1rem" }}>
                                      {emp.firstName} {emp.lastName}
                                    </td>
                                    <td className="text-start">
                                      <span className="badge bg-light text-dark border" style={{ fontSize: "0.9rem" }}>
                                        {emp.roleName || emp.departmentName || "-"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2" style={{ fontSize: "1rem" }}>
                          <Check size={20} />
                          <span>
                            <strong>{formData.participantEmployeeIds.length}</strong> participant{formData.participantEmployeeIds.length !== 1 ? "s" : ""} selected
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-lg-6 mb-3 mb-lg-0">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2">
                          <Calendar size={20} /> Meeting Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          name="meetingDate"
                          value={formData.meetingDate}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                          style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                        />
                      </div>
                      <div className="col-lg-6">
                        <label className="form-label fw-semibold d-flex align-items-center gap-2">
                          <Clock size={20} /> Meeting Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          name="meetingTime"
                          value={formData.meetingTime}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                          style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="form-label fw-semibold d-flex align-items-center gap-2">
                        <Clock size={20} /> Duration
                      </label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="form-select"
                        style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
                      >
                        <option value="0.5">30 minutes</option>
                        <option value="1">1 hour</option>
                        <option value="1.5">1.5 hours</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Meeting Link & Agenda */}
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
                        style={{ fontSize: "1rem", padding: "0.6rem 0.75rem" }}
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
                      style={{ fontSize: "1rem", padding: "0.6rem 0.75rem", minHeight: 90 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            
            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-end">
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
                    <Calendar size={20} />
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
