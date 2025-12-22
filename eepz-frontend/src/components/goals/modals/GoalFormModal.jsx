import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import { toast } from "sonner";
import {
  GOAL_TYPES,
  GOAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";
import styles from "../../../styles/goals/components/GoalFormModal.module.css";

const GoalFormModal = ({ isOpen, onClose, goalData = null, onSuccess }) => {
  const { user } = useAuth();
  const isEdit = !!goalData;
  const modalBodyRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [completedChecklistIds, setCompletedChecklistIds] = useState(new Set());

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: GOAL_TYPES.SELF,
    projectId: "",
    deadline: "",
    assignees: [],
    checklistByAssignee: {},
  });

  const [touched, setTouched] = useState({
    title: false,
    deadline: false,
    assignees: false,
    checklist: false,
    projectId: false,
  });

  const [errors, setErrors] = useState({});

  const [projects, setProjects] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const assigneeDropdownRef = useRef(null);

  // Custom dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const typeDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);

  const canSelectTeamType = ["Manager", "Department Head"].includes(user.role);
  const canSelectOrgType = user.role === "Leadership";

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (Object.values(touched).some((t) => t)) {
      validateForm();
    }
  }, [formData, touched]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target)
      ) {
        setShowAssigneeDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target)
      ) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      isOpen &&
      !isEdit &&
      formData.type === GOAL_TYPES.TEAM &&
      formData.projectId
    ) {
      loadSubordinates();
    }
  }, [formData.projectId, formData.type]);

  const loadInitialData = async () => {
    setLoadingData(true);
    setCompletedChecklistIds(new Set());
    setTouched({
      title: false,
      deadline: false,
      assignees: false,
      checklist: false,
      projectId: false,
    });
    setErrors({});

    try {
      await loadProjects();

      if (isEdit && goalData) {
        const fullGoalResponse = await goalService.getGoal(goalData.goalId);
        const fullGoal = fullGoalResponse.data;

        const checklistByAssignee = {};
        const completedIds = new Set();

        if (fullGoal.checklist && Array.isArray(fullGoal.checklist)) {
          fullGoal.checklist.forEach((item) => {
            const assigneeId =
              item.addedFor ||
              item.addedForEmployeeMasterId ||
              user.empMasterId;
            const checklistId = item.checklistId || item.id;

            const isCompleted = !!item.isCompletedForCurrentUser;

            if (isCompleted) {
              completedIds.add(checklistId);
            }

            if (!checklistByAssignee[assigneeId]) {
              checklistByAssignee[assigneeId] = [];
            }
            checklistByAssignee[assigneeId].push({
              id: checklistId,
              title: item.title || "",
              description: item.description || "",
              isCompleted: isCompleted,
            });
          });
        }

        setCompletedChecklistIds(completedIds);

        if (completedIds.size > 0) {
          toast.warning(
            `${completedIds.size} checklist item(s) are completed and locked. You must uncomplete them before editing.`,
            {
              duration: 5000,
            }
          );
        }

        setFormData({
          title: fullGoal.title || "",
          description: fullGoal.description || "",
          type: fullGoal.goalType || GOAL_TYPES.SELF,
          projectId: fullGoal.projectId || "",
          deadline: fullGoal.endAt ? fullGoal.endAt.split("T")[0] : "",
          assignees: fullGoal.assignees?.map((a) => a.employeeMasterId) || [],
          checklistByAssignee:
            Object.keys(checklistByAssignee).length > 0
              ? checklistByAssignee
              : {
                  [user.empMasterId]: [
                    { title: "", description: "" },
                    { title: "", description: "" },
                    { title: "", description: "" },
                  ],
                },
        });
      } else {
        setFormData({
          title: "",
          description: "",
          type: GOAL_TYPES.SELF,
          projectId: "",
          deadline: "",
          assignees: [],
          checklistByAssignee: {
            [user.empMasterId]: [
              { title: "", description: "" },
              { title: "", description: "" },
              { title: "", description: "" },
            ],
          },
        });
      }
    } catch (error) {
      console.error("Failed to load form data:", error);
      toast.error("Failed to load form data", {
        description: error.message || "An error occurred while loading data",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await goalService.getUserProjects();
      const projectsData = response.data || [];
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadSubordinates = async () => {
    if (!formData.projectId) {
      setAvailableEmployees([]);
      return;
    }

    setLoadingEmployees(true);
    try {
      const response = await goalService.getProjectSubordinates(
        formData.projectId
      );

      const subordinates = response.data?.data || [];

      const formattedEmployees = subordinates.map((emp) => ({
        empMasterId: emp.empMasterId,
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        fullName:
          `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unknown",
      }));

      setAvailableEmployees(formattedEmployees);
    } catch (error) {
      console.error("Failed to load subordinates:", error);
      toast.error("Failed to load team members", {
        description: "Please try selecting the project again",
      });
      setAvailableEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const getFilledChecklistCount = () => {
    let count = 0;
    Object.values(formData.checklistByAssignee).forEach((items) => {
      items.forEach((item) => {
        if (item.title && item.title.trim()) {
          count++;
        }
      });
    });
    return count;
  };

  const validateForm = () => {
    const newErrors = {};

    if (touched.title && !formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (
      formData.type === GOAL_TYPES.TEAM &&
      touched.projectId &&
      !formData.projectId
    ) {
      newErrors.projectId = "Project is required for team goals";
    }

    if (touched.deadline) {
      if (!formData.deadline) {
        newErrors.deadline = "Deadline is required";
      } else {
        const deadlineDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deadlineDate < today) {
          newErrors.deadline = "Deadline must be in the future";
        }
      }
    }

    if (
      formData.type === GOAL_TYPES.TEAM &&
      touched.assignees &&
      formData.assignees.length === 0
    ) {
      newErrors.assignees = "At least one team member must be assigned";
    }

    if (touched.checklist) {
      const hasValidChecklist = Object.values(
        formData.checklistByAssignee
      ).some((items) =>
        items.some(
          (item) => item.title && item.title.trim() && !item.isCompleted
        )
      );

      if (!hasValidChecklist) {
        newErrors.checklist =
          "At least one uncompleted checklist item is required";
      }

      if (formData.type === GOAL_TYPES.TEAM) {
        const invalidAssignees = Object.keys(
          formData.checklistByAssignee
        ).filter(
          (assigneeId) => !formData.assignees.includes(parseInt(assigneeId))
        );

        if (invalidAssignees.length > 0) {
          newErrors.checklist =
            "All checklist items must be assigned to selected team members";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "type") {
        setErrors({});
        setTouched({
          title: false,
          deadline: false,
          assignees: false,
          checklist: false,
          projectId: false,
        });
        setAvailableEmployees([]);
        setAssigneeSearchTerm("");

        if (value === GOAL_TYPES.SELF) {
          updated.assignees = [];
          updated.projectId = "";
          updated.checklistByAssignee = {
            [user.empMasterId]: [
              { title: "", description: "" },
              { title: "", description: "" },
              { title: "", description: "" },
            ],
          };
        } else if (value === GOAL_TYPES.TEAM) {
          updated.checklistByAssignee = {};
          updated.assignees = [];
          updated.projectId = "";
        } else if (value === GOAL_TYPES.ORG) {
          updated.projectId = "";
          updated.assignees = [];
          updated.checklistByAssignee = {
            [user.empMasterId]: [
              { title: "", description: "" },
              { title: "", description: "" },
              { title: "", description: "" },
            ],
          };
        }
      }

      if (field === "projectId" && formData.type === GOAL_TYPES.TEAM) {
        updated.assignees = [];
        updated.checklistByAssignee = {};
        setAvailableEmployees([]);
        setAssigneeSearchTerm("");
      }

      return updated;
    });
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleAssigneeToggle = (empMasterId) => {
    setFormData((prev) => {
      const isSelected = prev.assignees.includes(empMasterId);
      const newAssignees = isSelected
        ? prev.assignees.filter((id) => id !== empMasterId)
        : [...prev.assignees, empMasterId];

      const newChecklistByAssignee = { ...prev.checklistByAssignee };

      if (!isSelected) {
        newChecklistByAssignee[empMasterId] = [
          { title: "", description: "" },
          { title: "", description: "" },
          { title: "", description: "" },
        ];
        const emp = availableEmployees.find(
          (e) => e.empMasterId === empMasterId
        );
        if (emp) {
          toast.success(`${emp.fullName} added as an assignee.`, {
            duration: 2000,
          });
        }
      } else {
        delete newChecklistByAssignee[empMasterId];
        const emp = availableEmployees.find(
          (e) => e.empMasterId === empMasterId
        );
        if (emp) {
          toast.info(`${emp.fullName} removed from assignees.`, {
            duration: 2000,
          });
        }
      }

      return {
        ...prev,
        assignees: newAssignees,
        checklistByAssignee: newChecklistByAssignee,
      };
    });
    setTouched((prev) => ({ ...prev, assignees: true }));
  };

  const addChecklistItem = (assigneeId) => {
    setFormData((prev) => ({
      ...prev,
      checklistByAssignee: {
        ...prev.checklistByAssignee,
        [assigneeId]: [
          ...prev.checklistByAssignee[assigneeId],
          { title: "", description: "" },
        ],
      },
    }));
    toast.success("Checklist item added.", { duration: 2000 });
  };

  const removeChecklistItem = (assigneeId, index) => {
    setFormData((prev) => ({
      ...prev,
      checklistByAssignee: {
        ...prev.checklistByAssignee,
        [assigneeId]: prev.checklistByAssignee[assigneeId].filter(
          (_, i) => i !== index
        ),
      },
    }));
    toast.info("Checklist item removed", { duration: 2000 });
  };

  const updateChecklistItem = (assigneeId, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      checklistByAssignee: {
        ...prev.checklistByAssignee,
        [assigneeId]: prev.checklistByAssignee[assigneeId].map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
    setTouched((prev) => ({ ...prev, checklist: true }));
  };

  const transformToBackendFormat = () => {
    const checklist = Object.entries(formData.checklistByAssignee).flatMap(
      ([assigneeId, items]) => {
        return items
          .filter((item) => {
            if (item.id && completedChecklistIds.has(item.id)) {
              return false;
            }

            if (!item.title || !item.title.trim()) {
              return false;
            }

            return true;
          })
          .map((item) => ({
            title: item.title.trim(),
            description: item.description?.trim() || "",
            isShared: false,
            addedForEmployeeMasterId: parseInt(assigneeId),
          }));
      }
    );

    if (isEdit) {
      return {
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        deadline: formData.deadline,
        checklist: checklist,
      };
    }

    return {
      goalType: formData.type,
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
      assignedToEmployeeMasterIds: formData.assignees,
      title: formData.title.trim(),
      description: formData.description?.trim() || "",
      checklist: checklist,
      deadline: formData.deadline,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      title: true,
      deadline: true,
      assignees: true,
      checklist: true,
      projectId: true,
    });

    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fix the errors before submitting",
        duration: 4000,
      });
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const payload = transformToBackendFormat();

      if (isEdit) {
        await goalService.updateGoal(goalData.goalId, payload);
        toast.success("Goal Updated Successfully!", {
          duration: 3000,
        });
      } else {
        await goalService.createGoal(payload);
        toast.success("Goal Saved Successfully!", {
          duration: 3000,
        });
      }

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.response?.data?.title ||
        (isEdit ? "Failed to update goal" : "Failed to create goal");

      toast.error(isEdit ? "Update Failed" : "Creation Failed", {
        description: errorMessage,
        duration: 5000,
      });
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = availableEmployees.filter((emp) =>
    emp.fullName?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
  );

  // Get display text for selected values
  const getSelectedTypeLabel = () => {
    return GOAL_TYPE_LABELS[formData.type] || "Select Goal Type";
  };

  const getSelectedProjectLabel = () => {
    if (!formData.projectId) {
      return formData.type === GOAL_TYPES.TEAM
        ? "Select a Project"
        : formData.type === GOAL_TYPES.ORG
        ? "Not applicable"
        : "No Project";
    }
    const project = projects.find(
      (p) => p.projectId === parseInt(formData.projectId)
    );
    return project ? project.projectName : "Select Project";
  };

  // Goal type options
  const goalTypeOptions = [
    { value: GOAL_TYPES.SELF, label: GOAL_TYPE_LABELS[GOAL_TYPES.SELF] },
    ...(canSelectTeamType
      ? [{ value: GOAL_TYPES.TEAM, label: GOAL_TYPE_LABELS[GOAL_TYPES.TEAM] }]
      : []),
    ...(canSelectOrgType
      ? [{ value: GOAL_TYPES.ORG, label: GOAL_TYPE_LABELS[GOAL_TYPES.ORG] }]
      : []),
  ];

  return !isOpen ? null : (
    <>
      <div
        className={styles.modalBackdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div className={styles.modalWrapper} tabIndex="-1">
        <div className={styles.modalDialog}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5 className={styles.modalTitle}>
                {isEdit ? "Edit Goal" : "Create New Goal"}
              </h5>
              <button
                type="button"
                className={styles.btnClose}
                onClick={onClose}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.color = "red";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.color = "white";
                }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className={styles.modalBody} ref={modalBodyRef}>
              {loadingData ? (
                <div className={styles.loadingData}>
                  <div className={styles.spinnerBorder} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading goal data...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Goal Type & Title */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className={styles.formLabel}>
                          Goal Type <span className={styles.textDanger}>*</span>
                        </label>
                        <div
                          ref={typeDropdownRef}
                          style={{ position: "relative" }}
                        >
                          <button
                            type="button"
                            className={`${styles.customDropdownToggle} ${
                              errors.type ? styles.formControlIsInvalid : ""
                            }`}
                            onClick={
                              !isEdit && !loading
                                ? () => setShowTypeDropdown(!showTypeDropdown)
                                : undefined
                            }
                            disabled={isEdit || loading}
                          >
                            <span>{getSelectedTypeLabel()}</span>
                            <i
                              className={`bi bi-chevron-${
                                showTypeDropdown ? "up" : "down"
                              }`}
                            />
                          </button>
                          {showTypeDropdown && !isEdit && (
                            <div className={styles.customDropdownMenu}>
                              {goalTypeOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`${styles.customDropdownItem} ${
                                    formData.type === option.value
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() => {
                                    handleChange("type", option.value);
                                    setShowTypeDropdown(false);
                                  }}
                                >
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {isEdit && (
                          <small className="text-muted">
                            Goal type cannot be changed
                          </small>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className={styles.formLabel}>
                          Title <span className={styles.textDanger}>*</span>
                        </label>
                        <input
                          type="text"
                          className={`${styles.formControl} ${
                            errors.title ? styles.formControlIsInvalid : ""
                          }`}
                          value={formData.title}
                          onChange={(e) =>
                            handleChange("title", e.target.value)
                          }
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, title: true }))
                          }
                          placeholder="Enter goal title"
                          disabled={isEdit || loading}
                          style={{ fontSize: "14px", maxLength: 200 }}
                        />
                        {isEdit && (
                          <small className="text-muted">
                            Goal title cannot be changed
                          </small>
                        )}
                        {errors.title && (
                          <div className={styles.invalidFeedback}>
                            {errors.title}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project & Deadline */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className={styles.formLabel}>
                          Project{" "}
                          {formData.type === GOAL_TYPES.TEAM && (
                            <span className={styles.textDanger}>*</span>
                          )}
                        </label>
                        <div
                          ref={projectDropdownRef}
                          style={{ position: "relative" }}
                        >
                          <button
                            type="button"
                            className={`${styles.customDropdownToggle} ${
                              errors.projectId
                                ? styles.formControlIsInvalid
                                : ""
                            }`}
                            onClick={
                              !isEdit &&
                              !loading &&
                              formData.type !== GOAL_TYPES.ORG
                                ? () =>
                                    setShowProjectDropdown(!showProjectDropdown)
                                : undefined
                            }
                            disabled={
                              isEdit ||
                              loading ||
                              formData.type === GOAL_TYPES.ORG
                            }
                          >
                            <span>{getSelectedProjectLabel()}</span>
                            <i
                              className={`bi bi-chevron-${
                                showProjectDropdown ? "up" : "down"
                              }`}
                            />
                          </button>
                          {showProjectDropdown &&
                            !isEdit &&
                            formData.type !== GOAL_TYPES.ORG && (
                              <div className={styles.customDropdownMenu}>
                                <div
                                  className={`${styles.customDropdownItem} ${
                                    !formData.projectId ? styles.selected : ""
                                  }`}
                                  onClick={() => {
                                    handleChange("projectId", "");
                                    setShowProjectDropdown(false);
                                  }}
                                >
                                  {formData.type === GOAL_TYPES.TEAM
                                    ? "Select a Project"
                                    : "No Project"}
                                </div>
                                {projects.map((project) => (
                                  <div
                                    key={project.projectId}
                                    className={`${styles.customDropdownItem} ${
                                      formData.projectId == project.projectId
                                        ? styles.selected
                                        : ""
                                    }`}
                                    onClick={() => {
                                      handleChange(
                                        "projectId",
                                        project.projectId
                                      );
                                      setShowProjectDropdown(false);
                                    }}
                                  >
                                    {project.projectName}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        {errors.projectId && (
                          <div className={styles.invalidFeedback}>
                            {errors.projectId}
                          </div>
                        )}
                        {isEdit && (
                          <small className="text-muted">
                            Project cannot be changed
                          </small>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className={styles.formLabel}>
                          Deadline <span className={styles.textDanger}>*</span>
                        </label>
                        <input
                          type="date"
                          className={`${styles.formControl} ${
                            errors.deadline ? styles.formControlIsInvalid : ""
                          }`}
                          value={formData.deadline}
                          onChange={(e) =>
                            handleChange("deadline", e.target.value)
                          }
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, deadline: true }))
                          }
                          min={new Date().toISOString().split("T")[0]}
                          max={
                            new Date(new Date().getFullYear() + 1, 3, 1)
                              .toISOString()
                              .split("T")[0]
                          }
                          disabled={
                            loading ||
                            (isEdit && formData.type !== GOAL_TYPES.ORG)
                          }
                        />
                        {isEdit && formData.type !== GOAL_TYPES.ORG && (
                          <small className="text-muted">
                            Deadline cannot be changed for{" "}
                            {GOAL_TYPE_LABELS[formData.type]} goals
                          </small>
                        )}
                        {errors.deadline && (
                          <div className={styles.invalidFeedback}>
                            {errors.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      className={styles.formControl}
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Enter goal description (optional)"
                      disabled={loading}
                      maxLength={1000}
                      style={{
                        resize: "vertical",
                        height: "80px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  {/* Team Members Section */}
                  {formData.type === GOAL_TYPES.TEAM && (
                    <div className="mb-3" ref={assigneeDropdownRef}>
                      <label className={styles.formLabel}>
                        Team Members{" "}
                        <span className={styles.textDanger}>*</span>
                      </label>
                      {!formData.projectId && !isEdit ? (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2" />
                          Please select a project first to load team members
                        </div>
                      ) : (
                        <>
                          <div className={styles.inputGroup}>
                            <input
                              type="text"
                              className={`${styles.formControl} ${
                                errors.assignees
                                  ? styles.formControlIsInvalid
                                  : ""
                              }`}
                              placeholder="Search subordinates..."
                              value={assigneeSearchTerm}
                              onChange={(e) =>
                                setAssigneeSearchTerm(e.target.value)
                              }
                              onFocus={() => setShowAssigneeDropdown(true)}
                              disabled={isEdit || loading || loadingEmployees}
                            />
                          </div>
                          {errors.assignees && (
                            <div className={styles.invalidFeedback}>
                              {errors.assignees}
                            </div>
                          )}
                          {isEdit && (
                            <small className="text-muted d-block mt-1">
                              Team members cannot be changed
                            </small>
                          )}

                          {showAssigneeDropdown && !isEdit && (
                            <div
                              className="card mt-2"
                              style={{
                                maxHeight: "200px",
                                overflowY: "auto",
                                textAlign: "left",
                              }}
                            >
                              <div
                                className={styles.listGroup}
                                style={{ listGroup: "list-group-flush" }}
                              >
                                {loadingEmployees ? (
                                  <div className="text-center py-3">
                                    <div
                                      className={`${styles.spinnerBorder} spinner-border-sm text-primary`}
                                      role="status"
                                    >
                                      <span className="visually-hidden">
                                        Loading...
                                      </span>
                                    </div>
                                  </div>
                                ) : filteredEmployees.length === 0 ? (
                                  <div className="list-group-item text-muted text-center">
                                    No subordinates found in this project
                                  </div>
                                ) : (
                                  filteredEmployees.map((emp) => (
                                    <div
                                      key={emp.empMasterId}
                                      className={`${styles.listGroupItem} list-group-item-action`}
                                      onClick={() =>
                                        handleAssigneeToggle(emp.empMasterId)
                                      }
                                      style={{ cursor: "pointer" }}
                                    >
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={formData.assignees.includes(
                                            emp.empMasterId
                                          )}
                                          onChange={() =>
                                            handleAssigneeToggle(
                                              emp.empMasterId
                                            )
                                          }
                                        />
                                        <label
                                          className="form-check-label"
                                          style={{
                                            paddingLeft: "20px",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {emp.fullName}
                                        </label>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {formData.assignees.length > 0 && (
                        <>
                          <div className="mt-2">
                            <small className="text-muted">
                              Selected ({formData.assignees.length})
                            </small>
                          </div>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {formData.assignees.map((empId) => {
                              const emp = availableEmployees.find(
                                (e) => e.empMasterId === empId
                              );
                              return emp ? (
                                <span
                                  key={empId}
                                  className={`${styles.badge} ${styles.badgePrimary}`}
                                >
                                  {emp.fullName}
                                  {!isEdit && (
                                    <i
                                      className="bi bi-x ms-1"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        handleAssigneeToggle(empId)
                                      }
                                    />
                                  )}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <hr />

                  {/* Checklist Section */}
                  <div className="mb-3">
                    <h5 className="mb-3">Checklist Items</h5>
                    {formData.type === GOAL_TYPES.TEAM &&
                    formData.assignees.length === 0 &&
                    !isEdit ? (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2" />
                        Select team members first to assign checklist items
                      </div>
                    ) : (
                      Object.entries(formData.checklistByAssignee).map(
                        ([assigneeId, items]) => {
                          const assignee = availableEmployees.find(
                            (emp) => emp.empMasterId === parseInt(assigneeId)
                          );
                          const assigneeName =
                            assigneeId === String(user.empMasterId)
                              ? "Your Checklist"
                              : assignee?.fullName || "Tasks Checklist";

                          return (
                            <div key={assigneeId} className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label
                                  className="form-label mb-0"
                                  style={{ fontSize: "14px", fontWeight: 700 }}
                                >
                                  <i className="bi bi-person-badge me-2" />
                                  {assigneeName}
                                </label>
                                {items.length < 10 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => addChecklistItem(assigneeId)}
                                    disabled={loading}
                                    style={{ fontSize: "15px" }}
                                    title="Add checklist item"
                                  >
                                    <i className="bi bi-clipboard2-plus m-1" />
                                  </button>
                                )}
                              </div>

                              {items.map((item, index) => {
                                const isItemCompleted =
                                  item.id && completedChecklistIds.has(item.id);
                                const isExistingItem = !!item.id;

                                return (
                                  <div
                                    key={index}
                                    className={`${styles.card} mb-2`}
                                    style={{
                                      border: "1px solid #dee2e6",
                                      opacity: isItemCompleted ? 0.6 : 1,
                                      backgroundColor: isItemCompleted
                                        ? "#f8f9fa"
                                        : "#fff",
                                    }}
                                  >
                                    <div className={styles.cardBody}>
                                      {isItemCompleted && (
                                        <div
                                          className="alert alert-warning py-1 mb-2"
                                          style={{ fontSize: "0.75rem" }}
                                        >
                                          <i className="bi bi-lock-fill me-1" />
                                          Completed - Cannot edit
                                        </div>
                                      )}

                                      <div className="mb-2">
                                        <label
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            display: "block",
                                            textAlign: "left",
                                            marginBottom: "0.25rem",
                                          }}
                                        >
                                          Title{" "}
                                          <span style={{ color: "#dc3545" }}>
                                            *
                                          </span>
                                        </label>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Enter task title"
                                            value={item.title}
                                            onChange={(e) =>
                                              updateChecklistItem(
                                                assigneeId,
                                                index,
                                                "title",
                                                e.target.value
                                              )
                                            }
                                            disabled={
                                              loading ||
                                              isItemCompleted ||
                                              (isEdit && isExistingItem)
                                            }
                                            required
                                            maxLength={200}
                                            style={{
                                              fontSize: "14px",
                                              backgroundColor:
                                                isItemCompleted ||
                                                (isEdit && isExistingItem)
                                                  ? "#e9ecef"
                                                  : "#fff",
                                              cursor:
                                                isItemCompleted ||
                                                (isEdit && isExistingItem)
                                                  ? "not-allowed"
                                                  : "text",
                                            }}
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() =>
                                              removeChecklistItem(
                                                assigneeId,
                                                index
                                              )
                                            }
                                            disabled={
                                              loading ||
                                              isItemCompleted ||
                                              items.length === 1
                                            }
                                            title={
                                              isItemCompleted
                                                ? "Cannot remove completed items"
                                                : items.length === 1
                                                ? "At least one item required"
                                                : "Remove item"
                                            }
                                          >
                                            <i className="bi bi-trash" />
                                          </button>
                                        </div>
                                        {isEdit &&
                                          isExistingItem &&
                                          !isItemCompleted && (
                                            <small className="text-muted d-block mt-1">
                                              <i className="bi bi-lock-fill me-1" />
                                              Title cannot be edited
                                            </small>
                                          )}
                                      </div>

                                      <label
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: 700,
                                          display: "block",
                                          textAlign: "left",
                                          marginBottom: "0.25rem",
                                        }}
                                      >
                                        Description (Optional)
                                      </label>
                                      <textarea
                                        className="form-control form-control-sm"
                                        rows={2}
                                        placeholder="Enter optional description"
                                        value={item.description}
                                        onChange={(e) =>
                                          updateChecklistItem(
                                            assigneeId,
                                            index,
                                            "description",
                                            e.target.value
                                          )
                                        }
                                        disabled={loading || isItemCompleted}
                                        style={{
                                          fontSize: "14px",
                                          resize: "vertical",
                                          minHeight: "80px",
                                          backgroundColor: isItemCompleted
                                            ? "#e9ecef"
                                            : "#fff",
                                          cursor: isItemCompleted
                                            ? "not-allowed"
                                            : "text",
                                        }}
                                        maxLength={500}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      )
                    )}
                    {errors.checklist && (
                      <div className="text-danger small">
                        {errors.checklist}
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  loadingData ||
                  Object.keys(errors).length > 0 ||
                  !formData.title.trim() ||
                  !formData.deadline ||
                  (formData.type === GOAL_TYPES.TEAM &&
                    formData.assignees.length === 0) ||
                  (formData.type === GOAL_TYPES.TEAM && !formData.projectId) ||
                  getFilledChecklistCount() < 3
                }
                style={{
                  background:
                    "linear-gradient(90deg, #97247e 0%, #e01950 100%)",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className={`${styles.spinnerBorder} spinner-border-sm me-2`}
                    />
                    {isEdit ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <i
                      className={`bi ${
                        isEdit ? "bi-check-circle" : "bi-plus-circle"
                      } me-2`}
                    />
                    {isEdit ? "Update Goal" : "Save Goal"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default GoalFormModal;
