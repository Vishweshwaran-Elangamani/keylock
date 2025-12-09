// src/pages/feedback_management/feedback/SubmitContextFeedback.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Send,
  AlertTriangle,
  Target,
  Users,
  Loader,
  ArrowLeft,
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

export default function SubmitContextFeedback() {
  const navigate = useNavigate();
  
  // Get logged-in user from localStorage
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
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

  // Fetch goals and employees on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setError("");

        // Fetch organization-level goals
        try {
          const goalsResponse = await goalsApi.getOrganizationLevel();
          
          let goalsList = [];
          
          // Handle different response structures
          if (Array.isArray(goalsResponse.data)) {
            goalsList = goalsResponse.data;
          } else if (goalsResponse.data?.data && Array.isArray(goalsResponse.data.data)) {
            goalsList = goalsResponse.data.data;
          } else if (goalsResponse.data?.$values && Array.isArray(goalsResponse.data.$values)) {
            goalsList = goalsResponse.data.$values;
          }
          
          setObjectives(goalsList);
        } catch (goalsError) {
          console.error("Failed to fetch goals:", goalsError);
          setObjectives([]);
        }

        // Fetch employees
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
  const handleObjectiveChange = (e) => {
    const selectedId = Number(e.target.value);
    
    const selectedObjective = objectives.find(
      (obj) => {
        const objId = obj.goalId || obj.objectiveId || obj.id;
        return objId === selectedId;
      }
    );
    
    setGoalForm({
      ...goalForm,
      organizationObjectiveId: selectedId,
      objectiveTitle: selectedObjective?.goalName || 
                     selectedObjective?.title || 
                     selectedObjective?.name || 
                     selectedObjective?.goalTitle || "",
    });
  };

  // Submit goal feedback
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
         organizationObjectiveId: Number(goalForm.organizationObjectiveId),
  submittedByEmployeeId: Number(user?.empId),
  managerEmployeeId: null,
  rating: Number(goalForm.rating || 0),
  feedbackComments: goalForm.feedbackComments,
  feedbackFrom: "Employee",
  isAnonymous: !!goalForm.isAnonymous,
  feedbackType: "OrganizationalGoal" // or whatever valid value your DB expects
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
  const handleEmployeeChange = (e) => {
    const selectedId = Number(e.target.value);
    const selectedEmployee = employees.find(
      (emp) => emp.employeeId === selectedId
    );
    setContextForm({
      ...contextForm,
      recipientEmployeeId: selectedId,
      recipientName: selectedEmployee
        ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
        : "",
    });
  };

  // Submit context feedback
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
        const queueId = createResponse.data?.data?.queueId || 
                       createResponse.data?.queueId;

        if (!queueId) {
          throw new Error("Queue ID not returned from server");
        }

        // Attempt auto-approval
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

  // Get selected goal/employee for display
  const selectedObjective = objectives.find(
    (obj) => {
      const objId = obj.goalId || obj.objectiveId || obj.id;
      return objId == goalForm.organizationObjectiveId;
    }
  );
  
  const selectedEmployee = employees.find(
    (emp) => emp.employeeId == contextForm.recipientEmployeeId
  );

  // Render star rating
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

  // Helper function to get goal display name
  const getGoalDisplayName = (goal) => {
    return goal.goalName || 
           goal.title || 
           goal.name || 
           goal.goalTitle || 
           goal.objectiveName ||
           `Untitled Goal`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        justifyContent: "center",
        padding: "1.25rem 1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
        }}
      >
        {/* Breadcrumb Navigation */}
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
                to="/employee/dashboard"
                style={{
                  color: "#97247E",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E01950")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
              >
                <Home size={18} style={{ marginRight: "5px" }} />
                Dashboard
              </Link>
            </li>
            <li style={{ margin: "0 0.75rem", color: "#97247E", fontWeight: 400 }}>/</li>
            <li>
              <Link
                to="/employee/dashboard/feedback"
                style={{
                  color: "#97247E",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E01950")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#97247E")}
              >
                Feedback Management
              </Link>
            </li>
            <li style={{ margin: "0 0.75rem", color: "#97247E", fontWeight: 400 }}>/</li>
            <li>
              <Link
                to="/employee/dashboard/feedback/contextfeedback"
                style={{
                  color: "#97247E",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Submit Feedback
              </Link>
            </li>
          </ol>
        </nav>

        {/* Error alert */}
        {error && (
          <div
            className="alert alert-danger d-flex align-items-start gap-2 mb-3"
            style={{
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#fee2e2",
              padding: "0.75rem 1rem",
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
                style={{ fontSize: "0.875rem", color: "#991b1b" }}
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

        {/* Success alert */}
        {successMsg && (
          <div
            className="alert alert-success d-flex align-items-center gap-2 mb-3"
            style={{
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#dcfce7",
              padding: "0.75rem 1rem",
            }}
          >
            <CheckCircle
              size={16}
              className="flex-shrink-0"
              style={{ color: "#16a34a" }}
            />
            <p
              className="mb-0 flex-grow-1"
              style={{ fontSize: "0.875rem", color: "#166534" }}
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

        {/* Tab selector - NEW DESIGN */}
        <div
          style={{
            background: "#27235C",
            borderRadius: "30px",
            padding: "4px",
            display: "inline-flex",
            gap: "4px",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(39, 35, 92, 0.15)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("goal")}
            style={{
              background: activeTab === "goal" ? "#fff" : "transparent",
              color: activeTab === "goal" ? "#27235C" : "#fff",
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
              color: activeTab === "context" ? "#27235C" : "#fff",
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
            }}
          >
            <Users size={16} />
            Context Feedback
          </button>
        </div>

        {/* Loading state */}
        {loadingData && (
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body text-center py-5">
              <Loader
                size={40}
                className="mb-3 animate-spin"
                style={{ color: "#27235C" }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                  marginBottom: 0,
                }}
              >
                Loading data...
              </p>
            </div>
          </div>
        )}

        {/* Goal feedback form */}
        {!loadingData && activeTab === "goal" && (
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body" style={{ padding: "1.5rem" }}>
              <form onSubmit={submitGoal}>
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Select Organization Goal <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={goalForm.organizationObjectiveId}
                    onChange={handleObjectiveChange}
                    required
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      padding: "0.625rem 0.875rem",
                    }}
                  >
                    <option value="">Choose a goal...</option>
                    {objectives.map((obj) => {
                      const objId = obj.goalId || obj.objectiveId || obj.id;
                      const objName = getGoalDisplayName(obj);
                      return (
                        <option key={objId} value={objId}>
                          {objName}
                        </option>
                      );
                    })}
                  </select>
                  {objectives.length === 0 && (
                    <small className="text-muted d-block mt-1">
                      No organization goals available
                    </small>
                  )}
                </div>

                {selectedObjective && (
                  <div
                    className="mb-4 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Goal Description
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        marginBottom: 0,
                      }}
                    >
                      {selectedObjective.description || 
                       selectedObjective.goalDescription || 
                       selectedObjective.objectiveDescription ||
                       "No description available"}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Rating <span className="text-danger">*</span>
                  </label>
                  <div
                    className="d-flex align-items-center gap-3 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="d-flex gap-1">{renderStars(goalForm.rating)}</div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#27235C",
                      }}
                    >
                      {goalForm.rating}/5
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Feedback Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={goalForm.feedbackComments}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        feedbackComments: e.target.value,
                      })
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
                    }}
                  />
                  <div
                    className="d-flex justify-content-between"
                    style={{ marginTop: "0.5rem" }}
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

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="goalAnon"
                      checked={goalForm.isAnonymous}
                      onChange={(e) =>
                        setGoalForm({
                          ...goalForm,
                          isAnonymous: e.target.checked,
                        })
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="goalAnon"
                      style={{ fontSize: "0.875rem" }}
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
                    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
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

        {/* Context feedback form */}
        {!loadingData && activeTab === "context" && (
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "10px" }}
          >
            <div className="card-body" style={{ padding: "1.5rem" }}>
              <form onSubmit={submitContext}>
                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Select Recipient <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={contextForm.recipientEmployeeId}
                    onChange={handleEmployeeChange}
                    required
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      padding: "0.625rem 0.875rem",
                    }}
                  >
                    <option value="">Choose a team member...</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEmployee && (
                  <div
                    className="mb-4 p-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Feedback for
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <small style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {selectedEmployee.email}
                    </small>
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Project Context <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={contextForm.projectContext}
                    onChange={(e) =>
                      setContextForm({
                        ...contextForm,
                        projectContext: e.target.value,
                      })
                    }
                    placeholder="e.g., AI Platform Project, Q4 Sprint"
                    required
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                      padding: "0.625rem 0.875rem",
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label fw-semibold mb-2"
                    style={{ fontSize: "0.875rem", color: "#0f172a" }}
                  >
                    Feedback Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={contextForm.feedbackContent}
                    onChange={(e) =>
                      setContextForm({
                        ...contextForm,
                        feedbackContent: e.target.value,
                      })
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
                    }}
                  />
                  <div
                    className="d-flex justify-content-between"
                    style={{ marginTop: "0.5rem" }}
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

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="contextAnon"
                      checked={contextForm.isAnonymous}
                      onChange={(e) =>
                        setContextForm({
                          ...contextForm,
                          isAnonymous: e.target.checked,
                        })
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="contextAnon"
                      style={{ fontSize: "0.875rem" }}
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
                    background: "linear-gradient(90deg, #97247E 0%, #E01950 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(151, 36, 126, 0.2)",
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
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .form-control:focus, .form-select:focus {
          border-color: #27235C;
          box-shadow: 0 0 0 3px rgba(39, 35, 92, 0.1);
        }

        .form-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>') no-repeat right 1rem center;
  background-color: #fff;
  padding-right: 2.5rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.938rem;
  cursor: pointer;
}
      `}</style>
    </div>
  );
}
