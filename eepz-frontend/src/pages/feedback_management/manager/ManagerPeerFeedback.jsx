// src/pages/feedback_management/feedback/ViewMyPeerFeedback.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Users,
  User,
  Calendar,
  MessageCircle,
  Lock,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  peerQueueApi,
  employeeApi,
} from "../../../services/feedbackmanagement/feedbackApi";

export default function ManagerPeerFeedback() {
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {},
    []
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  // Safe date formatting
  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2000) return "—";
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Check if feedback is anonymous - handles multiple field name variations
  const checkIsAnonymous = (feedback) => {
    return Boolean(
      feedback.isAnonymous === true ||
        feedback.isAnonymous === 1 ||
        feedback.anonymous === true ||
        feedback.anonymous === 1 ||
        feedback.is_anonymous === true ||
        feedback.is_anonymous === 1 ||
        feedback.IsAnonymous === true ||
        feedback.IsAnonymous === 1
    );
  };

  // Get sender display name - always hide if anonymous
  const getSenderDisplayName = (feedback) => {
    const isAnon = checkIsAnonymous(feedback);

    if (isAnon) {
      return "Anonymous Peer";
    }

    return (
      feedback.submittedByName ||
      feedback.submitterName ||
      `Employee ${feedback.submittedByEmployeeId}`
    );
  };

  // Fetch peer feedback using services
  const fetchPeerFeedback = async () => {
    setLoading(true);
    setError("");

    try {
      const empId = user?.empId;

      if (!empId) {
        setError("Employee ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Fetching peer feedback for employee ID:", empId);

      // STEP 1: Fetch employee map for name resolution
      let empMap = {};
      try {
        const empRes = await employeeApi.getAll();
        
        if (empRes?.data) {
          const employees = Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data.data || [];

          employees.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
          console.log(
            "Loaded employee map:",
            Object.keys(empMap).length,
            "employees"
          );
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      // STEP 2: Fetch ALL peer feedback
      try {
        const peerRes = await peerQueueApi.list(1, 1000);
        console.log("Raw peer feedback response:", peerRes);

        const feedbackData = Array.isArray(peerRes?.data)
          ? peerRes.data
          : peerRes?.data?.data || [];

        if (Array.isArray(feedbackData)) {
          // Filter: Only feedback where current user is the RECIPIENT
          const myFeedback = feedbackData
            .filter((p) => {
              const isRecipient =
                Number(p.recipientEmployeeId) === Number(empId);
              const isApproved =
                p.status === "Approved" || p.Status === "Approved";

              console.log("Checking feedback:", {
                queueId: p.queueId || p.QueueId,
                recipientEmployeeId: p.recipientEmployeeId,
                currentUserEmpId: empId,
                isRecipient,
                status: p.status || p.Status,
                isApproved,
                isAnonymous: checkIsAnonymous(p),
              });

              return isRecipient && isApproved;
            })
            .map((p) => {
              const isAnon = checkIsAnonymous(p);

              return {
                ...p,
                isAnonymous: isAnon,
                submittedByName: isAnon
                  ? "Anonymous Peer"
                  : empMap[p.submittedByEmployeeId] ||
                    `Employee ${p.submittedByEmployeeId}`,
                recipientName:
                  empMap[p.recipientEmployeeId] ||
                  `Employee ${p.recipientEmployeeId}`,
                formattedDate: formatDate(
                  p.submittedDate || p.createdAt || p.CreatedAt
                ),
              };
            })
            .sort((a, b) => {
              const dateA = new Date(
                a.submittedDate || a.createdAt || a.CreatedAt
              );
              const dateB = new Date(
                b.submittedDate || b.createdAt || b.CreatedAt
              );
              return dateB - dateA;
            });

          setPeerFeedback(myFeedback);
          console.log(
            "Filtered peer feedback (received by me):",
            myFeedback.length
          );
          console.log("Sample feedback:", myFeedback[0]);
        } else {
          console.warn("Invalid peer feedback data structure");
          setPeerFeedback([]);
        }
      } catch (err) {
        console.error("Error fetching peer feedback:", err);
        setPeerFeedback([]);
        setError("Failed to load peer feedback. Please try refreshing.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err?.message || "Failed to load peer feedback");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (user?.empId) {
      fetchPeerFeedback();
    }
  }, [user?.empId]);

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <Loader
            size={40}
            className="text-primary mb-3"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="text-muted">Loading peer feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex justify-content-center py-4"
      style={{ minHeight: "100vh", background: "#f9f9f9" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-start mb-4">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(-1)}
            style={{ borderRadius: "8px" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-grow-1">
            <h2 className="fw-bold mb-1" style={{ color: "#0F62FE" }}>
              Peer Feedback Received
            </h2>
            <p className="mb-0 small text-muted">
              Feedback from your peers - anonymity is always respected
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={fetchPeerFeedback}
            disabled={loading}
            title="Refresh"
            style={{ borderRadius: "8px" }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show mb-4"
            role="alert"
          >
            <AlertTriangle
              size={18}
              className="me-2"
              style={{ display: "inline" }}
            />
            <strong>Error:</strong> {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {/* Stats Card */}
        {peerFeedback.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "8px" }}
              >
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-2">
                    <div
                      className="rounded p-2"
                      style={{ background: "#0F62FE15" }}
                    >
                      <Users size={24} style={{ color: "#0F62FE" }} />
                    </div>
                  </div>
                  <h3 className="fw-bold" style={{ color: "#0F62FE" }}>
                    {peerFeedback.length}
                  </h3>
                  <p className="mb-0 small text-muted">
                    Total Peer Feedback Received
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peer Feedback List */}
        {peerFeedback.length === 0 ? (
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "8px" }}
          >
            <div className="card-body text-center py-5">
              <Users size={48} className="mb-3" style={{ color: "#ccc" }} />
              <h5 className="text-muted mb-2">No peer feedback yet</h5>
              <p className="small text-muted mb-0">
                Check back later for feedback from your peers
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {peerFeedback.map((feedback) => {
              const isAnon = checkIsAnonymous(feedback);

              return (
                <div
                  className="col-12"
                  key={
                    feedback.queueId || feedback.QueueId || feedback.peerQueueId
                  }
                >
                  <div
                    className="card border-0 shadow-sm"
                    style={{
                      borderRadius: "8px",
                      borderLeft: isAnon
                        ? "4px solid #E01950"
                        : "4px solid #0F62FE",
                    }}
                  >
                    <div className="card-body">
                      {/* Header - Sender Info & Date */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            {isAnon ? (
                              <Lock size={16} style={{ color: "#E01950" }} />
                            ) : (
                              <User size={16} style={{ color: "#0F62FE" }} />
                            )}
                            <h6
                              className="fw-bold mb-0"
                              style={{
                                color: isAnon ? "#E01950" : "#0F62FE",
                              }}
                            >
                              {getSenderDisplayName(feedback)}
                            </h6>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Calendar size={14} className="text-muted" />
                            <small className="text-muted">
                              {feedback.formattedDate}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          {isAnon && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "#E0195020",
                                color: "#E01950",
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                              }}
                            >
                              <Lock
                                size={12}
                                className="me-1"
                                style={{ display: "inline" }}
                              />
                              Anonymous
                            </span>
                          )}
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "#0F62FE20",
                              color: "#0F62FE",
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                            }}
                          >
                            Peer
                          </span>
                        </div>
                      </div>

                      {/* Feedback Content */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <MessageCircle
                            size={16}
                            style={{ color: "#0F62FE" }}
                          />
                          <h6 className="small fw-bold text-muted mb-0">
                            Feedback
                          </h6>
                        </div>
                        <p
                          className="mb-0 ps-4"
                          style={{ lineHeight: "1.6", color: "#333" }}
                        >
                          {feedback.feedbackContent ||
                            feedback.comment ||
                            feedback.feedbackComment ||
                            "No comment provided"}
                        </p>
                      </div>

                      {/* Context if available */}
                      {(feedback.context || feedback.feedbackContext) && (
                        <div className="p-3 rounded bg-light">
                          <h6 className="small fw-bold text-muted mb-2">
                            Context
                          </h6>
                          <p className="small mb-0">
                            {feedback.context || feedback.feedbackContext}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
