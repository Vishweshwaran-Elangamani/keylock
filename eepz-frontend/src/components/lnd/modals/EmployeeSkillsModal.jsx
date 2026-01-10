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
import styles from "../../../styles/lnd/components/EmployeeSkillsModal.module.css";
import { LND_TOASTS } from "../../../constants/lnd/lndToasts";

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
      toast.error(LND_TOASTS.FAILED_TO_LOAD_SKILLS);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAssignments = async () => {
    try {
      setLoading(true);

      const response = await lndService.getTeamAssignments(
        1,
        "",
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
      toast.error(LND_TOASTS.FAILED_TO_LOAD_TEAM_ASSIGNMENTS);
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
      toast.error(LND_TOASTS.FAILED_TO_LOAD_APPROVAL_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const hasPendingSmeRequest = (skillId) => {
    return approvals.some((approval) => {
      if (
        approval.skillId === skillId &&
        approval.status === APPROVAL_STATUS.PENDING
      ) {
        try {
          // Try to parse notes as JSON
          const notes = JSON.parse(approval.notes || "{}");
          return notes.MenteeEmployeeId === employee.employeeId;
        } catch (error) {
          return false;
        }
      }
      return false;
    });
  };

  const hasOngoingAssignments = (skillId) => {
    const ACTIVE_STATUSES = [
      ASSIGNMENT_STATUS.IN_PROGRESS,
      ASSIGNMENT_STATUS.PENDING_SME_ACKNOWLEDGEMENT,
      ASSIGNMENT_STATUS.PENDING_MANAGER_ACKNOWLEDGEMENT,
    ];

    return assignments.some(
      (assignment) =>
        assignment.skillId === skillId &&
        assignment.menteeEmployeeId === employee.employeeId &&
        ACTIVE_STATUSES.includes(assignment.status)
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
        toast.success(LND_TOASTS.SKILL_DELETED);
        setShowConfirmModal(false);
        setSkillToDelete(null);
        fetchEmployeeSkills();
      } else {
        toast.error(response.data.message || LND_TOASTS.FAILED_TO_DELETE_SKILL);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || LND_TOASTS.FAILED_TO_DELETE_SKILL
      );
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
    toast.success(LND_TOASTS.SME_REQUEST_SUBMITTED);
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {employee.employeeName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div className={styles.employeeInfo}>
                <h5 className={styles.employeeName}>{employee.employeeName}</h5>
                <p className={styles.employeeEmail}>{employee.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`btn-close-white ${styles.btnClose}`}
            />
          </div>

          <div className={styles.body}>
            {loading ? (
              <div className={styles.loading}>
                <div
                  className={`spinner-border text-primary ${styles.loadingSpinner}`}
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : skills.length === 0 ? (
              <div className={styles.emptyState}>
                <Award size={40} color="#d1d5db" className={styles.emptyIcon} />
                <h5 className={styles.emptyTitle}>
                  {isReadOnly ? "No Skills Recorded" : "No Skills Recorded"}
                </h5>
                <p className={styles.emptyText}>
                  {isReadOnly
                    ? "This employee has no recorded skills"
                    : "Start by recording the first skill for this employee"}
                </p>
              </div>
            ) : (
              <div className={styles.skillsList}>
                {skills.map((skill) => (
                  <div key={skill.mapperId} className={styles.skillItem}>
                    <div className={styles.skillContent}>
                      <div className={styles.skillHeader}>
                        <span className={styles.skillName}>
                          {skill.skillName}
                        </span>
                        {skill.isSme && (
                          <span className={styles.smeBadge}>SME</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.ratingContainer}>
                      <RatingDisplay rating={skill.rating} size="sm" />
                    </div>

                    {!isReadOnly && (
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className={styles.actionBtn}
                          title="Edit rating"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(skill)}
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Delete skill"
                        >
                          <Trash2 size={14} />
                        </button>

                        {!skill.isSme &&
                          skill.rating < 5 &&
                          (hasPendingSmeRequest(skill.skillId) ? (
                            <button
                              disabled
                              className={`${styles.statusBtn} ${styles.statusPending}`}
                              title="SME request is pending approval"
                            >
                              <i
                                className="bi bi-hourglass-split"
                                style={{ fontSize: "12px" }}
                              />
                              Pending
                            </button>
                          ) : hasOngoingAssignments(skill.skillId) ? (
                            <button
                              disabled
                              className={`${styles.statusBtn} ${styles.statusAssigned}`}
                              title="SME assignment is in progress or under review."
                            >
                              <i
                                className="bi bi-hourglass-split"
                                style={{ fontSize: "12px" }}
                              />
                              Assigned
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedSmeSkill(skill);
                                setShowRequestSmeModal(true);
                              }}
                              className={styles.statusRequestSme}
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

          <div className={styles.footer}>
            <button
              type="button"
              className={`btn btn-secondary ${styles.btnCancel}`}
              onClick={onClose}
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button onClick={handleAddSkill} className={styles.btnAddSkill}>
                <Plus size={14} />
                Add Skill
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Child Modals */}
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
