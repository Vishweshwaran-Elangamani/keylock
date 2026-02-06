import React, { useState } from "react";
import CreateMomModal from "./CreateMomModal";
import "../../../styles/mom/modals/MeetingDetailsModal.css";

const MeetingDetailsModal = ({ meeting, onClose, employeeMap, onMomCreated }) => {
  const [showCreateMom, setShowCreateMom] = useState(false);

  const toggleCreateMom = () => setShowCreateMom(!showCreateMom);

  if (!meeting) return null;

  const meetingTitle = meeting.meetingTitle || meeting.MeetingTitle;
  const meetingType = meeting.meetingType || meeting.MeetingType;
  const meetingDate =
    meeting.meetingDate ||
    meeting.MeetingDate ||
    meeting.createdAt ||
    meeting.CreatedAt;

  const attendees =
    meeting.attendees ||
    meeting.Attendees ||
    meeting.attendeeNames ||
    "Not specified";

  const meetingLink = meeting.meetingLink || meeting.MeetingLink;
  const commentsObservations =
    meeting.commentsObservations || meeting.CommentsObservations;

  const discussionPoints =
    meeting.discussionPoints || meeting.DiscussionPoints || [];

  const actionItems = meeting.actionItems || meeting.ActionItems || [];

  const getEmployeeName = (actionItem) => {
    const existingName = 
      actionItem.assignedToEmployeeName ||
      actionItem.AssignedToEmployeeName ||
      actionItem.employeeName ||
      actionItem.EmployeeName;

    if (existingName) return existingName;

    const assignedId =
      actionItem.assignedToEmployeeId ||
      actionItem.AssignedToEmployeeId ||
      actionItem.assignedEmployeeId ||
      actionItem.AssignedEmployeeId ||
      actionItem.employeeId ||
      actionItem.EmployeeId ||
      actionItem.assignTo ||
      actionItem.AssignTo;

    if (!assignedId) return "Unassigned";

    return employeeMap?.[String(assignedId)];
  };

  const handleMomCreated = (newMom) => {
    const processedActionItems = (newMom.actionItems || newMom.ActionItems || []).map(item => {
      const assignedId = 
        item.assignedToEmployeeId || 
        item.AssignedToEmployeeId ||
        item.assignedTo ||
        item.AssignedTo;
      
      const existingName = 
        item.assignedToEmployeeName ||
        item.AssignedToEmployeeName ||
        item.employeeName ||
        item.EmployeeName;
      
      const finalName = existingName || employeeMap?.[String(assignedId)] || `Employee ${assignedId}`;
      
      return {
        ...item,
        assignedToEmployeeId: assignedId,
        AssignedToEmployeeId: assignedId,
        assignedToEmployeeName: finalName,
        AssignedToEmployeeName: finalName,
        taskDescription: item.taskDescription || item.TaskDescription || "",
        TaskDescription: item.taskDescription || item.TaskDescription || "",
        dueDate: item.dueDate || item.DueDate || "",
        DueDate: item.dueDate || item.DueDate || "",
        status: item.status || item.Status || "Pending",
        Status: item.status || item.Status || "Pending",
      };
    });

    const normalizedMom = {
      meetingId: newMom.meetingId || newMom.MeetingId || newMom.id || Date.now(),
      MeetingId: newMom.meetingId || newMom.MeetingId || newMom.id || Date.now(),
      meetingTitle: newMom.meetingTitle || newMom.MeetingTitle || meetingTitle || "MOM Record",
      MeetingTitle: newMom.meetingTitle || newMom.MeetingTitle || meetingTitle || "MOM Record",
      meetingType: newMom.meetingType || newMom.MeetingType || meetingType || "General",
      MeetingType: newMom.meetingType || newMom.MeetingType || meetingType || "General",
      meetingDate: newMom.meetingDate || newMom.MeetingDate || meetingDate,
      MeetingDate: newMom.meetingDate || newMom.MeetingDate || meetingDate,
      commentsObservations: newMom.commentsObservations || newMom.CommentsObservations || "",
      CommentsObservations: newMom.commentsObservations || newMom.CommentsObservations || "",
      actionItems: processedActionItems,
      ActionItems: processedActionItems,
      discussionPoints: newMom.discussionPoints || newMom.DiscussionPoints || [],
      DiscussionPoints: newMom.discussionPoints || newMom.DiscussionPoints || [],
      attendees: newMom.attendees || newMom.Attendees || attendees,
      Attendees: newMom.attendees || newMom.Attendees || attendees,
    };

    if (onMomCreated) {
      onMomCreated(normalizedMom);
    }
    
    setShowCreateMom(false);
  };

  return (
    <>
      <div
        className="mdm-overlay modal fade show d-block"
        tabIndex="-1"
        onClick={onClose}
      >
        <div
          className="mdm-dialog modal-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mdm-content modal-content border-0 shadow-lg">
            <div className="mdm-header modal-header border-0">
              <div className="mdm-header-text">
                <h5 className="mdm-title modal-title fw-bold mb-2">
                  {meetingTitle}
                </h5>
                <span className="mdm-type-badge badge bg-light text-primary">
                  {meetingType}
                </span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <div className="mdm-body modal-body">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="mdm-info-card p-3 rounded">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-calendar3 text-primary"></i>
                      <small className="text-muted fw-semibold">
                        Date & Time
                      </small>
                    </div>
                    <span className="d-block fw-medium">
                      {meetingDate
                        ? new Date(meetingDate).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              {meetingLink && (
                <div className="mb-4">
                  <div className="mdm-link-card p-3 rounded">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-link-45deg text-primary"></i>
                      <small className="text-muted fw-semibold">
                        Meeting Link
                      </small>
                    </div>
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mdm-link text-primary text-decoration-none d-flex align-items-center gap-2 fw-medium"
                    >
                      Join Meeting
                      <i className="bi bi-box-arrow-up-right small"></i>
                    </a>
                  </div>
                </div>
              )}

              {commentsObservations && (
                <div className="mb-4">
                  <h6 className="mdm-section-title fw-semibold mb-3">
                    Comments & Observations
                  </h6>
                  <div className="mdm-comments-card p-3 rounded">
                    <p className="mb-0">{commentsObservations}</p>
                  </div>
                </div>
              )}

              {discussionPoints.length > 0 && (
                <div className="mb-4">
                  <h6 className="mdm-section-title fw-semibold mb-3">
                    Discussion Points
                  </h6>
                  {discussionPoints.map((dp, i) => (
                    <div key={i} className="mdm-discussion-card p-3 rounded mb-2">
                      {dp.pointText || dp.PointText || dp.point || "No details"}
                    </div>
                  ))}
                </div>
              )}

              {actionItems.length > 0 && (
                <div className="mb-4">
                  <h6 className="mdm-section-title fw-semibold mb-3">
                    Action Items
                  </h6>
                  {actionItems.map((ai, i) => {
                    const task =
                      ai.taskDescription ||
                      ai.TaskDescription ||
                      ai.task ||
                      ai.Task ||
                      "No description";

                    const due =
                      ai.dueDate ||
                      ai.DueDate ||
                      ai.targetDate ||
                      ai.TargetDate ||
                      null;

                    const employeeName = getEmployeeName(ai);

                    return (
                      <div key={i} className="mdm-action-card p-3 rounded mb-2">
                        <div className="fw-semibold mb-2">{task}</div>
                        <div className="small text-muted">
                          <span className="me-3">
                            <i className="bi bi-person-fill me-1"></i>
                            Assigned to: <strong>{employeeName}</strong>
                          </span>
                          <span>
                            <i className="bi bi-calendar-event me-1"></i>
                            Due: <strong>{due ? new Date(due).toLocaleDateString() : "N/A"}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="mdm-create-mom-btn btn btn-outline-primary w-100 py-2"
                onClick={toggleCreateMom}
              >
                {showCreateMom ? "Cancel MOM Creation" : "Create MOM for this Meeting"}
              </button>

              {showCreateMom && (
                <CreateMomModal 
                  meetingData={meeting} 
                  onClose={toggleCreateMom}
                  onMomCreated={handleMomCreated}
                  employeeMap={employeeMap}
                />
              )}
            </div>

            <div className="mdm-footer modal-footer border-0">
              <button className="btn btn-secondary px-4" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MeetingDetailsModal;
