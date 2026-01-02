import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  Target,
  Users,
  Loader,
  Star,
  Home,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  orgGoalFeedbackApi,
  peerQueueApi,
  employeeApi,
  goalsApi,
} from "../../../services/feedbackmanagement/feedbackApi";
import "../../../styles/feedback/components/SubmitContextFeedback.css";

const PRIMARY = "#27235C";

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="scf-dropdown-wrapper">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`scf-dropdown-select ${isOpen ? "scf-dropdown-select--open" : ""}`}
        disabled={disabled}
      >
        <span className="scf-dropdown-value">{displayLabel}</span>
        <span className={`scf-dropdown-arrow ${isOpen ? "scf-dropdown-arrow--open" : ""}`}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <polyline
              points="6 9 12 15 18 9"
              fill="none"
              stroke={PRIMARY}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <ul className="scf-dropdown-list">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                className={`scf-dropdown-option ${
                  isSelected ? "scf-dropdown-option--selected" : ""
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const getRolePaths = (roleName) => {
  switch (roleName) {
    case "Manager":
      return {
        baseDashboard: "/manager/dashboard",
        feedbackDashboard: "/manager/dashboard/feedback",
        baseLabel: "Manager Dashboard",
      };
    case "HR":
      return {
        baseDashboard: "/hr/dashboard",
        feedbackDashboard: "/hr/dashboard/feedback",
        baseLabel: "HR Dashboard",
      };
    case "DepartmentHead":
    case "Department Head":
      return {
        baseDashboard: "/depthead/dashboard",
        feedbackDashboard: "/depthead/dashboard/feedback",
        baseLabel: "Department Head Dashboard",
      };
    default:
      return {
        baseDashboard: "/employee/dashboard",
        feedbackDashboard: "/employee/dashboard/feedback",
        baseLabel: "Dashboard",
      };
  }
};

export default function SubmitContextFeedback() {
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const { baseDashboard, feedbackDashboard, baseLabel } = useMemo(
    () => getRolePaths(user?.roleName),
    [user?.roleName]
  );

  const [activeTab, setActiveTab] = useState("goal");
  const [goalForm, setGoalForm] = useState({
    organizationObjectiveId: "",
    objectiveTitle: "",
    rating: 4,
    feedbackComments: "",
    isAnonymous: false,
  });
  const [contextForm, setContextForm] = useState({
    recipientEmployeeId: "",
    recipientName: "",
    projectContext: "",
    feedbackContent: "",
    isAnonymous: false,
  });
  const [objectives, setObjectives] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setError("");

        try {
          const goalsResponse = await goalsApi.getOrganizationLevel();
          let goalsList = [];
          if (Array.isArray(goalsResponse.data)) {
            goalsList = goalsResponse.data;
          } else if (
            goalsResponse.data?.data &&
            Array.isArray(goalsResponse.data.data)
          ) {
            goalsList = goalsResponse.data.data;
          } else if (
            goalsResponse.data?.$values &&
            Array.isArray(goalsResponse.data.$values)
          ) {
            goalsList = goalsResponse.data.$values;
          }
          setObjectives(goalsList);
        } catch (goalsError) {
          console.error("Failed to fetch goals:", goalsError);
          setObjectives([]);
        }

        try {
          const empResponse = await employeeApi.getAll();
          const employeesList = Array.isArray(empResponse.data)
            ? empResponse.data
            : empResponse.data?.data || empResponse.data?.$values || [];
          setEmployees(employeesList);
        } catch (empError) {
          console.error("Failed to fetch employees:", empError);
          setError("Failed to load employees. Please refresh the page.");
          setEmployees([]);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleObjectiveChange = (selectedIdStr) => {
    const selectedId = Number(selectedIdStr);
    const selectedObjective = objectives.find((obj) => {
      const objId = obj.goalId || obj.objectiveId || obj.id;
      return objId === selectedId;
    });

    setGoalForm((prev) => ({
      ...prev,
      organizationObjectiveId: selectedId,
      objectiveTitle:
        selectedObjective?.goalName ||
        selectedObjective?.title ||
        selectedObjective?.name ||
        selectedObjective?.goalTitle ||
        "",
    }));
  };

  const submitGoal = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setError("");

    if (!goalForm.organizationObjectiveId || !goalForm.feedbackComments?.trim()) {
      setError("Goal and comments are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        goalId: Number(goalForm.organizationObjectiveId),
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(user?.empId),
        rating: Number(goalForm.rating || 0),
        feedbackComments: goalForm.feedbackComments,
        isAnonymous: !!goalForm.isAnonymous,
      };

      await orgGoalFeedbackApi.create(payload);

      setSuccessMsg("Goal feedback submitted successfully!");
      setGoalForm({
        organizationObjectiveId: "",
        objectiveTitle: "",
        rating: 4,
        feedbackComments: "",
        isAnonymous: false,
      });
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Goal feedback submission error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit goal feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (selectedIdStr) => {
    const selectedId = Number(selectedIdStr);
    const selectedEmployee = employees.find(
      (emp) => emp.employeeId === selectedId
    );
    setContextForm((prev) => ({
      ...prev,
      recipientEmployeeId: selectedId,
      recipientName: selectedEmployee
        ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
        : "",
    }));
  };

  const submitContext = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setError("");

    if (
      !contextForm.recipientEmployeeId ||
      !contextForm.feedbackContent?.trim() ||
      !contextForm.projectContext?.trim()
    ) {
      setError("Recipient, project context, and feedback are required.");
      return;
    }

    setLoading(true);
    try {
      const contextPrefix = contextForm.projectContext
        ? `[${contextForm.projectContext}] `
        : "";

      const peerPayload = {
        submittedByEmployeeId: Number(user?.empId),
        recipientEmployeeId: Number(contextForm.recipientEmployeeId),
        feedbackContent: contextPrefix + contextForm.feedbackContent,
        isAnonymous: !!contextForm.isAnonymous,
      };

      const createResponse = await peerQueueApi.create(peerPayload);

      if (createResponse?.data?.success || createResponse?.success) {
        const queueId =
          createResponse.data?.data?.queueId || createResponse.data?.queueId;

        if (!queueId) {
          throw new Error("Queue ID not returned from server");
        }

        try {
          const approveResponse = await peerQueueApi.approve(queueId, {
            isProfessional: true,
            isRelevant: true,
            approvedByHRId: Number(user?.empId),
          });

          if (approveResponse?.success || approveResponse?.data?.success) {
            setSuccessMsg(
              `Context feedback submitted successfully for ${contextForm.recipientName}!`
            );
          } else {
            setSuccessMsg(
              `Context feedback submitted to ${contextForm.recipientName}, pending approval.`
            );
          }
        } catch (approveErr) {
          console.warn("Auto-approval failed, feedback queued:", approveErr);
          setSuccessMsg(
            `Context feedback submitted to ${contextForm.recipientName}, pending approval.`
          );
        }

        setContextForm({
          recipientEmployeeId: "",
          recipientName: "",
          projectContext: "",
          feedbackContent: "",
          isAnonymous: false,
        });
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setError(
          createResponse?.data?.message ||
            createResponse?.message ||
            "Failed to submit context feedback"
        );
      }
    } catch (err) {
      console.error("Context feedback submission error:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit context feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedObjective = objectives.find((obj) => {
    const objId = obj.goalId || obj.objectiveId || obj.id;
    return objId == goalForm.organizationObjectiveId;
  });

  const selectedEmployee = employees.find(
    (emp) => emp.employeeId == contextForm.recipientEmployeeId
  );

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          size={20}
          fill={starValue <= rating ? "#ffc107" : "none"}
          stroke={starValue <= rating ? "#ffc107" : "#cbd5e1"}
          strokeWidth={2}
          className="scf-star"
          onClick={() => setGoalForm({ ...goalForm, rating: starValue })}
        />
      );
    });
  };

  const getGoalDisplayName = (goal) => {
    return (
      goal.goalName ||
      goal.title ||
      goal.name ||
      goal.goalTitle ||
      goal.objectiveName ||
      `Untitled Goal`
    );
  };

  return (
    <div className="scf-container">
      <div className="scf-content">
        <nav className="scf-breadcrumb" aria-label="breadcrumb">
          <ol className="scf-breadcrumb-list">
          <li className="scf-breadcrumb-item">
  <Link
    to={baseDashboard}
    className="scf-breadcrumb-link"
    aria-label="Dashboard"
    title="Dashboard"
  >
    <Home size={18} className="scf-breadcrumb-icon" />
  </Link>
</li>

            <li className="scf-breadcrumb-separator">/</li>
            <li className="scf-breadcrumb-item">
              <Link to={feedbackDashboard} className="scf-breadcrumb-link">
                Feedback Management
              </Link>
            </li>
            <li className="scf-breadcrumb-separator">/</li>
            <li className="scf-breadcrumb-item scf-breadcrumb-active">
              <span>Submit Feedback</span>
            </li>
          </ol>
        </nav>

        {error && (
          <div className="scf-alert scf-alert-error">
            <AlertTriangle size={16} className="scf-alert-icon" />
            <div className="scf-alert-content">
              <p className="scf-alert-message">{error}</p>
            </div>
            <button
              type="button"
              className="scf-alert-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {successMsg && (
          <div className="scf-alert scf-alert-success">
            <CheckCircle size={16} className="scf-alert-icon" />
            <p className="scf-alert-message">{successMsg}</p>
            <button
              type="button"
              className="scf-alert-close"
              onClick={() => setSuccessMsg("")}
            >
              ×
            </button>
          </div>
        )}

        <div className="scf-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("goal")}
            className={`scf-tab-button ${
              activeTab === "goal" ? "scf-tab-button--active" : ""
            }`}
          >
            <Target size={16} />
            Goal Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("context")}
            className={`scf-tab-button ${
              activeTab === "context" ? "scf-tab-button--active" : ""
            }`}
          >
            <Users size={16} />
            Context Feedback
          </button>
        </div>

        {loadingData && (
          <div className="scf-card">
            <div className="scf-card-body scf-loading-state">
              <Loader size={40} className="scf-loader" />
              <p className="scf-loading-text">Loading data...</p>
            </div>
          </div>
        )}

        {!loadingData && activeTab === "goal" && (
          <div className="scf-card">
            <div className="scf-card-body">
              <form onSubmit={submitGoal}>
                <div className="scf-form-group">
                  <label className="scf-label">
                    Select Organization Goal <span className="scf-required">*</span>
                  </label>
                  <CustomSelect
                    id="goalSelect"
                    value={goalForm.organizationObjectiveId}
                    onChange={handleObjectiveChange}
                    disabled={false}
                    placeholder={
                      objectives.length === 0
                        ? "No organization goals available"
                        : "Choose a goal..."
                    }
                    options={objectives.map((obj) => {
                      const objId = obj.goalId || obj.objectiveId || obj.id;
                      return {
                        value: objId,
                        label: getGoalDisplayName(obj),
                      };
                    })}
                  />
                </div>

                {selectedObjective && (
                  <div className="scf-info-box">
                    <div className="scf-info-label">Goal Description</div>
                    <p className="scf-info-text">
                      {selectedObjective.description ||
                        selectedObjective.goalDescription ||
                        selectedObjective.objectiveDescription ||
                        "No description available"}
                    </p>
                  </div>
                )}

                <div className="scf-form-group">
                  <label className="scf-label">
                    Rating <span className="scf-required">*</span>
                  </label>
                  <div className="scf-rating-box">
                    <div className="scf-stars">{renderStars(goalForm.rating)}</div>
                    <span className="scf-rating-value">
                      {goalForm.rating}/5
                    </span>
                  </div>
                </div>

                <div className="scf-form-group">
                  <label className="scf-label">
                    Feedback Comments <span className="scf-required">*</span>
                  </label>
                  <textarea
                    className="scf-textarea"
                    rows={5}
                    value={goalForm.feedbackComments}
                    onChange={(e) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        feedbackComments: e.target.value,
                      }))
                    }
                    placeholder="Provide your detailed feedback on this goal..."
                    required
                    maxLength={1000}
                  />
                  <div className="scf-textarea-footer">
                    <span className="scf-textarea-hint">Be specific and constructive</span>
                    <span
                      className={`scf-textarea-count ${
                        goalForm.feedbackComments.length > 900
                          ? "scf-textarea-count--warning"
                          : ""
                      }`}
                    >
                      {goalForm.feedbackComments.length}/1000
                    </span>
                  </div>
                </div>

                <div className="scf-form-group">
                  <div className="scf-checkbox">
                    <input
                      className="scf-checkbox-input"
                      type="checkbox"
                      id="goalAnon"
                      checked={goalForm.isAnonymous}
                      onChange={(e) =>
                        setGoalForm((prev) => ({
                          ...prev,
                          isAnonymous: e.target.checked,
                        }))
                      }
                    />
                    <label className="scf-checkbox-label" htmlFor="goalAnon">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="scf-submit-button"
                  disabled={loading || !goalForm.organizationObjectiveId}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="scf-loader" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {!loadingData && activeTab === "context" && (
          <div className="scf-card">
            <div className="scf-card-body">
              <form onSubmit={submitContext}>
                <div className="scf-form-group">
                  <label className="scf-label">
                    Select Recipient <span className="scf-required">*</span>
                  </label>
                  <CustomSelect
                    id="recipientSelect"
                    value={contextForm.recipientEmployeeId}
                    onChange={handleEmployeeChange}
                    disabled={false}
                    placeholder={
                      employees.length === 0
                        ? "No employees available"
                        : "Choose a team member..."
                    }
                    options={employees.map((emp) => ({
                      value: emp.employeeId,
                      label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
                    }))}
                  />
                </div>

                {selectedEmployee && (
                  <div className="scf-info-box">
                    <div className="scf-info-label">Feedback for</div>
                    <div className="scf-employee-name">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <small className="scf-employee-email">
                      {selectedEmployee.email}
                    </small>
                  </div>
                )}

                <div className="scf-form-group">
                  <label className="scf-label">
                    Project Context <span className="scf-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="scf-input"
                    value={contextForm.projectContext}
                    onChange={(e) =>
                      setContextForm((prev) => ({
                        ...prev,
                        projectContext: e.target.value,
                      }))
                    }
                    placeholder="e.g., AI Platform Project, Q4 Sprint"
                    required
                  />
                </div>

                <div className="scf-form-group">
                  <label className="scf-label">
                    Feedback Content <span className="scf-required">*</span>
                  </label>
                  <textarea
                    className="scf-textarea"
                    rows={5}
                    value={contextForm.feedbackContent}
                    onChange={(e) =>
                      setContextForm((prev) => ({
                        ...prev,
                        feedbackContent: e.target.value,
                      }))
                    }
                    placeholder="Provide constructive feedback on their work, collaboration, or skills..."
                    required
                    maxLength={1000}
                  />
                  <div className="scf-textarea-footer">
                    <span className="scf-textarea-hint">Be specific and constructive</span>
                    <span
                      className={`scf-textarea-count ${
                        contextForm.feedbackContent.length > 900
                          ? "scf-textarea-count--warning"
                          : ""
                      }`}
                    >
                      {contextForm.feedbackContent.length}/1000
                    </span>
                  </div>
                </div>

                <div className="scf-form-group">
                  <div className="scf-checkbox">
                    <input
                      className="scf-checkbox-input"
                      type="checkbox"
                      id="contextAnon"
                      checked={contextForm.isAnonymous}
                      onChange={(e) =>
                        setContextForm((prev) => ({
                          ...prev,
                          isAnonymous: e.target.checked,
                        }))
                      }
                    />
                    <label className="scf-checkbox-label" htmlFor="contextAnon">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="scf-submit-button"
                  disabled={
                    loading ||
                    !contextForm.recipientEmployeeId ||
                    !contextForm.projectContext
                  }
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="scf-loader" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
