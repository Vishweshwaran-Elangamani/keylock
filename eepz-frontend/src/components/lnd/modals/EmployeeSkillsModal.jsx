import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Award } from "lucide-react";
import RatingDisplay from "../common/RatingDisplay";
import RecordSkillModal from "./RecordSkillModal";
import ConfirmationModal from "./ConfirmationModal";
import RequestSmeModal from "./RequestSmeModal";
import { lndService } from "../../../services/lnd/lndService";
import { toast } from "sonner";
import {
  APPROVAL_TYPE,
  APPROVAL_STATUS,
  ASSIGNMENT_STATUS,
} from "../../../constants/lnd/lndConstants";

const EmployeeSkillsModal = ({ employee, onClose, isReadOnly = false }) => {
  const [skills, setSkills] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showRequestSmeModal, setShowRequestSmeModal] = useState(false);
  const [selectedSmeSkill, setSelectedSmeSkill] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEmployeeSkills();
    if (!isReadOnly) {
      fetchApprovalHistory();
      fetchTeamAssignments();
    }
  }, [employee.employeeId, showRequestSmeModal]);

  const fetchEmployeeSkills = async () => {
    try {
      setLoading(true);
      const response = isReadOnly
        ? await lndService.getEmployeeSkillsForHR(
            employee.employeeId,
            1,
            "",
            "skillname"
          )
        : await lndService.getSubordinateSkills(
            1,
            employee.employeeId,
            "",
            "skillname"
          );

      if (response.data.success) {
        setSkills(response.data.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch employee skills:", error);
      toast.error("Failed to load employee skills");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);
      const response = await lndService.getTeamAssignments(
        1,
        ASSIGNMENT_STATUS.IN_PROGRESS,
        employee.employeeName,
        "",
        "desc"
      );

      if (response.data.success) {
        setAssignments(response.data.data.items);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage,
        });
      }
    } catch (error) {
      console.error("Failed to fetch team assignments:", error);
      toast.error("Failed to load team assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await lndService.getApprovalHistory(
        1,
        "",
        APPROVAL_TYPE.SME_REQUEST,
        APPROVAL_STATUS.PENDING,
        "",
        "",
        "desc"
      );
      if (response.data.success) {
        setApprovals(response.data.data.items);
        setPagination({
          totalCount: response.data.data.totalCount,
          pageNumber: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          totalPages: response.data.data.totalPages,
          hasPreviousPage: response.data.data.hasPreviousPage,
          hasNextPage: response.data.data.hasNextPage,
        });
      }
    } catch (error) {
      console.error("Failed to fetch approval history:", error);
      toast.error("Failed to load approval history");
    } finally {
      setLoading(false);
    }
  };

  const hasPendingSmeRequest = (skillId) => {
    return approvals.some(
      (approval) =>
        approval.skillId === skillId &&
        approval.status === "PENDING" &&
        JSON.parse(approval.notes || "{}").MenteeEmployeeId ===
          employee.employeeId
    );
  };

  const hasOngoingAssignments = (skillId) => {
    return assignments.some(
      (assignment) =>
        assignment.skillId === skillId &&
        assignment.status === "IN_PROGRESS" &&
        assignment.MenteeEmployeeId != employee.employeeId
    );
  };

  const handleAddSkill = () => {
    setSelectedSkill(null);
    setShowRecordModal(true);
  };

  const handleEditSkill = (skill) => {
    setSelectedSkill(skill);
    setShowRecordModal(true);
  };

  const handleDeleteClick = (skill) => {
    setSkillToDelete(skill);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;

    try {
      setDeleting(true);
      const response = await lndService.deleteSkill(skillToDelete.mapperId);

      if (response.data.success) {
        toast.success("Skill deleted successfully");
        setShowConfirmModal(false);
        setSkillToDelete(null);
        fetchEmployeeSkills();
      } else {
        toast.error(response.data.message || "Failed to delete skill");
      }
    } catch (error) {
      console.error("Failed to delete skill:", error);
      toast.error(error.response?.data?.message || "Failed to delete skill");
    } finally {
      setDeleting(false);
    }
  };

  const handleRecordSuccess = () => {
    setShowRecordModal(false);
    setSelectedSkill(null);
    fetchEmployeeSkills();
  };

  const handleOpenRequestSme = (skill) => {
    setSelectedSmeSkill(skill);
    setShowRequestSmeModal(true);
  };

  const handleRequestSmeSuccess = () => {
    setShowRequestSmeModal(false);
    toast.success("SME request submitted successfully!");
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "fadeIn 0.2s ease-in-out",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "rgb(39, 35, 92)",
              borderRadius: "16px 16px 0px 0px",
              borderBottom: "1px solid #e5e7eb",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.1rem",
                }}
              >
                {employee.employeeName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h5
                  style={{
                    margin: 0,
                    fontWeight: "600",
                    color: "white",
                    fontSize: "16px",
                    textAlign: "left",
                  }}
                >
                  {employee.employeeName}
                </h5>
                <p style={{ margin: 0, fontSize: "14px", color: "white" }}>
                  {employee.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close-white"
              onClick={onClose}
              disabled={loading}
              style={{
                border: "none",
                width: "36px",
                backgroundColor: "transparent",
                height: "36px",
                borderRadius: "0.5rem",
                cursor: loading ? "not-allowed" : "pointer",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "red";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : skills.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Award
                  size={40}
                  color="#d1d5db"
                  style={{ marginBottom: "0.75rem" }}
                />
                <h5
                  style={{
                    color: "#6c757d",
                    marginBottom: "0.4rem",
                    fontSize: "1.1rem",
                  }}
                >
                  No Skills Recorded
                </h5>
                <p style={{ color: "#9ca3af", fontSize: "0.825rem" }}>
                  {isReadOnly
                    ? "This employee has no recorded skills"
                    : "Start by recording the first skill for this employee"}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {skills.map((skill) => (
                  <div
                    key={skill.mapperId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      background: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "500",
                            color: "#212529",
                            fontSize: "0.925rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {skill.skillName}
                        </span>
                        {skill.isSme && (
                          <span
                            style={{
                              padding: "0.125rem 0.375rem",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              fontWeight: "600",
                              background: "#d1fae5",
                              color: "#065f46",
                              flexShrink: 0,
                            }}
                          >
                            SME
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginRight: isReadOnly ? "0" : "2rem" }}>
                      <RatingDisplay rating={skill.rating} size="sm" />
                    </div>

                    {!isReadOnly && (
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button
                          onClick={() => handleEditSkill(skill)}
                          style={{
                            padding: "0.375rem",
                            background: "transparent",
                            color: "#6c757d",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#97247E";
                            e.currentTarget.style.color = "#97247E";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.color = "#6c757d";
                          }}
                          title="Edit rating"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(skill)}
                          style={{
                            padding: "0.375rem",
                            background: "transparent",
                            color: "#6c757d",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#dc3545";
                            e.currentTarget.style.color = "#dc3545";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.color = "#6c757d";
                          }}
                          title="Delete skill"
                        >
                          <Trash2 size={14} />
                        </button>

                        {!skill.isSme &&
                          skill.rating < 5 &&
                          (hasPendingSmeRequest(skill.skillId) ? (
                            <button
                              disabled
                              style={{
                                padding: "0.375rem 0.5rem",
                                background: "#f59e0b",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                gap: "0.3rem",
                                opacity: 0.8,
                              }}
                              title="SME request is pending approval"
                            >
                              <i
                                className="bi bi-hourglass-split"
                                style={{ fontSize: "12px" }}
                              ></i>
                              Pending
                            </button>
                          ) : hasOngoingAssignments(skill.skillId) ? (
                            <button
                              disabled
                              style={{
                                padding: "0.375rem 0.5rem",
                                background: "#2b8302ff",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                gap: "0.3rem",
                                opacity: 0.8,
                              }}
                              title="SME Assignment is In Progress."
                            >
                              <i
                                className="bi bi-hourglass-split"
                                style={{ fontSize: "12px" }}
                              ></i>
                              Assigned
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedSmeSkill(skill);
                                setShowRequestSmeModal(true);
                              }}
                              style={{
                                padding: "0.375rem 0.5rem",
                                background:
                                  "linear-gradient(135deg, #AC5098 0%, #97247E 100%)",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                gap: "0.3rem",
                                transition: "opacity 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = 0.8)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = 1)
                              }
                              title="Request SME"
                            >
                              <Award size={12} />
                              Request SME
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                onClick={handleAddSkill}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  color: "#fff",
                  fontSize: "0.825rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Plus size={14} />
                Add Skill
              </button>
            )}
          </div>
        </div>
      </div>

      {!isReadOnly && showRecordModal && (
        <RecordSkillModal
          key={Date.now()}
          skill={
            selectedSkill
              ? { ...selectedSkill, employeeId: employee.employeeId }
              : {
                  employeeId: employee.employeeId,
                  employeeName: employee.employeeName,
                }
          }
          onClose={() => setShowRecordModal(false)}
          onSuccess={handleRecordSuccess}
        />
      )}

      {!isReadOnly && showRequestSmeModal && selectedSmeSkill && (
        <RequestSmeModal
          skillId={selectedSmeSkill.skillId}
          employeeId={employee.employeeId}
          onClose={() => setShowRequestSmeModal(false)}
          onSuccess={() => {
            setShowRequestSmeModal(false);
            toast.success("SME request submitted successfully!");
          }}
        />
      )}

      {!isReadOnly && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Skill"
          message={`Are you sure you want to delete "${skillToDelete?.skillName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="#dc3545"
          loading={deleting}
        />
      )}
    </>
  );
};

export default EmployeeSkillsModal;
