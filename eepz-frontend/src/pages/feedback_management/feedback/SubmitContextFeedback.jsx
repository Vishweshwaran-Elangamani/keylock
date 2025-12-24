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

const PRIMARY = "#27235C";

/** Reusable custom dropdown */
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
    <div className="ctx-dropdown-wrapper">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`ctx-dropdown-select ${isOpen ? "open" : ""}`}
        disabled={disabled}
      >
        <span className="ctx-dropdown-value">{displayLabel}</span>
        <span className="ctx-dropdown-arrow">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              display: "block",
            }}
          >
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
        <ul className="ctx-dropdown-list">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li
                key={opt.value}
                className={`ctx-dropdown-option ${
                  isSelected ? "selected" : ""
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

// Helper to get role-based base dashboard + feedback paths
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
      // Employee fallback
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

        // Goals
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

        // Employees
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

  // Handle goal selection
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

  // Handle employee selection
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
          style={{ cursor: "pointer" }}
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        justifyContent: "center",
        padding: "1.25rem 1rem",
        fontFamily:
          "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
        }}
      >
        {/* Breadcrumb – role-aware */}
        <nav aria-label="breadcrumb" style={{ marginBottom: "2rem" }}>
          <ol
            style={{
              display: "flex",
              alignItems: "center",
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: "1rem",
            }}
          >
            <li>
              <Link
                to={baseDashboard}
                style={{
                  color: "#97247E",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E01950")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
              >
                <Home size={18} style={{ marginRight: "5px" }} />
                {baseLabel}
              </Link>
            </li>
            <li
              style={{ margin: "0 0.75rem", color: "#97247E", fontWeight: 400 }}
            >
              /
            </li>
            <li>
              <Link
                to={feedbackDashboard}
                style={{
                  color: "#97247E",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E01950")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
              >
                Feedback Management
              </Link>
            </li>
            <li
              style={{ margin: "0 0.75rem", color: "#97247E", fontWeight: 400 }}
            >
              /
            </li>
            <li>
              <span
                style={{
                  color: "#97247E",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Submit Feedback
              </span>
            </li>
          </ol>
        </nav>

        {/* Error */}
        {error && (
          <div
            className="alert alert-danger d-flex align-items-start gap-2 mb-3"
            style={{
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#fee2e2",
              padding: "0.75rem 1rem",
              fontFamily: "inherit",
            }}
          >
            <AlertTriangle
              size={16}
              className="flex-shrink-0"
              style={{ marginTop: "2px", color: "#dc2626" }}
            />
            <div className="flex-grow-1">
              <p
                className="mb-0"
                style={{
                  fontSize: "0.875rem",
                  color: "#991b1b",
                  fontFamily: "inherit",
                }}
              >
                {error}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div
            className="alert alert-success d-flex align-items-center gap-2 mb-3"
            style={{
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#dcfce7",
              padding: "0.75rem 1rem",
              fontFamily: "inherit",
            }}
          >
            <CheckCircle
              size={16}
              className="flex-shrink-0"
              style={{ color: "#16a34a" }}
            />
            <p
              className="mb-0 flex-grow-1"
              style={{
                fontSize: "0.875rem",
                color: "#166534",
                fontFamily: "inherit",
              }}
            >
              {successMsg}
            </p>
            <button
              type="button"
              className="btn-close"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setSuccessMsg("")}
            />
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            background: PRIMARY,
            borderRadius: "30px",
            padding: "4px",
            display: "inline-flex",
            gap: "4px",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(39, 35, 92, 0.15)",
            fontFamily: "inherit",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("goal")}
            style={{
              background: activeTab === "goal" ? "#fff" : "transparent",
              color: activeTab === "goal" ? PRIMARY : "#fff",
              border: "none",
              borderRadius: "26px",
              padding: "10px 24px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            <Target size={16} />
            Goal Feedback
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("context")}
            style={{
              background: activeTab === "context" ? "#fff" : "transparent",
              color: activeTab === "context" ? PRIMARY : "#fff",
              border: "none",
              borderRadius: "26px",
              padding: "10px 24px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            <Users size={16} />
            Context Feedback
          </button>
        </div>

        {/* Loading */}
        {loadingData && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
            <div
              className="card-body text-center py-5"
              style={{ fontFamily: "inherit" }}
            >
              <Loader
                size={40}
                className="mb-3 animate-spin"
                style={{ color: PRIMARY }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  marginBottom: 0,
                  fontFamily: "inherit",
                }}
              >
                Loading data...
              </p>
            </div>
          </div>
        )}

        {/* Goal feedback */}
        {!loadingData && activeTab === "goal" && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
            <div
              className="card-body"
              style={{ padding: "1.5rem", fontFamily: "inherit" }}
            >
              <form onSubmit={submitGoal}>
                {/* Goal dropdown */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Select Organization Goal <span className="text-danger">*</span>
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
                  <div
                    className="mb-4 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                        fontFamily: "inherit",
                      }}
                    >
                      Goal Description
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        marginBottom: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      {selectedObjective.description ||
                        selectedObjective.goalDescription ||
                        selectedObjective.objectiveDescription ||
                        "No description available"}
                    </p>
                  </div>
                )}

                {/* Rating */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Rating <span className="text-danger">*</span>
                  </label>
                  <div
                    className="d-flex align-items-center gap-3 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontFamily: "inherit",
                    }}
                  >
                    <div className="d-flex gap-1">
                      {renderStars(goalForm.rating)}
                    </div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: PRIMARY,
                        fontFamily: "inherit",
                      }}
                    >
                      {goalForm.rating}/5
                    </span>
                  </div>
                </div>

                {/* Comments */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Feedback Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
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
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      minHeight: "120px",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    className="d-flex justify-content-between"
                    style={{ marginTop: "0.5rem", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Be specific and constructive
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color:
                          goalForm.feedbackComments.length > 900
                            ? "#dc2626"
                            : "#64748b",
                      }}
                    >
                      {goalForm.feedbackComments.length}/1000
                    </span>
                  </div>
                </div>

                {/* Anonymous checkbox */}
                <div className="mb-4">
                  <div className="form-check" style={{ fontFamily: "inherit" }}>
                    <input
                      className="form-check-input"
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
                    <label
                      className="form-check-label left-label"
                      htmlFor="goalAnon"
                      style={{ fontSize: "0.875rem", fontFamily: "inherit" }}
                    >
                      Submit anonymously
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading || !goalForm.organizationObjectiveId}
                  style={{
                    background:
                      "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(151, 36, 126, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(151, 36, 126, 0.2)";
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
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

        {/* Context feedback */}
        {!loadingData && activeTab === "context" && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
            <div
              className="card-body"
              style={{ padding: "1.5rem", fontFamily: "inherit" }}
            >
              <form onSubmit={submitContext}>
                {/* Recipient dropdown */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Select Recipient <span className="text-danger">*</span>
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
                  <div
                    className="mb-4 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                        fontFamily: "inherit",
                      }}
                    >
                      Feedback for
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        fontFamily: "inherit",
                      }}
                    >
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <small
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontFamily: "inherit",
                      }}
                    >
                      {selectedEmployee.email}
                    </small>
                  </div>
                )}

                {/* Project context */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Project Context <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={contextForm.projectContext}
                    onChange={(e) =>
                      setContextForm((prev) => ({
                        ...prev,
                        projectContext: e.target.value,
                      }))
                    }
                    placeholder="e.g., AI Platform Project, Q4 Sprint"
                    required
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      padding: "0.625rem 0.875rem",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Feedback content */}
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2 left-label"
                    style={{
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  >
                    Feedback Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
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
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      resize: "vertical",
                      minHeight: "120px",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    className="d-flex justify-content-between"
                    style={{ marginTop: "0.5rem", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Be specific and constructive
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color:
                          contextForm.feedbackContent.length > 900
                            ? "#dc2626"
                            : "#64748b",
                      }}
                    >
                      {contextForm.feedbackContent.length}/1000
                    </span>
                  </div>
                </div>

                {/* Anonymous checkbox */}
                <div className="mb-4">
                  <div className="form-check" style={{ fontFamily: "inherit" }}>
                    <input
                      className="form-check-input"
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
                    <label
                      className="form-check-label left-label"
                      htmlFor="contextAnon"
                      style={{ fontSize: "0.875rem", fontFamily: "inherit" }}
                    >
                      Submit anonymously
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={
                    loading ||
                    !contextForm.recipientEmployeeId ||
                    !contextForm.projectContext
                  }
                  style={{
                    background:
                      "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(151, 36, 126, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(151, 36, 126, 0.2)";
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
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

      <style>{`
        /* Import Poppins font */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .form-control,
        .btn,
        .form-label,
        .form-check-label,
        .alert,
        .card,
        .ctx-dropdown-select,
        .ctx-dropdown-option {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }

        .form-control::placeholder {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }

        .form-control:focus {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.1);
        }

        /* Force all form labels on this page to be left aligned */
        .left-label,
        .card .form-label,
        .card .form-check-label {
          text-align: left !important;
          display: block;
          width: 100%;
        }

        /* Custom dropdown styles */
        .ctx-dropdown-wrapper {
          position: relative;
          width: 100%;
        }

        .ctx-dropdown-select {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .ctx-dropdown-select.open {
          border-color: ${PRIMARY};
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.1);
        }

        .ctx-dropdown-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ctx-dropdown-value {
          flex: 1;
          text-align: left;
          color: #111827;
          font-weight: 400;
        }

        .ctx-dropdown-arrow {
          color: #6b7280;
          margin-left: 0.5rem;
          font-size: 0.85rem;
        }

        .ctx-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid ${PRIMARY};
          border-top: none;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          max-height: 260px;
          overflow-y: auto;
          z-index: 1000;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ctx-dropdown-option {
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
          text-align: left;
        }

        .ctx-dropdown-option:last-child {
          border-bottom: none;
        }

        .ctx-dropdown-option:hover {
          background: ${PRIMARY};
          color: #ffffff;
          font-weight: 600;
        }

        .ctx-dropdown-option.selected {
          background: ${PRIMARY};
          color: #ffffff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
