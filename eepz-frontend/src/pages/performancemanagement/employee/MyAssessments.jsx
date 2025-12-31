import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { 
  getEmployeeAssignments, 
  submitSelfAssessment, 
  viewSelfAssessment,
  downloadAttachment 
} from "../../../services/performancemanagement/api/api";
import logoImage from "../../../assets/logodark.png";
import "../../../styles/performancemanagement/employee/MyAssessments.css";
import Breadcrumb from "../../../components/common/Breadcrumb";

function getTimeLeft(deadline) {
  const now = new Date();
  const dl = new Date(deadline);
  let ms = dl - now;
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: ms === 0 };
}

function MyAssessments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("submit");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timers, setTimers] = useState({});
  const [visibleTimers, setVisibleTimers] = useState([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [viewAttachments, setViewAttachments] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  useEffect(() => {
    if (!userId) {
      navigate("/employee/login");
      return;
    }
    fetchAssignments();
  }, [userId, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pendingAssignments = assignments.filter((a) => !a.isCompleted);
      const newTimers = {};
      const now = new Date();

      pendingAssignments.forEach((assignment) => {
        if (assignment.deadline) {
          const deadline = new Date(assignment.deadline);
          const diffTime = deadline - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          newTimers[assignment.assignmentId] = {
            days: diffDays >= 0 ? diffDays : 0,
            formName: assignment.formName,
            deadline: assignment.deadline,
            isExpired: diffDays < 0,
          };
        }
      });

      setTimers(newTimers);
      const sorted = Object.entries(newTimers)
        .map(([key, value]) => ({ id: key, ...value }))
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setVisibleTimers(sorted);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignments]);

  function getExtensionFromMime(mimeType) {
    if (!mimeType) return '';
    const type = mimeType.toLowerCase().trim();
    const mimeMap = {
      'application/pdf': '.pdf',
      'text/csv': '.csv',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/zip': '.zip',
      'audio/mpeg': '.mp3',
      'video/mp4': '.mp4',
    };
    return mimeMap[type] || '';
  }

  function hasExtension(filename) {
    return /\.[a-zA-Z0-9]{2,5}$/.test(filename);
  }

  function extractFilenameFromHeader(contentDisposition) {
    if (!contentDisposition) return null;
    const matchUtf8 = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)(?:;|$)/i);
    if (matchUtf8 && matchUtf8[1]) {
      try {
        return decodeURIComponent(matchUtf8[1].replace(/"/g, '').trim());
      } catch (e) {
        return matchUtf8[1].replace(/"/g, '').trim();
      }
    }
    const matchNormal = contentDisposition.match(/filename=([^;]+)(?:;|$)/i);
    if (matchNormal && matchNormal[1]) {
      return matchNormal[1].replace(/"/g, '').trim();
    }
    return null;
  }

  const handleDownloadViewAttachment = async (attachment) => {
    try {
      setDownloadingAttachmentId(attachment.attachmentId);
      
      const response = await downloadAttachment(attachment.attachmentId);
  
      const blob = response.data;
      
      let filename = attachment.fileName || "attachment";
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const headerFilename = extractFilenameFromHeader(contentDisposition);
        if (headerFilename) {
          filename = headerFilename;
        }
      }
  
      if (!hasExtension(filename)) {
        let extension = '';
        const contentType = response.headers['content-type'];
        if (contentType) {
          extension = getExtensionFromMime(contentType);
        }
        if (!extension && attachment.fileType) {
          extension = getExtensionFromMime(attachment.fileType);
        }
        if (!extension) {
          extension = '.bin';
        }
        filename += extension;
      }
  
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      toast.success('File downloaded successfully!');
    } catch (err) {
      console.error("Download error:", err);
      toast.error(`Failed to download attachment: ${err.message}`);
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await getEmployeeAssignments(userId);
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        toast.error(data.message || "Failed to fetch assignments.");
      }
    } catch (error) {
      toast.error("Failed to load assignments.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("submit");
    const initialData = (assignment.competencies || []).map((comp) => ({
      competencyId: comp.competencyId,
      competencyName: comp.name,
      competencyDescription: comp.description,
      rating: "",
      comments: "",
    }));
    setAssessmentData(initialData);
    setAttachments([]);
    setShowModal(true);
  };

  const openViewModal = async (assignment) => {
    setCurrentAssignment(assignment);
    setModalMode("view");
    setSubmitting(true);
    try {
     const { data } = await viewSelfAssessment(assignment.formId, userId);
      if (data.success) {
        const viewData = (data.data.details || []).map((detail) => ({
          competencyId: detail.competencyId,
          competencyName: detail.competencyName,
          competencyDescription: detail.competencyDescription,
          rating: detail.rating,
          comments: detail.comments || "",
        }));
        setAssessmentData(viewData);
        setViewAttachments(data.data.attachments || []);
        setShowModal(true);
        toast.success("Assessment loaded successfully");
      } else {
        toast.error("Failed to load submitted assessment.");
      }
    } catch (error) {
      toast.error("Error loading assessment.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateAssessmentData = (competencyId, field, value) => {
    setAssessmentData((prev) =>
      prev.map((item) => (item.competencyId === competencyId ? { ...item, [field]: value } : item))
    );
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;

        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            customName: file.name,
            fileType: file.type,
            fileSize: file.size,
            attachmentNote: "",
            base64Content: base64String,
            displayOrder: prev.length + 1,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = null;
  };

  const updateAttachmentName = (index, name) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, customName: name } : att))
    );
  };

  const updateAttachmentNote = (index, note) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, attachmentNote: note } : att))
    );
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAssessment = async () => {
    const incompleteRatings = assessmentData.filter((item) => !item.rating);
    if (incompleteRatings.length > 0) {
      toast.error("Please provide ratings for all competencies.");
      return;
    }

    const incompleteComments = assessmentData.filter((item) => !item.comments || item.comments.trim() === "");
    if (incompleteComments.length > 0) {
      toast.error("Please provide comments for all competencies.");
      return;
    }

    setSubmitting(true);
    const payload = {
      formId: currentAssignment.formId,
      userId: parseInt(userId),
      status: "Submitted",
      assessmentDetails: assessmentData.map((item) => ({
        competencyId: item.competencyId,
        employeeRating: parseInt(item.rating),
        employeeComments: item.comments.trim(),
      })),
      attachments: attachments.map((att) => ({
        fileName: att.customName || att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        attachmentNote: att.attachmentNote,
        base64Content: att.base64Content,
        displayOrder: att.displayOrder,
      })),
    };

    try {
     const { data } = await submitSelfAssessment(payload);
      if (data.success) {
        toast.success("Assessment submitted successfully!");
        setShowModal(false);

        const assignmentIdToRemove = currentAssignment.assignmentId;
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[assignmentIdToRemove];
          return newTimers;
        });

        setCurrentAssignment(null);
        setAttachments([]);
        await fetchAssignments();
      } else {
        toast.error("Submission failed.");
      }
    } catch (error) {
      toast.error("Submission failed.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments.filter((a) => !a.isCompleted);
  const completedAssignments = assignments.filter((a) => a.isCompleted);

  const filterAssignments = (assignmentList) => {
    return assignmentList.filter((assignment) => {
      const matchSearch =
        assignment.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.formType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDate = !dateFilter ||
        new Date(assignment.deadline).toLocaleDateString("en-GB") ===
        new Date(dateFilter).toLocaleDateString("en-GB");

      return matchSearch && matchDate;
    });
  };

  const filteredPending = filterAssignments(pendingAssignments);
  const filteredCompleted = filterAssignments(completedAssignments);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setDateFilter("");
  };

  const renderTable = (data, activeTab) => (
    <div className="empassper-table-container">
      <table className="empassper-table">
        <thead>
          <tr>
            <th>FORM NAME</th>
            <th>TYPE</th>
            <th>DEADLINE</th>
            <th>STATUS</th>
            <th>
              {activeTab === "pending" ? "SUBMISSION" : "VIEW"}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((assignment) => {
            return (
              <tr key={assignment.assignmentId}>
                <td>
                  <div className="empassper-form-name">
                    {assignment.formName}
                  </div>
                </td>
                <td>
                  <span className="empassper-badge">{assignment.formType}</span>
                </td>
                <td>
                  <div className="empassper-date-cell">
                    <i className="bi bi-calendar-event"></i>
                    {new Date(assignment.deadline || new Date()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                <td>
                  <span className={assignment.isCompleted ? "empassper-badge-success" : "empassper-badge-pending"}>
                    <i className={`bi ${assignment.isCompleted ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                    {assignment.isCompleted ? "Completed" : "Pending"}
                  </span>
                </td>
                <td>
                  {!assignment.isCompleted ? (
                    <button className="empassper-btn empassper-btn-submit" onClick={() => openSubmitModal(assignment)}>
                      <i className="bi bi-pencil-square"></i>
                      Submit
                    </button>
                  ) : (
                    <button className="empassper-btn empassper-btn-view" onClick={() => openViewModal(assignment)}>
                      <i className="bi bi-eye-fill"></i>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="empassper-container">
        <Toaster position="top-right"  />
        <div className="empassper-loading-state">
          <div className="spinner-border"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="empassper-container">
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "employee/dashboard" },
          { label: "My Assessments", path: null }
        ]}
      />
      <Toaster position="top-right" />

      <div className="empassper-header-section">
        <div className="empassper-header-content">
          <div className="empassper-header-text"></div>
        </div>

        {showModal && currentAssignment && timers[currentAssignment.assignmentId] && (
          <div className="empassper-timer-container">
            <div className="empassper-timer-label">Time Remaining</div>
            <div className="empassper-timer-display">
              {timers[currentAssignment.assignmentId].days > 0
                ? `${timers[currentAssignment.assignmentId].days} days`
                : "Expired"}
            </div>
            <div className="empassper-timer-subtext">
              Deadline: {new Date(currentAssignment.deadline).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {visibleTimers.length > 0 && (
        <div className="empassper-timer-bars-container">
          {visibleTimers.map((timer) => (
            <div key={timer.id} className={`empassper-timer-bar ${timer.isExpired ? 'expired' : ''}`}>
              <div className="empassper-timer-bar-content">
                <span className="empassper-timer-bar-icon">
                  <i className="bi bi-alarm"></i>
                </span>
                <span className="empassper-timer-bar-label">{timer.formName}</span>
                <span className="empassper-timer-bar-time">
                  {timer.days > 0 ? `${timer.days} days left` : "Expired"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="empassper-search-filter-container">
        <div className="empassper-search-wrapper">
          <input
            type="text"
            className="empassper-search-input"
            placeholder="Search by form name or type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            aria-label="Search assessments"
          />
          <button 
            onClick={handleSearch}
            className="empassper-search-btn"
            aria-label="Search"
          >
            Search
          </button>
        </div>
        <button 
          onClick={handleClearFilters}
          className="empassper-clear-btn"
          aria-label="Clear Filters"
        >
          Clear Filters
        </button>
        <input
          type="date"
          className="empassper-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by deadline"
        />
      </div>

      <div className="empassper-pill-tabs-wrapper" role="tablist" aria-label="Assessment tabs">
        <div className="empassper-pill-tabs">
          <button
            role="tab"
            aria-pressed={activeTab === "pending"}
            className={`empassper-pill ${activeTab === "pending" ? "empassper-pill--active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <span className="empassper-pill-text">Pending Assessments</span>
            <span className="empassper-pill-count">({filteredPending.length})</span>
          </button>

          <button
            role="tab"
            aria-pressed={activeTab === "completed"}
            className={`empassper-pill ${activeTab === "completed" ? "empassper-pill--active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <span className="empassper-pill-text">Completed Assessments</span>
            <span className="empassper-pill-count">({filteredCompleted.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "pending" && (
        <>
          {filteredPending.length > 0 ? (
            renderTable(filteredPending, activeTab)
          ) : (
            <div className="empassper-empty-state">
              <div className="empassper-empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3 className="empassper-empty-title">No Pending Assessments</h3>
              <p className="empassper-empty-text">
                {assignments.length === 0
                  ? "You don't have any assessments assigned yet."
                  : "All assessments have been completed or filtered out!"}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "completed" && (
        <>
          {filteredCompleted.length > 0 ? (
            renderTable(filteredCompleted, activeTab)
          ) : (
            <div className="empassper-empty-state">
              <div className="empassper-empty-icon">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <h3 className="empassper-empty-title">No Completed Assessments</h3>
              <p className="empassper-empty-text">
                Complete your pending assessments to see them here.
              </p>
            </div>
          )}
        </>
      )}

      {showModal && currentAssignment && (
        <div
          className="empassper-modal-overlay"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="empassper-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="empass-form-header">
              <div className="empass-logo-section">
                <img src={logoImage} alt="Logo" className="empass-logo-small" />
                <div className="empass-appraisal-label">Appraisal Form</div>
              </div>
              <div className="empass-form-title-container">
                <h2 className="empass-form-title">{currentAssignment?.formName}</h2>
                <p className="empass-form-subtitle">
                  {currentAssignment?.formType} Assessment Form
                </p>
              </div>

              {((modalMode === "submit" && attachments.length > 0) ||
                (modalMode === "view" && viewAttachments && viewAttachments.length > 0)) && (
                  <div className="empass-attachment-badge">
                    <span className="empass-attachment-badge-text">
                      {modalMode === "submit"
                        ? `${attachments.length} ${attachments.length === 1 ? "File" : "Files"}`
                        : `${viewAttachments.length} ${viewAttachments.length === 1 ? "File" : "Files"}`
                      }
                    </span>
                  </div>
                )}
            </div>

            <div className="empass-form-divider"></div>

            {submitting && modalMode === "view" ? (
              <div className="empass-form-body empass-loading-body">
                <div>
                  <div className="spinner-border"></div>
                  <p className="empass-loading-text">
                    Loading assessment...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="empass-form-body">
                  <table className="empass-form-table">
                    <thead>
                      <tr>
                        <th>Competency Name</th>
                        <th>Description</th>
                        <th>Rating</th>
                        <th>Comments</th>
                      </tr>
                    </thead>

                    <tbody>
                      {assessmentData.map((item) => (
                        <tr key={item.competencyId}>
                          <td>
                            <strong>{item.competencyName}</strong>
                          </td>
                          <td>{item.competencyDescription || "N/A"}</td>
                          <td>
                            {modalMode === "view" ? (
                              <span className="empass-rating-badge">
                                {item.rating} / 5
                              </span>
                            ) : (
                              <select
                                value={item.rating}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "rating",
                                    e.target.value
                                  )
                                }
                                className="empass-form-select"
                                disabled={submitting}
                              >
                                <option value="">-</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {modalMode === "view" ? (
                              <span>{item.comments || "-"}</span>
                            ) : (
                              <textarea
                                value={item.comments}
                                onChange={(e) =>
                                  updateAssessmentData(
                                    item.competencyId,
                                    "comments",
                                    e.target.value
                                  )
                                }
                                placeholder="Justify through comments"
                                className="empass-form-textarea"
                                disabled={submitting}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="empass-attachments-section">
                    <h3 className="empass-attachments-title">
                      <i className="bi bi-paperclip"></i>
                      Attachments
                    </h3>

                    {modalMode === "submit" && (
                      <div>
                        <div className="empass-upload-section">
                          <label
                            htmlFor="file-upload"
                            className="empass-upload-btn"
                          >
                            <i className="bi bi-cloud-upload"></i> Add Attachment
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="empass-file-input"
                            disabled={submitting}
                          />
                          <span className="empass-file-count">
                            {attachments.length > 0 && `${attachments.length} file(s) selected`}
                          </span>
                        </div>

                        {attachments.length > 0 && (
                          <div className="empass-attachments-list">
                            {attachments.map((att, index) => (
                              <div
                                key={index}
                                className="empass-attachment-item"
                              >
                                <div className="empass-attachment-header">
                                  <div className="empass-attachment-info">
                                    <i className="bi bi-file-earmark-text empass-file-icon"></i>
                                    <div>
                                      <div className="empass-attachment-original">
                                        Original: {att.fileName}
                                      </div>
                                      <div className="empass-attachment-meta">
                                        {(att.fileSize / 1024).toFixed(2)} KB • {att.fileType || 'Unknown type'}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeAttachment(index)}
                                    className="empass-remove-btn"
                                    disabled={submitting}
                                  >
                                    <i className="bi bi-trash"></i> Remove
                                  </button>
                                </div>

                                <div className="empass-attachment-name-section">
                                  <label className="empass-input-label">
                                    <i className="bi bi-tag"></i> Attachment Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={att.customName}
                                    onChange={(e) => updateAttachmentName(index, e.target.value)}
                                    placeholder="Enter a name for this attachment"
                                    className="empass-input"
                                    disabled={submitting}
                                  />
                                </div>

                                <div>
                                  <label className="empass-input-label">
                                    <i className="bi bi-chat-left-text"></i> Description (Optional)
                                  </label>
                                  <textarea
                                    value={att.attachmentNote}
                                    onChange={(e) => updateAttachmentNote(index, e.target.value)}
                                    placeholder="Add a description or notes for this attachment..."
                                    className="empass-textarea"
                                    disabled={submitting}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {attachments.length === 0 && (
                          <div className="empass-no-attachments">
                            <i className="bi bi-inbox empass-no-attachments-icon"></i>
                            No attachments added yet. Click "Add Attachment" to upload files.
                          </div>
                        )}
                      </div>
                    )}

                    {modalMode === "view" && (
                      <div>
                        {viewAttachments && viewAttachments.length > 0 ? (
                          <div className="empass-view-attachments-list">
                            {viewAttachments.map((att) => (
                              <div
                                key={att.attachmentId}
                                className="empass-view-attachment-item"
                              >
                                <div className="empass-view-attachment-content">
                                  <div className="empass-view-attachment-details">
                                    <div className="empass-view-attachment-name">
                                      {att.fileName}
                                    </div>

                                    {att.attachmentNote && (
                                      <div className="empass-view-attachment-note">
                                        <strong>Description:</strong> {att.attachmentNote}
                                      </div>
                                    )}

                                    <div className="empass-view-attachment-meta">
                                      {att.fileSize && (
                                        <span>
                                          <i className="bi bi-hdd"></i> {(att.fileSize / 1024).toFixed(2)} KB
                                        </span>
                                      )}
                                      {att.uploadedAt && (
                                        <span>
                                          <i className="bi bi-calendar3"></i> {new Date(att.uploadedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDownloadViewAttachment(att)}
                                    disabled={downloadingAttachmentId === att.attachmentId}
                                    className="empass-download-btn"
                                  >
                                    {downloadingAttachmentId === att.attachmentId ? (
                                      <>
                                        <i className="bi bi-hourglass-split"></i>
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-download"></i>
                                        Download
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empass-no-attachments">
                            <i className="bi bi-inbox empass-no-attachments-icon"></i>
                            No attachments submitted with this assessment
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="empass-form-footer">
                  <button
                    className="empass-btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    {modalMode === "view" ? "Close" : "Cancel"}
                  </button>

                  {modalMode === "submit" && (
                    <button
                      className="empass-btn-submit-form"
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Assessment"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAssessments;
