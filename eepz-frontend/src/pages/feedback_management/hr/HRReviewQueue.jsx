import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Users,
  User,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ViewMyPeerFeedback() {
  const navigate = useNavigate();
  const [user] = useState(
    () => JSON.parse(localStorage.getItem("user") || "{}") || {}
  );

  const [peerFeedback, setPeerFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [employeeMap, setEmployeeMap] = useState({});

  // ============================================================================
  // FETCH PEER FEEDBACK
  // ============================================================================

  const fetchPeerFeedback = async () => {
    setLoading(true);
    setRefreshing(false);
    setError("");

    try {
      const empId = user?.empId;
      if (!empId) {
        setError("Employee ID not found");
        setLoading(false);
        return;
      }

      // STEP 1: Fetch employee map
      let empMap = {};
      try {
        const empRes = await axios.get(`${API_BASE}/EmployeeManagement/all`);
        if (empRes.data?.success && Array.isArray(empRes.data.data)) {
          empRes.data.data.forEach((emp) => {
            empMap[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
          });
          setEmployeeMap(empMap);
        }
      } catch (err) {
        console.warn("Error fetching employee map:", err.message);
      }

      // STEP 2: Fetch all peer feedback and filter for feedback about me (NO STATUS FILTER)
      try {
        const peerRes = await axios.get(`${API_BASE}/PeerFeedbackQueue/all`);
        if (peerRes.data?.success && Array.isArray(peerRes.data.data)) {
          // Filter to only feedback where I'm the recipient (REGARDLESS OF STATUS)
          const myFeedback = peerRes.data.data
            .filter((p) => p.recipientEmployeeId === empId)
            .map((p) => ({
              ...p,
              submittedByName:
                empMap[p.submittedByEmployeeId] ||
                `Employee ${p.submittedByEmployeeId}`,
            }))
            .sort(
              (a, b) => new Date(b.submittedDate) - new Date(a.submittedDate)
            );

          setPeerFeedback(myFeedback);
          console.log("Peer feedback loaded:", myFeedback.length);
        }
      } catch (err) {
        console.warn("Error fetching peer feedback:", err.message);
        setPeerFeedback([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load peer feedback"
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeerFeedback();
  }, [user?.empId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPeerFeedback();
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2
                className="fw-bold mb-1"
                style={{ color: "var(--color-primary-1)" }}
              >
                Peer Feedback
              </h2>
              <p className="mb-0 small text-muted">
                Feedback you have received from peers
              </p>
            </div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div
            className="alert alert-danger d-flex align-items-start gap-2 mb-3"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <AlertTriangle size={18} className="mt-1 flex-shrink-0" />
            <div className="flex-grow-1">
              <strong>Error</strong>
              <p className="mb-0 small mt-1">{error}</p>
            </div>
            <button className="btn-close" onClick={() => setError("")} />
          </div>
        )}

        {/* STATS */}
        {peerFeedback.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card border-0"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded p-2"
                      style={{ background: "#0F62FE15" }}
                    >
                      <Users size={20} style={{ color: "#0F62FE" }} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0" style={{ color: "#0F62FE" }}>
                        {peerFeedback.length}
                      </h5>
                      <small className="text-muted">
                        Peer Feedback Received
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PEER FEEDBACK LIST */}
        {peerFeedback.length === 0 ? (
          <div
            className="card border-0"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div className="card-body text-center py-5">
              <Users
                size={48}
                className="mb-3"
                style={{ color: "var(--muted)" }}
              />
              <h5 className="text-muted mb-2">No peer feedback received</h5>
              <p className="small text-muted mb-0">
                Check back later for feedback from your peers
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {peerFeedback.map((feedback) => (
              <div className="col-12" key={feedback.queueId}>
                <div
                  className="card border-0"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div className="card-body">
                    {/* Header - Peer Info, Date & Status */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <User
                            size={16}
                            style={{ color: "var(--color-primary-1)" }}
                          />
                          <h6 className="fw-bold mb-0">
                            {feedback.submittedByName}
                          </h6>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={14} className="text-muted" />
                          <small className="text-muted">
                            {feedback.submittedDate
                              ? new Date(
                                  feedback.submittedDate
                                ).toLocaleDateString()
                              : new Date(
                                  feedback.createdAt
                                ).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              feedback.status === "Approved"
                                ? "#24A14820"
                                : "#0F62FE20",
                            color:
                              feedback.status === "Approved"
                                ? "#24A148"
                                : "#0F62FE",
                            padding: "6px 12px",
                          }}
                        >
                          {feedback.status || "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Feedback Comment */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <MessageCircle
                          size={16}
                          style={{ color: "var(--color-primary-1)" }}
                        />
                        <h6 className="small fw-bold text-muted mb-0">
                          Feedback
                        </h6>
                      </div>
                      <p
                        className="mb-0"
                        style={{
                          lineHeight: "1.6",
                          color: "#333",
                          marginLeft: "2rem",
                        }}
                      >
                        {feedback.comment ||
                          feedback.feedbackComment ||
                          "No comment provided"}
                      </p>
                    </div>

                    {/* Context if available */}
                    {(feedback.context || feedback.feedbackContext) && (
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: "#f9f9f9",
                          borderLeft: "3px solid var(--color-primary-1)",
                        }}
                      >
                        <h6 className="small fw-bold text-muted mb-1">
                          Context
                        </h6>
                        <p className="small mb-0" style={{ color: "#555" }}>
                          {feedback.context || feedback.feedbackContext}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
