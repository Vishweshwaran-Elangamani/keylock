import { useState, useEffect } from 'react';
import meetingService from '../../services/meeting/meetingService';
import apii from '../../../src/services/meeting/index';
import toastr from 'toastr';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ScheduleMeeting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    meetingType: 'One-on-One',
    meetingTitle: '',
    participantEmployeeIds: [],
    meetingDate: '',
    meetingTime: '',
    duration: '1',
    meetingLink: '',
    agenda: '',
    sendCalendarInvite: true,
    reminder: 1
  });
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.meetingType === 'One-on-One' && employeeOptions.length > 0) {
      setFormData(prev => ({
        ...prev,
        participantEmployeeIds: [employeeOptions[0].employeeId]
      }));
    } else if (formData.meetingType !== 'One-on-One') {
      setFormData(prev => ({
        ...prev,
        participantEmployeeIds: []
      }));
    }
  }, [employeeOptions, formData.meetingType]);

  const fetchEmployees = async () => {
    try {
      const response = await apii.get('/EmployeeManagement/all');
      if (response.data.success) {
        setEmployeeOptions(response.data.data);
      } else {
        toastr.error('Failed to fetch employees');
      }
    } catch (error) {
      toastr.error('Error fetching employee list');
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOneOnOneChange = (e) => {
    setFormData(prev => ({ ...prev, participantEmployeeIds: [parseInt(e.target.value)] }));
  };

  const handleCheckboxChange = (empId) => {
    setFormData(prev => {
      const isSelected = prev.participantEmployeeIds.includes(empId);
      if (isSelected) {
        return { ...prev, participantEmployeeIds: prev.participantEmployeeIds.filter(id => id !== empId) };
      } else {
        return { ...prev, participantEmployeeIds: [...prev.participantEmployeeIds, empId] };
      }
    });
  };

  const generateTeamsLink = () => {
    const link = 'https://teams.microsoft.com/meeting-xyz-' + Date.now();
    setFormData(prev => ({ ...prev, meetingLink: link }));
    toastr.success('Teams link generated');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.meetingTitle ||
      !formData.meetingDate ||
      !formData.meetingTime ||
      formData.participantEmployeeIds.length === 0
    ) {
      toastr.error('Please fill all required fields and select at least one participant.');
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
      };
      await meetingService.scheduleMeeting(payload);
      toastr.success('Meeting scheduled successfully!');
      navigate('/manager/dashboard/meetmom');
    } catch (err) {
      toastr.error('Failed to schedule meeting');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employeeOptions.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button 
              className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
              onClick={() => navigate(-1)}
              style={{ width: '40px', height: '40px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.75rem' }}>
                Schedule Meeting
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Create and schedule a new meeting with your team
              </p>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Meeting Type */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Users size={18} />
                    Meeting Type
                  </label>
                  <select 
                    name="meetingType" 
                    value={formData.meetingType} 
                    onChange={handleInputChange} 
                    className="form-select"
                  >
                    <option value="One-on-One">One-on-One</option>
                    <option value="Team Meeting">Team Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Meeting Title */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <FileText size={18} />
                    Meeting Title
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
                  />
                </div>

                {/* Participant Selection */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Users size={18} />
                    Select Participant{formData.meetingType !== 'One-on-One' ? 's' : ''}
                    <span className="text-danger">*</span>
                  </label>

                  {/* Search Input */}
                  <div className="input-group mb-3">
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={18} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ boxShadow: 'none' }}
                    />
                  </div>

                  {formData.meetingType === 'One-on-One' ? (
                    <select
                      value={formData.participantEmployeeIds[0] || ''}
                      onChange={handleOneOnOneChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select an employee</option>
                      {filteredEmployees.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} - {emp.roleName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div 
                        className="border rounded" 
                        style={{ maxHeight: '300px', overflowY: 'auto' }}
                      >
                        <table className="table table-hover mb-0">
                          <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ width: '60px' }}>Select</th>
                              <th>Name</th>
                              <th>Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEmployees.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="text-center py-4 text-muted">
                                  No employees found
                                </td>
                              </tr>
                            ) : (
                              filteredEmployees.map(emp => (
                                <tr 
                                  key={emp.employeeId}
                                  onClick={() => handleCheckboxChange(emp.employeeId)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <td>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.participantEmployeeIds.includes(emp.employeeId)}
                                        onChange={() => handleCheckboxChange(emp.employeeId)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </td>
                                  <td>{emp.firstName} {emp.lastName}</td>
                                  <td>
                                    <span className="badge bg-light text-dark border">
                                      {emp.roleName}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-2">
                        <Check size={18} />
                        <span>
                          <strong>{formData.participantEmployeeIds.length}</strong> participant{formData.participantEmployeeIds.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Date and Time Row */}
                <div className="row mb-4">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Calendar size={18} />
                      Meeting Date
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      name="meetingDate"
                      value={formData.meetingDate}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Clock size={18} />
                      Meeting Time
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      name="meetingTime"
                      value={formData.meetingTime}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Clock size={18} />
                    Duration
                  </label>
                  <select 
                    name="duration" 
                    value={formData.duration} 
                    onChange={handleInputChange} 
                    className="form-select"
                  >
                    <option value="0.5">30 minutes</option>
                    <option value="1">1 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                  </select>
                </div>

                {/* Meeting Link */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Video size={18} />
                    Meeting Link
                  </label>
                  <div className="input-group">
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter meeting link or generate one..."
                    />
                    <button 
                      type="button" 
                      onClick={generateTeamsLink} 
                      className="btn btn-outline-primary d-flex align-items-center gap-2"
                    >
                      <Plus size={18} />
                      Generate Teams Link
                    </button>
                  </div>
                </div>

                {/* Agenda */}
                <div className="mb-4">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <FileText size={18} />
                    Agenda
                  </label>
                  <textarea
                    name="agenda"
                    value={formData.agenda}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                    placeholder="Enter meeting agenda and topics to discuss..."
                  />
                </div>

                {/* Additional Options */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-3">Additional Options</h6>
                    
                    {/* Send Calendar Invite */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="sendCalendarInvite"
                        id="sendCalendarInvite"
                        checked={formData.sendCalendarInvite}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label d-flex align-items-center gap-2" htmlFor="sendCalendarInvite">
                        <Send size={18} />
                        Send calendar invite to participants
                      </label>
                    </div>

                    {/* Reminder */}
                    <div>
                      <label className="form-label fw-semibold d-flex align-items-center gap-2 mb-2">
                        <Bell size={18} />
                        Reminder
                      </label>
                      <select 
                        name="reminder" 
                        value={formData.reminder} 
                        onChange={handleInputChange} 
                        className="form-select"
                      >
                        <option value="0">None</option>
                        <option value="1">1 day before</option>
                        <option value="2">2 days before</option>
                        <option value="7">1 week before</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-3 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-light px-4 d-flex align-items-center gap-2"
                    onClick={() => navigate(-1)}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success px-4 d-flex align-items-center gap-2"
                    disabled={loading}
                    style={{ fontWeight: '500' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        Schedule Meeting
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <FileText size={18} />
                Quick Tips
              </h6>
              <ul className="mb-0 ps-3" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                <li className="mb-2">Choose a clear and descriptive meeting title</li>
                <li className="mb-2">Select all required participants before scheduling</li>
                <li className="mb-2">Add a detailed agenda to help participants prepare</li>
                <li className="mb-2">Generate a Teams link for virtual meetings</li>
                <li>Enable reminders to ensure everyone is notified</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeeting;
