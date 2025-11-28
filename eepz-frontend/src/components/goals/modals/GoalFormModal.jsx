import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/auth/AuthContext";
import goalService from "../../../services/goals/goalService";
import Alert from "../common/Alert";
import {
  GOAL_TYPES,
  GOAL_TYPE_LABELS,
} from "../../../constants/goals/goalConstants";

const GoalFormModal = ({ isOpen, onClose, goalData = null, onSuccess }) => {
  const { user } = useAuth();
  const isEdit = !!goalData;
  const modalBodyRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
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
    setAlert(null);
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
          setAlert({
            type: "warning",
            message: `⚠️ ${completedIds.size} checklist item(s) are completed and locked. You must uncomplete them before editing.`,
          });
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
      setAlert({
        type: "danger",
        message: "Failed to load form data",
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
      setAlert({
        type: "warning",
        message:
          "Failed to load team members. Please try selecting the project again.",
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
        setAlert(null);
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
          // Clear project for org goals
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
      } else {
        delete newChecklistByAssignee[empMasterId];
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
      setAlert({
        type: "danger",
        message: "Please fix the validation errors before submitting",
      });
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const payload = transformToBackendFormat();

      if (isEdit) {
        await goalService.updateGoal(goalData.goalId, payload);
        setAlert({
          type: "success",
          message: "Goal updated successfully!",
        });
      } else {
        await goalService.createGoal(payload);
        setAlert({
          type: "success",
          message: "Goal created successfully!",
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

      setAlert({
        type: "danger",
        message: errorMessage,
      });
      modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = availableEmployees.filter((emp) =>
    emp.fullName?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .form-select {
            appearance: auto;
            -webkit-appearance: auto;
            -moz-appearance: auto;
            text-align: left;
          }

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

      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          style={{ borderRadius: "1.5rem" }}
        >
          <div
            className="modal-content"
            style={{ minWidth: "1000px", animation: "slideUp 0.3s ease-out" }}
          >
            <div
              className="modal-header"
              style={{
                backgroundColor: "rgb(39, 35, 92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5
                className="modal-title"
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "white",
                }}
              >
                {isEdit ? "Edit Goal" : "Create New Goal"}
              </h5>
              <button
                type="button"
                className="btn-close-white"
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

            <div
              className="modal-body"
              ref={modalBodyRef}
              style={{
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {alert && (
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              )}

              {loadingData ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading goal data...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{ fontSize: "14px", fontWeight: 700 }}
                        >
                          Goal Type <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={formData.type}
                          onChange={(e) => handleChange("type", e.target.value)}
                          style={{ fontSize: "14px" }}
                          disabled={isEdit || loading}
                        >
                          <option value={GOAL_TYPES.SELF}>
                            {GOAL_TYPE_LABELS[GOAL_TYPES.SELF]}
                          </option>
                          {canSelectTeamType && (
                            <option value={GOAL_TYPES.TEAM}>
                              {GOAL_TYPE_LABELS[GOAL_TYPES.TEAM]}
                            </option>
                          )}
                          {canSelectOrgType && (
                            <option value={GOAL_TYPES.ORG}>
                              {GOAL_TYPE_LABELS[GOAL_TYPES.ORG]}
                            </option>
                          )}
                        </select>
                        {isEdit && (
                          <small className="text-muted">
                            Goal type cannot be changed
                          </small>
                        )}
                      </div>

                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{ fontSize: "14px", fontWeight: 700 }}
                        >
                          Title <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.title ? "is-invalid" : ""
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
                          style={{ fontSize: "14px" }}
                          maxLength={200}
                        />
                        {isEdit && (
                          <small className="text-muted">
                            Goal title cannot be changed
                          </small>
                        )}
                        {errors.title && (
                          <div className="invalid-feedback">{errors.title}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      {/* Disable project for org goals */}
                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{ fontSize: "14px", fontWeight: 700 }}
                        >
                          Project
                          {formData.type === GOAL_TYPES.TEAM && (
                            <span className="text-danger">*</span>
                          )}
                        </label>
                        <select
                          className={`form-select ${
                            errors.projectId ? "is-invalid" : ""
                          }`}
                          value={formData.projectId}
                          onChange={(e) =>
                            handleChange("projectId", e.target.value)
                          }
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, projectId: true }))
                          }
                          disabled={
                            isEdit ||
                            loading ||
                            formData.type === GOAL_TYPES.ORG // Disable for org goals
                          }
                          style={{ fontSize: "14px" }}
                        >
                          <option value="">
                            {formData.type === GOAL_TYPES.TEAM
                              ? "Select a Project"
                              : formData.type === GOAL_TYPES.ORG
                              ? "Not applicable for Organization Goals"
                              : "No Project"}
                          </option>
                          {formData.type !== GOAL_TYPES.ORG &&
                            projects.map((project) => (
                              <option
                                key={project.projectId}
                                value={project.projectId}
                              >
                                {project.projectName}
                              </option>
                            ))}
                        </select>
                        {errors.projectId && (
                          <div className="invalid-feedback">
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
                        <label
                          className="form-label"
                          style={{ fontSize: "14px", fontWeight: 700 }}
                        >
                          Deadline <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control ${
                            errors.deadline ? "is-invalid" : ""
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
                          // Disable deadline editing for non-org goals
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
                          <div className="invalid-feedback">
                            {errors.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{ fontSize: "14px", fontWeight: 700 }}
                    >
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
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

                  {formData.type === GOAL_TYPES.TEAM && (
                    <div className="mb-3" ref={assigneeDropdownRef}>
                      <label
                        className="form-label"
                        style={{ fontSize: "14px", fontWeight: 700 }}
                      >
                        Team Members <span className="text-danger">*</span>
                      </label>
                      {!formData.projectId && !isEdit ? (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          Please select a project first to load team members
                        </div>
                      ) : (
                        <>
                          <div className="input-group">
                            <input
                              type="text"
                              className={`form-control ${
                                errors.assignees ? "is-invalid" : ""
                              }`}
                              placeholder="Search subordinates..."
                              value={assigneeSearchTerm}
                              onChange={(e) =>
                                setAssigneeSearchTerm(e.target.value)
                              }
                              onFocus={() => setShowAssigneeDropdown(true)}
                              disabled={isEdit || loading || loadingEmployees}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setShowAssigneeDropdown(!showAssigneeDropdown)
                              }
                              disabled={isEdit || loading || loadingEmployees}
                            >
                              <i className="bi bi-chevron-down"></i>
                            </button>
                          </div>
                          {errors.assignees && (
                            <div className="invalid-feedback d-block">
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
                              <div className="list-group list-group-flush">
                                {loadingEmployees ? (
                                  <div className="text-center py-3">
                                    <div
                                      className="spinner-border spinner-border-sm text-primary"
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
                                      className="list-group-item list-group-item-action"
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

                          {formData.assignees.length > 0 && (
                            <div className="mt-2">
                              <small className="text-muted">
                                Selected ({formData.assignees.length}):
                              </small>
                              <div className="d-flex flex-wrap gap-1 mt-1">
                                {formData.assignees.map((empId) => {
                                  const emp = availableEmployees.find(
                                    (e) => e.empMasterId === empId
                                  );
                                  return emp ? (
                                    <span
                                      key={empId}
                                      className="badge bg-primary"
                                    >
                                      {emp.fullName}
                                      {!isEdit && (
                                        <i
                                          className="bi bi-x ms-1"
                                          style={{ cursor: "pointer" }}
                                          onClick={() =>
                                            handleAssigneeToggle(empId)
                                          }
                                        ></i>
                                      )}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <hr />

                  {/* Checklist section */}
                  <div className="mb-3">
                    <h5 className="mb-3">
                      Checklist Items
                      {formData.type === GOAL_TYPES.TEAM && (
                        <small className="text-muted ms-2">
                          (Each team member will have their own tasks)
                        </small>
                      )}
                    </h5>

                    {formData.type === GOAL_TYPES.TEAM &&
                    formData.assignees.length === 0 &&
                    !isEdit ? (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
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
                              : assignee
                              ? `${assignee.fullName}'s Tasks`
                              : "Checklist";

                          return (
                            <div key={assigneeId} className="mb-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label
                                  className="form-label mb-0"
                                  style={{ fontSize: "14px", fontWeight: 700 }}
                                >
                                  <i className="bi bi-person-badge me-2"></i>
                                  {assigneeName}
                                </label>
                                {/* Can still add items in edit mode */}
                                {items.length < 10 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => addChecklistItem(assigneeId)}
                                    disabled={loading}
                                    style={{ fontSize: "15px" }}
                                    title="Add checklist item"
                                  >
                                    <i className="bi bi-clipboard2-plus m-1"></i>
                                  </button>
                                )}
                              </div>

                              {items.map((item, index) => {
                                const isItemCompleted =
                                  item.id && completedChecklistIds.has(item.id);
                                // Check if item has existing ID (from DB)
                                const isExistingItem = !!item.id;

                                return (
                                  <div
                                    key={index}
                                    className="card mb-2"
                                    style={{
                                      border: "1px solid #dee2e6",
                                      opacity: isItemCompleted ? 0.6 : 1,
                                      backgroundColor: isItemCompleted
                                        ? "#f8f9fa"
                                        : "#fff",
                                    }}
                                  >
                                    <div
                                      className="card-body"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      {isItemCompleted && (
                                        <div
                                          className="alert alert-warning py-1 mb-2"
                                          style={{ fontSize: "0.75rem" }}
                                        >
                                          <i className="bi bi-lock-fill me-1"></i>
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
                                            // Disable title editing for existing items in edit mode
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
                                          {/* Show info message for locked titles */}
                                          {isEdit &&
                                            isExistingItem &&
                                            !isItemCompleted && (
                                              <small className="text-muted d-block mt-1">
                                                <i className="bi bi-lock-fill me-1"></i>
                                                Title cannot be edited
                                              </small>
                                            )}
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
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      </div>

                                      <div>
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
                                          rows="2"
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
                                          // Description can still be edited
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

            <div className="modal-footer">
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
                style={{
                  background:
                    "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                  border: "none",
                }}
                disabled={
                  loading ||
                  loadingData ||
                  Object.keys(errors).length > 0 ||
                  !formData.title.trim() ||
                  !formData.deadline ||
                  (formData.type === GOAL_TYPES.TEAM &&
                    formData.assignees.length === 0) ||
                  (formData.type === GOAL_TYPES.TEAM && !formData.projectId) ||
                  getFilledChecklistCount() < 3 // CHANGED: At least 3 items
                }
                title={
                  Object.keys(errors).length > 0
                    ? "Please fix validation errors"
                    : !formData.title.trim()
                    ? "Goal title is required"
                    : !formData.deadline
                    ? "Deadline is required"
                    : formData.type === GOAL_TYPES.TEAM && !formData.projectId
                    ? "Project is required for team goals"
                    : formData.type === GOAL_TYPES.TEAM &&
                      formData.assignees.length === 0
                    ? "At least one team member must be assigned"
                    : getFilledChecklistCount() < 3
                    ? `At least 3 checklist items required (${getFilledChecklistCount()}/3)` // CHANGED
                    : ""
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {isEdit ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <i
                      className={`bi ${
                        isEdit ? "bi-check-circle" : "bi-plus-circle"
                      } me-2`}
                    ></i>
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
