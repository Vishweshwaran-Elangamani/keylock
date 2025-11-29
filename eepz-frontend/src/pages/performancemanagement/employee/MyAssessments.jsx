// MyAssessments_updated.jsx
// Updated: Added attachment name field with improved design

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import api from "../../../services/performancemanagement/hr/api";
import logoImage from "../../../assets/logodark.png";
import "../../../styles/performancemanagement/employee/MyAssessments.css";

// Utility function to get days and hours left
function getTimeLeft(deadline) {
  const now = new Date();
  const dl = new Date(deadline);
  let ms = dl - now;
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: ms === 0 };
}

/**
 * Breadcrumbs component
 * items: [{ label: string, to: string }]
 */
function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="breadcrumb" className="empassper-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={index} className={last ? "current" : ""}>
              {!last ? (
                <Link to={item.to || "#"} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current" aria-current="page">{item.label}</span>
              )}

              {!last && <span className="breadcrumb-sep">{'>'}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
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
  const [formTypeFilter, setFormTypeFilter] = useState("All");
  const [timers, setTimers] = useState({});
  const [visibleTimers, setVisibleTimers] = useState([]);

  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);


  // ✅ Attachment states
  const [attachments, setAttachments] = useState([]);
  const [viewAttachments, setViewAttachments] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.empId : null;

  // ========================
  // EFFECTS
  // ========================

  useEffect(() => {
    if (!userId) {
      navigate("/employee/login");
      return;
    }
    fetchAssignments();
  }, [userId, navigate]);

  // TIMER EFFECT
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

  // ========================
  // API FUNCTIONS
  // ========================

  // Get file extension from MIME type
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
  if (matchUtf8 && matchUtf8) {
    try {
      return decodeURIComponent(matchUtf8.replace(/"/g, '').trim());
    } catch (e) {
      return matchUtf8.replace(/"/g, '').trim();
    }
  }
  const matchNormal = contentDisposition.match(/filename=([^;]+)(?:;|$)/i);
  if (matchNormal && matchNormal) {
    return matchNormal.replace(/"/g, '').trim();
  }
  return null;
}


// Checks if filename string contains a file extension (dot + at least 2 chars)
function hasExtension(filename) {
  return /\.[a-zA-Z0-9]{2,5}$/.test(filename);
}



// ---- The corrected download handler ----
const handleDownloadAttachment = async (attachment) => {
  try {
    setDownloadingId(attachment.attachmentId);
    setError(null);

    const downloadUrl = `/api/AppraisalProcess/hr/attachments/${attachment.attachmentId}/download`;
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();

    let filename = attachment.fileName || "attachment";
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) {
      const parsedName = extractFilenameFromHeader(contentDisposition);
      if (parsedName) {
        filename = parsedName;
      }
    }

    // If the filename does not have an extension, try to infer from Content-Type header
    if (!hasExtension(filename)) {
      // Try Content-Type header from response
      let extension = '';
      const mimeType = response.headers.get("content-type") || attachment.fileType || '';
      extension = getExtensionFromMime(mimeType);
      if (!extension && blob.type) {
        extension = getExtensionFromMime(blob.type);
      }
      // Fallback to .bin if no match at all
      if (!extension) extension = '.bin';

      filename += extension;
    }

    // Download with final filename
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    console.log(`✅ Downloaded: ${filename}`);
  } catch (err) {
    console.error("Download error:", err);
    setError(`Failed to download ${attachment.fileName}: ${err.message}`);
  } finally {
    setDownloadingId(null);
  }
};
const handleDownloadViewAttachment = async (attachment) => {
  try {
    setDownloadingAttachmentId(attachment.attachmentId);
    const downloadUrl = `/api/SelfAssessment/attachments/${attachment.attachmentId}/download`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    let filename = attachment.fileName || "attachment";
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentDisposition) {
      const headerFilename = extractFilenameFromHeader(contentDisposition);
      if (headerFilename) {
        filename = headerFilename;
      }
    }
    
    if (!hasExtension(filename)) {
      let extension = '';
      const contentType = response.headers.get('content-type');
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
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    console.log(`✅ Downloaded: ${filename}`);
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
      const { data } = await api.get(`/AppraisalProcess/employee/${userId}`);
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
      const { data } = await api.get(`/SelfAssessment/view/${assignment.formId}/user/${userId}`);
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

  // ✅ Handle file selection
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
            customName: file.name, // ✅ NEW: Allow custom name editing
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

  // ✅ NEW: Update attachment custom name
  const updateAttachmentName = (index, name) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, customName: name } : att))
    );
  };

  // ✅ Update attachment note
  const updateAttachmentNote = (index, note) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, attachmentNote: note } : att))
    );
  };

  // ✅ Remove attachment
  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAssessment = async () => {
    // Validate ratings
    const incompleteRatings = assessmentData.filter((item) => !item.rating);
    if (incompleteRatings.length > 0) {
      toast.error("Please provide ratings for all competencies.");
      return;
    }

    // Validate comments
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
      // ✅ Include attachments with custom name
      attachments: attachments.map((att) => ({
        fileName: att.customName || att.fileName, // Use custom name if provided
        fileType: att.fileType,
        fileSize: att.fileSize,
        attachmentNote: att.attachmentNote,
        base64Content: att.base64Content,
        displayOrder: att.displayOrder,
      })),
    };

    try {
      const { data } = await api.post("/SelfAssessment/submit", payload);
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

  // ========================
  // FILTER & DATA PROCESSING
  // ========================

  const pendingAssignments = assignments.filter((a) => !a.isCompleted);
  const completedAssignments = assignments.filter((a) => a.isCompleted);

  const formTypes = ["All", ...new Set(assignments.map((a) => a.formType).filter(Boolean))];

  const filterAssignments = (assignmentList) => {
    return assignmentList.filter((assignment) => {
      const matchSearch =
        assignment.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.formType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDate = !dateFilter ||
        new Date(assignment.deadline).toLocaleDateString("en-GB") ===
        new Date(dateFilter).toLocaleDateString("en-GB");

      const matchType = formTypeFilter === "All" || assignment.formType === formTypeFilter;

      return matchSearch && matchDate && matchType;
    });
  };

  const filteredPending = filterAssignments(pendingAssignments);
  const filteredCompleted = filterAssignments(completedAssignments);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  // ========================
  // RENDER FUNCTIONS
  // ========================

  const renderTable = (data) => (
    <div className="empassper-table-container">
      <table className="empassper-table" style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", border:"1px solid black", borderRadius:"12px"}}>
        <thead>
          <tr>
            <th style={{ borderTopLeftRadius: "8px"}}>FORM NAME</th>
            <th>TYPE</th>
            <th>DEADLINE</th>
            <th>STATUS</th>
            <th style={{ borderTopRightRadius: "8px"}}>SUBMISSION</th>
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
        <Toaster position="top-right" richColors />
        <div className="empassper-loading-state">
          <div className="spinner-border"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="empassper-container">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="empassper-header-section">
        <div className="empassper-header-content">
          <div className="empassper-header-text" style={{ flex: 1 }}>
            <Breadcrumbs
              items={[
                { label:  <i className="bi bi-house-door"></i>, to: "/employee/dashboard", isIcon: true },
                { label: "Performance Management", to: "/employee/dashboard/performance" },
                { label: <strong>My Performance Assessments</strong>, to: "/employee/dashboard/performance/my-assessments" }
              ]}
            />
          </div>
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

      {/* TIMER BARS */}
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

      {/* Search & Filter */}
      <div className="empassper-search-filter-container">
        <div className="empassper-search-box">
          <input
            type="text"
            placeholder="Search by form name or type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            aria-label="Search assessments"
          />
          <button className="empassper-search-btn" onClick={handleSearch} aria-label="Search">Search</button>
        </div>
        <select
          className="empassper-filter-select"
          value={formTypeFilter}
          onChange={(e) => setFormTypeFilter(e.target.value)}
        >
          <option value="All">All Form Types</option>
          {formTypes.filter(t => t !== "All").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="empassper-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by deadline"
        />
      </div>

      {/* Tab Navigation */}
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

      {/* Content */}
      {activeTab === "pending" && (
        <>
          {filteredPending.length > 0 ? (
            renderTable(filteredPending)
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
            renderTable(filteredCompleted)
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

      {/*-------------------------------------------------------MODAL---------------------------------- */}
      {showModal && currentAssignment && (
  <div
    className="empassper-modal-overlay"
    onClick={() => !submitting && setShowModal(false)}
  >
    <div
      className="empassper-modal-content"
      onClick={(e) => e.stopPropagation()}
      style={{ paddingTop: "0px", marginTop: "0px" }}
    >
     {/* Form Header */}
<div className="empass-form-header" style={{ marginBottom: "0px", paddingBottom: "0px", position: "relative" }}>
  <div className="empass-logo-section">
    <img src={logoImage} alt="Logo" className="empass-logo-small" />
    <div className="empass-appraisal-label" style={{paddingBottom:"10px"}}>Appraisal Form</div>
  </div>
  <div className="empass-form-title-container" style={{marginRight:"100px"}}>
    <h2 className="empass-form-title">{currentAssignment?.formName}</h2>
    <p className="empass-form-subtitle">
      {currentAssignment?.formType} Assessment Form
    </p>
  </div>
  
  {/* ✅ Attachment Count Badge in Header */}
  {((modalMode === "submit" && attachments.length > 0) || 
    (modalMode === "view" && viewAttachments && viewAttachments.length > 0)) && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#97247E",
        padding: "6px 12px",
        borderRadius: "8px",
        position: "absolute",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)"
      }}
    >
      {/* <i
        className="bi bi-paperclip"
        style={{
          color: "white",
          fontSize: "14px",
        }}
      ></i> */}
      <span
        style={{
          color: "white",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {modalMode === "submit" 
          ? `${attachments.length} ${attachments.length === 1 ? "File" : "Files"}`
          : `${viewAttachments.length} ${viewAttachments.length === 1 ? "File" : "Files"}`
        }
      </span>
    </div>
  )}
</div>


      <div
        className="empass-form-divider"
        style={{
          marginTop: "0px",
          marginBottom: "0px",
          padding: "0",
          height: "0px",
          lineHeight: "0",
        }}
      ></div>

      {submitting && modalMode === "view" ? (
        <div
          className="empass-form-body"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "0px",
            marginTop: "0px",
            padding:"0px"
          }}
        >
          <div>
            <div className="spinner-border"></div>
            <p
              style={{
                marginTop: "16px",
                color: "var(--text-light)",
                textAlign: "center",
              }}
            >
              Loading assessment...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Form Body */}
          <div
            className="empass-form-body"
            style={{
              paddingTop: "24px", // ✅ Added gap here
              marginTop: "0px",
            }}
          >
            <table
              className="empass-form-table"
              style={{
                width:"100%",
                marginTop: "0px",
                borderCollapse: "separate",
                borderLeft: "none",
                borderRadius: "12px",
                borderRight: "none",
                borderBottom: "none",
                border: "1px solid black",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "10px 6px", height: "44px", borderTopLeftRadius: "8px" }}>Competency Name</th>
                  <th style={{ padding: "10px 6px", height: "40px" }}>Description</th>
                  <th style={{ padding: "10px 6px", height: "40px" }}>Rating</th>
                  <th style={{ padding: "10px 6px", height: "40px", borderTopRightRadius: "8px" }}>Comments</th>
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
                        <span className="rating-badge">
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
                          className="form-select"
                          disabled={submitting}
                        >
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
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
                          className="form-textarea"
                          disabled={submitting}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ UPDATED: Attachments Section with Name Field */}
            <div style={{ marginTop: "24px", padding: "0 16px" }}>
              <h3 style={{ 
                fontSize: "16px", 
                fontWeight: "600", 
                marginBottom: "12px",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <i className="bi bi-paperclip"></i>
                Attachments
              </h3>

              {/* Submit Mode: Upload Interface */}
              {modalMode === "submit" && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      htmlFor="file-upload"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "background-color 0.2s",
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
                    >
                      <i className="bi bi-cloud-upload"></i> Add Attachment
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                      disabled={submitting}
                    />
                    <span style={{ 
                      marginLeft: "12px", 
                      fontSize: "13px", 
                      color: "#666" 
                    }}>
                      {attachments.length > 0 && `${attachments.length} file(s) selected`}
                    </span>
                  </div>

                  {/* Display Selected Attachments */}
                  {attachments.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      {attachments.map((att, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "16px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            backgroundColor: "#f9fafb",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {/* Header with file icon and remove button */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            marginBottom: "12px"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center",
                              gap: "8px"
                            }}>
                              <i 
                                className="bi bi-file-earmark-text" 
                                style={{ 
                                  fontSize: "24px", 
                                  color: "#3b82f6" 
                                }}
                              ></i>
                              <div>
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "#6b7280",
                                  marginBottom: "2px"
                                }}>
                                  Original: {att.fileName}
                                </div>
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "#9ca3af" 
                                }}>
                                  {(att.fileSize / 1024).toFixed(2)} KB • {att.fileType || 'Unknown type'}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "background-color 0.2s",
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
                              onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}
                              disabled={submitting}
                            >
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </div>

                          {/* ✅ NEW: Attachment Name Field */}
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ 
                              display: "block",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#374151",
                              marginBottom: "6px"
                            }}>
                              <i className="bi bi-tag"></i> Attachment Name *
                            </label>
                            <input
                              type="text"
                              value={att.customName}
                              onChange={(e) => updateAttachmentName(index, e.target.value)}
                              placeholder="Enter a name for this attachment"
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                outline: "none",
                                transition: "border-color 0.2s",
                              }}
                              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                              onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                              disabled={submitting}
                            />
                          </div>

                          {/* Attachment Description Field */}
                          <div>
                            <label style={{ 
                              display: "block",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#374151",
                              marginBottom: "6px"
                            }}>
                              <i className="bi bi-chat-left-text"></i> Description (Optional)
                            </label>
                            <textarea
                              value={att.attachmentNote}
                              onChange={(e) => updateAttachmentNote(index, e.target.value)}
                              placeholder="Add a description or notes for this attachment..."
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "13px",
                                minHeight: "70px",
                                resize: "vertical",
                                backgroundColor: "white",
                                outline: "none",
                                transition: "border-color 0.2s",
                                fontFamily: "inherit"
                              }}
                              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                              onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachments.length === 0 && (
                    <div style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontStyle: "italic",
                      border: "2px dashed #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb"
                    }}>
                      <i className="bi bi-inbox" style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}></i>
                      No attachments added yet. Click "Add Attachment" to upload files.
                    </div>
                  )}
                </div>
              )}

              {/* View Mode: Display Attachments */}
              {modalMode === "view" && (
                <div>
                  {viewAttachments && viewAttachments.length > 0 ? (
                    <div style={{ marginTop: "12px" }}>
                      {viewAttachments.map((att) => (
                        <div
                          key={att.attachmentId}
                          style={{
                            padding: "16px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            marginBottom: "12px",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "flex-start"
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px"
                              }}>
                               
                                <div style={{ 
                                  fontWeight: "600", 
                                  fontSize: "14px",
                                  color: "#1f2937"
                                }}>
                                  {att.fileName}
                                </div>
                              </div>
                              
                              {att.attachmentNote && (
                                <div style={{ 
                                  fontSize: "13px", 
                                  color: "#4b5563",
                                  marginTop: "8px",
                                  padding: "8px 12px",
                                  backgroundColor: "#ffffff",
                                  borderRadius: "6px",
                                  borderLeft: "3px solid #3b82f6"
                                }}>
                                  <strong>Description:</strong> {att.attachmentNote}
                                </div>
                              )}
                              
                              <div style={{ 
                                fontSize: "12px", 
                                color: "#9ca3af",
                                marginTop: "8px",
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap"
                              }}>
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
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#97247E",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: downloadingAttachmentId === att.attachmentId ? "not-allowed" : "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
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
                    <div style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontStyle: "italic",
                      border: "2px dashed #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb"
                    }}>
                      <i className="bi bi-inbox" style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}></i>
                      No attachments submitted with this assessment
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <div className="form-footer">
            <button
              className="empass-btn-cancel"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              {modalMode === "view" ? "Close" : "Cancel"}
            </button>

            {modalMode === "submit" && (
              <button
                className="btn-submit-form"
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

      {/*-------------------------------------------------------MODAL---------------------------------- */}
    </div>
  );
}

export default MyAssessments;
